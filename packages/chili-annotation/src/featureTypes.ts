// Part of the Chili3d Project, under the AGPL-3.0 License.
// See LICENSE file in the project root for full license information.

/**
 * 机加工特征类型定义
 * 基于AAGNet/MFInstSeg和MFTRCAD标准的24+1种特征类型
 */
export enum MachiningFeatureType {
    // 基础特征 (0-24)
    Chamfer = 0, // 倒角
    ThroughHole = 1, // 通孔
    TriangularPassage = 2, // 三角形通道
    RectangularPassage = 3, // 矩形通道
    SixSidesPassage = 4, // 六边形通道
    TriangularThroughSlot = 5, // 三角形通槽
    RectangularThroughSlot = 6, // 矩形通槽
    CircularThroughSlot = 7, // 圆形通槽
    RectangularThroughStep = 8, // 矩形通阶
    TwoSidesThroughStep = 9, // 双面通阶
    SlantedThroughStep = 10, // 斜面通阶
    ORing = 11, // O型圈槽
    BlindHole = 12, // 盲孔
    TriangularPocket = 13, // 三角形凸台
    RectangularPocket = 14, // 矩形凸台
    SixSidesPocket = 15, // 六边形凸台
    CircularEndPocket = 16, // 圆底凸台
    RectangularBlindSlot = 17, // 矩形盲槽
    VerticalCircularEndBlindSlot = 18, // 垂直圆端盲槽
    HorizontalCircularEndBlindSlot = 19, // 水平圆端盲槽
    TriangularBlindStep = 20, // 三角形盲阶
    CircularBlindStep = 21, // 圆形盲阶
    RectangularBlindStep = 22, // 矩形盲阶
    Round = 23, // 圆角
    Stock = 24, // 坯料面

    // 扩展特征 (25+)
    Cylinder = 25, // 圆柱面
    Cone = 26, // 圆锥面
}

/**
 * 特征类型中文名称映射
 */
export const FEATURE_NAMES_CN: Record<MachiningFeatureType, string> = {
    [MachiningFeatureType.Chamfer]: "倒角",
    [MachiningFeatureType.ThroughHole]: "通孔",
    [MachiningFeatureType.TriangularPassage]: "三角形通道",
    [MachiningFeatureType.RectangularPassage]: "矩形通道",
    [MachiningFeatureType.SixSidesPassage]: "六边形通道",
    [MachiningFeatureType.TriangularThroughSlot]: "三角形通槽",
    [MachiningFeatureType.RectangularThroughSlot]: "矩形通槽",
    [MachiningFeatureType.CircularThroughSlot]: "圆形通槽",
    [MachiningFeatureType.RectangularThroughStep]: "矩形通阶",
    [MachiningFeatureType.TwoSidesThroughStep]: "双面通阶",
    [MachiningFeatureType.SlantedThroughStep]: "斜面通阶",
    [MachiningFeatureType.ORing]: "O型圈槽",
    [MachiningFeatureType.BlindHole]: "盲孔",
    [MachiningFeatureType.TriangularPocket]: "三角形凸台",
    [MachiningFeatureType.RectangularPocket]: "矩形凸台",
    [MachiningFeatureType.SixSidesPocket]: "六边形凸台",
    [MachiningFeatureType.CircularEndPocket]: "圆底凸台",
    [MachiningFeatureType.RectangularBlindSlot]: "矩形盲槽",
    [MachiningFeatureType.VerticalCircularEndBlindSlot]: "垂直圆端盲槽",
    [MachiningFeatureType.HorizontalCircularEndBlindSlot]: "水平圆端盲槽",
    [MachiningFeatureType.TriangularBlindStep]: "三角形盲阶",
    [MachiningFeatureType.CircularBlindStep]: "圆形盲阶",
    [MachiningFeatureType.RectangularBlindStep]: "矩形盲阶",
    [MachiningFeatureType.Round]: "圆角",
    [MachiningFeatureType.Stock]: "坯料面",
    [MachiningFeatureType.Cylinder]: "圆柱面",
    [MachiningFeatureType.Cone]: "圆锥面",
};

/**
 * 特征类型英文名称映射
 */
