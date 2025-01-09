import { Token, BlockToken } from "../token.js";
import { InputState, Point } from "../input_state.js";
import { ParsingStateBlock, StateChange } from "../parsing_state.js";
import BlockRule from "./blockrule.js";
import { processTerminations } from "../parser.js";

type ListTag = "ol" | "ul";

export class ListManager {
    openedLists: [number, ListTag][];
    stateChange: StateChange;
    currentDepth: number;
    prevDepth: number;

    constructor(stateChange: StateChange) {
        this.openedLists = [];
        this.stateChange = stateChange;
        this.currentDepth = 0;
        this.prevDepth = 0;
    }

    closeAll(currentPoint: Point) {
        let item;
        while ((item = this.openedLists.pop()) != undefined) {
            this.stateChange.addBlockToken(
                BlockToken.createContentless(
                    item[1],
                    currentPoint,
                    List.name,
                    "close",
                    item[0],
                ),
            );
        }
    }

    closeUntil(currentPoint: Point, targetDepth: number) {
        while (this.openedLists.length > 1) {
            const [topDepth, topTag] = this.openedLists.pop()!;
            if (topDepth >= targetDepth) {
                this.stateChange.addBlockToken(
                    BlockToken.createContentless(
                        topTag,
                        currentPoint,
                        List.name,
                        "close",
                        topDepth,
                    ),
                );
            } else if (topDepth < targetDepth) {
                break;
            }
        }
    }

    closeAndOpen(currentPoint: Point, newTag: ListTag, depth: number) {
        const [topDepth, topTag] = this.openedLists.pop()!;

        this.stateChange.addBlockToken(
            BlockToken.createContentless(
                topTag,
                currentPoint,
                List.name,
                "close",
                topDepth,
            ),
        );
        this.stateChange.addBlockToken(
            BlockToken.createContentless(newTag, currentPoint, List.name, "open", depth),
        );
        this.openedLists.push([depth, newTag]);
    }

    openList(depth: number, tag: ListTag, currentPoint: Point) {
        this.stateChange.addBlockToken(
            BlockToken.createContentless(tag, currentPoint, List.name, "open", depth),
        );

        this.openedLists.push([depth, tag]);
    }
}

function processListItemContent(
    input: InputState,
    state: ParsingStateBlock,
    stateChange: StateChange,
    depth: number,
    listManager: ListManager,
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
            listManager.closeAll(input.currentPoint);
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
    listManager: ListManager,
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
            listManager,
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
    depth: number,
    prevDepth: number,
    tag: ListTag,
    prevTag: string,
    listManger: ListManager,
) {
    if (depth > prevDepth) {
        listManger.openList(depth, tag, input.currentPoint);
    } else if (depth == prevDepth && tag !== prevTag) {
        listManger.closeAndOpen(input.currentPoint, tag, depth);
    } else if (depth < prevDepth) {
        listManger.closeUntil(input.currentPoint, depth);
    }
}

export const List: BlockRule = {
    name: "list",
    process: (
        input: InputState,
        state: Readonly<ParsingStateBlock>,
        stateChange: StateChange,
    ) => {
        let listManger = new ListManager(stateChange);

        let [point, firstLine] = input.lineSkipWhiteSpaces();
        let prevTag = getListTag(firstLine);

        if (!prevTag) return false;

        let prevDepth = Math.floor((point.column - 1) / 2);
        const initialDepth = prevDepth;
        let depths: [number, ListTag][] = [[initialDepth, prevTag]];

        listManger.openList(prevDepth, prevTag, input.currentPoint);
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
            handleListTermination(input, depth, prevDepth, tag, prevTag, listManger);
            let didTerminate = processListItems(
                input,
                state,
                stateChange,
                depth,
                tag,
                depths,
                listManger,
            );

            if (didTerminate) {
                return true;
            }
            prevTag = tag;
            prevDepth = depth;
        } while ((line = input.nextLine()) != null);

        listManger.closeAll(input.currentPoint);
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
