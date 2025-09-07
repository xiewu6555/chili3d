// Part of the Chili3d Project, under the AGPL-3.0 License.
// See LICENSE file in the project root for full license information.

/**
 * 机加工特征类型定义
 * Machining feature types definition
 */
export enum MachiningFeatureType {
    // Basic Features 基础特征
    Faces = 0, // 面
    ClosedPockets = 1, // 封闭型腔
    OpenPockets = 2, // 开放型腔
    ThroughPockets = 3, // 通型腔
    Walls = 4, // 壁

    // Filleted Features 圆角特征
    FilletedClosedPockets = 5, // 圆角封闭型腔
    FilletedOpenPockets = 6, // 圆角开放型腔
    FilletedWalls = 7, // 圆角壁
    FilletedBosses = 8, // 圆角凸台

    // Holes 孔特征
    ThroughHoles = 9, // 通孔
    BlindHoles = 10, // 盲孔
    ThreadedHoles = 11, // 螺纹孔
    Countersinks = 12, // 沉头孔
    SteppedHoles = 13, // 阶梯孔 (大于2个同轴圆柱面组合)

    // 3D Features 3D特征
    ContourSurfaces = 14, // 轮廓曲面

    // Undercuts 底切
    TSlots = 15, // T型槽
    Dovetails = 16, // 燕尾槽

    // Other 其他
    Chamfers = 17, // 倒角
    SlantedFaces = 18, // 斜面
    InnerFillets = 19, // 内圆角
    OuterFillets = 20, // 外圆角
    ComplexPockets = 21, // 复合型腔
}

/**
 * 特征类型中文名称映射
 */
export const FEATURE_NAMES_CN: Record<MachiningFeatureType, string> = {
    [MachiningFeatureType.Faces]: "面",
    [MachiningFeatureType.ClosedPockets]: "封闭型腔",
    [MachiningFeatureType.OpenPockets]: "开放型腔",
    [MachiningFeatureType.ThroughPockets]: "通型腔",
    [MachiningFeatureType.Walls]: "壁",
    [MachiningFeatureType.FilletedClosedPockets]: "圆角封闭型腔",
    [MachiningFeatureType.FilletedOpenPockets]: "圆角开放型腔",
    [MachiningFeatureType.FilletedWalls]: "圆角壁",
    [MachiningFeatureType.FilletedBosses]: "圆角凸台",
    [MachiningFeatureType.ThroughHoles]: "通孔",
    [MachiningFeatureType.BlindHoles]: "盲孔",
    [MachiningFeatureType.ThreadedHoles]: "螺纹孔",
    [MachiningFeatureType.Countersinks]: "沉头孔",
    [MachiningFeatureType.SteppedHoles]: "阶梯孔",
    [MachiningFeatureType.ContourSurfaces]: "轮廓曲面",
    [MachiningFeatureType.TSlots]: "T型槽",
    [MachiningFeatureType.Dovetails]: "燕尾槽",
    [MachiningFeatureType.Chamfers]: "倒角",
    [MachiningFeatureType.SlantedFaces]: "斜面",
    [MachiningFeatureType.InnerFillets]: "内圆角",
    [MachiningFeatureType.OuterFillets]: "外圆角",
    [MachiningFeatureType.ComplexPockets]: "复合型腔",
};

/**
 * 特征类型英文名称映射
 */
export const FEATURE_NAMES_EN: Record<MachiningFeatureType, string> = {
    [MachiningFeatureType.Faces]: "Faces",
    [MachiningFeatureType.ClosedPockets]: "Closed Pockets",
    [MachiningFeatureType.OpenPockets]: "Open Pockets",
    [MachiningFeatureType.ThroughPockets]: "Through Pockets",
    [MachiningFeatureType.Walls]: "Walls",
    [MachiningFeatureType.FilletedClosedPockets]: "Filleted Closed Pockets",
    [MachiningFeatureType.FilletedOpenPockets]: "Filleted Open Pockets",
    [MachiningFeatureType.FilletedWalls]: "Filleted Walls",
    [MachiningFeatureType.FilletedBosses]: "Filleted Bosses",
    [MachiningFeatureType.ThroughHoles]: "Through Holes",
    [MachiningFeatureType.BlindHoles]: "Blind Holes",
    [MachiningFeatureType.ThreadedHoles]: "Threaded Holes",
    [MachiningFeatureType.Countersinks]: "Countersinks",
    [MachiningFeatureType.SteppedHoles]: "Stepped Holes",
    [MachiningFeatureType.ContourSurfaces]: "Contour Surfaces",
    [MachiningFeatureType.TSlots]: "T-slots",
    [MachiningFeatureType.Dovetails]: "Dovetails",
    [MachiningFeatureType.Chamfers]: "Chamfers",
    [MachiningFeatureType.SlantedFaces]: "Slanted Faces",
    [MachiningFeatureType.InnerFillets]: "Inner Fillets",
    [MachiningFeatureType.OuterFillets]: "Outer Fillets",
    [MachiningFeatureType.ComplexPockets]: "Complex Pockets",
};

/**
 * 特征颜色映射 (用于3D视图显示)
 */
