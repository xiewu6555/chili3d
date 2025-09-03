// Part of the Chili3d Project, under the AGPL-3.0 License.
// See LICENSE file in the project root for full license information.

import { Annotation, ValidationResult } from "../annotation";
import { MachiningFeatureType } from "../featureTypes";

/**
 * 标注验证器接口
 */
export interface IAnnotationValidator {
    validateAnnotation(annotation: Annotation): ValidationResult;
    validateFaces(annotation: Annotation, faceIds: number[]): ValidationResult;
    validateFeatureType(annotation: Annotation): ValidationResult;
    validateCompleteness(annotation: Annotation): ValidationResult;
}

/**
 * 默认标注验证器
 */
export class DefaultAnnotationValidator implements IAnnotationValidator {
    /**
     * 验证单个标注
     */
    validateAnnotation(annotation: Annotation): ValidationResult {
        const result: ValidationResult = {
            isValid: true,
            errors: [],
            warnings: [],
        };

        // 验证基本属性
        this.validateBasicProperties(annotation, result);

        // 验证面数据
        this.validateFaceData(annotation, result);

        // 验证特征类型
        this.validateFeatureTypeConstraints(annotation, result);

        result.isValid = result.errors.length === 0;
        return result;
    }

    /**
     * 验证面ID
     */
    validateFaces(annotation: Annotation, faceIds: number[]): ValidationResult {
        const result: ValidationResult = {
            isValid: true,
            errors: [],
            warnings: [],
        };

        for (const faceId of faceIds) {
            // 验证面ID有效性
            if (!Number.isInteger(faceId) || faceId < 0) {
                result.errors.push(`Invalid face ID: ${faceId}. Face ID must be a non-negative integer.`);
                continue;
            }

            // 检查面是否已经被其他标注使用（这个检查应该在管理器层面进行）
            // 这里只做基本验证
        }

        result.isValid = result.errors.length === 0;
        return result;
    }

    /**
     * 验证特征类型
     */
    validateFeatureType(annotation: Annotation): ValidationResult {
        const result: ValidationResult = {
            isValid: true,
            errors: [],
            warnings: [],
        };

        // 检查特征类型是否有效
        if (!Object.values(MachiningFeatureType).includes(annotation.type)) {
            result.errors.push(`Invalid feature type: ${annotation.type}`);
        }

        result.isValid = result.errors.length === 0;
        return result;
    }

    /**
     * 验证标注完整性
     */
    validateCompleteness(annotation: Annotation): ValidationResult {
        const result: ValidationResult = {
            isValid: true,
            errors: [],
            warnings: [],
        };

        // 检查是否有面
        if (annotation.faces.length === 0) {
            result.errors.push("Annotation has no faces assigned");
        }

        // 检查名称
        if (!annotation.name || annotation.name.trim().length === 0) {
            result.errors.push("Annotation name is empty");
        }

        // 根据特征类型检查面数量约束
        this.validateFaceCountConstraints(annotation, result);

        result.isValid = result.errors.length === 0;
        return result;
    }

    /**
     * 验证基本属性
     */
    private validateBasicProperties(annotation: Annotation, result: ValidationResult): void {
        // 验证ID
        if (!annotation.id || annotation.id.trim().length === 0) {
            result.errors.push("Annotation ID is empty");
        }

        // 验证名称
        if (!annotation.name || annotation.name.trim().length === 0) {
            result.errors.push("Annotation name is empty");
        }

        // 验证创建时间
        const metadata = annotation.metadata;
        if (!metadata.timestamp || !(metadata.timestamp instanceof Date)) {
            result.errors.push("Invalid timestamp");
        }

        // 验证置信度
        if (metadata.confidence !== undefined) {
            if (metadata.confidence < 0 || metadata.confidence > 1) {
                result.errors.push("Confidence must be between 0 and 1");
            }
        }
    }

    /**
     * 验证面数据
     */
    private validateFaceData(annotation: Annotation, result: ValidationResult): void {
        const faces = annotation.faces;

        // 检查面数组
        if (faces.length === 0) {
            result.warnings.push("No faces assigned to annotation");
            return;
        }

        // 检查重复面
        const uniqueFaces = new Set(faces);
        if (uniqueFaces.size !== faces.length) {
            result.errors.push("Duplicate face IDs found in annotation");
        }

        // 验证每个面ID
        for (const faceId of faces) {
            if (!Number.isInteger(faceId) || faceId < 0) {
                result.errors.push(`Invalid face ID: ${faceId}`);
            }
        }
    }

