# BREP Model Annotation System - Developer Guide

## Development Setup

### Prerequisites

1. **Chili3d Development Environment**
   - Node.js >= 16.0.0
   - npm >= 8.0.0
   - TypeScript >= 4.5.0

2. **Required Dependencies**
   - `chili-core`: Core Chili3d functionality
   - `chili-vis`: Visual system integration
   - `chili-ui`: UI components

3. **Development Tools**
   - VS Code with TypeScript extension
   - Browser with WebGL support
   - Git for version control

### Installation and Build

```bash
# Install dependencies
npm install

# Build the annotation package
npm run build

# Run in development mode
npm run dev

# Run tests
npm run test

# Format code
npm run format
```

## Code Structure and Patterns

### Package Structure

```
packages/chili-annotation/
├── src/
│   ├── annotation.ts              # Core annotation model
│   ├── annotationNode.ts          # Chili3d Node integration
│   ├── annotationManager.ts       # Central management
│   ├── featureTypes.ts           # Feature type definitions
│   ├── commands/                 # Command implementations
│   │   ├── annotationCommands.ts
│   │   ├── selectFacesCommand.ts
│   │   └── annotationCommand.ts
│   ├── validators/               # Validation system
│   │   ├── annotationValidator.ts
│   │   ├── geometryValidator.ts
│   │   └── topologyValidator.ts
│   ├── exporters/               # Export system
│   │   ├── baseExporter.ts
│   │   ├── aagnetExporter.ts
│   │   └── mftrcadExporter.ts
│   ├── ui/                      # User interface
│   │   ├── annotationPanel.ts
│   │   └── faceSelectionHandler.ts
│   └── index.ts                 # Package exports
├── docs/                        # Documentation
├── test/                        # Test files
└── package.json
```

### Architectural Patterns

#### 1. Dependency Injection Pattern

The system uses constructor injection for dependencies:

```typescript
export class AnnotationManager implements IDisposable {
    constructor(
        private _document: IDocument,
        private _validator?: IAnnotationValidator
    ) {
        this._validator = validator || new DefaultAnnotationValidator();
    }
}
```

#### 2. Event-Driven Architecture

Components communicate through events to maintain loose coupling:

```typescript
export class AnnotationManager {
    private _onAnnotationCreated: ((node: AnnotationNode) => void)[] = [];
    
    onAnnotationCreated(callback: (node: AnnotationNode) => void): void {
        this._onAnnotationCreated.push(callback);
    }
    
    private notifyAnnotationCreated(node: AnnotationNode): void {
        this._onAnnotationCreated.forEach(callback => callback(node));
    }
}
```

#### 3. Command Pattern Implementation

All user actions are implemented as commands:

```typescript
@command({
    key: "annotation.create",
    icon: "icon-add",
})
export class CreateAnnotationCommand implements ICommand {
    async execute(application: IApplication): Promise<void> {
        // Command implementation
        const document = application.activeView?.document;
        const manager = (document as any)._annotationManager;
        
        if (!manager) {
            throw new Error("Annotation system not initialized");
        }
        
        // Perform the operation
        const annotation = manager.createAnnotation(featureType);
        
        // Update UI
        this.updateUI(manager);
    }
}
```

#### 4. Strategy Pattern for Validation

Different validation strategies can be plugged in:

```typescript
export interface IAnnotationValidator {
    validateAnnotation(annotation: Annotation): ValidationResult;
    validateFaces(annotation: Annotation, faceIds: number[]): ValidationResult;
}

export class DefaultAnnotationValidator implements IAnnotationValidator {
    validateAnnotation(annotation: Annotation): ValidationResult {
        // Default validation logic
    }
}

export class StrictAnnotationValidator implements IAnnotationValidator {
    validateAnnotation(annotation: Annotation): ValidationResult {
        // Strict validation logic
    }
}
```

## Core Development Concepts

### 1. Annotation Lifecycle

Understanding the annotation lifecycle is crucial for development:

```typescript
// 1. Creation
const annotation = new Annotation(MachiningFeatureType.ThroughHole, "Hole_1", "user123");

// 2. Face Assignment
annotation.addFaces([1, 2, 3]);

// 3. Parameter Setting
annotation.geometricParams = { diameter: 10, depth: 20 };

// 4. Validation
const result = annotation.validate();

// 5. Integration with Document
const node = new AnnotationNode(document, annotation);
manager.addAnnotation(node);

// 6. Export
const exportData = exporter.export([node], "model.step", 100);

// 7. Cleanup
annotation.dispose();
```

