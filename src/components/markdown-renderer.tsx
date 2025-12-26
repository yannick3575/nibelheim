import React from 'react';
import ReactMarkdown, { Components } from 'react-markdown';

interface MarkdownRendererProps {
    content: string;
    className?: string;
}

// Extract components as module-level constant to prevent recreation on each render
const markdownComponents: Components = {
    h2: ({ node: _node, ...props }) => <h2 className="text-xl font-bold mt-6 mb-3 scroll-m-20 border-b pb-2 tracking-tight first:mt-0" {...props} />,
    a: ({ node: _node, ...props }) => <a className="text-primary hover:underline font-medium" target="_blank" rel="noopener noreferrer" {...props} />,
    ul: ({ node: _node, ...props }) => <ul className="my-6 ml-6 list-disc [&>li]:mt-2" {...props} />,
    p: ({ node: _node, ...props }) => <p className="leading-7 [&:not(:first-child)]:mt-6" {...props} />,
    hr: ({ node: _node, ...props }) => <hr className="my-8 border-border" {...props} />,
};

export const MarkdownRenderer = React.memo(function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
    return (
        <div className={`prose prose-zinc dark:prose-invert max-w-none ${className}`}>
            <ReactMarkdown components={markdownComponents}>
                {content}
            </ReactMarkdown>
        </div>
    );
});
