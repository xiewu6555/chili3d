// Part of the Chili3d Project, under the AGPL-3.0 License.
// See LICENSE file in the project root for full license information.

import { IDocument } from "chili-core";
import { AnnotationManager } from "../annotationManager";
import { MachiningFeatureType, FEATURE_NAMES_EN, FEATURE_NAMES_CN } from "../featureTypes";
import { AnnotationNode } from "../annotationNode";
import { SelectFacesCommand } from "../commands/selectFacesCommand";

/**
 * 标注面板 - 主要的标注界面
 */
export class AnnotationPanel {
    private _manager: AnnotationManager;
    private _document: IDocument;
    private _element: HTMLDivElement;
    private _featureTypeSelect: HTMLSelectElement | undefined;
    private _activeAnnotationInfo: HTMLDivElement | undefined;
    private _selectedFacesInfo: HTMLDivElement | undefined;
    private _annotationsList: HTMLDivElement | undefined;

    constructor(manager: AnnotationManager, document: IDocument) {
        this._manager = manager;
        this._document = document;
        this._element = this.createPanelElement();

        // 监听管理器事件
        this.setupEventListeners();
    }

    get element(): HTMLElement {
        return this._element;
    }

    private createPanelElement(): HTMLDivElement {
        const panel = globalThis.document.createElement("div");
        panel.className = "annotation-panel";
        panel.style.cssText = `
            width: 300px;
            height: 100%;
            padding: 16px;
            background-color: #f5f5f5;
            border-left: 1px solid #ddd;
            display: flex;
            flex-direction: column;
            gap: 16px;
            font-family: Arial, sans-serif;
        `;

        // 创建各个部分
        panel.appendChild(this.createHeader());
        panel.appendChild(this.createFeatureTypeSection());
        panel.appendChild(this.createActiveAnnotationSection());
        panel.appendChild(this.createActionButtons());
        panel.appendChild(this.createAnnotationsListSection());
        panel.appendChild(this.createExportSection());

        return panel;
    }

    private createHeader(): HTMLElement {
        const header = globalThis.globalThis.document.createElement("div");
        header.style.cssText = `
            border-bottom: 1px solid #ddd;
            padding-bottom: 12px;
        `;

        const title = globalThis.globalThis.document.createElement("span");
        title.textContent = "BREP Model Annotation";
        title.style.cssText = `
            font-size: 18px;
            font-weight: bold;
            color: #333;
            display: block;
        `;

        const subtitle = globalThis.globalThis.document.createElement("div");
        subtitle.textContent = "Machining Feature Annotation";
        subtitle.style.cssText = `
            font-size: 12px;
            color: #666;
            margin-top: 4px;
        `;

        header.appendChild(title);
        header.appendChild(subtitle);
        return header;
    }

    private createFeatureTypeSection(): HTMLElement {
        const section = globalThis.globalThis.document.createElement("div");
        section.style.cssText = `
            border-bottom: 1px solid #eee;
            padding-bottom: 12px;
        `;

        const label = globalThis.document.createElement("label");
        label.textContent = "Feature Type:";
        label.style.cssText = `
            font-weight: bold;
            margin-bottom: 8px;
            display: block;
        `;

        // 创建特征类型选择器
        this._featureTypeSelect = globalThis.document.createElement("select");
        this._featureTypeSelect.style.cssText = `
            width: 100%;
            padding: 6px;
            border-radius: 4px;
            border: 1px solid #ccc;
        `;
        this._featureTypeSelect.onchange = () => this.onFeatureTypeChange();

        // 填充特征类型选项
        this.populateFeatureTypes();

        section.appendChild(label);
        section.appendChild(this._featureTypeSelect);

        return section;
    }