export const FEATURE_COLORS: Record<MachiningFeatureType, string> = {
    [MachiningFeatureType.Faces]: "#96CEB4",
    [MachiningFeatureType.ClosedPockets]: "#FDCB6E",
    [MachiningFeatureType.OpenPockets]: "#FF9F43",
    [MachiningFeatureType.ThroughPockets]: "#FD79A8",
    [MachiningFeatureType.Walls]: "#74B9FF",
    [MachiningFeatureType.FilletedClosedPockets]: "#FECA57",
    [MachiningFeatureType.FilletedOpenPockets]: "#FF9FF3",
    [MachiningFeatureType.FilletedWalls]: "#54A0FF",
    [MachiningFeatureType.FilletedBosses]: "#5F27CD",
    [MachiningFeatureType.ThroughHoles]: "#4ECDC4",
    [MachiningFeatureType.BlindHoles]: "#A29BFE",
    [MachiningFeatureType.ThreadedHoles]: "#6C5CE7",
    [MachiningFeatureType.Countersinks]: "#00D2D3",
    [MachiningFeatureType.SteppedHoles]: "#9B59B6",
    [MachiningFeatureType.ContourSurfaces]: "#45B7D1",
    [MachiningFeatureType.TSlots]: "#E17055",
    [MachiningFeatureType.Dovetails]: "#81ECEC",
    [MachiningFeatureType.Chamfers]: "#FF6B6B",
    [MachiningFeatureType.SlantedFaces]: "#FAB1A0",
    [MachiningFeatureType.InnerFillets]: "#00CEC9",
    [MachiningFeatureType.OuterFillets]: "#00B894",
    [MachiningFeatureType.ComplexPockets]: "#E84393",
};

/**
 * 特征分类
 * Feature categories
 */
export enum FeatureCategory {
    BasicFeatures = "Basic Features",
    FilletedFeatures = "Filleted Features",
    Holes = "Holes",
    ThreeDFeatures = "3D Features",
    Undercuts = "Undercuts",
    Other = "Other",
}

/**
 * 特征分类中文名称
 */
export const CATEGORY_NAMES_CN: Record<FeatureCategory, string> = {
    [FeatureCategory.BasicFeatures]: "基础特征",
    [FeatureCategory.FilletedFeatures]: "圆角特征",
    [FeatureCategory.Holes]: "孔",
    [FeatureCategory.ThreeDFeatures]: "3D特征",
    [FeatureCategory.Undercuts]: "底切",
    [FeatureCategory.Other]: "其他",
};

/**
 * 特征类型分类映射
 */
export const FEATURE_CATEGORIES: Record<MachiningFeatureType, FeatureCategory> = {
    // Basic Features
    [MachiningFeatureType.Faces]: FeatureCategory.BasicFeatures,
    [MachiningFeatureType.ClosedPockets]: FeatureCategory.BasicFeatures,
    [MachiningFeatureType.OpenPockets]: FeatureCategory.BasicFeatures,
    [MachiningFeatureType.ThroughPockets]: FeatureCategory.BasicFeatures,
    [MachiningFeatureType.Walls]: FeatureCategory.BasicFeatures,

    // Filleted Features
    [MachiningFeatureType.FilletedClosedPockets]: FeatureCategory.FilletedFeatures,
    [MachiningFeatureType.FilletedOpenPockets]: FeatureCategory.FilletedFeatures,
    [MachiningFeatureType.FilletedWalls]: FeatureCategory.FilletedFeatures,
    [MachiningFeatureType.FilletedBosses]: FeatureCategory.FilletedFeatures,

    // Holes
    [MachiningFeatureType.ThroughHoles]: FeatureCategory.Holes,
    [MachiningFeatureType.BlindHoles]: FeatureCategory.Holes,
    [MachiningFeatureType.ThreadedHoles]: FeatureCategory.Holes,
    [MachiningFeatureType.Countersinks]: FeatureCategory.Holes,
    [MachiningFeatureType.SteppedHoles]: FeatureCategory.Holes,

    // 3D Features
    [MachiningFeatureType.ContourSurfaces]: FeatureCategory.ThreeDFeatures,

    // Undercuts
    [MachiningFeatureType.TSlots]: FeatureCategory.Undercuts,
    [MachiningFeatureType.Dovetails]: FeatureCategory.Undercuts,

    // Other
    [MachiningFeatureType.Chamfers]: FeatureCategory.Other,
    [MachiningFeatureType.SlantedFaces]: FeatureCategory.Other,
    [MachiningFeatureType.InnerFillets]: FeatureCategory.Other,
    [MachiningFeatureType.OuterFillets]: FeatureCategory.Other,
    [MachiningFeatureType.ComplexPockets]: FeatureCategory.Other,
};

/**
 * 获取特征类型的分类
 */
export function getFeatureCategory(type: MachiningFeatureType): FeatureCategory {
    return FEATURE_CATEGORIES[type];
}

/**
 * 获取分类下的所有特征类型
 */
export function getFeaturesByCategory(category: FeatureCategory): MachiningFeatureType[] {
    return Object.entries(FEATURE_CATEGORIES)
        .filter(([_, cat]) => cat === category)
        .map(([type, _]) => parseInt(type) as MachiningFeatureType);
}

/**
 * 获取特征类型的显示名称
 */
export function getFeatureName(type: MachiningFeatureType, language: "en" | "zh" = "zh"): string {
    return language === "zh" ? FEATURE_NAMES_CN[type] : FEATURE_NAMES_EN[type];
}

/**
 * 获取特征类型的颜色
 */
export function getFeatureColor(type: MachiningFeatureType): string {
    return FEATURE_COLORS[type] || "#808080";
}
