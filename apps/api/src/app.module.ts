import { Module } from '@nestjs/common';
import { HealthController } from './health.controller.js';
import { IdentityController } from './identity/identity.controller.js';
import { IdentityService } from './identity/identity.service.js';
import { ReadinessController } from './runtime/readiness.controller.js';
import { RuntimeService } from './runtime/runtime.service.js';

@Module({ controllers: [HealthController, IdentityController, ReadinessController], providers: [IdentityService, RuntimeService] })
export class AppModule {}
