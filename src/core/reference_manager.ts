import { assert } from "console";
import { makeIdString, trailingWhiteSpaces } from "./string_utils.js";
import { InlineToken, Token } from "./token.js";

type Reference = {
    label: string;
    url: string;
    title?: string;
};

type FootnoteRef = {
    token: Token;
    onNumDetermined: (footnoteNumber: number) => void;
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

    resolveReference(label: string, token: InlineToken) {
        const ref = this._references.get(label);
        if (ref != undefined) {
            const title = ref.title ?? "";
            token.addAttributes({ href: ref.url, title: title });
        } else {
            this._unresolvedRefs.set(label, token);
        }
    }

    registerFootnoteDef(
        label: string,
        destination: Token,
        onNumDetermined: (footnoteNumber: number) => void,
    ) {
        label = makeIdString(label);
        destination.addAttribute("id", `def-${label}`);
        this._footnotes.set(label, {
            token: destination,
            onNumDetermined,
        });

        let token = this._unresolvedFootnotes.get(label);
        if (token) {
            token.addAttribute("href", `#def-${label}`);
            this._unresolvedRefs.delete(label);
            const num = this._footnoteNumbers.get(label);
            if (num) {
                onNumDetermined(num);
            } else {
                assert(false, `number for footnote ${label} should be determined`);
            }
        }
    }

    resolveFootnoteRef(label: string, fnToken: Token): number {
        label = makeIdString(label);
        let number = this._footnoteNumbers.get(label) ?? this.footnoteCount++;
        this._footnoteNumbers.set(label, number);

        let fnRef = this._footnotes.get(label);
        if (fnRef) {
            fnToken.addAttribute("href", `#def-${label}`);
            fnRef.onNumDetermined(number);
        } else {
            this._unresolvedFootnotes.set(label, fnToken);
        }

        return number;
    }
}
