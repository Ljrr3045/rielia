import ts from 'typescript';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tree } from '../unit/files.mjs';

const verbs = new Map([
  ['Get', 'get'],
  ['Post', 'post'],
]);
const otherRoutes = new Set([
  'All',
  'Delete',
  'Head',
  'Options',
  'Patch',
  'Put',
  'RequestMapping',
  'Sse',
]);
function literal(call, label) {
  if (!call.arguments.length) return '';
  if (call.arguments.length !== 1 || !ts.isStringLiteral(call.arguments[0]))
    throw new Error(`Unsupported dynamic ${label}`);
  return call.arguments[0].text;
}
export function routesFromSources(sources, applicationSource) {
  const bootstrap = ts.createSourceFile(
    'application.ts',
    applicationSource,
    ts.ScriptTarget.Latest,
    true,
  );
  const prefixes = [];
  function prefix(node) {
    if (
      ts.isCallExpression(node) &&
      ts.isPropertyAccessExpression(node.expression) &&
      node.expression.name.text === 'setGlobalPrefix'
    )
      prefixes.push(literal(node, 'API prefix'));
    ts.forEachChild(node, prefix);
  }
  prefix(bootstrap);
  if (prefixes.length !== 1 || prefixes[0] !== 'api/v1') throw new Error('Unsupported API prefix');
  const routes = [];
  const controllersFound = [];
  let rawAuthRoutes = 0;
  for (const { path, text } of sources) {
    const source = ts.createSourceFile(path, text, ts.ScriptTarget.Latest, true);
    if (source.parseDiagnostics.length) throw new Error(`Invalid controller source: ${path}`);
    const names = new Map();
    for (const statement of source.statements) {
      if (!ts.isImportDeclaration(statement) || statement.moduleSpecifier.text !== '@nestjs/common')
        continue;
      const bindings = statement.importClause?.namedBindings;
      if (bindings && ts.isNamedImports(bindings))
        for (const specifier of bindings.elements)
          names.set(specifier.name.text, specifier.propertyName?.text ?? specifier.name.text);
    }
    function decorator(node) {
      const expression = node.expression;
      if (!ts.isCallExpression(expression) || !ts.isIdentifier(expression.expression))
        throw new Error(`Unsupported decorator in ${path}`);
      const name = names.get(expression.expression.text);
      if (!name) throw new Error(`Unrecognized decorator in ${path}`);
      return { name, call: expression };
    }
    function visit(node) {
      if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression)) {
        const method = node.expression.name.text;
        if (
          method === 'getHttpAdapter' &&
          !(
            ts.isPropertyAccessExpression(node.parent) &&
            node.parent.name.text === 'all' &&
            ts.isCallExpression(node.parent.parent) &&
            node.parent.parent.expression === node.parent &&
            node.arguments.length === 0 &&
            node.parent.parent.arguments.length === 2
          )
        )
          throw new Error(`Unsupported raw adapter reference: ${path}`);
        if (
          ['get', 'post', 'put', 'patch', 'delete', 'all', 'head', 'options'].includes(method) &&
          node.arguments.length >= 2 &&
          (node.arguments.length === 2 ||
            ts.isStringLiteral(node.arguments[0]) ||
            ts.isArrowFunction(node.arguments.at(-1)) ||
            ts.isFunctionExpression(node.arguments.at(-1)))
        ) {
          const adapter = node.expression.expression;
          if (
            path !== 'apps/api/src/application.ts' ||
            method !== 'all' ||
            !ts.isCallExpression(adapter) ||
            !ts.isPropertyAccessExpression(adapter.expression) ||
            adapter.expression.name.text !== 'getHttpAdapter' ||
            node.arguments.length !== 2 ||
            !ts.isStringLiteral(node.arguments[0]) ||
            node.arguments[0].text !== '/api/auth/*splat' ||
            !(ts.isArrowFunction(node.arguments[1]) || ts.isFunctionExpression(node.arguments[1]))
          )
            throw new Error(`Unregistered raw HTTP route: ${path}`);
          if (++rawAuthRoutes !== 1) throw new Error('Duplicate raw auth route');
        }
      }
      if (ts.isClassDeclaration(node)) {
        const decorations = (ts.getDecorators(node) ?? []).map(decorator);
        const controllers = decorations.filter((value) => value.name === 'Controller');
        if (controllers.length && node.heritageClauses?.length)
          throw new Error(`Unsupported inherited controller: ${path}`);
        if (controllers.length > 1) throw new Error(`Duplicate controller decorator: ${path}`);
        const controllerPath = controllers.length
          ? literal(controllers[0].call, 'controller path')
          : '';
        if (controllers.length) {
          controllersFound.push(path);
          if (
            controllerPath &&
            (controllerPath.startsWith('/') ||
              controllerPath.endsWith('/') ||
              controllerPath
                .split('/')
                .some((segment) => !/^(?:[A-Za-z0-9_-]+|:[A-Za-z][A-Za-z0-9]*)$/.test(segment)))
          )
            throw new Error(`Unsupported controller path: ${path}`);
        }
        if (
          decorations.some(
            (value) => !['Controller', 'Injectable', 'Module', 'Catch'].includes(value.name),
          )
        )
          throw new Error(`Unsupported class decorator: ${path}`);
        for (const member of node.members) {
          if (!ts.isMethodDeclaration(member)) continue;
          for (const raw of ts.getDecorators(member) ?? []) {
            const value = decorator(raw);
            if (otherRoutes.has(value.name))
              throw new Error(`Unsupported route decorator ${value.name}: ${path}`);
            if (!verbs.has(value.name)) {
              if (
                value.name !== 'Header' ||
                value.call.arguments.length !== 2 ||
                !value.call.arguments.every(ts.isStringLiteral) ||
                value.call.arguments[0].text !== 'Cache-Control' ||
                value.call.arguments[1].text !== 'no-store'
              )
                throw new Error(`Unsupported HTTP metadata decorator ${value.name}: ${path}`);
              continue;
            }
            if (!ts.isIdentifier(member.name) && !ts.isStringLiteral(member.name))
              throw new Error(`Unsupported computed route method: ${path}`);
            if (controllers.length !== 1) throw new Error(`Route outside controller: ${path}`);
            const parts = [prefixes[0], controllerPath, literal(value.call, 'route path')].filter(
              Boolean,
            );
            if (
              parts.some(
                (part) =>
                  part.startsWith('/') ||
                  part.endsWith('/') ||
                  part.includes('//') ||
                  part
                    .split('/')
                    .some((segment) => !/^(?:[A-Za-z0-9_-]+|:[A-Za-z][A-Za-z0-9]*)$/.test(segment)),
              )
            )
              throw new Error(`Unsupported controller path: ${path}`);
            routes.push({
              controller: path,
              method: verbs.get(value.name),
              path: '/' + parts.join('/').replace(/:([A-Za-z][A-Za-z0-9]*)/g, '{$1}'),
            });
          }
        }
      }
      ts.forEachChild(node, visit);
    }
    visit(source);
  }
  return { controllers: controllersFound, routes };
}
export function readApiSources(root) {
  return tree(root, 'apps/api/src', { skip: ['apps/api/src/generated'] })
    .filter((path) => path.endsWith('.ts'))
    .map((path) => ({ path, text: readFileSync(join(root, path), 'utf8') }));
}
export function assertRouteCoverage(root, operations) {
  const inventory = routesFromSources(
    readApiSources(root),
    readFileSync(join(root, 'apps/api/src/application.ts'), 'utf8'),
  );
  const routes = inventory.routes;
  const controllers = [...new Set(operations.map((value) => value.controller))].sort();
  if (
    new Set(inventory.controllers).size !== inventory.controllers.length ||
    JSON.stringify(inventory.controllers.sort()) !== JSON.stringify(controllers)
  )
    throw new Error('Unregistered, missing or duplicate API controller metadata');
  const key = (value) => `${value.controller} ${value.method} ${value.path}`;
  const expected = operations.map(key).sort();
  const actual = routes.map(key).sort();
  if (new Set(actual).size !== actual.length || JSON.stringify(actual) !== JSON.stringify(expected))
    throw new Error('Unregistered, missing or duplicate API route metadata');
  return routes;
}
