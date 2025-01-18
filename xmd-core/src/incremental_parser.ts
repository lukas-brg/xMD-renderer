import { parseGetBlocks } from ".";
import { InputState } from "./input_state";
import { parse } from "./parser";
import { createParsedBlock, ParsedBlock } from "./parsing_state";
import { BlockToken } from "./token";

export class IncrementalParser {
    private _blocks: ParsedBlock[];
    private _footer: BlockToken[];
    constructor() {
        this._blocks = [];
        this._footer = [];
    }

    get blocks(): ParsedBlock[] {
        return this._blocks;
    }

    get footer(): BlockToken[] {
        return this._footer;
    }

    get wholeRange(): number {
        if (this._blocks.length === 0) return 0;
        return this.lastBlock?.range.end!;
    }

    static parseInit(content: string): IncrementalParser {
        const state = parse(InputState.fromString(content));
        const incParser = new IncrementalParser();
        incParser._blocks = state.blocks;
        return incParser;
    }

    parseAll(content: string): ParsedBlock[] {
        const state = parse(InputState.fromString(content));
        this._blocks = state.blocks;
        this._footer = state._footerTokens;
        return this._blocks;
    }

    get lastBlock(): ParsedBlock | null {
        if (this._blocks.length === 0) return null;
        return this._blocks[this._blocks.length - 1];
    }

    update(change: [string, ParsedBlock]): ParsedBlock[] {
        const [content, block] = change;
        const state = parse(InputState.fromString(content, block.range.start));
        let updatedBlocks = state.blocks;

        if (updatedBlocks[0].range.start === this.lastBlock?.range.start) {
            this._blocks.splice(this.blocks.length - 1, 1, ...updatedBlocks);
        }
        return updatedBlocks;
    }
}
