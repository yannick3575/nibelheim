import React from 'react';
import ReactMarkdown from 'react-markdown';

interface MarkdownRendererProps {
    content: string;
    className?: string;
}

export function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
    return (
        <div className={`prose prose-zinc dark:prose-invert max-w-none ${className}`}>
            <ReactMarkdown
                components={{
                    // Override specific elements if needed
                    h2: ({ node, ...props }) => <h2 className="text-xl font-bold mt-6 mb-3 scroll-m-20 border-b pb-2 tracking-tight first:mt-0" {...props} />,
                    a: ({ node, ...props }) => <a className="text-primary hover:underline font-medium" target="_blank" rel="noopener noreferrer" {...props} />,
                    ul: ({ node, ...props }) => <ul className="my-6 ml-6 list-disc [&>li]:mt-2" {...props} />,
                    p: ({ node, ...props }) => <p className="leading-7 [&:not(:first-child)]:mt-6" {...props} />,
                    hr: ({ node, ...props }) => <hr className="my-8 border-border" {...props} />,
                }}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
}