### 2. Face Selection Integration

Face selection integrates with Chili3d's visual system:

```typescript
// Detect face under cursor
const shapes = await view.detectShapes(ShapeType.Face, x, y);

// Extract face information
const faceData = this.extractFaceData(shapes[0]);

// Update selection state
this._manager.selectFaces([faceData.faceId]);

// Update visual feedback
document.visual.highlighter.addState(
    visual,
    VisualState.faceColored,
    ShapeType.Face,
    faceIndex
);
```

### 3. Property System Integration

AnnotationNode properties integrate with Chili3d's property system:

```typescript
export class AnnotationNode extends Node {
    @Serializer.serialze()
    @Property.define("annotation.featureType")
    get featureType(): MachiningFeatureType {
        return this._annotation.type;
    }
    
    set featureType(value: MachiningFeatureType) {
        this._annotation.type = value;
        this.onPropertyChanged("featureType");
    }
}
```

## Extension Points

### 1. Adding New Feature Types

To add new machining feature types:

```typescript
// 1. Extend the enum
export enum MachiningFeatureType {
    // ... existing types
    CustomDrillHole = 100,
    CustomCountersink = 101,
}

// 2. Add name mappings
FEATURE_NAMES_EN[MachiningFeatureType.CustomDrillHole] = "Custom Drill Hole";
FEATURE_NAMES_CN[MachiningFeatureType.CustomDrillHole] = "自定义钻孔";

// 3. Add color mapping
FEATURE_COLORS[MachiningFeatureType.CustomDrillHole] = "#FF5722";

// 4. Update validation rules
private validateFeatureTypeConstraints(annotation: Annotation, result: ValidationResult): void {
    switch (annotation.type) {
        case MachiningFeatureType.CustomDrillHole:
            if (annotation.faces.length < 2) {
                result.errors.push("Custom drill holes must have at least 2 faces");
            }
            break;
        // ... other cases
    }
}
```

### 2. Custom Validators

Implement custom validation logic:

```typescript
export class DomainSpecificValidator implements IAnnotationValidator {
    validateAnnotation(annotation: Annotation): ValidationResult {
        const result = super.validateAnnotation(annotation);
        
        // Add domain-specific rules
        if (annotation.type === MachiningFeatureType.ThroughHole) {
            const params = annotation.geometricParams;
            if (params.diameter && params.diameter < 1) {
                result.errors.push("Hole diameter must be at least 1mm");
            }
        }
        
        return result;
    }
}

// Register the validator
const manager = new AnnotationManager(document, new DomainSpecificValidator());
```

### 3. Custom Export Formats

Add support for new export formats:

```typescript
export class CustomCADExporter extends BaseAnnotationExporter {
    constructor(config: ExportConfig = {}) {
        super({ ...config, format: "custom-cad" });
    }
    
    export(annotations: AnnotationNode[], modelFileName: string, totalFaceCount: number): any {
        const exportData = {
            format: "CustomCAD",
            version: "1.0",
            model: modelFileName,
            features: annotations.map(this.convertAnnotation),
        };
        
        return exportData;
    }
    
    private convertAnnotation(annotation: AnnotationNode): any {
        return {
            id: annotation.annotation.id,
            type: this.getCustomFeatureType(annotation.featureType),
            faces: annotation.faces,
            parameters: this.convertParameters(annotation.geometricParams),
        };
    }
    
    validate(exportedData: any): { isValid: boolean; errors: string[] } {
        // Implement format-specific validation
        const errors: string[] = [];
        
        if (!exportedData.format || exportedData.format !== "CustomCAD") {
            errors.push("Invalid format identifier");
        }
        
        return { isValid: errors.length === 0, errors };
    }
}
```

### 4. Custom UI Components

Extend the annotation panel with custom functionality:

