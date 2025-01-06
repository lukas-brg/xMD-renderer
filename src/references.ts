import { makeIdString, trailingWhiteSpaces } from "./string_utils";
import { InlineToken, Token } from "./token";

type Reference = {
    label: string;
    url: string;
    title?: string;
};

type FootnoteRef = {
    token: Token;
    callback: (footnoteNumber: number) => void;
};

export class ReferenceManager {
    private _references: Map<string, Reference>;
    private _footnotes: Map<string, FootnoteRef>;
    private _footnoteNumbers: Map<string, number>;
    private _unresolvedFootnotes: Map<string, Token>;
    private _unresolvedRefs: Map<string, Token>;
    private footnoteCount: number;
    constructor() {
        this._references = new Map();
        this._footnotes = new Map();
        this._unresolvedFootnotes = new Map();
        this._unresolvedRefs = new Map();
        this.footnoteCount = 1;
        this._footnoteNumbers = new Map();
    }

    registerReference(label: string, url: string, title?: string) {
        this._references.set(label, { label, url, title });

        let token = this._unresolvedRefs.get(label);
        if (token) {
            token.addAttributes({ href: url, title: title ?? "" });
            this._unresolvedRefs.delete(label);
        }
    }

    registerFootnote(
        label: string,
        destination: Token,
        callback: (footnoteNumber: number) => void,
    ) {
        label = makeIdString(label);
        destination.addAttribute("id", `ref-${label}`);
        this._footnotes.set(label, { token: destination, callback });

        let token = this._unresolvedFootnotes.get(label);
        if (token) {
            token.addAttribute("href", `#ref-${label}`);
            this._unresolvedRefs.delete(label);
        }
    }

    resolveFootnote(label: string, fnToken: Token): number {
        label = makeIdString(label);
        let number = this._footnoteNumbers.get(label) ?? this.footnoteCount++;
        this._footnoteNumbers.set(label, number);

        let fnRef = this._footnotes.get(label);
        if (fnRef) {
            fnToken.addAttribute("href", `#ref-${label}`);
            fnRef.callback(number);
        } else {
            this._unresolvedFootnotes.set(label, fnToken);
        }

        return number;
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
}
