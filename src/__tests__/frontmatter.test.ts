import { parseFrontmatter, generateFrontmatter } from '../utils/frontmatter';

describe('Frontmatter Utilities', () => {
  describe('parseFrontmatter', () => {
    it('should parse markdown with YAML frontmatter', () => {
      const content = `---
name: Test Prompt
description: A test prompt
tags: [test, example]
---

This is the prompt content.`;

      const result = parseFrontmatter(content);
      expect(result.metadata.name).toBe('Test Prompt');
      expect(result.metadata.description).toBe('A test prompt');
      expect(result.metadata.tags).toEqual(['test', 'example']);
      expect(result.content).toBe('This is the prompt content.');
    });

    it('should handle markdown without frontmatter', () => {
      const content = 'Just plain content';
      const result = parseFrontmatter(content);
      expect(result.metadata.name).toBeUndefined();
      expect(result.content).toBe('Just plain content');
    });

    it('should handle empty tags array', () => {
      const content = `---
name: Test
description: Test
---

Content`;

      const result = parseFrontmatter(content);
      expect(result.metadata.tags).toEqual([]);
    });
  });

  describe('generateFrontmatter', () => {
    it('should generate markdown with frontmatter', () => {
      const metadata = {
        name: 'Test Prompt',
        description: 'A test',
        tags: ['tag1', 'tag2'],
      };
      const content = 'Prompt content';

      const result = generateFrontmatter(metadata, content);
      expect(result).toContain('name: Test Prompt');
      expect(result).toContain('description: A test');
      expect(result).toContain('tags:');
      expect(result).toContain('Prompt content');
    });

    it('should handle optional fields', () => {
      const metadata = {
        name: 'Test',
      };
      const content = 'Content';

      const result = generateFrontmatter(metadata, content);
      expect(result).toContain('name: Test');
      expect(result).toContain('Content');
    });

    it('should include author and id if provided', () => {
      const metadata = {
        name: 'Test',
        description: 'Test',
        author: 'John Doe',
        id: '123',
      };
      const content = 'Content';

      const result = generateFrontmatter(metadata, content);
      expect(result).toContain('author: John Doe');
      expect(result).toContain('id: \'123\'');
    });
  });
});
