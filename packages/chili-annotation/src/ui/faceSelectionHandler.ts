// Part of the Chili3d Project, under the AGPL-3.0 License.
// See LICENSE file in the project root for full license information.

import { IDocument, IShape } from "chili-core";
import { AnnotationManager } from "../annotationManager";

/**
 * 面选择模式
 */
export enum FaceSelectionMode {
    Single = "single", // 单选模式
    Multiple = "multiple", // 多选模式
    Range = "range", // 范围选择模式
}

/**
 * 面选择事件数据
 */
export interface FaceSelectionEvent {
    faceId: number;
    shapeId?: string;
    ctrlKey: boolean;
    shiftKey: boolean;
    altKey: boolean;
}

/**
 * 面选择处理器 - 处理3D视图中的面选择交互
 */
export class FaceSelectionHandler {
    private _document: IDocument;
    private _manager: AnnotationManager;
    private _isActive = false;
    private _selectionMode = FaceSelectionMode.Single;
    private _highlightedFaces = new Set<number>();
    private _lastSelectedFace: number | undefined;

    // 事件回调
    private _onFaceSelected: ((faceId: number) => void)[] = [];
    private _onFaceDeselected: ((faceId: number) => void)[] = [];
    private _onSelectionChanged: ((selectedFaces: number[]) => void)[] = [];

    constructor(document: IDocument, manager: AnnotationManager) {
        this._document = document;
        this._manager = manager;
        this.setupEventListeners();
    }

    get isActive(): boolean {
        return this._isActive;
    }

    get selectionMode(): FaceSelectionMode {
        return this._selectionMode;
    }

    set selectionMode(mode: FaceSelectionMode) {
        this._selectionMode = mode;
    }

    get selectedFaces(): number[] {
        return this._manager.selectedFaces;
    }

    get highlightedFaces(): number[] {
        return Array.from(this._highlightedFaces);
    }

    /**
     * 激活面选择模式
     */
    activate(): void {
        if (this._isActive) return;

        this._isActive = true;
        this.updateCursor("crosshair");

        console.log("Face selection handler activated");

        // 显示选择提示
        this.showSelectionHint("Click on faces to select them. Hold Ctrl for multi-selection.");
    }

    /**
     * 停用面选择模式
     */
    deactivate(): void {
        if (!this._isActive) return;

        this._isActive = false;
        this.updateCursor("default");
        this.clearHighlights();
        this._manager.clearSelection();

        console.log("Face selection handler deactivated");

        this.hideSelectionHint();
    }

    /**
     * 处理面点击事件
     */
    handleFaceClick(event: FaceSelectionEvent): void {
        if (!this._isActive) return;

        const { faceId, ctrlKey, shiftKey } = event;

        switch (this._selectionMode) {
            case FaceSelectionMode.Single:
                this.handleSingleSelection(faceId);
                break;
            case FaceSelectionMode.Multiple:
                this.handleMultipleSelection(faceId, ctrlKey);
                break;
            case FaceSelectionMode.Range:
                this.handleRangeSelection(faceId, shiftKey);
                break;
        }

        this.updateVisualFeedback();
        this.notifySelectionChanged();
    }

    /**
     * 处理面悬停事件
     */
    handleFaceHover(faceId: number): void {
        if (!this._isActive) return;

        this.highlightFace(faceId);
        this.showFaceInfo(faceId);
    }

    /**
     * 处理面离开悬停事件
     */
    handleFaceLeave(faceId: number): void {
        if (!this._isActive) return;

        this.unhighlightFace(faceId);
        this.hideFaceInfo();
    }

    /**
     * 清除所有选择
     */
    clearSelection(): void {
        this._manager.clearSelection();
        this.clearHighlights();
        this.updateVisualFeedback();
        this.notifySelectionChanged();
    }

    /**
     * 选择所有面
     */
    selectAll(): void {
        // 获取当前文档中所有可见的面
        const allFaces = this.getAllVisibleFaces();
        this._manager.selectFaces(allFaces);
        this.updateVisualFeedback();
        this.notifySelectionChanged();
    }

    /**
     * 反选
     */
    invertSelection(): void {
        const allFaces = this.getAllVisibleFaces();
        const currentSelected = new Set(this._manager.selectedFaces);
        const newSelection = allFaces.filter((faceId) => !currentSelected.has(faceId));

        this._manager.selectFaces(newSelection);
        this.updateVisualFeedback();
        this.notifySelectionChanged();
    }

    // 事件订阅方法
    onFaceSelected(callback: (faceId: number) => void): void {
        this._onFaceSelected.push(callback);
    }

    onFaceDeselected(callback: (faceId: number) => void): void {
        this._onFaceDeselected.push(callback);
    }

    onSelectionChanged(callback: (selectedFaces: number[]) => void): void {
        this._onSelectionChanged.push(callback);
    }

    /**
     * 设置事件监听器
     */
    private setupEventListeners(): void {
        // 监听键盘事件
        globalThis.document.addEventListener("keydown", this.handleKeyDown.bind(this));
        globalThis.document.addEventListener("keyup", this.handleKeyUp.bind(this));

        // 添加3D视图的点击事件监听
        this.setup3DViewListeners();
    }

