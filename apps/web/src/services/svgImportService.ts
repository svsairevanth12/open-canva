import {
  FabricObject,
  Group,
  loadSVGFromString,
  util
} from 'fabric';

import type {
  ImportedSvgNode,
  ImportedSvgResult
} from '../types/editor';

function ensureValidSvgPayload(svgPayload: string): void {
  /**
   * var: svgPayload
   * type: string
   * desc: Raw SVG XML string provided for import.
   */
  if (!svgPayload.trim()) {
    throw new Error('SVG payload is empty.');
  }
  if (!svgPayload.includes('<svg')) {
    throw new Error('SVG payload is malformed: missing <svg> root element.');
  }
}

function extractMetadata(node: Element): Record<string, string> {
  /**
   * var: node
   * type: Element
   * desc: Source SVG element mapped to a Fabric object.
   */
  const metadata: Record<string, string> = {};
  for (const attribute of node.getAttributeNames()) {
    metadata[attribute] = node.getAttribute(attribute) ?? '';
  }
  return metadata;
}

function mapImportedNodes(objects: FabricObject[], elements: Element[]): ImportedSvgNode[] {
  /**
   * var: objects
   * type: FabricObject[]
   * desc: Fabric objects created from the SVG payload.
   * var: elements
   * type: Element[]
   * desc: SVG DOM elements paired to generated Fabric objects.
   */
  if (objects.length !== elements.length) {
    throw new Error('SVG structure is malformed: unmatched object and element counts.');
  }
  return objects.map((object, index) => {
    const element = elements[index];
    object.set('data', {
      sourceTag: element.tagName,
      ...extractMetadata(element)
    });
    return {
      metadata: extractMetadata(element),
      object
    };
  });
}

async function importSvgToGroup(svgPayload: string): Promise<ImportedSvgResult> {
  /**
   * var: svgPayload
   * type: string
   * desc: Raw SVG XML string that should be parsed into Fabric primitives.
   */
  ensureValidSvgPayload(svgPayload);
  const parsedResult = await loadSVGFromString(svgPayload);
  const objects = parsedResult.objects as FabricObject[];
  const elements = parsedResult.elements as Element[];
  if (!objects.length) {
    throw new Error('SVG import failed: no drawable nodes found.');
  }
  const nodes = mapImportedNodes(objects, elements);
  const grouped = util.groupSVGElements(objects, {
    subTargetCheck: true
  });
  if (!(grouped instanceof Group)) {
    throw new Error('SVG grouping failed: imported payload did not produce a group.');
  }
  grouped.set('data', {
    importedAt: new Date().toISOString(),
    nodeCount: nodes.length,
    source: 'svg'
  });
  return {
    nodes,
    rootGroup: grouped
  };
}

export { importSvgToGroup };
