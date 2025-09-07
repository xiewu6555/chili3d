// Part of the Chili3d Project, under the AGPL-3.0 License.
// See LICENSE file in the project root for full license information.

import { Annotation, ValidationResult } from "../annotation";
import { MachiningFeatureType } from "../featureTypes";

/**
 * 几何验证器 - 验证标注的几何合理性
 */
export class GeometryValidator {
    /**
     * 验证标注的几何特征
     */
    validateGeometry(annotation: Annotation): ValidationResult {
        const result: ValidationResult = {
            isValid: true,
            errors: [],
            warnings: [],
        };

        // 验证几何参数
        this.validateGeometricParameters(annotation, result);

        // 验证特征尺寸合理性
        this.validateFeatureDimensions(annotation, result);

        // 验证公差规范
        this.validateToleranceSpecs(annotation, result);

        result.isValid = result.errors.length === 0;
        return result;
    }

    /**
     * 验证几何参数有效性
     */
    private validateGeometricParameters(annotation: Annotation, result: ValidationResult): void {
        const params = annotation.geometricParams;

        if (!params || Object.keys(params).length === 0) {
            result.warnings.push(`Feature '${annotation.name}' has no geometric parameters`);
            return;
        }

        // 验证基本几何参数
        this.validateBasicParameters(annotation, params, result);

        // 根据特征类型验证特定参数
        this.validateTypeSpecificParameters(annotation, params, result);
    }

    /**
     * 验证基本几何参数
     */
    private validateBasicParameters(
        annotation: Annotation,
        params: Record<string, any>,
        result: ValidationResult,
    ): void {
        // 验证直径参数
        if ("diameter" in params) {
            const diameter = params["diameter"];
            if (typeof diameter !== "number" || diameter <= 0) {
                result.errors.push(`Invalid diameter value: ${diameter}. Must be a positive number.`);
            } else if (diameter > 1000) {
                result.warnings.push(`Large diameter value: ${diameter}mm. Please verify this is correct.`);
            }
        }

        // 验证深度参数
        if ("depth" in params) {
            const depth = params["depth"];
            if (typeof depth !== "number" || depth < 0) {
                result.errors.push(`Invalid depth value: ${depth}. Must be non-negative.`);
            } else if (depth > 500) {
                result.warnings.push(`Large depth value: ${depth}mm. Please verify this is correct.`);
            }
        }

        // 验证半径参数
        if ("radius" in params) {
            const radius = params["radius"];
            if (typeof radius !== "number" || radius <= 0) {
                result.errors.push(`Invalid radius value: ${radius}. Must be a positive number.`);
            }
        }

        // 验证角度参数
        if ("angle" in params) {
            const angle = params["angle"];
            if (typeof angle !== "number" || angle < 0 || angle > 360) {
                result.errors.push(`Invalid angle value: ${angle}. Must be between 0 and 360 degrees.`);
            }
        }

        // 验证长度参数
        if ("length" in params) {
            const length = params["length"];
            if (typeof length !== "number" || length <= 0) {
                result.errors.push(`Invalid length value: ${length}. Must be a positive number.`);
            }
        }

        // 验证宽度参数
        if ("width" in params) {
            const width = params["width"];
            if (typeof width !== "number" || width <= 0) {
                result.errors.push(`Invalid width value: ${width}. Must be a positive number.`);
            }
        }

        // 验证高度参数
        if ("height" in params) {
            const height = params["height"];
            if (typeof height !== "number" || height <= 0) {
                result.errors.push(`Invalid height value: ${height}. Must be a positive number.`);
            }
        }
    }

    /**
     * 验证特定特征类型的参数
     */
    private validateTypeSpecificParameters(
        annotation: Annotation,
        params: Record<string, any>,
        result: ValidationResult,
    ): void {
        const type = annotation.type;

        switch (type) {
            case MachiningFeatureType.ThroughHoles:
            case MachiningFeatureType.BlindHoles:
            case MachiningFeatureType.ThreadedHoles:
            case MachiningFeatureType.Countersinks:
                this.validateHoleParameters(annotation, params, result);
                break;

            case MachiningFeatureType.SteppedHoles:
                this.validateSteppedHoleParameters(annotation, params, result);
                break;

            case MachiningFeatureType.Chamfers:
                this.validateChamferParameters(annotation, params, result);
                break;

            case MachiningFeatureType.InnerFillets:
            case MachiningFeatureType.OuterFillets:
                this.validateFilletParameters(annotation, params, result);
                break;

            case MachiningFeatureType.ClosedPockets:
            case MachiningFeatureType.OpenPockets:
            case MachiningFeatureType.ThroughPockets:
            case MachiningFeatureType.ComplexPockets:
            case MachiningFeatureType.FilletedClosedPockets:
            case MachiningFeatureType.FilletedOpenPockets:
                this.validatePocketParameters(annotation, params, result);
                break;

            case MachiningFeatureType.TSlots:
            case MachiningFeatureType.Dovetails:
                this.validateUndercutParameters(annotation, params, result);
                break;

            default:
                // 对于其他特征类型，进行基本验证
                this.validateGenericParameters(annotation, params, result);
                break;
        }
    }

