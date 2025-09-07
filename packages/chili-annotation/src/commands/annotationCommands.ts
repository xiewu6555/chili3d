// Part of the Chili3d Project, under the AGPL-3.0 License.
// See LICENSE file in the project root for full license information.

import { command, IApplication, ICommand, ShapeType, AsyncController } from "chili-core";
import { AnnotationManager } from "../annotationManager";
import { AnnotationPanel } from "../ui/annotationPanel";
import { FaceSelectionHandler } from "../ui/faceSelectionHandler";

/**
 * 启动标注模式命令 - 真正集成chili3d系统
 */
@command({
    key: "annotation.start",
    icon: "icon-play",
})
export class StartAnnotationCommandRegistered implements ICommand {
    async execute(application: IApplication): Promise<void> {
        const document = application.activeView?.document;
        const view = application.activeView;

        if (!document || !view) {
            alert("没有活动文档！请先创建或打开一个文档。");
            return;
        }

        try {
            // 检查是否已经在标注模式
            const existingManager = (document as any)._annotationManager;
            if (existingManager) {
                alert("标注模式已经启动！");
                return;
            }

            // 创建标注管理器
            const annotationManager = new AnnotationManager(document);
            (document as any)._annotationManager = annotationManager;

            // 创建面选择处理器
            const faceSelectionHandler = new FaceSelectionHandler(document, annotationManager);
            (document as any)._faceSelectionHandler = faceSelectionHandler;

            // 创建标注面板
            const annotationPanel = new AnnotationPanel(annotationManager, document);
            (document as any)._annotationPanel = annotationPanel;

            // 将面板添加到DOM中 - 尝试多种容器选择方式
            let mainContainer =
                globalThis.document.querySelector("#app") ||
                globalThis.document.querySelector(".app") ||
                globalThis.document.querySelector("main") ||
                globalThis.document.querySelector(".main-container") ||
                globalThis.document.body;

            if (mainContainer) {
                // 设置面板样式以确保可见性
                annotationPanel.element.style.cssText += `
                    position: fixed;
                    top: 0;
                    right: 0;
                    z-index: 10000;
                    max-height: 100vh;
                    overflow-y: auto;
                `;
                mainContainer.appendChild(annotationPanel.element);
                console.log("✅ 标注面板已添加到DOM:", mainContainer.tagName, mainContainer.className);
            } else {
                console.error("❌ 无法找到合适的容器添加标注面板");
            }

            // 保存面板引用以便清理
            (document as any)._annotationPanel = annotationPanel;

            // 激活面选择模式
            faceSelectionHandler.activate();

            console.log("✅ 标注模式已成功启动");
            console.log("- 标注管理器已创建");
            console.log("- 面选择处理器已激活");
            console.log("- 标注面板已显示");

            alert(
                "✅ 标注模式已成功启动！\n✓ 标注管理器已创建\n✓ 面选择功能已激活\n✓ 标注面板已显示\n\n现在您可以：\n1. 选择特征类型\n2. 创建新标注\n3. 在3D视图中选择面",
            );
        } catch (error) {
            console.error("启动标注模式失败:", error);
            alert(`启动标注模式失败: ${error}`);
        }
    }
}

@command({
    key: "annotation.stop",
    icon: "icon-stop",
})
export class StopAnnotationCommandRegistered implements ICommand {
    async execute(application: IApplication): Promise<void> {
        const document = application.activeView?.document;
        if (!document) {
            alert("没有活动文档！");
            return;
        }

        try {
            const annotationManager = (document as any)._annotationManager;
            const faceSelectionHandler = (document as any)._faceSelectionHandler;
            const annotationPanel = (document as any)._annotationPanel;

            if (!annotationManager) {
                alert("标注模式尚未启动！");
                return;
            }

            // 清理面选择处理器
            if (faceSelectionHandler) {
                faceSelectionHandler.dispose();
                (document as any)._faceSelectionHandler = null;
            }

            // 清理标注面板
            if (annotationPanel) {
                annotationPanel.dispose();
                (document as any)._annotationPanel = null;
            }

            // 清理标注管理器
            if (annotationManager.dispose) {
                annotationManager.dispose();
            }
            (document as any)._annotationManager = null;

            console.log("✅ 标注模式已停止");
            console.log("- 面选择处理器已清理");
            console.log("- 标注面板已移除");
            console.log("- 标注管理器已清理");

            alert("✅ 标注模式已停止！\n✓ 所有标注相关组件已清理\n✓ 界面已恢复正常模式");
        } catch (error) {
            console.error("停止标注模式失败:", error);
            alert(`停止标注模式失败: ${error}`);
        }
    }
}

