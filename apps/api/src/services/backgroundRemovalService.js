function removeBackgroundImagePayload(imageDataUrl) {
  /**
   * var: imageDataUrl
   * type: string
   * desc: Incoming base64 image payload requested for background removal.
   */
  if (!imageDataUrl || typeof imageDataUrl !== 'string') {
    throw new Error('Invalid image payload.');
  }
  return {
    processedImageDataUrl: imageDataUrl
  };
}

export { removeBackgroundImagePayload };
