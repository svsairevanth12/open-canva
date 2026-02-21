import type { Canvas, FabricObject, Group } from 'fabric';

type EditorSelection = {
  activeGroup: Group | null;
  activeObject: FabricObject | null;
  isEditingGroup: boolean;
};

type ImportedSvgNode = {
  metadata: Record<string, string>;
  object: FabricObject;
};

type ImportedSvgResult = {
  rootGroup: Group;
  nodes: ImportedSvgNode[];
};

type EditorStatusState = 'error' | 'idle' | 'loading' | 'success';

type EditorStatus = {
  message: string;
  state: EditorStatusState;
};

type CanvasActions = {
  addCircle: () => void;
  addImageFromFile: (file: File) => Promise<void>;
  addRect: () => void;
  addText: () => void;
  addTriangle: () => void;
  enterGroupEditMode: () => void;
  exitGroupEditMode: () => void;
  exportPng: () => Promise<void>;
  exportSvg: () => Promise<void>;
  importSvgFromFile: (file: File) => Promise<void>;
  moveSelection: (deltaX: number, deltaY: number) => void;
  removeSelection: () => void;
  selection: () => EditorSelection;
};

type CanvasActionsFactory = (canvas: Canvas) => CanvasActions;

export type {
  CanvasActions,
  CanvasActionsFactory,
  EditorSelection,
  EditorStatus,
  EditorStatusState,
  ImportedSvgNode,
  ImportedSvgResult
};