    private populateFeatureTypes(): void {
        if (!this._featureTypeSelect) return;

        // 添加默认选项
        const defaultOption = globalThis.document.createElement("option");
        defaultOption.value = "";
        defaultOption.textContent = "Select feature type...";
        this._featureTypeSelect.appendChild(defaultOption);

        // 添加所有特征类型
        Object.entries(MachiningFeatureType)
            .filter(([key, value]) => typeof value === "number")
            .forEach(([key, value]) => {
                const option = globalThis.document.createElement("option");
                option.value = value.toString();

                const nameEN = FEATURE_NAMES_EN[value as MachiningFeatureType];
                const nameCN = FEATURE_NAMES_CN[value as MachiningFeatureType];
                option.textContent = `${nameEN} (${nameCN})`;

                this._featureTypeSelect!.appendChild(option);
            });
    }

    private createActiveAnnotationSection(): HTMLElement {
        const section = globalThis.document.createElement("div");
        section.style.cssText = `
            border-bottom: 1px solid #eee;
            padding-bottom: 12px;
        `;

        const label = globalThis.document.createElement("label");
        label.textContent = "Active Annotation:";
        label.style.cssText = `
            font-weight: bold;
            margin-bottom: 8px;
            display: block;
        `;

        // 活动标注信息
        this._activeAnnotationInfo = globalThis.document.createElement("div");
        this._activeAnnotationInfo.style.cssText = `
            background-color: #fff;
            padding: 8px;
            border-radius: 4px;
            border: 1px solid #ddd;
            min-height: 60px;
        `;

        // 选中面信息
        this._selectedFacesInfo = globalThis.document.createElement("div");
        this._selectedFacesInfo.style.cssText = `
            background-color: #f9f9f9;
            padding: 8px;
            border-radius: 4px;
            border: 1px solid #ddd;
            margin-top: 8px;
            min-height: 40px;
        `;

        section.appendChild(label);
        section.appendChild(this._activeAnnotationInfo);
        section.appendChild(this._selectedFacesInfo);

        this.updateActiveAnnotationDisplay();
        return section;
    }

    private createActionButtons(): HTMLElement {
        const section = globalThis.document.createElement("div");
        section.style.cssText = `
            border-bottom: 1px solid #eee;
            padding-bottom: 12px;
        `;

        const buttons = [
            {
                text: "Create New Annotation",
                color: "#007acc",
                action: async () => await this.onCreateNewAnnotation(),
            },
            { text: "Select Faces", color: "#6f42c1", action: async () => await this.onSelectFaces() },
            { text: "Add Selected Faces", color: "#28a745", action: () => this.onAddSelectedFaces() },
            {
                text: "Confirm Annotation",
                color: "#ffc107",
                textColor: "black",
                action: () => this.onConfirmAnnotation(),
            },
            { text: "Delete Active", color: "#dc3545", action: () => this.onDeleteAnnotation() },
        ];

        buttons.forEach((btn) => {
            const button = globalThis.document.createElement("button");
            button.textContent = btn.text;
            button.style.cssText = `
                width: 100%;
                padding: 8px;
                margin-bottom: 8px;
                background-color: ${btn.color};
                color: ${btn.textColor || "white"};
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 14px;
            `;
            button.onclick = btn.action;
            section.appendChild(button);
        });

        return section;
    }

    private createAnnotationsListSection(): HTMLElement {
        const section = globalThis.document.createElement("div");
        section.style.cssText = `
            flex: 1;
            display: flex;
            flex-direction: column;
        `;

        const label = globalThis.document.createElement("label");
        label.textContent = "Annotations:";
        label.style.cssText = `
            font-weight: bold;
            margin-bottom: 8px;
            display: block;
        `;

        this._annotationsList = globalThis.document.createElement("div");
        this._annotationsList.style.cssText = `
            flex: 1;
            overflow-y: auto;
            background-color: #fff;
            border: 1px solid #ddd;
            border-radius: 4px;
            padding: 8px;
        `;

        section.appendChild(label);
        section.appendChild(this._annotationsList);

        this.updateAnnotationsList();
        return section;
    }

