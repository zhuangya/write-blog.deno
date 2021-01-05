import { generateFrontMatter } from "../core.ts";
import { assertEquals } from "../deps.ts";

Deno.test({
    name: "generate front matter with prefill",
    async fn() {
        const fm = await generateFrontMatter({ title: "hello", slug: "he-llo", date: "123", tags: ["1", "2", "3"] });
        assertEquals(fm, {
            content: "---\ntitle: hello\nslug: he-llo\ntags:\n  - '1'\n  - '2'\n  - '3'\ndate: '123'\n\n---",
            date: "123",
            slug: "he-llo",
            tags: ["1", "2", "3"],
        });
    },
});
