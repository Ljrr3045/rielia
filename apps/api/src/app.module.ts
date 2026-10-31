import { Module } from '@nestjs/common';
import { HealthController } from './health.controller.js';
import { IdentityController } from './identity/identity.controller.js';
import { IdentityService } from './identity/identity.service.js';
import { ReadinessController } from './runtime/readiness.controller.js';
import { RuntimeService } from './runtime/runtime.service.js';
import { PrincipalController } from './principals/principal.controller.js';
import { PrincipalService } from './principals/principal.service.js';
import { WorkspaceController } from './workspaces/workspace.controller.js';
import { WorkspaceService } from './workspaces/workspace.service.js';
import { ProjectTaskController } from './projects/project-task.controller.js';
import { ProjectTaskService } from './projects/project-task.service.js';
import { ProjectTaskHttp } from './projects/project-task-http.js';
import { TaskCollaborationService } from './projects/task-collaboration.service.js';
import { TaskCollaborationController } from './projects/task-collaboration.controller.js';

@Module({ controllers: [HealthController, IdentityController, ReadinessController, PrincipalController, WorkspaceController, ProjectTaskController, TaskCollaborationController], providers: [IdentityService, RuntimeService, PrincipalService, WorkspaceService, ProjectTaskService, ProjectTaskHttp, TaskCollaborationService] })
export class AppModule {}
