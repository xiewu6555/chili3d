# BREP Model Annotation System - User Guide

## Overview

The BREP Model Annotation System allows you to annotate machining features on 3D CAD models. It supports 27 different types of machining features and provides an intuitive interface for selecting faces, creating annotations, and exporting results.

## Getting Started

### Prerequisites

1. **Active Document**: Ensure you have a 3D model loaded in Chili3d
2. **3D View**: The annotation system requires an active 3D viewport
3. **Model with Faces**: Your model should have identifiable faces for annotation

### Starting the Annotation System

1. **Launch Annotation Mode**
   - Click the "Start Annotation" button in the toolbar
   - Or use the command: `annotation.start`
   - A confirmation message will appear when the system is ready

2. **System Components**
   - **Annotation Panel**: Appears on the right side of the screen
   - **Face Selection**: 3D view becomes interactive for face selection
   - **Visual Feedback**: Selected faces will be highlighted

## User Interface

### Annotation Panel

The annotation panel contains the following sections:

#### 1. Feature Type Selection
- **Dropdown Menu**: Choose from 27 machining feature types
- **Bilingual Labels**: Features shown in English and Chinese
- **Categories**: Holes, slots, steps, pockets, surface features, etc.

#### 2. Active Annotation Info
- **Current Annotation**: Shows name and type of active annotation
- **Face Count**: Number of faces assigned to the annotation
- **Selected Faces**: Real-time display of currently selected faces

#### 3. Action Buttons
- **Create New Annotation**: Creates a new annotation of the selected type
- **Select Faces**: Activates face selection mode in 3D view
- **Add Selected Faces**: Adds selected faces to the active annotation
- **Confirm Annotation**: Finalizes and validates the annotation
- **Delete Active**: Removes the currently active annotation

#### 4. Annotations List
- **All Annotations**: Shows all created annotations
- **Click to Activate**: Click any annotation to make it active
- **Face Highlighting**: Clicking an annotation highlights its faces
- **Visual Indicators**: Active annotation is highlighted in blue

#### 5. Export Section
- **AAGNet Export**: Export in AAGNet/MFInstSeg format
- **MFTRCAD Export**: Export in MFTRCAD format

## Step-by-Step Workflow

### Method 1: Create-First Workflow (Recommended)

1. **Start Annotation Mode**
   ```
   Click "Start Annotation" → System launches with panel displayed
   ```

2. **Select Feature Type**
   ```
   Choose from dropdown → Select appropriate machining feature type
   Example: "Through Hole (通孔)" for a cylindrical hole
   ```

3. **Create Annotation**
   ```
   Click "Create New Annotation" → New annotation becomes active
   Status: Shows annotation name and 0 faces
   ```

4. **Select Faces**
   ```
   Click "Select Faces" → 3D view becomes interactive
   Click directly on model faces → Multiple faces can be selected
   Press Esc → Complete selection process
   ```

5. **Add Faces to Annotation**
   ```
   Click "Add Selected Faces" → Faces added to active annotation
   Status: Shows updated face count
   ```

6. **Confirm Annotation**
   ```
   Click "Confirm Annotation" → Validates and finalizes annotation
   Result: Annotation is complete and validated
   ```

### Method 2: Select-First Workflow

1. **Start Annotation Mode** (as above)

2. **Select Faces First**
   ```
   Click "Select Faces" → Enter selection mode
   Click on model faces → Select desired faces
   Press Esc → Complete selection
   ```

3. **Create Annotation**
   ```
   Choose feature type → Select from dropdown
   Click "Create New Annotation" → Create with selected type
   ```

4. **Add Faces** (as above)

5. **Confirm Annotation** (as above)

## Face Selection Guide

### Selection Modes

#### Single Face Selection
- **Basic Click**: Click on any face to select it
- **Replace Selection**: Each click replaces the previous selection

#### Multiple Face Selection
- **Direct Multi-Select**: Simply click multiple faces in sequence
- **No Ctrl Required**: The system automatically supports multi-selection
- **Visual Feedback**: Selected faces are highlighted in real-time