    private createExportSection(): HTMLElement {
        const section = globalThis.document.createElement("div");
        section.style.cssText = `
            border-top: 1px solid #eee;
            padding-top: 12px;
            display: flex;
            gap: 2%;
        `;

        const exportButtons = [
            { text: "Export AAGNet", format: "aagnet" as const, color: "#6f42c1" },
            { text: "Export MFTRCAD", format: "mftrcad" as const, color: "#17a2b8" },
        ];

        exportButtons.forEach((btn) => {
            const button = globalThis.document.createElement("button");
            button.textContent = btn.text;
            button.style.cssText = `
                width: 49%;
                padding: 6px;
                background-color: ${btn.color};
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 12px;
            `;
            button.onclick = () => this.onExport(btn.format);
            section.appendChild(button);
        });

        return section;
    }

    private setupEventListeners(): void {
        // 这里可以设置事件监听器，暂时留空
        // 实际项目中需要监听AnnotationManager的事件
    }

    private onFeatureTypeChange(): void {
        if (!this._featureTypeSelect) return;

        const selectedValue = this._featureTypeSelect.value;
        if (selectedValue) {
            const featureType = parseInt(selectedValue) as MachiningFeatureType;
            // 保存选中的特征类型
            (this._manager as any)._selectedFeatureType = featureType;
        }
    }

    private async onCreateNewAnnotation(): Promise<void> {
        if (!this._featureTypeSelect || !this._featureTypeSelect.value) {
            alert("Please select a feature type first.");
            return;
        }

        const featureType = parseInt(this._featureTypeSelect.value) as MachiningFeatureType;
        const nameEN = FEATURE_NAMES_EN[featureType];
        const annotationName = `${nameEN}_${Date.now()}`;

        try {
            const annotation = this._manager.createAnnotation(featureType, annotationName);
            console.log(`Created annotation: ${annotation.name}`);
            this.updateAnnotationsList();
            this.updateActiveAnnotationDisplay();

            // 自动进入面选择模式
            alert("标注已创建。现在进入面选择模式，请点击要标注的面。");
            await this.onSelectFaces();
        } catch (error) {
            alert(`Failed to create annotation: ${error}`);
        }
    }

    private async onSelectFaces(): Promise<void> {
        try {
            // 获取应用实例 - 从document中获取
            const application = this._document.application;
            if (!application) {
                alert("应用实例未找到");
                return;
            }

            // 创建并执行选择面命令
            const selectFacesCommand = new SelectFacesCommand();
            await selectFacesCommand.execute(application);
        } catch (error) {
            console.error("Face selection failed:", error);
            alert(`Face selection failed: ${error}`);
        }
    }

    private onAddSelectedFaces(): void {
        try {
            // 这里需要实现添加选中面的逻辑
            // 暂时使用模拟数据
            const selectedFaces = (this._manager as any)._selectedFaces || [];
            if (selectedFaces.length === 0) {
                alert("No faces selected");
                return;
            }

            const activeAnnotation = this._manager.activeAnnotation;
            if (!activeAnnotation) {
                alert("No active annotation");
                return;
            }

            activeAnnotation.addFaces(selectedFaces);
            this.updateActiveAnnotationDisplay();
        } catch (error) {
            alert(`Failed to add selected faces: ${error}`);
        }
    }

    private onConfirmAnnotation(): void {
        const activeAnnotation = this._manager.activeAnnotation;
        if (!activeAnnotation) {
            alert("No active annotation to confirm.");
            return;
        }

        try {
            // 验证标注
            const validationResult = activeAnnotation.validate();
            if (!validationResult.isValid) {
                const errorMessage = validationResult.errors.join("\n");
                alert(`Annotation validation failed:\n${errorMessage}`);
                return;
            }

            console.log(`Confirmed annotation: ${activeAnnotation.name}`);
            alert("Annotation confirmed successfully.");
        } catch (error) {
            alert(`Failed to confirm annotation: ${error}`);
        }
    }

