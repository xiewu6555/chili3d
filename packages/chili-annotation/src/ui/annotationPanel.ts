// Part of the Chili3d Project, under the AGPL-3.0 License.
// See LICENSE file in the project root for full license information.

import { IDocument, PubSub } from "chili-core";
import { AnnotationManager } from "../annotationManager";
import {
    MachiningFeatureType,
    FEATURE_NAMES_EN,
    FEATURE_NAMES_CN,
    FeatureCategory,
    CATEGORY_NAMES_CN,
    FEATURE_CATEGORIES,
    getFeaturesByCategory,
} from "../featureTypes";
import { ExportService } from "../exporters/exportService";
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
    private _exportService: ExportService;
    private _commandExecuteHandler?: (commandName: string) => void;

    constructor(manager: AnnotationManager, document: IDocument) {
        this._manager = manager;
        this._document = document;
        this._exportService = new ExportService();
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
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
        `;

        // 左侧标题区域
        const titleArea = globalThis.globalThis.document.createElement("div");
        titleArea.style.cssText = `
            flex: 1;
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

        titleArea.appendChild(title);
        titleArea.appendChild(subtitle);

        // 右侧关闭按钮
        const closeButton = globalThis.globalThis.document.createElement("button");
        closeButton.innerHTML = "×";
        closeButton.title = "关闭标注面板";
        closeButton.style.cssText = `
            background: none;
            border: none;
            font-size: 20px;
            font-weight: bold;
            color: #999;
            cursor: pointer;
            padding: 0;
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 4px;
            transition: all 0.2s ease;
        `;

        // 关闭按钮悬停效果
        closeButton.addEventListener("mouseenter", () => {
            closeButton.style.backgroundColor = "#f5f5f5";
            closeButton.style.color = "#333";
        });

        closeButton.addEventListener("mouseleave", () => {
            closeButton.style.backgroundColor = "transparent";
            closeButton.style.color = "#999";
        });

        // 关闭按钮点击事件
        closeButton.addEventListener("click", () => {
            this.closePanel();
        });

        header.appendChild(titleArea);
        header.appendChild(closeButton);
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

        // 按分类添加特征类型
        const categories = Object.values(FeatureCategory);

        categories.forEach((category) => {
            // 创建选项组
            const optgroup = globalThis.document.createElement("optgroup");
            const categoryNameCN = CATEGORY_NAMES_CN[category];
            optgroup.label = `${category} (${categoryNameCN})`;

            // 获取该分类下的所有特征类型
            const features = getFeaturesByCategory(category);

            features.forEach((featureType) => {
                const option = globalThis.document.createElement("option");
                option.value = featureType.toString();

                const nameEN = FEATURE_NAMES_EN[featureType];
                const nameCN = FEATURE_NAMES_CN[featureType];
                option.textContent = `  ${nameEN} (${nameCN})`;

                optgroup.appendChild(option);
            });

            if (features.length > 0) {
                this._featureTypeSelect!.appendChild(optgroup);
            }
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
        this.updateSelectedFacesInfo();
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
        `;

        // 添加标题
        const title = globalThis.document.createElement("h4");
        title.textContent = "导出";
        title.style.cssText = `
            margin: 0 0 12px 0;
            font-size: 14px;
            color: #333;
            display: flex;
            align-items: center;
            gap: 8px;
        `;
        title.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
            </svg>
            导出
        `;
        section.appendChild(title);

        // 导出按钮容器
        const buttonsContainer = globalThis.document.createElement("div");
        buttonsContainer.style.cssText = `
            display: flex;
            gap: 8px;
        `;

        const exportButtons = [
            { text: "导出AAGNet", format: "aagnet" as const, color: "#6f42c1", icon: "📊" },
            { text: "导出MFTRCAD", format: "mftrcad" as const, color: "#17a2b8", icon: "🔧" },
        ];

        exportButtons.forEach((btn) => {
            const button = globalThis.document.createElement("button");
            button.innerHTML = `${btn.icon} ${btn.text}`;
            button.style.cssText = `
                flex: 1;
                padding: 10px 8px;
                background-color: ${btn.color};
                color: white;
                border: none;
                border-radius: 6px;
                cursor: pointer;
                font-size: 13px;
                font-weight: 500;
                transition: all 0.2s ease;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 6px;
            `;

            // 添加悬停效果
            button.addEventListener("mouseenter", () => {
                button.style.transform = "translateY(-1px)";
                button.style.boxShadow = "0 4px 8px rgba(0,0,0,0.2)";
            });

            button.addEventListener("mouseleave", () => {
                button.style.transform = "translateY(0)";
                button.style.boxShadow = "none";
            });

            button.onclick = () => this.onExportWithDirectorySelection(btn.format);
            buttonsContainer.appendChild(button);
        });

        section.appendChild(buttonsContainer);
        return section;
    }

    private setupEventListeners(): void {
        console.log("🎧 [EVENT SETUP] Setting up event listeners");

        // 监听选择变更事件
        this._manager.onSelectionChanged((selectedFaces) => {
            console.log(
                `🎯 [EVENT] onSelectionChanged triggered with ${selectedFaces.length} faces:`,
                selectedFaces,
            );
            this.updateSelectedFacesInfo();
        });

        // 监听标注创建事件
        this._manager.onAnnotationCreated((annotation) => {
            console.log(`📝 [EVENT] onAnnotationCreated triggered for:`, annotation.annotation.name);
            this.updateAnnotationsList();
        });

        // 监听标注删除事件
        this._manager.onAnnotationDeleted((annotation) => {
            console.log(`🗑️ [EVENT] onAnnotationDeleted triggered for:`, annotation.annotation.name);
            this.updateAnnotationsList();
            this.updateActiveAnnotationDisplay();
        });

        // 监听标注修改事件
        this._manager.onAnnotationModified((annotation) => {
            console.log(`✏️ [EVENT] onAnnotationModified triggered for:`, annotation.annotation.name);
            this.updateAnnotationsList();
            this.updateActiveAnnotationDisplay();
        });

        // 监听命令执行事件 - 当切换到其他工具时自动关闭面板
        this._commandExecuteHandler = (commandName: string) => {
            console.log(`🔧 [COMMAND] Command executed: ${commandName}`);

            // 如果执行的不是标注相关命令，则关闭面板
            if (!this.isAnnotationCommand(commandName)) {
                console.log(`🚪 [AUTO-CLOSE] Non-annotation command detected, closing panel`);
                this.closePanel();
            }
        };

        PubSub.default.sub("executeCommand", this._commandExecuteHandler);

        console.log("✅ [EVENT SETUP] All event listeners configured");
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
            const annotationNode = this._manager.createAnnotation(featureType, annotationName);

            // 设置为活动标注
            this._manager.setActiveAnnotation(annotationNode.annotation.id);

            console.log(`Created annotation: ${annotationNode.annotation.name}`);
            this.updateAnnotationsList();
            this.updateActiveAnnotationDisplay();
            this.updateSelectedFacesInfo(); // 确保选中面信息正确显示

            alert(
                `✅ 标注 "${annotationName}" 已创建并设为活动标注。\n\n现在可以：\n1. 点击"Select Faces"进入面选择模式\n2. 直接点击3D模型上的多个面\n3. 按Esc键完成选择\n4. 点击"Add Selected Faces"添加到标注`,
            );
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
        console.log("🔧 [ADD FACES] Starting Add Selected Faces operation");

        // 详细状态检查
        const activeAnnotation = this._manager.activeAnnotation;
        const selectedFaces = this._manager.selectedFaces;

        console.log("📋 Current state:");
        console.log("  - Active annotation:", activeAnnotation?.annotation.name);
        console.log("  - Selected faces count:", selectedFaces.length);
        console.log("  - Selected face IDs:", selectedFaces);

        // 前置条件检查
        if (!activeAnnotation) {
            console.warn("❌ No active annotation");
            alert(
                "❌ 请先创建或选择一个标注\n\n操作步骤：\n1. 点击 'Create New Annotation' 创建标注\n2. 或在标注列表中点击现有标注激活它",
            );
            return;
        }

        if (selectedFaces.length === 0) {
            console.warn("❌ No faces selected");
            alert(
                "❌ 请先选择要添加的面\n\n操作步骤：\n1. 点击 'Select Faces' 按钮\n2. 在3D视图中直接点击多个面\n3. 按Esc键完成选择\n4. 再点击此按钮添加面到标注",
            );
            return;
        }

        console.log(
            `📊 Current annotation "${activeAnnotation.annotation.name}" has ${activeAnnotation.annotation.faces.length} faces`,
        );

        try {
            // 执行添加操作
            const success = this._manager.addSelectedFacesToActiveAnnotation();

            if (success) {
                const finalFaceCount = activeAnnotation.annotation.faces.length;
                console.log(
                    `✅ Successfully added ${selectedFaces.length} faces. Total faces now: ${finalFaceCount}`,
                );

                // 更新UI显示
                this.updateActiveAnnotationDisplay();
                this.updateAnnotationsList();
                this.updateSelectedFacesInfo();

                alert(
                    `✅ 成功添加 ${selectedFaces.length} 个面到标注 "${activeAnnotation.annotation.name}"\n\n标注现在包含 ${finalFaceCount} 个面`,
                );
            } else {
                console.error("❌ Add operation failed");
                alert("❌ 添加面失败：验证未通过");
            }
        } catch (error) {
            console.error("❌ Exception during add operation:", error);
            alert(`❌ 添加面时发生错误: ${error}`);
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

            // 清除选中面的高亮
            console.log("🎨 Clearing face highlights after confirmation");
            this._manager.clearAllHighlights();

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

    private async onExportWithDirectorySelection(format: "aagnet" | "mftrcad"): Promise<void> {
        try {
            const annotations = (this._manager as any).annotations || [];

            if (annotations.length === 0) {
                alert("没有可导出的标注数据。");
                return;
            }

            // 显示加载状态
            const loadingElement = this.showLoadingMessage("正在导出标注数据...");

            // 获取模型文件名：优先从导入的节点名称获取，后备方案使用文档名称
            const modelFileName = this.getModelFileName();
            const totalFaceCount = this.calculateTotalFaceCount();

            // 执行导出（包含文件保存对话框）
            const result = await this._exportService.exportAnnotations(
                annotations,
                modelFileName,
                totalFaceCount,
                format,
                {
                    includeMetadata: true,
                    includeHistory: false,
                    compressOutput: false,
                    validateOutput: true,
                },
            );

            this.hideLoadingMessage(loadingElement);

            if (result.success) {
                if (result.metadata.exportPath) {
                    alert(
                        `${format.toUpperCase()}格式导出完成！\n文件已保存到: ${result.metadata.exportPath}\\${result.metadata.fileName}`,
                    );
                } else {
                    alert(`${format.toUpperCase()}格式导出完成！\n文件已下载: ${result.metadata.fileName}`);
                }
            } else {
                alert(`导出失败：\n${result.errors.join("\n")}`);
            }
        } catch (error) {
            console.error("Export failed:", error);
            alert(`导出过程中发生错误：${error}`);
        }
    }

    /**
     * 获取模型文件名
     * 优先从导入的节点名称获取（如_model38.stp），后备方案使用文档名称
     */
    private getModelFileName(): string {
        // 尝试从文档的根节点中找到STEP/STP文件节点
        const rootNode = this._document?.rootNode;
        if (rootNode) {
            // 遍历根节点的子节点，查找STEP文件节点
            let child = rootNode.firstChild;
            while (child) {
                const childName = child.name;
                if (
                    childName &&
                    (childName.toLowerCase().endsWith(".step") || childName.toLowerCase().endsWith(".stp"))
                ) {
                    return childName;
                }
                child = child.nextSibling;
            }

            // 如果没找到STEP文件节点，查找其他可能的模型节点
            child = rootNode.firstChild;
            while (child) {
                const childName = child.name;
                // 检查是否是常见的CAD文件格式
                if (childName && /\.(step|stp|iges|igs|brep|stl)$/i.test(childName)) {
                    return childName;
                }
                child = child.nextSibling;
            }
        }

        // 后备方案：使用文档名称
        return this._document?.name || "model";
    }

    private calculateTotalFaceCount(): number {
        // 这里应该从实际的文档/模型中获取总面数
        // 目前使用一个估算值
        const annotations = (this._manager as any).annotations || [];
        let totalFaces = 0;
        for (const annotation of annotations) {
            if (annotation.faces && annotation.faces.length > 0) {
                const maxFaceId = Math.max(...annotation.faces);
                totalFaces = Math.max(totalFaces, maxFaceId + 1);
            }
        }
        return totalFaces > 0 ? totalFaces : 1000; // 默认值
    }

    private downloadFile(data: any, fileName: string): void {
        const jsonString = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonString], { type: "application/json" });
        const url = URL.createObjectURL(blob);

        const a = globalThis.document.createElement("a");
        a.href = url;
        a.download = fileName;
        globalThis.document.body.appendChild(a);
        a.click();
        globalThis.document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    private showLoadingMessage(message: string): HTMLElement {
        const loading = globalThis.document.createElement("div");
        loading.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10001;
        `;

        loading.innerHTML = `
            <div style="
                background: white;
                padding: 20px;
                border-radius: 8px;
                text-align: center;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
            ">
                <div style="margin-bottom: 12px;">
                    <div style="
                        display: inline-block;
                        width: 20px;
                        height: 20px;
                        border: 2px solid #f3f3f3;
                        border-top: 2px solid #007bff;
                        border-radius: 50%;
                        animation: spin 1s linear infinite;
                    "></div>
                </div>
                <div style="color: #333; font-weight: 500;">${message}</div>
            </div>
        `;

        // 添加动画样式
        const style = globalThis.document.createElement("style");
        style.textContent = `
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `;
        globalThis.document.head.appendChild(style);

        globalThis.document.body.appendChild(loading);
        return loading;
    }

    private hideLoadingMessage(loadingElement: HTMLElement): void {
        if (loadingElement && loadingElement.parentNode) {
            loadingElement.parentNode.removeChild(loadingElement);
        }
    }

    // 保留作为备用的简单导出方法
    private onExport(format: "aagnet" | "mftrcad"): void {
        // 使用新的带目录选择的导出方法
        this.onExportWithDirectorySelection(format);
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

        const annotation = activeAnnotation.annotation;
        const nameEN = FEATURE_NAMES_EN[annotation.type];
        const nameCN = FEATURE_NAMES_CN[annotation.type];
        this._activeAnnotationInfo.innerHTML = `
            <div style="margin-bottom: 4px;">
                <strong>${annotation.name}</strong>
            </div>
            <div style="font-size: 12px; color: #666; margin-bottom: 4px;">
                Type: ${nameEN} (${nameCN})
            </div>
            <div style="font-size: 12px; color: #666;">
                Faces: ${annotation.faces.length}
            </div>
        `;
    }

    private updateAnnotationsList(): void {
        if (!this._annotationsList) return;

        // 获取所有标注节点
        const annotationNodes = this._manager.annotations;

        if (annotationNodes.length === 0) {
            this._annotationsList.innerHTML = `
                <div style="color: #666; font-style: italic; text-align: center; padding: 20px;">
                    No annotations created yet
                </div>
            `;
            return;
        }

        this._annotationsList.innerHTML = "";

        annotationNodes.forEach((node: AnnotationNode) => {
            const annotation = node.annotation;
            const nameEN = FEATURE_NAMES_EN[annotation.type];
            const isActive = this._manager.activeAnnotation?.annotation.id === annotation.id;

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
                this._manager.setActiveAnnotation(annotation.id);
                this.updateActiveAnnotationDisplay();
                this.updateAnnotationsList();
                this.updateSelectedFacesInfo();

                // 高亮标注的面
                this._manager.highlightAnnotationFaces(annotation.id);
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

    private updateSelectedFacesInfo(): void {
        console.log("🔄 [PANEL UPDATE] updateSelectedFacesInfo called");

        if (!this._selectedFacesInfo) {
            console.warn("⚠️ _selectedFacesInfo element not found");
            return;
        }

        const selectedFaces = this._manager.selectedFaces;
        console.log(`📊 Panel updating with ${selectedFaces.length} selected faces:`, selectedFaces);

        if (selectedFaces.length === 0) {
            this._selectedFacesInfo.innerHTML = `
                <div style="color: #999; font-size: 12px; font-style: italic;">
                    No faces selected
                </div>
            `;
            console.log("📋 Panel display: No faces selected");
        } else {
            this._selectedFacesInfo.innerHTML = `
                <div style="color: #333; font-size: 12px; background: #e8f5e8; padding: 4px; border-radius: 3px;">
                    <strong>✅ Selected faces:</strong> ${selectedFaces.length}
                </div>
                <div style="color: #666; font-size: 11px; margin-top: 4px; background: #f8f8f8; padding: 3px; border-radius: 3px;">
                    Face IDs: ${selectedFaces.join(", ")}
                </div>
            `;
            console.log(`📋 Panel display: ${selectedFaces.length} faces - ${selectedFaces.join(", ")}`);
        }
    }

    /**
     * 清除选中面的高亮显示
     */
    private clearSelectedFacesHighlight(): void {
        const document = this._manager.document;
        console.log("🎨 Clearing all face highlights from document");
        document.visual.highlighter.clear();
    }

    /**
     * 关闭面板
     */
    closePanel(): void {
        console.log("🚪 Closing annotation panel");

        // 清除面高亮
        this.clearSelectedFacesHighlight();

        // 清除当前选中的面
        this._manager.clearSelection();

        // 隐藏面板
        this._element.style.display = "none";

        // 触发面板关闭事件（如果需要通知其他组件）
        this.onPanelClosed();
    }

    /**
     * 显示面板
     */
    showPanel(): void {
        console.log("🚪 Opening annotation panel");
        this._element.style.display = "flex";
    }

    /**
     * 判断是否为标注相关命令
     */
    private isAnnotationCommand(commandName: string): boolean {
        const annotationCommands = [
            "annotation.start",
            "annotation.stop",
            "annotation.create",
            "annotation.delete",
            "annotation.validate",
            "annotation.clear",
            "annotation.export.aagnet",
            "annotation.export.mftrcad",
        ];

        return annotationCommands.includes(commandName);
    }

    /**
     * 面板关闭事件处理
     */
    private onPanelClosed(): void {
        // 这里可以添加面板关闭时的清理逻辑
        // 例如通知应用程序状态变更
        console.log("📢 Annotation panel closed");

        // 可以在这里发送事件给应用程序
        // 例如: PubSub.default.pub("annotationPanelClosed");
    }

    /**
     * 销毁面板
     */
    dispose(): void {
        // 清理PubSub监听器
        if (this._commandExecuteHandler) {
            PubSub.default.remove("executeCommand", this._commandExecuteHandler);
            this._commandExecuteHandler = undefined;
        }

        if (this._element.parentNode) {
            this._element.parentNode.removeChild(this._element);
        }
    }
}
