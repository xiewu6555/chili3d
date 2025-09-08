// Part of the Chili3d Project, under the AGPL-3.0 License.
// See LICENSE file in the project root for full license information.

import { AAGNetExporter } from "./aagnetExporter";
import { MFTRCADExporter } from "./mftrcadExporter";
import { AnnotationNode } from "../annotationNode";
import type { ExportResult, ExportConfig } from "./baseExporter";

/**
 * 导出目录配置接口
 */
export interface ExportDirectoryConfig {
    directory: string;
    fileName: string;
    format: "aagnet" | "mftrcad";
    config?: ExportConfig;
}

/**
 * 最近使用的目录接口
 */
export interface RecentDirectory {
    path: string;
    lastUsed: Date;
    usageCount: number;
}

/**
 * 导出服务类 - 处理文件导出和目录管理
 */
export class ExportService {
    private static readonly RECENT_DIRECTORIES_KEY = "chili3d_recent_export_directories";
    private static readonly MAX_RECENT_DIRECTORIES = 10;

    private recentDirectories: RecentDirectory[] = [];

    constructor() {
        this.loadRecentDirectories();
    }

    /**
     * 显示文件保存对话框或降级方案
     */
    async selectExportFile(
        defaultFileName: string,
    ): Promise<{ fileHandle?: FileSystemFileHandle; fileName?: string; cancelled?: boolean }> {
        try {
            // 使用现代浏览器的文件保存API
            if ("showSaveFilePicker" in window) {
                const fileHandle = await (window as any).showSaveFilePicker({
                    suggestedName: defaultFileName,
                    types: [
                        {
                            description: "JSON files",
                            accept: { "application/json": [".json"] },
                        },
                    ],
                    startIn: "downloads",
                });

                return { fileHandle };
            }

            // 降级方案：显示自定义文件名对话框
            const fileName = await this.showFileNameDialog(defaultFileName);
            if (!fileName) {
                return { cancelled: true };
            }
            return { fileName };
        } catch (error) {
            if ((error as Error).name === "AbortError") {
                return { cancelled: true };
            }
            console.error("文件保存对话框选择失败:", error);
            throw new Error("文件保存对话框选择失败，请重试");
        }
    }

    /**
     * 显示文件名输入对话框
     */
    private async showFileNameDialog(defaultFileName: string): Promise<string | null> {
        return new Promise((resolve) => {
            const modal = this.createFileNameModal(defaultFileName, resolve);
            document.body.appendChild(modal);
        });
    }

