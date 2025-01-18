import { Token, BlockToken } from "../token.js";
import { InputState, Point } from "../input_state.js";
import { ParsingStateBlock, StateChange } from "../parsing_state.js";
import BlockRule from "./blockrule.js";
import { processTerminations } from "../parser.js";
import { leadingWhitespaces } from "../string_utils.js";

type ListTag = "ol" | "ul";

class ListManager {
    /**  Contains [depth, tag, marker] for each opened list */
    openedLists: [number, ListTag, string][];
    stateChange: StateChange;
    lastDepth: number;
    lastTag: ListTag;
    lastMarker: string;

    constructor(
        stateChange: StateChange,
        depth: number,
        tag: ListTag,
        marker: string,
        currentPoint: Point,
    ) {
        this.openedLists = [];
        this.stateChange = stateChange;
        this.lastTag = "ul";
        this.lastDepth = 0;
        this.lastMarker = marker;
        this.openList(depth, tag, marker, currentPoint);
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

        [this.lastDepth, this.lastTag, this.lastMarker] =
            this.openedLists[this.openedLists.length - 1];
    }

    closeAndOpen(depth: number, tag: ListTag, marker: string, currentPoint: Point) {
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
        this.openList(depth, tag, marker, currentPoint);
    }

    openList(depth: number, tag: ListTag, marker: string, currentPoint: Point) {
        this.stateChange.addBlockToken(
            BlockToken.createContentless(tag, currentPoint, List.name, "open", depth),
        );

        this.openedLists.push([depth, tag, marker]);
        this.lastTag = tag;
        this.lastDepth = depth;
        this.lastMarker = marker;
    }

    addListItem(content: string, pos: Point) {
        this.stateChange.addBlockToken(
            BlockToken.createWrapped("li", pos, List.name, content, this.lastDepth + 1),
        );
    }
}

/** Returns `null` if the list was terminated by another blockrule,
 * otherwhise it returns the whole (potentially) multi-line content of one list item */
function getListItemContent(
    input: InputState,
    state: ParsingStateBlock,
    stateChange: StateChange,
    listManager: ListManager,
): string | null {
    let { content: remainingLine } = getListItemData(input.currentLine());
    let content = [remainingLine];
    while (true) {
        let nextLine = input.peekLine();
        if (nextLine == null) break;
        if (input.isEmptyLine(1)) break;
        nextLine = nextLine.trim();
        let { tag: nextTag } = getListItemData(nextLine);
        if (nextTag) break;

        // check if list item is terminated by another rule
        let didTerminate = processTerminations(input, state, stateChange, true, () => {
            listManager.addListItem(content.join(" "), input.currentPoint);
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

/** Returns false if the whole list ends and handles indentation levels  */
function handleListTermination(input: InputState, listManger: ListManager): boolean {
    if (!input.skipToFirstNonEmptyLine()) {
        return false;
    }
    const { tag, depth, marker } = getListItemData(input.currentLine());
    const prevDepth = listManger.lastDepth;
    const prevTag = listManger.lastTag;
    const prevMarker = listManger.lastMarker;
    if (!tag) return false;

    if (depth > prevDepth) {
        listManger.openList(depth, tag, marker, input.currentPoint);
    } else if (
        depth == prevDepth &&
        (tag !== prevTag || (tag == "ul" && marker != prevMarker))
    ) {
        listManger.closeAndOpen(depth, tag, marker, input.currentPoint);
    } else if (depth < prevDepth) {
        listManger.closeUntil(input.currentPoint, depth);
        // if the list has a different marker than before on the indentation level,
        // create a new list on the current level
        if (tag == "ul" && marker != listManger.lastMarker) {
            listManger.closeAndOpen(depth, tag, marker, input.currentPoint);
        }
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
        const { tag, depth, marker } = getListItemData(line);
        if (!tag) return false;

        // prettier-ignore
        let listManager = new ListManager(
            stateChange, depth, tag, marker, input.currentPoint,
        );

        do {
            let doContinue = handleListTermination(input, listManager);
            if (!doContinue) break;

            let content = getListItemContent(input, state, stateChange, listManager);
            if (content == null) return true; // li was terminated by another rule

            listManager.addListItem(content, input.currentPoint);
        } while ((line = input.nextLine()) != null);

        listManager.closeAll(input.currentPoint);
        return true;
    },
};

function getListItemData(line: string): {
    tag: ListTag | null;
    depth: number;
    marker: string;
    content: string;
} {
    let tag: ListTag | null = null;
    const trimmed = line.trim();
    if (/^[-+*](?:\s|$)/.test(trimmed)) tag = "ul";
    if (/^\d+\.(?:\s|$)/.test(trimmed)) tag = "ol";
    if (!tag) return { tag: null, depth: 0, marker: "", content: "" };

    const depth = Math.floor(leadingWhitespaces(line) / 2);
    const [marker, content] = trimmed.split(/\s+(.*)/, 2);

    return { tag, depth, marker, content };
}
