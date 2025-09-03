// Part of the Chili3d Project, under the AGPL-3.0 License.
// See LICENSE file in the project root for full license information.

import { AnnotationNode } from "../annotationNode";
import { BaseAnnotationExporter, ExportConfig } from "./baseExporter";

/**
 * AAGNet格式导出器
 * 支持导出为AAGNet/MFInstSeg标准格式
 */
export class AAGNetExporter extends BaseAnnotationExporter {
    constructor(config: ExportConfig = {}) {
        super({ ...config, format: "aagnet" });
    }

    /**
     * 导出为AAGNet格式
     * 格式: [["filename", { "seg": {...}, "inst": [[...]], "bottom": {...} }]]
     */
    export(annotations: AnnotationNode[], modelFileName: string, totalFaceCount: number): any {
        // 构建语义分割标签
        const seg = this.buildSemanticLabels(annotations);

        // 构建实例分割矩阵
        const inst = this.buildInstanceMatrix(annotations, totalFaceCount);

        // 构建底面标签
        const bottom = this.buildBottomLabels(annotations, totalFaceCount);

        const labelData = {
            seg,
            inst,
            bottom,
        };

        // AAGNet格式需要包装在数组中，第一个元素是文件名，第二个是标签数据
        return [[modelFileName, labelData]];
    }

    /**
     * 验证AAGNet格式数据
     */
    validate(exportedData: any): { isValid: boolean; errors: string[] } {
        const errors: string[] = [];

        // 检查顶层结构
        if (!Array.isArray(exportedData)) {
            errors.push("Root data must be an array");
            return { isValid: false, errors };
        }

        if (exportedData.length !== 1) {
            errors.push("Root array must contain exactly one element");
            return { isValid: false, errors };
        }

        const [entry] = exportedData;
        if (!Array.isArray(entry) || entry.length !== 2) {
            errors.push("Entry must be an array with filename and data");
            return { isValid: false, errors };
        }

        const [filename, labelData] = entry;
        if (typeof filename !== "string") {
            errors.push("Filename must be a string");
        }

        if (!labelData || typeof labelData !== "object") {
            errors.push("Label data must be an object");
            return { isValid: false, errors };
        }

        // 检查必需字段
        const requiredFields = ["seg", "inst", "bottom"];
        for (const field of requiredFields) {
            if (!(field in labelData)) {
                errors.push(`Missing required field: ${field}`);
            }
        }

        // 验证seg字段
        if ("seg" in labelData && typeof labelData.seg !== "object") {
            errors.push("'seg' field must be an object");
        }

        // 验证inst字段
        if ("inst" in labelData) {
            if (!Array.isArray(labelData.inst)) {
                errors.push("'inst' field must be an array");
            } else {
                // 检查矩阵是否为方阵
                const matrix = labelData.inst;
                if (matrix.length > 0) {
                    const size = matrix.length;
                    for (let i = 0; i < size; i++) {
                        if (!Array.isArray(matrix[i]) || matrix[i].length !== size) {
                            errors.push(`Instance matrix row ${i} has invalid size`);
                        }
                    }
                }
            }
        }

        // 验证bottom字段
        if ("bottom" in labelData && typeof labelData.bottom !== "object") {
            errors.push("'bottom' field must be an object");
        }

        return { isValid: errors.length === 0, errors };
    }

    protected getFormatName(): string {
        return "AAGNet/MFInstSeg";
    }

    /**
     * 构建实例分割邻接矩阵
     */
    private buildInstanceMatrix(annotations: AnnotationNode[], totalFaceCount: number): number[][] {
        // 初始化矩阵
        const matrix: number[][] = Array(totalFaceCount)
            .fill(0)
            .map(() => Array(totalFaceCount).fill(0));

        // 对角线设为1（每个面与自己相邻）
        for (let i = 0; i < totalFaceCount; i++) {
            matrix[i][i] = 1;
        }

        // 为每个标注实例的面之间建立连接
        for (const annotation of annotations) {
            const faces = annotation.faces;

            // 在同一实例的所有面之间建立连接
            for (let i = 0; i < faces.length; i++) {
                for (let j = 0; j < faces.length; j++) {
                    if (i !== j && faces[i] < totalFaceCount && faces[j] < totalFaceCount) {
                        matrix[faces[i]][faces[j]] = 1;
                        matrix[faces[j]][faces[i]] = 1; // 确保矩阵对称
                    }
                }
            }
        }

        return matrix;
    }
}
