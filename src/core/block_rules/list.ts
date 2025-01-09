import { Token, BlockToken } from "../token.js";
import { InputState } from "../input_state.js";
import { ParsingStateBlock, StateChange } from "../parsing_state.js";
import BlockRule from "./blockrule.js";
import { processTerminations } from "../parser.js";

type ListTag = "ol" | "ul";

function processListItemContent(
    input: InputState,
    state: ParsingStateBlock,
    stateChange: StateChange,
    depth: number,
    depths: [number, ListTag][],
): boolean {
    let line = input.currentLine().trim().substring(2);
    stateChange.addBlockToken(BlockToken.createText(input.currentPoint, List.name, line));
    while (true) {
        let nextLine = input.peekLine();
        if (nextLine == null) return false;
        if (input.isEmptyLine(1)) return false;
        nextLine = nextLine.trim();
        let nextTag = getListTag(nextLine);
        if (nextTag) return false;

        // check if list item is terminated by another rule
        let didTerminate = processTerminations(input, state, stateChange, true, () => {
            stateChange.addBlockToken(
                BlockToken.createContentless(
                    "li",
                    input.currentPoint,
                    List.name,
                    "close",
                    depth + 1,
                ),
            );
            let item;
            while ((item = depths.pop()) != undefined) {
                stateChange.addBlockToken(
                    BlockToken.createContentless(
                        item[1],
                        input.currentPoint,
                        List.name,
                        "close",
                        item[0],
                    ),
                );
            }
        });
        if (didTerminate) {
            return true;
        }

        stateChange.addBlockToken(
            BlockToken.createText(input.currentPoint, List.name, nextLine),
        );

        input.nextLine();
    }
}

function processListItems(
    input: InputState,
    state: ParsingStateBlock,
    stateChange: StateChange,
    depth: number,
    tag: string,
    depths: [number, ListTag][],
): boolean {
    do {
        const [{ column }, lineTrimmed] = input.lineSkipWhiteSpaces();
        const content = lineTrimmed.substring(2).trim();

        stateChange.addBlockToken(
            BlockToken.createContentless(
                "li",
                input.currentPoint,
                List.name,
                "open",
                depth + 1,
            ),
        );

        let didTerminate = processListItemContent(
            input,
            state,
            stateChange,
            depth,
            depths,
        );

        if (didTerminate) {
            return true;
        } else {
            stateChange.addBlockToken(
                BlockToken.createContentless(
                    "li",
                    input.currentPoint,
                    List.name,
                    "close",
                    depth + 1,
                ),
            );
        }
        const nextLine = input.peekLine();
        if (nextLine == null) return false;
        if (input.isEmptyLine()) return false;

        let nextTag = getListTag(nextLine);
        const [{ column: nextColumn }, _] = input.lineSkipWhiteSpaces(1);
        const nextDepth = Math.floor((nextColumn - 1) / 2);
        if (nextDepth != depth) return false;
    } while (input.nextLine());
    return false;
}

function handleListTermination(
    input: InputState,
    stateChange: StateChange,
    depth: number,
    prevDepth: number,
    tag: ListTag,
    prevTag: string,
    depths: [number, ListTag][],
) {
    if (depth > prevDepth) {
        stateChange.addBlockToken(
            BlockToken.createContentless(
                tag,
                input.currentPoint,
                List.name,
                "open",
                depth,
            ),
        );
        depths.push([depth, tag]);
    } else if (depth == prevDepth && tag !== prevTag) {
        const [topDepth, topTag] = depths.pop()!;
        if (topDepth >= depth) {
            stateChange.addBlockToken(
                BlockToken.createContentless(
                    topTag,
                    input.currentPoint,
                    List.name,
                    "close",
                    topDepth,
                ),
            );
            stateChange.addBlockToken(
                BlockToken.createContentless(
                    tag,
                    input.currentPoint,
                    List.name,
                    "open",
                    depth,
                ),
            );
            depths.push([depth, tag]);
        }
    } else if (depth < prevDepth) {
        while (depths.length > 1) {
            const [topDepth, topTag] = depths.pop()!;
            if (topDepth >= depth) {
                stateChange.addBlockToken(
                    BlockToken.createContentless(
                        topTag,
                        input.currentPoint,
                        List.name,
                        "close",
                        topDepth,
                    ),
                );
            } else if (topDepth <= depth) {
                break;
            }
        }
    }
}

export const List: BlockRule = {
    name: "list",
    process: (
        input: InputState,
        state: Readonly<ParsingStateBlock>,
        stateChange: StateChange,
    ) => {
        let [point, firstLine] = input.lineSkipWhiteSpaces();
        let prevTag = getListTag(firstLine);
        if (!prevTag) return false;

        let prevDepth = Math.floor((point.column - 1) / 2);
        const initialDepth = prevDepth;
        let depths: [number, ListTag][] = [[initialDepth, prevTag]];

        stateChange.addBlockToken(
            BlockToken.createContentless(
                prevTag,
                input.currentPoint,
                List.name,
                "open",
                prevDepth,
            ),
        );
        let line;
        do {
            if (input.isEmptyLine()) {
                continue;
            }
            const [point, lineTrimmed] = input.lineSkipWhiteSpaces();
            let tag = getListTag(lineTrimmed);
            if (!tag) {
                break;
            }
            const spaces = point.column - 1;
            const depth = Math.floor(spaces / 2);
            handleListTermination(
                input,
                stateChange,
                depth,
                prevDepth,
                tag,
                prevTag,
                depths,
            );
            let didTerminate = processListItems(
                input,
                state,
                stateChange,
                depth,
                tag,
                depths,
            );

            if (didTerminate) {
                return true;
            }
            prevTag = tag;
            prevDepth = depth;
        } while ((line = input.nextLine()) != null);

        for (let i = depths.length - 1; i >= 0; i--) {
            const [topDepth, topTag] = depths[i];
            stateChange.addBlockToken(
                BlockToken.createContentless(
                    topTag,
                    input.currentPoint,
                    List.name,
                    "close",
                    topDepth,
                ),
            );
        }
        stateChange.endPoint = input.currentPoint;
        return true;
    },
};

function getListTag(line: string): ListTag | null {
    const trimmed = line.trim();
    if (/^[-+*]\s/.test(trimmed)) return "ul";
    if (/^\d+\.\s/.test(trimmed)) return "ol";
    return null;
}
