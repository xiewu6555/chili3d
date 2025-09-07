// Part of the Chili3d Project, under the AGPL-3.0 License.
// See LICENSE file in the project root for full license information.

import { AnnotationNode } from "../annotationNode";

/**
 * 导出基类接口
 */
export interface IAnnotationExporter {
    /**
     * 导出标注数据
     * @param annotations 标注列表
     * @param modelFileName 模型文件名（不包含扩展名）
     * @param totalFaceCount 模型总面数
     */
    export(annotations: AnnotationNode[], modelFileName: string, totalFaceCount: number): any;

    /**
     * 导出为JSON字符串
     */
    exportToJSON(annotations: AnnotationNode[], modelFileName: string, totalFaceCount: number): string;

    /**
     * 验证导出数据
     */
    validate(exportedData: any): { isValid: boolean; errors: string[] };
}

/**
 * 导出配置接口
 */
export interface ExportConfig {
    includeMetadata?: boolean;
    includeHistory?: boolean;
    compressOutput?: boolean;
    validateOutput?: boolean;
    format?: "aagnet" | "mftrcad";
}

/**
 * 导出结果接口
 */
export interface ExportResult {
    success: boolean;
    data?: any;
    errors: string[];
    warnings: string[];
    metadata: {
        exportTime: Date;
        format: string;
        annotationCount: number;
        faceCount: number;
        exportPath?: string;
        fileName?: string;
    };
}

/**
 * 抽象导出基类
 */
export abstract class BaseAnnotationExporter implements IAnnotationExporter {
    protected config: ExportConfig;

    constructor(config: ExportConfig = {}) {
        this.config = {
            includeMetadata: true,
            includeHistory: false,
            compressOutput: false,
            validateOutput: true,
            ...config,
        };
    }

    abstract export(annotations: AnnotationNode[], modelFileName: string, totalFaceCount: number): any;

    exportToJSON(annotations: AnnotationNode[], modelFileName: string, totalFaceCount: number): string {
        const data = this.export(annotations, modelFileName, totalFaceCount);
        return this.config.compressOutput ? JSON.stringify(data) : JSON.stringify(data, null, 2);
    }

    abstract validate(exportedData: any): { isValid: boolean; errors: string[] };

    /**
     * 执行导出并返回完整结果
     */
    exportWithResult(
        annotations: AnnotationNode[],
        modelFileName: string,
        totalFaceCount: number,
    ): ExportResult {
        const result: ExportResult = {
            success: false,
            errors: [],
            warnings: [],
            metadata: {
                exportTime: new Date(),
                format: this.getFormatName(),
                annotationCount: annotations.length,
                faceCount: totalFaceCount,
            },
        };

        try {
            // 导出数据
            const data = this.export(annotations, modelFileName, totalFaceCount);
            result.data = data;

            // 验证导出数据
            if (this.config.validateOutput) {
                const validation = this.validate(data);
                if (!validation.isValid) {
                    result.errors = validation.errors;
                    return result;
                }
            }

            result.success = true;
        } catch (error) {
            result.errors.push(`Export failed: ${error}`);
        }

        return result;
    }

    /**
     * 获取格式名称
     */
    protected abstract getFormatName(): string;

    /**
     * 构建语义分割标签
     */
    protected buildSemanticLabels(annotations: AnnotationNode[]): Record<string, number> {
        const labels: Record<string, number> = {};

        for (const annotation of annotations) {
            for (const faceId of annotation.faces) {
                labels[faceId.toString()] = annotation.featureType;
            }
        }

        return labels;
    }

    /**
     * 构建底面标签
     */
    protected buildBottomLabels(
        annotations: AnnotationNode[],
        totalFaceCount: number,
    ): Record<string, number> {
        const labels: Record<string, number> = {};

        // 初始化所有面为非底面
        for (let i = 0; i < totalFaceCount; i++) {
            labels[i.toString()] = 0;
        }

        // 标记底面
        for (const annotation of annotations) {
            // 这里需要根据具体的底面识别逻辑来标记
            // 目前暂时标记每个特征的第一个面为底面作为示例
            if (annotation.faces.length > 0) {
                const firstFace = annotation.faces[0];
                labels[firstFace.toString()] = 1;
            }
        }

        return labels;
    }

    /**
     * 验证面ID有效性
     */
    protected validateFaceIds(annotations: AnnotationNode[], totalFaceCount: number): string[] {
        const errors: string[] = [];
        const usedFaces = new Set<number>();

        for (const annotation of annotations) {
            for (const faceId of annotation.faces) {
                // 检查面ID范围
                if (faceId < 0 || faceId >= totalFaceCount) {
                    errors.push(`Face ID ${faceId} is out of range [0, ${totalFaceCount - 1}]`);
                }

                // 检查面重复使用
                if (usedFaces.has(faceId)) {
                    errors.push(`Face ID ${faceId} is used by multiple annotations`);
                } else {
                    usedFaces.add(faceId);
                }
            }
        }

        return errors;
    }
}
