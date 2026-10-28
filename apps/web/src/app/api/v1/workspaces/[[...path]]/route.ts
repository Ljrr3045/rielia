import { proxyWorkspace } from '../../../../../lib/workspace-proxy';
import { proxyProjectTask } from '../../../../../lib/project-task-proxy';
export const dynamic = 'force-dynamic';
const proxy = (request: Request) => new URL(request.url).pathname.split('/')[5] === 'projects' ? proxyProjectTask(request) : proxyWorkspace(request);
export const GET = proxy;
export const POST = proxy;
