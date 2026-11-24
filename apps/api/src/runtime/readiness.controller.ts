import { Controller, Get, Header, Inject, ServiceUnavailableException } from '@nestjs/common';
import { RuntimeService } from './runtime.service.js';
import type { ReadinessResponse } from '@rielia/contracts';

@Controller('readiness')
export class ReadinessController {
  constructor(@Inject(RuntimeService) private readonly runtime: RuntimeService) {}

  @Get()
  @Header('Cache-Control', 'no-store')
  async readiness(): Promise<ReadinessResponse> {
    if (!(await this.runtime.ready()))
      throw new ServiceUnavailableException('Local runtime is unavailable.');
    return { status: 'ready' };
  }
}
