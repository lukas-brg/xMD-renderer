import BlockRule from "./blockrules/blockrule.js";
import { CodeblockFenced } from "./blockrules/codeblock.js";
import { Heading } from "./blockrules/heading.js";
import { UnorderedList } from "./blockrules/list.js";
import { Paragraph } from "./blockrules/paragraph.js";
import { Code } from "./inline_rules/code.js";
import { Emphasis } from "./inline_rules/emphasis.js";
import { Escape } from "./inline_rules/escape.js";
import InlineRule from "./inline_rules/inline_rule.js";
import { AutoLink, Link } from "./inline_rules/link.js";

type FailureMode = "plaintext" | "applyPartially" | "ignore";

type BlockRuleEntry = {
    handlerObj: BlockRule;
    terminatedBy: BlockRule[];
    failureMode: FailureMode;
};

type BlockRuleList = { [name: string]: BlockRuleEntry };

type InlineRuleEntry = {
    handlerObj: InlineRule;
};

type InlineRuleList = { [name: string]: InlineRuleEntry };

const blockRules: BlockRuleList = {
    codeblock_fenced: {
        handlerObj: CodeblockFenced,
        terminatedBy: [],
        failureMode: "plaintext",
    },

    heading: {
        handlerObj: Heading,
        terminatedBy: [],
        failureMode: "applyPartially",
    },
    unordered_list: {
        handlerObj: UnorderedList,
        terminatedBy: [],
        failureMode: "applyPartially",
    },
    paragraph: {
        handlerObj: Paragraph,
        terminatedBy: [Heading, UnorderedList, CodeblockFenced],
        failureMode: "applyPartially",
    },
};

const inlineRules: InlineRuleList = {
    escape: {
        handlerObj: Escape,
    },
    code: {
        handlerObj: Code,
    },
    link: {
        handlerObj: Link,
    },
    autolink: {
        handlerObj: AutoLink,
    },
    emphasis: {
        handlerObj: Emphasis,
    },
};

export const rules = {
    inline: inlineRules,
    block: blockRules,
};
