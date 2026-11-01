import { proxyWorkspace } from '../../../../../lib/workspace-proxy';
import { proxyProjectTask } from '../../../../../lib/project-task-proxy';
export const dynamic = 'force-dynamic';
const proxy = (request: Request) => ['projects', 'task-discovery', 'events'].includes(new URL(request.url).pathname.split('/')[5] ?? '') ? proxyProjectTask(request) : proxyWorkspace(request);
export const GET = proxy;
export const POST = proxy;
