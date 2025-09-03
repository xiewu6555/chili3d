# Chili-Annotation

BREP模型标注系统 - 专为Chili3D设计的3D CAD模型机加工特征标注扩展包。

## 📋 项目状态

- ✅ **核心系统已实现** - 完整的标注生命周期管理
- ✅ **TypeScript编译错误已全部修复** - 0编译错误，完全类型安全
- ✅ **与Chili3D核心系统完全集成** - 扩展Node系统和命令架构
- ✅ **开发服务器正常运行** - http://localhost:8080/ 访问

## 🎯 功能特性

### 核心功能

- **27种机加工特征类型支持** - 涵盖工业CAD中常见的所有特征类型
- **完整的标注生命周期管理** - 创建、编辑、验证、导出
- **三层验证系统** - 拓扑验证、几何验证、标注验证
- **多格式导出** - 支持AAGNet和MFTRCAD格式
- **可视化界面** - 直观的标注面板和3D面选择

### 技术特性

- **TypeScript编写** - 完整的类型安全和智能提示
- **与Chili3D深度集成** - 扩展Node系统和命令架构
- **模块化设计** - 清晰的组件分离和职责划分
- **可扩展架构** - 易于添加新的特征类型和验证规则

## 🚀 快速开始

### 启动开发环境

```bash
# 确保在项目根目录
cd F:\Code\OpenProject\chili3d

# 启动开发服务器
npm run dev

# 访问 http://localhost:8080/ 查看应用
```

### 基本使用

#### 1. 启动标注模式

```typescript
import { StartAnnotationCommand } from "chili-annotation";

const startCommand = new StartAnnotationCommand();
await startCommand.execute(application);
```

#### 2. 创建标注

```typescript
import { CreateAnnotationCommand, MachiningFeatureType } from "chili-annotation";

const createCommand = new CreateAnnotationCommand(MachiningFeatureType.ThroughHole, "通孔特征_001");
await createCommand.execute(application);
```

#### 3. 使用UI界面

```typescript
// 获取或创建标注管理器
const manager = new AnnotationManager(document);

// 创建标注面板
const panel = new AnnotationPanel(manager, document);

// 将面板添加到页面
document.body.appendChild(panel.element);

// 创建面选择处理器
const selectionHandler = new FaceSelectionHandler(manager, document);
selectionHandler.activate();
```

#### 4. 验证标注

```typescript
import { ValidateAnnotationsCommand } from "chili-annotation";

const validateCommand = new ValidateAnnotationsCommand();
await validateCommand.execute(application);
```

#### 5. 导出标注

```typescript
import { ExportAnnotationsCommand } from "chili-annotation";

// 导出为AAGNet格式
const exportCommand = new ExportAnnotationsCommand("aagnet", "model.step");
await exportCommand.execute(application);
```

## 📊 支持的特征类型

### 孔类特征

- `ThroughHole` (1) - 通孔
- `BlindHole` (12) - 盲孔

### 槽类特征

- `TriangularThroughSlot` (5) - 三角形通槽
- `RectangularThroughSlot` (6) - 矩形通槽
- `CircularThroughSlot` (7) - 圆形通槽
- `RectangularBlindSlot` (17) - 矩形盲槽
- `VerticalCircularEndBlindSlot` (18) - 垂直圆端盲槽
- `HorizontalCircularEndBlindSlot` (19) - 水平圆端盲槽

### 台阶特征

- `RectangularThroughStep` (8) - 矩形通阶
- `TwoSidesThroughStep` (9) - 双面通阶
- `SlantedThroughStep` (10) - 斜面通阶
- `TriangularBlindStep` (20) - 三角形盲阶
- `CircularBlindStep` (21) - 圆形盲阶
- `RectangularBlindStep` (22) - 矩形盲阶

### 凹槽特征

- `TriangularPocket` (13) - 三角形凹槽
- `RectangularPocket` (14) - 矩形凹槽
- `SixSidesPocket` (15) - 六边形凹槽
- `CircularEndPocket` (16) - 圆底凹槽

### 通道特征

- `TriangularPassage` (2) - 三角形通道
- `RectangularPassage` (3) - 矩形通道
- `SixSidesPassage` (4) - 六边形通道

