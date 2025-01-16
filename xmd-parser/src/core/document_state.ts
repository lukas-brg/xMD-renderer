import { assert } from "console";
import { makeIdString as normalizeString, trailingWhiteSpaces } from "./string_utils.js";
import { InlineToken, Token } from "./token.js";

type Reference = {
    label: string;
    url: string;
    title?: string;
};

type FootnoteRef = {
    token: Token;
    onNumResolved: (footnoteNumber: number) => void;
};

export type HeadingForm = {
    text: string;
    level: number;
    lineNumber: number;
    token: Token;
};

type HeadingEntry = {
    id: string;
    text: string;
    level: number;
    lineNumber: number;
    token: Token;
};

export class DocumentState {
    private _references: Map<string, Reference>;
    private _footnotes: Map<string, FootnoteRef>;
    private _footnoteNumbers: Map<string, number>;
    private _unresolvedFootnotes: Map<string, Token>;
    private _unresolvedRefs: Map<string, Token>;
    private footnoteCount: number;
    _headings: HeadingEntry[];
    _headingIds: Map<string, number>;

    constructor() {
        this._references = new Map();
        this._footnotes = new Map();
        this._unresolvedFootnotes = new Map();
        this._unresolvedRefs = new Map();
        this.footnoteCount = 1;
        this._footnoteNumbers = new Map();
        this._headings = [];
        this._headingIds = new Map();
    }

    registerReference(label: string, url: string, title?: string) {
        this._references.set(label, { label, url, title });

        let token = this._unresolvedRefs.get(label);
        if (token) {
            token.addAttributes({ href: url, title: title ?? "" });
            this._unresolvedRefs.delete(label);
        }
    }

    resolveReference(label: string, token: InlineToken) {
        const ref = this._references.get(label);
        if (ref != undefined) {
            const title = ref.title ?? "";
            token.addAttributes({ href: ref.url, title: title });
        } else {
            this._unresolvedRefs.set(label, token);
        }
    }

    hasFootNote(label: string): boolean {
        return this._footnotes.get(normalizeString(label)) != undefined;
    }

    registerFootnoteDef(
        label: string,
        destination: Token,
        onNumResolved: (footnoteNumber: number) => void,
    ) {
        label = normalizeString(label);
        destination.addAttribute("id", `def-${label}`);

        if (this._footnotes.get(label) != undefined) return;

        this._footnotes.set(label, {
            token: destination,
            onNumResolved,
        });

        let token = this._unresolvedFootnotes.get(label);
        if (token) {
            token.addAttribute("href", `#def-${label}`);
            this._unresolvedRefs.delete(label);
            const num = this._footnoteNumbers.get(label);
            if (num) {
                console.log("def");
                onNumResolved(num);
            } else {
                assert(false, `number for footnote ${label} should be determined`);
            }
        }
    }

    resolveFootnoteRef(label: string, fnToken: Token): number {
        label = normalizeString(label);
        let number = this._footnoteNumbers.get(label);
        const numAlreadyResolved = number != undefined;
        number ??= this.footnoteCount++;
        this._footnoteNumbers.set(label, number);
        fnToken.addAttribute("id", "ref-" + label);
        let fnRef = this._footnotes.get(label);
        if (fnRef) {
            fnToken.addAttribute("href", `#def-${label}`);
            if (!numAlreadyResolved) {
                fnRef.onNumResolved(number);
            }
        } else {
            this._unresolvedFootnotes.set(label, fnToken);
        }

        return number;
    }

    registerHeading(text: string, level: number, lineNumber: number, token: Token) {
        const id = normalizeString(text);
        let count = this._headingIds.get(id) ?? 0;
        let uniqueId;
        if (count > 0) {
            uniqueId = `${id}-${count}`;
        } else {
            uniqueId = id;
        }
        this._headings.push({ text, level, lineNumber, token, id: uniqueId });
        count++;
        this._headingIds.set(id, count);

        token.addAttribute("id", uniqueId);
    }
}
