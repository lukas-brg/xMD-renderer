import { InputState, Point } from "./input_state.js";
import { ruleSet } from "./rules.js";
import {
    createParsedBlock,
    ParsingStateBlock,
    ParsingStateInline,
    StateChange,
} from "./parsing_state.js";
import { BlockToken, InlineToken } from "./token.js";
import { Range } from "./util.js";

export function processTerminations(
    input: InputState,
    state: ParsingStateBlock,
    stateChange: StateChange,
    applyStateChange: boolean = true,
    onTermination: () => void,
): boolean {
    const terminatedBy = ruleSet.block[stateChange.executedBy].terminatedBy;
    let newStateChange = StateChange.fromState(stateChange, input.currentPoint);

    for (const ruleObj of terminatedBy) {
        const success = ruleObj.process(input, state, newStateChange);
        if (success) {
            stateChange.executedBy = ruleObj.name;
            onTermination();

            if (applyStateChange) {
                stateChange.applyToState(state, input);
            }

            newStateChange.applyToState(state, input);
            return true;
        }
    }
    return false;
}

function parseBlocks(doc: InputState, state: ParsingStateBlock) {
    doc.nextLine();
    outer: while (!doc.isAtEof()) {
        const line = doc.currentLine();
        if (doc.isEmptyLine()) {
            doc.nextLine();
            continue;
        }
        let ruleApplied = false;
        for (let [ruleName, rule] of Object.entries(ruleSet.block)) {
            rule.handlerObj.terminatedBy = rule.terminatedBy;
            let stateChange = StateChange.fromState(state, doc.currentPoint, ruleName);
            let success = rule.handlerObj.process(doc, state, stateChange);
            if (success) {
                if (!stateChange.wasApplied) {
                    stateChange.applyToState(state, doc);
                    continue outer;
                }
            }
        }
    }
    if (state._footerTokens.length > 0) {
        state.blockTokens.push(
            BlockToken.createSelfClosing("hr", doc.currentPoint, "parser"),
        );

        state.blockTokens = state.blockTokens.concat(state._footerTokens);
        state.appliedTokens.push([
            "footer",
            [
                BlockToken.createSelfClosing("hr", doc.currentPoint, "parser"),
                ...state._footerTokens,
            ],
        ]);
    }
}

function parseInline(state: ParsingStateBlock) {
    let references = state.document;
    for (let blockTok of state.blockTokens) {
        const line = blockTok.content;
        if (line) {
            if (blockTok.parseContent) {
                let inlineState = new ParsingStateInline(
                    line,
                    blockTok.relatedPosition,
                    references,
                );
                let anyRuleApplies = false;

                for (let [ruleName, rule] of Object.entries(ruleSet.inline)) {
                    let success = rule.handlerObj.process(inlineState);
                    anyRuleApplies = anyRuleApplies || success;
                }

                if (!anyRuleApplies) {
                    blockTok.inlineTokens.push(InlineToken.createText(0, "parser", line));
                    continue;
                }

                let inlineTokens: InlineToken[] = [];

                let continousText = "";
                let textStart = 0;
                let i = 0;

                while (i < line.length) {
                    const tok = inlineState.tokens.get(i);
                    if (tok) {
                        if (continousText.length > 0) {
                            inlineTokens.push(
                                InlineToken.createText(
                                    textStart,
                                    "parser",
                                    continousText,
                                ),
                            );
                        }
                        inlineTokens.push(tok);
                        i = tok.positionEnd;
                        continousText = "";
                        textStart = i;
                    } else {
                        const c = inlineState.charAt(i);

                        continousText += c.length == 1 ? c : "";
                        i++;
                    }
                }

                if (continousText.length > 0) {
                    inlineTokens.push(
                        InlineToken.createText(textStart, "parser", continousText),
                    );
                }
                blockTok.inlineTokens = inlineTokens;
            } else {
                blockTok.inlineTokens.push(
                    InlineToken.createText(
                        blockTok.relatedPosition.column,
                        "parser",
                        line,
                    ),
                );
            }
        }
    }
}

export function parse(doc: InputState) {
    let state = new ParsingStateBlock();
    if (doc.isEmpty) {
        const range = new Range(doc.fragmentOffset, doc.fragmentOffset);
        const emptyBlock = createParsedBlock({
            id: `markdown-block-${doc.fragmentOffset}-${doc.fragmentOffset}`,
            text: "",
            range: range,
            createdBy: "empty",
            tokens: [],
            footnotes: [],
            refs: [],
        });
        state.blocks.push(emptyBlock);
        return state;
    }

    parseBlocks(doc, state);
    parseInline(state);
    return state;
    // console.log(state.tokens.filter((t) => t.tagKind == "open" || t.tagKind == "close"));
    // console.log(state.tokens);
}
