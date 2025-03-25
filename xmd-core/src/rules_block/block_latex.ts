import { InputState } from "../input_state.js";
import { ParsingStateBlock, StateChange } from "../parsing_state.js";
import { BlockToken, BlockTokenContainer, Token } from "../token.js";
import BlockRule from "./blockrule.js";
import { toHtml } from "hast-util-to-html";
import { common, createStarryNight } from "@wooorm/starry-night";

import katex from "katex";

const starryNight = await createStarryNight(common);

export const BlockLatex: BlockRule = {
    name: "block_latex",

    process: (
        input: InputState,
        state: Readonly<ParsingStateBlock>,
        stateChange: StateChange,
    ) => {
        let line = input.currentLine();
        if (!line.startsWith("$$")) return false;
        const start = input.currentPoint;

        let latexLines: string[] = [];
        latexLines.push(line.trim());
        if (line.length === 2) {
            while (input.hasNext()) {
                line = input.nextLine()!;
                latexLines.push(line);
                if (line.endsWith("$$")) break;
            }
        }

        let latexCode = latexLines.join("\n");
        latexCode = latexCode.trim().slice(2, -2);
        const html = katex.renderToString(latexCode, {
            displayMode: true,
        });
        stateChange.addToken(
            BlockToken.createPreservedText(start, BlockLatex.name, html),
        );
        input.nextLine();
        return true;
    },
};
