import * as esbuild from "esbuild";

await esbuild.build({
    entryPoints: ["src/cli.ts"],
    bundle: true,
    outdir: "dist",
    platform: "node",
    format: "esm",
    packages: "external",
});
