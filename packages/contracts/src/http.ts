/** Shared HTTP response shapes. */

export type ComponentState = 'up' | 'down';

export interface HealthResponse {
  status: 'ok' | 'degraded';
  uptimeSeconds: number;
  checks: {
    database: ComponentState;
    broker: ComponentState;
  };
}