    /**
     * 验证特征类型约束
     */
    private validateFeatureTypeConstraints(annotation: Annotation, result: ValidationResult): void {
        const type = annotation.type;
        const faceCount = annotation.faces.length;

        // 根据特征类型进行约束检查
        switch (type) {
            case MachiningFeatureType.ThroughHole:
            case MachiningFeatureType.BlindHole:
                if (faceCount < 1) {
                    result.errors.push("Hole features must have at least 1 face (cylindrical surface)");
                } else if (faceCount > 3) {
                    result.warnings.push("Hole features typically have 1-3 faces");
                }
                break;

            case MachiningFeatureType.Chamfer:
                if (faceCount !== 1) {
                    result.warnings.push("Chamfer features typically have exactly 1 face");
                }
                break;

            case MachiningFeatureType.Round:
                if (faceCount !== 1) {
                    result.warnings.push("Round features typically have exactly 1 face");
                }
                break;

            case MachiningFeatureType.RectangularPocket:
            case MachiningFeatureType.TriangularPocket:
            case MachiningFeatureType.SixSidesPocket:
                if (faceCount < 2) {
                    result.errors.push("Pocket features must have at least 2 faces (bottom + sides)");
                }
                break;

            case MachiningFeatureType.RectangularThroughSlot:
            case MachiningFeatureType.TriangularThroughSlot:
            case MachiningFeatureType.CircularThroughSlot:
                if (faceCount < 3) {
                    result.warnings.push("Through slot features typically have at least 3 faces");
                }
                break;

            case MachiningFeatureType.Stock:
                // 坯料面通常是大的平面
                if (faceCount === 0) {
                    result.errors.push("Stock features must have at least 1 face");
                }
                break;

            default:
                // 对于其他特征类型，只做基本检查
                if (faceCount === 0) {
                    result.warnings.push("Feature has no assigned faces");
                }
                break;
        }
    }

    /**
     * 验证面数量约束
     */
    private validateFaceCountConstraints(annotation: Annotation, result: ValidationResult): void {
        const type = annotation.type;
        const faceCount = annotation.faces.length;

        // 定义每种特征类型的推荐面数范围
        const faceCountConstraints: Record<
            MachiningFeatureType,
            { min?: number; max?: number; optimal?: number }
        > = {
            [MachiningFeatureType.Chamfer]: { optimal: 1 },
            [MachiningFeatureType.Round]: { optimal: 1 },
            [MachiningFeatureType.ThroughHole]: { min: 1, max: 3, optimal: 1 },
            [MachiningFeatureType.BlindHole]: { min: 1, max: 3, optimal: 2 },
            [MachiningFeatureType.RectangularPocket]: { min: 2, optimal: 5 },
            [MachiningFeatureType.TriangularPocket]: { min: 2, optimal: 4 },
            [MachiningFeatureType.SixSidesPocket]: { min: 2, optimal: 7 },
            [MachiningFeatureType.RectangularThroughSlot]: { min: 3, optimal: 4 },
            [MachiningFeatureType.TriangularThroughSlot]: { min: 3, optimal: 4 },
            [MachiningFeatureType.CircularThroughSlot]: { min: 1, optimal: 2 },
            [MachiningFeatureType.Stock]: { min: 1 },
            // 其他类型使用默认约束
        } as any;

        const constraint = faceCountConstraints[type];
        if (constraint) {
            if (constraint.min && faceCount < constraint.min) {
                result.errors.push(
                    `${MachiningFeatureType[type]} requires at least ${constraint.min} faces, but has ${faceCount}`,
                );
            }

            if (constraint.max && faceCount > constraint.max) {
                result.warnings.push(
                    `${MachiningFeatureType[type]} typically has at most ${constraint.max} faces, but has ${faceCount}`,
                );
            }

            if (
                constraint.optimal &&
                faceCount !== constraint.optimal &&
                !constraint.min &&
                !constraint.max
            ) {
                result.warnings.push(
                    `${MachiningFeatureType[type]} typically has ${constraint.optimal} faces, but has ${faceCount}`,
                );
            }
        }
    }
}