```typescript
export class EnhancedAnnotationPanel extends AnnotationPanel {
    constructor(manager: AnnotationManager, document: IDocument, config?: PanelConfig) {
        super(manager, document);
        this.addCustomComponents(config);
    }
    
    private addCustomComponents(config?: PanelConfig): void {
        // Add custom parameter input section
        const paramSection = this.createParameterSection();
        this._element.appendChild(paramSection);
        
        // Add advanced validation options
        const validationSection = this.createAdvancedValidationSection();
        this._element.appendChild(validationSection);
    }
    
    private createParameterSection(): HTMLElement {
        const section = document.createElement("div");
        section.className = "parameter-section";
        
        // Create parameter input controls
        const diameterInput = this.createParameterInput("diameter", "Diameter");
        const depthInput = this.createParameterInput("depth", "Depth");
        
        section.appendChild(diameterInput);
        section.appendChild(depthInput);
        
        return section;
    }
    
    private createParameterInput(key: string, label: string): HTMLElement {
        const container = document.createElement("div");
        container.className = "parameter-input";
        
        const labelEl = document.createElement("label");
        labelEl.textContent = `${label}:`;
        
        const input = document.createElement("input");
        input.type = "number";
        input.step = "0.1";
        input.onchange = () => this.updateParameter(key, parseFloat(input.value));
        
        container.appendChild(labelEl);
        container.appendChild(input);
        
        return container;
    }
    
    private updateParameter(key: string, value: number): void {
        const activeAnnotation = this._manager.activeAnnotation;
        if (activeAnnotation) {
            const params = { ...activeAnnotation.geometricParams };
            params[key] = value;
            activeAnnotation.geometricParams = params;
        }
    }
}
```

## Testing Guidelines

### Unit Testing

Test individual components in isolation:

```typescript
import { Annotation, MachiningFeatureType } from "../src/annotation";

describe("Annotation", () => {
    let annotation: Annotation;
    
    beforeEach(() => {
        annotation = new Annotation(
            MachiningFeatureType.ThroughHole,
            "TestHole",
            "testUser"
        );
    });
    
    afterEach(() => {
        annotation.dispose();
    });
    
    test("should create annotation with correct initial state", () => {
        expect(annotation.type).toBe(MachiningFeatureType.ThroughHole);
        expect(annotation.name).toBe("TestHole");
        expect(annotation.faces).toEqual([]);
        expect(annotation.metadata.annotator).toBe("testUser");
    });
    
    test("should add faces correctly", () => {
        annotation.addFaces([1, 2, 3]);
        expect(annotation.faces).toEqual([1, 2, 3]);
        expect(annotation.faceCount).toBe(3);
    });
    
    test("should validate correctly", () => {
        annotation.addFaces([1]);
        const result = annotation.validate();
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
    });
});
```

### Integration Testing

Test component interactions:

```typescript
import { AnnotationManager } from "../src/annotationManager";
import { MockDocument, MockValidator } from "./mocks";

describe("AnnotationManager Integration", () => {
    let manager: AnnotationManager;
    let mockDocument: MockDocument;
    
    beforeEach(() => {
        mockDocument = new MockDocument();
        manager = new AnnotationManager(mockDocument, new MockValidator());
    });
    
    afterEach(() => {
        manager.dispose();
    });
    
    test("should create and manage annotations", () => {
        const node = manager.createAnnotation(MachiningFeatureType.ThroughHole, "TestHole");
        
        expect(manager.annotations).toContain(node);
        expect(manager.activeAnnotation).toBe(node);
    });
    
    test("should handle face selection workflow", () => {
        const node = manager.createAnnotation(MachiningFeatureType.ThroughHole, "TestHole");
        manager.selectFaces([1, 2, 3]);
        
        const success = manager.addSelectedFacesToActiveAnnotation();
        
        expect(success).toBe(true);
        expect(node.faces).toEqual([1, 2, 3]);
        expect(manager.selectedFaces).toEqual([]);
    });
});
```

### End-to-End Testing

Test complete user workflows:

```typescript
describe("Annotation Workflow E2E", () => {
    test("complete annotation creation workflow", async () => {
        // 1. Start annotation system
        const startCommand = new StartAnnotationCommand();
        await startCommand.execute(mockApplication);
        
        // 2. Create annotation
        const createCommand = new CreateAnnotationCommand();
        await createCommand.execute(mockApplication);
        
        // 3. Select faces
        const selectCommand = new SelectFacesCommand();
        await selectCommand.execute(mockApplication);
        
        // 4. Add faces
        const addCommand = new AddSelectedFacesCommand();
        await addCommand.execute(mockApplication);
        
        // 5. Validate results
        const manager = mockApplication.activeView.document._annotationManager;
        expect(manager.annotations).toHaveLength(1);
        expect(manager.annotations[0].faces.length).toBeGreaterThan(0);
    });
});
```

## Performance Optimization

### 1. Memory Management

Implement proper resource cleanup:

```typescript
export class AnnotationManager implements IDisposable {
    dispose(): void {
        if (!this._disposed) {
            // Clean up annotations
            for (const node of this._annotations.values()) {
                node.dispose();
            }
            this._annotations.clear();
            
            // Clean up event handlers
            this._onAnnotationCreated.length = 0;
            this._onAnnotationDeleted.length = 0;
            
            // Clean up visual mappings
            this._faceVisualMap.clear();
            
            this._disposed = true;
        }
    }
}
```

