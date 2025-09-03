// Part of the Chili3d Project, under the AGPL-3.0 License.
// See LICENSE file in the project root for full license information.

import { AdditionalCommand, IAdditionalModule } from "chili-builder";
import { Locale } from "chili-core";

/**
 * 标注系统附加模块 - 集成到chili3d主应用
 */
export class AnnotationModule implements IAdditionalModule {
    i18n(): Locale[] {
        return [];
    }

    ribbonCommands(): AdditionalCommand[] {
        return [
            // 主要标注操作
            {
                tabName: "ribbon.tab.annotation" as any,
                groupName: "ribbon.group.annotation.main" as any,
                command: "annotation.start" as any,
            },
            {
                tabName: "ribbon.tab.annotation" as any,
                groupName: "ribbon.group.annotation.main" as any,
                command: "annotation.stop" as any,
            },
            {
                tabName: "ribbon.tab.annotation" as any,
                groupName: "ribbon.group.annotation.main" as any,
                command: "annotation.create" as any,
            },
            {
                tabName: "ribbon.tab.annotation" as any,
                groupName: "ribbon.group.annotation.main" as any,
                command: "annotation.delete" as any,
            },

            // 验证操作
            {
                tabName: "ribbon.tab.annotation" as any,
                groupName: "ribbon.group.annotation.validate" as any,
                command: "annotation.validate" as any,
            },
            {
                tabName: "ribbon.tab.annotation" as any,
                groupName: "ribbon.group.annotation.validate" as any,
                command: "annotation.clear" as any,
            },

            // 导出操作
            {
                tabName: "ribbon.tab.annotation" as any,
                groupName: "ribbon.group.annotation.export" as any,
                command: "annotation.export.aagnet" as any,
            },
            {
                tabName: "ribbon.tab.annotation" as any,
                groupName: "ribbon.group.annotation.export" as any,
                command: "annotation.export.mftrcad" as any,
            },
        ];
    }
}
