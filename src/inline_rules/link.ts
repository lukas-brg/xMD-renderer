import { ParsingStateInline } from "../parsing_state.js";
import InlineRule from "./inline_rule.js";
import { InlineToken } from "../token.js";
import normalizeUrl from "normalize-url";

const pattern = /(?:^|[^!])\[(.*?)\]\((.*?)(?:\s*\"(.*?)\")?\)/g;
const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const urlRegex =
    /(https?:\/\/)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g;

const headingLinkRegex = /#\w+/;

function processUrl(url: string): string {
    if (emailRegex.test(url)) {
        return `mailto:${url}`;
    }

    if (headingLinkRegex.test(url)) return url;

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
        state.matchAll(urlRegex).forEach((match) => {
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

const refRegex = /\[(\w+.*)\]\s?\[(\w+)\]/g;

export const ReferenceLink: InlineRule = {
    name: "reference_link",

    process: (state: ParsingStateInline) => {
        let didAddLink = false;
        state.matchAll(refRegex).forEach((match) => {
            const [wholeMatch, text, label] = match;
            const start = match.index;
            const afterContentStart = start + 1 + text.length;
            const end = start + wholeMatch.length;
            let linkTokenOpen = InlineToken.createContentless("a", start, "open");
            let linkTokenClose = InlineToken.createContentless(
                "a",
                afterContentStart,
                "close",
                end,
            );
            state.addInlineToken(start, linkTokenOpen);
            state.addInlineToken(afterContentStart, linkTokenClose);
            state.resolveReference(label, linkTokenOpen);
            didAddLink = true;
        });
        return didAddLink;
    },
};

const defRegex = /\[(\w+)\]:\s+/g;

const referenceDefRegex = new RegExp(
    `${defRegex.source}(${urlRegex.source})(?:.*"(.*)")?`,
    "g",
);

export const ReferenceLinkDefinition: InlineRule = {
    name: "reference_link_definition",

    process: (state: ParsingStateInline) => {
        let didAddLink = false;
        state.matchAll(referenceDefRegex).forEach((match) => {
            const [wholeMatch, label, urlText] = match;
            const title = match[6];
            const url = processUrl(urlText);
            const start = match.index;
            const end = match.index + wholeMatch.length + 1;
            state.consume(start, end);
            state.registerReference(label, url, title);
            didAddLink = true;
        });
        return didAddLink;
    },
};
