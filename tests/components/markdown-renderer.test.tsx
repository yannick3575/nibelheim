import { render, screen } from '@testing-library/react';
import { MarkdownRenderer } from '@/components/markdown-renderer';
import { describe, it, expect } from 'vitest';

describe('MarkdownRenderer', () => {
    it('renders markdown content correctly', () => {
        const content = '## Hello World\nThis is a **bold** text.';
        render(<MarkdownRenderer content={content} />);

        // The component customizes h2
        expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Hello World');
        // ReactMarkdown defaults ** to strong. Checking tag name in testing-library is tricky without .tagName
        // But we can check if it's contained in the text.
        // Let's rely on text content for now, or assume it renders.
        // screen.getByText('bold') will find the element.
        const boldText = screen.getByText('bold');
        expect(boldText.tagName).toBe('STRONG');
    });

    it('renders links with target blank', () => {
        const content = '[Link](https://example.com)';
        render(<MarkdownRenderer content={content} />);
        const link = screen.getByRole('link', { name: 'Link' });
        expect(link).toHaveAttribute('href', 'https://example.com');
        expect(link).toHaveAttribute('target', '_blank');
        expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('applies custom className', () => {
        const content = 'text';
        const { container } = render(<MarkdownRenderer content={content} className="custom-class" />);
        expect(container.firstChild).toHaveClass('custom-class');
    });
});
