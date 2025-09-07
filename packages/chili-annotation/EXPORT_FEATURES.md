# 导出功能增强

## 新增功能

### 🎯 目录选择功能

- 用户可以选择任意本地目录作为导出路径
- 支持现代浏览器的 File System Access API
- 为不支持的浏览器提供降级方案

### 📁 最近使用目录管理

- 自动记录最近使用的导出目录
- 支持快速选择历史目录
- 显示使用次数和最后使用时间
- 最多保存10个最近目录

### 💫 用户体验增强

- 美观的模态框目录选择界面
- 支持自定义路径输入
- 显示导出进度和状态反馈
- 中文界面和提示信息

## 功能使用

### 1. 导出标注数据

1. 点击"导出AAGNet"或"导出MFTRCAD"按钮
2. 在弹出的目录选择对话框中：
    - 输入自定义目录路径，或
    - 从最近使用的目录中选择
3. 点击"确认"开始导出
4. 系统自动生成文件名并保存

### 2. 文件命名规则

```
{模型名}_{格式}_{时间戳}.json
例如：model_aagnet_2025-01-15T10-30-00.json
```

### 3. 支持的导出格式

- **AAGNet格式** 📊 - 用于AAGNet深度学习模型
- **MFTRCAD格式** 🔧 - 用于机械特征识别研究

## 技术特性

### 浏览器兼容性

- ✅ 现代浏览器：使用原生 File System Access API
- ✅ 传统浏览器：使用自定义目录选择界面
- ✅ 所有浏览器：支持文件下载降级方案

### 数据存储

- 使用 localStorage 存储最近目录历史
- 自动清理过期和重复记录
- 支持手动清除历史记录

### 错误处理

- 完善的错误捕获和用户提示
- 自动降级到备用方案
- 详细的控制台日志记录

## 代码结构

```
packages/chili-annotation/src/exporters/
├── exportService.ts          # 主导出服务类
├── aagnetExporter.ts         # AAGNet格式导出器
├── mftrcadExporter.ts        # MFTRCAD格式导出器
├── baseExporter.ts           # 导出器基类
└── index.ts                  # 导出接口

packages/chili-annotation/src/ui/
└── annotationPanel.ts        # 更新的UI面板
```

## 主要类和接口

### ExportService

- `selectExportDirectory()` - 显示目录选择对话框
- `exportAnnotations()` - 执行导出操作
- `addToRecentDirectories()` - 管理最近目录
- `getRecentDirectories()` - 获取历史目录

### ExportDirectoryConfig

```typescript
interface ExportDirectoryConfig {
    directory: string; // 目标目录
    fileName: string; // 文件名
    format: "aagnet" | "mftrcad";
    config?: ExportConfig;
}
```

### RecentDirectory

```typescript
interface RecentDirectory {
    path: string; // 目录路径
    lastUsed: Date; // 最后使用时间
    usageCount: number; // 使用次数
}
```

## 示例用法

```typescript
import { ExportService } from "./exporters/exportService";

const exportService = new ExportService();

// 选择目录并导出
const directory = await exportService.selectExportDirectory();
if (directory) {
    const result = await exportService.exportAnnotations(annotations, modelName, totalFaceCount, {
        directory,
        fileName: "export.json",
        format: "aagnet",
    });
}
```

## 测试状态

✅ 所有测试通过 (22/22)  
✅ 构建成功  
✅ TypeScript 类型检查通过  
✅ 与现有功能完全兼容

## 未来改进方向

- [ ] 支持批量导出多个格式
- [ ] 添加导出模板和预设配置
- [ ] 支持云存储服务集成
- [ ] 导出进度的更详细显示
- [ ] 支持导出设置的持久化保存
