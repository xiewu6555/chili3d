// Part of the Chili3d Project, under the AGPL-3.0 License.
// See LICENSE file in the project root for full license information.

import { AnnotationNode } from "../annotationNode";
import { BaseAnnotationExporter, ExportConfig } from "./baseExporter";
import { MachiningFeatureType } from "../featureTypes";

/**
 * 标注快照接口 - 用于确保导出过程中数据一致性
 */
interface AnnotationSnapshot {
    id: string;
    faces: number[];
    featureType: MachiningFeatureType;
    name: string;
}

/**
 * 数据一致性验证结果
 */
interface ConsistencyValidation {
    isConsistent: boolean;
    errors: string[];
    warnings: string[];
    clsFaces: Set<number>;
    segFaces: Set<number>;
    missingInSeg: number[];
    missingInCls: number[];
}

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
        console.log("🔧 [MFTRCAD Export] Starting export process...", {
            annotationCount: annotations.length,
            modelFileName,
            totalFaceCount,
        });

        // 创建标注数据快照，确保导出过程中数据一致性
        const annotationSnapshot = this.createAnnotationSnapshot(annotations);

        console.log(
            "📸 [MFTRCAD Export] Annotation snapshot created:",
            annotationSnapshot.map((a) => ({
                id: a.id.slice(-8),
                name: a.name,
                featureType: a.featureType,
                faceCount: a.faces.length,
                faces: a.faces,
            })),
        );

        // 使用快照构建各个字段
        const cls = this.buildSemanticLabelsFromSnapshot(annotationSnapshot);
        const seg = this.buildInstanceSegmentationFromSnapshot(annotationSnapshot);
        const bottom = this.buildBottomLabels(annotations, totalFaceCount);

        // 验证数据一致性
        const consistencyCheck = this.validateConsistency(cls, seg);

        if (!consistencyCheck.isConsistent) {
            console.error("❌ [MFTRCAD Export] Data consistency validation failed:", consistencyCheck);

            // 在开发环境中抛出错误，生产环境中记录警告
            if (process.env["NODE_ENV"] === "development") {
                throw new Error(`MFTRCAD export data inconsistency: ${consistencyCheck.errors.join(", ")}`);
            }
        } else {
            console.log("✅ [MFTRCAD Export] Data consistency validation passed");
        }

        const labelData = {
            cls,
            seg,
            bottom,
            // 添加调试信息（可选）
            ...(process.env["NODE_ENV"] === "development" && {
                _debug: {
                    consistencyCheck,
                    snapshotInfo: {
                        totalAnnotations: annotationSnapshot.length,
                        totalFacesInCls: Object.keys(cls).length,
                        totalInstancesInSeg: seg.filter((instance) => instance.length > 0).length,
                    },
                },
            }),
        };

        console.log("🎯 [MFTRCAD Export] Export completed successfully:", {
            clsEntries: Object.keys(cls).length,
            segInstances: seg.length,
            nonEmptyInstances: seg.filter((s) => s.length > 0).length,
        });

        return labelData;
    }

    /**
     * 验证MFTRCAD格式数据
     */
    validate(exportedData: any): { isValid: boolean; errors: string[] } {
        console.log("🔍 [MFTRCAD Export] Starting data validation...");

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
        if ("cls" in exportedData) {
            if (typeof exportedData.cls !== "object") {
                errors.push("'cls' field must be an object");
            } else {
                // 验证cls中的面ID和特征类型
                const clsEntries = Object.entries(exportedData.cls);
                console.log(`   📋 Validating ${clsEntries.length} cls entries`);

                for (const [faceId, featureType] of clsEntries) {
                    const faceIdNum = parseInt(faceId);
                    if (isNaN(faceIdNum) || faceIdNum < 0) {
                        errors.push(`Invalid face ID in cls: ${faceId}`);
                    }
                    if (!Number.isInteger(featureType) || (featureType as number) < 0) {
                        errors.push(`Invalid feature type in cls for face ${faceId}: ${featureType}`);
                    }
                }
            }
        }

        // 验证seg字段
        if ("seg" in exportedData) {
            if (!Array.isArray(exportedData.seg)) {
                errors.push("'seg' field must be an array");
            } else {
                console.log(`   📊 Validating ${exportedData.seg.length} seg instances`);

                // 检查每个实例是否为数组
                for (let i = 0; i < exportedData.seg.length; i++) {
                    if (!Array.isArray(exportedData.seg[i])) {
                        errors.push(`Instance ${i} in 'seg' must be an array`);
                    } else {
                        // 验证实例中的面ID
                        for (const faceId of exportedData.seg[i]) {
                            if (!Number.isInteger(faceId) || faceId < 0) {
                                errors.push(`Invalid face ID in seg instance ${i}: ${faceId}`);
                            }
                        }
                    }
                }
            }
        }

        // 验证bottom字段
        if ("bottom" in exportedData && typeof exportedData.bottom !== "object") {
            errors.push("'bottom' field must be an object");
        }

        // 执行内部一致性验证（如果cls和seg都存在）
        if ("cls" in exportedData && "seg" in exportedData && errors.length === 0) {
            console.log("   🔗 Performing internal consistency check...");
            const consistencyCheck = this.validateConsistency(exportedData.cls, exportedData.seg);

            if (!consistencyCheck.isConsistent) {
                errors.push(...consistencyCheck.errors.map((err) => `Data consistency error: ${err}`));
                console.warn("   ⚠️ Internal consistency check failed:", consistencyCheck);
            } else {
                console.log("   ✅ Internal consistency check passed");
            }
        }

        const isValid = errors.length === 0;
        console.log(`🔍 [MFTRCAD Export] Data validation ${isValid ? "passed" : "failed"}:`, {
            isValid,
            errorCount: errors.length,
            hasDebugInfo: "_debug" in exportedData,
        });

        return { isValid, errors };
    }

    protected getFormatName(): string {
        return "MFTRCAD";
    }

    /**
     * 创建标注数据快照
     * 确保导出过程中数据一致性，避免并发修改问题
     */
    private createAnnotationSnapshot(annotations: AnnotationNode[]): AnnotationSnapshot[] {
        return annotations.map((annotation) => ({
            id: annotation.id,
            faces: [...annotation.faces], // 深拷贝面ID数组
            featureType: annotation.featureType,
            name: annotation.name || `${annotation.featureType}_${annotation.id.slice(-8)}`,
        }));
    }

    /**
     * 从快照构建语义分割标签
     */
    private buildSemanticLabelsFromSnapshot(snapshots: AnnotationSnapshot[]): Record<string, number> {
        const labels: Record<string, number> = {};

        console.log("🏷️ [MFTRCAD Export] Building semantic labels from snapshot...");

        for (const snapshot of snapshots) {
            console.log(`   Processing annotation ${snapshot.id.slice(-8)} (${snapshot.name}):`, {
                featureType: snapshot.featureType,
                faces: snapshot.faces,
            });

            for (const faceId of snapshot.faces) {
                if (labels[faceId.toString()]) {
                    console.warn(
                        `⚠️ Face ${faceId} is already labeled with type ${labels[faceId.toString()]}, overwriting with ${snapshot.featureType}`,
                    );
                }
                labels[faceId.toString()] = snapshot.featureType;
            }
        }

        console.log(
            "🏷️ [MFTRCAD Export] Semantic labels built:",
            Object.keys(labels).length,
            "faces labeled",
        );
        return labels;
    }

    /**
     * 从快照构建实例分割列表
     * 每个数组元素代表一个实例，包含该实例的所有面ID
     */
    private buildInstanceSegmentationFromSnapshot(snapshots: AnnotationSnapshot[]): number[][] {
        const instances: number[][] = [];

        console.log("📋 [MFTRCAD Export] Building instance segmentation from snapshot...");

        // 为每个标注创建一个实例
        for (const snapshot of snapshots) {
            console.log(`   Processing annotation ${snapshot.id.slice(-8)} (${snapshot.name}):`, {
                faceCount: snapshot.faces.length,
                faces: snapshot.faces,
            });

            if (snapshot.faces.length > 0) {
                instances.push([...snapshot.faces]);
                console.log(`   ✓ Added instance with ${snapshot.faces.length} faces`);
            } else {
                console.log(`   ⚠️ Skipped empty annotation`);
            }
        }

        // 填充空实例槽位以达到预期的数组大小
        // 这样做是为了保持与原始MFTRCAD格式的兼容性
        const maxInstances = Math.max(snapshots.length, 10); // 至少10个槽位
        const emptySlots = maxInstances - instances.length;

        if (emptySlots > 0) {
            console.log(`📋 [MFTRCAD Export] Adding ${emptySlots} empty slots for compatibility`);
            for (let i = 0; i < emptySlots; i++) {
                instances.push([]); // 空实例
            }
        }

        console.log("📋 [MFTRCAD Export] Instance segmentation built:", {
            totalInstances: instances.length,
            nonEmptyInstances: instances.filter((i) => i.length > 0).length,
            emptyInstances: instances.filter((i) => i.length === 0).length,
        });

        return instances;
    }

    /**
     * 验证cls和seg数据的一致性
     */
    private validateConsistency(cls: Record<string, number>, seg: number[][]): ConsistencyValidation {
        console.log("🔍 [MFTRCAD Export] Starting data consistency validation...");

        // 收集所有面ID
        const clsFaces = new Set(Object.keys(cls).map((id) => parseInt(id)));
        const segFaces = new Set<number>();

        // 从seg中收集所有面ID
        seg.forEach((instance, index) => {
            instance.forEach((faceId) => {
                if (segFaces.has(faceId)) {
                    console.warn(`⚠️ Face ${faceId} appears in multiple instances`);
                }
                segFaces.add(faceId);
            });
        });

        // 找出不一致的面ID
        const missingInSeg = Array.from(clsFaces).filter((faceId) => !segFaces.has(faceId));
        const missingInCls = Array.from(segFaces).filter((faceId) => !clsFaces.has(faceId));

        const errors: string[] = [];
        const warnings: string[] = [];

        if (missingInSeg.length > 0) {
            errors.push(`Faces present in cls but missing in seg: [${missingInSeg.join(", ")}]`);
        }

        if (missingInCls.length > 0) {
            errors.push(`Faces present in seg but missing in cls: [${missingInCls.join(", ")}]`);
        }

        const isConsistent = errors.length === 0;

        console.log("🔍 [MFTRCAD Export] Consistency validation result:", {
            isConsistent,
            clsFacesCount: clsFaces.size,
            segFacesCount: segFaces.size,
            missingInSeg: missingInSeg.length,
            missingInCls: missingInCls.length,
            errors: errors.length,
            warnings: warnings.length,
        });

        return {
            isConsistent,
            errors,
            warnings,
            clsFaces,
            segFaces,
            missingInSeg,
            missingInCls,
        };
    }

    /**
     * 构建实例分割列表（保持向后兼容）
     * @deprecated 使用 buildInstanceSegmentationFromSnapshot 代替
     */
    private buildInstanceSegmentation(annotations: AnnotationNode[]): number[][] {
        console.warn(
            "⚠️ [MFTRCAD Export] Using deprecated buildInstanceSegmentation method. Consider using snapshot-based approach.",
        );
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
