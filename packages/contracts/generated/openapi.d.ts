/** Generated from rielia.openapi.json by openapi-typescript 7.13.0 / generator TS 5.9.3. Regenerate with pnpm openapi:generate. Do not edit. */
export interface paths {
    "/api/v1/health": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["H01"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/identity/config": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["H02"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/identity/session": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["H03"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/readiness": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["H55"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/workspace-invitations/accept": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["H64"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/workspaces": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["H56"];
        put?: never;
        post: operations["H57"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/workspaces/{workspaceId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["H58"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/workspaces/{workspaceId}/agents": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["H65"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/workspaces/{workspaceId}/agents/{principalId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["H66"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/workspaces/{workspaceId}/events": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["H50"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/workspaces/{workspaceId}/execution-context": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["H04"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/workspaces/{workspaceId}/invitations": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["H61"];
        put?: never;
        post: operations["H62"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/workspaces/{workspaceId}/invitations/{invitationId}/revoke": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["H63"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/workspaces/{workspaceId}/members": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["H59"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/workspaces/{workspaceId}/members/{principalId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["H60"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/workspaces/{workspaceId}/projects": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["H05"];
        put?: never;
        post: operations["H06"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/workspaces/{workspaceId}/projects/{projectId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["H07"];
        put?: never;
        post: operations["H08"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/workspaces/{workspaceId}/projects/{projectId}/access": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["H12"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/workspaces/{workspaceId}/projects/{projectId}/access/{principalId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["H14"];
        put?: never;
        post: operations["H13"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/workspaces/{workspaceId}/projects/{projectId}/archive": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["H09"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/workspaces/{workspaceId}/projects/{projectId}/assignees": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["H15"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/workspaces/{workspaceId}/projects/{projectId}/planning": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["H30"];
        put?: never;
        post: operations["H31"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/workspaces/{workspaceId}/projects/{projectId}/restore": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["H10"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/workspaces/{workspaceId}/projects/{projectId}/sprints": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["H32"];
        put?: never;
        post: operations["H34"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/workspaces/{workspaceId}/projects/{projectId}/sprints/{sprintId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["H33"];
        put?: never;
        post: operations["H35"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/workspaces/{workspaceId}/projects/{projectId}/sprints/{sprintId}/close": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["H24"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/workspaces/{workspaceId}/projects/{projectId}/sprints/{sprintId}/close-preview": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["H23"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/workspaces/{workspaceId}/projects/{projectId}/sprints/{sprintId}/closure": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["H25"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/workspaces/{workspaceId}/projects/{projectId}/sprints/{sprintId}/closure/outcomes": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["H26"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/workspaces/{workspaceId}/projects/{projectId}/sprints/{sprintId}/history": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["H29"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/workspaces/{workspaceId}/projects/{projectId}/sprints/{sprintId}/scope": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["H28"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/workspaces/{workspaceId}/projects/{projectId}/sprints/{sprintId}/start": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["H27"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/workspaces/{workspaceId}/projects/{projectId}/tasks": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["H16"];
        put?: never;
        post: operations["H17"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/workspaces/{workspaceId}/projects/{projectId}/tasks/{taskId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["H18"];
        put?: never;
        post: operations["H19"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/workspaces/{workspaceId}/projects/{projectId}/tasks/{taskId}/archive": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["H21"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/workspaces/{workspaceId}/projects/{projectId}/tasks/{taskId}/checklist": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["H38"];
        put?: never;
        post: operations["H43"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/workspaces/{workspaceId}/projects/{projectId}/tasks/{taskId}/checklist/{itemId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["H44"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/workspaces/{workspaceId}/projects/{projectId}/tasks/{taskId}/checklist/{itemId}/move": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["H45"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/workspaces/{workspaceId}/projects/{projectId}/tasks/{taskId}/checklist/{itemId}/remove": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["H46"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/workspaces/{workspaceId}/projects/{projectId}/tasks/{taskId}/comments": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["H39"];
        put?: never;
        post: operations["H47"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/workspaces/{workspaceId}/projects/{projectId}/tasks/{taskId}/comments/{commentId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["H41"];
        put?: never;
        post: operations["H48"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/workspaces/{workspaceId}/projects/{projectId}/tasks/{taskId}/history": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["H40"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/workspaces/{workspaceId}/projects/{projectId}/tasks/{taskId}/move": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["H20"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/workspaces/{workspaceId}/projects/{projectId}/tasks/{taskId}/parent": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["H42"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/workspaces/{workspaceId}/projects/{projectId}/tasks/{taskId}/parent-candidates": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["H37"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/workspaces/{workspaceId}/projects/{projectId}/tasks/{taskId}/planning": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["H51"];
        put?: never;
        post: operations["H53"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/workspaces/{workspaceId}/projects/{projectId}/tasks/{taskId}/relations": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["H36"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/workspaces/{workspaceId}/projects/{projectId}/tasks/{taskId}/restore": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["H22"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/workspaces/{workspaceId}/projects/{projectId}/tasks/{taskId}/sprint": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["H54"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/workspaces/{workspaceId}/projects/{projectId}/tasks/{taskId}/sprint-history": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["H52"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/workspaces/{workspaceId}/projects/{projectId}/visibility": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["H11"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/workspaces/{workspaceId}/task-discovery": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["H49"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
}
export type webhooks = Record<string, never>;
export interface components {
    schemas: {
        acceptWorkspaceInvitationInputSchema: {
            token: string;
        };
        addChecklistItemInputSchema: {
            beforeItemId: string | null;
            expectedVersion: number;
            text: string;
        };
        addCommentInputSchema: {
            body: string;
            expectedVersion: number;
        };
        changeProjectAccessInputSchema: {
            expectedVersion: number;
            /** @enum {string} */
            state: "active" | "revoked";
        };
        changeProjectVisibilityInputSchema: {
            expectedVersion: number;
            /** @enum {string} */
            visibility: "workspace" | "private";
        };
        closeSprintInputSchema: {
            destination: string | null;
            expectedProjectVersion: number;
            expectedSprintRevision: number;
            expectedTargetVersion: number | null;
            expectedTaskRevision: number;
            expectedVersion: number;
            previewHash: string;
            /** @constant */
            previewSchema: 1;
        } & ({
            destination?: null;
            expectedTargetVersion?: null;
        } | {
            /** @constant */
            destination?: "backlog";
            expectedTargetVersion?: null;
        } | {
            destination?: string & unknown;
            expectedTargetVersion?: number;
        });
        configurePlanningInputSchema: {
            expectedVersion: number;
            /** @enum {string} */
            mode: "kanban" | "scrum";
            pointScale: number[];
            timeZone: string;
        };
        createdInvitationSchema: {
            invitation: {
                createdAt: string;
                expiresAt: string;
                id: string;
                issuerPrincipalId: string;
                recipientEmail: string;
                /** @enum {string} */
                role: "admin" | "member" | "viewer";
                /** @enum {string} */
                state: "pending" | "expired" | "accepted" | "revoked";
                workspaceId: string;
            } & {
                [key: string]: unknown;
            };
            token: string;
        } & {
            [key: string]: unknown;
        };
        createProjectInputSchema: {
            description?: string | null;
            key: string;
            name: string;
            /** @enum {string} */
            visibility?: "workspace" | "private";
        };
        createSprintInputSchema: {
            endDateExclusive: string;
            expectedProjectVersion: number;
            goal: string;
            name: string;
            startDate: string;
        };
        createTaskInputSchema: {
            assigneePrincipalId?: string | null;
            description?: string | null;
            dueDate?: string | null;
            expectedParentVersion?: number;
            parentTaskId?: string;
            /**
             * @default none
             * @enum {string}
             */
            priority?: "none" | "low" | "medium" | "high" | "urgent";
            /**
             * @default backlog
             * @enum {string}
             */
            status?: "backlog" | "todo" | "in_progress" | "done" | "canceled";
            title: string;
            /**
             * @default task
             * @enum {string}
             */
            type?: "task" | "bug" | "feature";
        } & (unknown | ({
            parentTaskId: string;
        } & unknown));
        createWorkspaceInputSchema: {
            name: string;
        };
        editChecklistItemInputSchema: {
            completed?: boolean;
            expectedVersion: number;
            text?: string;
        } & (unknown | unknown);
        editCommentInputSchema: {
            body: string;
            expectedCommentVersion: number;
            expectedVersion: number;
        };
        editProjectInputSchema: {
            description: string;
            expectedVersion: number;
            name: string;
        };
        editSprintInputSchema: {
            endDateExclusive: string;
            expectedVersion: number;
            goal: string;
            name: string;
            startDate: string;
        };
        editTaskInputSchema: {
            acknowledgedChildrenVersion?: number;
            assigneePrincipalId?: string | null;
            description?: string;
            dueDate?: string | null;
            expectedVersion: number;
            /** @enum {string} */
            priority?: "none" | "low" | "medium" | "high" | "urgent";
            /** @enum {string} */
            status?: "backlog" | "todo" | "in_progress" | "done" | "canceled";
            title?: string;
            /** @enum {string} */
            type?: "task" | "bug" | "feature";
        } & (unknown | unknown | unknown | unknown | unknown | unknown | unknown);
        estimateTaskInputSchema: {
            estimatePoints: number | null;
            expectedVersion: number;
        };
        executionContextResponseSchema: {
            actorPrincipalId: string;
            /** @enum {string} */
            executionMode: "human" | "delegated" | "autonomous" | "system";
            grantId: string | null;
            /** @enum {string} */
            principalKind: "human" | "agent" | "system";
            /** @enum {string} */
            role: "owner" | "admin" | "member" | "viewer";
            /** @enum {string} */
            source: "web" | "mcp" | "internal";
            workspaceId: string;
        } & {
            [key: string]: unknown;
        };
        healthResponseSchema: {
            /** @constant */
            service: "rielia-api";
            /** @constant */
            status: "ok";
        } & {
            [key: string]: unknown;
        };
        identityConfigurationSchema: {
            enabled: boolean;
            providers: ("google" | "github")[];
        };
        identitySessionSchema: {
            session: {
                expiresAt: string;
                id: string;
            };
            user: {
                email: string;
                emailVerified: boolean;
                id: string;
                name: string;
            };
        } | null;
        inviteWorkspaceMemberInputSchema: {
            recipientEmail: string;
            /** @enum {string} */
            role: "admin" | "member" | "viewer";
        };
        manageWorkspaceAgentInputSchema: {
            custodianPrincipalId?: string;
            /** @enum {string} */
            state?: "active" | "suspended" | "revoked";
            version: number;
        } & (unknown | unknown);
        moveChecklistItemInputSchema: {
            beforeItemId: string | null;
            expectedVersion: number;
        };
        moveTaskInputSchema: {
            acknowledgedChildrenVersion?: number;
            beforeTaskId: string | null;
            expectedOrderVersion: number;
            expectedVersion: number;
            /** @enum {string} */
            status: "backlog" | "todo" | "in_progress" | "done" | "canceled";
        };
        planningHistoryPageSchema: {
            items: ({
                action: string;
                actor: {
                    active: boolean;
                    /** @enum {string} */
                    kind: "human" | "agent";
                    name: string;
                    principalId: string;
                } & {
                    [key: string]: unknown;
                };
                after: {
                    archivedAt: string | null;
                    estimatePoints: number | null;
                    parentTaskId: string | null;
                    /** @enum {string} */
                    status: "backlog" | "todo" | "in_progress" | "done" | "canceled";
                    version: number;
                } | null;
                before: {
                    archivedAt: string | null;
                    estimatePoints: number | null;
                    parentTaskId: string | null;
                    /** @enum {string} */
                    status: "backlog" | "todo" | "in_progress" | "done" | "canceled";
                    version: number;
                } | null;
                id: string;
                /** @enum {string} */
                kind: "entry" | "exit" | "task-change" | "metadata" | "start" | "estimate" | "close" | "carryover";
                occurredAt: string;
                ordinal: number;
                participationId: string | null;
                provenance: {
                    actorPrincipalId: string;
                    /** @enum {string} */
                    executionMode: "human" | "delegated" | "autonomous";
                    grantId: string | null;
                    /** @enum {string} */
                    source: "web" | "mcp";
                } & ({
                    /** @constant */
                    executionMode?: "human";
                    grantId?: null;
                    /** @constant */
                    source?: "web";
                } | {
                    /** @constant */
                    executionMode?: "delegated";
                    grantId?: string;
                    /** @constant */
                    source?: "mcp";
                } | {
                    /** @constant */
                    executionMode?: "autonomous";
                    grantId?: string;
                    /** @constant */
                    source?: "mcp";
                });
                sprintId: string | null;
                taskId: string | null;
            } | ({
                action: string;
                actor: {
                    active: boolean;
                    /** @enum {string} */
                    kind: "human" | "agent";
                    name: string;
                    principalId: string;
                } & {
                    [key: string]: unknown;
                };
                after: {
                    archivedAt: string | null;
                    estimatePoints: number | null;
                    parentTaskId: string | null;
                    /** @enum {string} */
                    status: "backlog" | "todo" | "in_progress" | "done" | "canceled";
                    version: number;
                } | null;
                before: {
                    archivedAt: string | null;
                    estimatePoints: number | null;
                    parentTaskId: string | null;
                    /** @enum {string} */
                    status: "backlog" | "todo" | "in_progress" | "done" | "canceled";
                    version: number;
                } | null;
                closureId: string;
                /** @enum {string} */
                disposition: "done" | "canceled" | "backlog" | "carried";
                id: string;
                /** @constant */
                kind: "outcome";
                occurredAt: string;
                ordinal: number;
                participationId: string | null;
                provenance: {
                    actorPrincipalId: string;
                    /** @enum {string} */
                    executionMode: "human" | "delegated" | "autonomous";
                    grantId: string | null;
                    /** @enum {string} */
                    source: "web" | "mcp";
                } & ({
                    /** @constant */
                    executionMode?: "human";
                    grantId?: null;
                    /** @constant */
                    source?: "web";
                } | {
                    /** @constant */
                    executionMode?: "delegated";
                    grantId?: string;
                    /** @constant */
                    source?: "mcp";
                } | {
                    /** @constant */
                    executionMode?: "autonomous";
                    grantId?: string;
                    /** @constant */
                    source?: "mcp";
                });
                sprintId: string | null;
                targetParticipationId: string | null;
                targetSprintId: string | null;
                taskId: string | null;
            } & ({
                /** @constant */
                disposition?: "done";
                targetParticipationId?: null;
                targetSprintId?: null;
            } | {
                /** @constant */
                disposition?: "canceled";
                targetParticipationId?: null;
                targetSprintId?: null;
            } | {
                /** @constant */
                disposition?: "backlog";
                targetParticipationId?: null;
                targetSprintId?: null;
            } | {
                /** @constant */
                disposition?: "carried";
                targetParticipationId?: string;
                targetSprintId?: string;
            })))[];
            nextCursor: string | null;
            projectId: string;
            sprintId: string | null;
            sprintRevision: number;
            taskId: string | null;
            taskRevision: number;
            total: number;
            workspaceId: string;
        };
        projectAccessPageSchema: {
            items: ({
                active: boolean;
                capabilities: {
                    canGrant: boolean;
                    canRevoke: boolean;
                } & {
                    [key: string]: unknown;
                };
                effectiveAccess: boolean;
                explicitAccess: ("active" | "revoked") | null;
                implicitAccess: boolean;
                /** @enum {string} */
                kind: "human" | "agent";
                name: string;
                principalId: string;
                /** @enum {string} */
                role: "owner" | "admin" | "member" | "viewer";
            } & {
                [key: string]: unknown;
            })[];
            nextCursor: string | null;
            projectId: string;
            projectVersion: number;
            total: number;
            workspaceId: string;
        } & {
            [key: string]: unknown;
        };
        projectAccessReviewSchema: {
            member: {
                active: boolean;
                capabilities: {
                    canGrant: boolean;
                    canRevoke: boolean;
                } & {
                    [key: string]: unknown;
                };
                effectiveAccess: boolean;
                explicitAccess: ("active" | "revoked") | null;
                implicitAccess: boolean;
                /** @enum {string} */
                kind: "human" | "agent";
                name: string;
                principalId: string;
                /** @enum {string} */
                role: "owner" | "admin" | "member" | "viewer";
            } & {
                [key: string]: unknown;
            };
            project: {
                archivedAt: string | null;
                capabilities: {
                    canArchive: boolean;
                    canChangeVisibility: boolean;
                    canEdit: boolean;
                    canGrantAccess: boolean;
                    canManageAccess: boolean;
                    canRestore: boolean;
                    canRevokeAccess: boolean;
                } & {
                    [key: string]: unknown;
                };
                createdAt: string;
                creator: {
                    active: boolean;
                    /** @enum {string} */
                    kind: "human" | "agent";
                    name: string;
                    principalId: string;
                } & {
                    [key: string]: unknown;
                };
                description: string;
                id: string;
                key: string;
                name: string;
                provenance: {
                    actorPrincipalId: string;
                    /** @enum {string} */
                    executionMode: "human" | "delegated" | "autonomous";
                    grantId: string | null;
                    /** @enum {string} */
                    source: "web" | "mcp";
                } & {
                    [key: string]: unknown;
                };
                updatedAt: string;
                url: string;
                version: number;
                /** @enum {string} */
                visibility: "workspace" | "private";
                workspaceId: string;
            } & {
                [key: string]: unknown;
            };
        } & {
            [key: string]: unknown;
        };
        projectAssigneePageSchema: {
            items: ({
                active: boolean;
                /** @enum {string} */
                kind: "human" | "agent";
                name: string;
                principalId: string;
            } & {
                [key: string]: unknown;
            })[];
            nextCursor: string | null;
            projectId: string;
            total: number;
            workspaceId: string;
        } & {
            [key: string]: unknown;
        };
        projectPageSchema: {
            capabilities: {
                canCreate: boolean;
                canCreatePrivate?: boolean;
            } & {
                [key: string]: unknown;
            };
            items: ({
                archivedAt: string | null;
                capabilities: {
                    canArchive: boolean;
                    canChangeVisibility: boolean;
                    canEdit: boolean;
                    canGrantAccess: boolean;
                    canManageAccess: boolean;
                    canRestore: boolean;
                    canRevokeAccess: boolean;
                } & {
                    [key: string]: unknown;
                };
                createdAt: string;
                creator: {
                    active: boolean;
                    /** @enum {string} */
                    kind: "human" | "agent";
                    name: string;
                    principalId: string;
                } & {
                    [key: string]: unknown;
                };
                description: string;
                id: string;
                key: string;
                name: string;
                provenance: {
                    actorPrincipalId: string;
                    /** @enum {string} */
                    executionMode: "human" | "delegated" | "autonomous";
                    grantId: string | null;
                    /** @enum {string} */
                    source: "web" | "mcp";
                } & {
                    [key: string]: unknown;
                };
                updatedAt: string;
                url: string;
                version: number;
                /** @enum {string} */
                visibility: "workspace" | "private";
                workspaceId: string;
            } & {
                [key: string]: unknown;
            })[];
            nextCursor: string | null;
            total: number;
        } & {
            [key: string]: unknown;
        };
        projectPlanningSchema: {
            archivedAt: string | null;
            capabilities: {
                canConfigurePlanning: boolean;
                canCreateSprint: boolean;
            } & {
                [key: string]: unknown;
            };
            /** @enum {string} */
            mode: "kanban" | "scrum";
            pointScale: number[];
            projectId: string;
            projectVersion: number;
            sprintRevision: number;
            timeZone: string;
            workspaceId: string;
        } & {
            [key: string]: unknown;
        };
        projectSchema: {
            archivedAt: string | null;
            capabilities: {
                canArchive: boolean;
                canChangeVisibility: boolean;
                canEdit: boolean;
                canGrantAccess: boolean;
                canManageAccess: boolean;
                canRestore: boolean;
                canRevokeAccess: boolean;
            } & {
                [key: string]: unknown;
            };
            createdAt: string;
            creator: {
                active: boolean;
                /** @enum {string} */
                kind: "human" | "agent";
                name: string;
                principalId: string;
            } & {
                [key: string]: unknown;
            };
            description: string;
            id: string;
            key: string;
            name: string;
            provenance: {
                actorPrincipalId: string;
                /** @enum {string} */
                executionMode: "human" | "delegated" | "autonomous";
                grantId: string | null;
                /** @enum {string} */
                source: "web" | "mcp";
            } & {
                [key: string]: unknown;
            };
            updatedAt: string;
            url: string;
            version: number;
            /** @enum {string} */
            visibility: "workspace" | "private";
            workspaceId: string;
        } & {
            [key: string]: unknown;
        };
        projectTaskVersionInputSchema: {
            expectedVersion: number;
        };
        readinessResponseSchema: {
            /** @constant */
            status: "ready";
        } & {
            [key: string]: unknown;
        };
        registerWorkspaceAgentInputSchema: {
            custodianPrincipalId: string;
            name: string;
            /** @enum {string} */
            role: "member" | "viewer";
        };
        removeChecklistItemInputSchema: {
            expectedVersion: number;
        };
        revokeWorkspaceInvitationInputSchema: Record<string, never>;
        setTaskParentInputSchema: {
            expectedParentVersion?: number;
            expectedVersion: number;
            parentTaskId: string | null;
        } & (({
            parentTaskId: null;
        } & unknown) | ({
            parentTaskId: string;
        } & unknown));
        setTaskSprintInputSchema: {
            expectedCurrentParticipationId: string | null;
            expectedSourceVersion: number | null;
            expectedTargetVersion: number | null;
            expectedTaskVersion: number;
            targetSprintId: string | null;
        } & ({
            expectedCurrentParticipationId?: null;
            expectedSourceVersion?: null;
            expectedTargetVersion?: null;
            targetSprintId?: null;
        } | {
            expectedCurrentParticipationId?: null;
            expectedSourceVersion?: null;
            expectedTargetVersion?: number;
            targetSprintId?: string;
        } | {
            expectedCurrentParticipationId?: string;
            expectedSourceVersion?: number;
            expectedTargetVersion?: null;
            targetSprintId?: null;
        } | {
            expectedCurrentParticipationId?: string;
            expectedSourceVersion?: number;
            expectedTargetVersion?: number;
            targetSprintId?: string;
        });
        sprintClosePreviewSchema: {
            canClose: boolean;
            destination: string | null;
            expectedProjectVersion: number;
            expectedSprintRevision: number;
            expectedTargetVersion: number | null;
            expectedTaskRevision: number;
            expectedVersion: number;
            items: ({
                /** @enum {string} */
                disposition: "done" | "canceled" | "backlog" | "carried" | "pending";
                participationId: string;
                snapshot: {
                    archivedAt: string | null;
                    estimatePoints: number | null;
                    parentTaskId: string | null;
                    /** @enum {string} */
                    status: "backlog" | "todo" | "in_progress" | "done" | "canceled";
                    version: number;
                };
                taskId: string;
            } & ({
                /** @constant */
                disposition?: "backlog";
                snapshot?: {
                    /** @constant */
                    status?: "backlog";
                };
            } | {
                /** @constant */
                disposition?: "carried";
                snapshot?: {
                    /** @constant */
                    status?: "backlog";
                };
            } | {
                /** @constant */
                disposition?: "pending";
                snapshot?: {
                    /** @constant */
                    status?: "backlog";
                };
            } | {
                /** @constant */
                disposition?: "backlog";
                snapshot?: {
                    /** @constant */
                    status?: "todo";
                };
            } | {
                /** @constant */
                disposition?: "carried";
                snapshot?: {
                    /** @constant */
                    status?: "todo";
                };
            } | {
                /** @constant */
                disposition?: "pending";
                snapshot?: {
                    /** @constant */
                    status?: "todo";
                };
            } | {
                /** @constant */
                disposition?: "backlog";
                snapshot?: {
                    /** @constant */
                    status?: "in_progress";
                };
            } | {
                /** @constant */
                disposition?: "carried";
                snapshot?: {
                    /** @constant */
                    status?: "in_progress";
                };
            } | {
                /** @constant */
                disposition?: "pending";
                snapshot?: {
                    /** @constant */
                    status?: "in_progress";
                };
            } | {
                /** @constant */
                disposition?: "done";
                snapshot?: {
                    /** @constant */
                    status?: "done";
                };
            } | {
                /** @constant */
                disposition?: "canceled";
                snapshot?: {
                    /** @constant */
                    status?: "canceled";
                };
            }))[];
            nextCursor: string | null;
            pendingParticipants: number;
            previewHash: string;
            /** @constant */
            previewSchema: 1;
            projectId: string;
            sprintId: string;
            total: number;
            totals: {
                archived: number;
                canceled: number;
                canceledPoints: number;
                children: number;
                done: number;
                donePoints: number;
                pending: number;
                pendingPoints: number;
                unestimated: number;
            };
            workspaceId: string;
        } & (({
            destination?: null;
            expectedTargetVersion?: null;
        } | {
            /** @constant */
            destination?: "backlog";
            expectedTargetVersion?: null;
        } | {
            destination?: string & unknown;
            expectedTargetVersion?: number;
        }) & ({
            destination?: null;
            expectedTargetVersion?: null;
        } | {
            /** @constant */
            destination?: "backlog";
            expectedTargetVersion?: null;
        } | {
            destination?: string & unknown;
            expectedTargetVersion?: number;
        }));
        sprintCloseResultSchema: {
            closure: {
                activityId: string;
                closedAt: string;
                destination: string | null;
                id: string;
                pendingParticipants: number;
                previewHash: string;
                /** @constant */
                previewSchema: 1;
                projectId: string;
                sourceOrdinal: number;
                sprintId: string;
                targetOrdinal: number | null;
                total: number;
                totals: {
                    archived: number;
                    canceled: number;
                    canceledPoints: number;
                    children: number;
                    done: number;
                    donePoints: number;
                    pending: number;
                    pendingPoints: number;
                    unestimated: number;
                };
                workspaceId: string;
            } & ({
                destination?: null;
                targetOrdinal?: null;
            } | {
                /** @constant */
                destination?: "backlog";
                targetOrdinal?: null;
            } | {
                destination?: string & unknown;
                targetOrdinal?: number;
            });
            current: (({
                capabilities: {
                    canChangeScope?: boolean;
                    canClose?: boolean;
                    canEdit: boolean;
                    canStart?: boolean;
                } & {
                    [key: string]: unknown;
                };
                createdAt: string;
                creator: {
                    active: boolean;
                    /** @enum {string} */
                    kind: "human" | "agent";
                    name: string;
                    principalId: string;
                } & {
                    [key: string]: unknown;
                };
                endDateExclusive: string;
                endsAt: string;
                goal: string;
                id: string;
                name: string;
                projectId: string;
                provenance: ({
                    actorPrincipalId: string;
                    /** @enum {string} */
                    executionMode: "human" | "delegated" | "autonomous";
                    grantId: string | null;
                    /** @enum {string} */
                    source: "web" | "mcp";
                } & {
                    [key: string]: unknown;
                }) & ({
                    /** @constant */
                    executionMode?: "human";
                    grantId?: null;
                    /** @constant */
                    source?: "web";
                } | {
                    /** @constant */
                    executionMode?: "delegated";
                    grantId?: string;
                    /** @constant */
                    source?: "mcp";
                } | {
                    /** @constant */
                    executionMode?: "autonomous";
                    grantId?: string;
                    /** @constant */
                    source?: "mcp";
                });
                startDate: string;
                startsAt: string;
                /** @constant */
                state: "planned";
                timeZone: string;
                updatedAt: string;
                url: string;
                version: number;
                workspaceId: string;
            } & {
                [key: string]: unknown;
            }) & unknown) | (({
                capabilities: {
                    canChangeScope?: boolean;
                    canClose?: boolean;
                    canEdit: boolean;
                    canStart?: boolean;
                } & {
                    [key: string]: unknown;
                };
                createdAt: string;
                creator: {
                    active: boolean;
                    /** @enum {string} */
                    kind: "human" | "agent";
                    name: string;
                    principalId: string;
                } & {
                    [key: string]: unknown;
                };
                endDateExclusive: string;
                endsAt: string;
                goal: string;
                id: string;
                name: string;
                projectId: string;
                provenance: ({
                    actorPrincipalId: string;
                    /** @enum {string} */
                    executionMode: "human" | "delegated" | "autonomous";
                    grantId: string | null;
                    /** @enum {string} */
                    source: "web" | "mcp";
                } & {
                    [key: string]: unknown;
                }) & ({
                    /** @constant */
                    executionMode?: "human";
                    grantId?: null;
                    /** @constant */
                    source?: "web";
                } | {
                    /** @constant */
                    executionMode?: "delegated";
                    grantId?: string;
                    /** @constant */
                    source?: "mcp";
                } | {
                    /** @constant */
                    executionMode?: "autonomous";
                    grantId?: string;
                    /** @constant */
                    source?: "mcp";
                });
                startDate: string;
                startedAt: string;
                startsAt: string;
                /** @constant */
                state: "active";
                timeZone: string;
                updatedAt: string;
                url: string;
                version: number;
                workspaceId: string;
            } & {
                [key: string]: unknown;
            }) & unknown) | (({
                capabilities: {
                    canChangeScope?: boolean;
                    canClose?: boolean;
                    canEdit: boolean;
                    canStart?: boolean;
                } & {
                    [key: string]: unknown;
                };
                closedAt: string;
                createdAt: string;
                creator: {
                    active: boolean;
                    /** @enum {string} */
                    kind: "human" | "agent";
                    name: string;
                    principalId: string;
                } & {
                    [key: string]: unknown;
                };
                endDateExclusive: string;
                endsAt: string;
                goal: string;
                id: string;
                name: string;
                projectId: string;
                provenance: ({
                    actorPrincipalId: string;
                    /** @enum {string} */
                    executionMode: "human" | "delegated" | "autonomous";
                    grantId: string | null;
                    /** @enum {string} */
                    source: "web" | "mcp";
                } & {
                    [key: string]: unknown;
                }) & ({
                    /** @constant */
                    executionMode?: "human";
                    grantId?: null;
                    /** @constant */
                    source?: "web";
                } | {
                    /** @constant */
                    executionMode?: "delegated";
                    grantId?: string;
                    /** @constant */
                    source?: "mcp";
                } | {
                    /** @constant */
                    executionMode?: "autonomous";
                    grantId?: string;
                    /** @constant */
                    source?: "mcp";
                });
                startDate: string;
                startedAt: string;
                startsAt: string;
                /** @constant */
                state: "closed";
                timeZone: string;
                updatedAt: string;
                url: string;
                version: number;
                workspaceId: string;
            } & {
                [key: string]: unknown;
            }) & {
                capabilities: {
                    /** @constant */
                    canChangeScope: false;
                    /** @constant */
                    canClose: false;
                    /** @constant */
                    canEdit: false;
                    /** @constant */
                    canStart: false;
                } & {
                    [key: string]: unknown;
                };
            });
            operation: {
                activityId: string;
                closureId: string;
                sprintId: string;
                /** @constant */
                type: "close-sprint";
            };
        };
        sprintClosingOutcomePageSchema: {
            closureId: string;
            items: ({
                closureId: string;
                /** @enum {string} */
                disposition: "done" | "canceled" | "backlog" | "carried";
                id: string;
                participationId: string;
                snapshot: {
                    archivedAt: string | null;
                    estimatePoints: number | null;
                    parentTaskId: string | null;
                    /** @enum {string} */
                    status: "backlog" | "todo" | "in_progress" | "done" | "canceled";
                    version: number;
                };
                targetParticipationId: string | null;
                targetSprintId: string | null;
                taskId: string;
            } & (({
                /** @constant */
                disposition?: "backlog";
                snapshot?: {
                    /** @constant */
                    status?: "backlog";
                };
            } | {
                /** @constant */
                disposition?: "carried";
                snapshot?: {
                    /** @constant */
                    status?: "backlog";
                };
            } | {
                /** @constant */
                disposition?: "backlog";
                snapshot?: {
                    /** @constant */
                    status?: "todo";
                };
            } | {
                /** @constant */
                disposition?: "carried";
                snapshot?: {
                    /** @constant */
                    status?: "todo";
                };
            } | {
                /** @constant */
                disposition?: "backlog";
                snapshot?: {
                    /** @constant */
                    status?: "in_progress";
                };
            } | {
                /** @constant */
                disposition?: "carried";
                snapshot?: {
                    /** @constant */
                    status?: "in_progress";
                };
            } | {
                /** @constant */
                disposition?: "done";
                snapshot?: {
                    /** @constant */
                    status?: "done";
                };
            } | {
                /** @constant */
                disposition?: "canceled";
                snapshot?: {
                    /** @constant */
                    status?: "canceled";
                };
            }) & ({
                /** @constant */
                disposition?: "backlog";
                snapshot?: {
                    /** @constant */
                    status?: "backlog";
                };
            } | {
                /** @constant */
                disposition?: "carried";
                snapshot?: {
                    /** @constant */
                    status?: "backlog";
                };
            } | {
                /** @constant */
                disposition?: "backlog";
                snapshot?: {
                    /** @constant */
                    status?: "todo";
                };
            } | {
                /** @constant */
                disposition?: "carried";
                snapshot?: {
                    /** @constant */
                    status?: "todo";
                };
            } | {
                /** @constant */
                disposition?: "backlog";
                snapshot?: {
                    /** @constant */
                    status?: "in_progress";
                };
            } | {
                /** @constant */
                disposition?: "carried";
                snapshot?: {
                    /** @constant */
                    status?: "in_progress";
                };
            } | {
                /** @constant */
                disposition?: "done";
                snapshot?: {
                    /** @constant */
                    status?: "done";
                };
            } | {
                /** @constant */
                disposition?: "canceled";
                snapshot?: {
                    /** @constant */
                    status?: "canceled";
                };
            }) & ({
                /** @constant */
                disposition?: "done";
                targetParticipationId?: null;
                targetSprintId?: null;
            } | {
                /** @constant */
                disposition?: "canceled";
                targetParticipationId?: null;
                targetSprintId?: null;
            } | {
                /** @constant */
                disposition?: "backlog";
                targetParticipationId?: null;
                targetSprintId?: null;
            } | {
                /** @constant */
                disposition?: "carried";
                targetParticipationId?: string;
                targetSprintId?: string;
            })))[];
            nextCursor: string | null;
            projectId: string;
            sprintId: string;
            total: number;
            workspaceId: string;
        };
        sprintClosureSchema: {
            activityId: string;
            closedAt: string;
            destination: string | null;
            id: string;
            pendingParticipants: number;
            previewHash: string;
            /** @constant */
            previewSchema: 1;
            projectId: string;
            sourceOrdinal: number;
            sprintId: string;
            targetOrdinal: number | null;
            total: number;
            totals: {
                archived: number;
                canceled: number;
                canceledPoints: number;
                children: number;
                done: number;
                donePoints: number;
                pending: number;
                pendingPoints: number;
                unestimated: number;
            };
            workspaceId: string;
        } & ({
            destination?: null;
            targetOrdinal?: null;
        } | {
            /** @constant */
            destination?: "backlog";
            targetOrdinal?: null;
        } | {
            destination?: string & unknown;
            targetOrdinal?: number;
        });
        sprintPageSchema: {
            capabilities: {
                canCreate: boolean;
            } & {
                [key: string]: unknown;
            };
            items: ((({
                capabilities: {
                    canChangeScope?: boolean;
                    canClose?: boolean;
                    canEdit: boolean;
                    canStart?: boolean;
                } & {
                    [key: string]: unknown;
                };
                createdAt: string;
                creator: {
                    active: boolean;
                    /** @enum {string} */
                    kind: "human" | "agent";
                    name: string;
                    principalId: string;
                } & {
                    [key: string]: unknown;
                };
                endDateExclusive: string;
                endsAt: string;
                goal: string;
                id: string;
                name: string;
                projectId: string;
                provenance: ({
                    actorPrincipalId: string;
                    /** @enum {string} */
                    executionMode: "human" | "delegated" | "autonomous";
                    grantId: string | null;
                    /** @enum {string} */
                    source: "web" | "mcp";
                } & {
                    [key: string]: unknown;
                }) & ({
                    /** @constant */
                    executionMode?: "human";
                    grantId?: null;
                    /** @constant */
                    source?: "web";
                } | {
                    /** @constant */
                    executionMode?: "delegated";
                    grantId?: string;
                    /** @constant */
                    source?: "mcp";
                } | {
                    /** @constant */
                    executionMode?: "autonomous";
                    grantId?: string;
                    /** @constant */
                    source?: "mcp";
                });
                startDate: string;
                startsAt: string;
                /** @constant */
                state: "planned";
                timeZone: string;
                updatedAt: string;
                url: string;
                version: number;
                workspaceId: string;
            } & {
                [key: string]: unknown;
            }) & unknown) | (({
                capabilities: {
                    canChangeScope?: boolean;
                    canClose?: boolean;
                    canEdit: boolean;
                    canStart?: boolean;
                } & {
                    [key: string]: unknown;
                };
                createdAt: string;
                creator: {
                    active: boolean;
                    /** @enum {string} */
                    kind: "human" | "agent";
                    name: string;
                    principalId: string;
                } & {
                    [key: string]: unknown;
                };
                endDateExclusive: string;
                endsAt: string;
                goal: string;
                id: string;
                name: string;
                projectId: string;
                provenance: ({
                    actorPrincipalId: string;
                    /** @enum {string} */
                    executionMode: "human" | "delegated" | "autonomous";
                    grantId: string | null;
                    /** @enum {string} */
                    source: "web" | "mcp";
                } & {
                    [key: string]: unknown;
                }) & ({
                    /** @constant */
                    executionMode?: "human";
                    grantId?: null;
                    /** @constant */
                    source?: "web";
                } | {
                    /** @constant */
                    executionMode?: "delegated";
                    grantId?: string;
                    /** @constant */
                    source?: "mcp";
                } | {
                    /** @constant */
                    executionMode?: "autonomous";
                    grantId?: string;
                    /** @constant */
                    source?: "mcp";
                });
                startDate: string;
                startedAt: string;
                startsAt: string;
                /** @constant */
                state: "active";
                timeZone: string;
                updatedAt: string;
                url: string;
                version: number;
                workspaceId: string;
            } & {
                [key: string]: unknown;
            }) & unknown) | (({
                capabilities: {
                    canChangeScope?: boolean;
                    canClose?: boolean;
                    canEdit: boolean;
                    canStart?: boolean;
                } & {
                    [key: string]: unknown;
                };
                closedAt: string;
                createdAt: string;
                creator: {
                    active: boolean;
                    /** @enum {string} */
                    kind: "human" | "agent";
                    name: string;
                    principalId: string;
                } & {
                    [key: string]: unknown;
                };
                endDateExclusive: string;
                endsAt: string;
                goal: string;
                id: string;
                name: string;
                projectId: string;
                provenance: ({
                    actorPrincipalId: string;
                    /** @enum {string} */
                    executionMode: "human" | "delegated" | "autonomous";
                    grantId: string | null;
                    /** @enum {string} */
                    source: "web" | "mcp";
                } & {
                    [key: string]: unknown;
                }) & ({
                    /** @constant */
                    executionMode?: "human";
                    grantId?: null;
                    /** @constant */
                    source?: "web";
                } | {
                    /** @constant */
                    executionMode?: "delegated";
                    grantId?: string;
                    /** @constant */
                    source?: "mcp";
                } | {
                    /** @constant */
                    executionMode?: "autonomous";
                    grantId?: string;
                    /** @constant */
                    source?: "mcp";
                });
                startDate: string;
                startedAt: string;
                startsAt: string;
                /** @constant */
                state: "closed";
                timeZone: string;
                updatedAt: string;
                url: string;
                version: number;
                workspaceId: string;
            } & {
                [key: string]: unknown;
            }) & {
                capabilities: {
                    /** @constant */
                    canChangeScope: false;
                    /** @constant */
                    canClose: false;
                    /** @constant */
                    canEdit: false;
                    /** @constant */
                    canStart: false;
                } & {
                    [key: string]: unknown;
                };
            }))[];
            nextCursor: string | null;
            projectId: string;
            projectVersion: number;
            revision: number;
            total: number;
            workspaceId: string;
        } & {
            [key: string]: unknown;
        };
        sprintSchema: (({
            capabilities: {
                canChangeScope?: boolean;
                canClose?: boolean;
                canEdit: boolean;
                canStart?: boolean;
            } & {
                [key: string]: unknown;
            };
            createdAt: string;
            creator: {
                active: boolean;
                /** @enum {string} */
                kind: "human" | "agent";
                name: string;
                principalId: string;
            } & {
                [key: string]: unknown;
            };
            endDateExclusive: string;
            endsAt: string;
            goal: string;
            id: string;
            name: string;
            projectId: string;
            provenance: ({
                actorPrincipalId: string;
                /** @enum {string} */
                executionMode: "human" | "delegated" | "autonomous";
                grantId: string | null;
                /** @enum {string} */
                source: "web" | "mcp";
            } & {
                [key: string]: unknown;
            }) & ({
                /** @constant */
                executionMode?: "human";
                grantId?: null;
                /** @constant */
                source?: "web";
            } | {
                /** @constant */
                executionMode?: "delegated";
                grantId?: string;
                /** @constant */
                source?: "mcp";
            } | {
                /** @constant */
                executionMode?: "autonomous";
                grantId?: string;
                /** @constant */
                source?: "mcp";
            });
            startDate: string;
            startsAt: string;
            /** @constant */
            state: "planned";
            timeZone: string;
            updatedAt: string;
            url: string;
            version: number;
            workspaceId: string;
        } & {
            [key: string]: unknown;
        }) & unknown) | (({
            capabilities: {
                canChangeScope?: boolean;
                canClose?: boolean;
                canEdit: boolean;
                canStart?: boolean;
            } & {
                [key: string]: unknown;
            };
            createdAt: string;
            creator: {
                active: boolean;
                /** @enum {string} */
                kind: "human" | "agent";
                name: string;
                principalId: string;
            } & {
                [key: string]: unknown;
            };
            endDateExclusive: string;
            endsAt: string;
            goal: string;
            id: string;
            name: string;
            projectId: string;
            provenance: ({
                actorPrincipalId: string;
                /** @enum {string} */
                executionMode: "human" | "delegated" | "autonomous";
                grantId: string | null;
                /** @enum {string} */
                source: "web" | "mcp";
            } & {
                [key: string]: unknown;
            }) & ({
                /** @constant */
                executionMode?: "human";
                grantId?: null;
                /** @constant */
                source?: "web";
            } | {
                /** @constant */
                executionMode?: "delegated";
                grantId?: string;
                /** @constant */
                source?: "mcp";
            } | {
                /** @constant */
                executionMode?: "autonomous";
                grantId?: string;
                /** @constant */
                source?: "mcp";
            });
            startDate: string;
            startedAt: string;
            startsAt: string;
            /** @constant */
            state: "active";
            timeZone: string;
            updatedAt: string;
            url: string;
            version: number;
            workspaceId: string;
        } & {
            [key: string]: unknown;
        }) & unknown) | (({
            capabilities: {
                canChangeScope?: boolean;
                canClose?: boolean;
                canEdit: boolean;
                canStart?: boolean;
            } & {
                [key: string]: unknown;
            };
            closedAt: string;
            createdAt: string;
            creator: {
                active: boolean;
                /** @enum {string} */
                kind: "human" | "agent";
                name: string;
                principalId: string;
            } & {
                [key: string]: unknown;
            };
            endDateExclusive: string;
            endsAt: string;
            goal: string;
            id: string;
            name: string;
            projectId: string;
            provenance: ({
                actorPrincipalId: string;
                /** @enum {string} */
                executionMode: "human" | "delegated" | "autonomous";
                grantId: string | null;
                /** @enum {string} */
                source: "web" | "mcp";
            } & {
                [key: string]: unknown;
            }) & ({
                /** @constant */
                executionMode?: "human";
                grantId?: null;
                /** @constant */
                source?: "web";
            } | {
                /** @constant */
                executionMode?: "delegated";
                grantId?: string;
                /** @constant */
                source?: "mcp";
            } | {
                /** @constant */
                executionMode?: "autonomous";
                grantId?: string;
                /** @constant */
                source?: "mcp";
            });
            startDate: string;
            startedAt: string;
            startsAt: string;
            /** @constant */
            state: "closed";
            timeZone: string;
            updatedAt: string;
            url: string;
            version: number;
            workspaceId: string;
        } & {
            [key: string]: unknown;
        }) & {
            capabilities: {
                /** @constant */
                canChangeScope: false;
                /** @constant */
                canClose: false;
                /** @constant */
                canEdit: false;
                /** @constant */
                canStart: false;
            } & {
                [key: string]: unknown;
            };
        });
        sprintScopePageSchema: {
            closingTotals?: {
                archived: number;
                canceled: number;
                canceledPoints: number;
                children: number;
                done: number;
                donePoints: number;
                pending: number;
                pendingPoints: number;
                unestimated: number;
            } | null;
            currentTotals: {
                archived: number;
                canceled: number;
                canceledPoints: number;
                children: number;
                done: number;
                donePoints: number;
                pending: number;
                pendingPoints: number;
                unestimated: number;
            };
            items: {
                current: {
                    archivedAt: string | null;
                    estimatePoints: number | null;
                    parentTaskId: string | null;
                    /** @enum {string} */
                    status: "backlog" | "todo" | "in_progress" | "done" | "canceled";
                    version: number;
                };
                enteredAt: string;
                enteredOrdinal: number;
                entry: {
                    archivedAt: string | null;
                    estimatePoints: number | null;
                    parentTaskId: string | null;
                    /** @enum {string} */
                    status: "backlog" | "todo" | "in_progress" | "done" | "canceled";
                    version: number;
                };
                exit: {
                    archivedAt: string | null;
                    estimatePoints: number | null;
                    parentTaskId: string | null;
                    /** @enum {string} */
                    status: "backlog" | "todo" | "in_progress" | "done" | "canceled";
                    version: number;
                } | null;
                exitedAt: string | null;
                exitedOrdinal: number | null;
                exitReason: ("removed" | "transferred" | "closed") | null;
                id: string;
                start: {
                    archivedAt: string | null;
                    estimatePoints: number | null;
                    parentTaskId: string | null;
                    /** @enum {string} */
                    status: "backlog" | "todo" | "in_progress" | "done" | "canceled";
                    version: number;
                } | null;
                taskId: string;
            }[];
            nextCursor: string | null;
            projectId: string;
            removed: number;
            sprintId: string;
            sprintRevision: number;
            sprintVersion: number;
            startTotals: {
                archived: number;
                canceled: number;
                canceledPoints: number;
                children: number;
                done: number;
                donePoints: number;
                pending: number;
                pendingPoints: number;
                unestimated: number;
            };
            taskRevision: number;
            total: number;
            transferred?: number;
            workspaceId: string;
        };
        sprintTransitionResultSchema: {
            current: ((({
                capabilities: {
                    canChangeScope?: boolean;
                    canClose?: boolean;
                    canEdit: boolean;
                    canStart?: boolean;
                } & {
                    [key: string]: unknown;
                };
                createdAt: string;
                creator: {
                    active: boolean;
                    /** @enum {string} */
                    kind: "human" | "agent";
                    name: string;
                    principalId: string;
                } & {
                    [key: string]: unknown;
                };
                endDateExclusive: string;
                endsAt: string;
                goal: string;
                id: string;
                name: string;
                projectId: string;
                provenance: ({
                    actorPrincipalId: string;
                    /** @enum {string} */
                    executionMode: "human" | "delegated" | "autonomous";
                    grantId: string | null;
                    /** @enum {string} */
                    source: "web" | "mcp";
                } & {
                    [key: string]: unknown;
                }) & ({
                    /** @constant */
                    executionMode?: "human";
                    grantId?: null;
                    /** @constant */
                    source?: "web";
                } | {
                    /** @constant */
                    executionMode?: "delegated";
                    grantId?: string;
                    /** @constant */
                    source?: "mcp";
                } | {
                    /** @constant */
                    executionMode?: "autonomous";
                    grantId?: string;
                    /** @constant */
                    source?: "mcp";
                });
                startDate: string;
                startsAt: string;
                /** @constant */
                state: "planned";
                timeZone: string;
                updatedAt: string;
                url: string;
                version: number;
                workspaceId: string;
            } & {
                [key: string]: unknown;
            }) & unknown) | (({
                capabilities: {
                    canChangeScope?: boolean;
                    canClose?: boolean;
                    canEdit: boolean;
                    canStart?: boolean;
                } & {
                    [key: string]: unknown;
                };
                createdAt: string;
                creator: {
                    active: boolean;
                    /** @enum {string} */
                    kind: "human" | "agent";
                    name: string;
                    principalId: string;
                } & {
                    [key: string]: unknown;
                };
                endDateExclusive: string;
                endsAt: string;
                goal: string;
                id: string;
                name: string;
                projectId: string;
                provenance: ({
                    actorPrincipalId: string;
                    /** @enum {string} */
                    executionMode: "human" | "delegated" | "autonomous";
                    grantId: string | null;
                    /** @enum {string} */
                    source: "web" | "mcp";
                } & {
                    [key: string]: unknown;
                }) & ({
                    /** @constant */
                    executionMode?: "human";
                    grantId?: null;
                    /** @constant */
                    source?: "web";
                } | {
                    /** @constant */
                    executionMode?: "delegated";
                    grantId?: string;
                    /** @constant */
                    source?: "mcp";
                } | {
                    /** @constant */
                    executionMode?: "autonomous";
                    grantId?: string;
                    /** @constant */
                    source?: "mcp";
                });
                startDate: string;
                startedAt: string;
                startsAt: string;
                /** @constant */
                state: "active";
                timeZone: string;
                updatedAt: string;
                url: string;
                version: number;
                workspaceId: string;
            } & {
                [key: string]: unknown;
            }) & unknown) | (({
                capabilities: {
                    canChangeScope?: boolean;
                    canClose?: boolean;
                    canEdit: boolean;
                    canStart?: boolean;
                } & {
                    [key: string]: unknown;
                };
                closedAt: string;
                createdAt: string;
                creator: {
                    active: boolean;
                    /** @enum {string} */
                    kind: "human" | "agent";
                    name: string;
                    principalId: string;
                } & {
                    [key: string]: unknown;
                };
                endDateExclusive: string;
                endsAt: string;
                goal: string;
                id: string;
                name: string;
                projectId: string;
                provenance: ({
                    actorPrincipalId: string;
                    /** @enum {string} */
                    executionMode: "human" | "delegated" | "autonomous";
                    grantId: string | null;
                    /** @enum {string} */
                    source: "web" | "mcp";
                } & {
                    [key: string]: unknown;
                }) & ({
                    /** @constant */
                    executionMode?: "human";
                    grantId?: null;
                    /** @constant */
                    source?: "web";
                } | {
                    /** @constant */
                    executionMode?: "delegated";
                    grantId?: string;
                    /** @constant */
                    source?: "mcp";
                } | {
                    /** @constant */
                    executionMode?: "autonomous";
                    grantId?: string;
                    /** @constant */
                    source?: "mcp";
                });
                startDate: string;
                startedAt: string;
                startsAt: string;
                /** @constant */
                state: "closed";
                timeZone: string;
                updatedAt: string;
                url: string;
                version: number;
                workspaceId: string;
            } & {
                [key: string]: unknown;
            }) & {
                capabilities: {
                    /** @constant */
                    canChangeScope: false;
                    /** @constant */
                    canClose: false;
                    /** @constant */
                    canEdit: false;
                    /** @constant */
                    canStart: false;
                } & {
                    [key: string]: unknown;
                };
            })) | {
                capabilities: {
                    canChangeScope: boolean;
                    canEstimate: boolean;
                };
                currentParticipation: {
                    id: string;
                    sprint: (({
                        capabilities: {
                            canChangeScope?: boolean;
                            canClose?: boolean;
                            canEdit: boolean;
                            canStart?: boolean;
                        } & {
                            [key: string]: unknown;
                        };
                        createdAt: string;
                        creator: {
                            active: boolean;
                            /** @enum {string} */
                            kind: "human" | "agent";
                            name: string;
                            principalId: string;
                        } & {
                            [key: string]: unknown;
                        };
                        endDateExclusive: string;
                        endsAt: string;
                        goal: string;
                        id: string;
                        name: string;
                        projectId: string;
                        provenance: ({
                            actorPrincipalId: string;
                            /** @enum {string} */
                            executionMode: "human" | "delegated" | "autonomous";
                            grantId: string | null;
                            /** @enum {string} */
                            source: "web" | "mcp";
                        } & {
                            [key: string]: unknown;
                        }) & ({
                            /** @constant */
                            executionMode?: "human";
                            grantId?: null;
                            /** @constant */
                            source?: "web";
                        } | {
                            /** @constant */
                            executionMode?: "delegated";
                            grantId?: string;
                            /** @constant */
                            source?: "mcp";
                        } | {
                            /** @constant */
                            executionMode?: "autonomous";
                            grantId?: string;
                            /** @constant */
                            source?: "mcp";
                        });
                        startDate: string;
                        startsAt: string;
                        /** @constant */
                        state: "planned";
                        timeZone: string;
                        updatedAt: string;
                        url: string;
                        version: number;
                        workspaceId: string;
                    } & {
                        [key: string]: unknown;
                    }) & unknown) | (({
                        capabilities: {
                            canChangeScope?: boolean;
                            canClose?: boolean;
                            canEdit: boolean;
                            canStart?: boolean;
                        } & {
                            [key: string]: unknown;
                        };
                        createdAt: string;
                        creator: {
                            active: boolean;
                            /** @enum {string} */
                            kind: "human" | "agent";
                            name: string;
                            principalId: string;
                        } & {
                            [key: string]: unknown;
                        };
                        endDateExclusive: string;
                        endsAt: string;
                        goal: string;
                        id: string;
                        name: string;
                        projectId: string;
                        provenance: ({
                            actorPrincipalId: string;
                            /** @enum {string} */
                            executionMode: "human" | "delegated" | "autonomous";
                            grantId: string | null;
                            /** @enum {string} */
                            source: "web" | "mcp";
                        } & {
                            [key: string]: unknown;
                        }) & ({
                            /** @constant */
                            executionMode?: "human";
                            grantId?: null;
                            /** @constant */
                            source?: "web";
                        } | {
                            /** @constant */
                            executionMode?: "delegated";
                            grantId?: string;
                            /** @constant */
                            source?: "mcp";
                        } | {
                            /** @constant */
                            executionMode?: "autonomous";
                            grantId?: string;
                            /** @constant */
                            source?: "mcp";
                        });
                        startDate: string;
                        startedAt: string;
                        startsAt: string;
                        /** @constant */
                        state: "active";
                        timeZone: string;
                        updatedAt: string;
                        url: string;
                        version: number;
                        workspaceId: string;
                    } & {
                        [key: string]: unknown;
                    }) & unknown) | (({
                        capabilities: {
                            canChangeScope?: boolean;
                            canClose?: boolean;
                            canEdit: boolean;
                            canStart?: boolean;
                        } & {
                            [key: string]: unknown;
                        };
                        closedAt: string;
                        createdAt: string;
                        creator: {
                            active: boolean;
                            /** @enum {string} */
                            kind: "human" | "agent";
                            name: string;
                            principalId: string;
                        } & {
                            [key: string]: unknown;
                        };
                        endDateExclusive: string;
                        endsAt: string;
                        goal: string;
                        id: string;
                        name: string;
                        projectId: string;
                        provenance: ({
                            actorPrincipalId: string;
                            /** @enum {string} */
                            executionMode: "human" | "delegated" | "autonomous";
                            grantId: string | null;
                            /** @enum {string} */
                            source: "web" | "mcp";
                        } & {
                            [key: string]: unknown;
                        }) & ({
                            /** @constant */
                            executionMode?: "human";
                            grantId?: null;
                            /** @constant */
                            source?: "web";
                        } | {
                            /** @constant */
                            executionMode?: "delegated";
                            grantId?: string;
                            /** @constant */
                            source?: "mcp";
                        } | {
                            /** @constant */
                            executionMode?: "autonomous";
                            grantId?: string;
                            /** @constant */
                            source?: "mcp";
                        });
                        startDate: string;
                        startedAt: string;
                        startsAt: string;
                        /** @constant */
                        state: "closed";
                        timeZone: string;
                        updatedAt: string;
                        url: string;
                        version: number;
                        workspaceId: string;
                    } & {
                        [key: string]: unknown;
                    }) & {
                        capabilities: {
                            /** @constant */
                            canChangeScope: false;
                            /** @constant */
                            canClose: false;
                            /** @constant */
                            canEdit: false;
                            /** @constant */
                            canStart: false;
                        } & {
                            [key: string]: unknown;
                        };
                    });
                } | null;
                projectId: string;
                snapshot: {
                    archivedAt: string | null;
                    estimatePoints: number | null;
                    parentTaskId: string | null;
                    /** @enum {string} */
                    status: "backlog" | "todo" | "in_progress" | "done" | "canceled";
                    version: number;
                };
                sprintRevision: number;
                taskId: string;
                taskRevision: number;
                workspaceId: string;
            };
            operation: {
                activityId: string;
                enteredVisitId: string | null;
                exitedVisitId: string | null;
                sprintId: string | null;
                /** @enum {string} */
                type: "start-sprint" | "set-task-sprint";
            };
        } & ({
            current: (({
                capabilities: {
                    canChangeScope?: boolean;
                    canClose?: boolean;
                    canEdit: boolean;
                    canStart?: boolean;
                } & {
                    [key: string]: unknown;
                };
                createdAt: string;
                creator: {
                    active: boolean;
                    /** @enum {string} */
                    kind: "human" | "agent";
                    name: string;
                    principalId: string;
                } & {
                    [key: string]: unknown;
                };
                endDateExclusive: string;
                endsAt: string;
                goal: string;
                id: string;
                name: string;
                projectId: string;
                provenance: ({
                    actorPrincipalId: string;
                    /** @enum {string} */
                    executionMode: "human" | "delegated" | "autonomous";
                    grantId: string | null;
                    /** @enum {string} */
                    source: "web" | "mcp";
                } & {
                    [key: string]: unknown;
                }) & ({
                    /** @constant */
                    executionMode?: "human";
                    grantId?: null;
                    /** @constant */
                    source?: "web";
                } | {
                    /** @constant */
                    executionMode?: "delegated";
                    grantId?: string;
                    /** @constant */
                    source?: "mcp";
                } | {
                    /** @constant */
                    executionMode?: "autonomous";
                    grantId?: string;
                    /** @constant */
                    source?: "mcp";
                });
                startDate: string;
                startedAt: string;
                startsAt: string;
                /** @constant */
                state: "active";
                timeZone: string;
                updatedAt: string;
                url: string;
                version: number;
                workspaceId: string;
            } & {
                [key: string]: unknown;
            }) & unknown) | (({
                capabilities: {
                    canChangeScope?: boolean;
                    canClose?: boolean;
                    canEdit: boolean;
                    canStart?: boolean;
                } & {
                    [key: string]: unknown;
                };
                closedAt: string;
                createdAt: string;
                creator: {
                    active: boolean;
                    /** @enum {string} */
                    kind: "human" | "agent";
                    name: string;
                    principalId: string;
                } & {
                    [key: string]: unknown;
                };
                endDateExclusive: string;
                endsAt: string;
                goal: string;
                id: string;
                name: string;
                projectId: string;
                provenance: ({
                    actorPrincipalId: string;
                    /** @enum {string} */
                    executionMode: "human" | "delegated" | "autonomous";
                    grantId: string | null;
                    /** @enum {string} */
                    source: "web" | "mcp";
                } & {
                    [key: string]: unknown;
                }) & ({
                    /** @constant */
                    executionMode?: "human";
                    grantId?: null;
                    /** @constant */
                    source?: "web";
                } | {
                    /** @constant */
                    executionMode?: "delegated";
                    grantId?: string;
                    /** @constant */
                    source?: "mcp";
                } | {
                    /** @constant */
                    executionMode?: "autonomous";
                    grantId?: string;
                    /** @constant */
                    source?: "mcp";
                });
                startDate: string;
                startedAt: string;
                startsAt: string;
                /** @constant */
                state: "closed";
                timeZone: string;
                updatedAt: string;
                url: string;
                version: number;
                workspaceId: string;
            } & {
                [key: string]: unknown;
            }) & {
                capabilities: {
                    /** @constant */
                    canChangeScope: false;
                    /** @constant */
                    canClose: false;
                    /** @constant */
                    canEdit: false;
                    /** @constant */
                    canStart: false;
                } & {
                    [key: string]: unknown;
                };
            });
            operation: {
                activityId: string;
                enteredVisitId: null;
                exitedVisitId: null;
                sprintId: string;
                /** @constant */
                type: "start-sprint";
            };
        } | {
            current: {
                capabilities: {
                    canChangeScope: boolean;
                    canEstimate: boolean;
                };
                currentParticipation: {
                    id: string;
                    sprint: (({
                        capabilities: {
                            canChangeScope?: boolean;
                            canClose?: boolean;
                            canEdit: boolean;
                            canStart?: boolean;
                        } & {
                            [key: string]: unknown;
                        };
                        createdAt: string;
                        creator: {
                            active: boolean;
                            /** @enum {string} */
                            kind: "human" | "agent";
                            name: string;
                            principalId: string;
                        } & {
                            [key: string]: unknown;
                        };
                        endDateExclusive: string;
                        endsAt: string;
                        goal: string;
                        id: string;
                        name: string;
                        projectId: string;
                        provenance: ({
                            actorPrincipalId: string;
                            /** @enum {string} */
                            executionMode: "human" | "delegated" | "autonomous";
                            grantId: string | null;
                            /** @enum {string} */
                            source: "web" | "mcp";
                        } & {
                            [key: string]: unknown;
                        }) & ({
                            /** @constant */
                            executionMode?: "human";
                            grantId?: null;
                            /** @constant */
                            source?: "web";
                        } | {
                            /** @constant */
                            executionMode?: "delegated";
                            grantId?: string;
                            /** @constant */
                            source?: "mcp";
                        } | {
                            /** @constant */
                            executionMode?: "autonomous";
                            grantId?: string;
                            /** @constant */
                            source?: "mcp";
                        });
                        startDate: string;
                        startsAt: string;
                        /** @constant */
                        state: "planned";
                        timeZone: string;
                        updatedAt: string;
                        url: string;
                        version: number;
                        workspaceId: string;
                    } & {
                        [key: string]: unknown;
                    }) & unknown) | (({
                        capabilities: {
                            canChangeScope?: boolean;
                            canClose?: boolean;
                            canEdit: boolean;
                            canStart?: boolean;
                        } & {
                            [key: string]: unknown;
                        };
                        createdAt: string;
                        creator: {
                            active: boolean;
                            /** @enum {string} */
                            kind: "human" | "agent";
                            name: string;
                            principalId: string;
                        } & {
                            [key: string]: unknown;
                        };
                        endDateExclusive: string;
                        endsAt: string;
                        goal: string;
                        id: string;
                        name: string;
                        projectId: string;
                        provenance: ({
                            actorPrincipalId: string;
                            /** @enum {string} */
                            executionMode: "human" | "delegated" | "autonomous";
                            grantId: string | null;
                            /** @enum {string} */
                            source: "web" | "mcp";
                        } & {
                            [key: string]: unknown;
                        }) & ({
                            /** @constant */
                            executionMode?: "human";
                            grantId?: null;
                            /** @constant */
                            source?: "web";
                        } | {
                            /** @constant */
                            executionMode?: "delegated";
                            grantId?: string;
                            /** @constant */
                            source?: "mcp";
                        } | {
                            /** @constant */
                            executionMode?: "autonomous";
                            grantId?: string;
                            /** @constant */
                            source?: "mcp";
                        });
                        startDate: string;
                        startedAt: string;
                        startsAt: string;
                        /** @constant */
                        state: "active";
                        timeZone: string;
                        updatedAt: string;
                        url: string;
                        version: number;
                        workspaceId: string;
                    } & {
                        [key: string]: unknown;
                    }) & unknown) | (({
                        capabilities: {
                            canChangeScope?: boolean;
                            canClose?: boolean;
                            canEdit: boolean;
                            canStart?: boolean;
                        } & {
                            [key: string]: unknown;
                        };
                        closedAt: string;
                        createdAt: string;
                        creator: {
                            active: boolean;
                            /** @enum {string} */
                            kind: "human" | "agent";
                            name: string;
                            principalId: string;
                        } & {
                            [key: string]: unknown;
                        };
                        endDateExclusive: string;
                        endsAt: string;
                        goal: string;
                        id: string;
                        name: string;
                        projectId: string;
                        provenance: ({
                            actorPrincipalId: string;
                            /** @enum {string} */
                            executionMode: "human" | "delegated" | "autonomous";
                            grantId: string | null;
                            /** @enum {string} */
                            source: "web" | "mcp";
                        } & {
                            [key: string]: unknown;
                        }) & ({
                            /** @constant */
                            executionMode?: "human";
                            grantId?: null;
                            /** @constant */
                            source?: "web";
                        } | {
                            /** @constant */
                            executionMode?: "delegated";
                            grantId?: string;
                            /** @constant */
                            source?: "mcp";
                        } | {
                            /** @constant */
                            executionMode?: "autonomous";
                            grantId?: string;
                            /** @constant */
                            source?: "mcp";
                        });
                        startDate: string;
                        startedAt: string;
                        startsAt: string;
                        /** @constant */
                        state: "closed";
                        timeZone: string;
                        updatedAt: string;
                        url: string;
                        version: number;
                        workspaceId: string;
                    } & {
                        [key: string]: unknown;
                    }) & {
                        capabilities: {
                            /** @constant */
                            canChangeScope: false;
                            /** @constant */
                            canClose: false;
                            /** @constant */
                            canEdit: false;
                            /** @constant */
                            canStart: false;
                        } & {
                            [key: string]: unknown;
                        };
                    });
                } | null;
                projectId: string;
                snapshot: {
                    archivedAt: string | null;
                    estimatePoints: number | null;
                    parentTaskId: string | null;
                    /** @enum {string} */
                    status: "backlog" | "todo" | "in_progress" | "done" | "canceled";
                    version: number;
                };
                sprintRevision: number;
                taskId: string;
                taskRevision: number;
                workspaceId: string;
            };
            operation: {
                activityId: string;
                enteredVisitId: string;
                exitedVisitId: string | null;
                sprintId: string;
                /** @constant */
                type: "set-task-sprint";
            } | {
                activityId: string;
                enteredVisitId: null;
                exitedVisitId: string;
                sprintId: string;
                /** @constant */
                type: "set-task-sprint";
            };
        });
        startSprintInputSchema: {
            expectedProjectVersion: number;
            expectedTaskRevision: number;
            expectedVersion: number;
        };
        taskChecklistSchema: {
            capabilities: {
                canCreate: boolean;
                canEdit: boolean;
            };
            items: {
                capabilities: {
                    canEdit: boolean;
                    canMoveDown: boolean;
                    canMoveUp: boolean;
                    canRemove: boolean;
                };
                completed: boolean;
                id: string;
                moveDownBeforeItemId: string | null;
                moveUpBeforeItemId: string | null;
                position: number;
                text: string;
                version: number;
            }[];
            nextCursor: string | null;
            projectId: string;
            revision: number;
            taskId: string;
            total: number;
            workspaceId: string;
        };
        taskCommentReviewSchema: {
            comment: {
                author: {
                    active: boolean;
                    /** @enum {string} */
                    kind: "human" | "agent";
                    name: string;
                    principalId: string;
                } & {
                    [key: string]: unknown;
                };
                body: string;
                capabilities: {
                    canEdit: boolean;
                };
                createdAt: string;
                editedAt: string | null;
                id: string;
                provenance: {
                    actorPrincipalId: string;
                    /** @enum {string} */
                    executionMode: "human" | "delegated" | "autonomous";
                    grantId: string | null;
                    /** @enum {string} */
                    source: "web" | "mcp";
                } & ({
                    /** @constant */
                    executionMode?: "human";
                    grantId?: null;
                    /** @constant */
                    source?: "web";
                } | {
                    /** @constant */
                    executionMode?: "delegated";
                    grantId?: string;
                    /** @constant */
                    source?: "mcp";
                } | {
                    /** @constant */
                    executionMode?: "autonomous";
                    grantId?: string;
                    /** @constant */
                    source?: "mcp";
                });
                updatedAt: string;
                version: number;
            };
            task: {
                archivedAt: string | null;
                assignee: ({
                    active: boolean;
                    /** @enum {string} */
                    kind: "human" | "agent";
                    name: string;
                    principalId: string;
                } & {
                    [key: string]: unknown;
                }) | null;
                assigneePrincipalId: string | null;
                capabilities: {
                    canArchive: boolean;
                    canEdit: boolean;
                    canRestore: boolean;
                } & {
                    [key: string]: unknown;
                };
                createdAt: string;
                creator: {
                    active: boolean;
                    /** @enum {string} */
                    kind: "human" | "agent";
                    name: string;
                    principalId: string;
                } & {
                    [key: string]: unknown;
                };
                description: string;
                dueDate: string | null;
                id: string;
                key: string;
                number: number;
                orderVersion: number;
                parentTaskId: string | null;
                /** @enum {string} */
                priority: "none" | "low" | "medium" | "high" | "urgent";
                projectArchivedAt: string | null;
                projectId: string;
                projectKey: string;
                provenance: {
                    actorPrincipalId: string;
                    /** @enum {string} */
                    executionMode: "human" | "delegated" | "autonomous";
                    grantId: string | null;
                    /** @enum {string} */
                    source: "web" | "mcp";
                } & {
                    [key: string]: unknown;
                };
                /** @enum {string} */
                status: "backlog" | "todo" | "in_progress" | "done" | "canceled";
                title: string;
                /** @enum {string} */
                type: "task" | "bug" | "feature";
                updatedAt: string;
                url: string;
                version: number;
                workspaceId: string;
            } & {
                [key: string]: unknown;
            };
        };
        taskCommentsSchema: {
            capabilities: {
                canCreate: boolean;
            };
            items: {
                author: {
                    active: boolean;
                    /** @enum {string} */
                    kind: "human" | "agent";
                    name: string;
                    principalId: string;
                } & {
                    [key: string]: unknown;
                };
                body: string;
                capabilities: {
                    canEdit: boolean;
                };
                createdAt: string;
                editedAt: string | null;
                id: string;
                provenance: {
                    actorPrincipalId: string;
                    /** @enum {string} */
                    executionMode: "human" | "delegated" | "autonomous";
                    grantId: string | null;
                    /** @enum {string} */
                    source: "web" | "mcp";
                } & ({
                    /** @constant */
                    executionMode?: "human";
                    grantId?: null;
                    /** @constant */
                    source?: "web";
                } | {
                    /** @constant */
                    executionMode?: "delegated";
                    grantId?: string;
                    /** @constant */
                    source?: "mcp";
                } | {
                    /** @constant */
                    executionMode?: "autonomous";
                    grantId?: string;
                    /** @constant */
                    source?: "mcp";
                });
                updatedAt: string;
                version: number;
            }[];
            nextCursor: string | null;
            projectId: string;
            revision: number;
            taskId: string;
            total: number;
            workspaceId: string;
        };
        taskDiscoveryPageSchema: {
            items: ({
                archivedAt: string | null;
                assignee: ({
                    active: boolean;
                    /** @enum {string} */
                    kind: "human" | "agent";
                    name: string;
                    principalId: string;
                } & {
                    [key: string]: unknown;
                }) | null;
                assigneePrincipalId: string | null;
                capabilities: {
                    canArchive: boolean;
                    canEdit: boolean;
                    canRestore: boolean;
                } & {
                    [key: string]: unknown;
                };
                createdAt: string;
                creator: {
                    active: boolean;
                    /** @enum {string} */
                    kind: "human" | "agent";
                    name: string;
                    principalId: string;
                } & {
                    [key: string]: unknown;
                };
                dueDate: string | null;
                id: string;
                key: string;
                number: number;
                orderVersion: number;
                parentTaskId: string | null;
                /** @enum {string} */
                priority: "none" | "low" | "medium" | "high" | "urgent";
                projectArchivedAt: string | null;
                projectId: string;
                projectKey: string;
                projectName: string;
                provenance: {
                    actorPrincipalId: string;
                    /** @enum {string} */
                    executionMode: "human" | "delegated" | "autonomous";
                    grantId: string | null;
                    /** @enum {string} */
                    source: "web" | "mcp";
                } & {
                    [key: string]: unknown;
                };
                /** @enum {string} */
                status: "backlog" | "todo" | "in_progress" | "done" | "canceled";
                title: string;
                /** @enum {string} */
                type: "task" | "bug" | "feature";
                updatedAt: string;
                url: string;
                version: number;
                workspaceId: string;
            } & {
                [key: string]: unknown;
            })[];
            nextCursor: string | null;
            principalId: string;
            query: {
                filters: {
                    assignee?: string;
                    /** @enum {string} */
                    priority?: "none" | "low" | "medium" | "high" | "urgent";
                    /** @enum {string} */
                    status?: "backlog" | "todo" | "in_progress" | "done" | "canceled";
                };
                projectId?: string;
                q: string;
                /** @enum {string} */
                scope: "mine" | "search";
                /** @enum {string} */
                view: "active" | "archived";
            };
            revision: string;
            total: number;
            workspaceId: string;
        } & {
            [key: string]: unknown;
        };
        taskHistorySchema: {
            items: {
                /** @enum {string} */
                action: "create-task" | "edit-task" | "archive-task" | "restore-task" | "move-task" | "set-task-parent" | "add-checklist-item" | "edit-checklist-item" | "move-checklist-item" | "remove-checklist-item" | "add-comment" | "edit-comment";
                actor: ({
                    active: boolean;
                    /** @enum {string} */
                    kind: "human" | "agent";
                    name: string;
                    principalId: string;
                } & {
                    [key: string]: unknown;
                }) | {
                    active: boolean;
                    /** @constant */
                    kind: "system";
                    name: string;
                    principalId: string;
                };
                changes: ({
                    after: string | null;
                    before: string | null;
                    /** @enum {string} */
                    field: "status" | "type" | "priority" | "dueDate";
                } & ({
                    /** @enum {string} */
                    after?: "backlog" | "todo" | "in_progress" | "done" | "canceled";
                    /** @enum {string} */
                    before?: "backlog" | "todo" | "in_progress" | "done" | "canceled";
                    /** @constant */
                    field?: "status";
                } | {
                    /** @enum {string} */
                    after?: "task" | "bug" | "feature";
                    /** @enum {string} */
                    before?: "task" | "bug" | "feature";
                    /** @constant */
                    field?: "type";
                } | {
                    /** @enum {string} */
                    after?: "none" | "low" | "medium" | "high" | "urgent";
                    /** @enum {string} */
                    before?: "none" | "low" | "medium" | "high" | "urgent";
                    /** @constant */
                    field?: "priority";
                } | {
                    after?: string | null;
                    before?: string | null;
                    /** @constant */
                    field?: "dueDate";
                }))[];
                createdAt: string;
                entityVersion: number;
                fields: ("title" | "description" | "type" | "priority" | "status" | "assigneePrincipalId" | "dueDate" | "rank" | "parentTaskId" | "checklist" | "comment")[];
                id: string;
                provenance: {
                    actorPrincipalId: string;
                    /** @enum {string} */
                    executionMode: "human" | "delegated" | "autonomous" | "system";
                    grantId: string | null;
                    /** @enum {string} */
                    source: "web" | "mcp" | "internal";
                } & ({
                    /** @constant */
                    executionMode?: "human";
                    grantId?: null;
                    /** @constant */
                    source?: "web";
                } | {
                    /** @constant */
                    executionMode?: "delegated";
                    grantId?: string;
                    /** @constant */
                    source?: "mcp";
                } | {
                    /** @constant */
                    executionMode?: "autonomous";
                    grantId?: string;
                    /** @constant */
                    source?: "mcp";
                } | {
                    /** @constant */
                    executionMode?: "system";
                    grantId?: null;
                    /** @constant */
                    source?: "internal";
                });
            }[];
            nextCursor: string | null;
            projectId: string;
            revision: number;
            taskId: string;
            total: number;
            workspaceId: string;
        };
        taskInvalidationSchema: {
            /** @constant */
            type: "reset";
        } | {
            /** @constant */
            type: "heartbeat";
        } | {
            /** @enum {string} */
            reason: "signed-out" | "forbidden";
            /** @constant */
            type: "denied";
        } | {
            /** @enum {string} */
            entity: "task" | "project";
            id: string;
            projectId: string;
            /** @constant */
            type: "invalidate";
            version: number;
        };
        taskPageSchema: {
            capabilities: {
                canCreate: boolean;
                canCreatePrivate?: boolean;
            } & {
                [key: string]: unknown;
            };
            columnCounts: {
                backlog: number;
                canceled: number;
                done: number;
                in_progress: number;
                todo: number;
            } & {
                [key: string]: unknown;
            };
            items: ({
                archivedAt: string | null;
                assignee: ({
                    active: boolean;
                    /** @enum {string} */
                    kind: "human" | "agent";
                    name: string;
                    principalId: string;
                } & {
                    [key: string]: unknown;
                }) | null;
                assigneePrincipalId: string | null;
                capabilities: {
                    canArchive: boolean;
                    canEdit: boolean;
                    canRestore: boolean;
                } & {
                    [key: string]: unknown;
                };
                createdAt: string;
                creator: {
                    active: boolean;
                    /** @enum {string} */
                    kind: "human" | "agent";
                    name: string;
                    principalId: string;
                } & {
                    [key: string]: unknown;
                };
                description: string;
                dueDate: string | null;
                id: string;
                key: string;
                number: number;
                orderVersion: number;
                parentTaskId: string | null;
                /** @enum {string} */
                priority: "none" | "low" | "medium" | "high" | "urgent";
                projectArchivedAt: string | null;
                projectId: string;
                projectKey: string;
                provenance: {
                    actorPrincipalId: string;
                    /** @enum {string} */
                    executionMode: "human" | "delegated" | "autonomous";
                    grantId: string | null;
                    /** @enum {string} */
                    source: "web" | "mcp";
                } & {
                    [key: string]: unknown;
                };
                /** @enum {string} */
                status: "backlog" | "todo" | "in_progress" | "done" | "canceled";
                title: string;
                /** @enum {string} */
                type: "task" | "bug" | "feature";
                updatedAt: string;
                url: string;
                version: number;
                workspaceId: string;
            } & {
                [key: string]: unknown;
            })[];
            nextCursor: string | null;
            orderVersion: number;
            selectedAssignee: ({
                active: boolean;
                /** @enum {string} */
                kind: "human" | "agent";
                name: string;
                principalId: string;
            } & {
                [key: string]: unknown;
            }) | null;
            total: number;
        } & {
            [key: string]: unknown;
        };
        taskParentCandidatesSchema: {
            capabilities: {
                canSelect: boolean;
            };
            items: {
                archivedAt: string | null;
                id: string;
                key: string;
                /** @enum {string} */
                status: "backlog" | "todo" | "in_progress" | "done" | "canceled";
                title: string;
                url: string;
                version: number;
            }[];
            nextCursor: string | null;
            projectId: string;
            revision: number;
            taskId: string;
            total: number;
            workspaceId: string;
        };
        taskPlanningSchema: {
            capabilities: {
                canChangeScope: boolean;
                canEstimate: boolean;
            };
            currentParticipation: {
                id: string;
                sprint: (({
                    capabilities: {
                        canChangeScope?: boolean;
                        canClose?: boolean;
                        canEdit: boolean;
                        canStart?: boolean;
                    } & {
                        [key: string]: unknown;
                    };
                    createdAt: string;
                    creator: {
                        active: boolean;
                        /** @enum {string} */
                        kind: "human" | "agent";
                        name: string;
                        principalId: string;
                    } & {
                        [key: string]: unknown;
                    };
                    endDateExclusive: string;
                    endsAt: string;
                    goal: string;
                    id: string;
                    name: string;
                    projectId: string;
                    provenance: ({
                        actorPrincipalId: string;
                        /** @enum {string} */
                        executionMode: "human" | "delegated" | "autonomous";
                        grantId: string | null;
                        /** @enum {string} */
                        source: "web" | "mcp";
                    } & {
                        [key: string]: unknown;
                    }) & ({
                        /** @constant */
                        executionMode?: "human";
                        grantId?: null;
                        /** @constant */
                        source?: "web";
                    } | {
                        /** @constant */
                        executionMode?: "delegated";
                        grantId?: string;
                        /** @constant */
                        source?: "mcp";
                    } | {
                        /** @constant */
                        executionMode?: "autonomous";
                        grantId?: string;
                        /** @constant */
                        source?: "mcp";
                    });
                    startDate: string;
                    startsAt: string;
                    /** @constant */
                    state: "planned";
                    timeZone: string;
                    updatedAt: string;
                    url: string;
                    version: number;
                    workspaceId: string;
                } & {
                    [key: string]: unknown;
                }) & unknown) | (({
                    capabilities: {
                        canChangeScope?: boolean;
                        canClose?: boolean;
                        canEdit: boolean;
                        canStart?: boolean;
                    } & {
                        [key: string]: unknown;
                    };
                    createdAt: string;
                    creator: {
                        active: boolean;
                        /** @enum {string} */
                        kind: "human" | "agent";
                        name: string;
                        principalId: string;
                    } & {
                        [key: string]: unknown;
                    };
                    endDateExclusive: string;
                    endsAt: string;
                    goal: string;
                    id: string;
                    name: string;
                    projectId: string;
                    provenance: ({
                        actorPrincipalId: string;
                        /** @enum {string} */
                        executionMode: "human" | "delegated" | "autonomous";
                        grantId: string | null;
                        /** @enum {string} */
                        source: "web" | "mcp";
                    } & {
                        [key: string]: unknown;
                    }) & ({
                        /** @constant */
                        executionMode?: "human";
                        grantId?: null;
                        /** @constant */
                        source?: "web";
                    } | {
                        /** @constant */
                        executionMode?: "delegated";
                        grantId?: string;
                        /** @constant */
                        source?: "mcp";
                    } | {
                        /** @constant */
                        executionMode?: "autonomous";
                        grantId?: string;
                        /** @constant */
                        source?: "mcp";
                    });
                    startDate: string;
                    startedAt: string;
                    startsAt: string;
                    /** @constant */
                    state: "active";
                    timeZone: string;
                    updatedAt: string;
                    url: string;
                    version: number;
                    workspaceId: string;
                } & {
                    [key: string]: unknown;
                }) & unknown) | (({
                    capabilities: {
                        canChangeScope?: boolean;
                        canClose?: boolean;
                        canEdit: boolean;
                        canStart?: boolean;
                    } & {
                        [key: string]: unknown;
                    };
                    closedAt: string;
                    createdAt: string;
                    creator: {
                        active: boolean;
                        /** @enum {string} */
                        kind: "human" | "agent";
                        name: string;
                        principalId: string;
                    } & {
                        [key: string]: unknown;
                    };
                    endDateExclusive: string;
                    endsAt: string;
                    goal: string;
                    id: string;
                    name: string;
                    projectId: string;
                    provenance: ({
                        actorPrincipalId: string;
                        /** @enum {string} */
                        executionMode: "human" | "delegated" | "autonomous";
                        grantId: string | null;
                        /** @enum {string} */
                        source: "web" | "mcp";
                    } & {
                        [key: string]: unknown;
                    }) & ({
                        /** @constant */
                        executionMode?: "human";
                        grantId?: null;
                        /** @constant */
                        source?: "web";
                    } | {
                        /** @constant */
                        executionMode?: "delegated";
                        grantId?: string;
                        /** @constant */
                        source?: "mcp";
                    } | {
                        /** @constant */
                        executionMode?: "autonomous";
                        grantId?: string;
                        /** @constant */
                        source?: "mcp";
                    });
                    startDate: string;
                    startedAt: string;
                    startsAt: string;
                    /** @constant */
                    state: "closed";
                    timeZone: string;
                    updatedAt: string;
                    url: string;
                    version: number;
                    workspaceId: string;
                } & {
                    [key: string]: unknown;
                }) & {
                    capabilities: {
                        /** @constant */
                        canChangeScope: false;
                        /** @constant */
                        canClose: false;
                        /** @constant */
                        canEdit: false;
                        /** @constant */
                        canStart: false;
                    } & {
                        [key: string]: unknown;
                    };
                });
            } | null;
            projectId: string;
            snapshot: {
                archivedAt: string | null;
                estimatePoints: number | null;
                parentTaskId: string | null;
                /** @enum {string} */
                status: "backlog" | "todo" | "in_progress" | "done" | "canceled";
                version: number;
            };
            sprintRevision: number;
            taskId: string;
            taskRevision: number;
            workspaceId: string;
        };
        taskRelationsSchema: {
            archivedOpen: number;
            capabilities: {
                canCreate: boolean;
                canLink: boolean;
                canUnlink: boolean;
            };
            items: {
                archivedAt: string | null;
                id: string;
                key: string;
                /** @enum {string} */
                status: "backlog" | "todo" | "in_progress" | "done" | "canceled";
                title: string;
                url: string;
                version: number;
            }[];
            nextCursor: string | null;
            open: number;
            parent: {
                archivedAt: string | null;
                id: string;
                key: string;
                /** @enum {string} */
                status: "backlog" | "todo" | "in_progress" | "done" | "canceled";
                title: string;
                url: string;
                version: number;
            } | null;
            projectId: string;
            revision: number;
            taskId: string;
            total: number;
            workspaceId: string;
        };
        taskSchema: {
            archivedAt: string | null;
            assignee: ({
                active: boolean;
                /** @enum {string} */
                kind: "human" | "agent";
                name: string;
                principalId: string;
            } & {
                [key: string]: unknown;
            }) | null;
            assigneePrincipalId: string | null;
            capabilities: {
                canArchive: boolean;
                canEdit: boolean;
                canRestore: boolean;
            } & {
                [key: string]: unknown;
            };
            createdAt: string;
            creator: {
                active: boolean;
                /** @enum {string} */
                kind: "human" | "agent";
                name: string;
                principalId: string;
            } & {
                [key: string]: unknown;
            };
            description: string;
            dueDate: string | null;
            id: string;
            key: string;
            number: number;
            orderVersion: number;
            parentTaskId: string | null;
            /** @enum {string} */
            priority: "none" | "low" | "medium" | "high" | "urgent";
            projectArchivedAt: string | null;
            projectId: string;
            projectKey: string;
            provenance: {
                actorPrincipalId: string;
                /** @enum {string} */
                executionMode: "human" | "delegated" | "autonomous";
                grantId: string | null;
                /** @enum {string} */
                source: "web" | "mcp";
            } & {
                [key: string]: unknown;
            };
            /** @enum {string} */
            status: "backlog" | "todo" | "in_progress" | "done" | "canceled";
            title: string;
            /** @enum {string} */
            type: "task" | "bug" | "feature";
            updatedAt: string;
            url: string;
            version: number;
            workspaceId: string;
        } & {
            [key: string]: unknown;
        };
        updateWorkspaceMemberInputSchema: {
            /** @enum {string} */
            role?: "admin" | "member" | "viewer";
            /** @enum {string} */
            state?: "active" | "suspended" | "revoked";
            version: number;
        } & (unknown | unknown);
        workspaceInvitationPageSchema: {
            items: ({
                createdAt: string;
                expiresAt: string;
                id: string;
                issuerPrincipalId: string;
                recipientEmail: string;
                /** @enum {string} */
                role: "admin" | "member" | "viewer";
                /** @enum {string} */
                state: "pending" | "expired" | "accepted" | "revoked";
                workspaceId: string;
            } & {
                [key: string]: unknown;
            })[];
            nextCursor: string | null;
            total: number;
        } & {
            [key: string]: unknown;
        };
        workspaceInvitationSchema: {
            createdAt: string;
            expiresAt: string;
            id: string;
            issuerPrincipalId: string;
            recipientEmail: string;
            /** @enum {string} */
            role: "admin" | "member" | "viewer";
            /** @enum {string} */
            state: "pending" | "expired" | "accepted" | "revoked";
            workspaceId: string;
        } & {
            [key: string]: unknown;
        };
        workspaceMemberPageSchema: {
            items: ({
                custodianPrincipalId: string | null;
                /** @enum {string} */
                kind: "human" | "agent";
                name: string;
                principalId: string;
                /** @enum {string} */
                principalState: "active" | "suspended" | "revoked";
                /** @enum {string} */
                role: "owner" | "admin" | "member" | "viewer";
                /** @enum {string} */
                state: "active" | "suspended" | "revoked";
                version: number;
            } & {
                [key: string]: unknown;
            })[];
            nextCursor: string | null;
            total: number;
        } & {
            [key: string]: unknown;
        };
        workspaceMemberSchema: {
            custodianPrincipalId: string | null;
            /** @enum {string} */
            kind: "human" | "agent";
            name: string;
            principalId: string;
            /** @enum {string} */
            principalState: "active" | "suspended" | "revoked";
            /** @enum {string} */
            role: "owner" | "admin" | "member" | "viewer";
            /** @enum {string} */
            state: "active" | "suspended" | "revoked";
            version: number;
        } & {
            [key: string]: unknown;
        };
        workspaceSummaryPageSchema: {
            items: ({
                createdAt: string;
                id: string;
                name: string;
                ownerPrincipalId: string;
                /** @enum {string} */
                role: "owner" | "admin" | "member" | "viewer";
            } & {
                [key: string]: unknown;
            })[];
            nextCursor: string | null;
            total: number;
        } & {
            [key: string]: unknown;
        };
        workspaceSummarySchema: {
            createdAt: string;
            id: string;
            name: string;
            ownerPrincipalId: string;
            /** @enum {string} */
            role: "owner" | "admin" | "member" | "viewer";
        } & {
            [key: string]: unknown;
        };
    };
    responses: never;
    parameters: never;
    requestBodies: never;
    headers: never;
    pathItems: never;
}
export type $defs = Record<string, never>;
export interface operations {
    H01: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Existing canonical successful JSON response. */
            200: {
                headers: {
                    "Cache-Control"?: "no-store";
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["healthResponseSchema"];
                };
            };
            /** @description Framework or unexpected error; response body explicitly unmodeled. An omitted schema does not mean an empty body. */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    H02: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Existing canonical successful JSON response. */
            200: {
                headers: {
                    "Cache-Control"?: "no-store";
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["identityConfigurationSchema"];
                };
            };
            /** @description Framework or unexpected error; response body explicitly unmodeled. An omitted schema does not mean an empty body. */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    H03: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Existing canonical successful JSON response. */
            200: {
                headers: {
                    "Cache-Control"?: "no-store";
                    /** @description Conditional session renewal/clearing; preserve separate header values. */
                    "Set-Cookie"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["identitySessionSchema"];
                };
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Framework or unexpected error; response body explicitly unmodeled. An omitted schema does not mean an empty body. */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    H55: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Existing canonical successful JSON response. */
            200: {
                headers: {
                    "Cache-Control"?: "no-store";
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["readinessResponseSchema"];
                };
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Framework or unexpected error; response body explicitly unmodeled. An omitted schema does not mean an empty body. */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    H64: {
        parameters: {
            query?: never;
            header: {
                /** @description UUID v4, checked in the existing receipt stage after current authority; explicit same-key/body retry only. */
                "Idempotency-Key": string;
                /** @description Exact configured public origin; never selected by the request. */
                Origin: string;
                "Sec-Fetch-Site"?: "same-origin" | "none";
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["acceptWorkspaceInvitationInputSchema"];
            };
        };
        responses: {
            /** @description Existing canonical successful JSON response. */
            201: {
                headers: {
                    "Cache-Control"?: "no-store";
                    /** @description Conditional session renewal/clearing; preserve separate header values. */
                    "Set-Cookie"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["workspaceSummarySchema"];
                };
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Framework or unexpected error; response body explicitly unmodeled. An omitted schema does not mean an empty body. */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    H56: {
        parameters: {
            query?: {
                cursor?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Existing canonical successful JSON response. */
            200: {
                headers: {
                    "Cache-Control"?: "no-store";
                    /** @description Conditional session renewal/clearing; preserve separate header values. */
                    "Set-Cookie"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["workspaceSummaryPageSchema"];
                };
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Framework or unexpected error; response body explicitly unmodeled. An omitted schema does not mean an empty body. */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    H57: {
        parameters: {
            query?: never;
            header: {
                /** @description UUID v4, checked in the existing receipt stage after current authority; explicit same-key/body retry only. */
                "Idempotency-Key": string;
                /** @description Exact configured public origin; never selected by the request. */
                Origin: string;
                "Sec-Fetch-Site"?: "same-origin" | "none";
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["createWorkspaceInputSchema"];
            };
        };
        responses: {
            /** @description Existing canonical successful JSON response. */
            201: {
                headers: {
                    "Cache-Control"?: "no-store";
                    /** @description Conditional session renewal/clearing; preserve separate header values. */
                    "Set-Cookie"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["workspaceSummarySchema"];
                };
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Framework or unexpected error; response body explicitly unmodeled. An omitted schema does not mean an empty body. */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    H58: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                workspaceId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Existing canonical successful JSON response. */
            200: {
                headers: {
                    "Cache-Control"?: "no-store";
                    /** @description Conditional session renewal/clearing; preserve separate header values. */
                    "Set-Cookie"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["workspaceSummarySchema"];
                };
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Framework or unexpected error; response body explicitly unmodeled. An omitted schema does not mean an empty body. */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    H65: {
        parameters: {
            query?: never;
            header: {
                /** @description UUID v4, checked in the existing receipt stage after current authority; explicit same-key/body retry only. */
                "Idempotency-Key": string;
                /** @description Exact configured public origin; never selected by the request. */
                Origin: string;
                "Sec-Fetch-Site"?: "same-origin" | "none";
            };
            path: {
                workspaceId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["registerWorkspaceAgentInputSchema"];
            };
        };
        responses: {
            /** @description Existing canonical successful JSON response. */
            201: {
                headers: {
                    "Cache-Control"?: "no-store";
                    /** @description Conditional session renewal/clearing; preserve separate header values. */
                    "Set-Cookie"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["workspaceMemberSchema"];
                };
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Framework or unexpected error; response body explicitly unmodeled. An omitted schema does not mean an empty body. */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    H66: {
        parameters: {
            query?: never;
            header: {
                /** @description UUID v4, checked in the existing receipt stage after current authority; explicit same-key/body retry only. */
                "Idempotency-Key": string;
                /** @description Exact configured public origin; never selected by the request. */
                Origin: string;
                "Sec-Fetch-Site"?: "same-origin" | "none";
            };
            path: {
                principalId: string;
                workspaceId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["manageWorkspaceAgentInputSchema"];
            };
        };
        responses: {
            /** @description Existing canonical successful JSON response. */
            201: {
                headers: {
                    "Cache-Control"?: "no-store";
                    /** @description Conditional session renewal/clearing; preserve separate header values. */
                    "Set-Cookie"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["workspaceMemberSchema"];
                };
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Framework or unexpected error; response body explicitly unmodeled. An omitted schema does not mean an empty body. */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    H50: {
        parameters: {
            query?: never;
            header?: {
                "Last-Event-ID"?: string;
                /** @description Must equal configured origin if supplied. */
                Origin?: string;
                "Sec-Fetch-Site"?: "same-origin" | "none";
            };
            path: {
                workspaceId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description SSE event:update frames, optional opaque id and JSON data; this is not a JSON HTTP response. */
            200: {
                headers: {
                    "Cache-Control"?: "no-store, no-transform";
                    /** @description Conditional session renewal/clearing; preserve separate header values. */
                    "Set-Cookie"?: string;
                    "X-Accel-Buffering"?: "no";
                    /** @description Existing server correlation header. */
                    "X-Request-Id"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "text/event-stream": string;
                };
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Framework or unexpected error; response body explicitly unmodeled. An omitted schema does not mean an empty body. */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    H04: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                workspaceId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Existing canonical successful JSON response. */
            200: {
                headers: {
                    "Cache-Control"?: "no-store";
                    /** @description Conditional session renewal/clearing; preserve separate header values. */
                    "Set-Cookie"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["executionContextResponseSchema"];
                };
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Framework or unexpected error; response body explicitly unmodeled. An omitted schema does not mean an empty body. */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    H61: {
        parameters: {
            query?: {
                cursor?: string;
            };
            header?: never;
            path: {
                workspaceId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Existing canonical successful JSON response. */
            200: {
                headers: {
                    "Cache-Control"?: "no-store";
                    /** @description Conditional session renewal/clearing; preserve separate header values. */
                    "Set-Cookie"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["workspaceInvitationPageSchema"];
                };
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Framework or unexpected error; response body explicitly unmodeled. An omitted schema does not mean an empty body. */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    H62: {
        parameters: {
            query?: never;
            header: {
                /** @description UUID v4, checked in the existing receipt stage after current authority; explicit same-key/body retry only. */
                "Idempotency-Key": string;
                /** @description Exact configured public origin; never selected by the request. */
                Origin: string;
                "Sec-Fetch-Site"?: "same-origin" | "none";
            };
            path: {
                workspaceId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["inviteWorkspaceMemberInputSchema"];
            };
        };
        responses: {
            /** @description Existing canonical successful JSON response. */
            201: {
                headers: {
                    "Cache-Control"?: "no-store";
                    /** @description Conditional session renewal/clearing; preserve separate header values. */
                    "Set-Cookie"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["createdInvitationSchema"];
                };
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Framework or unexpected error; response body explicitly unmodeled. An omitted schema does not mean an empty body. */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    H63: {
        parameters: {
            query?: never;
            header: {
                /** @description UUID v4, checked in the existing receipt stage after current authority; explicit same-key/body retry only. */
                "Idempotency-Key": string;
                /** @description Exact configured public origin; never selected by the request. */
                Origin: string;
                "Sec-Fetch-Site"?: "same-origin" | "none";
            };
            path: {
                invitationId: string;
                workspaceId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["revokeWorkspaceInvitationInputSchema"];
            };
        };
        responses: {
            /** @description Existing canonical successful JSON response. */
            201: {
                headers: {
                    "Cache-Control"?: "no-store";
                    /** @description Conditional session renewal/clearing; preserve separate header values. */
                    "Set-Cookie"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["workspaceInvitationSchema"];
                };
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Framework or unexpected error; response body explicitly unmodeled. An omitted schema does not mean an empty body. */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    H59: {
        parameters: {
            query?: {
                cursor?: string;
            };
            header?: never;
            path: {
                workspaceId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Existing canonical successful JSON response. */
            200: {
                headers: {
                    "Cache-Control"?: "no-store";
                    /** @description Conditional session renewal/clearing; preserve separate header values. */
                    "Set-Cookie"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["workspaceMemberPageSchema"];
                };
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Framework or unexpected error; response body explicitly unmodeled. An omitted schema does not mean an empty body. */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    H60: {
        parameters: {
            query?: never;
            header: {
                /** @description UUID v4, checked in the existing receipt stage after current authority; explicit same-key/body retry only. */
                "Idempotency-Key": string;
                /** @description Exact configured public origin; never selected by the request. */
                Origin: string;
                "Sec-Fetch-Site"?: "same-origin" | "none";
            };
            path: {
                principalId: string;
                workspaceId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["updateWorkspaceMemberInputSchema"];
            };
        };
        responses: {
            /** @description Existing canonical successful JSON response. */
            201: {
                headers: {
                    "Cache-Control"?: "no-store";
                    /** @description Conditional session renewal/clearing; preserve separate header values. */
                    "Set-Cookie"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["workspaceMemberSchema"];
                };
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Framework or unexpected error; response body explicitly unmodeled. An omitted schema does not mean an empty body. */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    H05: {
        parameters: {
            query?: {
                cursor?: string;
                view?: "active" | "archived";
            };
            header?: never;
            path: {
                workspaceId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Existing canonical successful JSON response. */
            200: {
                headers: {
                    "Cache-Control"?: "no-store";
                    /** @description Conditional session renewal/clearing; preserve separate header values. */
                    "Set-Cookie"?: string;
                    /** @description Existing server correlation header. */
                    "X-Request-Id"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["projectPageSchema"];
                };
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Framework or unexpected error; response body explicitly unmodeled. An omitted schema does not mean an empty body. */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    H06: {
        parameters: {
            query?: never;
            header: {
                /** @description UUID v4, checked in the existing receipt stage after current authority; explicit same-key/body retry only. */
                "Idempotency-Key": string;
                /** @description Exact configured public origin; never selected by the request. */
                Origin: string;
                "Sec-Fetch-Site"?: "same-origin" | "none";
            };
            path: {
                workspaceId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["createProjectInputSchema"];
            };
        };
        responses: {
            /** @description Existing canonical successful JSON response. */
            201: {
                headers: {
                    "Cache-Control"?: "no-store";
                    /** @description Conditional session renewal/clearing; preserve separate header values. */
                    "Set-Cookie"?: string;
                    /** @description Existing server correlation header. */
                    "X-Request-Id"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["projectSchema"];
                };
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Framework or unexpected error; response body explicitly unmodeled. An omitted schema does not mean an empty body. */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    H07: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                projectId: string;
                workspaceId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Existing canonical successful JSON response. */
            200: {
                headers: {
                    "Cache-Control"?: "no-store";
                    /** @description Conditional session renewal/clearing; preserve separate header values. */
                    "Set-Cookie"?: string;
                    /** @description Existing server correlation header. */
                    "X-Request-Id"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["projectSchema"];
                };
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Framework or unexpected error; response body explicitly unmodeled. An omitted schema does not mean an empty body. */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    H08: {
        parameters: {
            query?: never;
            header: {
                /** @description UUID v4, checked in the existing receipt stage after current authority; explicit same-key/body retry only. */
                "Idempotency-Key": string;
                /** @description Exact configured public origin; never selected by the request. */
                Origin: string;
                "Sec-Fetch-Site"?: "same-origin" | "none";
            };
            path: {
                projectId: string;
                workspaceId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["editProjectInputSchema"];
            };
        };
        responses: {
            /** @description Existing canonical successful JSON response. */
            201: {
                headers: {
                    "Cache-Control"?: "no-store";
                    /** @description Conditional session renewal/clearing; preserve separate header values. */
                    "Set-Cookie"?: string;
                    /** @description Existing server correlation header. */
                    "X-Request-Id"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["projectSchema"];
                };
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Framework or unexpected error; response body explicitly unmodeled. An omitted schema does not mean an empty body. */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    H12: {
        parameters: {
            query?: {
                cursor?: string;
            };
            header?: never;
            path: {
                projectId: string;
                workspaceId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Existing canonical successful JSON response. */
            200: {
                headers: {
                    "Cache-Control"?: "no-store";
                    /** @description Conditional session renewal/clearing; preserve separate header values. */
                    "Set-Cookie"?: string;
                    /** @description Existing server correlation header. */
                    "X-Request-Id"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["projectAccessPageSchema"];
                };
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Framework or unexpected error; response body explicitly unmodeled. An omitted schema does not mean an empty body. */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    H14: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                principalId: string;
                projectId: string;
                workspaceId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Existing canonical successful JSON response. */
            200: {
                headers: {
                    "Cache-Control"?: "no-store";
                    /** @description Conditional session renewal/clearing; preserve separate header values. */
                    "Set-Cookie"?: string;
                    /** @description Existing server correlation header. */
                    "X-Request-Id"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["projectAccessReviewSchema"];
                };
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Framework or unexpected error; response body explicitly unmodeled. An omitted schema does not mean an empty body. */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    H13: {
        parameters: {
            query?: never;
            header: {
                /** @description UUID v4, checked in the existing receipt stage after current authority; explicit same-key/body retry only. */
                "Idempotency-Key": string;
                /** @description Exact configured public origin; never selected by the request. */
                Origin: string;
                "Sec-Fetch-Site"?: "same-origin" | "none";
            };
            path: {
                principalId: string;
                projectId: string;
                workspaceId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["changeProjectAccessInputSchema"];
            };
        };
        responses: {
            /** @description Existing canonical successful JSON response. */
            201: {
                headers: {
                    "Cache-Control"?: "no-store";
                    /** @description Conditional session renewal/clearing; preserve separate header values. */
                    "Set-Cookie"?: string;
                    /** @description Existing server correlation header. */
                    "X-Request-Id"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["projectSchema"];
                };
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Framework or unexpected error; response body explicitly unmodeled. An omitted schema does not mean an empty body. */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    H09: {
        parameters: {
            query?: never;
            header: {
                /** @description UUID v4, checked in the existing receipt stage after current authority; explicit same-key/body retry only. */
                "Idempotency-Key": string;
                /** @description Exact configured public origin; never selected by the request. */
                Origin: string;
                "Sec-Fetch-Site"?: "same-origin" | "none";
            };
            path: {
                projectId: string;
                workspaceId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["projectTaskVersionInputSchema"];
            };
        };
        responses: {
            /** @description Existing canonical successful JSON response. */
            201: {
                headers: {
                    "Cache-Control"?: "no-store";
                    /** @description Conditional session renewal/clearing; preserve separate header values. */
                    "Set-Cookie"?: string;
                    /** @description Existing server correlation header. */
                    "X-Request-Id"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["projectSchema"];
                };
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Framework or unexpected error; response body explicitly unmodeled. An omitted schema does not mean an empty body. */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    H15: {
        parameters: {
            query?: {
                cursor?: string;
            };
            header?: never;
            path: {
                projectId: string;
                workspaceId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Existing canonical successful JSON response. */
            200: {
                headers: {
                    "Cache-Control"?: "no-store";
                    /** @description Conditional session renewal/clearing; preserve separate header values. */
                    "Set-Cookie"?: string;
                    /** @description Existing server correlation header. */
                    "X-Request-Id"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["projectAssigneePageSchema"];
                };
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Framework or unexpected error; response body explicitly unmodeled. An omitted schema does not mean an empty body. */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    H30: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                projectId: string;
                workspaceId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Existing canonical successful JSON response. */
            200: {
                headers: {
                    "Cache-Control"?: "no-store";
                    /** @description Conditional session renewal/clearing; preserve separate header values. */
                    "Set-Cookie"?: string;
                    /** @description Existing server correlation header. */
                    "X-Request-Id"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["projectPlanningSchema"];
                };
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Framework or unexpected error; response body explicitly unmodeled. An omitted schema does not mean an empty body. */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    H31: {
        parameters: {
            query?: never;
            header: {
                /** @description UUID v4, checked in the existing receipt stage after current authority; explicit same-key/body retry only. */
                "Idempotency-Key": string;
                /** @description Exact configured public origin; never selected by the request. */
                Origin: string;
                "Sec-Fetch-Site"?: "same-origin" | "none";
            };
            path: {
                projectId: string;
                workspaceId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["configurePlanningInputSchema"];
            };
        };
        responses: {
            /** @description Existing canonical successful JSON response. */
            201: {
                headers: {
                    "Cache-Control"?: "no-store";
                    /** @description Conditional session renewal/clearing; preserve separate header values. */
                    "Set-Cookie"?: string;
                    /** @description Existing server correlation header. */
                    "X-Request-Id"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["projectPlanningSchema"];
                };
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Framework or unexpected error; response body explicitly unmodeled. An omitted schema does not mean an empty body. */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    H10: {
        parameters: {
            query?: never;
            header: {
                /** @description UUID v4, checked in the existing receipt stage after current authority; explicit same-key/body retry only. */
                "Idempotency-Key": string;
                /** @description Exact configured public origin; never selected by the request. */
                Origin: string;
                "Sec-Fetch-Site"?: "same-origin" | "none";
            };
            path: {
                projectId: string;
                workspaceId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["projectTaskVersionInputSchema"];
            };
        };
        responses: {
            /** @description Existing canonical successful JSON response. */
            201: {
                headers: {
                    "Cache-Control"?: "no-store";
                    /** @description Conditional session renewal/clearing; preserve separate header values. */
                    "Set-Cookie"?: string;
                    /** @description Existing server correlation header. */
                    "X-Request-Id"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["projectSchema"];
                };
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Framework or unexpected error; response body explicitly unmodeled. An omitted schema does not mean an empty body. */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    H32: {
        parameters: {
            query?: {
                cursor?: string;
            };
            header?: never;
            path: {
                projectId: string;
                workspaceId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Existing canonical successful JSON response. */
            200: {
                headers: {
                    "Cache-Control"?: "no-store";
                    /** @description Conditional session renewal/clearing; preserve separate header values. */
                    "Set-Cookie"?: string;
                    /** @description Existing server correlation header. */
                    "X-Request-Id"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["sprintPageSchema"];
                };
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Framework or unexpected error; response body explicitly unmodeled. An omitted schema does not mean an empty body. */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    H34: {
        parameters: {
            query?: never;
            header: {
                /** @description UUID v4, checked in the existing receipt stage after current authority; explicit same-key/body retry only. */
                "Idempotency-Key": string;
                /** @description Exact configured public origin; never selected by the request. */
                Origin: string;
                "Sec-Fetch-Site"?: "same-origin" | "none";
            };
            path: {
                projectId: string;
                workspaceId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["createSprintInputSchema"];
            };
        };
        responses: {
            /** @description Existing canonical successful JSON response. */
            201: {
                headers: {
                    "Cache-Control"?: "no-store";
                    /** @description Conditional session renewal/clearing; preserve separate header values. */
                    "Set-Cookie"?: string;
                    /** @description Existing server correlation header. */
                    "X-Request-Id"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["sprintSchema"];
                };
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Framework or unexpected error; response body explicitly unmodeled. An omitted schema does not mean an empty body. */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    H33: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                projectId: string;
                sprintId: string;
                workspaceId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Existing canonical successful JSON response. */
            200: {
                headers: {
                    "Cache-Control"?: "no-store";
                    /** @description Conditional session renewal/clearing; preserve separate header values. */
                    "Set-Cookie"?: string;
                    /** @description Existing server correlation header. */
                    "X-Request-Id"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["sprintSchema"];
                };
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Framework or unexpected error; response body explicitly unmodeled. An omitted schema does not mean an empty body. */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    H35: {
        parameters: {
            query?: never;
            header: {
                /** @description UUID v4, checked in the existing receipt stage after current authority; explicit same-key/body retry only. */
                "Idempotency-Key": string;
                /** @description Exact configured public origin; never selected by the request. */
                Origin: string;
                "Sec-Fetch-Site"?: "same-origin" | "none";
            };
            path: {
                projectId: string;
                sprintId: string;
                workspaceId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["editSprintInputSchema"];
            };
        };
        responses: {
            /** @description Existing canonical successful JSON response. */
            201: {
                headers: {
                    "Cache-Control"?: "no-store";
                    /** @description Conditional session renewal/clearing; preserve separate header values. */
                    "Set-Cookie"?: string;
                    /** @description Existing server correlation header. */
                    "X-Request-Id"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["sprintSchema"];
                };
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Framework or unexpected error; response body explicitly unmodeled. An omitted schema does not mean an empty body. */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    H24: {
        parameters: {
            query?: never;
            header: {
                /** @description UUID v4, checked in the existing receipt stage after current authority; explicit same-key/body retry only. */
                "Idempotency-Key": string;
                /** @description Exact configured public origin; never selected by the request. */
                Origin: string;
                "Sec-Fetch-Site"?: "same-origin" | "none";
            };
            path: {
                projectId: string;
                sprintId: string;
                workspaceId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["closeSprintInputSchema"];
            };
        };
        responses: {
            /** @description Existing canonical successful JSON response. */
            201: {
                headers: {
                    "Cache-Control"?: "no-store";
                    /** @description Conditional session renewal/clearing; preserve separate header values. */
                    "Set-Cookie"?: string;
                    /** @description Existing server correlation header. */
                    "X-Request-Id"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["sprintCloseResultSchema"];
                };
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Framework or unexpected error; response body explicitly unmodeled. An omitted schema does not mean an empty body. */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    H23: {
        parameters: {
            query?: {
                cursor?: string;
                destination?: string;
            };
            header?: never;
            path: {
                projectId: string;
                sprintId: string;
                workspaceId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Existing canonical successful JSON response. */
            200: {
                headers: {
                    "Cache-Control"?: "no-store";
                    /** @description Conditional session renewal/clearing; preserve separate header values. */
                    "Set-Cookie"?: string;
                    /** @description Existing server correlation header. */
                    "X-Request-Id"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["sprintClosePreviewSchema"];
                };
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Framework or unexpected error; response body explicitly unmodeled. An omitted schema does not mean an empty body. */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    H25: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                projectId: string;
                sprintId: string;
                workspaceId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Existing canonical successful JSON response. */
            200: {
                headers: {
                    "Cache-Control"?: "no-store";
                    /** @description Conditional session renewal/clearing; preserve separate header values. */
                    "Set-Cookie"?: string;
                    /** @description Existing server correlation header. */
                    "X-Request-Id"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["sprintClosureSchema"];
                };
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Framework or unexpected error; response body explicitly unmodeled. An omitted schema does not mean an empty body. */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    H26: {
        parameters: {
            query?: {
                cursor?: string;
            };
            header?: never;
            path: {
                projectId: string;
                sprintId: string;
                workspaceId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Existing canonical successful JSON response. */
            200: {
                headers: {
                    "Cache-Control"?: "no-store";
                    /** @description Conditional session renewal/clearing; preserve separate header values. */
                    "Set-Cookie"?: string;
                    /** @description Existing server correlation header. */
                    "X-Request-Id"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["sprintClosingOutcomePageSchema"];
                };
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Framework or unexpected error; response body explicitly unmodeled. An omitted schema does not mean an empty body. */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    H29: {
        parameters: {
            query?: {
                cursor?: string;
            };
            header?: never;
            path: {
                projectId: string;
                sprintId: string;
                workspaceId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Existing canonical successful JSON response. */
            200: {
                headers: {
                    "Cache-Control"?: "no-store";
                    /** @description Conditional session renewal/clearing; preserve separate header values. */
                    "Set-Cookie"?: string;
                    /** @description Existing server correlation header. */
                    "X-Request-Id"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["planningHistoryPageSchema"];
                };
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Framework or unexpected error; response body explicitly unmodeled. An omitted schema does not mean an empty body. */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    H28: {
        parameters: {
            query?: {
                cursor?: string;
            };
            header?: never;
            path: {
                projectId: string;
                sprintId: string;
                workspaceId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Existing canonical successful JSON response. */
            200: {
                headers: {
                    "Cache-Control"?: "no-store";
                    /** @description Conditional session renewal/clearing; preserve separate header values. */
                    "Set-Cookie"?: string;
                    /** @description Existing server correlation header. */
                    "X-Request-Id"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["sprintScopePageSchema"];
                };
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Framework or unexpected error; response body explicitly unmodeled. An omitted schema does not mean an empty body. */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    H27: {
        parameters: {
            query?: never;
            header: {
                /** @description UUID v4, checked in the existing receipt stage after current authority; explicit same-key/body retry only. */
                "Idempotency-Key": string;
                /** @description Exact configured public origin; never selected by the request. */
                Origin: string;
                "Sec-Fetch-Site"?: "same-origin" | "none";
            };
            path: {
                projectId: string;
                sprintId: string;
                workspaceId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["startSprintInputSchema"];
            };
        };
        responses: {
            /** @description Existing canonical successful JSON response. */
            201: {
                headers: {
                    "Cache-Control"?: "no-store";
                    /** @description Conditional session renewal/clearing; preserve separate header values. */
                    "Set-Cookie"?: string;
                    /** @description Existing server correlation header. */
                    "X-Request-Id"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["sprintTransitionResultSchema"];
                };
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Framework or unexpected error; response body explicitly unmodeled. An omitted schema does not mean an empty body. */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    H16: {
        parameters: {
            query?: {
                assignee?: string;
                cursor?: string;
                priority?: "none" | "low" | "medium" | "high" | "urgent";
                status?: "backlog" | "todo" | "in_progress" | "done" | "canceled";
                view?: "active" | "archived";
            };
            header?: never;
            path: {
                projectId: string;
                workspaceId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Existing canonical successful JSON response. */
            200: {
                headers: {
                    "Cache-Control"?: "no-store";
                    /** @description Conditional session renewal/clearing; preserve separate header values. */
                    "Set-Cookie"?: string;
                    /** @description Existing server correlation header. */
                    "X-Request-Id"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["taskPageSchema"];
                };
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Framework or unexpected error; response body explicitly unmodeled. An omitted schema does not mean an empty body. */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    H17: {
        parameters: {
            query?: never;
            header: {
                /** @description UUID v4, checked in the existing receipt stage after current authority; explicit same-key/body retry only. */
                "Idempotency-Key": string;
                /** @description Exact configured public origin; never selected by the request. */
                Origin: string;
                "Sec-Fetch-Site"?: "same-origin" | "none";
            };
            path: {
                projectId: string;
                workspaceId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["createTaskInputSchema"];
            };
        };
        responses: {
            /** @description Existing canonical successful JSON response. */
            201: {
                headers: {
                    "Cache-Control"?: "no-store";
                    /** @description Conditional session renewal/clearing; preserve separate header values. */
                    "Set-Cookie"?: string;
                    /** @description Existing server correlation header. */
                    "X-Request-Id"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["taskSchema"];
                };
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Framework or unexpected error; response body explicitly unmodeled. An omitted schema does not mean an empty body. */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    H18: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                projectId: string;
                taskId: string;
                workspaceId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Existing canonical successful JSON response. */
            200: {
                headers: {
                    "Cache-Control"?: "no-store";
                    /** @description Conditional session renewal/clearing; preserve separate header values. */
                    "Set-Cookie"?: string;
                    /** @description Existing server correlation header. */
                    "X-Request-Id"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["taskSchema"];
                };
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Framework or unexpected error; response body explicitly unmodeled. An omitted schema does not mean an empty body. */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    H19: {
        parameters: {
            query?: never;
            header: {
                /** @description UUID v4, checked in the existing receipt stage after current authority; explicit same-key/body retry only. */
                "Idempotency-Key": string;
                /** @description Exact configured public origin; never selected by the request. */
                Origin: string;
                "Sec-Fetch-Site"?: "same-origin" | "none";
            };
            path: {
                projectId: string;
                taskId: string;
                workspaceId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["editTaskInputSchema"];
            };
        };
        responses: {
            /** @description Existing canonical successful JSON response. */
            201: {
                headers: {
                    "Cache-Control"?: "no-store";
                    /** @description Conditional session renewal/clearing; preserve separate header values. */
                    "Set-Cookie"?: string;
                    /** @description Existing server correlation header. */
                    "X-Request-Id"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["taskSchema"];
                };
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Framework or unexpected error; response body explicitly unmodeled. An omitted schema does not mean an empty body. */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    H21: {
        parameters: {
            query?: never;
            header: {
                /** @description UUID v4, checked in the existing receipt stage after current authority; explicit same-key/body retry only. */
                "Idempotency-Key": string;
                /** @description Exact configured public origin; never selected by the request. */
                Origin: string;
                "Sec-Fetch-Site"?: "same-origin" | "none";
            };
            path: {
                projectId: string;
                taskId: string;
                workspaceId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["projectTaskVersionInputSchema"];
            };
        };
        responses: {
            /** @description Existing canonical successful JSON response. */
            201: {
                headers: {
                    "Cache-Control"?: "no-store";
                    /** @description Conditional session renewal/clearing; preserve separate header values. */
                    "Set-Cookie"?: string;
                    /** @description Existing server correlation header. */
                    "X-Request-Id"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["taskSchema"];
                };
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Framework or unexpected error; response body explicitly unmodeled. An omitted schema does not mean an empty body. */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    H38: {
        parameters: {
            query?: {
                cursor?: string;
            };
            header?: never;
            path: {
                projectId: string;
                taskId: string;
                workspaceId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Existing canonical successful JSON response. */
            200: {
                headers: {
                    "Cache-Control"?: "no-store";
                    /** @description Conditional session renewal/clearing; preserve separate header values. */
                    "Set-Cookie"?: string;
                    /** @description Existing server correlation header. */
                    "X-Request-Id"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["taskChecklistSchema"];
                };
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Framework or unexpected error; response body explicitly unmodeled. An omitted schema does not mean an empty body. */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    H43: {
        parameters: {
            query?: never;
            header: {
                /** @description UUID v4, checked in the existing receipt stage after current authority; explicit same-key/body retry only. */
                "Idempotency-Key": string;
                /** @description Exact configured public origin; never selected by the request. */
                Origin: string;
                "Sec-Fetch-Site"?: "same-origin" | "none";
            };
            path: {
                projectId: string;
                taskId: string;
                workspaceId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["addChecklistItemInputSchema"];
            };
        };
        responses: {
            /** @description Existing canonical successful JSON response. */
            201: {
                headers: {
                    "Cache-Control"?: "no-store";
                    /** @description Conditional session renewal/clearing; preserve separate header values. */
                    "Set-Cookie"?: string;
                    /** @description Existing server correlation header. */
                    "X-Request-Id"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["taskSchema"];
                };
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Framework or unexpected error; response body explicitly unmodeled. An omitted schema does not mean an empty body. */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    H44: {
        parameters: {
            query?: never;
            header: {
                /** @description UUID v4, checked in the existing receipt stage after current authority; explicit same-key/body retry only. */
                "Idempotency-Key": string;
                /** @description Exact configured public origin; never selected by the request. */
                Origin: string;
                "Sec-Fetch-Site"?: "same-origin" | "none";
            };
            path: {
                itemId: string;
                projectId: string;
                taskId: string;
                workspaceId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["editChecklistItemInputSchema"];
            };
        };
        responses: {
            /** @description Existing canonical successful JSON response. */
            201: {
                headers: {
                    "Cache-Control"?: "no-store";
                    /** @description Conditional session renewal/clearing; preserve separate header values. */
                    "Set-Cookie"?: string;
                    /** @description Existing server correlation header. */
                    "X-Request-Id"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["taskSchema"];
                };
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Framework or unexpected error; response body explicitly unmodeled. An omitted schema does not mean an empty body. */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    H45: {
        parameters: {
            query?: never;
            header: {
                /** @description UUID v4, checked in the existing receipt stage after current authority; explicit same-key/body retry only. */
                "Idempotency-Key": string;
                /** @description Exact configured public origin; never selected by the request. */
                Origin: string;
                "Sec-Fetch-Site"?: "same-origin" | "none";
            };
            path: {
                itemId: string;
                projectId: string;
                taskId: string;
                workspaceId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["moveChecklistItemInputSchema"];
            };
        };
        responses: {
            /** @description Existing canonical successful JSON response. */
            201: {
                headers: {
                    "Cache-Control"?: "no-store";
                    /** @description Conditional session renewal/clearing; preserve separate header values. */
                    "Set-Cookie"?: string;
                    /** @description Existing server correlation header. */
                    "X-Request-Id"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["taskSchema"];
                };
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Framework or unexpected error; response body explicitly unmodeled. An omitted schema does not mean an empty body. */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    H46: {
        parameters: {
            query?: never;
            header: {
                /** @description UUID v4, checked in the existing receipt stage after current authority; explicit same-key/body retry only. */
                "Idempotency-Key": string;
                /** @description Exact configured public origin; never selected by the request. */
                Origin: string;
                "Sec-Fetch-Site"?: "same-origin" | "none";
            };
            path: {
                itemId: string;
                projectId: string;
                taskId: string;
                workspaceId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["removeChecklistItemInputSchema"];
            };
        };
        responses: {
            /** @description Existing canonical successful JSON response. */
            201: {
                headers: {
                    "Cache-Control"?: "no-store";
                    /** @description Conditional session renewal/clearing; preserve separate header values. */
                    "Set-Cookie"?: string;
                    /** @description Existing server correlation header. */
                    "X-Request-Id"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["taskSchema"];
                };
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Framework or unexpected error; response body explicitly unmodeled. An omitted schema does not mean an empty body. */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    H39: {
        parameters: {
            query?: {
                cursor?: string;
            };
            header?: never;
            path: {
                projectId: string;
                taskId: string;
                workspaceId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Existing canonical successful JSON response. */
            200: {
                headers: {
                    "Cache-Control"?: "no-store";
                    /** @description Conditional session renewal/clearing; preserve separate header values. */
                    "Set-Cookie"?: string;
                    /** @description Existing server correlation header. */
                    "X-Request-Id"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["taskCommentsSchema"];
                };
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Framework or unexpected error; response body explicitly unmodeled. An omitted schema does not mean an empty body. */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    H47: {
        parameters: {
            query?: never;
            header: {
                /** @description UUID v4, checked in the existing receipt stage after current authority; explicit same-key/body retry only. */
                "Idempotency-Key": string;
                /** @description Exact configured public origin; never selected by the request. */
                Origin: string;
                "Sec-Fetch-Site"?: "same-origin" | "none";
            };
            path: {
                projectId: string;
                taskId: string;
                workspaceId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["addCommentInputSchema"];
            };
        };
        responses: {
            /** @description Existing canonical successful JSON response. */
            201: {
                headers: {
                    "Cache-Control"?: "no-store";
                    /** @description Conditional session renewal/clearing; preserve separate header values. */
                    "Set-Cookie"?: string;
                    /** @description Existing server correlation header. */
                    "X-Request-Id"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["taskSchema"];
                };
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Framework or unexpected error; response body explicitly unmodeled. An omitted schema does not mean an empty body. */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    H41: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                commentId: string;
                projectId: string;
                taskId: string;
                workspaceId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Existing canonical successful JSON response. */
            200: {
                headers: {
                    "Cache-Control"?: "no-store";
                    /** @description Conditional session renewal/clearing; preserve separate header values. */
                    "Set-Cookie"?: string;
                    /** @description Existing server correlation header. */
                    "X-Request-Id"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["taskCommentReviewSchema"];
                };
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Framework or unexpected error; response body explicitly unmodeled. An omitted schema does not mean an empty body. */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    H48: {
        parameters: {
            query?: never;
            header: {
                /** @description UUID v4, checked in the existing receipt stage after current authority; explicit same-key/body retry only. */
                "Idempotency-Key": string;
                /** @description Exact configured public origin; never selected by the request. */
                Origin: string;
                "Sec-Fetch-Site"?: "same-origin" | "none";
            };
            path: {
                commentId: string;
                projectId: string;
                taskId: string;
                workspaceId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["editCommentInputSchema"];
            };
        };
        responses: {
            /** @description Existing canonical successful JSON response. */
            201: {
                headers: {
                    "Cache-Control"?: "no-store";
                    /** @description Conditional session renewal/clearing; preserve separate header values. */
                    "Set-Cookie"?: string;
                    /** @description Existing server correlation header. */
                    "X-Request-Id"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["taskSchema"];
                };
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Framework or unexpected error; response body explicitly unmodeled. An omitted schema does not mean an empty body. */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    H40: {
        parameters: {
            query?: {
                cursor?: string;
            };
            header?: never;
            path: {
                projectId: string;
                taskId: string;
                workspaceId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Existing canonical successful JSON response. */
            200: {
                headers: {
                    "Cache-Control"?: "no-store";
                    /** @description Conditional session renewal/clearing; preserve separate header values. */
                    "Set-Cookie"?: string;
                    /** @description Existing server correlation header. */
                    "X-Request-Id"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["taskHistorySchema"];
                };
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Framework or unexpected error; response body explicitly unmodeled. An omitted schema does not mean an empty body. */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    H20: {
        parameters: {
            query?: never;
            header: {
                /** @description UUID v4, checked in the existing receipt stage after current authority; explicit same-key/body retry only. */
                "Idempotency-Key": string;
                /** @description Exact configured public origin; never selected by the request. */
                Origin: string;
                "Sec-Fetch-Site"?: "same-origin" | "none";
            };
            path: {
                projectId: string;
                taskId: string;
                workspaceId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["moveTaskInputSchema"];
            };
        };
        responses: {
            /** @description Existing canonical successful JSON response. */
            201: {
                headers: {
                    "Cache-Control"?: "no-store";
                    /** @description Conditional session renewal/clearing; preserve separate header values. */
                    "Set-Cookie"?: string;
                    /** @description Existing server correlation header. */
                    "X-Request-Id"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["taskSchema"];
                };
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Framework or unexpected error; response body explicitly unmodeled. An omitted schema does not mean an empty body. */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    H42: {
        parameters: {
            query?: never;
            header: {
                /** @description UUID v4, checked in the existing receipt stage after current authority; explicit same-key/body retry only. */
                "Idempotency-Key": string;
                /** @description Exact configured public origin; never selected by the request. */
                Origin: string;
                "Sec-Fetch-Site"?: "same-origin" | "none";
            };
            path: {
                projectId: string;
                taskId: string;
                workspaceId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["setTaskParentInputSchema"];
            };
        };
        responses: {
            /** @description Existing canonical successful JSON response. */
            201: {
                headers: {
                    "Cache-Control"?: "no-store";
                    /** @description Conditional session renewal/clearing; preserve separate header values. */
                    "Set-Cookie"?: string;
                    /** @description Existing server correlation header. */
                    "X-Request-Id"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["taskSchema"];
                };
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Framework or unexpected error; response body explicitly unmodeled. An omitted schema does not mean an empty body. */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    H37: {
        parameters: {
            query?: {
                cursor?: string;
            };
            header?: never;
            path: {
                projectId: string;
                taskId: string;
                workspaceId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Existing canonical successful JSON response. */
            200: {
                headers: {
                    "Cache-Control"?: "no-store";
                    /** @description Conditional session renewal/clearing; preserve separate header values. */
                    "Set-Cookie"?: string;
                    /** @description Existing server correlation header. */
                    "X-Request-Id"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["taskParentCandidatesSchema"];
                };
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Framework or unexpected error; response body explicitly unmodeled. An omitted schema does not mean an empty body. */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    H51: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                projectId: string;
                taskId: string;
                workspaceId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Existing canonical successful JSON response. */
            200: {
                headers: {
                    "Cache-Control"?: "no-store";
                    /** @description Conditional session renewal/clearing; preserve separate header values. */
                    "Set-Cookie"?: string;
                    /** @description Existing server correlation header. */
                    "X-Request-Id"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["taskPlanningSchema"];
                };
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Framework or unexpected error; response body explicitly unmodeled. An omitted schema does not mean an empty body. */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    H53: {
        parameters: {
            query?: never;
            header: {
                /** @description UUID v4, checked in the existing receipt stage after current authority; explicit same-key/body retry only. */
                "Idempotency-Key": string;
                /** @description Exact configured public origin; never selected by the request. */
                Origin: string;
                "Sec-Fetch-Site"?: "same-origin" | "none";
            };
            path: {
                projectId: string;
                taskId: string;
                workspaceId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["estimateTaskInputSchema"];
            };
        };
        responses: {
            /** @description Existing canonical successful JSON response. */
            201: {
                headers: {
                    "Cache-Control"?: "no-store";
                    /** @description Conditional session renewal/clearing; preserve separate header values. */
                    "Set-Cookie"?: string;
                    /** @description Existing server correlation header. */
                    "X-Request-Id"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["taskPlanningSchema"];
                };
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Framework or unexpected error; response body explicitly unmodeled. An omitted schema does not mean an empty body. */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    H36: {
        parameters: {
            query?: {
                cursor?: string;
            };
            header?: never;
            path: {
                projectId: string;
                taskId: string;
                workspaceId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Existing canonical successful JSON response. */
            200: {
                headers: {
                    "Cache-Control"?: "no-store";
                    /** @description Conditional session renewal/clearing; preserve separate header values. */
                    "Set-Cookie"?: string;
                    /** @description Existing server correlation header. */
                    "X-Request-Id"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["taskRelationsSchema"];
                };
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Framework or unexpected error; response body explicitly unmodeled. An omitted schema does not mean an empty body. */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    H22: {
        parameters: {
            query?: never;
            header: {
                /** @description UUID v4, checked in the existing receipt stage after current authority; explicit same-key/body retry only. */
                "Idempotency-Key": string;
                /** @description Exact configured public origin; never selected by the request. */
                Origin: string;
                "Sec-Fetch-Site"?: "same-origin" | "none";
            };
            path: {
                projectId: string;
                taskId: string;
                workspaceId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["projectTaskVersionInputSchema"];
            };
        };
        responses: {
            /** @description Existing canonical successful JSON response. */
            201: {
                headers: {
                    "Cache-Control"?: "no-store";
                    /** @description Conditional session renewal/clearing; preserve separate header values. */
                    "Set-Cookie"?: string;
                    /** @description Existing server correlation header. */
                    "X-Request-Id"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["taskSchema"];
                };
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Framework or unexpected error; response body explicitly unmodeled. An omitted schema does not mean an empty body. */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    H54: {
        parameters: {
            query?: never;
            header: {
                /** @description UUID v4, checked in the existing receipt stage after current authority; explicit same-key/body retry only. */
                "Idempotency-Key": string;
                /** @description Exact configured public origin; never selected by the request. */
                Origin: string;
                "Sec-Fetch-Site"?: "same-origin" | "none";
            };
            path: {
                projectId: string;
                taskId: string;
                workspaceId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["setTaskSprintInputSchema"];
            };
        };
        responses: {
            /** @description Existing canonical successful JSON response. */
            201: {
                headers: {
                    "Cache-Control"?: "no-store";
                    /** @description Conditional session renewal/clearing; preserve separate header values. */
                    "Set-Cookie"?: string;
                    /** @description Existing server correlation header. */
                    "X-Request-Id"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["sprintTransitionResultSchema"];
                };
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Framework or unexpected error; response body explicitly unmodeled. An omitted schema does not mean an empty body. */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    H52: {
        parameters: {
            query?: {
                cursor?: string;
            };
            header?: never;
            path: {
                projectId: string;
                taskId: string;
                workspaceId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Existing canonical successful JSON response. */
            200: {
                headers: {
                    "Cache-Control"?: "no-store";
                    /** @description Conditional session renewal/clearing; preserve separate header values. */
                    "Set-Cookie"?: string;
                    /** @description Existing server correlation header. */
                    "X-Request-Id"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["planningHistoryPageSchema"];
                };
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Framework or unexpected error; response body explicitly unmodeled. An omitted schema does not mean an empty body. */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    H11: {
        parameters: {
            query?: never;
            header: {
                /** @description UUID v4, checked in the existing receipt stage after current authority; explicit same-key/body retry only. */
                "Idempotency-Key": string;
                /** @description Exact configured public origin; never selected by the request. */
                Origin: string;
                "Sec-Fetch-Site"?: "same-origin" | "none";
            };
            path: {
                projectId: string;
                workspaceId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["changeProjectVisibilityInputSchema"];
            };
        };
        responses: {
            /** @description Existing canonical successful JSON response. */
            201: {
                headers: {
                    "Cache-Control"?: "no-store";
                    /** @description Conditional session renewal/clearing; preserve separate header values. */
                    "Set-Cookie"?: string;
                    /** @description Existing server correlation header. */
                    "X-Request-Id"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["projectSchema"];
                };
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Framework or unexpected error; response body explicitly unmodeled. An omitted schema does not mean an empty body. */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    H49: {
        parameters: {
            query?: {
                assignee?: string;
                cursor?: string;
                priority?: "none" | "low" | "medium" | "high" | "urgent";
                project?: string;
                q?: string;
                scope?: "mine" | "search";
                status?: "backlog" | "todo" | "in_progress" | "done" | "canceled";
                view?: "active" | "archived";
            };
            header?: never;
            path: {
                workspaceId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Existing canonical successful JSON response. */
            200: {
                headers: {
                    "Cache-Control"?: "no-store";
                    /** @description Conditional session renewal/clearing; preserve separate header values. */
                    "Set-Cookie"?: string;
                    /** @description Existing server correlation header. */
                    "X-Request-Id"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["taskDiscoveryPageSchema"];
                };
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Existing controlled error; response body explicitly unmodeled. Runtime envelope and scoped projection admission remain canonical. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Framework or unexpected error; response body explicitly unmodeled. An omitted schema does not mean an empty body. */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
}
