import {
  Canvas,
  FabricObject,
  Group,
  Rect
} from 'fabric';
import {
  ChangeEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';

import { importSvgToGroup } from '../../services/svgImportService';
import type { EditorSelection } from '../../types/editor';
import { buildErrorNotification } from '../../utils/notifications';

const EMPTY_SELECTION: EditorSelection = {
  activeGroup: null,
  activeObject: null,
  isEditingGroup: false
};

function CanvasEditor(): JSX.Element {
  /**
   * var: none
   * type: void
   * desc: Renders canvas controls, orchestrates Fabric selection, grouping, and import behaviors.
   */
  const canvasElementRef = useRef<HTMLCanvasElement | null>(null);
  const fabricCanvasRef = useRef<Canvas | null>(null);
  const [selection, setSelection] = useState<EditorSelection>(EMPTY_SELECTION);
  const [notification, setNotification] = useState<string>('');

  const updateSelectionFromActiveObject = useCallback((activeObject: FabricObject | null): void => {
    /**
     * var: activeObject
     * type: FabricObject | null
     * desc: Current active object selected by Fabric interactions.
     */
    const groupCandidate = activeObject instanceof Group ? activeObject : activeObject?.group ?? null;
    setSelection({
      activeGroup: groupCandidate,
      activeObject,
      isEditingGroup: Boolean(groupCandidate && activeObject && groupCandidate !== activeObject)
    });
  }, []);

  const handleSelectionEvent = useCallback((): void => {
    /**
     * var: none
     * type: void
     * desc: Synchronizes local selection state from the current Fabric active object.
     */
    const canvas = fabricCanvasRef.current;
    updateSelectionFromActiveObject((canvas?.getActiveObject() as FabricObject | null) ?? null);
  }, [updateSelectionFromActiveObject]);

  const resetSelection = useCallback((): void => {
    /**
     * var: none
     * type: void
     * desc: Clears selected object/group state.
     */
    setSelection(EMPTY_SELECTION);
  }, []);

  useEffect(() => {
    const node = canvasElementRef.current;
    if (!node) {
      return;
    }
    const canvas = new Canvas(node, {
      backgroundColor: '#0f172a',
      height: 560,
      preserveObjectStacking: true,
      selection: true,
      subTargetCheck: true,
      width: 900
    });
    const backgroundShape = new Rect({
      fill: '#111827',
      height: 420,
      left: 240,
      rx: 12,
      ry: 12,
      top: 70,
      width: 420
    });
    canvas.add(backgroundShape);
    canvas.setActiveObject(backgroundShape);
    updateSelectionFromActiveObject(backgroundShape);
    canvas.on('selection:created', handleSelectionEvent);
    canvas.on('selection:updated', handleSelectionEvent);
    canvas.on('selection:cleared', resetSelection);
    fabricCanvasRef.current = canvas;
    return () => {
      canvas.dispose();
      fabricCanvasRef.current = null;
    };
  }, [handleSelectionEvent, resetSelection, updateSelectionFromActiveObject]);

  const handleSvgImport = useCallback(async (event: ChangeEvent<HTMLInputElement>): Promise<void> => {
    /**
     * var: event
     * type: ChangeEvent<HTMLInputElement>
     * desc: Input change event carrying uploaded SVG file data.
     */
    const canvas = fabricCanvasRef.current;
    const file = event.target.files?.[0] ?? null;
    if (!canvas || !file) {
      return;
    }
    try {
      const svgPayload = await file.text();
      const importedResult = await importSvgToGroup(svgPayload);
      canvas.add(importedResult.rootGroup);
      canvas.setActiveObject(importedResult.rootGroup);
      updateSelectionFromActiveObject(importedResult.rootGroup);
      canvas.requestRenderAll();
      setNotification('SVG imported successfully.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown SVG import error.';
      setNotification(buildErrorNotification(message));
    } finally {
      event.target.value = '';
    }
  }, [updateSelectionFromActiveObject]);

  const enterGroupEditMode = useCallback((): void => {
    /**
     * var: none
     * type: void
     * desc: Activates the first child object in the selected group for granular editing.
     */
    const canvas = fabricCanvasRef.current;
    if (!canvas || !selection.activeGroup) {
      return;
    }
    const child = selection.activeGroup.getObjects()[0] ?? null;
    if (!child) {
      setNotification(buildErrorNotification('Malformed group structure: no editable child elements.'));
      return;
    }
    canvas.setActiveObject(child);
    updateSelectionFromActiveObject(child);
    canvas.requestRenderAll();
  }, [selection.activeGroup, updateSelectionFromActiveObject]);

  const exitGroupEditMode = useCallback((): void => {
    /**
     * var: none
     * type: void
     * desc: Restores group selection after child-level editing.
     */
    const canvas = fabricCanvasRef.current;
    if (!canvas || !selection.activeGroup) {
      return;
    }
    canvas.setActiveObject(selection.activeGroup);
    updateSelectionFromActiveObject(selection.activeGroup);
    canvas.requestRenderAll();
  }, [selection.activeGroup, updateSelectionFromActiveObject]);

  const deleteSelection = useCallback((): void => {
    /**
     * var: none
     * type: void
     * desc: Deletes either the selected child object or the selected group from the canvas.
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

  const nudgeSelection = useCallback((deltaX: number, deltaY: number): void => {
    /**
     * var: deltaX
     * type: number
     * desc: Horizontal movement offset applied to the selected object.
     * var: deltaY
     * type: number
     * desc: Vertical movement offset applied to the selected object.
     */
    const canvas = fabricCanvasRef.current;
    const active = selection.activeObject;
    if (!canvas || !active) {
      return;
    }
    active.set({
      left: (active.left ?? 0) + deltaX,
      top: (active.top ?? 0) + deltaY
    });
    active.setCoords();
    canvas.requestRenderAll();
  }, [selection.activeObject]);

  const selectionLabel = useMemo((): string => {
    /**
     * var: none
     * type: void
     * desc: Builds compact status text describing current selection and edit mode.
     */
    if (!selection.activeObject) {
      return 'No selection';
    }
    if (selection.activeObject instanceof Group) {
      return `Group selected (${selection.activeObject.size()} items)`;
    }
    if (selection.activeGroup) {
      return 'Child element selected';
    }
    return 'Single object selected';
  }, [selection.activeGroup, selection.activeObject]);

  return (
    <section className="editor-panel">
      <div className="editor-toolbar">
        <input accept=".svg,image/svg+xml" onChange={handleSvgImport} type="file" />
        <button disabled={!selection.activeGroup || selection.isEditingGroup} onClick={enterGroupEditMode} type="button">Edit group</button>
        <button disabled={!selection.activeGroup || !selection.isEditingGroup} onClick={exitGroupEditMode} type="button">Exit edit</button>
        <button disabled={!selection.activeObject} onClick={deleteSelection} type="button">Delete</button>
        <button disabled={!selection.activeObject} onClick={() => nudgeSelection(-10, 0)} type="button">←</button>
        <button disabled={!selection.activeObject} onClick={() => nudgeSelection(10, 0)} type="button">→</button>
        <button disabled={!selection.activeObject} onClick={() => nudgeSelection(0, -10)} type="button">↑</button>
        <button disabled={!selection.activeObject} onClick={() => nudgeSelection(0, 10)} type="button">↓</button>
      </div>
      <p className="editor-status">{selectionLabel}</p>
      <p aria-live="polite" className="editor-notification">{notification}</p>
      <canvas ref={canvasElementRef} />
    </section>
  );
}

export default CanvasEditor;
