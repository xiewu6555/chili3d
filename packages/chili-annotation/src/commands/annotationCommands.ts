// Part of the Chili3d Project, under the AGPL-3.0 License.
// See LICENSE file in the project root for full license information.

import { command, IApplication, ICommand } from "chili-core";

/**
 * 简化的标注命令注册 - 只为了让按钮显示
 */

@command({
    key: "annotation.start",
    icon: "icon-play",
})
export class StartAnnotationCommandRegistered implements ICommand {
    async execute(application: IApplication): Promise<void> {
        console.log("启动标注模式");
        alert("标注模式启动功能正在开发中...");
    }
}

@command({
    key: "annotation.stop",
    icon: "icon-stop",
})
export class StopAnnotationCommandRegistered implements ICommand {
    async execute(application: IApplication): Promise<void> {
        console.log("停止标注模式");
        alert("停止标注功能正在开发中...");
    }
}

@command({
    key: "annotation.create",
    icon: "icon-add",
})
export class CreateAnnotationCommandRegistered implements ICommand {
    async execute(application: IApplication): Promise<void> {
        console.log("创建标注");
        alert("创建标注功能正在开发中...");
    }
}

@command({
    key: "annotation.delete",
    icon: "icon-delete",
})
export class DeleteAnnotationCommandRegistered implements ICommand {
    async execute(application: IApplication): Promise<void> {
        console.log("删除标注");
        alert("删除标注功能正在开发中...");
    }
}

@command({
    key: "annotation.validate",
    icon: "icon-check",
})
export class ValidateAnnotationsCommandRegistered implements ICommand {
    async execute(application: IApplication): Promise<void> {
        console.log("验证标注");
        alert("验证标注功能正在开发中...");
    }
}

@command({
    key: "annotation.clear",
    icon: "icon-clear",
})
export class ClearAnnotationsCommandRegistered implements ICommand {
    async execute(application: IApplication): Promise<void> {
        console.log("清除标注");
        alert("清除标注功能正在开发中...");
    }
}

@command({
    key: "annotation.export.aagnet",
    icon: "icon-export",
})
export class ExportAAGNetCommandRegistered implements ICommand {
    async execute(application: IApplication): Promise<void> {
        console.log("导出AAGNet格式");
        alert("AAGNet导出功能正在开发中...");
    }
}

@command({
    key: "annotation.export.mftrcad",
    icon: "icon-export",
})
export class ExportMFTRCADCommandRegistered implements ICommand {
    async execute(application: IApplication): Promise<void> {
        console.log("导出MFTRCAD格式");
        alert("MFTRCAD导出功能正在开发中...");
    }
}
