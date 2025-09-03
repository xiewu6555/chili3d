// Part of the Chili3d Project, under the AGPL-3.0 License.
// See LICENSE file in the project root for full license information.

import { IDisposable, Id } from "chili-core";
import { MachiningFeatureType } from "./featureTypes";

/**
 * 几何参数接口
 */
export interface GeometricParams {
    diameter?: number;
    depth?: number;
    width?: number;
    height?: number;
    length?: number;
    axis?: [number, number, number];
    center?: [number, number, number];
    angle?: number;
    radius?: number;
    [key: string]: any; // 允许动态属性访问
}

/**
 * 公差规范接口
 */
export interface ToleranceSpec {
    tolerance?: string; // 如 "H7", "IT6"等
    surfaceFinish?: string; // 表面粗糙度，如 "Ra1.6"
    geometricTolerance?: string; // 几何公差
    notes?: string; // 备注
}

/**
 * 标注元数据接口
 */
export interface AnnotationMetadata {
    annotator: string; // 标注员ID
    timestamp: Date; // 标注时间
    confidence?: number; // 置信度 (0-1)
    notes?: string; // 标注说明
    validated?: boolean; // 是否已验证
    validator?: string; // 验证员ID
}

/**
 * 标注记录接口 - 用于历史追踪
 */
export interface AnnotationRecord {
    operation: "create" | "modify" | "delete" | "validate";
    timestamp: Date;
    user: string;
    changes: Record<string, any>;
    previousState?: any;
}

/**
 * 验证结果接口
 */
export interface ValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
}

/**
 * 标注实例类
 */
export class Annotation implements IDisposable {
    readonly id: string;
    private _type: MachiningFeatureType;
    private _name: string;
    private _faces: Set<number>;
    private _geometricParams: GeometricParams;
    private _toleranceSpec: ToleranceSpec;
    private _metadata: AnnotationMetadata;
    private _history: AnnotationRecord[];
    private _disposed: boolean = false;

    constructor(type: MachiningFeatureType, name?: string, annotator?: string) {
        this.id = Id.generate();
        this._type = type;
        this._name = name || `${type}_${this.id.slice(-8)}`;
        this._faces = new Set();
        this._geometricParams = {};
        this._toleranceSpec = {};
        this._metadata = {
            annotator: annotator || "unknown",
            timestamp: new Date(),
            confidence: 1.0,
            validated: false,
        };
        this._history = [
            {
                operation: "create",
                timestamp: new Date(),
                user: this._metadata.annotator,
                changes: { type, name: this._name },
            },
        ];
    }

    get type(): MachiningFeatureType {
        return this._type;
    }

    set type(value: MachiningFeatureType) {
        if (this._type !== value) {
            const oldType = this._type;
            this._type = value;
            this.recordChange("modify", { type: { from: oldType, to: value } });
        }
    }

    get name(): string {
        return this._name;
    }

    set name(value: string) {
        if (this._name !== value) {
            const oldName = this._name;
            this._name = value;
            this.recordChange("modify", { name: { from: oldName, to: value } });
        }
    }

    get faces(): number[] {
        return Array.from(this._faces);
    }

    get faceCount(): number {
        return this._faces.size;
    }

    get geometricParams(): GeometricParams {
        return { ...this._geometricParams };
    }

    set geometricParams(params: GeometricParams) {
        const oldParams = { ...this._geometricParams };
        this._geometricParams = { ...params };
        this.recordChange("modify", { geometricParams: { from: oldParams, to: params } });
    }

    get toleranceSpec(): ToleranceSpec {
        return { ...this._toleranceSpec };
    }

    set toleranceSpec(spec: ToleranceSpec) {
        const oldSpec = { ...this._toleranceSpec };
        this._toleranceSpec = { ...spec };
        this.recordChange("modify", { toleranceSpec: { from: oldSpec, to: spec } });
    }

    get metadata(): AnnotationMetadata {
        return { ...this._metadata };
    }

