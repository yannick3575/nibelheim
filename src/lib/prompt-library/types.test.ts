import { describe, it, expect } from 'vitest';
import {
  extractVariables,
  fillVariables,
  PROMPT_CATEGORIES,
  CATEGORY_COLORS,
  type PromptCategory,
} from './types';

describe('extractVariables', () => {
  it('should extract single variable', () => {
    const content = 'Hello {{name}}!';
    expect(extractVariables(content)).toEqual(['name']);
  });

  it('should extract multiple variables', () => {
    const content = 'Hello {{name}}, your age is {{age}}';
    expect(extractVariables(content)).toEqual(['name', 'age']);
  });

  it('should deduplicate repeated variables', () => {
    const content = '{{name}} said hello to {{name}}';
    expect(extractVariables(content)).toEqual(['name']);
  });

  it('should return empty array for no variables', () => {
    const content = 'Hello world!';
    expect(extractVariables(content)).toEqual([]);
  });

  it('should handle variables with underscores', () => {
    const content = 'The {{user_name}} is {{first_name}} {{last_name}}';
    expect(extractVariables(content)).toEqual(['user_name', 'first_name', 'last_name']);
  });

  it('should handle variables with numbers', () => {
    const content = '{{var1}} and {{var2}}';
    expect(extractVariables(content)).toEqual(['var1', 'var2']);
  });

  it('should not match malformed patterns', () => {
    const content = '{{ spaced }} {single} {{}} {{special-char}}';
    expect(extractVariables(content)).toEqual([]);
  });

  it('should handle multiline content', () => {
    const content = `Line 1: {{var1}}
Line 2: {{var2}}
Line 3: {{var1}} again`;
    expect(extractVariables(content)).toEqual(['var1', 'var2']);
  });

  it('should handle adjacent variables', () => {
    const content = '{{first}}{{second}}{{third}}';
    expect(extractVariables(content)).toEqual(['first', 'second', 'third']);
  });
});

describe('fillVariables', () => {
  it('should replace single variable', () => {
    const content = 'Hello {{name}}!';
    const result = fillVariables(content, { name: 'World' });
    expect(result).toBe('Hello World!');
  });

  it('should replace multiple variables', () => {
    const content = 'Hello {{name}}, your age is {{age}}';
    const result = fillVariables(content, { name: 'Alice', age: '30' });
    expect(result).toBe('Hello Alice, your age is 30');
  });

  it('should replace repeated variables', () => {
    const content = '{{name}} said hello to {{name}}';
    const result = fillVariables(content, { name: 'Bob' });
    expect(result).toBe('Bob said hello to Bob');
  });

  it('should leave unreplaced variables intact', () => {
    const content = 'Hello {{name}}, age {{age}}';
    const result = fillVariables(content, { name: 'Alice' });
    expect(result).toBe('Hello Alice, age {{age}}');
  });

  it('should handle empty values object', () => {
    const content = 'Hello {{name}}!';
    const result = fillVariables(content, {});
    expect(result).toBe('Hello {{name}}!');
  });

  it('should handle content without variables', () => {
    const content = 'Hello World!';
    const result = fillVariables(content, { name: 'Test' });
    expect(result).toBe('Hello World!');
  });

  // Critical: Test $ special character handling
  it('should handle $ in replacement values', () => {
    const content = 'Price: {{amount}}';
    const result = fillVariables(content, { amount: '$100' });
    expect(result).toBe('Price: $100');
  });

  it('should handle $1 $& and other regex special patterns', () => {
    const content = 'Pattern: {{pattern}}';
    const testCases = [
      { input: '$1', expected: 'Pattern: $1' },
      { input: '$&', expected: 'Pattern: $&' },
      { input: "$$", expected: 'Pattern: $$' },
      { input: "$'", expected: "Pattern: $'" },
      { input: '$`', expected: 'Pattern: $`' },
    ];

    testCases.forEach(({ input, expected }) => {
      const result = fillVariables(content, { pattern: input });
      expect(result).toBe(expected);
    });
  });

  it('should handle multiline content', () => {
    const content = `Hello {{name}},

This is a message for {{name}}.
Your code is {{code}}.`;
    const result = fillVariables(content, { name: 'Dev', code: 'ABC123' });
    expect(result).toBe(`Hello Dev,

This is a message for Dev.
Your code is ABC123.`);
  });

  it('should handle special characters in content', () => {
    const content = 'Hello {{name}}! <script>alert("{{xss}}")</script>';
    const result = fillVariables(content, {
      name: 'User',
      xss: 'test'
    });
    expect(result).toBe('Hello User! <script>alert("test")</script>');
  });
});

describe('PROMPT_CATEGORIES', () => {
  it('should have all expected categories', () => {
    const categoryValues = PROMPT_CATEGORIES.map(c => c.value);
    expect(categoryValues).toContain('coding');
    expect(categoryValues).toContain('writing');
    expect(categoryValues).toContain('analysis');
    expect(categoryValues).toContain('creative');
    expect(categoryValues).toContain('other');
  });

  it('should have labels for all categories', () => {
    PROMPT_CATEGORIES.forEach(category => {
      expect(category.label).toBeDefined();
      expect(category.label.length).toBeGreaterThan(0);
    });
  });
});

describe('CATEGORY_COLORS', () => {
  it('should have colors for all categories', () => {
    const categories: PromptCategory[] = ['coding', 'writing', 'analysis', 'creative', 'other'];
    categories.forEach(category => {
      expect(CATEGORY_COLORS[category]).toBeDefined();
      expect(CATEGORY_COLORS[category]).toContain('text-');
    });
  });
});
