const API_BASE_URL = 'http://localhost:4000';

async function getHealth() {
  const response = await fetch(`${API_BASE_URL}/health`);
  return response.json();
}

export { API_BASE_URL, getHealth };