### 2. Event Throttling

Throttle expensive operations:

```typescript
export class FaceSelectionHandler {
    private _mouseMoveThrottle = false;
    
    private handle3DViewMouseMove(event: MouseEvent): void {
        if (!this._isActive || this._mouseMoveThrottle) return;
        
        this._mouseMoveThrottle = true;
        setTimeout(() => {
            this._mouseMoveThrottle = false;
        }, 100);
        
        // Process mouse move
        this.processMouseMove(event);
    }
}
```

### 3. Lazy Loading

Load data only when needed:

```typescript
export class AnnotationNode extends Node {
    private _validationResult?: ValidationResult;
    
    get validationResult(): ValidationResult {
        if (!this._validationResult) {
            this._validationResult = this.validate();
        }
        return this._validationResult;
    }
    
    // Invalidate cache when annotation changes
    addFaces(faceIds: number | number[]): void {
        this._annotation.addFaces(faceIds);
        this._validationResult = undefined; // Clear cache
        this.onAnnotationChanged();
    }
}
```

### 4. Efficient Data Structures

Use appropriate data structures for performance:

```typescript
export class AnnotationManager {
    // Use Map for O(1) lookups
    private _annotations = new Map<string, AnnotationNode>();
    
    // Use Set for O(1) face membership tests
    private _selectedFaces = new Set<number>();
    
    // Index for fast face-to-annotation lookups
    private _faceToAnnotationIndex = new Map<number, string>();
    
    private updateFaceIndex(annotation: Annotation): void {
        // Remove old mappings
        for (const [faceId, annotationId] of this._faceToAnnotationIndex.entries()) {
            if (annotationId === annotation.id) {
                this._faceToAnnotationIndex.delete(faceId);
            }
        }
        
        // Add new mappings
        for (const faceId of annotation.faces) {
            this._faceToAnnotationIndex.set(faceId, annotation.id);
        }
    }
}
```

## Debugging and Logging

### 1. Structured Logging

Implement comprehensive logging:

```typescript
export class Logger {
    private static instance: Logger;
    private logLevel: 'debug' | 'info' | 'warn' | 'error' = 'info';
    
    static getInstance(): Logger {
        if (!Logger.instance) {
            Logger.instance = new Logger();
        }
        return Logger.instance;
    }
    
    debug(message: string, data?: any): void {
        if (this.shouldLog('debug')) {
            console.debug(`[ANNOTATION DEBUG] ${message}`, data);
        }
    }
    
    info(message: string, data?: any): void {
        if (this.shouldLog('info')) {
            console.info(`[ANNOTATION INFO] ${message}`, data);
        }
    }
    
    warn(message: string, data?: any): void {
        if (this.shouldLog('warn')) {
            console.warn(`[ANNOTATION WARN] ${message}`, data);
        }
    }
    
    error(message: string, error?: Error | any): void {
        if (this.shouldLog('error')) {
            console.error(`[ANNOTATION ERROR] ${message}`, error);
        }
    }
    
    private shouldLog(level: string): boolean {
        const levels = ['debug', 'info', 'warn', 'error'];
        return levels.indexOf(level) >= levels.indexOf(this.logLevel);
    }
}

// Usage throughout the system
const logger = Logger.getInstance();
logger.debug("Face selection started", { selectedFaces: this._selectedFaces.size });
logger.info("Annotation created", { id: annotation.id, type: annotation.type });
logger.warn("Validation warning", { annotation: annotation.id, warnings: result.warnings });
logger.error("Face selection failed", error);
```

### 2. State Inspection

Provide tools for state inspection:

```typescript
export class AnnotationManager {
    // Development helper methods
    getDebugInfo(): any {
        return {
            annotationCount: this._annotations.size,
            selectedFacesCount: this._selectedFaces.size,
            activeAnnotation: this._activeAnnotation?.annotation.id,
            faceVisualMappings: this._faceVisualMap.size,
            eventListeners: {
                created: this._onAnnotationCreated.length,
                deleted: this._onAnnotationDeleted.length,
                modified: this._onAnnotationModified.length,
                selectionChanged: this._onSelectionChanged.length,
            }
        };
    }
    
    // Validate internal state consistency
    validateInternalState(): { isValid: boolean; issues: string[] } {
        const issues: string[] = [];
        
        // Check annotation-face consistency
        for (const [faceId, annotationId] of this._faceToAnnotationIndex.entries()) {
            const annotation = this._annotations.get(annotationId);
            if (!annotation || !annotation.hasFace(faceId)) {
                issues.push(`Face ${faceId} indexed to non-existent annotation ${annotationId}`);
            }
        }
        
        // Check active annotation validity
        if (this._activeAnnotation && !this._annotations.has(this._activeAnnotation.annotation.id)) {
            issues.push("Active annotation is not in annotations collection");
        }
        
        return { isValid: issues.length === 0, issues };
    }
}
```

