import { InputState, Point } from "./input_state.js";
import { rules } from "./rules.js";
import { ParsingStateBlock, ParsingStateInline } from "./parsing_state.js";
import { InlineToken } from "./token.js";

function parseBlocks(doc: InputState, state: ParsingStateBlock) {
    let line;

    while ((line = doc.nextLine()) != null) {
        for (let [ruleName, rule] of Object.entries(rules.block)) {
            rule.handlerObj.terminatedBy = rule.terminatedBy;
            let stateChange = rule.handlerObj.process(doc, state);
            //console.log(line);
            if (stateChange) {
                if (!stateChange.success) {
                    switch (rule.failureMode) {
                        case "applyPartially":
                            stateChange.applyToState(state);
                            break;
                        case "plaintext":
                            stateChange.revertInput(doc);
                            break;
                        case "ignore":
                            break;
                    }
                } else {
                    stateChange.applyToState(state);
                    break;
                }
            }
            if (!doc.hasNext()) break;
        }
    }
}

function parseInline(state: ParsingStateBlock) {
    for (let blockTok of state.blockTokens) {
        const line = blockTok.content;
        if (line) {
            if (blockTok.parseContent) {
                let inlineState = new ParsingStateInline(line, blockTok.relatedPosition);
                let anyRuleApplies = false;

                for (let [ruleName, rule] of Object.entries(rules.inline)) {
                    let success = rule.handlerObj.process(inlineState);
                    anyRuleApplies = anyRuleApplies || success;
                }

                if (!anyRuleApplies) {
                    blockTok.inlineTokens.push(InlineToken.createText(0, line));
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
                                InlineToken.createText(textStart, continousText),
                            );
                        }
                        inlineTokens.push(tok);
                        i = tok.positionEnd;
                        continousText = "";
                        textStart = i;
                    } else {
                        continousText += line.charAt(i);
                        i++;
                    }
                }

                if (continousText.length > 0) {
                    inlineTokens.push(InlineToken.createText(textStart, continousText));
                }
                blockTok.inlineTokens = inlineTokens;
            } else {
                blockTok.inlineTokens.push(
                    InlineToken.createText(blockTok.relatedPosition.column, line),
                );
            }
        }
    }
}

export function parse(doc: InputState) {
    let state = new ParsingStateBlock();
    parseBlocks(doc, state);
    parseInline(state);
    return state;
    // console.log(state.tokens.filter((t) => t.tagKind == "open" || t.tagKind == "close"));
    // console.log(state.tokens);
}
