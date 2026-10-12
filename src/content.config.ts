import { defineCollection, reference } from 'astro:content';
import { glob } from 'astro/loaders';
import { contentSchemas } from './lib/content-schemas.js';

/**
 * Content collections for the plain reading pages: one folder of Markdown
 * files each. The schemas, and the notes on what every field means, are in
 * src/lib/content-schemas.js, where `node --test` can read them as well. The
 * CMS form that edits these files is .pages.yml, and
 * tests/pages-cms-config.test.mjs keeps the two in step.
 */
const schemas = contentSchemas(reference);
const folder = (name: string) => glob({ base: `./src/content/${name}`, pattern: '**/*.md' });

const pages = defineCollection({ loader: folder('pages'), schema: schemas.pages });
const team = defineCollection({ loader: folder('team'), schema: schemas.team });
const services = defineCollection({ loader: folder('services'), schema: schemas.services });
const articles = defineCollection({ loader: folder('articles'), schema: schemas.articles });
const towns = defineCollection({ loader: folder('towns'), schema: schemas.towns });

export const collections = { pages, team, services, articles, towns };