export const FEATURE_NAMES_EN: Record<MachiningFeatureType, string> = {
    [MachiningFeatureType.Chamfer]: "Chamfer",
    [MachiningFeatureType.ThroughHole]: "Through Hole",
    [MachiningFeatureType.TriangularPassage]: "Triangular Passage",
    [MachiningFeatureType.RectangularPassage]: "Rectangular Passage",
    [MachiningFeatureType.SixSidesPassage]: "6-sides Passage",
    [MachiningFeatureType.TriangularThroughSlot]: "Triangular Through Slot",
    [MachiningFeatureType.RectangularThroughSlot]: "Rectangular Through Slot",
    [MachiningFeatureType.CircularThroughSlot]: "Circular Through Slot",
    [MachiningFeatureType.RectangularThroughStep]: "Rectangular Through Step",
    [MachiningFeatureType.TwoSidesThroughStep]: "2-sides Through Step",
    [MachiningFeatureType.SlantedThroughStep]: "Slanted Through Step",
    [MachiningFeatureType.ORing]: "O-ring",
    [MachiningFeatureType.BlindHole]: "Blind Hole",
    [MachiningFeatureType.TriangularPocket]: "Triangular Pocket",
    [MachiningFeatureType.RectangularPocket]: "Rectangular Pocket",
    [MachiningFeatureType.SixSidesPocket]: "6-sides Pocket",
    [MachiningFeatureType.CircularEndPocket]: "Circular End Pocket",
    [MachiningFeatureType.RectangularBlindSlot]: "Rectangular Blind Slot",
    [MachiningFeatureType.VerticalCircularEndBlindSlot]: "Vertical Circular End Blind Slot",
    [MachiningFeatureType.HorizontalCircularEndBlindSlot]: "Horizontal Circular End Blind Slot",
    [MachiningFeatureType.TriangularBlindStep]: "Triangular Blind Step",
    [MachiningFeatureType.CircularBlindStep]: "Circular Blind Step",
    [MachiningFeatureType.RectangularBlindStep]: "Rectangular Blind Step",
    [MachiningFeatureType.Round]: "Round",
    [MachiningFeatureType.Stock]: "Stock",
    [MachiningFeatureType.Cylinder]: "Cylinder",
    [MachiningFeatureType.Cone]: "Cone",
};

/**
 * 特征颜色映射 (用于3D视图显示)
 */
export const FEATURE_COLORS: Record<MachiningFeatureType, string> = {
    [MachiningFeatureType.Chamfer]: "#FF6B6B",
    [MachiningFeatureType.ThroughHole]: "#4ECDC4",
    [MachiningFeatureType.TriangularPassage]: "#45B7D1",
    [MachiningFeatureType.RectangularPassage]: "#96CEB4",
    [MachiningFeatureType.SixSidesPassage]: "#FECA57",
    [MachiningFeatureType.TriangularThroughSlot]: "#FF9FF3",
    [MachiningFeatureType.RectangularThroughSlot]: "#54A0FF",
    [MachiningFeatureType.CircularThroughSlot]: "#5F27CD",
    [MachiningFeatureType.RectangularThroughStep]: "#00D2D3",
    [MachiningFeatureType.TwoSidesThroughStep]: "#FF9F43",
    [MachiningFeatureType.SlantedThroughStep]: "#FD79A8",
    [MachiningFeatureType.ORing]: "#6C5CE7",
    [MachiningFeatureType.BlindHole]: "#A29BFE",
    [MachiningFeatureType.TriangularPocket]: "#FD79A8",
    [MachiningFeatureType.RectangularPocket]: "#FDCB6E",
    [MachiningFeatureType.SixSidesPocket]: "#6C5CE7",
    [MachiningFeatureType.CircularEndPocket]: "#74B9FF",
    [MachiningFeatureType.RectangularBlindSlot]: "#E17055",
    [MachiningFeatureType.VerticalCircularEndBlindSlot]: "#81ECEC",
    [MachiningFeatureType.HorizontalCircularEndBlindSlot]: "#FAB1A0",
    [MachiningFeatureType.TriangularBlindStep]: "#00B894",
    [MachiningFeatureType.CircularBlindStep]: "#E84393",
    [MachiningFeatureType.RectangularBlindStep]: "#FDCB6E",
    [MachiningFeatureType.Round]: "#00CEC9",
    [MachiningFeatureType.Stock]: "#B2B2B2",
    [MachiningFeatureType.Cylinder]: "#DDA0DD",
    [MachiningFeatureType.Cone]: "#F0E68C",
};

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
