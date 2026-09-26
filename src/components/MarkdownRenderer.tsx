import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className }) => {
  return (
    <div className={cn("markdown-content", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Style headings
          h1: ({ children }) => (
            <h1 className="text-xl font-bold text-forest flex items-center gap-2 mb-4">{children}</h1>
          ),
          h2: ({ children }) => <h2 className="text-lg font-semibold text-forest mb-3 mt-6">{children}</h2>,
          h3: ({ children }) => <h3 className="font-semibold text-ink mb-2 mt-4">{children}</h3>,

          // Style paragraphs
          p: ({ children }) => <p className="text-sm leading-relaxed text-ink/90 mb-3">{children}</p>,

          // Style lists
          ul: ({ children }) => <ul className="space-y-2 text-sm leading-relaxed ml-4 mb-4">{children}</ul>,
          ol: ({ children }) => (
            <ol className="space-y-2 text-sm leading-relaxed mb-4 [counter-reset:list-counter]">
              {React.Children.map(children, (child, index) => {
                if (
                  React.isValidElement<{ children?: React.ReactNode; className?: string }>(child) &&
                  child.type === "li"
                ) {
                  return React.cloneElement(child, {
                    className: "flex gap-2",
                    children: (
                      <>
                        <span className="text-gold font-semibold tabular-nums">{index + 1}.</span>
                        <span>{child.props.children}</span>
                      </>
                    ),
                  });
                }
                return child;
              })}
            </ol>
          ),
          li: ({ children }) => (
            <li className="flex gap-2">
              <span className="text-gold">•</span>
              <span>{children}</span>
            </li>
          ),

          // Style horizontal rules
          hr: () => (
            <div className="my-6">
              <div className="bg-border h-px w-full" />
            </div>
          ),

          // Style strong text
          strong: ({ children }) => <strong className="text-ink font-semibold">{children}</strong>,

          // Style emphasis
          em: ({ children }) => <em className="text-ink">{children}</em>,

          // Style code (inline)
          code: ({ children }) => <code className="bg-muted text-forest px-1 py-0.5 rounded text-xs">{children}</code>,

          // Style blockquotes
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-gold pl-4 py-2 bg-muted rounded-r-lg my-4">{children}</blockquote>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;
