import { InputState } from "../input_state.js";
import { ParsingStateBlock, StateChange } from "../parsing_state.js";
import { BlockToken, Token } from "../token.js";
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
        stateChange.addBlockToken(
            BlockToken.createContentless(
                "pre",
                input.currentPoint,
                CodeblockFenced.name,
                "open",
                1,
            ),
        );

        stateChange.addBlockToken(
            BlockToken.createContentless(
                "code",
                input.currentPoint,
                CodeblockFenced.name,
                "open",
            )
                .withAttribute("class", `${langStr}`)
                .withAnnotation("codeblock"),
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

        stateChange.addBlockToken(
            BlockToken.createPreservedText(
                input.currentPoint,
                CodeblockFenced.name,
                codeContent,
            ),
        );

        stateChange.addBlockToken(
            BlockToken.createContentless(
                "code",
                input.currentPoint,
                CodeblockFenced.name,
                "close",
            ),
        );
        stateChange.addBlockToken(
            BlockToken.createContentless(
                "pre",
                input.currentPoint,
                CodeblockFenced.name,
                "close",
                1,
            ),
        );
        input.nextLine();
        return true;
    },
};
