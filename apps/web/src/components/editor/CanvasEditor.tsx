import {
  Canvas,
  FabricObject,
  Group,
  IText,
  Rect,
  Shadow
} from 'fabric';
import {
  ChangeEvent,
  DragEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';

import {
  addCircleObject,
  addImageObjectFromDataUrl,
  addImageObjectFromFile,
  addRectObject,
  addTextObject,
  addTriangleObject,
  applyObjectStyleToSelection,
  applyTextStyleToObject,
  duplicateActiveObject,
  removeLightBackgroundFromImage,
  setSelectionLock,
  setSelectionZIndex
} from '../../services/canvasObjectService';
import {
  exportCanvasToPngBlob,
  exportCanvasToSvg,
  triggerDownload
} from '../../services/exportService';
import { importSvgToGroup } from '../../services/svgImportService';
import type {
  CanvasActions,
  EditorSelection,
  EditorSnapshot,
  EditorStatus,
  LayerItem,
  ObjectStylePatch,
  StoredDesign,
  TextStylePatch
} from '../../types/editor';
import { buildErrorNotification } from '../../utils/notifications';

type CanvasEditorProps = {
  initialDesign: StoredDesign | null;
  onActionsChange: (actions: CanvasActions | null) => void;
  onSnapshotChange: (snapshot: EditorSnapshot) => void;
  onStatusChange: (status: EditorStatus) => void;
};

const EMPTY_SELECTION: EditorSelection = {
  activeGroup: null,
  activeObject: null,
  isEditingGroup: false
};

function buildLayerItems(canvas: Canvas): LayerItem[] {
  /**
   * var: canvas
   * type: Canvas
   * desc: Fabric canvas used to extract object stack labels.
   */
  return canvas.getObjects().map((object, index) => {
    const objectType = object.type ?? 'object';
    return {
      id: `${objectType}-${index}`,
      isLocked: Boolean(object.lockMovementX || object.lockMovementY || !object.selectable),
      label: `${objectType} ${index + 1}`,
      type: objectType
    };
  }).reverse();
}

function CanvasEditor(props: CanvasEditorProps): JSX.Element {
  /**
   * var: props
   * type: CanvasEditorProps
   * desc: Canvas action registration, snapshot, and status update callbacks.
   */
  const canvasElementRef = useRef<HTMLCanvasElement | null>(null);
  const fabricCanvasRef = useRef<Canvas | null>(null);
  const svgInputRef = useRef<HTMLInputElement | null>(null);
  const [isDropActive, setIsDropActive] = useState<boolean>(false);
  const [selection, setSelection] = useState<EditorSelection>(EMPTY_SELECTION);
  const lastLoadedDesignRef = useRef<string | null>(null);

  const emitSnapshot = useCallback((nextSelection: EditorSelection): void => {
    /**
     * var: nextSelection
     * type: EditorSelection
     * desc: Selection payload used to emit latest layer and active selection state.
     */
    const canvas = fabricCanvasRef.current;
    if (!canvas) {
      return;
    }
    props.onSnapshotChange({
      layers: buildLayerItems(canvas),
      selection: nextSelection
    });
  }, [props]);

  const updateSelectionFromActiveObject = useCallback((activeObject: FabricObject | null): void => {
    /**
     * var: activeObject
     * type: FabricObject | null
     * desc: Current active object selected by Fabric interactions.
     */
    const groupCandidate = activeObject instanceof Group ? activeObject : activeObject?.group ?? null;
    const nextSelection: EditorSelection = {
      activeGroup: groupCandidate,
      activeObject,
      isEditingGroup: Boolean(groupCandidate && activeObject && groupCandidate !== activeObject)
    };
    setSelection(nextSelection);
    emitSnapshot(nextSelection);
  }, [emitSnapshot]);

  const handleSelectionEvent = useCallback((): void => {
    /**
     * var: none
     * type: void
     * desc: Synchronizes local selection state from current Fabric active object.
     */
    const canvas = fabricCanvasRef.current;
    updateSelectionFromActiveObject((canvas?.getActiveObject() as FabricObject | null) ?? null);
  }, [updateSelectionFromActiveObject]);

  const resetSelection = useCallback((): void => {
    /**
     * var: none
     * type: void
     * desc: Clears selected object and group state.
     */
    setSelection(EMPTY_SELECTION);
    emitSnapshot(EMPTY_SELECTION);
  }, [emitSnapshot]);

  const removeSelection = useCallback((): void => {
    /**
     * var: none
     * type: void
     * desc: Removes the active selected object or group from canvas.
     */
    const canvas = fabricCanvasRef.current;
    if (!canvas || !selection.activeObject) {
      return;
    }
    canvas.remove(selection.activeObject);
    canvas.discardActiveObject();
    canvas.requestRenderAll();
    resetSelection();
  }, [resetSelection, selection.activeObject]);

  const moveSelection = useCallback((deltaX: number, deltaY: number): void => {
    /**
     * var: deltaX
     * type: number
     * desc: Horizontal movement offset for active object.
     * var: deltaY
     * type: number
     * desc: Vertical movement offset for active object.
     */
    const canvas = fabricCanvasRef.current;
    const activeObject = selection.activeObject;
    if (!canvas || !activeObject) {
      return;
    }
    activeObject.set({
      left: (activeObject.left ?? 0) + deltaX,
      top: (activeObject.top ?? 0) + deltaY
    });
    activeObject.setCoords();
    canvas.requestRenderAll();
    emitSnapshot(selection);
  }, [emitSnapshot, selection]);

  const applyTextStyle = useCallback((style: TextStylePatch): void => {
    /**
     * var: style
     * type: TextStylePatch
     * desc: Text style patch merged into selected text object.
     */
    const canvas = fabricCanvasRef.current;
    if (!canvas) {
      return;
    }
    applyTextStyleToObject(canvas, style);
    emitSnapshot(selection);
  }, [emitSnapshot, selection]);

  const applyObjectStyle = useCallback((style: ObjectStylePatch): void => {
    /**
     * var: style
     * type: ObjectStylePatch
     * desc: Generic object style patch merged into selected object.
     */
    const canvas = fabricCanvasRef.current;
    if (!canvas) {
      return;
    }
    applyObjectStyleToSelection(canvas, style);
    emitSnapshot(selection);
  }, [emitSnapshot, selection]);

  const enterGroupEditMode = useCallback((): void => {
    /**
     * var: none
     * type: void
     * desc: Focuses first child of selected group for child-level editing.
     */
    const canvas = fabricCanvasRef.current;
    if (!canvas || !selection.activeGroup) {
      return;
    }
    const child = selection.activeGroup.getObjects()[0] ?? null;
    if (!child) {
      props.onStatusChange({
        message: buildErrorNotification('Malformed group structure: no editable child elements.'),
        state: 'error'
      });
      return;
    }
    canvas.setActiveObject(child);
    updateSelectionFromActiveObject(child);
    canvas.requestRenderAll();
  }, [props, selection.activeGroup, updateSelectionFromActiveObject]);

  const exitGroupEditMode = useCallback((): void => {
    /**
     * var: none
     * type: void
     * desc: Restores selected group focus from child-level editing mode.
     */
    const canvas = fabricCanvasRef.current;
    if (!canvas || !selection.activeGroup) {
      return;
    }
    canvas.setActiveObject(selection.activeGroup);
    updateSelectionFromActiveObject(selection.activeGroup);
    canvas.requestRenderAll();
  }, [selection.activeGroup, updateSelectionFromActiveObject]);

  const importSvgFromFile = useCallback(async (file: File): Promise<void> => {
    /**
     * var: file
     * type: File
     * desc: Uploaded SVG file payload to import into canvas.
     */
    const canvas = fabricCanvasRef.current;
    if (!canvas) {
      throw new Error('Canvas is not initialized.');
    }
    const svgPayload = await file.text();
    const importedResult = await importSvgToGroup(svgPayload);
    canvas.add(importedResult.rootGroup);
    canvas.setActiveObject(importedResult.rootGroup);
    updateSelectionFromActiveObject(importedResult.rootGroup);
    canvas.requestRenderAll();
  }, [updateSelectionFromActiveObject]);

  const importDroppedFile = useCallback(async (file: File): Promise<void> => {
    /**
     * var: file
     * type: File
     * desc: File dropped over canvas, routed to SVG or image import path.
     */
    props.onStatusChange({
      message: 'Importing dropped file...',
      state: 'loading'
    });
    try {
      if (file.type.includes('svg') || file.name.toLowerCase().endsWith('.svg')) {
        await importSvgFromFile(file);
      } else if (file.type.startsWith('image/')) {
        const canvas = fabricCanvasRef.current;
        if (!canvas) {
          throw new Error('Canvas is not initialized.');
        }
        await addImageObjectFromFile(canvas, file);
        emitSnapshot(selection);
      } else {
        throw new Error('Unsupported file format. Use SVG or image files.');
      }
      props.onStatusChange({
        message: 'File imported successfully.',
        state: 'success'
      });
    } catch (error) {
      props.onStatusChange({
        message: buildErrorNotification(error instanceof Error ? error.message : 'Import failed.'),
        state: 'error'
      });
    }
  }, [emitSnapshot, importSvgFromFile, props, selection]);

  const exportSvg = useCallback(async (): Promise<void> => {
    /**
     * var: none
     * type: void
     * desc: Serializes canvas into SVG and triggers file download.
     */
    const canvas = fabricCanvasRef.current;
    if (!canvas) {
      throw new Error('Canvas is not initialized.');
    }
    const svgString = exportCanvasToSvg(canvas);
    const svgBlob = new Blob([svgString], {
      type: 'image/svg+xml'
    });
    triggerDownload(svgBlob, 'open-canva-export.svg');
  }, []);

  const exportPng = useCallback(async (): Promise<void> => {
    /**
     * var: none
     * type: void
     * desc: Serializes canvas into PNG and triggers file download.
     */
    const canvas = fabricCanvasRef.current;
    if (!canvas) {
      throw new Error('Canvas is not initialized.');
    }
    const pngBlob = exportCanvasToPngBlob(canvas);
    triggerDownload(pngBlob, 'open-canva-export.png');
  }, []);

  const removeBackgroundFromActiveImage = useCallback(async (): Promise<void> => {
    /**
     * var: none
     * type: void
     * desc: Applies simple bright-background transparency to selected image.
     */
    const canvas = fabricCanvasRef.current;
    if (!canvas) {
      throw new Error('Canvas is not initialized.');
    }
    await removeLightBackgroundFromImage(canvas);
    emitSnapshot(selection);
  }, [emitSnapshot, selection]);

  const duplicateSelection = useCallback(async (): Promise<void> => {
    /**
     * var: none
     * type: void
     * desc: Duplicates selected object with offset position.
     */
    const canvas = fabricCanvasRef.current;
    if (!canvas) {
      return;
    }
    await duplicateActiveObject(canvas);
    updateSelectionFromActiveObject(canvas.getActiveObject() as FabricObject | null);
  }, [updateSelectionFromActiveObject]);

  const lockSelection = useCallback((): void => {
    /**
     * var: none
     * type: void
     * desc: Locks transformations for current selection.
     */
    const canvas = fabricCanvasRef.current;
    if (!canvas) {
      return;
    }
    setSelectionLock(canvas, true);
    emitSnapshot(selection);
  }, [emitSnapshot, selection]);

  const unlockSelection = useCallback((): void => {
    /**
     * var: none
     * type: void
     * desc: Unlocks transformations for current selection.
     */
    const canvas = fabricCanvasRef.current;
    if (!canvas) {
      return;
    }
    setSelectionLock(canvas, false);
    emitSnapshot(selection);
  }, [emitSnapshot, selection]);

  const bringToFront = useCallback((): void => {
    /**
     * var: none
     * type: void
     * desc: Moves selected object to top of stack.
     */
    const canvas = fabricCanvasRef.current;
    if (!canvas) {
      return;
    }
    setSelectionZIndex(canvas, 'front');
    emitSnapshot(selection);
  }, [emitSnapshot, selection]);

  const bringForward = useCallback((): void => {
    /**
     * var: none
     * type: void
     * desc: Moves selected object one step forward.
     */
    const canvas = fabricCanvasRef.current;
    if (!canvas) {
      return;
    }
    setSelectionZIndex(canvas, 'forward');
    emitSnapshot(selection);
  }, [emitSnapshot, selection]);

  const sendToBack = useCallback((): void => {
    /**
     * var: none
     * type: void
     * desc: Moves selected object to back of stack.
     */
    const canvas = fabricCanvasRef.current;
    if (!canvas) {
      return;
    }
    setSelectionZIndex(canvas, 'back');
    emitSnapshot(selection);
  }, [emitSnapshot, selection]);

  const sendBackward = useCallback((): void => {
    /**
     * var: none
     * type: void
     * desc: Moves selected object one step backward.
     */
    const canvas = fabricCanvasRef.current;
    if (!canvas) {
      return;
    }
    setSelectionZIndex(canvas, 'backward');
    emitSnapshot(selection);
  }, [emitSnapshot, selection]);

  useEffect(() => {
    const node = canvasElementRef.current;
    if (!node) {
      return;
    }
    const canvas = new Canvas(node, {
      backgroundColor: '#f8fafc',
      height: 760,
      preserveObjectStacking: true,
      selection: true,
      subTargetCheck: true,
      width: 980
    });
    const pageSurface = new Rect({
      fill: '#ffffff',
      height: 600,
      left: 180,
      rx: 12,
      ry: 12,
      shadow: new Shadow({
        blur: 24,
        color: 'rgba(15,23,42,0.2)',
        offsetX: 0,
        offsetY: 12
      }),
      top: 80,
      width: 640
    });
    canvas.add(pageSurface);
    canvas.setActiveObject(pageSurface);
    updateSelectionFromActiveObject(pageSurface);
    canvas.on('selection:created', handleSelectionEvent);
    canvas.on('selection:updated', handleSelectionEvent);
    canvas.on('selection:cleared', resetSelection);
    fabricCanvasRef.current = canvas;
    emitSnapshot({
      activeGroup: null,
      activeObject: pageSurface,
      isEditingGroup: false
    });
    return () => {
      canvas.dispose();
      fabricCanvasRef.current = null;
      props.onActionsChange(null);
    };
  }, [emitSnapshot, handleSelectionEvent, props, resetSelection, updateSelectionFromActiveObject]);


  useEffect(() => {
    const loadInitialDesign = async (): Promise<void> => {
      /**
       * var: none
       * type: void
       * desc: Loads persisted uploaded asset into canvas when editor opens from home page.
       */
      const canvas = fabricCanvasRef.current;
      if (!canvas || !props.initialDesign) {
        return;
      }
      if (lastLoadedDesignRef.current === props.initialDesign.id) {
        return;
      }
      lastLoadedDesignRef.current = props.initialDesign.id;
      try {
        if (props.initialDesign.kind === 'svg') {
          const decoded = atob(props.initialDesign.dataUrl.split(',')[1] ?? '');
          const imported = await importSvgToGroup(decoded);
          canvas.add(imported.rootGroup);
          canvas.setActiveObject(imported.rootGroup);
          updateSelectionFromActiveObject(imported.rootGroup);
        } else {
          await addImageObjectFromDataUrl(canvas, props.initialDesign.dataUrl);
          updateSelectionFromActiveObject(canvas.getActiveObject() as FabricObject | null);
        }
        canvas.requestRenderAll();
      } catch (error) {
        props.onStatusChange({
          message: buildErrorNotification(error instanceof Error ? error.message : 'Failed to load selected design.'),
          state: 'error'
        });
      }
    };
    void loadInitialDesign();
  }, [props.initialDesign, props.onStatusChange, updateSelectionFromActiveObject]);

  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) {
      return;
    }
    const actions: CanvasActions = {
      addCircle: () => addCircleObject(canvas),
      addImageFromFile: (file: File) => addImageObjectFromFile(canvas, file),
      addRect: () => addRectObject(canvas),
      addText: () => addTextObject(canvas),
      addTriangle: () => addTriangleObject(canvas),
      applyObjectStyle,
      applyTextStyle,
      bringForward,
      bringToFront,
      duplicateSelection,
      enterGroupEditMode,
      exitGroupEditMode,
      exportPng,
      exportSvg,
      importSvgFromFile,
      lockSelection,
      moveSelection,
      removeBackgroundFromActiveImage,
      removeSelection,
      selection: () => selection,
      sendBackward,
      sendToBack,
      unlockSelection
    };
    props.onActionsChange(actions);
  }, [applyObjectStyle, applyTextStyle, bringForward, bringToFront, duplicateSelection, enterGroupEditMode, exitGroupEditMode, exportPng, exportSvg, importSvgFromFile, lockSelection, moveSelection, props, removeBackgroundFromActiveImage, removeSelection, selection, sendBackward, sendToBack, unlockSelection]);

  const handleSvgImportInput = useCallback(async (event: ChangeEvent<HTMLInputElement>): Promise<void> => {
    /**
     * var: event
     * type: ChangeEvent<HTMLInputElement>
     * desc: File input event for importing SVG assets.
     */
    const file = event.target.files?.[0] ?? null;
    if (!file) {
      return;
    }
    await importDroppedFile(file);
    event.target.value = '';
  }, [importDroppedFile]);

  const handleDragOver = useCallback((event: DragEvent<HTMLElement>): void => {
    /**
     * var: event
     * type: DragEvent<HTMLElement>
     * desc: Drag over event used to activate drop styling and allow drops.
     */
    event.preventDefault();
    setIsDropActive(true);
  }, []);

  const handleDragLeave = useCallback((): void => {
    /**
     * var: none
     * type: void
     * desc: Resets drag state when pointer leaves drop zone.
     */
    setIsDropActive(false);
  }, []);

  const handleDrop = useCallback(async (event: DragEvent<HTMLElement>): Promise<void> => {
    /**
     * var: event
     * type: DragEvent<HTMLElement>
     * desc: Drop event that extracts first file and imports it into canvas.
     */
    event.preventDefault();
    setIsDropActive(false);
    const file = event.dataTransfer.files?.[0] ?? null;
    if (!file) {
      return;
    }
    await importDroppedFile(file);
  }, [importDroppedFile]);

  const selectionLabel = useMemo((): string => {
    /**
     * var: none
     * type: void
     * desc: Generates textual summary of current selection state.
     */
    if (!selection.activeObject) {
      return 'No selection';
    }
    if (selection.activeObject instanceof IText) {
      return 'Text object selected';
    }
    if (selection.activeObject instanceof Group) {
      return `Group selected (${selection.activeObject.size()} items)`;
    }
    if (selection.activeGroup) {
      return 'Child element selected';
    }
    return 'Layer selected';
  }, [selection.activeGroup, selection.activeObject]);

  return (
    <section className="editor-panel" onDragLeave={handleDragLeave} onDragOver={handleDragOver} onDrop={handleDrop}>
      <div className="editor-topbar">
        <h2>Canvas Workspace</h2>
        <div className="editor-topbar-actions">
          <button className="button-primary" onClick={() => svgInputRef.current?.click()} type="button">Import SVG</button>
          <input accept=".svg,image/svg+xml" hidden onChange={handleSvgImportInput} ref={svgInputRef} type="file" />
        </div>
      </div>
      <div className={`canvas-dropzone ${isDropActive ? 'active' : ''}`}>
        <p>{isDropActive ? 'Drop file to import' : 'Drag and drop SVG or image files here'}</p>
        <p className="editor-status">{selectionLabel}</p>
        <canvas ref={canvasElementRef} />
      </div>
      <div className="editor-toolbar">
        <button disabled={!selection.activeGroup || selection.isEditingGroup} onClick={enterGroupEditMode} type="button">Edit group</button>
        <button disabled={!selection.activeGroup || !selection.isEditingGroup} onClick={exitGroupEditMode} type="button">Exit edit</button>
        <button disabled={!selection.activeObject} onClick={removeSelection} type="button">Delete</button>
        <button disabled={!selection.activeObject} onClick={() => moveSelection(-10, 0)} type="button">←</button>
        <button disabled={!selection.activeObject} onClick={() => moveSelection(10, 0)} type="button">→</button>
        <button disabled={!selection.activeObject} onClick={() => moveSelection(0, -10)} type="button">↑</button>
        <button disabled={!selection.activeObject} onClick={() => moveSelection(0, 10)} type="button">↓</button>
      </div>
    </section>
  );
}

export default CanvasEditor;
