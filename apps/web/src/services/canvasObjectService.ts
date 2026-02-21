import {
  Canvas,
  Circle,
  FabricImage,
  FabricObject,
  IText,
  Rect,
  Triangle
} from 'fabric';

import type {
  ObjectStylePatch,
  TextStylePatch
} from '../types/editor';

function addTextObject(canvas: Canvas): void {
  /**
   * var: canvas
   * type: Canvas
   * desc: Fabric canvas receiving new text object.
   */
  const text = new IText('Edit your text', {
    fill: '#111827',
    fontFamily: 'Open Sans',
    fontSize: 52,
    left: 230,
    top: 170
  });
  canvas.add(text);
  canvas.setActiveObject(text);
  canvas.requestRenderAll();
}

function addRectObject(canvas: Canvas): void {
  /**
   * var: canvas
   * type: Canvas
   * desc: Fabric canvas receiving new rectangle object.
   */
  const rect = new Rect({
    fill: '#2563eb',
    height: 120,
    left: 210,
    top: 150,
    width: 180
  });
  canvas.add(rect);
  canvas.setActiveObject(rect);
  canvas.requestRenderAll();
}

function addCircleObject(canvas: Canvas): void {
  /**
   * var: canvas
   * type: Canvas
   * desc: Fabric canvas receiving new circle object.
   */
  const circle = new Circle({
    fill: '#16a34a',
    left: 240,
    radius: 65,
    top: 170
  });
  canvas.add(circle);
  canvas.setActiveObject(circle);
  canvas.requestRenderAll();
}

function addTriangleObject(canvas: Canvas): void {
  /**
   * var: canvas
   * type: Canvas
   * desc: Fabric canvas receiving new triangle object.
   */
  const triangle = new Triangle({
    fill: '#f59e0b',
    height: 120,
    left: 240,
    top: 180,
    width: 130
  });
  canvas.add(triangle);
  canvas.setActiveObject(triangle);
  canvas.requestRenderAll();
}

async function addImageObjectFromFile(canvas: Canvas, file: File): Promise<void> {
  /**
   * var: canvas
   * type: Canvas
   * desc: Fabric canvas receiving a new image object.
   * var: file
   * type: File
   * desc: Uploaded image file used to construct a Fabric image.
   */
  const fileUrl = URL.createObjectURL(file);
  try {
    const image = await FabricImage.fromURL(fileUrl, {
      crossOrigin: 'anonymous'
    });
    image.set({
      left: 200,
      top: 120
    });
    image.scaleToWidth(260);
    canvas.add(image);
    canvas.setActiveObject(image);
    canvas.requestRenderAll();
  } finally {
    URL.revokeObjectURL(fileUrl);
  }
}

function applyTextStyleToObject(canvas: Canvas, style: TextStylePatch): void {
  /**
   * var: canvas
   * type: Canvas
   * desc: Fabric canvas containing selected text object.
   * var: style
   * type: TextStylePatch
   * desc: Text style patch to merge into active IText object.
   */
  const activeObject = canvas.getActiveObject();
  if (!(activeObject instanceof IText)) {
    return;
  }
  activeObject.set(style);
  canvas.requestRenderAll();
}

function applyObjectStyleToSelection(canvas: Canvas, style: ObjectStylePatch): void {
  /**
   * var: canvas
   * type: Canvas
   * desc: Fabric canvas containing selected object.
   * var: style
   * type: ObjectStylePatch
   * desc: Generic style patch applied to active object.
   */
  const activeObject = canvas.getActiveObject();
  if (!activeObject) {
    return;
  }
  activeObject.set(style);
  canvas.requestRenderAll();
}

function setSelectionLock(canvas: Canvas, isLocked: boolean): void {
  /**
   * var: canvas
   * type: Canvas
   * desc: Fabric canvas containing selected object.
   * var: isLocked
   * type: boolean
   * desc: Whether selected object interactions should be locked.
   */
  const activeObject = canvas.getActiveObject();
  if (!activeObject) {
    return;
  }
  activeObject.set({
    lockMovementX: isLocked,
    lockMovementY: isLocked,
    lockRotation: isLocked,
    lockScalingX: isLocked,
    lockScalingY: isLocked,
    selectable: !isLocked
  });
  canvas.requestRenderAll();
}

function setSelectionZIndex(canvas: Canvas, direction: 'back' | 'backward' | 'forward' | 'front'): void {
  /**
   * var: canvas
   * type: Canvas
   * desc: Fabric canvas containing selected object.
   * var: direction
   * type: 'back' | 'backward' | 'forward' | 'front'
   * desc: Stacking direction for selected object.
   */
  const activeObject = canvas.getActiveObject();
  if (!activeObject) {
    return;
  }
  if (direction === 'front') {
    canvas.bringObjectToFront(activeObject);
  }
  if (direction === 'forward') {
    canvas.bringObjectForward(activeObject);
  }
  if (direction === 'back') {
    canvas.sendObjectToBack(activeObject);
  }
  if (direction === 'backward') {
    canvas.sendObjectBackwards(activeObject);
  }
  canvas.requestRenderAll();
}

async function duplicateActiveObject(canvas: Canvas): Promise<void> {
  /**
   * var: canvas
   * type: Canvas
   * desc: Fabric canvas containing selected object to duplicate.
   */
  const activeObject = canvas.getActiveObject();
  if (!activeObject) {
    return;
  }
  const cloned = await activeObject.clone();
  cloned.set({
    left: (activeObject.left ?? 0) + 20,
    top: (activeObject.top ?? 0) + 20
  });
  canvas.add(cloned as FabricObject);
  canvas.setActiveObject(cloned as FabricObject);
  canvas.requestRenderAll();
}

async function removeLightBackgroundFromImage(canvas: Canvas): Promise<void> {
  /**
   * var: canvas
   * type: Canvas
   * desc: Fabric canvas containing selected image object.
   */
  const activeObject = canvas.getActiveObject();
  if (!(activeObject instanceof FabricImage)) {
    throw new Error('Select an image first to remove the background.');
  }
  const imageElement = activeObject.getElement() as HTMLImageElement;
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = imageElement.naturalWidth || imageElement.width;
  tempCanvas.height = imageElement.naturalHeight || imageElement.height;
  const context = tempCanvas.getContext('2d');
  if (!context) {
    throw new Error('Background removal failed: canvas context unavailable.');
  }
  context.drawImage(imageElement, 0, 0);
  const frame = context.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
  for (let index = 0; index < frame.data.length; index += 4) {
    const red = frame.data[index];
    const green = frame.data[index + 1];
    const blue = frame.data[index + 2];
    if (red > 235 && green > 235 && blue > 235) {
      frame.data[index + 3] = 0;
    }
  }
  context.putImageData(frame, 0, 0);
  const dataUrl = tempCanvas.toDataURL('image/png');
  const processed = await FabricImage.fromURL(dataUrl, {
    crossOrigin: 'anonymous'
  });
  processed.set({
    angle: activeObject.angle,
    left: activeObject.left,
    scaleX: activeObject.scaleX,
    scaleY: activeObject.scaleY,
    top: activeObject.top
  });
  canvas.remove(activeObject);
  canvas.add(processed);
  canvas.setActiveObject(processed);
  canvas.requestRenderAll();
}

export {
  addCircleObject,
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
};
