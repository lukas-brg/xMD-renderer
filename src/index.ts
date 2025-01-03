import { MdInput, Point } from "./mdinput";
import { parse } from "./parser";
import { Heading } from "./blockrules/heading";
import { UnorderedList } from "./blockrules/list";

function renderFile(filePath: string) {
    let doc = MdInput.fromFile(filePath);
    parse(doc);
}

renderFile("test.md");