### 其他特征

- `Chamfer` (0) - 倒角
- `ORing` (11) - O型圈槽
- `Round` (23) - 圆角
- `Stock` (24) - 坯料面
- `Cylinder` (25) - 圆柱面
- `Cone` (26) - 圆锥面

## 🔧 API 文档

### 核心类

#### AnnotationManager

标注管理器，负责整个标注系统的协调。

```typescript
class AnnotationManager {
    createAnnotation(type: MachiningFeatureType, name?: string): AnnotationNode;
    deleteAnnotation(id: string): boolean;
    getAnnotation(id: string): AnnotationNode | undefined;
    get annotations(): AnnotationNode[];
    get activeAnnotation(): AnnotationNode | undefined;
}
```

#### AnnotationNode

标注节点，扩展Chili3D的Node系统。

```typescript
class AnnotationNode extends Node {
    get featureType(): MachiningFeatureType;
    get faces(): number[];
    get geometricParams(): GeometricParams;

    addFaces(faceIds: number | number[]): void;
    removeFaces(faceIds: number | number[]): void;
    clearFaces(): void;
    validate(validator?: string): ValidationResult;
}
```

#### 验证器系统

确保标注质量的三层验证。

```typescript
class TopologyValidator {
    validateTopology(annotation: Annotation): ValidationResult;
}

class GeometryValidator {
    validateGeometry(annotation: Annotation): ValidationResult;
    validateFeatureRelations(annotations: Annotation[]): ValidationResult;
}

class DefaultAnnotationValidator implements IAnnotationValidator {
    validate(annotation: Annotation): ValidationResult;
}
```

### UI组件

#### AnnotationPanel

主标注面板，提供完整的用户界面。

```typescript
class AnnotationPanel {
    constructor(manager: AnnotationManager, document: IDocument);
    get element(): HTMLElement;
    dispose(): void;
}
```

#### FaceSelectionHandler

面选择处理器，处理3D视口中的面选择交互。

```typescript
class FaceSelectionHandler {
    activate(): void;
    deactivate(): void;
    get selectedFaces(): number[];
    setSelectedFaces(faceIds: number[]): void;
    simulateFaceClick(faceId: number, ctrlPressed?: boolean): void;
}
```

### 命令系统

```typescript
// 标注相关命令
export const AnnotationCommands = {
    StartAnnotationCommand, // 启动标注模式
    StopAnnotationCommand, // 停止标注模式
    CreateAnnotationCommand, // 创建标注
    DeleteAnnotationCommand, // 删除标注
    ValidateAnnotationsCommand, // 验证标注
    ExportAnnotationsCommand, // 导出标注
    ClearAnnotationsCommand, // 清除所有标注
};
```

## 📁 数据格式

### 几何参数 (GeometricParams)

```typescript
interface GeometricParams {
    diameter?: number; // 直径
    depth?: number; // 深度
    width?: number; // 宽度
    height?: number; // 高度
    length?: number; // 长度
    axis?: [number, number, number]; // 轴向
    center?: [number, number, number]; // 中心点
    angle?: number; // 角度
    radius?: number; // 半径
    [key: string]: any; // 允许动态属性访问
}
```

### 公差规范 (ToleranceSpec)

```typescript
interface ToleranceSpec {
    tolerance?: string; // 如 "H7", "IT6"等
    surfaceFinish?: string; // 表面粗糙度，如 "Ra1.6"
    geometricTolerance?: string; // 几何公差
    notes?: string; // 备注
}
```

### 验证结果 (ValidationResult)

```typescript
interface ValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
}
```

### 配置选项 (AnnotationSystemConfig)

```typescript
interface AnnotationSystemConfig {
    enableValidation?: boolean; // 启用验证功能
    enableHistory?: boolean; // 启用历史记录功能
    maxHistorySize?: number; // 最大历史记录数量
    defaultExportFormat?: "aagnet" | "mftrcad"; // 默认导出格式
    autoSaveInterval?: number; // 自动保存间隔（毫秒）
}
```

## 📤 导出格式

### AAGNet格式

学术研究和机器学习应用的标准格式。