    private onDeleteAnnotation(): void {
        const activeAnnotation = this._manager.activeAnnotation;
        if (!activeAnnotation) {
            alert("No active annotation selected.");
            return;
        }

        if (confirm(`Delete annotation "${activeAnnotation.name}"?`)) {
            try {
                (this._manager as any).deleteAnnotation?.(activeAnnotation.id);
                this.updateAnnotationsList();
                this.updateActiveAnnotationDisplay();
            } catch (error) {
                alert(`Failed to delete annotation: ${error}`);
            }
        }
    }

    private onExport(format: "aagnet" | "mftrcad"): void {
        try {
            const annotations = (this._manager as any).annotations || [];
            if (annotations.length === 0) {
                alert("No annotations to export");
                return;
            }

            // 简化的导出
            const exportData = {
                format,
                annotations: annotations.map((ann: any) => ({
                    id: ann.id,
                    name: ann.name,
                    type: ann.type,
                    faces: ann.faces,
                })),
                timestamp: new Date().toISOString(),
            };

            // 创建下载
            const jsonString = JSON.stringify(exportData, null, 2);
            const blob = new Blob([jsonString], { type: "application/json" });
            const url = URL.createObjectURL(blob);

            const a = globalThis.document.createElement("a");
            a.href = url;
            a.download = `annotations_${format}_${Date.now()}.json`;
            globalThis.document.body.appendChild(a);
            a.click();
            globalThis.document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error) {
            alert(`Export failed: ${error}`);
        }
    }

    private updateActiveAnnotationDisplay(): void {
        if (!this._activeAnnotationInfo) return;

        const activeAnnotation = this._manager.activeAnnotation;

        if (!activeAnnotation) {
            this._activeAnnotationInfo.innerHTML = `
                <div style="color: #666; font-style: italic;">
                    No active annotation
                </div>
            `;
            return;
        }

        const nameEN = FEATURE_NAMES_EN[activeAnnotation.featureType];
        const nameCN = FEATURE_NAMES_CN[activeAnnotation.featureType];
        this._activeAnnotationInfo.innerHTML = `
            <div style="margin-bottom: 4px;">
                <strong>${activeAnnotation.name}</strong>
            </div>
            <div style="font-size: 12px; color: #666; margin-bottom: 4px;">
                Type: ${nameEN} (${nameCN})
            </div>
            <div style="font-size: 12px; color: #666;">
                Faces: ${activeAnnotation.faces.length}
            </div>
        `;
    }

    private updateAnnotationsList(): void {
        if (!this._annotationsList) return;

        const annotations = (this._manager as any).annotations || [];

        if (annotations.length === 0) {
            this._annotationsList.innerHTML = `
                <div style="color: #666; font-style: italic; text-align: center; padding: 20px;">
                    No annotations created yet
                </div>
            `;
            return;
        }

        this._annotationsList.innerHTML = "";

        annotations.forEach((annotation: any) => {
            const nameEN = FEATURE_NAMES_EN[annotation.featureType as MachiningFeatureType];
            const isActive = this._manager.activeAnnotation?.id === annotation.id;

            const item = globalThis.document.createElement("div");
            item.style.cssText = `
                padding: 8px;
                margin-bottom: 4px;
                background-color: ${isActive ? "#e3f2fd" : "#fff"};
                border: ${isActive ? "2px solid #2196f3" : "1px solid #eee"};
                border-radius: 4px;
                cursor: pointer;
            `;
            item.onclick = () => {
                (this._manager as any).activeAnnotation = annotation;
                this.updateActiveAnnotationDisplay();
                this.updateAnnotationsList();
            };

            item.innerHTML = `
                <div style="font-weight: bold; margin-bottom: 2px;">${annotation.name}</div>
                <div style="font-size: 12px; color: #666; margin-bottom: 2px;">
                    ${nameEN}
                </div>
                <div style="font-size: 12px; color: #999;">
                    ${annotation.faces.length} faces
                </div>
            `;

            this._annotationsList!.appendChild(item);
        });
    }

    /**
     * 销毁面板
     */
    dispose(): void {
        if (this._element.parentNode) {
            this._element.parentNode.removeChild(this._element);
        }
    }
}
