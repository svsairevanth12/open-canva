import { getHealthPayload } from '../services/healthService.js';

function getHealthStatus(request, response) {
  response.json(getHealthPayload());
}

export { getHealthStatus };