    get history(): AnnotationRecord[] {
        return [...this._history];
    }

    get isDisposed(): boolean {
        return this._disposed;
    }

    /**
     * 添加面到标注
     */
    addFaces(faceIds: number | number[]): void {
        const ids = Array.isArray(faceIds) ? faceIds : [faceIds];
        const addedFaces: number[] = [];

        ids.forEach((id) => {
            if (!this._faces.has(id)) {
                this._faces.add(id);
                addedFaces.push(id);
            }
        });

        if (addedFaces.length > 0) {
            this.recordChange("modify", { addedFaces });
        }
    }

    /**
     * 从标注中移除面
     */
    removeFaces(faceIds: number | number[]): void {
        const ids = Array.isArray(faceIds) ? faceIds : [faceIds];
        const removedFaces: number[] = [];

        ids.forEach((id) => {
            if (this._faces.has(id)) {
                this._faces.delete(id);
                removedFaces.push(id);
            }
        });

        if (removedFaces.length > 0) {
            this.recordChange("modify", { removedFaces });
        }
    }

    /**
     * 检查面是否属于此标注
     */
    hasFace(faceId: number): boolean {
        return this._faces.has(faceId);
    }

    /**
     * 清空所有面
     */
    clearFaces(): void {
        if (this._faces.size > 0) {
            const removedFaces = Array.from(this._faces);
            this._faces.clear();
            this.recordChange("modify", { clearedFaces: removedFaces });
        }
    }

    /**
     * 验证标注
     */
    validate(validator?: string): ValidationResult {
        const result: ValidationResult = {
            isValid: true,
            errors: [],
            warnings: [],
        };

        // 基本验证
        if (this._faces.size === 0) {
            result.errors.push("No faces assigned to this annotation");
            result.isValid = false;
        }

        if (!this._name.trim()) {
            result.errors.push("Annotation name is empty");
            result.isValid = false;
        }

        // 记录验证结果
        this._metadata.validated = result.isValid;
        if (validator) {
            this._metadata.validator = validator;
        }

        this.recordChange("validate", {
            validationResult: result,
            validator: validator || "system",
        });

        return result;
    }

    /**
     * 设置置信度
     */
    setConfidence(confidence: number): void {
        if (confidence < 0 || confidence > 1) {
            throw new Error("Confidence must be between 0 and 1");
        }

        const oldConfidence = this._metadata.confidence;
        this._metadata.confidence = confidence;
        this.recordChange("modify", {
            confidence: { from: oldConfidence, to: confidence },
        });
    }

    /**
     * 添加注释
     */
    addNote(note: string, user?: string): void {
        const oldNotes = this._metadata.notes;
        this._metadata.notes = oldNotes ? `${oldNotes}\n${note}` : note;
        this.recordChange("modify", {
            note: { added: note, user: user || "unknown" },
        });
    }

    /**
     * 克隆标注
     */
    clone(): Annotation {
        const clone = new Annotation(this._type, `${this._name}_copy`, this._metadata.annotator);

        clone._faces = new Set(this._faces);
        clone._geometricParams = { ...this._geometricParams };
        clone._toleranceSpec = { ...this._toleranceSpec };

        return clone;
    }

    /**
     * 导出为JSON对象
     */
    toJSON(): any {
        return {
            id: this.id,
            type: this._type,
            name: this._name,
            faces: this.faces,
            geometricParams: this._geometricParams,
            toleranceSpec: this._toleranceSpec,
            metadata: this._metadata,
            history: this._history,
        };
    }

    /**
     * 记录变更历史
     */
    private recordChange(operation: AnnotationRecord["operation"], changes: Record<string, any>): void {
        this._history.push({
            operation,
            timestamp: new Date(),
            user: this._metadata.annotator,
            changes,
        });
    }

    /**
     * 释放资源
     */
    dispose(): void {
        if (!this._disposed) {
            this._faces.clear();
            this._history.length = 0;
            this._disposed = true;
        }
    }
}
