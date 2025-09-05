// Part of the Chili3d Project, under the AGPL-3.0 License.
// See LICENSE file in the project root for full license information.

import { IDocument, IDisposable, Id, VisualState, ShapeType } from "chili-core";
import { Annotation, AnnotationRecord, ValidationResult } from "./annotation";
import { AnnotationNode } from "./annotationNode";
import { MachiningFeatureType, getFeatureName } from "./featureTypes";

/**
 * 标注历史操作类型
 */
export type AnnotationAction =
    | { type: "create"; annotation: Annotation }
    | { type: "delete"; annotation: Annotation }
    | { type: "modify"; annotation: Annotation; changes: Record<string, any> }
    | { type: "addFaces"; annotation: Annotation; faceIds: number[] }
    | { type: "removeFaces"; annotation: Annotation; faceIds: number[] };

/**
 * 标注历史记录
 */
export class AnnotationHistory {
    private _actions: AnnotationAction[] = [];
    private _currentIndex: number = -1;
    private _maxSize: number = 100;

    /**
     * 记录操作
     */
    record(action: AnnotationAction): void {
        // 如果当前不在历史末尾，删除后续历史
        if (this._currentIndex < this._actions.length - 1) {
            this._actions.splice(this._currentIndex + 1);
        }

        this._actions.push(action);
        this._currentIndex = this._actions.length - 1;

        // 限制历史记录大小
        if (this._actions.length > this._maxSize) {
            this._actions.shift();
            this._currentIndex--;
        }
    }

    /**
     * 撤销操作
     */
    undo(): AnnotationAction | undefined {
        if (this._currentIndex >= 0) {
            const action = this._actions[this._currentIndex];
            this._currentIndex--;
            return action;
        }
        return undefined;
    }

    /**
     * 重做操作
     */
    redo(): AnnotationAction | undefined {
        if (this._currentIndex < this._actions.length - 1) {
            this._currentIndex++;
            return this._actions[this._currentIndex];
        }
        return undefined;
    }

    /**
     * 检查是否可以撤销
     */
    canUndo(): boolean {
        return this._currentIndex >= 0;
    }

    /**
     * 检查是否可以重做
     */
    canRedo(): boolean {
        return this._currentIndex < this._actions.length - 1;
    }

    /**
     * 清空历史
     */
    clear(): void {
        this._actions.length = 0;
        this._currentIndex = -1;
    }

    /**
     * 获取历史记录
     */
    getHistory(): AnnotationAction[] {
        return [...this._actions];
    }
}

/**
 * 标注验证器接口
 */
export interface IAnnotationValidator {
    validateFaces(annotation: Annotation, faceIds: number[]): ValidationResult;
    validateAnnotation(annotation: Annotation): ValidationResult;
    validateTopology(annotations: Annotation[]): ValidationResult;
}

/**
 * 默认标注验证器
 */
export class DefaultAnnotationValidator implements IAnnotationValidator {
    validateFaces(annotation: Annotation, faceIds: number[]): ValidationResult {
        const result: ValidationResult = {
            isValid: true,
            errors: [],
            warnings: [],
        };

        // 检查面ID有效性
        for (const faceId of faceIds) {
            if (faceId < 0 || !Number.isInteger(faceId)) {
                result.errors.push(`Invalid face ID: ${faceId}`);
                result.isValid = false;
            }
        }

        return result;
    }

    validateAnnotation(annotation: Annotation): ValidationResult {
        return annotation.validate();
    }

    validateTopology(annotations: Annotation[]): ValidationResult {
        const result: ValidationResult = {
            isValid: true,
            errors: [],
            warnings: [],
        };

        // 检查面唯一性（每个面只能属于一个标注）
        const faceToAnnotation = new Map<number, string>();

        for (const annotation of annotations) {
            for (const faceId of annotation.faces) {
                if (faceToAnnotation.has(faceId)) {
                    const conflictAnnotation = faceToAnnotation.get(faceId);
                    result.errors.push(
                        `Face ${faceId} is assigned to multiple annotations: ${annotation.name} and ${conflictAnnotation}`,
                    );
                    result.isValid = false;
                } else {
                    faceToAnnotation.set(faceId, annotation.name);
                }
            }
        }

        return result;
    }
}

