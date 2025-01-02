import { MdInput, Point } from "./mdinput";
import { parse } from "./parser";
import { Heading, UnorderedList } from "./rules";

function renderFile(filePath: string) {
    let rules = [Heading, UnorderedList];
    let doc = MdInput.fromFile(filePath);
    parse(doc, rules);
}

renderFile("test.md");
