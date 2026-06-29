import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const dateMeta = {
	created: z.string().optional(),
	updated: z.string().optional(),
};

const rules = defineCollection({
	loader: glob({ base: './src/content/rules', pattern: '**/*.md' }),
	schema: z.object({ title: z.string(), description: z.string(), order: z.number().default(0), icon: z.string().default('book-open'), ...dateMeta }),
});

const skills = defineCollection({
	loader: glob({ base: './src/content/skills', pattern: '**/*.md' }),
	schema: z.object({ title: z.string(), description: z.string(), trigger: z.string().optional(), order: z.number().default(0), icon: z.string().default('zap'), ...dateMeta }),
});

const infra = defineCollection({
	loader: glob({ base: './src/content/infra', pattern: '**/*.md' }),
	schema: z.object({ title: z.string(), description: z.string(), order: z.number().default(0), icon: z.string().default('wrench'), ...dateMeta }),
});

const agents = defineCollection({
	loader: glob({ base: './src/content/agents', pattern: '**/*.md' }),
	schema: z.object({ title: z.string(), description: z.string(), model: z.string().optional(), tools: z.string().optional(), order: z.number().default(0), icon: z.string().default('bot'), ...dateMeta }),
});

export const collections = { rules, skills, infra, agents };
