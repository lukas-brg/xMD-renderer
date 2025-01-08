#!/usr/bin/env node

import { program } from "commander";
import fs from "fs";
import path from "path";

import { renderFile } from "./core/index.js";

const isDebugMode = true;
const debugDefaultInput = "test.md";

function isDirectory(filePath: string) {
    const hasSep = filePath.endsWith(path.sep);
    if (hasSep) return true;
    return path.basename(filePath, "html") === filePath;
}

program
    .name("xmd")
    .argument("[input]", "Path to the input Markdown file")
    .argument("[output]", "Path to the output file or directory (optional)")
    .action((input, output) => {
        if (!input) {
            if (isDebugMode) {
                input = debugDefaultInput;
                console.log("Running in debug mode. Using 'test.md' as input.");
            } else {
                program.error("error: missing required argument 'input'");
            }
        }

        const inputPath = path.resolve(input);

        if (!fs.existsSync(inputPath)) {
            console.error(`Error: Input file "${inputPath}" does not exist.`);
            process.exit(1);
        }

        if (fs.statSync(inputPath).isDirectory()) {
            program.error(`Error: input path '${input}' is a directory.`);
        }

        output = output ?? path.basename(input, ".md") + ".html";

        let outputPath = path.resolve(output);

        if (fs.existsSync(outputPath)) {
            // If the path exists, it is either a valid directory, or an already existing file
            if (fs.statSync(outputPath).isDirectory()) {
                const outputFileName = path.basename(input, ".md") + ".html";
                outputPath = path.join(path.dirname(outputPath), outputFileName);
            } else {
                console.error(`Overwriting file ${outputPath}`);
            }
        } else {
            if (isDirectory(output)) {
                program.error(`Error: Directory ${output} does not exist.`);
            }
        }

        renderFile(inputPath, outputPath);
        console.log(
            `Successfully converted '${input}' to '${path.relative(process.cwd(), outputPath)}'`,
        );
    });

program.parse(process.argv);
