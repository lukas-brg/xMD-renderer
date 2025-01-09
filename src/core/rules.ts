import BlockRule from "./block_rules/blockrule.js";
import { CodeblockFenced } from "./block_rules/codeblock.js";
import { FootnoteDef } from "./block_rules/footnote_def.js";
import { Heading } from "./block_rules/heading.js";
import { List } from "./block_rules/list.js";
import { Paragraph } from "./block_rules/paragraph.js";
import { Code } from "./inline_rules/code.js";
import { Emphasis } from "./inline_rules/emphasis.js";
import { Escape } from "./inline_rules/escape.js";
import { FootnoteRef } from "./inline_rules/footnote_ref.js";
import InlineRule from "./inline_rules/inline_rule.js";
import {
    AutoLink,
    BracketLink,
    Link,
    ReferenceLink,
    ReferenceLinkDefinition,
} from "./inline_rules/link.js";
import { Dict } from "./util.js";

type FailureMode = "plaintext" | "applyPartially" | "ignore";

type BlockRuleEntry = {
    handlerObj: BlockRule;
    terminatedBy: BlockRule[];
    failureMode: FailureMode;
};

type InlineRuleEntry = {
    handlerObj: InlineRule;
};

type RuleSet = Dict<InlineRuleEntry> | Dict<BlockRuleEntry>;

const blockRules: RuleSet = {
    codeblock_fenced: {
        handlerObj: CodeblockFenced,
        terminatedBy: [],
        failureMode: "plaintext",
    },

    footnote_def: {
        handlerObj: FootnoteDef,
        terminatedBy: [],
        failureMode: "plaintext",
    },
    heading: {
        handlerObj: Heading,
        terminatedBy: [],
        failureMode: "applyPartially",
    },
    list: {
        handlerObj: List,
        terminatedBy: [],
        failureMode: "applyPartially",
    },
    paragraph: {
        handlerObj: Paragraph,
        terminatedBy: [Heading, List, CodeblockFenced, FootnoteDef],
        failureMode: "applyPartially",
    },
};

const inlineRules: RuleSet = {
    escape: {
        handlerObj: Escape,
    },
    code: {
        handlerObj: Code,
    },
    link: {
        handlerObj: Link,
    },
    bracket_link: {
        handlerObj: BracketLink,
    },
    footnote_ref: {
        handlerObj: FootnoteRef,
    },
    reference_link_definition: {
        handlerObj: ReferenceLinkDefinition,
    },
    reference_link_: {
        handlerObj: ReferenceLink,
    },
    autolink: {
        handlerObj: AutoLink,
    },
    emphasis: {
        handlerObj: Emphasis,
    },
};

export const ruleSet = {
    inline: inlineRules,
    block: blockRules,
};
