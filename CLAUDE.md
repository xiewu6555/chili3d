# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述 (v0.6)

Chili3D是一个开源的基于Web的3D CAD应用程序，使用TypeScript构建，通过将OpenCascade (OCCT)编译为WebAssembly并与Three.js集成来实现强大的在线建模、编辑和渲染功能。该项目包含一个完整的BREP模型标注系统，支持27种标准机加工特征类型。

## 常用命令

### 开发

```bash
npm run dev              # 启动开发服务器 (http://localhost:8080)
npm install              # 安装依赖
```

### 构建和格式化

```bash
npm run build            # 构建应用程序
npm run format           # 格式化代码 (Prettier + clang-format)
```

### 测试

```bash
npm run test             # 运行Jest测试
npm run testc            # 运行测试并生成覆盖率报告
```

### WebAssembly构建

```bash
npm run setup:wasm       # 设置WebAssembly依赖（首次构建前必需）
npm run build:wasm       # 构建C++ WebAssembly模块
```

### 发布

```bash
npm run release          # 发布新版本
```

## 项目架构

### Monorepo结构

项目使用npm workspaces组织为monorepo，主要包含以下packages：

- `chili-core` - 核心系统（文档管理、命令系统、序列化等）
- `chili-three` - Three.js渲染引擎集成
- `chili-web` - Web应用入口和用户界面
- `chili-wasm` - WebAssembly模块接口
- `chili-ui` - 用户界面组件库
- `chili-annotation` - BREP模型标注系统（支持27种机加工特征）
- `chili-controls` - 控件系统
- `chili-builder` - 构建和配置工具
- `chili-geo` - 几何计算库
- `chili-vis` - 可视化组件
- `chili-storage` - 数据存储

### 核心架构模式

1. **Application/Document模式** - 基于IApplication和IDocument接口的应用程序架构
2. **命令模式** - 所有操作通过ICommand接口实现，支持撤销/重做
3. **Node系统** - 分层的节点树结构管理3D对象
4. **事件驱动** - 基于观察者模式的事件系统
5. **插件架构** - 通过IAdditionalModule接口支持扩展模块

### TypeScript配置特点

- 启用严格模式和实验性装饰器
- 支持ESNext目标和模块系统
- 集成CSS模块支持
- 排除WebAssembly构建输出目录

### 构建系统

- **打包器**: Rspack (高性能Webpack替代品)
- **TypeScript编译**: 通过SWC loader处理
- **样式**: 原生CSS支持，支持CSS模块
- **资源处理**: WebAssembly、图片、字体等静态资源

## 开发指南

### 代码风格

- 使用Prettier格式化，tabWidth: 4, printWidth: 109
- C++代码使用clang-format Webkit风格
- 通过lint-staged在提交时自动格式化

### 测试策略

- 测试文件位置: `packages/*/test/*.test.(js|ts)`
- 使用Jest + jsdom环境
- 支持ES模块和TypeScript
- 已配置CSS模块mock

### 国际化

- 支持中英文界面
- 翻译文件位于 `packages/chili-core/src/i18n/`
- 所有UI文本都需要通过I18n系统管理

### 标注系统特性

- 支持27种机加工特征类型标注
- 三层验证系统（标注、拓扑、几何验证）
- AAGNet和MFTRCAD格式导出
- 完整的Ribbon界面集成
- 通过命令系统无缝集成

### WebAssembly集成

- OpenCascade几何内核通过WebAssembly提供
- 首次构建前必须运行 `npm run setup:wasm`
- C++源码位于cpp目录，使用CMake构建
- 构建输出自动复制到packages/chili-wasm/lib

### 架构约定

- 所有模块通过依赖注入和接口契约解耦
- 几何操作通过WASM模块执行
- UI组件使用事件总线通信
- 状态管理通过文档模型统一处理

## 开发环境要求

- Node.js (npm)
- 支持WebAssembly的现代浏览器
- C++编译环境（用于WASM构建）
- CMake（用于C++模块构建）
