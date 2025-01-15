
import path from "path";
import esbuild from "esbuild";
esbuild
    .build({
        entryPoints: ["./src/extension.ts"],
        bundle: true,
        outfile: "./dist/extension.cjs", 
        platform: "node", 
        sourcemap: true, 
        external: ["xmd-parser"], 
        resolveExtensions: [".ts", ".js", ".json"], 
        tsconfig: "./tsconfig.json", 
        external: ["vscode"],
        target: 'node14',
        format: "cjs"
    })
    .catch((err) => {
        console.error(err);
        process.exit(1);
    });
