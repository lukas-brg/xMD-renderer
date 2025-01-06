import { InlineToken, Token } from "./token";

type Reference = {
    label: string;
    url: string;
    title?: string;
};

export class ReferenceManager {
    private _references: Map<string, Reference>;
    private _unresolvedRefs: Map<string, Token>;

    constructor() {
        this._references = new Map();
        this._unresolvedRefs = new Map();
    }

    registerReference(label: string, url: string, title?: string) {
        this._references.set(label, { label, url, title });

        let token;
        if ((token = this._unresolvedRefs.get(label))) {
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
}
