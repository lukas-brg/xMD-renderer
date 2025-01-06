import { ParsingStateInline } from "../parsing_state.js";
import InlineRule from "./inline_rule.js";
import { InlineToken } from "../token.js";
import normalizeUrl from "normalize-url";

const pattern = /(?:^|[^!])\[(.*?)\]\((.*?)(?:\s*\"(.*?)\")?\)/g;
const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const urlRegex =
    /(https?:\/\/)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g;

function processUrl(url: string): string {
    if (emailRegex.test(url)) {
        return `mailto:${url}`;
    }

    if (url.startsWith("#")) return url;

    let cleanUrl = normalizeUrl(url);
    return cleanUrl;
}

export const Link: InlineRule = {
    name: "link",

    process: (state: ParsingStateInline) => {
        let didAddLink = false;
        state.line
            .matchAll(pattern)
            ?.filter((m) => !state.isEscaped(m.index))
            .forEach((match) => {
                let [wholeMatch, text, url, title] = match;
                title = title ?? "";
                const start = match.index;
                const end = match.index + wholeMatch.length;
                const urlStart = start + 1 + text.length;
                url = processUrl(url);
                state.addInlineToken(
                    match.index,
                    InlineToken.createContentless(
                        "a",
                        match.index,
                        "open",
                    ).withAttributes({
                        href: url,
                        title: title,
                    }),
                );

                state.addInlineToken(
                    urlStart,
                    InlineToken.createContentless("a", urlStart, "close", end),
                );

                didAddLink = true;
            });

        return didAddLink;
    },
};

export const AutoLink: InlineRule = {
    name: "autolink",

    process: (state: ParsingStateInline) => {
        let didAddLink = false;
        state.line.matchAll(urlRegex).forEach((match) => {
            const linkText = match[0];
            const url = processUrl(linkText);

            state.addInlineToken(
                match.index,
                InlineToken.createWrapped(
                    "a",
                    match.index,
                    linkText,
                    match.index + url.length + 1,
                ).withAttribute("href", url),
            );
            didAddLink = true;
        });
        return didAddLink;
    },
};
