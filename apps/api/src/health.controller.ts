import { Controller, Get, Header } from '@nestjs/common';
import type { HealthResponse } from '@rielia/contracts';

@Controller('health')
export class HealthController {
  @Get()
  @Header('Cache-Control', 'no-store')
  health(): HealthResponse {
    return { status: 'ok', service: 'rielia-api' };
  }
}
