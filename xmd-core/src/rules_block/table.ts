import { listenerCount } from "process";
import { InputState } from "../input_state.js";
import { ParsingStateBlock, StateChange } from "../parsing_state.js";
import { BlockToken, Token } from "../token.js";
import BlockRule from "./blockrule.js";
import { pairs, tupleWindows as tupleWindows, zip } from "../util.js";

function findColumnContent(line: string): string[] {
    const pipePositions = [...line.matchAll(/\|/g)].map((m) => m.index);

    // if (pipePositions.length < 3) break;
    const columns = [...tupleWindows(pipePositions)].map((tp) => {
        const [l, r] = tp;
        let columnContent = line.slice(l + 1, r);
        return columnContent.trim();
    });

    return columns;
}

export const Table: BlockRule = {
    name: "table",
    process: (
        input: InputState,
        state: Readonly<ParsingStateBlock>,
        stateChange: StateChange,
    ) => {
        let tableHeaderLine = input.currentLine().trim();
        if (!(tableHeaderLine.startsWith("|") && tableHeaderLine.endsWith("|"))) {
            return false;
        }
        let tableElems: BlockToken[] = [];

        const headerColumns = findColumnContent(tableHeaderLine);

        let headerSeparatorLine = input.nextLine();
        if (!headerSeparatorLine) return false;

        const sepColumns = findColumnContent(headerSeparatorLine);
        const alignments = sepColumns.map((s) => {
            if (s.length >= 3 && s.charAt(0) == ":" && s.charAt(s.length - 1) == ":") {
                return "center";
            } else if (s.length >= 2 && s.charAt(0) == ":") {
                return "left";
            } else if (s.length >= 2 && s.charAt(s.length - 1) == ":") {
                return "right";
            } else {
                return "left";
            }
        });

        tableElems.push(
            BlockToken.createOpening("table", input.currentPoint, Table.name),
        );
        tableElems.push(BlockToken.createOpening("tr", input.currentPoint, Table.name));

        zip(headerColumns, alignments).forEach(([c, align]) => {
            const th = BlockToken.createWrapped(
                "th",
                input.currentPoint,
                Table.name,
                c,
            ).withAttribute("style", `text-align:${align}`);

            tableElems.push(th);
        });

        tableElems.push(BlockToken.createClosing("tr", input.currentPoint, Table.name));
        let line = input.nextLine();

        do {
            if (!line) break;
            tableElems.push(
                BlockToken.createOpening("tr", input.currentPoint, Table.name),
            );
            let lineStr: string = line.trim();

            if (!lineStr.startsWith("|")) {
                lineStr = "|" + lineStr;
            }
            if (!lineStr.endsWith("|")) {
                lineStr = lineStr + "|";
            }

            const columns = findColumnContent(line);

            zip(columns, alignments).forEach(([c, align]) => {
                const td = BlockToken.createWrapped(
                    "td",
                    input.currentPoint,
                    Table.name,
                    c,
                ).withAttribute("style", `text-align:${align}`);
                tableElems.push(td);
            });

            tableElems.push(
                BlockToken.createClosing("tr", input.currentPoint, Table.name),
            );
        } while ((line = input.nextLine()) != null);

        tableElems.push(
            BlockToken.createClosing("table", input.currentPoint, Table.name),
        );

        tableElems.forEach((t) => stateChange.addToken(t));
        return true;
    },
};
