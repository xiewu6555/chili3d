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

            // 清除当前选择
            document.selection.clearSelection();
            document.visual.highlighter.clear();

            console.log("Starting face selection...");
            console.log("ShapeType set to:", ShapeType.Face, "Current:", document.selection.shapeType);

            try {
                // 执行面选择 - 使用视觉状态来高亮选中的面
                const selectedFaces = await document.selection.pickShape(
                    "请选择要标注的面（按Esc取消）" as any,
                    controller,
                    false, // 改为单选模式，需要按住Ctrl进行多选
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
                    console.log("Selecting faces in annotation manager:", faceIds);
                    annotationManager.selectFaces(faceIds);
                    console.log("Selected faces after update:", annotationManager.selectedFaces);

                    // 更新面选择处理器（如果存在）
                    const faceSelectionHandler = (document as any)._faceSelectionHandler;
                    if (faceSelectionHandler) {
                        faceIds.forEach((faceId) => {
                            faceSelectionHandler.handleFaceClick({
                                faceId: faceId,
                                ctrlKey: false,
                                shiftKey: false,
                                altKey: false,
                            });
                        });
                    }

                    // 更新面板显示 - 通过查找面板并调用更新方法
                    const panel = (document as any)._annotationPanel;
                    if (panel && panel.updateSelectedFacesInfo) {
                        panel.updateSelectedFacesInfo();
                    }

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
