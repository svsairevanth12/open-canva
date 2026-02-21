import {
  Canvas,
  Circle,
  FabricImage,
  IText,
  Rect,
  Triangle
} from 'fabric';

function addTextObject(canvas: Canvas): void {
  /**
   * var: canvas
   * type: Canvas
   * desc: Fabric canvas receiving new text object.
   */
  const text = new IText('New Text', {
    fill: '#f9fafb',
    fontSize: 28,
    left: 220,
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

export {
  addCircleObject,
  addImageObjectFromFile,
  addRectObject,
  addTextObject,
  addTriangleObject
};
