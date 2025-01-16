import { Point } from "./input_state";
import { ParsingStateBlock, ParsingStateInline } from "./parsing_state";

export function warnInline(
    msg: string,
    inlineState: ParsingStateInline,
    column?: number,
) {
    let warning = `Warning: ${msg}\nLine ${inlineState.relatedPoint.line}`;

    if (column != undefined && column != null) {
        warning += `  Col.: ${column + 1}`;
        warning += '    "' + inlineState.line.substring(column) + '"';
    } else {
        warning += '    "' + inlineState.line + '"';
    }

    console.warn(warning);
}


export function warn(msg: string) {
    console.log(`Warning: ${msg}`)
}