/**
 * 标注管理器 - 负责管理所有标注实例
 */
export class AnnotationManager implements IDisposable {
    private _document: IDocument;
    private _annotations = new Map<string, AnnotationNode>();
    private _history = new AnnotationHistory();
    private _validator: IAnnotationValidator;
    private _disposed = false;
    private _currentUser = "default";
    private _selectedFaces = new Set<number>();
    private _activeAnnotation: AnnotationNode | undefined;

    // 存储面ID到视觉对象的映射
    private _faceVisualMap = new Map<number, { visual: any; faceIndex: number }>();

    // 事件回调
    private _onAnnotationCreated: ((node: AnnotationNode) => void)[] = [];
    private _onAnnotationDeleted: ((node: AnnotationNode) => void)[] = [];
    private _onAnnotationModified: ((node: AnnotationNode) => void)[] = [];
    private _onSelectionChanged: ((faceIds: number[]) => void)[] = [];

    constructor(document: IDocument, validator?: IAnnotationValidator) {
        this._document = document;
        this._validator = validator || new DefaultAnnotationValidator();
    }

    get document(): IDocument {
        return this._document;
    }

    get annotations(): AnnotationNode[] {
        return Array.from(this._annotations.values());
    }

    get activeAnnotation(): AnnotationNode | undefined {
        return this._activeAnnotation;
    }

    get selectedFaces(): number[] {
        return Array.from(this._selectedFaces);
    }

    get currentUser(): string {
        return this._currentUser;
    }

    set currentUser(user: string) {
        this._currentUser = user;
    }

    get canUndo(): boolean {
        return this._history.canUndo();
    }

    get canRedo(): boolean {
        return this._history.canRedo();
    }

    /**
     * 创建新标注
     */
    createAnnotation(type: MachiningFeatureType, name?: string): AnnotationNode {
        const annotation = new Annotation(
            type,
            name || this.generateAnnotationName(type),
            this._currentUser,
        );
        const node = new AnnotationNode(this._document, annotation);

        this._annotations.set(annotation.id, node);

        // 记录历史
        this._history.record({ type: "create", annotation });

        // 触发事件
        this._onAnnotationCreated.forEach((callback) => callback(node));

        return node;
    }

    /**
     * 删除标注
     */
    deleteAnnotation(annotationId: string): boolean {
        const node = this._annotations.get(annotationId);
        if (!node) {
            return false;
        }

        // 如果是活动标注，清除活动状态
        if (this._activeAnnotation?.annotation.id === annotationId) {
            this._activeAnnotation = undefined;
        }

        // 记录历史
        this._history.record({ type: "delete", annotation: node.annotation });

        // 移除标注
        this._annotations.delete(annotationId);

        // 释放资源
        node.dispose();

        // 触发事件
        this._onAnnotationDeleted.forEach((callback) => callback(node));

        return true;
    }

    /**
     * 获取标注
     */
    getAnnotation(annotationId: string): AnnotationNode | undefined {
        return this._annotations.get(annotationId);
    }

    /**
     * 根据面ID查找标注
     */
    getAnnotationByFace(faceId: number): AnnotationNode | undefined {
        for (const node of this._annotations.values()) {
            if (node.hasFace(faceId)) {
                return node;
            }
        }
        return undefined;
    }

    /**
     * 设置活动标注
     */
    setActiveAnnotation(annotationId: string | undefined): void {
        this._activeAnnotation = annotationId ? this._annotations.get(annotationId) : undefined;
    }

    /**
     * 选择面
     */
    selectFaces(faceIds: number[], append = false): void {
        if (!append) {
            this._selectedFaces.clear();
        }

        faceIds.forEach((id) => this._selectedFaces.add(id));

        // 触发选择变更事件
        this._onSelectionChanged.forEach((callback) => callback(this.selectedFaces));
    }