    /**
     * 设置3D视图的事件监听
     */
    private setup3DViewListeners(): void {
        // 查找3D视图的canvas元素
        const canvas =
            globalThis.document.querySelector("canvas") ||
            globalThis.document.querySelector(".three-canvas") ||
            globalThis.document.querySelector("#three-canvas");

        if (canvas) {
            console.log("✅ 找到3D视图canvas，设置面选择事件监听");

            canvas.addEventListener("click", this.handle3DViewClick.bind(this));
            canvas.addEventListener("mousemove", this.handle3DViewMouseMove.bind(this));

            // 保存canvas引用
            (this as any)._canvas = canvas;
        } else {
            console.warn("⚠️ 未找到3D视图canvas，面选择可能无法工作");
            // 5秒后重试
            setTimeout(() => this.setup3DViewListeners(), 5000);
        }
    }

    /**
     * 处理3D视图点击事件
     */
    private handle3DViewClick(event: MouseEvent): void {
        if (!this._isActive) return;

        console.log("🖱️ 检测到3D视图点击", { x: event.clientX, y: event.clientY });

        // 模拟面选择 - 生成一个假的面ID用于测试
        const faceId = Math.floor(Math.random() * 100) + 1;

        // 创建面选择事件
        const faceEvent = {
            faceId: faceId,
            ctrlKey: event.ctrlKey,
            shiftKey: event.shiftKey,
            altKey: event.altKey,
        };

        console.log("✅ 模拟选择面:", faceId);
        this.handleFaceClick(faceEvent);
    }

    /**
     * 处理3D视图鼠标移动事件
     */
    private handle3DViewMouseMove(event: MouseEvent): void {
        if (!this._isActive) return;

        // 模拟面悬停
        const faceId = Math.floor(Math.random() * 100) + 1;

        // 节流处理，避免过于频繁
        if (!this._mouseMoveThrottle) {
            this._mouseMoveThrottle = true;
            setTimeout(() => {
                this._mouseMoveThrottle = false;
            }, 100);

            this.handleFaceHover(faceId);
        }
    }

    private _mouseMoveThrottle = false;

    /**
     * 处理单选
     */
    private handleSingleSelection(faceId: number): void {
        this._manager.selectFaces([faceId]);
        this._lastSelectedFace = faceId;
        this.triggerFaceSelected(faceId);
    }

    /**
     * 处理多选
     */
    private handleMultipleSelection(faceId: number, ctrlKey: boolean): void {
        const currentSelected = this._manager.selectedFaces;

        if (ctrlKey) {
            if (currentSelected.includes(faceId)) {
                // 取消选择
                this._manager.deselectFaces([faceId]);
                this.triggerFaceDeselected(faceId);
            } else {
                // 添加到选择
                this._manager.selectFaces([faceId], true);
                this._lastSelectedFace = faceId;
                this.triggerFaceSelected(faceId);
            }
        } else {
            // 单选模式
            this._manager.selectFaces([faceId]);
            this._lastSelectedFace = faceId;
            this.triggerFaceSelected(faceId);
        }
    }

    /**
     * 处理范围选择
     */
    private handleRangeSelection(faceId: number, shiftKey: boolean): void {
        if (shiftKey && this._lastSelectedFace !== undefined) {
            // 范围选择：从上次选中的面到当前面
            const rangeFaces = this.getFacesInRange(this._lastSelectedFace, faceId);
            this._manager.selectFaces(rangeFaces, true);
            rangeFaces.forEach((id) => this.triggerFaceSelected(id));
        } else {
            // 普通单选
            this._manager.selectFaces([faceId]);
            this._lastSelectedFace = faceId;
            this.triggerFaceSelected(faceId);
        }
    }

    /**
     * 高亮面
     */
    private highlightFace(faceId: number): void {
        this._highlightedFaces.add(faceId);
        this.updateFaceStyle(faceId, "hover");
    }

    /**
     * 取消高亮面
     */
    private unhighlightFace(faceId: number): void {
        this._highlightedFaces.delete(faceId);
        this.updateFaceStyle(faceId, "normal");
    }

    /**
     * 清除所有高亮
     */
    private clearHighlights(): void {
        this._highlightedFaces.forEach((faceId) => {
            this.updateFaceStyle(faceId, "normal");
        });
        this._highlightedFaces.clear();
    }

    /**
     * 更新面样式
     */
    private updateFaceStyle(faceId: number, style: "normal" | "selected" | "hover"): void {
        // 这里需要与chili3d的渲染系统集成
        // 实际实现中需要调用chili3d的API来更新面的视觉样式

        const colors = {
            normal: "#ffffff",
            selected: "#00ff00",
            hover: "#ffff00",
        };

        // 模拟样式更新
        console.log(`Updating face ${faceId} style to ${style} (${colors[style]})`);
    }

    /**
     * 更新视觉反馈
     */
    private updateVisualFeedback(): void {
        const selectedFaces = this._manager.selectedFaces;

        // 更新所有选中面的样式
        selectedFaces.forEach((faceId) => {
            this.updateFaceStyle(faceId, "selected");
        });

        // 更新选择计数显示
        this.updateSelectionCounter(selectedFaces.length);
    }

