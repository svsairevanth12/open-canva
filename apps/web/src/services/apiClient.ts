const API_BASE_URL = 'http://localhost:4000';

type RemoveBackgroundResponse = {
  processedImageDataUrl: string;
};

async function getHealth(): Promise<Record<string, string>> {
  /**
   * var: none
   * type: void
   * desc: Calls API health endpoint to verify backend readiness.
   */
  const response = await fetch(`${API_BASE_URL}/health`);
  return response.json();
}

async function removeBackgroundWithApi(imageDataUrl: string): Promise<RemoveBackgroundResponse> {
  /**
   * var: imageDataUrl
   * type: string
   * desc: Base64 image payload posted to media remove-background API.
   */
  const response = await fetch(`${API_BASE_URL}/media/remove-background`, {
    body: JSON.stringify({
      imageDataUrl
    }),
    headers: {
      'Content-Type': 'application/json'
    },
    method: 'POST'
  });
  if (!response.ok) {
    throw new Error('Background removal API failed.');
  }
  return response.json();
}

export {
  API_BASE_URL,
  getHealth,
  removeBackgroundWithApi
};
