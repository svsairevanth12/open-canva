import type { FabricObject, Group } from 'fabric';

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

export type {
  EditorSelection,
  ImportedSvgNode,
  ImportedSvgResult
};
