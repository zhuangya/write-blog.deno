import {
    BufReader,
    cwd,
    dump,
    ensureDir,
    format,
    fs,
    Input,
    join,
    List,
    OptionType,
    parseFlags,
    prompt,
    slugify,
} from "./deps.ts";

type IConf = {
    dir: string;
    ext: string;
    timeFormatString: string;
};

type IPrefill = {
    title: string;
    tags: string[];
    date: string;
    slug: string;
};

async function createConfGuide(confPath: string): Promise<IConf> {
    const conf = await prompt([{
        name: "dir",
        message: "[> conf] blog file source directory",
        type: Input,
    }, {
        name: "ext",
        message: "[> conf] markdown file extension",
        default: "mdx",
        type: Input,
    }, {
        name: "timeFormatString",
        message: "[> conf] time format string",
        default: "yyyy/MM",
        type: Input,
    }]);

    await fs.writeFile(confPath, JSON.stringify(conf, null, 2), { encoding: "utf8", flag: "wx" });
    return conf as IConf;
}

function readFlags(): IPrefill {
    const { flags, unknown: titleArray } = parseFlags(Deno.args, {
        allowEmpty: true,
        flags: [{
            name: "help",
            aliases: ["h"],
            optionalValue: true,
            standalone: true,
        }, {
            name: "slug",
            aliases: ["s"],
            type: OptionType.STRING,
            optionalValue: true,
            value: val => slugify(val),
        }, {
            name: "tags",
            aliases: ["l"],
            optionalValue: true,
            type: OptionType.STRING,
            value: val => val.split(/,|，/),
        }, {
            name: "date",
            aliases: ["d"],
            type: OptionType.STRING,
            optionalValue: true,
        }],
    });

    return {
        ...flags,
        title: titleArray.join(" "),
    } as IPrefill;
}

export async function generateFrontMatter(prefill: IPrefill) {
    const title = prefill.title === "" ? await Input.prompt("Blog Title *") : prefill.title;
    const slug = typeof prefill.slug === "undefined"
        ? await Input.prompt({ message: "Blog Slug *", default: slugify(title as string).toLowerCase() })
        : prefill.slug;

    const tags = typeof prefill.tags === "undefined"
        ? await List.prompt("Tags (Optional, separate by comma<,>)")
        : prefill.tags;

    const date = typeof prefill.date === "undefined"
        ? await Input.prompt({ message: "Date", default: new Date().toISOString() })
        : prefill.date;

    const content = [
        "---",
        dump({
            title,
            slug,
            tags,
            date,
        }),
        "---",
    ].join("\n");

    return {
        content,
        date,
        slug,
        tags,
    };
}

export async function ensureConf(): Promise<IConf> {
    const confPath = join(cwd(), ".write-blog.json");
    try {
        const confLiteral = await fs.readFile(confPath, "utf-8");
        return JSON.parse(confLiteral.toString()) as IConf;
    } catch (e) {
        return await createConfGuide(confPath);
    }
}

export async function createBlogArticle(conf: IConf) {
    const prefill = readFlags();
    const { content, date, slug } = await generateFrontMatter(prefill);
    const dir = join(conf.dir, format(new Date(date), conf.timeFormatString));
    const filename = join(dir, `${slug}.${conf.ext}`);

    await ensureDir(dir);
    await fs.writeFile(filename, content, { encoding: "utf8", flag: "wx" });
}
