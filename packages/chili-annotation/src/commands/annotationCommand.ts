// Part of the Chili3d Project, under the AGPL-3.0 License.
// See LICENSE file in the project root for full license information.

import { ICommand, IApplication, PubSub } from "chili-core";
import { AnnotationManager } from "../annotationManager";
import { MachiningFeatureType } from "../featureTypes";
import { FaceSelectionHandler } from "../ui/faceSelectionHandler";
import { AnnotationPanel } from "../ui/annotationPanel";

/**
 * 标注命令 - 启动标注模式
 */
export class StartAnnotationCommand implements ICommand {
    async execute(application: IApplication): Promise<void> {
        const document = application.activeView?.document;
        if (!document) {
            throw new Error("No active document");
        }

        try {
            // 获取或创建标注管理器
            let manager = (document as any)._annotationManager as AnnotationManager;
            if (!manager) {
                manager = new AnnotationManager(document);
                (document as any)._annotationManager = manager;
            }

            // 创建面选择处理器
            let faceSelector = (document as any)._faceSelectionHandler as FaceSelectionHandler;
            if (!faceSelector) {
                faceSelector = new FaceSelectionHandler(document, manager);
                (document as any)._faceSelectionHandler = faceSelector;
            }

            // 创建标注面板
            let annotationPanel = (document as any)._annotationPanel as AnnotationPanel;
            if (!annotationPanel) {
                annotationPanel = new AnnotationPanel(manager, document);
                (document as any)._annotationPanel = annotationPanel;

                // 将面板添加到界面
                this.showAnnotationPanel(annotationPanel);
            }

            // 激活面选择模式
            faceSelector.activate();

            console.log("Annotation mode started");

            // 显示成功提示
            console.log("标注模式已启动 - Annotation mode activated");

            // 显示使用提示
            this.showStartupHint();
        } catch (error) {
            console.error("Failed to start annotation mode:", error);
            throw error;
        }
    }

    private showAnnotationPanel(panel: AnnotationPanel): void {
        // 将标注面板添加到右侧边栏
        const existingPanel = globalThis.document.getElementById("annotation-panel-container");
        if (existingPanel) {
            existingPanel.remove();
        }

        const container = globalThis.document.createElement("div");
        container.id = "annotation-panel-container";
        container.style.cssText = `
            position: fixed;
            top: 100px;
            right: 10px;
            width: 320px;
            height: calc(100vh - 120px);
            z-index: 1000;
            background: white;
            border: 1px solid #ddd;
            border-radius: 6px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            overflow: hidden;
        `;

        container.appendChild(panel.element);
        globalThis.document.body.appendChild(container);
    }

    private showStartupHint(): void {
        const hint = globalThis.document.createElement("div");
        hint.id = "annotation-startup-hint";
        hint.innerHTML = `
            <div style="font-weight: bold; margin-bottom: 8px;">🎯 Annotation Mode Activated</div>
            <div style="font-size: 14px; margin-bottom: 4px;">• Select feature type in the panel</div>
            <div style="font-size: 14px; margin-bottom: 4px;">• Click on faces to select them</div>
            <div style="font-size: 14px; margin-bottom: 4px;">• Hold Ctrl for multi-selection</div>
            <div style="font-size: 14px; margin-bottom: 8px;">• Press Esc to clear selection</div>
            <button id="close-hint-btn" style="background: #007acc; color: white; border: none; padding: 4px 8px; border-radius: 3px; cursor: pointer;">Got it!</button>
        `;
        hint.style.cssText = `
            position: fixed;
            top: 20px;
            left: 20px;
            background: rgba(0, 123, 255, 0.95);
            color: white;
            padding: 16px;
            border-radius: 8px;
            font-size: 13px;
            z-index: 10001;
            max-width: 300px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        `;

        hint.querySelector("#close-hint-btn")?.addEventListener("click", () => {
            hint.remove();
        });

        globalThis.document.body.appendChild(hint);

        // 10秒后自动隐藏
        setTimeout(() => {
            if (hint.parentNode) {
                hint.remove();
            }
        }, 10000);
    }
}

/**
 * 停止标注命令
 */
export class StopAnnotationCommand implements ICommand {
    async execute(application: IApplication): Promise<void> {
        const document = application.activeView?.document;
        if (!document) return;

        try {
            // 清理面选择处理器
            const faceSelector = (document as any)._faceSelectionHandler as FaceSelectionHandler;
            if (faceSelector) {
                faceSelector.dispose();
                (document as any)._faceSelectionHandler = undefined;
            }

            // 清理标注面板
            const annotationPanel = (document as any)._annotationPanel as AnnotationPanel;
            if (annotationPanel) {
                annotationPanel.dispose();
                (document as any)._annotationPanel = undefined;
            }

            // 移除面板容器
            const panelContainer = globalThis.document.getElementById("annotation-panel-container");
            if (panelContainer) {
                panelContainer.remove();
            }

            // 清理标注管理器
            const manager = (document as any)._annotationManager as AnnotationManager;
            if (manager) {
                manager.dispose?.();
                (document as any)._annotationManager = undefined;
            }

            console.log("Annotation mode stopped");

            // 显示停止提示
            console.log("标注模式已停止 - Annotation mode stopped");
        } catch (error) {
            console.error("Failed to stop annotation mode:", error);
            throw error;
        }
    }
}

/**
 * 创建新标注命令
 */
export class CreateAnnotationCommand implements ICommand {
    constructor(
        private featureType: MachiningFeatureType,
        private name?: string,
    ) {}