    /**
     * 获取范围内的面
     */
    private getFacesInRange(startFaceId: number, endFaceId: number): number[] {
        // 这里需要实现获取两个面之间所有面的逻辑
        // 暂时返回简单的范围
        const start = Math.min(startFaceId, endFaceId);
        const end = Math.max(startFaceId, endFaceId);

        const faces: number[] = [];
        for (let i = start; i <= end; i++) {
            faces.push(i);
        }
        return faces;
    }

    /**
     * 获取所有可见面
     */
    private getAllVisibleFaces(): number[] {
        // 这里需要从chili3d的文档系统获取所有可见面
        // 暂时返回模拟数据
        const faces: number[] = [];
        for (let i = 1; i <= 100; i++) {
            faces.push(i);
        }
        return faces;
    }

    /**
     * 处理键盘按下事件
     */
    private handleKeyDown(event: KeyboardEvent): void {
        if (!this._isActive) return;

        switch (event.key) {
            case "Escape":
                this.clearSelection();
                break;
            case "a":
            case "A":
                if (event.ctrlKey) {
                    event.preventDefault();
                    this.selectAll();
                }
                break;
            case "i":
            case "I":
                if (event.ctrlKey) {
                    event.preventDefault();
                    this.invertSelection();
                }
                break;
        }
    }

    /**
     * 处理键盘释放事件
     */
    private handleKeyUp(event: KeyboardEvent): void {
        // 可以在这里处理一些键盘释放的逻辑
    }

    /**
     * 显示选择提示
     */
    private showSelectionHint(message: string): void {
        const hint = globalThis.document.createElement("div");
        hint.id = "face-selection-hint";
        hint.textContent = message;
        hint.style.cssText = `
            position: fixed;
            top: 10px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 8px 16px;
            border-radius: 4px;
            font-size: 14px;
            z-index: 10000;
            pointer-events: none;
        `;
        globalThis.document.body.appendChild(hint);
    }

    /**
     * 隐藏选择提示
     */
    private hideSelectionHint(): void {
        const hint = globalThis.document.getElementById("face-selection-hint");
        if (hint) {
            hint.remove();
        }
    }

    /**
     * 显示面信息
     */
    private showFaceInfo(faceId: number): void {
        // 这里可以显示面的详细信息
        console.log(`Hovering face ${faceId}`);
    }

    /**
     * 隐藏面信息
     */
    private hideFaceInfo(): void {
        // 隐藏面信息显示
    }

    /**
     * 更新光标样式
     */
    private updateCursor(cursor: string): void {
        globalThis.document.body.style.cursor = cursor;
    }

    /**
     * 更新选择计数显示
     */
    private updateSelectionCounter(count: number): void {
        let counter = globalThis.document.getElementById("face-selection-counter");
        if (!counter && count > 0) {
            counter = globalThis.document.createElement("div");
            counter.id = "face-selection-counter";
            counter.style.cssText = `
                position: fixed;
                top: 50px;
                right: 20px;
                background: rgba(0, 123, 255, 0.9);
                color: white;
                padding: 6px 12px;
                border-radius: 4px;
                font-size: 12px;
                z-index: 10000;
                pointer-events: none;
            `;
            globalThis.document.body.appendChild(counter);
        }

        if (counter) {
            if (count > 0) {
                counter.textContent = `Selected: ${count} face${count > 1 ? "s" : ""}`;
                counter.style.display = "block";
            } else {
                counter.style.display = "none";
            }
        }
    }

    /**
     * 触发面选中事件
     */
    private triggerFaceSelected(faceId: number): void {
        this._onFaceSelected.forEach((callback) => callback(faceId));
    }

    /**
     * 触发面取消选中事件
     */
    private triggerFaceDeselected(faceId: number): void {
        this._onFaceDeselected.forEach((callback) => callback(faceId));
    }

    /**
     * 通知选择变更
     */
    private notifySelectionChanged(): void {
        const selectedFaces = this._manager.selectedFaces;
        this._onSelectionChanged.forEach((callback) => callback(selectedFaces));
    }

    /**
     * 销毁处理器
     */
    dispose(): void {
        this.deactivate();
        this.hideSelectionHint();

        // 清理3D视图事件监听器
        const canvas = (this as any)._canvas;
        if (canvas) {
            canvas.removeEventListener("click", this.handle3DViewClick.bind(this));
            canvas.removeEventListener("mousemove", this.handle3DViewMouseMove.bind(this));
        }

        // 清理键盘事件监听器
        globalThis.document.removeEventListener("keydown", this.handleKeyDown.bind(this));
        globalThis.document.removeEventListener("keyup", this.handleKeyUp.bind(this));

        // 清理回调数组
        this._onFaceSelected.length = 0;
        this._onFaceDeselected.length = 0;
        this._onSelectionChanged.length = 0;

        // 清理DOM元素
        const hint = globalThis.document.getElementById("face-selection-hint");
        if (hint) hint.remove();

        const counter = globalThis.document.getElementById("face-selection-counter");
        if (counter) counter.remove();
    }
}
