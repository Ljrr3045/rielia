import ts from 'typescript';
import { readFileSync } from 'node:fs';
import { regularFile } from '../quality/policy.mjs';

function normalized(fn) {
  const emitted = ts.transpileModule(`const value = ${fn};`, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2023,
      module: ts.ModuleKind.ESNext,
      removeComments: true,
    },
  }).outputText;
  const source = ts.createSourceFile(
    'semantic.js',
    emitted,
    ts.ScriptTarget.ES2023,
    true,
    ts.ScriptKind.JS,
  );
  if (source.parseDiagnostics.length) throw new Error('Invalid semantic function AST');
  // Compare emitted syntax without positions/trivia. Leaf tokens retain literal
  // whitespace, including regexp bodies and every template head/middle/tail.
  function syntax(node) {
    const children = node.getChildren(source).map(syntax);
    return [node.kind, children.length ? children : node.getText(source)];
  }
  return JSON.stringify(syntax(source));
}
/** Bind every admitted runtime check/normalizer to a real source AST location. */
export function assertSemanticSources(root, records, resolveBinding) {
  if (ts.version !== '6.0.3')
    throw new Error('Semantic source census requires application TypeScript 6.0.3');
  const files = new Map();
  for (const row of records) {
    const match = /^(packages\/contracts\/src\/[a-z-]+\.ts):([1-9][0-9]*)$/.exec(row.source);
    if (!match) throw new Error(`Invalid semantic source: ${row.id}`);
    const [, path, rawLine] = match;
    if (!files.has(path)) {
      const source = ts.createSourceFile(
        path,
        readFileSync(regularFile(root, path), 'utf8'),
        ts.ScriptTarget.Latest,
        true,
      );
      if (source.parseDiagnostics.length) throw new Error(`Invalid semantic source AST: ${path}`);
      const expressions = [];
      function visit(node) {
        if (
          ts.isCallExpression(node) &&
          ts.isPropertyAccessExpression(node.expression) &&
          ['refine', 'custom', 'transform'].includes(node.expression.name.text)
        ) {
          const value = node.arguments[0];
          if (value && (ts.isArrowFunction(value) || ts.isFunctionExpression(value)))
            expressions.push({
              line:
                source.getLineAndCharacterOfPosition(node.expression.name.getStart(source)).line +
                1,
              text: normalized(value.getText(source)),
            });
        }
        if (ts.isFunctionDeclaration(node) && node.body) {
          const expression = ts.factory.createFunctionExpression(
            node.modifiers?.filter((modifier) => modifier.kind === ts.SyntaxKind.AsyncKeyword),
            node.asteriskToken,
            node.name,
            node.typeParameters,
            node.parameters,
            node.type,
            node.body,
          );
          expressions.push({
            line: source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1,
            text: normalized(
              ts.createPrinter().printNode(ts.EmitHint.Expression, expression, source),
            ),
          });
        }
        ts.forEachChild(node, visit);
      }
      visit(source);
      files.set(path, expressions);
    }
    let bound = resolveBinding(row.path);
    // The original unknown-schema parent has no check; its view shares A025's admission.
    if (row.id === 'A026') {
      const admission = records.find((value) => value.id === 'A025');
      if (!admission) throw new Error('Missing canonical snapshot admission source');
      bound = resolveBinding(admission.path);
    }
    const definition = bound?._zod?.def;
    const fn = definition?.fn ?? definition?.transform ?? definition?.checks?.[0]?._zod.def.fn;
    if (typeof fn !== 'function') throw new Error(`Missing runtime source function: ${row.id}`);
    if (
      !files
        .get(path)
        .some((value) => value.line === Number(rawLine) && value.text === normalized(String(fn)))
    )
      throw new Error(`Semantic source drift: ${row.id}`);
  }
  return records.length;
}