    async execute(application: IApplication): Promise<void> {
        const document = application.activeView?.document;
        if (!document) {
            throw new Error("No active document");
        }

        try {
            const manager = (document as any)._annotationManager as AnnotationManager;
            if (!manager) {
                throw new Error("Annotation manager not initialized. Please start annotation mode first.");
            }

            const annotationName = this.name || `Feature_${Date.now()}`;
            const annotation = manager.createAnnotation(this.featureType, annotationName);

            console.log(`Created annotation: ${annotation.name}`);
        } catch (error) {
            console.error("Failed to create annotation:", error);
            throw error;
        }
    }
}

/**
 * 删除标注命令
 */
export class DeleteAnnotationCommand implements ICommand {
    constructor(private annotationId?: string) {}

    async execute(application: IApplication): Promise<void> {
        const document = application.activeView?.document;
        if (!document) return;

        try {
            const manager = (document as any)._annotationManager as AnnotationManager;
            if (!manager) {
                throw new Error("Annotation manager not initialized.");
            }

            let targetId = this.annotationId;
            if (!targetId) {
                // 删除活动标注
                const activeAnnotation = manager.activeAnnotation;
                if (!activeAnnotation) {
                    throw new Error("No active annotation to delete.");
                }
                targetId = activeAnnotation.id;
            }

            manager.deleteAnnotation?.(targetId);

            console.log(`Deleted annotation: ${targetId}`);
        } catch (error) {
            console.error("Failed to delete annotation:", error);
            throw error;
        }
    }
}

/**
 * 验证标注命令
 */
export class ValidateAnnotationsCommand implements ICommand {
    async execute(application: IApplication): Promise<void> {
        const document = application.activeView?.document;
        if (!document) return;

        try {
            const manager = (document as any)._annotationManager as AnnotationManager;
            if (!manager) {
                throw new Error("Annotation manager not initialized.");
            }

            const annotations = manager.annotations || [];
            let validCount = 0;
            let errorCount = 0;

            for (const annotation of annotations) {
                try {
                    const result = annotation.validate();
                    if (result.isValid) {
                        validCount++;
                    } else {
                        errorCount++;
                        console.warn(`Validation failed for ${annotation.name}:`, result.errors);
                    }
                } catch (error) {
                    errorCount++;
                    console.error(`Validation error for ${annotation.name}:`, error);
                }
            }

            console.log(`Validation completed: ${validCount} valid, ${errorCount} errors`);

            if (errorCount === 0) {
                alert("All annotations are valid!");
            } else {
                alert(`Validation completed with ${errorCount} errors. Check console for details.`);
            }
        } catch (error) {
            console.error("Failed to validate annotations:", error);
            throw error;
        }
    }
}

/**
 * 导出标注命令
 */
export class ExportAnnotationsCommand implements ICommand {
    constructor(
        private format: "aagnet" | "mftrcad",
        private fileName?: string,
    ) {}

    async execute(application: IApplication): Promise<void> {
        const document = application.activeView?.document;
        if (!document) return;

        try {
            const manager = (document as any)._annotationManager as AnnotationManager;
            if (!manager) {
                throw new Error("Annotation manager not initialized.");
            }

            const annotations = manager.annotations || [];
            if (annotations.length === 0) {
                throw new Error("No annotations to export.");
            }

            // 简化的导出逻辑
            const exportData = {
                format: this.format,
                fileName: this.fileName || "model.step",
                annotations: annotations.map((ann) => ({
                    id: ann.id,
                    name: ann.name,
                    type: ann.featureType,
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
            a.download = `annotations_${this.format}_${Date.now()}.json`;
            globalThis.document.body.appendChild(a);
            a.click();
            globalThis.document.body.removeChild(a);
            URL.revokeObjectURL(url);

            console.log(`Exported ${annotations.length} annotations in ${this.format} format`);
        } catch (error) {
            console.error("Failed to export annotations:", error);
            throw error;
        }
    }
}

/**
 * 清除所有标注命令
 */
export class ClearAnnotationsCommand implements ICommand {
    async execute(application: IApplication): Promise<void> {
        const document = application.activeView?.document;
        if (!document) return;

        try {
            const manager = (document as any)._annotationManager as AnnotationManager;
            if (!manager) {
                throw new Error("Annotation manager not initialized.");
            }

            const annotations = manager.annotations || [];
            if (annotations.length === 0) {
                console.log("No annotations to clear");
                return;
            }

            const confirmed = confirm(`Clear all ${annotations.length} annotations? This cannot be undone.`);
            if (!confirmed) {
                return;
            }

            try {
                // 清除所有标注
                if ((manager as any).clear) {
                    (manager as any).clear();
                } else {
                    // 备用方法 - 逐个删除所有标注
                    const allAnnotations = manager.annotations || [];
                    for (const annotation of allAnnotations) {
                        if ((manager as any).deleteAnnotation) {
                            (manager as any).deleteAnnotation(annotation.id);
                        }
                    }
                }

                console.log(`Cleared ${annotations.length} annotations`);
                alert("All annotations have been cleared.");
            } catch (error) {
                throw error;
            }
        } catch (error) {
            console.error("Failed to clear annotations:", error);
            throw error;
        }
    }
}

// 导出所有命令类
export const AnnotationCommands = {
    StartAnnotationCommand,
    StopAnnotationCommand,
    CreateAnnotationCommand,
    DeleteAnnotationCommand,
    ValidateAnnotationsCommand,
    ExportAnnotationsCommand,
    ClearAnnotationsCommand,
};
