import type {
  Canvas,
  FabricObject,
  Group,
  IText,
  Shadow
} from 'fabric';

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

type LayerItem = {
  id: string;
  isLocked: boolean;
  label: string;
  type: string;
};

type EditorSnapshot = {
  layers: LayerItem[];
  selection: EditorSelection;
};


type StoredDesignKind = 'image' | 'svg';

type StoredDesign = {
  dataUrl: string;
  id: string;
  kind: StoredDesignKind;
  name: string;
  updatedAt: string;
};

type TextStylePatch = {
  fontFamily?: string;
  fontSize?: number;
  fontStyle?: 'italic' | 'normal';
  fontWeight?: 'bold' | 'normal';
  underline?: boolean;
};

type ObjectStylePatch = {
  fill?: string;
  opacity?: number;
  shadow?: Shadow | string | null;
};

type CanvasActions = {
  addCircle: () => void;
  addImageFromFile: (file: File) => Promise<void>;
  addRect: () => void;
  addText: () => void;
  addTriangle: () => void;
  applyObjectStyle: (style: ObjectStylePatch) => void;
  applyTextStyle: (style: TextStylePatch) => void;
  bringForward: () => void;
  bringToFront: () => void;
  duplicateSelection: () => Promise<void>;
  enterGroupEditMode: () => void;
  exitGroupEditMode: () => void;
  exportPng: () => Promise<void>;
  exportSvg: () => Promise<void>;
  importSvgFromFile: (file: File) => Promise<void>;
  lockSelection: () => void;
  moveSelection: (deltaX: number, deltaY: number) => void;
  removeBackgroundFromActiveImage: () => Promise<void>;
  removeSelection: () => void;
  selection: () => EditorSelection;
  sendBackward: () => void;
  sendToBack: () => void;
  unlockSelection: () => void;
};

type CanvasActionsFactory = (canvas: Canvas) => CanvasActions;

type PropertyPanelState = {
  fill: string;
  fontFamily: string;
  fontSize: number;
  isBold: boolean;
  isItalic: boolean;
  isUnderline: boolean;
  opacity: number;
  selectedText: IText | null;
};

export type {
  CanvasActions,
  CanvasActionsFactory,
  EditorSelection,
  EditorStatus,
  EditorStatusState,
  ImportedSvgNode,
  ImportedSvgResult,
  EditorSnapshot,
  LayerItem,
  ObjectStylePatch,
  PropertyPanelState,
  StoredDesign,
  StoredDesignKind,
  TextStylePatch
};
