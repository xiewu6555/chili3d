// Part of the Chili3d Project, under the AGPL-3.0 License.
// See LICENSE file in the project root for full license information.

import {
    AsyncController,
    command,
    IApplication,
    ICommand,
    ShapeType,
    ISubFaceShape,
    VisualState,
} from "chili-core";

/**
 * 面选择命令 - 使用chili3d的原生选择系统
 */
@command({
    key: "annotation.selectFaces" as any,
    icon: "icon-cursor",
})
export class SelectFacesCommand implements ICommand {
    async execute(application: IApplication): Promise<void> {
        const document = application.activeView?.document;
        if (!document) {
            alert("没有活动文档！");
            return;
        }

        const annotationManager = (document as any)._annotationManager;
        if (!annotationManager) {
            alert("标注模式未启动！请先点击'启动标注'按钮。");
            return;
        }

        const controller = new AsyncController();

        try {
            // 保存当前的选择设置
            const previousShapeType = document.selection.shapeType;
            const previousShapeFilter = document.selection.shapeFilter;
            const previousNodeFilter = document.selection.nodeFilter;

            // 设置为面选择模式
            document.selection.shapeType = ShapeType.Face;
            document.selection.shapeFilter = undefined;
            document.selection.nodeFilter = undefined;

            // 确保多选模式启用 - 检查是否有multiSelect属性
            console.log("🔧 Selection configuration:");
            console.log("  - shapeType:", document.selection.shapeType);
            console.log("  - shapeFilter:", document.selection.shapeFilter);
            console.log("  - nodeFilter:", document.selection.nodeFilter);

            // 尝试设置多选模式（如果属性存在）
            if ("multiSelect" in document.selection) {
                (document.selection as any).multiSelect = true;
                console.log("  - multiSelect enabled:", (document.selection as any).multiSelect);
            }

            // 清除当前选择
            document.selection.clearSelection();
            document.visual.highlighter.clear();

            // 也清除标注管理器中的选择，确保状态同步
            annotationManager.clearSelection();
            console.log("Cleared all selections - document and annotation manager");

            console.log("Starting face selection...");
            console.log("ShapeType set to:", ShapeType.Face, "Current:", document.selection.shapeType);

            try {
                console.log("🎯 Starting pickShape with multiMode=true");
                console.log("📋 pickShape parameters:");
                console.log("  - prompt:", "请选择要标注的面（按Ctrl+点击多选，按Esc完成）");
                console.log("  - controller:", controller);
                console.log("  - multiMode:", true);
                console.log("  - selectedState:", VisualState.faceColored);
                console.log("  - highlightState:", VisualState.faceTransparent);

                // 执行面选择 - 使用视觉状态来高亮选中的面
                const selectedFaces = await document.selection.pickShape(
                    "请选择要标注的面（直接点击多个面，按Esc完成选择）" as any,
                    controller,
                    true, // 启用多选模式 - 用户可以直接点击多个面
                    VisualState.faceColored, // 选中状态 - 面着色
                    VisualState.faceTransparent, // 高亮状态 - 面透明
                );

                if (selectedFaces && selectedFaces.length > 0) {
                    console.log("✅ 选择了面:", selectedFaces);

                    // 从VisualShapeData中提取面的索引
                    const faceIds = selectedFaces.map((shape) => {
                        // 从ISubFaceShape中获取面的索引
                        return (shape.shape as ISubFaceShape).index;
                    });

                    // 更新标注管理器的选择状态
                    console.log("🔄 Selecting faces in annotation manager:", faceIds);
                    annotationManager.selectFaces(faceIds);
                    console.log("✅ Selected faces after update:", annotationManager.selectedFaces);
                    console.log("📊 Manager selectedFaces count:", annotationManager.selectedFaces.length);

                    // 存储面ID到视觉对象的映射
                    selectedFaces.forEach((shapeData) => {
                        const visual = shapeData.owner;
                        const faceIndex = (shapeData.shape as ISubFaceShape).index;
                        annotationManager.updateFaceVisualMapping(faceIndex, visual, faceIndex);
                    });

                    // 先清除pickShape过程中的临时高亮，然后添加持续高亮
                    console.log("🎨 Adding persistent highlight for selected faces");
                    selectedFaces.forEach((shapeData, index) => {
                        const visual = shapeData.owner; // 使用正确的 owner 属性
                        const faceIndex = (shapeData.shape as ISubFaceShape).index;
                        console.log(
                            `🎨 Adding highlight for face ${faceIndex} on visual:`,
                            visual.constructor.name,
                        );

                        // 首先移除可能存在的其他状态
                        console.log(`🎨 Removing any existing states for face ${faceIndex}`);
                        document.visual.highlighter.removeState(
                            visual,
                            VisualState.faceTransparent,
                            ShapeType.Face,
                            faceIndex,
                        );
                        document.visual.highlighter.removeState(
                            visual,
                            VisualState.edgeSelected,
                            ShapeType.Face,
                            faceIndex,
                        );

                        // 添加面着色高亮状态 (VisualState.faceColored = 8)
                        console.log(
                            `🎨 Adding faceColored state: ${VisualState.faceColored} to face ${faceIndex}`,
                        );
                        console.log(`🎨 Visual object:`, visual);
                        console.log(`🎨 ShapeType.Face value:`, ShapeType.Face);

                        document.visual.highlighter.addState(
                            visual,
                            VisualState.faceColored,
                            ShapeType.Face,
                            faceIndex,
                        );

                        console.log(`🎨 addState call completed for face ${faceIndex}`);
                    });

                    // 验证状态是否正确设置
                    setTimeout(() => {
                        console.log(
                            "🔍 Delayed check - Manager selectedFaces:",
                            annotationManager.selectedFaces,
                        );

                        // 更新面板显示
                        const panel = (document as any)._annotationPanel;
                        if (panel) {
                            console.log("🎛️ Found panel, updating selected faces info");
                            if (panel.updateSelectedFacesInfo) {
                                panel.updateSelectedFacesInfo();
                            }
                        } else {
                            console.warn("⚠️ Panel not found in document");
                        }
                    }, 100);

                    alert(
                        `✅ 成功选择了 ${faceIds.length} 个面\n\n现在可以：\n1. 点击"添加选中面"将面添加到活动标注\n2. 按住Ctrl继续选择更多面\n3. 按Esc完成选择`,
                    );
                } else {
                    console.log("❌ 未选择任何面");
                }
            } finally {
                // 恢复之前的选择设置
                document.selection.shapeType = previousShapeType;
                document.selection.shapeFilter = previousShapeFilter;
                document.selection.nodeFilter = previousNodeFilter;
            }
        } catch (error) {
            if (error !== "cancelled") {
                console.error("面选择失败:", error);
                alert(`面选择失败: ${error}`);
            }
        }
    }
}