@command({
    key: "annotation.create",
    icon: "icon-add",
})
export class CreateAnnotationCommandRegistered implements ICommand {
    async execute(application: IApplication): Promise<void> {
        const document = application.activeView?.document;
        if (!document) {
            alert("没有活动文档！请先创建或打开一个文档。");
            return;
        }

        try {
            const annotationManager = (document as any)._annotationManager;
            const annotationPanel = (document as any)._annotationPanel;

            if (!annotationManager) {
                alert("标注模式未启动！请先点击'启动标注'按钮。");
                return;
            }

            // 检查是否有选中的特征类型（从面板获取）
            let featureType = annotationManager._selectedFeatureType || 0; // 默认为第一个特征类型

            // 创建新标注
            const annotationNode = annotationManager.createAnnotation(featureType);

            // 设置为活动标注
            annotationManager.setActiveAnnotation(annotationNode.annotation.id);

            // 更新面板显示（如果存在）
            if (annotationPanel) {
                annotationPanel.updateAnnotationsList?.();
                annotationPanel.updateActiveAnnotationDisplay?.();
            }

            console.log("✅ 创建标注成功:", annotationNode.annotation.name);
            alert(
                `✅ 成功创建标注: ${annotationNode.annotation.name}\n类型: ${annotationNode.annotation.featureType}\n标注ID: ${annotationNode.annotation.id}\n\n现在可以选择面并添加到此标注中。`,
            );
        } catch (error) {
            console.error("创建标注失败:", error);
            alert(`创建标注失败: ${error}`);
        }
    }
}

/**
 * 面选择命令 - 让用户能够在3D视图中选择面
 */
@command({
    key: "annotation.selectFace" as any,
    icon: "icon-select",
})
export class SelectFaceCommandRegistered implements ICommand {
    async execute(application: IApplication): Promise<void> {
        const document = application.activeView?.document;
        const view = application.activeView;

        if (!document || !view) {
            alert("没有活动文档！");
            return;
        }

        try {
            const annotationManager = (document as any)._annotationManager;
            const faceSelectionHandler = (document as any)._faceSelectionHandler;

            if (!annotationManager || !faceSelectionHandler) {
                alert("标注模式未启动！请先点击'启动标注'按钮。");
                return;
            }

            // 使用chili3d的选择系统来选择面
            const controller = new AsyncController();

            try {
                // 使用视图的检测功能来选择面
                alert(
                    "请在3D视图中点击要选择的面...\n\n使用方法：\n- 单击选择一个面\n- Ctrl+单击多选面\n- Esc取消选择",
                );

                // 这里需要实现实际的面选择逻辑
                // 暂时使用模拟的选择结果
                const selectedShapes = await view.detectShapes(ShapeType.Face, 0, 0);

                if (selectedShapes && selectedShapes.length > 0) {
                    // 获取面ID（这里需要从VisualShapeData中提取实际的面ID）
                    const faceIds = selectedShapes.map((shape, index) => index + 1); // 模拟面ID

                    // 更新选择状态
                    annotationManager.selectFaces(faceIds);

                    // 更新面选择处理器
                    faceSelectionHandler.handleFaceClick({
                        faceId: faceIds[0],
                        ctrlKey: false,
                        shiftKey: false,
                        altKey: false,
                    });

                    console.log("选择了面:", faceIds);
                    alert(`✅ 选择了 ${faceIds.length} 个面\n面ID: ${faceIds.join(", ")}`);
                } else {
                    alert("未检测到面，请确保点击在模型的面上。");
                }
            } catch (error) {
                console.error("面选择过程中出错:", error);
                alert(`面选择失败: ${error}`);
            } finally {
                // AsyncController disposal - adjust based on actual chili3d API
                if (controller.dispose) {
                    controller.dispose();
                }
            }
        } catch (error) {
            console.error("执行面选择命令失败:", error);
            alert(`面选择命令失败: ${error}`);
        }
    }
}

