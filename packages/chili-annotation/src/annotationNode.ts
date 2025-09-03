// Part of the Chili3d Project, under the AGPL-3.0 License.
// See LICENSE file in the project root for full license information.

import { IDocument, Node, Property, Serializer } from "chili-core";
import { Annotation, GeometricParams, ToleranceSpec } from "./annotation";
import { MachiningFeatureType, FEATURE_NAMES_EN, getFeatureName, getFeatureColor } from "./featureTypes";

/**
 * 标注节点类 - 扩展chili3d的Node系统以支持标注功能
 */
export class AnnotationNode extends Node {
    private _annotation: Annotation;

    constructor(document: IDocument, annotation: Annotation) {
        super(document, annotation.name, annotation.id);
        this._annotation = annotation;
    }

    /**
     * 获取标注对象
     */
    get annotation(): Annotation {
        return this._annotation;
    }

    /**
     * 特征类型
     */
    @Serializer.serialze()
    @Property.define("annotation.featureType" as any)
    get featureType(): MachiningFeatureType {
        return this._annotation.type;
    }

    set featureType(value: MachiningFeatureType) {
        this._annotation.type = value;
        (this as any).onPropertyChanged?.((key: any) => key === "featureType");
    }

    /**
     * 特征名称
     */
    @Serializer.serialze()
    @Property.define("annotation.featureName" as any)
    get featureName(): string {
        return FEATURE_NAMES_EN[this._annotation.type] || "Unknown";
    }

    /**
     * 特征颜色
     */
    get featureColor(): string {
        return getFeatureColor(this._annotation.type);
    }

    /**
     * 关联的面ID列表
     */
    @Serializer.serialze()
    @Property.define("annotation.faces" as any)
    get faces(): number[] {
        return this._annotation.faces;
    }

    /**
     * 面数量
     */
    get faceCount(): number {
        return this._annotation.faces.length;
    }

    /**
     * 几何参数
     */
    @Serializer.serialze()
    @Property.define("annotation.geometricParams" as any)
    get geometricParams(): GeometricParams {
        return this._annotation.geometricParams;
    }

    set geometricParams(params: GeometricParams) {
        this._annotation.geometricParams = params;
        (this as any).onPropertyChanged?.((key: any) => key === "geometricParams");
    }

    /**
     * 公差规范
     */
    @Serializer.serialze()
    @Property.define("annotation.toleranceSpec" as any)
    get toleranceSpec(): ToleranceSpec {
        return this._annotation.toleranceSpec;
    }

    set toleranceSpec(spec: ToleranceSpec) {
        this._annotation.toleranceSpec = spec;
        (this as any).onPropertyChanged?.((key: any) => key === "toleranceSpec");
    }

    /**
     * 置信度
     */
    @Property.define("annotation.confidence" as any)
    get confidence(): number {
        return this._annotation.metadata.confidence || 1.0;
    }

    set confidence(value: number) {
        this._annotation.setConfidence(value);
        (this as any).onPropertyChanged?.((key: any) => key === "confidence");
    }

    /**
     * 是否已验证
     */
    @Property.define("annotation.validated" as any)
    get validated(): boolean {
        return this._annotation.metadata.validated || false;
    }

    /**
     * 标注员
     */
    @Property.define("annotation.annotator" as any)
    get annotator(): string {
        return this._annotation.metadata.annotator;
    }

    /**
     * 标注时间
     */
    @Property.define("annotation.timestamp" as any)
    get timestamp(): Date {
        return this._annotation.metadata.timestamp;
    }

    /**
     * 添加面到标注
     */
    addFaces(faceIds: number | number[]): void {
        this._annotation.addFaces(faceIds);
        (this as any).onPropertyChanged?.((key: any) => key === "faces");
        this.onAnnotationChanged();
    }

    /**
     * 从标注中移除面
     */
    removeFaces(faceIds: number | number[]): void {
        this._annotation.removeFaces(faceIds);
        (this as any).onPropertyChanged?.((key: any) => key === "faces");
        this.onAnnotationChanged();
    }

    /**
     * 检查面是否属于此标注
     */
    hasFace(faceId: number): boolean {
        return this._annotation.faces.includes(faceId);
    }

    /**
     * 清空所有面
     */
    clearFaces(): void {
        this._annotation.clearFaces();
        (this as any).onPropertyChanged?.((key: any) => key === "faces");
        this.onAnnotationChanged();
    }

    /**
     * 验证标注
     */
    validate(validator?: string) {
        const result = this._annotation.validate(validator);
        (this as any).onPropertyChanged?.((key: any) => key === "validated");
        return result;
    }

    /**
     * 添加注释
     */
    addNote(note: string, user?: string): void {
        this._annotation.addNote(note, user);
        (this as any).onPropertyChanged?.((key: any) => key === "notes");
    }

    /**
     * 获取标注历史
     */
    getHistory() {
        return this._annotation.history;
    }

    /**
     * 导出为JSON
     */
    exportToJSON(): any {
        return this._annotation.toJSON();
    }

    /**
     * 克隆节点
     */
    override clone(): this {
        const clonedAnnotation = this._annotation.clone();
        const clonedNode = new AnnotationNode(this.document, clonedAnnotation);
        return clonedNode as this;
    }

    /**
     * 标注变更事件处理
     */
    protected onAnnotationChanged(): void {
        // 触发3D视图更新
        this.document.visual.update();

        // 可以在这里添加其他变更响应逻辑
        // 比如更新UI、保存状态等
    }

    /**
     * 可见性变更处理
     */
    protected onVisibleChanged(): void {
        // 更新3D视图中标注的显示状态
        this.updateVisualization();
    }

    /**
     * 父可见性变更处理
     */
    protected onParentVisibleChanged(): void {
        this.updateVisualization();
    }

    /**
     * 更新可视化
     */
    private updateVisualization(): void {
        const shouldShow = this.visible && this.parentVisible;

        // 这里可以调用Three.js相关的显示/隐藏逻辑
        // 具体实现需要与chili-three包集成
        if (shouldShow) {
            this.showAnnotationVisualization();
        } else {
            this.hideAnnotationVisualization();
        }
    }

    /**
     * 显示标注可视化
     */
    private showAnnotationVisualization(): void {
        // TODO: 实现3D视图中的标注显示
        // 需要与chili-three包集成，高亮显示相关面
    }

    /**
     * 隐藏标注可视化
     */
    private hideAnnotationVisualization(): void {
        // TODO: 实现3D视图中的标注隐藏
        // 需要与chili-three包集成，取消高亮显示
    }

    /**
     * 释放资源
     */
    override disposeInternal(): void {
        this._annotation.dispose();
        super.disposeInternal();
    }
}
