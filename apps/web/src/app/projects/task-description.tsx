'use client';

import { Fragment } from 'react';
import type { ReactNode } from 'react';
import { parseSafeMarkdown, type MarkdownInline } from '../../lib/safe-markdown';
import styles from './projects.module.css';

function inlineNodes(content: readonly MarkdownInline[]): ReactNode[] {
  return content.map((node, index) => {
    if (node.type === 'link') {
      const external = node.href.startsWith('http:') || node.href.startsWith('https:');
      return (
        <a
          href={node.href}
          key={index}
          rel={external ? 'noopener noreferrer' : undefined}
          target={external ? '_blank' : undefined}
        >
          {node.text}
        </a>
      );
    }
    if (node.type === 'code') return <code key={index}>{node.text}</code>;
    if (node.type === 'strong') return <strong key={index}>{node.text}</strong>;
    if (node.type === 'emphasis') return <em key={index}>{node.text}</em>;
    return <Fragment key={index}>{node.text}</Fragment>;
  });
}

export function TaskDescription({ source }: { source: string }) {
  if (source.length === 0) return null;
  const blocks = parseSafeMarkdown(source);
  return (
    <div className={styles.markdown}>
      {blocks.map((block, index) => {
        if (block.type === 'paragraph') {
          return <p key={index}>{inlineNodes(block.content)}</p>;
        }
        if (block.type === 'heading') {
          if (block.level === 1) return <h3 key={index}>{inlineNodes(block.content)}</h3>;
          if (block.level === 2) return <h4 key={index}>{inlineNodes(block.content)}</h4>;
          return <h5 key={index}>{inlineNodes(block.content)}</h5>;
        }
        if (block.type === 'code') {
          return <pre key={index}><code>{block.text}</code></pre>;
        }
        return (
          <ul key={index}>
            {block.items.map((item, itemIndex) => <li key={itemIndex}>{inlineNodes(item)}</li>)}
          </ul>
        );
      })}
    </div>
  );
}
