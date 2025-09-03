// Part of the Chili3d Project, under the AGPL-3.0 License.
// See LICENSE file in the project root for full license information.

// Core annotation system
export * from "./annotation";
export * from "./annotationNode";
export * from "./annotationManager";
export * from "./featureTypes";

// Validators
export { TopologyValidator } from "./validators/topologyValidator";
export { GeometryValidator } from "./validators/geometryValidator";
export { DefaultAnnotationValidator, IAnnotationValidator } from "./validators/annotationValidator";

// Exporters
export * from "./exporters";

// UI Components
export * from "./ui/annotationPanel";
export * from "./ui/faceSelectionHandler";

// Commands
export * from "./commands/annotationCommand";
export * from "./commands/annotationCommands";
export * from "./commands/selectFacesCommand";

// Module integration
export * from "./annotationModule";

// Utility types and interfaces
export interface AnnotationSystemConfig {
    /** 启用验证功能 */
    enableValidation?: boolean;
    /** 启用历史记录功能 */
    enableHistory?: boolean;
    /** 最大历史记录数量 */
    maxHistorySize?: number;
    /** 默认导出格式 */
    defaultExportFormat?: "aagnet" | "mftrcad";
    /** 自动保存间隔（毫秒） */
    autoSaveInterval?: number;
}

/**
 * 标注系统版本信息
 */
export const ANNOTATION_SYSTEM_VERSION = "1.0.0";
