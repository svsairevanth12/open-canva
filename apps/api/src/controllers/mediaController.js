import { removeBackgroundImagePayload } from '../services/backgroundRemovalService.js';

function removeBackground(request, response) {
  /**
   * var: request
   * type: import('express').Request
   * desc: Express request object containing image payload body.
   * var: response
   * type: import('express').Response
   * desc: Express response object returning processed image payload.
   */
  try {
    const imageDataUrl = request.body?.imageDataUrl;
    const result = removeBackgroundImagePayload(imageDataUrl);
    response.json(result);
  } catch (error) {
    response.status(400).json({
      error: error.message
    });
  }
}

export { removeBackground };
