import { defineCollection, z } from 'astro:content';

const newsCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    category: z.enum([
      'Geopolitics',
      'Military',
      'Markets',
      'Finance',
      'Crypto',
      'Oil & Energy',
      'Middle East',
      'Global Economy',
      'Breaking',
      'Analysis',
    ]),
    excerpt: z.string(),
    date: z.date(),
    author: z.string().default('Lazarus Report'),
    image: z.string().optional(),
    featured: z.boolean().default(false),
    tags: z.array(z.string()).default([]),
  }),
});

export const collections = {
  news: newsCollection,
};