#### Selection Completion
- **Escape Key**: Press Esc to complete face selection
- **Auto-Update**: Panel shows selected face count immediately
- **Face IDs**: Selected face IDs are displayed in the panel

### Selection Tips

1. **Zoom and Rotate**: Use mouse controls to get better view angles
2. **Face Visibility**: Only click on clearly visible faces
3. **Selection Feedback**: Watch the panel for real-time selection updates
4. **Error Recovery**: Press Esc to clear selection if needed

## Supported Feature Types

### Hole Features
- **Through Hole (通孔)**: Cylindrical holes that go through the entire part
- **Blind Hole (盲孔)**: Cylindrical holes that don't go through completely

### Slot Features
- **Rectangular Through Slot (矩形通槽)**: Rectangular channels through the part
- **Triangular Through Slot (三角形通槽)**: Triangular channels through the part
- **Circular Through Slot (圆形通槽)**: Circular channels through the part
- **Rectangular Blind Slot (矩形盲槽)**: Rectangular pockets that don't go through

### Step Features
- **Rectangular Through Step (矩形通阶)**: Rectangular step features
- **Two Sides Through Step (双面通阶)**: Steps accessible from two sides
- **Slanted Through Step (斜面通阶)**: Angled step features

### Pocket Features
- **Rectangular Pocket (矩形凸台)**: Rectangular recessed areas
- **Triangular Pocket (三角形凸台)**: Triangular recessed areas
- **Six Sides Pocket (六边形凸台)**: Hexagonal recessed areas
- **Circular End Pocket (圆底凸台)**: Pockets with circular bottoms

### Surface Features
- **Chamfer (倒角)**: Angled cuts on edges
- **Round (圆角)**: Rounded edges or corners
- **O-ring (O型圈槽)**: Grooves for O-ring seals

### Basic Geometry
- **Stock (坯料面)**: Basic material faces
- **Cylinder (圆柱面)**: Cylindrical surfaces
- **Cone (圆锥面)**: Conical surfaces

## Validation and Quality Control

### Automatic Validation

The system performs automatic validation when:
- Adding faces to annotations
- Confirming annotations
- Exporting data

### Validation Rules

#### Basic Validation
- **Face ID Validity**: All face IDs must be valid integers
- **Annotation Completeness**: Annotations must have names and faces
- **No Duplicate Faces**: Each face can only belong to one annotation

#### Feature-Specific Validation
- **Holes**: Must have 1-3 faces (cylindrical surface + end faces)
- **Chamfers/Rounds**: Typically have exactly 1 face
- **Pockets**: Must have at least 2 faces (bottom + sides)
- **Slots**: Should have at least 3 faces for through slots

#### Topology Validation
- **Face Uniqueness**: No face can be assigned to multiple annotations
- **Connectivity**: Related faces should be topologically connected
- **Consistency**: Feature type should match selected faces

### Error Handling

#### Validation Errors (Red)
- **Missing Faces**: Annotation has no assigned faces
- **Invalid Face IDs**: Face IDs are not valid numbers
- **Duplicate Assignments**: Face already assigned to another annotation

#### Validation Warnings (Yellow)
- **Face Count**: Unusual number of faces for feature type
- **Topology**: Faces may not be optimally connected
- **Completeness**: Missing optional parameters

## Export Functionality

### AAGNet Format Export

**Purpose**: Academic research and machine learning applications

**Content**:
- Semantic segmentation labels
- Instance segmentation matrix
- Bottom face identification
- Feature classification data

**Usage**:
1. Click "Export AAGNet"
2. System generates JSON file
3. Download begins automatically

### MFTRCAD Format Export

**Purpose**: Industrial CAD applications and standardization

**Content**:
- Machining feature definitions
- Associated face mappings
- Geometric parameters
- Tolerance specifications

**Usage**:
1. Click "Export MFTRCAD"
2. System generates JSON file
3. Download begins automatically

## Troubleshooting

