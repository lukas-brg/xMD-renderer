import { InputState } from "../input_state.js";
import { ParsingStateBlock, StateChange } from "../parsing_state.js";
import { BlockToken, BlockTokenContainer, Token } from "../token.js";
import BlockRule from "./blockrule.js";
import { toHtml } from "hast-util-to-html";
import { common, createStarryNight } from "@wooorm/starry-night";

const starryNight = await createStarryNight(common);

export const CodeblockFenced: BlockRule = {
    name: "codeblock_fenced",

    process: (
        input: InputState,
        state: Readonly<ParsingStateBlock>,
        stateChange: StateChange,
    ) => {
        const line = input.currentLine();
        stateChange.document = state.document;
        if (!line.startsWith("```")) return false;
        let langStr = line.substring(3).trim();

        let codeContainer = new BlockTokenContainer(
            ["pre", "code"],
            input.currentPoint,
            CodeblockFenced.name,
            false,
        );

        let codeLines: string[] = [];
        while (input.hasNext() && !input.nextLine()?.startsWith("```")) {
            codeLines.push(input.currentLine());
        }
        let codeContent = codeLines.join("\n");

        if (!input.hasNext()) {
            console.warn(
                `Warning: Unclosed codeblock line ${stateChange.startPoint.line} - ${input.currentPoint.line}`,
            );
        }

        if (langStr != "") {
            try {
                const scope = starryNight.flagToScope(langStr);
                // @ts-ignore
                const tree = starryNight.highlight(codeContent, scope);
                codeContent = toHtml(tree);
            } catch {}
        }

        codeContainer.addBlockToken(
            BlockToken.createPreservedText(
                input.currentPoint,
                CodeblockFenced.name,
                codeContent,
            ),
        );

        stateChange.addBlockToken(codeContainer);
        input.nextLine();
        return true;
    },
};
