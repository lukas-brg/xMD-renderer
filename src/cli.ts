#!/usr/bin/env node

import { program } from "commander";
import fs from "fs";
import path from "path";

import { renderFile } from "./core/index.js";

program
    .name("xmd")
    .argument("<file>", "Path to the input Markdown file")
    .action((file) => {
        const filePath = path.resolve(file);

        if (!fs.existsSync(filePath)) {
            console.error(`Error: File "${file}" does not exist.`);
            process.exit(1);
        }
        const outputPath = filePath.replace(/\.md$/, ".html");
        renderFile(filePath, outputPath);

        console.log(`Sucessfully converted '${filePath}' to '${outputPath}'`);
    });

program.parse(process.argv);
