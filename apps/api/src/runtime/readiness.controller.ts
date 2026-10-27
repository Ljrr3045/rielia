import { Controller, Get, Header, Inject, ServiceUnavailableException } from '@nestjs/common';
import { RuntimeService } from './runtime.service.js';

@Controller('readiness')
export class ReadinessController {
  constructor(@Inject(RuntimeService) private readonly runtime: RuntimeService) {}

  @Get()
  @Header('Cache-Control', 'no-store')
  async readiness(): Promise<{ status: 'ready' }> {
    if (!await this.runtime.ready()) throw new ServiceUnavailableException('Local runtime is unavailable.');
    return { status: 'ready' };
  }
}
