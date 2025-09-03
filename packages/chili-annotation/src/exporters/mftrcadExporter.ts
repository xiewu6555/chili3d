// Part of the Chili3d Project, under the AGPL-3.0 License.
// See LICENSE file in the project root for full license information.

import { AnnotationNode } from "../annotationNode";
import { BaseAnnotationExporter, ExportConfig } from "./baseExporter";

/**
 * MFTRCAD格式导出器
 * 支持导出为MFTReNet项目使用的格式
 */
export class MFTRCADExporter extends BaseAnnotationExporter {
    constructor(config: ExportConfig = {}) {
        super({ ...config, format: "mftrcad" });
    }

    /**
     * 导出为MFTRCAD格式
     * 格式: { "cls": {...}, "seg": [[...], ...], "bottom": {...} }
     */
    export(annotations: AnnotationNode[], modelFileName: string, totalFaceCount: number): any {
        // 构建语义分割标签（使用'cls'字段名）
        const cls = this.buildSemanticLabels(annotations);

        // 构建实例分割列表
        const seg = this.buildInstanceSegmentation(annotations);

        // 构建底面标签
        const bottom = this.buildBottomLabels(annotations, totalFaceCount);

        const labelData = {
            cls,
            seg,
            bottom,
        };

        return labelData;
    }

    /**
     * 验证MFTRCAD格式数据
     */
    validate(exportedData: any): { isValid: boolean; errors: string[] } {
        const errors: string[] = [];

        if (!exportedData || typeof exportedData !== "object") {
            errors.push("Data must be an object");
            return { isValid: false, errors };
        }

        // 检查必需字段
        const requiredFields = ["cls", "seg", "bottom"];
        for (const field of requiredFields) {
            if (!(field in exportedData)) {
                errors.push(`Missing required field: ${field}`);
            }
        }

        // 验证cls字段
        if ("cls" in exportedData && typeof exportedData.cls !== "object") {
            errors.push("'cls' field must be an object");
        }

        // 验证seg字段
        if ("seg" in exportedData) {
            if (!Array.isArray(exportedData.seg)) {
                errors.push("'seg' field must be an array");
            } else {
                // 检查每个实例是否为数组
                for (let i = 0; i < exportedData.seg.length; i++) {
                    if (!Array.isArray(exportedData.seg[i])) {
                        errors.push(`Instance ${i} in 'seg' must be an array`);
                    }
                }
            }
        }

        // 验证bottom字段
        if ("bottom" in exportedData && typeof exportedData.bottom !== "object") {
            errors.push("'bottom' field must be an object");
        }

        return { isValid: errors.length === 0, errors };
    }

    protected getFormatName(): string {
        return "MFTRCAD";
    }

    /**
     * 构建实例分割列表
     * 每个数组元素代表一个实例，包含该实例的所有面ID
     */
    private buildInstanceSegmentation(annotations: AnnotationNode[]): number[][] {
        const instances: number[][] = [];

        // 为每个标注创建一个实例
        for (const annotation of annotations) {
            if (annotation.faces.length > 0) {
                instances.push([...annotation.faces]);
            }
        }

        // 填充空实例槽位以达到预期的数组大小
        // 这样做是为了保持与原始MFTRCAD格式的兼容性
        const maxInstances = Math.max(annotations.length, 10); // 至少10个槽位
        while (instances.length < maxInstances) {
            instances.push([]); // 空实例
        }

        return instances;
    }

    /**
     * 导出拓扑关系（如果配置中启用）
     * 这是MFTRCAD格式的扩展功能
     */
    exportRelations(annotations: AnnotationNode[], relations?: Array<[string, number[]]>): any {
        if (!relations || relations.length === 0) {
            return { relation: [] };
        }

        // 转换关系格式
        const relationData: Array<[string, number[]]> = [];

        for (const [relationType, instanceIds] of relations) {
            if (instanceIds.length >= 2) {
                relationData.push([relationType, instanceIds]);
            }
        }

        return { relation: relationData };
    }

    /**
     * 导出完整的MFTRCAD数据（包括关系）
     */
    exportWithRelations(
        annotations: AnnotationNode[],
        modelFileName: string,
        totalFaceCount: number,
        relations?: Array<[string, number[]]>,
    ): { labels: any; relations?: any } {
        const labels = this.export(annotations, modelFileName, totalFaceCount);
        const result: { labels: any; relations?: any } = { labels };

        if (relations && relations.length > 0) {
            result.relations = this.exportRelations(annotations, relations);
        }

        return result;
    }

    /**
     * 从MFTRCAD格式转换为AAGNet格式
     */
    static convertToAAGNet(mftrcadData: any, modelFileName: string, totalFaceCount: number): any {
        if (!mftrcadData.cls || !mftrcadData.seg || !mftrcadData.bottom) {
            throw new Error("Invalid MFTRCAD data format");
        }

        // 转换语义分割标签
        const seg = { ...mftrcadData.cls };

        // 转换实例分割：从列表格式转换为邻接矩阵
        const inst = MFTRCADExporter.buildInstanceMatrixFromList(mftrcadData.seg, totalFaceCount);

        // 底面标签保持不变
        const bottom = { ...mftrcadData.bottom };

        return [[modelFileName, { seg, inst, bottom }]];
    }

    /**
     * 从实例列表构建邻接矩阵
     */
    private static buildInstanceMatrixFromList(instances: number[][], totalFaceCount: number): number[][] {
        // 初始化矩阵
        const matrix: number[][] = Array(totalFaceCount)
            .fill(0)
            .map(() => Array(totalFaceCount).fill(0));

        // 对角线设为1
        for (let i = 0; i < totalFaceCount; i++) {
            matrix[i][i] = 1;
        }

        // 为每个实例的面之间建立连接
        for (const instance of instances) {
            if (instance.length <= 1) continue;

            for (let i = 0; i < instance.length; i++) {
                for (let j = 0; j < instance.length; j++) {
                    if (i !== j) {
                        const face1 = instance[i];
                        const face2 = instance[j];
                        if (face1 < totalFaceCount && face2 < totalFaceCount) {
                            matrix[face1][face2] = 1;
                            matrix[face2][face1] = 1;
                        }
                    }
                }
            }
        }

        return matrix;
    }
}