```json
{
    "format": "aagnet",
    "fileName": "model.step",
    "annotations": [
        {
            "id": "annotation_1",
            "name": "ThroughHole_001",
            "type": 1,
            "faces": [1, 2, 3]
        }
    ],
    "timestamp": "2025-09-03T10:30:00.000Z"
}
```

### MFTRCAD格式

工业CAD应用和标准化的数据格式。

```json
{
    "format": "mftrcad",
    "fileName": "model.step",
    "annotations": [
        {
            "id": "annotation_1",
            "name": "ThroughHole_001",
            "type": 1,
            "faces": [1, 2, 3]
        }
    ],
    "timestamp": "2025-09-03T10:30:00.000Z"
}
```

## 🛠 开发指南

### 添加新特征类型

1. 在 `MachiningFeatureType` 枚举中添加新类型
2. 更新 `FEATURE_NAMES_CN` 和 `FEATURE_NAMES_EN` 映射
3. 在 `FEATURE_COLORS` 中添加颜色定义
4. 在 `GeometryValidator` 中添加特定验证逻辑
5. 更新UI组件以支持新类型

### 扩展验证规则

1. 创建新的验证器类继承相应的基类
2. 实现 `IAnnotationValidator` 接口
3. 在 `DefaultAnnotationValidator` 中注册新验证器
4. 添加相应的测试用例

### 自定义导出格式

1. 实现新的导出器类
2. 在 `ExportAnnotationsCommand` 中添加格式支持
3. 更新UI组件的导出选项
4. 添加格式验证逻辑

## 🐛 故障排除

### 常见问题

#### 编译错误

如果遇到TypeScript编译错误，请参考 `FIXES.md` 文档中的详细解决方案。

#### 开发服务器启动失败

```bash
# 清理并重新安装依赖
npm clean-install

# 重新启动
npm run dev
```

#### 面选择不工作

确保：

1. `FaceSelectionHandler` 已正确初始化
2. 3D视口事件监听器已设置
3. 面ID正确传递
4. 使用 `simulateFaceClick()` 进行测试

#### 验证失败

检查：

1. 几何参数是否完整和有效
2. 面数据是否正确关联
3. 特征类型是否匹配预期
4. 使用详细的错误信息进行调试

### 调试技巧

1. 使用浏览器开发者工具查看控制台输出
2. 检查 `manager.annotations` 数组状态
3. 使用 `ValidateAnnotationsCommand` 获取详细错误信息
4. 查看网络面板检查导出功能

## 📚 文档结构

```
packages/chili-annotation/
├── README.md              # 本文档
├── FIXES.md              # 详细的修复记录
├── package.json          # 包配置
├── src/
│   ├── index.ts          # 主要导出
│   ├── annotation.ts     # 核心标注类
│   ├── annotationManager.ts  # 标注管理器
│   ├── annotationNode.ts # 标注节点
│   ├── featureTypes.ts   # 特征类型定义
│   ├── commands/         # 命令系统
│   ├── validators/       # 验证器系统
│   ├── exporters/        # 导出器
│   └── ui/              # UI组件
└── test/                # 测试文件
```

## 📈 版本历史

### v1.0.0 (2025-09-03)

- ✅ 初始版本发布
- ✅ 支持27种机加工特征类型
- ✅ 完整的三层验证系统
- ✅ AAGNet和MFTRCAD导出支持
- ✅ 与Chili3D核心系统集成
- ✅ 所有TypeScript编译错误已修复
- ✅ 开发服务器正常运行

## 🤝 贡献指南

1. Fork 项目仓库
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 开启 Pull Request

### 开发规范

- 遵循项目的TypeScript配置和代码风格
- 添加适当的单元测试
- 更新相关文档
- 确保所有编译检查通过

## 📄 许可证

本项目基于 AGPL-3.0 许可证开源。详见 [LICENSE](../../LICENSE) 文件。

## 📞 联系方式

- 项目主页: [Chili3D](https://github.com/xiangechen/chili3d)
- 问题反馈: [Issues](https://github.com/xiangechen/chili3d/issues)
- 修复记录: [FIXES.md](./FIXES.md)

---

**最后更新**: 2025-09-03  
**版本**: v1.0.0  
**状态**: ✅ 生产就绪
