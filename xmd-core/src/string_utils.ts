export function isEmpty(line: string): boolean {
    return /^\s*$/.test(line);
}

export function makeIdString(text: string): string {
    let id = text.toLowerCase().trim().replace(/[^\w]/g, "-");
    id = id.replace(/^-+|-+$/g, "");
    if (/^\d/.test(id)) {
        id = `h-${id}`;
    }
    return id;
}

export function leadingWhitespaces(input: string): number {
    let count = 0;
    for (const char of input) {
        if (char === " ") {
            count += 1;
        } else if (char === "\t") {
            count += 4;
        } else {
            break;
        }
    }
    return count;
}

export function trailingWhiteSpaces(input: string): number {
    const trimmed = input.trimEnd();
    const count = input.length - trimmed.length;
    return count;
}

import * as fs from "fs";

export function readFile(filePath: string): string | null {
    try {
        const data = fs.readFileSync(filePath, "utf-8");
        return data;
    } catch (err) {
        console.error("Error reading file:", err);
        return null;
    }
}

export function replaceTabs(input: string): string {
    return input.replace(/\\t/g, "    ");
}