    /**
     * 取消选择面
     */
    deselectFaces(faceIds: number[]): void {
        faceIds.forEach((id) => this._selectedFaces.delete(id));

        // 触发选择变更事件
        this._onSelectionChanged.forEach((callback) => callback(this.selectedFaces));
    }

    /**
     * 清空面选择
     */
    clearSelection(): void {
        this._selectedFaces.clear();

        // 触发选择变更事件
        this._onSelectionChanged.forEach((callback) => callback([]));
    }

    /**
     * 更新面ID到视觉对象的映射
     */
    updateFaceVisualMapping(faceId: number, visual: any, faceIndex: number): void {
        this._faceVisualMap.set(faceId, { visual, faceIndex });
    }

    /**
     * 高亮标注的所有面
     */
    highlightAnnotationFaces(annotationId: string): void {
        const annotation = this._annotations.get(annotationId);
        if (!annotation) return;

        // 清除所有现有高亮
        this.clearAllHighlights();

        // 高亮标注的面
        annotation.annotation.faces.forEach((faceId) => {
            const faceVisual = this._faceVisualMap.get(faceId);
            if (faceVisual) {
                this._document.visual.highlighter.addState(
                    faceVisual.visual,
                    VisualState.faceColored,
                    ShapeType.Face,
                    faceVisual.faceIndex,
                );
            }
        });
    }

    /**
     * 清除所有面高亮
     */
    clearAllHighlights(): void {
        this._document.visual.highlighter.clear();
    }

    /**
     * 将选中面添加到活动标注
     */
    addSelectedFacesToActiveAnnotation(): boolean {
        console.log("[AnnotationManager] addSelectedFacesToActiveAnnotation called");
        console.log("Active annotation:", this._activeAnnotation?.annotation.name);
        console.log("Selected faces size:", this._selectedFaces.size);
        console.log("Selected face IDs:", Array.from(this._selectedFaces));

        if (!this._activeAnnotation || this._selectedFaces.size === 0) {
            console.log("Early return: no active annotation or no selected faces");
            return false;
        }

        const faceIds = Array.from(this._selectedFaces);
        console.log("Face IDs to add:", faceIds);
        console.log("Current annotation faces before adding:", this._activeAnnotation.annotation.faces);

        // 验证面
        const validationResult = this._validator.validateFaces(this._activeAnnotation.annotation, faceIds);
        console.log("Validation result:", validationResult);
        if (!validationResult.isValid) {
            console.warn("Face validation failed:", validationResult.errors);
            return false;
        }

        // 添加面
        console.log("Adding faces to annotation...");
        this._activeAnnotation.addFaces(faceIds);
        console.log("Faces after adding:", this._activeAnnotation.annotation.faces);

        // 记录历史
        this._history.record({
            type: "addFaces",
            annotation: this._activeAnnotation.annotation,
            faceIds,
        });

        // 清空选择
        console.log("Clearing selection...");
        this.clearSelection();

        // 触发事件
        console.log("Triggering modification events...");
        this._onAnnotationModified.forEach((callback) => callback(this._activeAnnotation!));

        console.log("addSelectedFacesToActiveAnnotation completed successfully");
        return true;
    }

    /**
     * 从活动标注中移除选中面
     */
    removeSelectedFacesFromActiveAnnotation(): boolean {
        if (!this._activeAnnotation || this._selectedFaces.size === 0) {
            return false;
        }

        const faceIds = Array.from(this._selectedFaces);

        // 移除面
        this._activeAnnotation.removeFaces(faceIds);

        // 记录历史
        this._history.record({
            type: "removeFaces",
            annotation: this._activeAnnotation.annotation,
            faceIds,
        });

        // 清空选择
        this.clearSelection();

        // 触发事件
        this._onAnnotationModified.forEach((callback) => callback(this._activeAnnotation!));

        return true;
    }

