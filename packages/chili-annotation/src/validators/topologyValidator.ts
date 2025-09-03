// Part of the Chili3d Project, under the AGPL-3.0 License.
// See LICENSE file in the project root for full license information.

import { Annotation, ValidationResult } from "../annotation";

/**
 * 拓扑验证器 - 验证标注之间的拓扑关系
 */
export class TopologyValidator {
    /**
     * 验证所有标注的拓扑一致性
     */
    validateTopology(annotations: Annotation[]): ValidationResult {
        const result: ValidationResult = {
            isValid: true,
            errors: [],
            warnings: [],
        };

        // 验证面唯一性
        this.validateFaceUniqueness(annotations, result);

        // 验证连通性
        this.validateConnectivity(annotations, result);

        // 验证完整性
        this.validateCompleteness(annotations, result);

        result.isValid = result.errors.length === 0;
        return result;
    }

    /**
     * 验证面唯一性 - 每个面只能属于一个标注
     */
    private validateFaceUniqueness(annotations: Annotation[], result: ValidationResult): void {
        const faceToAnnotation = new Map<number, string>();

        for (const annotation of annotations) {
            for (const faceId of annotation.faces) {
                if (faceToAnnotation.has(faceId)) {
                    const conflictAnnotation = faceToAnnotation.get(faceId);
                    result.errors.push(
                        `Face ${faceId} is assigned to multiple annotations: ` +
                            `'${annotation.name}' and '${conflictAnnotation}'`,
                    );
                } else {
                    faceToAnnotation.set(faceId, annotation.name);
                }
            }
        }
    }

    /**
     * 验证连通性 - 检查特征内部面的连通性
     */
    private validateConnectivity(annotations: Annotation[], result: ValidationResult): void {
        for (const annotation of annotations) {
            if (annotation.faces.length <= 1) {
                continue; // 单面特征跳过连通性检查
            }

            // 这里需要真实的拓扑信息来验证连通性
            // 由于我们没有直接访问BREP拓扑数据，这里只做基本检查
            this.validateBasicConnectivity(annotation, result);
        }
    }

    /**
     * 基本连通性验证
     */
    private validateBasicConnectivity(annotation: Annotation, result: ValidationResult): void {
        const faces = annotation.faces;

        // 检查面ID的连续性（这是一个启发式检查）
        const sortedFaces = [...faces].sort((a, b) => a - b);
        let gaps = 0;

        for (let i = 1; i < sortedFaces.length; i++) {
            if (sortedFaces[i] - sortedFaces[i - 1] > 5) {
                // 如果面ID间隔大于5，可能不连通
                gaps++;
            }
        }

        if (gaps > faces.length / 2) {
            result.warnings.push(`Annotation '${annotation.name}' may have non-contiguous faces`);
        }
    }

    /**
     * 验证完整性 - 检查特征是否完整
     */
    private validateCompleteness(annotations: Annotation[], result: ValidationResult): void {
        for (const annotation of annotations) {
            if (annotation.faces.length === 0) {
                result.errors.push(`Annotation '${annotation.name}' has no faces`);
                continue;
            }

            // 根据特征类型验证完整性
            this.validateFeatureCompleteness(annotation, result);
        }
    }

    /**
     * 验证特征完整性
     */
    private validateFeatureCompleteness(annotation: Annotation, result: ValidationResult): void {
        // 基于特征类型的完整性检查
        // 这里只做基本检查，更复杂的验证需要几何信息

        const faceCount = annotation.faces.length;
        const featureName = annotation.name;

        // 简单的完整性启发式检查
        if (faceCount === 1) {
            // 单面特征通常是平面特征
            const singleFaceFeatures = ["chamfer", "round", "stock"];
            const isLikelyMultiFaceFeature =
                featureName.toLowerCase().includes("pocket") ||
                featureName.toLowerCase().includes("hole") ||
                featureName.toLowerCase().includes("slot");

            if (isLikelyMultiFaceFeature) {
                result.warnings.push(
                    `Feature '${featureName}' typically requires multiple faces but only has 1`,
                );
            }
        }
    }

    /**
     * 验证特征间关系
     */
    validateFeatureRelations(annotations: Annotation[]): ValidationResult {
        const result: ValidationResult = {
            isValid: true,
            errors: [],
            warnings: [],
        };

        // 检查可能的特征重叠
        this.checkFeatureOverlaps(annotations, result);

        // 检查特征间的依赖关系
        this.checkFeatureDependencies(annotations, result);

        result.isValid = result.errors.length === 0;
        return result;
    }

    /**
     * 检查特征重叠
     */
    private checkFeatureOverlaps(annotations: Annotation[], result: ValidationResult): void {
        // 由于我们已经在validateFaceUniqueness中检查了面的唯一性
        // 这里可以检查其他类型的重叠，比如几何重叠

        for (let i = 0; i < annotations.length; i++) {
            for (let j = i + 1; j < annotations.length; j++) {
                const ann1 = annotations[i];
                const ann2 = annotations[j];

                // 检查是否有共同面（这在face唯一性检查中已经处理）
                const commonFaces = ann1.faces.filter((face) => ann2.faces.includes(face));
                if (commonFaces.length > 0) {
                    result.errors.push(
                        `Features '${ann1.name}' and '${ann2.name}' share faces: ${commonFaces.join(", ")}`,
                    );
                }
            }
        }
    }

    /**
     * 检查特征依赖关系
     */
    private checkFeatureDependencies(annotations: Annotation[], result: ValidationResult): void {
        // 检查一些特征类型的逻辑依赖
        // 例如：倒角通常依赖于其他特征的边

        const chamfers = annotations.filter((a) => a.name.toLowerCase().includes("chamfer"));
        const rounds = annotations.filter((a) => a.name.toLowerCase().includes("round"));

        if (chamfers.length > 0 || rounds.length > 0) {
            const primaryFeatures = annotations.filter(
                (a) =>
                    !a.name.toLowerCase().includes("chamfer") &&
                    !a.name.toLowerCase().includes("round") &&
                    !a.name.toLowerCase().includes("stock"),
            );

            if (primaryFeatures.length === 0) {
                result.warnings.push("Found edge features (chamfers/rounds) without primary features");
            }
        }
    }
}
