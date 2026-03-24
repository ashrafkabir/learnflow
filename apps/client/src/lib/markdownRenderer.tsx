import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeHighlight from 'rehype-highlight';
import rehypeKatex from 'rehype-katex';

// Centralized markdown rendering config used across Conversation + Lesson Reader.
// Goals:
// - consistent heading/body/code styling
// - tables are always horizontally scrollable inside the message container
// - math rendering is best-effort: if KaTeX fails for any reason, fallback to plain text

export type MarkdownRendererProps = {
  content: string;
  className?: string;
};

function safeKatexPlugin() {
  // rehype plugins are invoked by react-markdown; we wrap katex so it never hard-crashes rendering.
  // If katex fails, we return the tree unmodified.
  return function safeKatex(tree: any, file: any) {
    try {
      // rehypeKatex returns a transformer
      const transformer: any = (rehypeKatex as any)({ strict: false, throwOnError: false });
      return transformer(tree, file);
    } catch {
      return tree;
    }
  };
}

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  return (
    <div data-component="markdown-renderer" className={className || ''}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[safeKatexPlugin(), rehypeHighlight]}
        components={{
          h1: ({ children }) => <h1 className="text-lg font-bold mt-3 mb-1">{children}</h1>,
          h2: ({ children }) => <h2 className="text-base font-semibold mt-2 mb-1">{children}</h2>,
          h3: ({ children }) => <h3 className="text-sm font-medium mt-2 mb-1">{children}</h3>,
          p: ({ children }) => <p className="text-sm leading-relaxed mb-1">{children}</p>,
          ul: ({ children }) => <ul className="ml-4 list-disc text-sm space-y-0.5">{children}</ul>,
          ol: ({ children }) => (
            <ol className="ml-4 list-decimal text-sm space-y-0.5">{children}</ol>
          ),
          li: ({ children }) => <li className="mb-0.5">{children}</li>,
          code: ({ className: codeClassName, children, ...props }) => {
            const isBlock =
              (codeClassName && codeClassName.startsWith('language-')) ||
              (codeClassName && codeClassName.startsWith('hljs'));

            if (isBlock) {
              return (
                <code className={codeClassName} {...props}>
                  {children}
                </code>
              );
            }

            return (
              <code
                className="bg-black/10 dark:bg-white/10 px-1 rounded text-xs font-mono"
                {...props}
              >
                {children}
              </code>
            );
          },
          pre: ({ children }) => (
            <pre className="bg-gray-900 dark:bg-black text-green-400 rounded-xl p-3 my-2 overflow-x-auto text-xs font-mono">
              {children}
            </pre>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto my-2 -mx-1 px-1">
              <table className="min-w-full text-sm border-collapse border border-gray-300 dark:border-gray-600">
                {children}
              </table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border border-gray-300 dark:border-gray-600 px-2 py-1 bg-gray-100 dark:bg-gray-800 font-semibold text-left">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border border-gray-300 dark:border-gray-600 px-2 py-1">{children}</td>
          ),
          sup: ({ children }) => <sup className="text-accent font-medium">{children}</sup>,
          a: ({ href, children }) => (
            <a
              href={href}
              className="text-accent underline hover:opacity-80"
              target="_blank"
              rel="noopener noreferrer"
            >
              {children}
            </a>
          ),
          strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-accent pl-3 my-2 italic text-sm opacity-80">
              {children}
            </blockquote>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
