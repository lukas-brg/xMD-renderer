import * as esbuild from "esbuild";
console.log("Building with esbuild...");
await esbuild.build({
    entryPoints: ["./src/cli.ts"],
    bundle: true,
    outdir: "dist",
    platform: "node",
    format: "esm",
    packages: "external",
});