    /**
     * 验证孔特征参数
     */
    private validateHoleParameters(
        annotation: Annotation,
        params: Record<string, any>,
        result: ValidationResult,
    ): void {
        // 孔特征必须有直径
        if (!("diameter" in params)) {
            result.errors.push(`Hole feature '${annotation.name}' must have a diameter parameter`);
        }

        // 盲孔必须有深度
        if (annotation.type === MachiningFeatureType.BlindHoles && !("depth" in params)) {
            result.errors.push(`Blind hole '${annotation.name}' must have a depth parameter`);
        }

        // 螺纹孔需要螺纹规格
        if (annotation.type === MachiningFeatureType.ThreadedHoles && !("threadSpec" in params)) {
            result.warnings.push(`Threaded hole '${annotation.name}' should have thread specification`);
        }

        // 验证孔的几何合理性
        if ("diameter" in params && "depth" in params) {
            const diameter = params["diameter"];
            const depth = params["depth"];

            if (depth > diameter * 10) {
                result.warnings.push(
                    `Hole depth (${depth}mm) is much larger than diameter (${diameter}mm). Check aspect ratio.`,
                );
            }
        }
    }

    /**
     * 验证阶梯孔参数
     */
    private validateSteppedHoleParameters(
        annotation: Annotation,
        params: Record<string, any>,
        result: ValidationResult,
    ): void {
        // 阶梯孔必须有多个直径参数 (大于2个，即至少3个)
        const diameterParams = Object.keys(params).filter((key) => key.startsWith("diameter"));

        if (diameterParams.length < 3) {
            result.errors.push(
                `Stepped hole '${annotation.name}' must have more than 2 diameter parameters (at least diameter1, diameter2, diameter3)`,
            );
        }

        // 阶梯孔必须有深度参数
        const depthParams = Object.keys(params).filter((key) => key.startsWith("depth"));

        if (depthParams.length < 1) {
            result.errors.push(`Stepped hole '${annotation.name}' must have depth parameters`);
        }

        // 验证直径递增关系
        if (diameterParams.length >= 2) {
            const diameters = diameterParams
                .map((key) => ({ key, value: params[key] }))
                .sort((a, b) => a.key.localeCompare(b.key));

            for (let i = 1; i < diameters.length; i++) {
                const prevDiameter = diameters[i - 1].value;
                const currentDiameter = diameters[i].value;

                if (currentDiameter <= prevDiameter) {
                    result.warnings.push(
                        `Stepped hole '${annotation.name}': diameter${i + 1} (${currentDiameter}mm) should be larger than diameter${i} (${prevDiameter}mm)`,
                    );
                }
            }
        }

        // 验证阶梯孔的深度比例
        if ("totalDepth" in params && diameterParams.length > 0) {
            const totalDepth = params["totalDepth"];
            const maxDiameter = Math.max(...diameterParams.map((key) => params[key]));

            if (totalDepth > maxDiameter * 8) {
                result.warnings.push(
                    `Stepped hole depth (${totalDepth}mm) is much larger than maximum diameter (${maxDiameter}mm). Check aspect ratio.`,
                );
            }
        }
    }

    /**
     * 验证倒角参数
     */
    private validateChamferParameters(
        annotation: Annotation,
        params: Record<string, any>,
        result: ValidationResult,
    ): void {
        // 倒角通常有距离或角度参数
        if (!("distance" in params) && !("angle" in params)) {
            result.warnings.push(
                `Chamfer feature '${annotation.name}' should have distance or angle parameter`,
            );
        }

        // 验证倒角角度
        if ("angle" in params) {
            const angle = params["angle"];
            if (angle < 5 || angle > 85) {
                result.warnings.push(`Chamfer angle (${angle}°) is unusual. Typical range is 5-85 degrees.`);
            }
        }

        // 验证倒角距离
        if ("distance" in params) {
            const distance = params["distance"];
            if (distance > 20) {
                result.warnings.push(
                    `Large chamfer distance (${distance}mm). Please verify this is correct.`,
                );
            }
        }
    }

