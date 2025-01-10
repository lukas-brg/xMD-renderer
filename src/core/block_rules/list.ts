import { Token, BlockToken } from "../token.js";
import { InputState, Point } from "../input_state.js";
import { ParsingStateBlock, StateChange } from "../parsing_state.js";
import BlockRule from "./blockrule.js";
import { processTerminations } from "../parser.js";
import { leadingWhitespaces } from "../string_utils.js";

type ListTag = "ol" | "ul";

class ListManager {
    openedLists: [number, ListTag][];
    stateChange: StateChange;
    lastDepth: number;
    lastTag: ListTag;

    constructor(
        stateChange: StateChange,
        depth: number,
        tag: ListTag,
        currentPoint: Point,
    ) {
        this.openedLists = [];
        this.stateChange = stateChange;
        this.lastTag = "ul";
        this.lastDepth = 0;
        this.openList(depth, tag, currentPoint);
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
        this.lastTag = this.openedLists[0][1];
        this.lastDepth = this.openedLists[0][0];
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
        this.lastTag = newTag;
        this.lastDepth = depth;
    }

    openList(depth: number, tag: ListTag, currentPoint: Point) {
        this.stateChange.addBlockToken(
            BlockToken.createContentless(tag, currentPoint, List.name, "open", depth),
        );

        this.openedLists.push([depth, tag]);
        this.lastTag = tag;
        this.lastDepth = depth;
    }
}

function processListItemContent(
    input: InputState,
    state: ParsingStateBlock,
    stateChange: StateChange,
    listManager: ListManager,
): string | null {
    let line = input.currentLine().trim().substring(2);
    let content = [line];
    while (true) {
        let nextLine = input.peekLine();
        if (nextLine == null) break;
        if (input.isEmptyLine(1)) break;
        nextLine = nextLine.trim();
        let nextTag = getListTag(nextLine);
        if (nextTag) break;

        // check if list item is terminated by another rule
        let didTerminate = processTerminations(input, state, stateChange, true, () => {
            stateChange.addBlockToken(
                BlockToken.createText(input.currentPoint, List.name, content.join(" ")),
            );
            stateChange.addBlockToken(
                BlockToken.createContentless(
                    "li",
                    input.currentPoint,
                    List.name,
                    "close",
                    listManager.lastDepth + 1,
                ),
            );
            listManager.closeAll(input.currentPoint);
        });
        if (didTerminate) {
            return null;
        }

        content.push(nextLine);

        input.nextLine();
    }
    return content.join(" ");
}

function handleListTermination(input: InputState, listManger: ListManager): boolean {
    input.skipToFirstNonEmptyLine();

    const line = input.currentLine();
    const tag = getListTag(line);
    const depth = getDepth(line);
    const prevDepth = listManger.lastDepth;
    const prevTag = listManger.lastTag;

    if (!tag) return false;
    if (depth > prevDepth) {
        listManger.openList(depth, tag, input.currentPoint);
    } else if (depth == prevDepth && tag !== prevTag) {
        listManger.closeAndOpen(input.currentPoint, tag, depth);
    } else if (depth < prevDepth) {
        listManger.closeUntil(input.currentPoint, depth);
    }

    return true;
}

export const List: BlockRule = {
    name: "list",
    process: (
        input: InputState,
        state: Readonly<ParsingStateBlock>,
        stateChange: StateChange,
    ) => {
        let line: string | null = input.currentLine();
        let tag = getListTag(line);
        if (!tag) return false;
        let depth = getDepth(line);
        // open initial list
        let listManager = new ListManager(stateChange, depth, tag, input.currentPoint);
        let doContinue = true;
        do {
            doContinue = handleListTermination(input, listManager);
            if (!doContinue) break;
            openLi(stateChange, input.currentPoint, listManager);
            let content = processListItemContent(input, state, stateChange, listManager);

            if (!content) return true; // li was terminated by another rule

            stateChange.addBlockToken(
                BlockToken.createText(
                    input.currentPoint,
                    List.name,
                    content,
                    listManager.lastDepth + 1,
                ),
            );
            closeLi(stateChange, input.currentPoint, listManager);
        } while ((line = input.nextLine()) != null);

        listManager.closeAll(input.currentPoint);

        return true;
    },
};

function openLi(stateChange: StateChange, pos: Point, listManager: ListManager) {
    stateChange.addBlockToken(
        BlockToken.createContentless(
            "li",
            pos,
            List.name,
            "open",
            listManager.lastDepth + 1,
        ),
    );
}
function closeLi(stateChange: StateChange, pos: Point, listManager: ListManager) {
    stateChange.addBlockToken(
        BlockToken.createContentless(
            "li",
            pos,
            List.name,
            "close",
            listManager.lastDepth + 1,
        ),
    );
}

function getListTag(line: string): ListTag | null {
    const trimmed = line.trim();
    if (/^[-+*]\s/.test(trimmed)) return "ul";
    if (/^\d+\.\s/.test(trimmed)) return "ol";
    return null;
}

function getDepth(line: string) {
    return Math.floor(leadingWhitespaces(line) / 2);
}
