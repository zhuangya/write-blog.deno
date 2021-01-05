import { createBlogArticle, ensureConf } from "./core.ts";

const conf = await ensureConf();
await createBlogArticle(conf);
