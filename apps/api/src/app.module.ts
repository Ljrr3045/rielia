import { Module } from '@nestjs/common';
import { HealthController } from './health.controller.js';
import { IdentityController } from './identity/identity.controller.js';
import { IdentityService } from './identity/identity.service.js';
import { ReadinessController } from './runtime/readiness.controller.js';
import { RuntimeService } from './runtime/runtime.service.js';
import { PrincipalController } from './principals/principal.controller.js';
import { PrincipalService } from './principals/principal.service.js';

@Module({ controllers: [HealthController, IdentityController, ReadinessController, PrincipalController], providers: [IdentityService, RuntimeService, PrincipalService] })
export class AppModule {}