### Common Issues

#### "No Active Document" Error
**Problem**: System cannot find a loaded 3D model
**Solution**: 
1. Load a 3D model in Chili3d
2. Ensure the model is properly displayed
3. Restart annotation mode

#### Face Selection Not Working
**Problem**: Clicking on 3D model doesn't select faces
**Solution**:
1. Ensure annotation mode is started
2. Click "Select Faces" button first
3. Make sure 3D view has focus
4. Try clicking directly on face centers

#### "No Active Annotation" Warning
**Problem**: Trying to add faces without creating annotation first
**Solution**:
1. Select feature type from dropdown
2. Click "Create New Annotation"
3. Then select and add faces

#### Annotation Panel Not Visible
**Problem**: Panel doesn't appear after starting annotation mode
**Solution**:
1. Check browser console for errors
2. Refresh the page and restart
3. Ensure browser supports modern JavaScript features

### Validation Failures

#### "Face validation failed" Error
**Cause**: Invalid face IDs or topology issues
**Solution**:
1. Re-select faces more carefully
2. Ensure faces are actually part of the model
3. Check for face numbering consistency

#### "Annotation has no faces" Error
**Cause**: Trying to confirm annotation without faces
**Solution**:
1. Select faces in 3D view
2. Click "Add Selected Faces"
3. Verify face count in panel before confirming

### Performance Issues

#### Slow Face Selection
**Cause**: Large models or complex geometry
**Solution**:
1. Zoom in on specific areas
2. Select faces in smaller batches
3. Avoid selecting too many faces at once

#### UI Responsiveness
**Cause**: Heavy computation during validation
**Solution**:
1. Work with smaller annotation sets
2. Confirm annotations frequently
3. Export data periodically

## Best Practices

### Annotation Quality

1. **Consistent Naming**: Use descriptive names for annotations
2. **Complete Features**: Include all relevant faces for each feature
3. **Validate Frequently**: Confirm annotations regularly to catch errors early
4. **Review Before Export**: Check all annotations before final export

### Workflow Efficiency

1. **Plan Ahead**: Identify all features before starting annotation
2. **Group Similar Features**: Annotate similar feature types together
3. **Use Good Viewing Angles**: Position 3D view for optimal face visibility
4. **Save Progress**: Export data regularly to avoid losing work

### Model Preparation

1. **Clean Geometry**: Ensure model has well-defined faces
2. **Appropriate Detail**: Model should have sufficient detail for feature identification
3. **Consistent Units**: Use consistent units throughout the model
4. **Face Numbering**: Ensure stable face numbering if possible

## Advanced Features

### History and Undo

- **Operation History**: All operations are tracked automatically
- **Undo Support**: Use Ctrl+Z to undo recent operations (if supported)
- **Change Tracking**: Each annotation maintains its modification history

### Multi-User Scenarios

- **Annotator Identification**: Each annotation records who created it
- **Timestamp Tracking**: Creation and modification times are recorded
- **Confidence Scoring**: Optional confidence levels can be assigned

### Batch Operations

- **Multiple Annotations**: Create and manage multiple annotations simultaneously
- **Bulk Validation**: Validate all annotations at once
- **Batch Export**: Export multiple annotations in single operation

## Keyboard Shortcuts

- **Esc**: Complete face selection / Clear selection
- **Ctrl+A**: Select all faces (when in selection mode)
- **Ctrl+I**: Invert face selection
- **Delete**: Delete active annotation (with confirmation)

## Tips for Success

1. **Start Simple**: Begin with obvious, easy-to-identify features
2. **Work Methodically**: Complete one annotation before starting the next
3. **Double-Check Selections**: Verify face selections before confirming
4. **Use Validation**: Pay attention to validation messages
5. **Export Early**: Save your work regularly through exports
6. **Practice**: Familiarize yourself with the interface on simple models first

This user guide provides comprehensive instructions for effectively using the BREP Model Annotation System. For technical details and development information, refer to the Technical Architecture and Developer Guide documents.