import { Module } from '@nestjs/common';
import { HealthController } from './health.controller.js';
import { IdentityController } from './identity/identity.controller.js';
import { IdentityService } from './identity/identity.service.js';

@Module({ controllers: [HealthController, IdentityController], providers: [IdentityService] })
export class AppModule {}
