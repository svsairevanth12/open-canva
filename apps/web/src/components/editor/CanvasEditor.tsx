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
  KeyboardEvent,
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
  removeBackgroundFromActiveImageWithFallback,
  setSelectionLock,
  setSelectionZIndex
} from '../../services/canvasObjectService';
import {
  exportCanvasToPngBlob,
  exportCanvasToSvg,
  triggerDownload
} from '../../services/exportService';
import { importSvgToGroup } from '../../services/svgImportService';
import { editorStore } from '../../store/editorStore';
import { historyStore, useHistorySnapshot } from '../../store/historyStore';
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
      id: String(object.get('id') ?? `${objectType}-${index}`),
      isLocked: Boolean(object.lockMovementX || object.lockMovementY || !object.selectable),
      isVisible: object.visible !== false,
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
  const [pages, setPages] = useState<string[]>(['page-1']);
  const [activePageId, setActivePageId] = useState<string>('page-1');
  const lastLoadedDesignRef = useRef<string | null>(null);
  const history = useHistorySnapshot();

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
      activePageId,
      layers: buildLayerItems(canvas),
      project: editorStore.getSnapshot().project,
      selection: nextSelection
    });
  }, [activePageId, props]);

  const syncSelection = useCallback((activeObject: FabricObject | null): void => {
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
    editorStore.select(nextSelection);
    emitSnapshot(nextSelection);
  }, [emitSnapshot]);

  const resetSelection = useCallback((): void => {
    /**
     * var: none
     * type: void
     * desc: Clears selected object and group state.
     */
    setSelection(EMPTY_SELECTION);
    editorStore.select(EMPTY_SELECTION);
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
    const objectId = String(selection.activeObject.get('id') ?? '');
    canvas.remove(selection.activeObject);
    canvas.discardActiveObject();
    canvas.requestRenderAll();
    if (objectId) {
      editorStore.deleteObject(objectId);
    }
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
    const objectId = String(activeObject.get('id') ?? '');
    if (objectId) {
      editorStore.updateObject(objectId, {
        x: activeObject.left ?? 0,
        y: activeObject.top ?? 0
      });
    }
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
    importedResult.rootGroup.set('id', `object-${Date.now()}`);
    canvas.add(importedResult.rootGroup);
    canvas.setActiveObject(importedResult.rootGroup);
    syncSelection(importedResult.rootGroup);
    editorStore.addProjectObject({
      data: {
        imported: true
      },
      id: String(importedResult.rootGroup.get('id')),
      kind: 'svg-group',
      layer: canvas.getObjects().length,
      locked: false,
      visible: true,
      x: importedResult.rootGroup.left ?? 0,
      y: importedResult.rootGroup.top ?? 0
    });
    canvas.requestRenderAll();
  }, [syncSelection]);

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
        const active = canvas.getActiveObject() as FabricObject | null;
        active?.set('id', `object-${Date.now()}`);
        if (active) {
          syncSelection(active);
          editorStore.addProjectObject({
            data: {
              fileName: file.name
            },
            id: String(active.get('id')),
            kind: 'image',
            layer: canvas.getObjects().length,
            locked: false,
            visible: true,
            x: active.left ?? 0,
            y: active.top ?? 0
          });
        }
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
  }, [importSvgFromFile, props, syncSelection]);

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
     * desc: Applies API-backed background removal with fallback.
     */
    const canvas = fabricCanvasRef.current;
    if (!canvas) {
      throw new Error('Canvas is not initialized.');
    }
    await removeBackgroundFromActiveImageWithFallback(canvas);
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
    syncSelection(canvas.getActiveObject() as FabricObject | null);
  }, [syncSelection]);

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

  const setLayerDirection = useCallback((direction: 'back' | 'backward' | 'forward' | 'front'): void => {
    /**
     * var: direction
     * type: 'back' | 'backward' | 'forward' | 'front'
     * desc: Layer movement direction for selected object.
     */
    const canvas = fabricCanvasRef.current;
    if (!canvas) {
      return;
    }
    setSelectionZIndex(canvas, direction);
    emitSnapshot(selection);
  }, [emitSnapshot, selection]);

  const handleEditorKeyboard = useCallback((event: KeyboardEvent<HTMLElement>): void => {
    /**
     * var: event
     * type: KeyboardEvent<HTMLElement>
     * desc: Keyboard shortcuts handling for delete, history, and nudging actions.
     */
    if (event.key === 'Delete' || event.key === 'Backspace') {
      event.preventDefault();
      removeSelection();
    }
    if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key.toLowerCase() === 'z') {
      event.preventDefault();
      void historyStore.redo();
    } else if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'z') {
      event.preventDefault();
      void historyStore.undo();
    }
    if (event.key === 'ArrowUp') {
      moveSelection(0, -1);
    }
    if (event.key === 'ArrowDown') {
      moveSelection(0, 1);
    }
    if (event.key === 'ArrowLeft') {
      moveSelection(-1, 0);
    }
    if (event.key === 'ArrowRight') {
      moveSelection(1, 0);
    }
  }, [moveSelection, removeSelection]);

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
    pageSurface.set('id', 'page-surface');
    canvas.add(pageSurface);
    canvas.setActiveObject(pageSurface);
    syncSelection(pageSurface);
    canvas.on('selection:created', () => syncSelection(canvas.getActiveObject() as FabricObject | null));
    canvas.on('selection:updated', () => syncSelection(canvas.getActiveObject() as FabricObject | null));
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
  }, [emitSnapshot, props, resetSelection, syncSelection]);

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
          imported.rootGroup.set('id', `object-${Date.now()}`);
          canvas.add(imported.rootGroup);
          canvas.setActiveObject(imported.rootGroup);
          syncSelection(imported.rootGroup);
        } else {
          await addImageObjectFromDataUrl(canvas, props.initialDesign.dataUrl);
          const active = canvas.getActiveObject() as FabricObject | null;
          active?.set('id', `object-${Date.now()}`);
          syncSelection(active);
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
  }, [props.initialDesign, props.onStatusChange, syncSelection]);


  const selectLayer = useCallback((layerId: string): void => {
    /**
     * var: layerId
     * type: string
     * desc: Layer identifier used to set active Fabric object by id.
     */
    const canvas = fabricCanvasRef.current;
    if (!canvas) {
      return;
    }
    const target = canvas.getObjects().find((object) => String(object.get('id') ?? '') === layerId) ?? null;
    if (!target) {
      return;
    }
    canvas.setActiveObject(target);
    syncSelection(target);
  }, [syncSelection]);

  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) {
      return;
    }
    const actions: CanvasActions = {
      addCircle: () => {
        addCircleObject(canvas);
        syncSelection(canvas.getActiveObject() as FabricObject | null);
      },
      addImageFromFile: async (file: File) => {
        await addImageObjectFromFile(canvas, file);
        syncSelection(canvas.getActiveObject() as FabricObject | null);
      },
      addPage: () => {
        editorStore.addPage();
        const nextId = `page-${pages.length + 1}`;
        setPages((previous) => [...previous, nextId]);
        setActivePageId(nextId);
      },
      addRect: () => {
        addRectObject(canvas);
        syncSelection(canvas.getActiveObject() as FabricObject | null);
      },
      addText: () => {
        addTextObject(canvas);
        syncSelection(canvas.getActiveObject() as FabricObject | null);
      },
      addTriangle: () => {
        addTriangleObject(canvas);
        syncSelection(canvas.getActiveObject() as FabricObject | null);
      },
      applyObjectStyle,
      applyTextStyle,
      bringForward: () => setLayerDirection('forward'),
      bringToFront: () => setLayerDirection('front'),
      duplicateSelection,
      enterGroupEditMode: () => {
        const group = selection.activeGroup;
        if (!group) {
          return;
        }
        const child = group.getObjects()[0];
        if (!child) {
          return;
        }
        canvas.setActiveObject(child);
        syncSelection(child);
      },
      exitGroupEditMode: () => {
        if (!selection.activeGroup) {
          return;
        }
        canvas.setActiveObject(selection.activeGroup);
        syncSelection(selection.activeGroup);
      },
      exportPng,
      exportSvg,
      importSvgFromFile,
      lockSelection,
      moveSelection,
      removeBackgroundFromActiveImage,
      removeSelection,
      selection: () => selection,
      sendBackward: () => setLayerDirection('backward'),
      selectLayer,
      sendToBack: () => setLayerDirection('back'),
      setPage: (pageId: string) => {
        setActivePageId(pageId);
        editorStore.setPage(pageId);
      },
      unlockSelection
    };
    props.onActionsChange(actions);
  }, [applyObjectStyle, applyTextStyle, duplicateSelection, exportPng, exportSvg, importSvgFromFile, lockSelection, moveSelection, pages.length, props, removeBackgroundFromActiveImage, removeSelection, selectLayer, selection, setLayerDirection, syncSelection, unlockSelection]);

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
    <section
      className="editor-panel"
      onDragLeave={() => setIsDropActive(false)}
      onDragOver={(event: DragEvent<HTMLElement>) => {
        event.preventDefault();
        setIsDropActive(true);
      }}
      onDrop={async (event: DragEvent<HTMLElement>) => {
        event.preventDefault();
        setIsDropActive(false);
        const file = event.dataTransfer.files?.[0] ?? null;
        if (file) {
          await importDroppedFile(file);
        }
      }}
      onKeyDown={handleEditorKeyboard}
      tabIndex={0}
    >
      <div className="editor-topbar">
        <h2>Canvas Workspace · {activePageId}</h2>
        <div className="editor-topbar-actions">
          <button className="button-primary" onClick={() => svgInputRef.current?.click()} type="button">Import SVG</button>
          <button onClick={() => historyStore.undo()} type="button">Undo {history.canUndo ? '●' : ''}</button>
          <button onClick={() => historyStore.redo()} type="button">Redo {history.canRedo ? '●' : ''}</button>
          <button onClick={() => setPages((prev) => [...prev, `page-${prev.length + 1}`])} type="button">Add Page</button>
          <input accept=".svg,image/svg+xml" hidden onChange={handleSvgImportInput} ref={svgInputRef} type="file" />
        </div>
      </div>
      <div className="editor-pages">
        {pages.map((pageId) => (
          <button className={pageId === activePageId ? 'active-page-button' : ''} key={pageId} onClick={() => setActivePageId(pageId)} type="button">{pageId}</button>
        ))}
      </div>
      <div className={`canvas-dropzone ${isDropActive ? 'active' : ''}`}>
        <p>{isDropActive ? 'Drop file to import' : 'Drag and drop SVG or image files here'}</p>
        <p className="editor-status">{selectionLabel}</p>
        <canvas ref={canvasElementRef} />
      </div>
      <div className="editor-toolbar">
        <button
          disabled={!selection.activeGroup || selection.isEditingGroup}
          onClick={() => {
            const group = selection.activeGroup;
            if (!group) {
              return;
            }
            const child = group.getObjects()[0] ?? null;
            if (!child) {
              return;
            }
            const canvas = fabricCanvasRef.current;
            canvas?.setActiveObject(child);
            syncSelection(child);
          }}
          type="button"
        >
          Edit group
        </button>
        <button
          disabled={!selection.activeGroup || !selection.isEditingGroup}
          onClick={() => {
            if (!selection.activeGroup) {
              return;
            }
            const canvas = fabricCanvasRef.current;
            canvas?.setActiveObject(selection.activeGroup);
            syncSelection(selection.activeGroup);
          }}
          type="button"
        >
          Exit edit
        </button>
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
