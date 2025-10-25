import path from 'path';
import { LIMITS, ERRORS } from './constants';

export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Validates prompt name
 * @param name - The prompt name
 * @returns Validation error if invalid, null otherwise
 */
export function validateName(name: string): ValidationError | null {
  if (!name || name.trim() === '') {
    return { field: 'name', message: ERRORS.NAME_REQUIRED };
  }
  if (name.length > LIMITS.MAX_NAME_LENGTH) {
    return { field: 'name', message: ERRORS.NAME_TOO_LONG };
  }
  return null;
}

/**
 * Validates prompt description
 * @param description - The prompt description
 * @returns Validation error if invalid, null otherwise
 */
export function validateDescription(description: string): ValidationError | null {
  if (!description || description.trim() === '') {
    return { field: 'description', message: ERRORS.DESCRIPTION_REQUIRED };
  }
  if (description.length > LIMITS.MAX_DESCRIPTION_LENGTH) {
    return { field: 'description', message: ERRORS.DESCRIPTION_TOO_LONG };
  }
  return null;
}

/**
 * Validates prompt content size
 * @param content - The prompt content
 * @returns Validation error if invalid, null otherwise
 */
export function validateContentSize(content: string): ValidationError | null {
  const size = Buffer.byteLength(content, 'utf-8');
  if (size > LIMITS.MAX_CONTENT_SIZE) {
    return { field: 'content', message: ERRORS.CONTENT_TOO_LARGE };
  }
  return null;
}

/**
 * Validates tag format and limits
 * @param tags - Array of tags
 * @returns Validation error if invalid, null otherwise
 */
export function validateTags(tags: string[]): ValidationError | null {
  if (tags.length > LIMITS.MAX_TAGS_COUNT) {
    return { field: 'tags', message: `Maximum ${LIMITS.MAX_TAGS_COUNT} tags allowed` };
  }

  for (const tag of tags) {
    if (tag.length > LIMITS.MAX_TAG_LENGTH) {
      return { field: 'tags', message: `Tag "${tag}" exceeds ${LIMITS.MAX_TAG_LENGTH} characters` };
    }
  }

  return null;
}

/**
 * Validates file extension
 * @param filePath - The file path
 * @returns Validation error if invalid, null otherwise
 */
export function validateFileExtension(filePath: string): ValidationError | null {
  const ext = path.extname(filePath).toLowerCase();
  if (ext !== '.md' && ext !== '.markdown') {
    return { field: 'file', message: ERRORS.INVALID_FILE_EXTENSION(filePath) };
  }
  return null;
}

/**
 * Validates all prompt data
 * @param data - The prompt data to validate
 * @returns Array of validation errors
 */
export function validatePromptData(data: {
  name?: string;
  description?: string;
  content?: string;
  tags?: string[];
}): ValidationError[] {
  const errors: ValidationError[] = [];

  if (data.name) {
    const nameError = validateName(data.name);
    if (nameError) errors.push(nameError);
  }

  if (data.description) {
    const descError = validateDescription(data.description);
    if (descError) errors.push(descError);
  }

  if (data.content) {
    const contentError = validateContentSize(data.content);
    if (contentError) errors.push(contentError);
  }

  if (data.tags && data.tags.length > 0) {
    const tagsError = validateTags(data.tags);
    if (tagsError) errors.push(tagsError);
  }

  return errors;
}
