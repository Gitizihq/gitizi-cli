import matter from 'gray-matter';

export interface FrontmatterData {
  name?: string;
  description?: string;
  tags?: string[];
  author?: string;
  id?: string;
}

export interface ParsedPrompt {
  metadata: FrontmatterData;
  content: string;
}

/**
 * Parses markdown content with YAML frontmatter
 * @param content - The markdown content with frontmatter
 * @returns Parsed metadata and content
 */
export function parseFrontmatter(content: string): ParsedPrompt {
  const parsed = matter(content);

  const metadata: FrontmatterData = {
    name: parsed.data.name,
    description: parsed.data.description,
    tags: Array.isArray(parsed.data.tags) ? parsed.data.tags : [],
    author: parsed.data.author,
    id: parsed.data.id,
  };

  return {
    metadata,
    content: parsed.content.trim(),
  };
}

/**
 * Generates markdown content with YAML frontmatter
 * @param metadata - The frontmatter metadata
 * @param content - The prompt content
 * @returns Formatted markdown with frontmatter
 */
export function generateFrontmatter(metadata: FrontmatterData, content: string): string {
  const frontmatterObj: Record<string, any> = {};

  if (metadata.name) frontmatterObj.name = metadata.name;
  if (metadata.description) frontmatterObj.description = metadata.description;
  if (metadata.tags && metadata.tags.length > 0) frontmatterObj.tags = metadata.tags;
  if (metadata.author) frontmatterObj.author = metadata.author;
  if (metadata.id) frontmatterObj.id = metadata.id;

  return matter.stringify(content, frontmatterObj);
}