    /**
     * 验证圆角参数
     */
    private validateFilletParameters(
        annotation: Annotation,
        params: Record<string, any>,
        result: ValidationResult,
    ): void {
        // 圆角必须有半径
        if (!("radius" in params)) {
            result.errors.push(`Fillet feature '${annotation.name}' must have a radius parameter`);
        }

        // 验证圆角半径合理性
        if ("radius" in params) {
            const radius = params["radius"];
            if (radius > 50) {
                result.warnings.push(`Large fillet radius (${radius}mm). Please verify this is correct.`);
            }
        }
    }

    /**
     * 验证凹槽参数
     */
    private validatePocketParameters(
        annotation: Annotation,
        params: Record<string, any>,
        result: ValidationResult,
    ): void {
        // 凹槽必须有深度
        if (!("depth" in params)) {
            result.errors.push(`Pocket feature '${annotation.name}' must have a depth parameter`);
        }

        // 根据凹槽类型验证尺寸参数
        if (
            annotation.type === MachiningFeatureType.ClosedPockets ||
            annotation.type === MachiningFeatureType.FilletedClosedPockets
        ) {
            if (!("length" in params) || !("width" in params)) {
                result.warnings.push(`Pocket '${annotation.name}' should have length and width parameters`);
            }
        }
    }

    /**
     * 验证底切特征参数
     */
    private validateUndercutParameters(
        annotation: Annotation,
        params: Record<string, any>,
        result: ValidationResult,
    ): void {
        // T型槽和燕尾槽特征通常有宽度和深度
        if (!("width" in params)) {
            result.warnings.push(`Undercut feature '${annotation.name}' should have a width parameter`);
        }

        if (!("depth" in params)) {
            result.warnings.push(`Undercut feature '${annotation.name}' should have a depth parameter`);
        }

        // T型槽特征的特殊参数
        if (annotation.type === MachiningFeatureType.TSlots) {
            if (!("slotWidth" in params)) {
                result.warnings.push(`T-slot '${annotation.name}' should have slot width parameter`);
            }
        }

        // 燕尾槽特征的特殊参数
        if (annotation.type === MachiningFeatureType.Dovetails) {
            if (!("angle" in params)) {
                result.warnings.push(`Dovetail '${annotation.name}' should have angle parameter`);
            }
        }
    }

    /**
     * 验证槽特征参数
     */
    private validateSlotParameters(
        annotation: Annotation,
        params: Record<string, any>,
        result: ValidationResult,
    ): void {
        // 槽特征通常有长度和宽度
        if (!("length" in params)) {
            result.warnings.push(`Slot feature '${annotation.name}' should have a length parameter`);
        }

        if (!("width" in params) && !("diameter" in params)) {
            result.warnings.push(
                `Slot feature '${annotation.name}' should have width or diameter parameter`,
            );
        }

        // 验证槽的纵横比
        if ("length" in params && "width" in params) {
            const length = params["length"];
            const width = params["width"];

            if (length < width) {
                result.warnings.push(
                    `Slot length (${length}mm) is less than width (${width}mm). Check dimensions.`,
                );
            }
        }
    }

    /**
     * 验证通用参数
     */
    private validateGenericParameters(
        annotation: Annotation,
        params: Record<string, any>,
        result: ValidationResult,
    ): void {
        // 检查是否有任何尺寸参数
        const dimensionParams = ["diameter", "radius", "length", "width", "height", "depth"];
        const hasDimensions = dimensionParams.some((param) => param in params);

        if (!hasDimensions) {
            result.warnings.push(`Feature '${annotation.name}' has no dimensional parameters`);
        }
    }

    /**
     * 验证特征尺寸合理性
     */
    private validateFeatureDimensions(annotation: Annotation, result: ValidationResult): void {
        const params = annotation.geometricParams;
        if (!params) return;

        // 检查尺寸是否在合理范围内
        const allDimensions = [
            params.diameter,
            params.radius,
            params.length,
            params.width,
            params.height,
            params.depth,
        ].filter((d) => typeof d === "number");

        if (allDimensions.length === 0) return;

        const maxDimension = Math.max(...allDimensions);
        const minDimension = Math.min(...allDimensions);

        // 检查极端尺寸
        if (maxDimension > 1000) {
            result.warnings.push(`Very large dimension (${maxDimension}mm) detected. Please verify.`);
        }

        if (minDimension < 0.1) {
            result.warnings.push(`Very small dimension (${minDimension}mm) detected. Please verify.`);
        }

        // 检查尺寸比例
        if (maxDimension / minDimension > 100) {
            result.warnings.push(
                `Extreme aspect ratio detected (${maxDimension / minDimension}:1). Please verify.`,
            );
        }
    }

