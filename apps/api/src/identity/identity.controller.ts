import { Controller, Get, Header, Inject, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { IdentityService } from './identity.service.js';

@Controller('identity')
export class IdentityController {
  constructor(@Inject(IdentityService) private readonly identity: IdentityService) {}

  @Get('config')
  @Header('Cache-Control', 'no-store')
  configuration() {
    return { enabled: this.identity.config.enabled, providers: Object.keys(this.identity.config.providers) };
  }

  @Get('session')
  @Header('Cache-Control', 'no-store')
  async session(@Req() req: Request, @Res() res: Response): Promise<void> {
    const session = await this.identity.session(req.headers);
    for (const cookie of session.headers.getSetCookie()) res.append('Set-Cookie', cookie);
    res.json(session.data);
  }
}
