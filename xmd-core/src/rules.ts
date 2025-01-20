import { DeferredState, DeferredTokenStateEntry } from "./parsing_state.js";
import BlockRule from "./rules_block/blockrule.js";
import { CodeblockFenced } from "./rules_block/codeblock.js";
import { FootnoteDef } from "./rules_block/footnote_def.js";
import { Heading } from "./rules_block/heading.js";
import { List } from "./rules_block/list.js";
import { Paragraph } from "./rules_block/paragraph.js";
import { Code } from "./rules_inline/code.js";
import { Emphasis } from "./rules_inline/emphasis.js";
import { Escape } from "./rules_inline/escape.js";
import { FootnoteRef } from "./rules_inline/footnote_ref.js";
import InlineRule from "./rules_inline/inline_rule.js";
import {
    AutoLink,
    BracketLink,
    Link,
    ReferenceLink,
    ReferenceLinkDefinition,
} from "./rules_inline/link.js";
import { Dict, MultiMap } from "./util.js";

type FailureMode = "plaintext" | "applyPartially" | "ignore";

type BlockRuleEntry = {
    handlerObj: BlockRule;
    terminatedBy: BlockRule[];
    failureMode: FailureMode;
};

type InlineRuleEntry = {
    handlerObj: InlineRule;
};

export type RuleSet = Dict<InlineRuleEntry> | Dict<BlockRuleEntry>;

export type Rule = BlockRule | InlineRule;

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
        terminatedBy: [Heading, FootnoteDef, CodeblockFenced],
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

export type RuleState = {
    ruleState: Map<string, any>;
    deferredState: DeferredState;
};
