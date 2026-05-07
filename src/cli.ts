#!/usr/bin/env node
import { Command } from "commander";
import path from "path";
import { existsSync, writeFileSync } from "fs";
import pc from "picocolors";
import { analyzeFile } from "./analyzer.js";
import { generate } from "./generator.js";

const program = new Command();

program
  .name("art2dock")
  .description("Convert AI-generated TSX/JSX artifacts into Docker-ready project folders")
  .version("0.1.0")
  .argument("<file>", "Path to the .tsx or .jsx artifact file")
  .option("-o, --output <dir>", "Output directory (default: <filename>-docker)")
  .option("-p, --port <number>", "Port to expose in Docker", "3000")
  .option("-n, --name <name>", "Project name (default: derived from filename)")
  .action((file: string, options: { output?: string; port: string; name?: string }) => {
    run(file, options);
  });

program.parse();

function run(
  file: string,
  options: { output?: string; port: string; name?: string }
) {
  const filePath = path.resolve(file);

  if (!existsSync(filePath)) {
    console.error(pc.red(`✖  File not found: ${filePath}`));
    process.exit(1);
  }

  const ext = path.extname(filePath).toLowerCase();
  if (![".tsx", ".jsx", ".ts", ".js"].includes(ext)) {
    console.error(pc.red(`✖  Expected a .tsx / .jsx file, got: ${ext}`));
    process.exit(1);
  }

  const port = parseInt(options.port, 10);
  if (isNaN(port) || port < 1 || port > 65535) {
    console.error(pc.red(`✖  Invalid port: ${options.port}`));
    process.exit(1);
  }

  const baseName = path.basename(filePath, ext);
  const projectName = options.name ?? slugify(baseName);
  const outputDir = path.resolve(options.output ?? `${projectName}-docker`);

  console.log();
  console.log(pc.bold(pc.cyan("  art2dock")), pc.dim("─".repeat(40)));
  console.log();

  process.stdout.write(pc.dim("  Analyzing ") + pc.white(path.basename(filePath)) + " … ");
  const analysis = analyzeFile(filePath);
  console.log(pc.green("done"));

  const flags: string[] = [];
  if (analysis.hasTailwind) flags.push("tailwind");
  if (analysis.hasShadcn) flags.push("shadcn/ui");
  if (analysis.hasRouter) flags.push("router");
  if (analysis.hasCharts) flags.push("charts");
  if (analysis.hasIcons) flags.push("icons");
  if (analysis.hasAnimations) flags.push("animations");
  if (analysis.hasMarkdown) flags.push("markdown");
  if (analysis.hasFetch) flags.push("fetch/http");

  if (flags.length) {
    console.log(pc.dim("  Detected:  ") + flags.map((f) => pc.yellow(f)).join(pc.dim(", ")));
  }
  console.log(pc.dim("  Packages:  ") + pc.white(String(analysis.externalPackages.length)));
  console.log();

  process.stdout.write(pc.dim("  Generating project in ") + pc.white(outputDir) + " … ");
  generate(analysis, { outputDir, port, projectName });
  writeNginxConfig(outputDir, port);
  if (analysis.hasTailwind) writeCss(outputDir, analysis.hasShadcn);
  console.log(pc.green("done"));

  console.log();
  console.log(pc.bold(pc.green("  ✔  Project ready!")));
  console.log();
  console.log(pc.dim("  Next steps:"));
  console.log();
  console.log(`    ${pc.cyan("cd")} ${path.relative(process.cwd(), outputDir)}`);
  console.log(`    ${pc.cyan("docker compose up --build")}`);
  console.log();
  console.log(pc.dim(`  Then open `) + pc.underline(`http://localhost:${port}`));
  console.log();
}

function writeNginxConfig(outputDir: string, port: number) {
  const config = `server {
    listen ${port};
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
    gzip_min_length 1000;
}
`;
  writeFileSync(`${outputDir}/nginx.conf`, config, "utf-8");
}

function writeCss(outputDir: string, hasShadcn: boolean) {
  const shadcnVars = `
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --card: 0 0% 100%;
  --card-foreground: 222.2 84% 4.9%;
  --popover: 0 0% 100%;
  --popover-foreground: 222.2 84% 4.9%;
  --primary: 222.2 47.4% 11.2%;
  --primary-foreground: 210 40% 98%;
  --secondary: 210 40% 96.1%;
  --secondary-foreground: 222.2 47.4% 11.2%;
  --muted: 210 40% 96.1%;
  --muted-foreground: 215.4 16.3% 46.9%;
  --accent: 210 40% 96.1%;
  --accent-foreground: 222.2 47.4% 11.2%;
  --destructive: 0 84.2% 60.2%;
  --destructive-foreground: 210 40% 98%;
  --border: 214.3 31.8% 91.4%;
  --input: 214.3 31.8% 91.4%;
  --ring: 222.2 84% 4.9%;
  --radius: 0.5rem;`;

  const darkVars = `
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  --card: 222.2 84% 4.9%;
  --card-foreground: 210 40% 98%;
  --popover: 222.2 84% 4.9%;
  --popover-foreground: 210 40% 98%;
  --primary: 210 40% 98%;
  --primary-foreground: 222.2 47.4% 11.2%;
  --secondary: 217.2 32.6% 17.5%;
  --secondary-foreground: 210 40% 98%;
  --muted: 217.2 32.6% 17.5%;
  --muted-foreground: 215 20.2% 65.1%;
  --accent: 217.2 32.6% 17.5%;
  --accent-foreground: 210 40% 98%;
  --destructive: 0 62.8% 30.6%;
  --destructive-foreground: 210 40% 98%;
  --border: 217.2 32.6% 17.5%;
  --input: 217.2 32.6% 17.5%;
  --ring: 212.7 26.8% 83.9%;`;

  const css = `@tailwind base;
@tailwind components;
@tailwind utilities;
${
  hasShadcn
    ? `
@layer base {
  :root {${shadcnVars}
  }
  .dark {${darkVars}
  }
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}
`
    : ""
}`;

  writeFileSync(`${outputDir}/src/index.css`, css, "utf-8");
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