    /**
     * 验证公差规范
     */
    private validateToleranceSpecs(annotation: Annotation, result: ValidationResult): void {
        const tolerances = annotation.toleranceSpec;
        if (!tolerances || Object.keys(tolerances).length === 0) {
            return; // 公差是可选的
        }

        // 验证公差值格式
        for (const [param, tolerance] of Object.entries(tolerances)) {
            if (typeof tolerance === "object" && tolerance !== null) {
                const tol = tolerance as any;

                // 验证上下偏差
                if ("upper" in tol || "lower" in tol) {
                    if (typeof tol.upper !== "number" || typeof tol.lower !== "number") {
                        result.errors.push(`Invalid tolerance format for parameter '${param}'`);
                        continue;
                    }

                    if (tol.upper < tol.lower) {
                        result.errors.push(
                            `Upper tolerance (${tol.upper}) cannot be less than lower tolerance (${tol.lower}) for '${param}'`,
                        );
                    }
                }

                // 验证对称公差
                if ("plus_minus" in tol) {
                    if (typeof tol.plus_minus !== "number" || tol.plus_minus < 0) {
                        result.errors.push(`Invalid symmetric tolerance for parameter '${param}'`);
                    }
                }
            }
        }
    }

    /**
     * 验证特征间的几何关系
     */
    validateFeatureRelations(annotations: Annotation[]): ValidationResult {
        const result: ValidationResult = {
            isValid: true,
            errors: [],
            warnings: [],
        };

        // 检查可能的几何冲突
        this.checkGeometricConflicts(annotations, result);

        // 检查相关特征的尺寸一致性
        this.checkDimensionalConsistency(annotations, result);

        result.isValid = result.errors.length === 0;
        return result;
    }

    /**
     * 检查几何冲突
     */
    private checkGeometricConflicts(annotations: Annotation[], result: ValidationResult): void {
        // 检查同一位置的多个孔特征
        const holes = annotations.filter(
            (a) =>
                a.type === MachiningFeatureType.ThroughHoles ||
                a.type === MachiningFeatureType.BlindHoles ||
                a.type === MachiningFeatureType.SteppedHoles,
        );

        for (let i = 0; i < holes.length; i++) {
            for (let j = i + 1; j < holes.length; j++) {
                const hole1 = holes[i];
                const hole2 = holes[j];

                // 简单的面重叠检查（实际项目中需要更复杂的几何计算）
                const commonFaces = hole1.faces.filter((f) => hole2.faces.includes(f));
                if (commonFaces.length > 0) {
                    result.warnings.push(
                        `Potential geometric conflict between holes '${hole1.name}' and '${hole2.name}'`,
                    );
                }
            }
        }
    }

    /**
     * 检查尺寸一致性
     */
    private checkDimensionalConsistency(annotations: Annotation[], result: ValidationResult): void {
        // 检查相同类型特征的尺寸一致性
        const typeGroups = new Map<MachiningFeatureType, Annotation[]>();

        for (const annotation of annotations) {
            if (!typeGroups.has(annotation.type)) {
                typeGroups.set(annotation.type, []);
            }
            typeGroups.get(annotation.type)!.push(annotation);
        }

        // 检查每个类型组的尺寸一致性
        for (const [type, group] of typeGroups) {
            if (group.length > 1) {
                this.checkGroupDimensionalConsistency(group, result);
            }
        }
    }

    /**
     * 检查组内尺寸一致性
     */
    private checkGroupDimensionalConsistency(annotations: Annotation[], result: ValidationResult): void {
        if (annotations.length < 2) return;

        const firstAnnotation = annotations[0];
        const firstParams = firstAnnotation.geometricParams;
        if (!firstParams) return;

        // 检查关键尺寸参数的一致性
        const keyParams = ["diameter", "depth", "length", "width"];

        for (const param of keyParams) {
            if (!(param in firstParams)) continue;

            const firstValue = firstParams[param];
            const values = [firstValue];

            for (let i = 1; i < annotations.length; i++) {
                const params = annotations[i].geometricParams;
                if (params && param in params) {
                    values.push(params[param]);
                }
            }

            // 检查值的变异性
            if (values.length > 1) {
                const maxValue = Math.max(...values);
                const minValue = Math.min(...values);
                const variation = ((maxValue - minValue) / Math.max(maxValue, minValue)) * 100;

                if (variation > 10) {
                    // 如果变异超过10%
                    result.warnings.push(
                        `Significant variation in ${param} for ${firstAnnotation.type} features (${variation.toFixed(1)}% variation)`,
                    );
                }
            }
        }
    }
}
