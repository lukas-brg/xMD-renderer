import { DeferredState, ParsingStateInline } from "../parsing_state.js";
import InlineRule from "./inline_rule.js";
import { InlineToken } from "../token.js";
import normalizeUrl from "normalize-url";
import { warnInline } from "../errors.js";
import { RuleState } from "../rules.js";

const pattern = /\[(.*?)\]\((.*?)(?:\s*\"(.*?)\")?\)/g;
const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const urlRegex =
    /\b(https?:\/\/)?(?:www\.)?[-a-z0-9@:%._\+~#=]{1,256}\.[a-z0-9(?:)]{1,6}\b(?:[-a-z0-9(?:)@:%_\+.~#?&//=]*)\b/g;

const headingLinkRegex = /#\w+/;

function processUrl(url: string): string {
    if (emailRegex.test(url)) {
        return `mailto:${url}`;
    }

    if (headingLinkRegex.test(url)) return url;
    try {
        let cleanUrl = normalizeUrl(url);
        return cleanUrl;
    } catch {
        console.warn("Warning: Invalid URL detected: ", url);
        return url;
    }
}

export const Link: InlineRule = {
    name: "link",

    process: (state: ParsingStateInline, ruleState: RuleState) => {
        let didAddLink = false;
        state
            .matchAll(pattern)
            ?.filter((m) => !state.isEscaped(m.index))
            .forEach((match) => {
                let [wholeMatch, label, url, title] = match;
                title = title ?? "";
                const start = match.index;
                const end = match.index + wholeMatch.length;
                const urlStart = start + 1 + label.length;

                url = processUrl(url);
                state.addInlineToken(
                    match.index,
                    InlineToken.createContentless(
                        "a",
                        match.index,
                        Link.name,
                        "open",
                    ).withAttributes({
                        href: url,
                        title: title,
                    }),
                );

                state.addInlineToken(
                    urlStart,
                    InlineToken.createContentless("a", urlStart, Link.name, "close", end),
                );

                didAddLink = true;
            });

        return didAddLink;
    },
};

export const AutoLink: InlineRule = {
    name: "autolink",

    process: (state: ParsingStateInline, ruleState: RuleState) => {
        let didAddLink = false;
        state.matchAll(urlRegex).forEach((match) => {
            const linkText = match[0];
            const url = processUrl(linkText);

            state.addInlineToken(
                match.index,
                InlineToken.createWrapped(
                    "a",
                    match.index,
                    AutoLink.name,
                    linkText,
                    match.index + url.length + 1,
                ).withAttribute("href", url),
            );
            didAddLink = true;
        });
        return didAddLink;
    },
};

// const bracketAutoLinkRegex =
//     /<((?:https?:\/\/)?(www\.)?[-a-z0-9@:%._\+~#=]{1,256}\.[a-z0-9()]{1,6}\b([-a-z0-9()@:%_\+.~#?&//=]*))>|<([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})>/g;

const bracketAutoLinkRegex =
    /<((?:https?:\/\/)?(www\.)?[-a-z0-9@:%._\+~#=]{1,256}\.[a-z0-9()]{1,6}\b([-a-z0-9()@:%_\+.~#?&//=]*))>/g;

const bracketAutoEmailRegex = /<<([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})>>/g;

export const BracketLink: InlineRule = {
    name: "bracket_link",

    process: (state: ParsingStateInline, ruleState: RuleState) => {
        let didAddLink = false;

        state.matchAll(bracketAutoEmailRegex).forEach((match) => {
            if (match.length < 2) return false;

            const linkText = match[1];
            if (!linkText) return false;
            const url = processUrl(linkText);
            state.addInlineToken(
                match.index,
                InlineToken.createWrapped(
                    "a",
                    match.index,
                    BracketLink.name,
                    linkText,
                    match.index + linkText.length + 4,
                ).withAttribute("href", url),
            );
            didAddLink = true;
        });
        if (didAddLink) return true;

        state.matchAll(bracketAutoLinkRegex).forEach((match) => {
            if (match.length < 2) return false;

            const linkText = match[1];
            if (!linkText) return false;
            const url = processUrl(linkText);

            state.addInlineToken(
                match.index,
                InlineToken.createWrapped(
                    "a",
                    match.index,
                    BracketLink.name,
                    linkText,
                    match.index + url.length + 3,
                ).withAttribute("href", url),
            );
            didAddLink = true;
        });

        return didAddLink;
    },
};

const refRegex = /\[(\w+.*)\]\s?\[(.*?)\]/g;

export const ReferenceLink: InlineRule = {
    name: "reference_link",

    process: (state: ParsingStateInline, ruleState: RuleState) => {
        let didAddLink = false;
        let matches = state.matchAll(refRegex);

        state.matchAll(refRegex).forEach((match) => {
            let [wholeMatch, text, label] = match;
            if (!label) {
                label = text;
            }
            const start = match.index;
            const afterContentStart = start + 1 + text.length;
            const end = start + wholeMatch.length;
            let linkTokenOpen = InlineToken.createContentless(
                "a",
                start,
                ReferenceLink.name,
                "open",
            );
            let linkTokenClose = InlineToken.createContentless(
                "a",
                afterContentStart,
                ReferenceLink.name,
                "close",
                end,
            );
            state.addInlineToken(start, linkTokenOpen);
            state.addInlineToken(afterContentStart, linkTokenClose);
            state.document.resolveReference(label, linkTokenOpen);
            didAddLink = true;
        });
        return didAddLink;
    },
};

const defRegex = /\[(\w+.*)\]:\s+/g;
const referenceDefRegex = new RegExp(`${defRegex.source}([^\\s]+)(?:.*"(\\w+.*)")?`, "g");

export const ReferenceLinkDefinition: InlineRule = {
    name: "reference_link_definition",

    process: (state: ParsingStateInline, ruleState: RuleState) => {
        let didAddLink = false;
        let matches = [...state.matchAll(referenceDefRegex)];
        if (matches.length == 0) {
            return false;
        }

        matches.forEach((match) => {
            const [wholeMatch, label, urlText, title] = match;

            const url = processUrl(urlText);
            const start = match.index;
            const end = match.index + wholeMatch.length + 1;
            state.consume(start, end);
            state.document.registerReference(label, url, title);
            didAddLink = true;
        });
        return didAddLink;
    },
};