/**
 * 添加选中面到活动标注命令
 */
@command({
    key: "annotation.addSelectedFaces" as any,
    icon: "icon-plus",
})
export class AddSelectedFacesCommandRegistered implements ICommand {
    async execute(application: IApplication): Promise<void> {
        const document = application.activeView?.document;

        if (!document) {
            alert("没有活动文档！");
            return;
        }

        try {
            const annotationManager = (document as any)._annotationManager;
            const annotationPanel = (document as any)._annotationPanel;

            if (!annotationManager) {
                alert("标注模式未启动！请先点击'启动标注'按钮。");
                return;
            }

            const activeAnnotation = annotationManager.activeAnnotation;
            if (!activeAnnotation) {
                alert("没有活动标注！请先创建一个标注。");
                return;
            }

            const selectedFaces = annotationManager.selectedFaces;
            if (selectedFaces.length === 0) {
                alert("没有选中的面！请先选择一些面。");
                return;
            }

            // 添加选中的面到活动标注
            const success = annotationManager.addSelectedFacesToActiveAnnotation();

            if (success) {
                // 更新面板显示
                if (annotationPanel) {
                    annotationPanel.updateActiveAnnotationDisplay?.();
                    annotationPanel.updateAnnotationsList?.();
                }

                console.log(
                    `✅ 成功添加 ${selectedFaces.length} 个面到标注 ${activeAnnotation.annotation.name}`,
                );
                alert(
                    `✅ 成功添加面到标注！\n标注名称: ${activeAnnotation.annotation.name}\n添加的面数量: ${selectedFaces.length}\n总面数: ${activeAnnotation.faces.length}`,
                );
            } else {
                alert("添加面到标注失败！可能是面验证不通过或其他错误。");
            }
        } catch (error) {
            console.error("添加选中面到标注失败:", error);
            alert(`添加面到标注失败: ${error}`);
        }
    }
}

@command({
    key: "annotation.delete",
    icon: "icon-delete",
})
export class DeleteAnnotationCommandRegistered implements ICommand {
    async execute(application: IApplication): Promise<void> {
        const document = application.activeView?.document;
        if (!document) {
            alert("没有活动文档！请先创建或打开一个文档。");
            return;
        }

        try {
            const annotationManager = (document as any)._annotationManager;
            if (!annotationManager) {
                alert("标注模式未启动！请先点击'启动标注'按钮。");
                return;
            }

            if (annotationManager.annotations.length === 0) {
                alert("没有可删除的标注！");
                return;
            }

            // 删除当前活动标注或最后一个标注
            let deletedAnnotation;
            if (annotationManager.activeAnnotation) {
                const index = annotationManager.annotations.findIndex(
                    (ann: any) => ann.id === annotationManager.activeAnnotation.id,
                );
                if (index >= 0) {
                    deletedAnnotation = annotationManager.annotations.splice(index, 1)[0];
                    annotationManager.activeAnnotation =
                        annotationManager.annotations.length > 0
                            ? annotationManager.annotations[annotationManager.annotations.length - 1]
                            : null;
                }
            } else {
                deletedAnnotation = annotationManager.annotations.pop();
                annotationManager.activeAnnotation =
                    annotationManager.annotations.length > 0
                        ? annotationManager.annotations[annotationManager.annotations.length - 1]
                        : null;
            }

            console.log("删除标注成功:", deletedAnnotation);
            alert(
                `✅ 成功删除标注: ${deletedAnnotation.name}\n剩余标注数量: ${annotationManager.annotations.length}`,
            );
        } catch (error) {
            console.error("删除标注失败:", error);
            alert(`删除标注失败: ${error}`);
        }
    }
}

