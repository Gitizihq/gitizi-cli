import {
  validateName,
  validateDescription,
  validateContentSize,
  validateTags,
  validateFileExtension,
  validatePromptData,
} from '../utils/validation';

describe('Validation Utilities', () => {
  describe('validateName', () => {
    it('should return null for valid name', () => {
      expect(validateName('Valid Name')).toBeNull();
    });

    it('should return error for empty name', () => {
      const result = validateName('');
      expect(result).not.toBeNull();
      expect(result?.field).toBe('name');
    });

    it('should return error for name exceeding max length', () => {
      const longName = 'a'.repeat(101);
      const result = validateName(longName);
      expect(result).not.toBeNull();
      expect(result?.field).toBe('name');
    });
  });

  describe('validateDescription', () => {
    it('should return null for valid description', () => {
      expect(validateDescription('Valid description')).toBeNull();
    });

    it('should return error for empty description', () => {
      const result = validateDescription('');
      expect(result).not.toBeNull();
      expect(result?.field).toBe('description');
    });

    it('should return error for description exceeding max length', () => {
      const longDesc = 'a'.repeat(501);
      const result = validateDescription(longDesc);
      expect(result).not.toBeNull();
      expect(result?.field).toBe('description');
    });
  });

  describe('validateContentSize', () => {
    it('should return null for content within size limit', () => {
      const content = 'Some content';
      expect(validateContentSize(content)).toBeNull();
    });

    it('should return error for content exceeding size limit', () => {
      const largeContent = 'a'.repeat(100 * 1024 + 1);
      const result = validateContentSize(largeContent);
      expect(result).not.toBeNull();
      expect(result?.field).toBe('content');
    });
  });

  describe('validateTags', () => {
    it('should return null for valid tags', () => {
      expect(validateTags(['tag1', 'tag2', 'tag3'])).toBeNull();
    });

    it('should return error for too many tags', () => {
      const manyTags = Array(11).fill('tag');
      const result = validateTags(manyTags);
      expect(result).not.toBeNull();
      expect(result?.field).toBe('tags');
    });

    it('should return error for tag exceeding max length', () => {
      const longTag = 'a'.repeat(31);
      const result = validateTags([longTag]);
      expect(result).not.toBeNull();
      expect(result?.field).toBe('tags');
    });
  });

  describe('validateFileExtension', () => {
    it('should return null for .md extension', () => {
      expect(validateFileExtension('file.md')).toBeNull();
    });

    it('should return null for .markdown extension', () => {
      expect(validateFileExtension('file.markdown')).toBeNull();
    });

    it('should return error for invalid extension', () => {
      const result = validateFileExtension('file.txt');
      expect(result).not.toBeNull();
      expect(result?.field).toBe('file');
    });
  });

  describe('validatePromptData', () => {
    it('should return empty array for valid data', () => {
      const data = {
        name: 'Valid Name',
        description: 'Valid description',
        content: 'Valid content',
        tags: ['tag1', 'tag2'],
      };
      expect(validatePromptData(data)).toEqual([]);
    });

    it('should return multiple errors for invalid data', () => {
      const data = {
        name: '',
        description: '',
        content: 'a'.repeat(100 * 1024 + 1),
        tags: Array(11).fill('tag'),
      };
      const errors = validatePromptData(data);
      expect(errors.length).toBeGreaterThan(0);
    });
  });
});
