/** Process liveness only. This says nothing about DB, auth, or product readiness. */
export interface HealthResponse {
  status: 'ok';
  service: 'rielia-api';
}

export function isHealthResponse(value: unknown): value is HealthResponse {
  return typeof value === 'object' && value !== null
    && 'status' in value && value.status === 'ok'
    && 'service' in value && value.service === 'rielia-api';
}
