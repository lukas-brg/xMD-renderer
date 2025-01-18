import * as esbuild from "esbuild";
console.log("Building CLI with esbuild...");
await esbuild.build({
    entryPoints: ["./src/cli.ts"],
    bundle: true,
    outdir: "dist",
    platform: "node",
    format: "esm",
    external: ["../node_modules/*"],
});