    /**
     * 撤销操作
     */
    undo(): boolean {
        const action = this._history.undo();
        if (!action) {
            return false;
        }

        this.executeUndoAction(action);
        return true;
    }

    /**
     * 重做操作
     */
    redo(): boolean {
        const action = this._history.redo();
        if (!action) {
            return false;
        }

        this.executeRedoAction(action);
        return true;
    }

    /**
     * 验证所有标注
     */
    validateAll(): ValidationResult {
        const annotations = Array.from(this._annotations.values()).map((node) => node.annotation);
        return this._validator.validateTopology(annotations);
    }

    /**
     * 获取标注统计信息
     */
    getStatistics() {
        const stats = {
            totalAnnotations: this._annotations.size,
            totalFaces: 0,
            annotatedFaces: 0,
            featureTypes: new Map<MachiningFeatureType, number>(),
            validatedAnnotations: 0,
        };

        for (const node of this._annotations.values()) {
            stats.annotatedFaces += node.faceCount;

            const type = node.featureType;
            stats.featureTypes.set(type, (stats.featureTypes.get(type) || 0) + 1);

            if (node.validated) {
                stats.validatedAnnotations++;
            }
        }

        return stats;
    }

    // 事件订阅方法
    onAnnotationCreated(callback: (node: AnnotationNode) => void): void {
        this._onAnnotationCreated.push(callback);
    }

    onAnnotationDeleted(callback: (node: AnnotationNode) => void): void {
        this._onAnnotationDeleted.push(callback);
    }

    onAnnotationModified(callback: (node: AnnotationNode) => void): void {
        this._onAnnotationModified.push(callback);
    }

    onSelectionChanged(callback: (faceIds: number[]) => void): void {
        this._onSelectionChanged.push(callback);
    }

    /**
     * 生成标注名称
     */
    private generateAnnotationName(type: MachiningFeatureType): string {
        const baseName = getFeatureName(type);
        let counter = 1;
        let name = `${baseName}_${counter}`;

        while (this.hasAnnotationWithName(name)) {
            counter++;
            name = `${baseName}_${counter}`;
        }

        return name;
    }

    /**
     * 检查是否存在指定名称的标注
     */
    private hasAnnotationWithName(name: string): boolean {
        for (const node of this._annotations.values()) {
            if (node.annotation.name === name) {
                return true;
            }
        }
        return false;
    }

    /**
     * 执行撤销操作
     */
    private executeUndoAction(action: AnnotationAction): void {
        // TODO: 实现具体的撤销逻辑
        switch (action.type) {
            case "create":
                // 撤销创建：删除标注
                this._annotations.delete(action.annotation.id);
                break;
            case "delete":
                // 撤销删除：恢复标注
                // 注意：这里需要更复杂的逻辑来恢复删除的标注
                break;
            // 其他操作类型...
        }
    }

    /**
     * 执行重做操作
     */
    private executeRedoAction(action: AnnotationAction): void {
        // TODO: 实现具体的重做逻辑
        switch (action.type) {
            case "create":
                // 重做创建：重新添加标注
                const node = new AnnotationNode(this._document, action.annotation);
                this._annotations.set(action.annotation.id, node);
                break;
            case "delete":
                // 重做删除：删除标注
                this._annotations.delete(action.annotation.id);
                break;
            // 其他操作类型...
        }
    }

    /**
     * 释放资源
     */
    dispose(): void {
        if (!this._disposed) {
            // 清理所有标注
            for (const node of this._annotations.values()) {
                node.dispose();
            }
            this._annotations.clear();

            // 清理历史
            this._history.clear();

            // 清理事件回调
            this._onAnnotationCreated.length = 0;
            this._onAnnotationDeleted.length = 0;
            this._onAnnotationModified.length = 0;
            this._onSelectionChanged.length = 0;

            this._disposed = true;
        }
    }

    get isDisposed(): boolean {
        return this._disposed;
    }
}