    /**
     * 创建文件名输入模态框
     */
    private createFileNameModal(
        defaultFileName: string,
        onSelect: (fileName: string | null) => void,
    ): HTMLElement {
        const modal = document.createElement("div");
        modal.className = "export-filename-modal";
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
        `;

        const dialog = document.createElement("div");
        dialog.className = "export-filename-dialog";
        dialog.style.cssText = `
            background: white;
            border-radius: 8px;
            padding: 24px;
            min-width: 400px;
            max-width: 600px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        `;

        dialog.innerHTML = `
            <h3 style="margin: 0 0 16px 0; color: #333;">导出文件</h3>
            
            <div style="margin-bottom: 16px;">
                <label style="display: block; margin-bottom: 8px; font-weight: bold;">
                    文件名:
                </label>
                <input type="text" id="fileNameInput" value="${defaultFileName}" 
                       style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box;">
            </div>

            <div style="margin-bottom: 16px; color: #666; font-size: 14px;">
                文件将下载到浏览器的默认下载文件夹中。
            </div>

            <div style="display: flex; gap: 12px; justify-content: flex-end; margin-top: 20px;">
                <button id="cancelBtn" style="padding: 8px 16px; background: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer;">
                    取消
                </button>
                <button id="confirmBtn" style="padding: 8px 16px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">
                    导出
                </button>
            </div>
        `;

        modal.appendChild(dialog);

        // 绑定事件
        const fileNameInput = dialog.querySelector("#fileNameInput") as HTMLInputElement;
        const confirmBtn = dialog.querySelector("#confirmBtn") as HTMLButtonElement;
        const cancelBtn = dialog.querySelector("#cancelBtn") as HTMLButtonElement;

        // 选中文件名（不包括扩展名）
        setTimeout(() => {
            fileNameInput.focus();
            const lastDotIndex = defaultFileName.lastIndexOf(".");
            if (lastDotIndex > 0) {
                fileNameInput.setSelectionRange(0, lastDotIndex);
            } else {
                fileNameInput.select();
            }
        }, 100);

        // 确认按钮事件
        confirmBtn.addEventListener("click", () => {
            const fileName = fileNameInput.value.trim();
            if (fileName) {
                document.body.removeChild(modal);
                onSelect(fileName);
            } else {
                alert("请输入文件名");
                fileNameInput.focus();
            }
        });

        // 取消按钮事件
        cancelBtn.addEventListener("click", () => {
            document.body.removeChild(modal);
            onSelect(null);
        });

        // Enter键确认
        fileNameInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                confirmBtn.click();
            }
        });

        // 点击模态框外部关闭
        modal.addEventListener("click", (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
                onSelect(null);
            }
        });

        // ESC键关闭
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                document.body.removeChild(modal);
                document.removeEventListener("keydown", handleEsc);
                onSelect(null);
            }
        };
        document.addEventListener("keydown", handleEsc);

        return modal;
    }

    /**
     * 降级方案：显示自定义目录选择对话框
     */
    private async showDirectoryPickerFallback(): Promise<string | null> {
        return new Promise((resolve) => {
            const modal = this.createDirectorySelectionModal(resolve);
            document.body.appendChild(modal);
        });
    }

    /**
     * 创建目录选择模态框
     */
    private createDirectorySelectionModal(onSelect: (path: string | null) => void): HTMLElement {
        const modal = document.createElement("div");
        modal.className = "export-directory-modal";
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
        `;

        const dialog = document.createElement("div");
        dialog.className = "export-directory-dialog";
        dialog.style.cssText = `
            background: white;
            border-radius: 8px;
            padding: 24px;
            min-width: 400px;
            max-width: 600px;
            max-height: 80vh;
            overflow-y: auto;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        `;

        dialog.innerHTML = `
            <h3 style="margin: 0 0 16px 0; color: #333;">选择导出目录</h3>
            
            <div style="margin-bottom: 16px;">
                <label style="display: block; margin-bottom: 8px; font-weight: bold;">
                    自定义目录路径:
                </label>
                <input type="text" id="customPath" placeholder="输入目录路径 (例如: C:\\Downloads\\Exports)" 
                       style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box;">
            </div>

            <div style="margin-bottom: 16px;">
                <label style="display: block; margin-bottom: 8px; font-weight: bold;">
                    最近使用的目录:
                </label>
                <div id="recentDirectories" style="max-height: 200px; overflow-y: auto;">
                    ${this.renderRecentDirectories()}
                </div>
            </div>

            <div style="display: flex; gap: 12px; justify-content: flex-end; margin-top: 20px;">
                <button id="cancelBtn" style="padding: 8px 16px; background: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer;">
                    取消
                </button>
                <button id="confirmBtn" style="padding: 8px 16px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">
                    确认
                </button>
            </div>
        `;

        modal.appendChild(dialog);

        // 绑定事件
        const customPathInput = dialog.querySelector("#customPath") as HTMLInputElement;
        const confirmBtn = dialog.querySelector("#confirmBtn") as HTMLButtonElement;
        const cancelBtn = dialog.querySelector("#cancelBtn") as HTMLButtonElement;
        const recentDirs = dialog.querySelector("#recentDirectories") as HTMLElement;

        // 点击最近目录的事件
        recentDirs.addEventListener("click", (e) => {
            const target = e.target as HTMLElement;
            if (target.classList.contains("recent-dir-item")) {
                const path = target.getAttribute("data-path");
                if (path) {
                    customPathInput.value = path;
                }
            }
        });

        // 确认按钮事件
        confirmBtn.addEventListener("click", () => {
            const selectedPath = customPathInput.value.trim();
            if (selectedPath) {
                this.addToRecentDirectories(selectedPath);
                document.body.removeChild(modal);
                onSelect(selectedPath);
            } else {
                alert("请选择或输入一个有效的目录路径");
            }
        });

        // 取消按钮事件
        cancelBtn.addEventListener("click", () => {
            document.body.removeChild(modal);
            onSelect(null);
        });

        // 点击模态框外部关闭
        modal.addEventListener("click", (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
                onSelect(null);
            }
        });

