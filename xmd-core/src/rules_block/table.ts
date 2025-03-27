import { listenerCount } from "process";
import { InputState } from "../input_state.js";
import { ParsingStateBlock, StateChange } from "../parsing_state.js";
import { BlockToken, Token } from "../token.js";
import BlockRule from "./blockrule.js";
import { pairs, tupleWindow as tuplesWindow } from "../util.js";

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
        const matches = [...tableHeaderLine.matchAll(/\|/g)].map((m) => m.index);
        const headerColumns = [...tuplesWindow(matches)].map((tp) => {
            const [l, r] = tp;
            let columnContent = tableHeaderLine.slice(l + 1, r);
            return columnContent.trim();
        });

        tableElems.push(
            BlockToken.createOpening("table", input.currentPoint, Table.name),
        );
        tableElems.push(BlockToken.createOpening("tr", input.currentPoint, Table.name));

        headerColumns.forEach((c) => {
            const th = BlockToken.createWrapped("th", input.currentPoint, Table.name, c);
            tableElems.push(th);
        });

        tableElems.push(BlockToken.createClosing("tr", input.currentPoint, Table.name));

        let headerSeparatorLine = input.nextLine();
        if (!headerSeparatorLine) return false;

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
            const matches = [...lineStr.matchAll(/\|/g)].map((m) => m.index);
            if (matches.length < 3) break;
            const columns = [...tuplesWindow(matches)].map((tp) => {
                const [l, r] = tp;
                let columnContent = lineStr.slice(l + 1, r);
                return columnContent.trim();
            });

            columns.forEach((c) => {
                const th = BlockToken.createWrapped(
                    "td",
                    input.currentPoint,
                    Table.name,
                    c,
                );
                tableElems.push(th);
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
