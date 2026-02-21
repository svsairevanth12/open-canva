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
  isVisible: boolean;
  label: string;
  type: string;
};

type StoredDesignKind = 'image' | 'svg';

type StoredDesign = {
  dataUrl: string;
  id: string;
  kind: StoredDesignKind;
  name: string;
  updatedAt: string;
};

type ProjectObject = {
  data: Record<string, unknown>;
  id: string;
  kind: string;
  layer: number;
  locked: boolean;
  visible: boolean;
  x: number;
  y: number;
};

type ProjectPage = {
  id: string;
  name: string;
  objects: ProjectObject[];
};

type ProjectDocument = {
  id: string;
  name: string;
  pages: ProjectPage[];
  updatedAt: string;
  version: number;
};

type EditorSnapshot = {
  activePageId: string;
  layers: LayerItem[];
  project: ProjectDocument;
  selection: EditorSelection;
};

type TextStylePatch = {
  align?: 'center' | 'justify' | 'left' | 'right';
  fontFamily?: string;
  fontSize?: number;
  fontStyle?: 'italic' | 'normal';
  fontWeight?: 'bold' | 'normal';
  letterSpacing?: number;
  lineHeight?: number;
  strikethrough?: boolean;
  textTransform?: 'lowercase' | 'none' | 'uppercase';
  underline?: boolean;
};

type ObjectStylePatch = {
  fill?: string;
  height?: number;
  left?: number;
  lockAspectRatio?: boolean;
  opacity?: number;
  rotation?: number;
  shadow?: Shadow | string | null;
  top?: number;
  width?: number;
};

type CanvasActions = {
  addCircle: () => void;
  addImageFromFile: (file: File) => Promise<void>;
  addPage: () => void;
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
  selectLayer: (layerId: string) => void;
  sendToBack: () => void;
  setPage: (pageId: string) => void;
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

type HistoryCommand = {
  do: () => void | Promise<void>;
  id: string;
  label: string;
  undo: () => void | Promise<void>;
};

export type {
  CanvasActions,
  CanvasActionsFactory,
  EditorSelection,
  EditorSnapshot,
  EditorStatus,
  EditorStatusState,
  HistoryCommand,
  ImportedSvgNode,
  ImportedSvgResult,
  LayerItem,
  ObjectStylePatch,
  ProjectDocument,
  ProjectObject,
  ProjectPage,
  PropertyPanelState,
  StoredDesign,
  StoredDesignKind,
  TextStylePatch
};