        // ESC键关闭
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                document.body.removeChild(modal);
                document.removeEventListener("keydown", handleEsc);
                onSelect(null);
            }
        };
        document.addEventListener("keydown", handleEsc);

        return modal;
    }

    /**
     * 渲染最近使用的目录列表
     */
    private renderRecentDirectories(): string {
        if (this.recentDirectories.length === 0) {
            return '<p style="color: #666; font-style: italic; margin: 8px 0;">暂无最近使用的目录</p>';
        }

        return this.recentDirectories
            .sort((a, b) => b.lastUsed.getTime() - a.lastUsed.getTime())
            .map(
                (dir) => `
                <div class="recent-dir-item" data-path="${dir.path}" 
                     style="padding: 8px 12px; margin: 4px 0; background: #f8f9fa; border-radius: 4px; cursor: pointer; border: 1px solid transparent;">
                    <div style="font-weight: bold; color: #333;">${dir.path}</div>
                    <div style="font-size: 12px; color: #666; margin-top: 4px;">
                        最后使用: ${dir.lastUsed.toLocaleString()} | 使用次数: ${dir.usageCount}
                    </div>
                </div>
            `,
            )
            .join("");
    }

    /**
     * 导出标注数据
     */
    async exportAnnotations(
        annotations: AnnotationNode[],
        modelFileName: string,
        totalFaceCount: number,
        format: "aagnet" | "mftrcad",
        config?: ExportConfig,
    ): Promise<ExportResult> {
        try {
            // 创建文件名
            const timestamp = new Date().toISOString().replace(/[:.]/g, "-").substring(0, 19);
            const fileName = `${modelFileName}_${format}_${timestamp}.json`;

            // 显示文件保存对话框
            const fileSelection = await this.selectExportFile(fileName);

            // 检查用户是否取消了操作
            if (fileSelection.cancelled) {
                return {
                    success: false,
                    errors: ["用户取消了导出操作"],
                    warnings: [],
                    metadata: {
                        exportTime: new Date(),
                        format: format,
                        annotationCount: annotations.length,
                        faceCount: totalFaceCount,
                    },
                };
            }

            // 创建对应格式的导出器
            const exporter = format === "aagnet" ? new AAGNetExporter(config) : new MFTRCADExporter(config);

            // 执行导出
            const result = exporter.exportWithResult(annotations, modelFileName, totalFaceCount);

            if (result.success && result.data) {
                if (fileSelection.fileHandle) {
                    // 使用文件保存API保存文件
                    await this.saveFileWithHandle(result.data, fileSelection.fileHandle);

                    // 记录导出目录（从文件路径提取）
                    const filePath = await this.getFilePathFromHandle(fileSelection.fileHandle);
                    if (filePath) {
                        const directory = filePath.substring(
                            0,
                            filePath.lastIndexOf("\\") || filePath.lastIndexOf("/"),
                        );
                        this.addToRecentDirectories(directory);

                        // 添加导出成功的元数据
                        result.metadata = {
                            ...result.metadata,
                            exportPath: directory,
                            fileName: fileName,
                        };
                    }
                } else if (fileSelection.fileName) {
                    // 降级方案：触发下载
                    this.downloadFile(result.data, fileSelection.fileName);

                    // 添加导出成功的元数据
                    result.metadata = {
                        ...result.metadata,
                        fileName: fileSelection.fileName,
                    };
                }
            }

            return result;
        } catch (error) {
            console.error("导出失败:", error);
            return {
                success: false,
                errors: [`导出失败: ${error}`],
                warnings: [],
                metadata: {
                    exportTime: new Date(),
                    format: format,
                    annotationCount: annotations.length,
                    faceCount: totalFaceCount,
                },
            };
        }
    }

    /**
     * 转换导出数据中的面ID：从0基索引转换为1基索引（与OCC原生保持一致）
     */
    private convertFaceIdsToOccNative(data: any): any {
        if (data === null || data === undefined) {
            return data;
        }

        if (Array.isArray(data)) {
            return data.map((item) => this.convertFaceIdsToOccNative(item));
        }

        if (typeof data === "object") {
            const converted: any = {};
            for (const [key, value] of Object.entries(data)) {
                // 检查是否是面ID相关的属性
                if (
                    (key === "seg" || key === "cls" || key === "bottom") &&
                    typeof value === "object" &&
                    !Array.isArray(value)
                ) {
                    // 对于标签对象，将键（面ID）转换为1基索引
                    const convertedLabels: any = {};
                    for (const [faceIdStr, labelValue] of Object.entries(value as any)) {
                        const faceId = parseInt(faceIdStr);
                        if (!isNaN(faceId)) {
                            // 将0基索引转换为1基索引
                            const occNativeFaceId = faceId + 1;
                            convertedLabels[occNativeFaceId.toString()] = labelValue;
                        } else {
                            convertedLabels[faceIdStr] = labelValue;
                        }
                    }
                    converted[key] = convertedLabels;
                } else if (key === "inst" && Array.isArray(value)) {
                    // 对于实例分割，需要根据格式处理
                    if (value.length > 0 && Array.isArray(value[0])) {
                        // 检查是否是邻接矩阵（方阵）
                        const isMatrix =
                            value.length > 0 && Array.isArray(value[0]) && value[0].length === value.length;
                        if (isMatrix) {
                            // AAGNet格式的邻接矩阵不需要修改索引，因为矩阵索引本身就是0基的
                            // 矩阵表示的是面与面之间的关系，索引仍然保持0基
                            converted[key] = value;
                        } else {
                            // MFTRCAD格式的实例数组，将面ID加1
                            converted[key] = value.map((instance) => {
                                if (Array.isArray(instance)) {
                                    return instance.map((faceId) =>
                                        typeof faceId === "number" ? faceId + 1 : faceId,
                                    );
                                }
                                return instance;
                            });
                        }
                    } else {
                        converted[key] = value;
                    }
                } else {
                    converted[key] = this.convertFaceIdsToOccNative(value);
                }
            }
            return converted;
        }

        return data;
    }

    /**
     * 使用文件句柄保存文件
     */
    private async saveFileWithHandle(data: any, fileHandle: FileSystemFileHandle): Promise<void> {
        try {
            const writable = await fileHandle.createWritable();
            // 在保存前转换面ID为OCC原生格式
            const convertedData = this.convertFaceIdsToOccNative(data);
            const content =
                typeof convertedData === "string" ? convertedData : JSON.stringify(convertedData, null, 2);
            await writable.write(content);
            await writable.close();
        } catch (error) {
            console.error("文件保存失败:", error);
            throw error;
        }
    }

    /**
     * 从文件句柄获取文件路径（尽力而为，可能不支持）
     */
    private async getFilePathFromHandle(fileHandle: FileSystemFileHandle): Promise<string | null> {
        try {
            // 某些浏览器可能支持获取路径
            if ("getFile" in fileHandle) {
                const file = await fileHandle.getFile();
                return (file as any).webkitRelativePath || (fileHandle as any).name;
            }
            return (fileHandle as any).name;
        } catch (error) {
            return (fileHandle as any).name;
        }
    }

    /**
     * 降级方案：触发文件下载
     */
    private downloadFile(data: any, fileName: string): void {
        // 在下载前转换面ID为OCC原生格式
        const convertedData = this.convertFaceIdsToOccNative(data);
        const content =
            typeof convertedData === "string" ? convertedData : JSON.stringify(convertedData, null, 2);
        const blob = new Blob([content], { type: "application/json" });
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        a.style.display = "none";

        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        // 清理对象URL
        setTimeout(() => URL.revokeObjectURL(url), 100);
    }

    /**
     * 添加目录到最近使用列表
     */
    private addToRecentDirectories(directoryPath: string): void {
        const existingIndex = this.recentDirectories.findIndex((dir) => dir.path === directoryPath);

        if (existingIndex >= 0) {
            // 更新现有条目
            this.recentDirectories[existingIndex].lastUsed = new Date();
            this.recentDirectories[existingIndex].usageCount++;
        } else {
            // 添加新条目
            this.recentDirectories.push({
                path: directoryPath,
                lastUsed: new Date(),
                usageCount: 1,
            });
        }

        // 保持最大数量限制
        this.recentDirectories = this.recentDirectories
            .sort((a, b) => b.lastUsed.getTime() - a.lastUsed.getTime())
            .slice(0, ExportService.MAX_RECENT_DIRECTORIES);

        this.saveRecentDirectories();
    }

    /**
     * 获取最后使用的目录
     */
    private getLastUsedDirectory(): string | null {
        if (this.recentDirectories.length === 0) {
            return null;
        }

        return this.recentDirectories.sort((a, b) => b.lastUsed.getTime() - a.lastUsed.getTime())[0].path;
    }

    /**
     * 加载最近使用的目录
     */
    private loadRecentDirectories(): void {
        try {
            const stored = localStorage.getItem(ExportService.RECENT_DIRECTORIES_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                this.recentDirectories = parsed.map((item: any) => ({
                    ...item,
                    lastUsed: new Date(item.lastUsed),
                }));
            }
        } catch (error) {
            console.warn("加载最近使用目录失败:", error);
            this.recentDirectories = [];
        }
    }

    /**
     * 保存最近使用的目录
     */
    private saveRecentDirectories(): void {
        try {
            localStorage.setItem(
                ExportService.RECENT_DIRECTORIES_KEY,
                JSON.stringify(this.recentDirectories),
            );
        } catch (error) {
            console.warn("保存最近使用目录失败:", error);
        }
    }

    /**
     * 清除最近使用的目录
     */
    clearRecentDirectories(): void {
        this.recentDirectories = [];
        localStorage.removeItem(ExportService.RECENT_DIRECTORIES_KEY);
    }

    /**
     * 获取最近使用的目录列表
     */
    getRecentDirectories(): RecentDirectory[] {
        return [...this.recentDirectories].sort((a, b) => b.lastUsed.getTime() - a.lastUsed.getTime());
    }
}