## Contributing Guidelines

### Code Style

Follow TypeScript and Chili3d conventions:

```typescript
// 1. Use explicit types
function createAnnotation(type: MachiningFeatureType, name: string): AnnotationNode {
    // Implementation
}

// 2. Use proper access modifiers
export class AnnotationManager {
    private _annotations = new Map<string, AnnotationNode>();
    protected validateInput(input: any): boolean { /* ... */ }
    public getAnnotation(id: string): AnnotationNode | undefined { /* ... */ }
}

// 3. Use meaningful names
const isValidFaceId = (faceId: number): boolean => Number.isInteger(faceId) && faceId >= 0;

// 4. Add JSDoc documentation
/**
 * Creates a new annotation with the specified feature type
 * @param type The machining feature type
 * @param name Optional name for the annotation
 * @returns The created annotation node
 * @throws Error if the feature type is invalid
 */
createAnnotation(type: MachiningFeatureType, name?: string): AnnotationNode {
    // Implementation
}
```

### Pull Request Process

1. **Create Feature Branch**
   ```bash
   git checkout -b feature/new-annotation-feature
   ```

2. **Implement Changes**
   - Write code following established patterns
   - Add comprehensive tests
   - Update documentation

3. **Run Quality Checks**
   ```bash
   npm run test
   npm run format
   npm run build
   ```

4. **Create Pull Request**
   - Describe changes clearly
   - Reference related issues
   - Include screenshots for UI changes

5. **Code Review**
   - Address reviewer feedback
   - Ensure all tests pass
   - Update documentation if needed

### Documentation Standards

Keep documentation up to date:

```typescript
/**
 * Face selection handler for 3D model interaction
 * 
 * Manages the selection of faces in the 3D viewport, providing
 * visual feedback and integration with the annotation system.
 * 
 * @example
 * ```typescript
 * const handler = new FaceSelectionHandler(document, manager);
 * handler.activate();
 * 
 * // Handle face selection
 * handler.onFaceSelected(faceId => {
 *     console.log(`Face ${faceId} selected`);
 * });
 * ```
 */
export class FaceSelectionHandler {
    /**
     * Activates face selection mode
     * 
     * When activated, the 3D view becomes interactive for face selection.
     * Cursor changes to crosshair and selection hints are displayed.
     */
    activate(): void {
        // Implementation
    }
}
```

## Future Enhancements

### Planned Features

1. **Advanced Validation**
   - Geometric constraint validation
   - CAD rule checking
   - Manufacturing feasibility analysis

2. **Machine Learning Integration**
   - Automatic feature recognition
   - Quality prediction
   - Annotation suggestions

3. **Collaboration Features**
   - Multi-user annotation sessions
   - Version control for annotations
   - Review and approval workflows

4. **Performance Improvements**
   - WebGL-based face selection
   - Spatial indexing for large models
   - Streaming for massive datasets

### Extension Opportunities

1. **Plugin Architecture**
   ```typescript
   interface IAnnotationPlugin {
       name: string;
       version: string;
       initialize(system: AnnotationSystem): void;
       onAnnotationCreated?(annotation: AnnotationNode): void;
       onExport?(data: any): any;
   }
   
   class AnnotationSystem {
       registerPlugin(plugin: IAnnotationPlugin): void;
       unregisterPlugin(pluginName: string): void;
   }
   ```

2. **Custom Renderers**
   ```typescript
   interface IAnnotationRenderer {
       renderAnnotation(annotation: AnnotationNode, context: RenderContext): void;
       updateHighlight(faceIds: number[], style: HighlightStyle): void;
   }
   ```

3. **Workflow Engine**
   ```typescript
   interface IAnnotationWorkflow {
       steps: WorkflowStep[];
       execute(context: WorkflowContext): Promise<void>;
       canExecute(context: WorkflowContext): boolean;
   }
   ```

This developer guide provides comprehensive information for understanding, extending, and contributing to the BREP Model Annotation System. It covers setup, architecture, patterns, testing, performance, and future development directions.