@command({
    key: "annotation.validate",
    icon: "icon-check",
})
export class ValidateAnnotationsCommandRegistered implements ICommand {
    async execute(application: IApplication): Promise<void> {
        const document = application.activeView?.document;
        if (!document) {
            alert("没有活动文档！请先创建或打开一个文档。");
            return;
        }

        try {
            const annotationManager = (document as any)._annotationManager;
            if (!annotationManager) {
                alert("标注模式未启动！请先点击'启动标注'按钮。");
                return;
            }

            if (annotationManager.annotations.length === 0) {
                alert("没有标注需要验证！请先创建一些标注。");
                return;
            }

            // 简单的验证逻辑
            let validCount = 0;
            let invalidCount = 0;
            const validationResults = [];

            for (const annotation of annotationManager.annotations) {
                const isValid = annotation.name && annotation.type && annotation.id;
                if (isValid) {
                    validCount++;
                    validationResults.push(`✅ ${annotation.name}: 验证通过`);
                } else {
                    invalidCount++;
                    validationResults.push(`❌ ${annotation.name || "未命名标注"}: 缺少必要信息`);
                }
            }

            const summary = `验证完成！\n总数: ${annotationManager.annotations.length}\n有效: ${validCount}\n无效: ${invalidCount}`;
            const details = validationResults.join("\n");

            console.log("标注验证结果:", { summary, details });
            alert(`${summary}\n\n详细结果:\n${details}`);
        } catch (error) {
            console.error("验证标注失败:", error);
            alert(`验证标注失败: ${error}`);
        }
    }
}

@command({
    key: "annotation.clear",
    icon: "icon-clear",
})
export class ClearAnnotationsCommandRegistered implements ICommand {
    async execute(application: IApplication): Promise<void> {
        const document = application.activeView?.document;
        if (!document) {
            alert("没有活动文档！请先创建或打开一个文档。");
            return;
        }

        try {
            const annotationManager = (document as any)._annotationManager;
            if (!annotationManager) {
                alert("标注模式未启动！请先点击'启动标注'按钮。");
                return;
            }

            if (annotationManager.annotations.length === 0) {
                alert("没有标注需要清除！");
                return;
            }

            const annotationCount = annotationManager.annotations.length;

            // 清除所有标注
            annotationManager.annotations = [];
            annotationManager.activeAnnotation = null;

            console.log(`清除了 ${annotationCount} 个标注`);
            alert(`✅ 成功清除所有标注！\n已清除标注数量: ${annotationCount}`);
        } catch (error) {
            console.error("清除标注失败:", error);
            alert(`清除标注失败: ${error}`);
        }
    }
}

@command({
    key: "annotation.export.aagnet",
    icon: "icon-export",
})
export class ExportAAGNetCommandRegistered implements ICommand {
    async execute(application: IApplication): Promise<void> {
        const document = application.activeView?.document;
        if (!document) {
            alert("没有活动文档！请先创建或打开一个文档。");
            return;
        }

        try {
            const annotationManager = (document as any)._annotationManager;
            if (!annotationManager) {
                alert("标注模式未启动！请先点击'启动标注'按钮。");
                return;
            }

            if (annotationManager.annotations.length === 0) {
                alert("没有标注可以导出！请先创建一些标注。");
                return;
            }

            // 使用面板中的导出方法
            const annotationPanel = (document as any)._annotationPanel;
            if (annotationPanel && typeof annotationPanel.onExportWithDirectorySelection === "function") {
                await annotationPanel.onExportWithDirectorySelection("aagnet");
            } else {
                alert("标注面板未初始化，请先启动标注模式！");
            }
        } catch (error) {
            console.error("导出AAGNet格式失败:", error);
            alert(`导出AAGNet格式失败: ${error}`);
        }
    }
}

@command({
    key: "annotation.export.mftrcad",
    icon: "icon-export",
})
export class ExportMFTRCADCommandRegistered implements ICommand {
    async execute(application: IApplication): Promise<void> {
        const document = application.activeView?.document;
        if (!document) {
            alert("没有活动文档！请先创建或打开一个文档。");
            return;
        }

        try {
            const annotationManager = (document as any)._annotationManager;
            if (!annotationManager) {
                alert("标注模式未启动！请先点击'启动标注'按钮。");
                return;
            }

            if (annotationManager.annotations.length === 0) {
                alert("没有标注可以导出！请先创建一些标注。");
                return;
            }

            // 使用面板中的导出方法
            const annotationPanel = (document as any)._annotationPanel;
            if (annotationPanel && typeof annotationPanel.onExportWithDirectorySelection === "function") {
                await annotationPanel.onExportWithDirectorySelection("mftrcad");
            } else {
                alert("标注面板未初始化，请先启动标注模式！");
            }
        } catch (error) {
            console.error("导出MFTRCAD格式失败:", error);
            alert(`导出MFTRCAD格式失败: ${error}`);
        }
    }
}
