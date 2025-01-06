import { ParsingStateInline } from "../parsing_state.js";
import InlineRule from "./inline_rule.js";
import { InlineToken } from "../token.js";
import normalizeUrl from "normalize-url";

const pattern = /(?:^|[^!])\[(.*?)\]\((.*?)(?:\s*\"(.*?)\")?\)/g;
const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

function handleUrl(url: string): string {
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
        const matches = state.line
            .matchAll(pattern)
            ?.filter((m) => !state.isEscaped(m.index))
            .forEach((match) => {
                let [wholeMatch, text, url, title] = match;
                title = title ?? "";
                let start = match.index;
                let end = match.index + wholeMatch.length;
                let urlStart = start + 1 + text.length;
                url = handleUrl(url);
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
