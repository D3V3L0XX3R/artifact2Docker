import path from "path";
import { mkdirSync, writeFileSync, readFileSync, existsSync } from "fs";
import { AnalysisResult } from "./analyzer.js";
import { buildDependencies } from "./packages.js";

export interface GeneratorOptions {
  outputDir: string;
  port: number;
  projectName: string;
}

export function generate(analysis: AnalysisResult, opts: GeneratorOptions): void {
  const { outputDir, port, projectName } = opts;

  ensureDir(outputDir);
  ensureDir(path.join(outputDir, "src"));
  ensureDir(path.join(outputDir, "public"));

  copySourceFile(analysis, outputDir);
  writeFile(outputDir, "src/main.tsx", genMain(analysis));
  writeFile(outputDir, "public/index.html", genIndexHtml(projectName));
  writeFile(outputDir, "index.html", genViteIndexHtml(projectName));
  writeFile(outputDir, "vite.config.ts", genViteConfig(port));
  writeFile(outputDir, "tsconfig.json", genTsConfig());
  writeFile(outputDir, "tsconfig.node.json", genTsConfigNode());
  writeFile(outputDir, "package.json", genPackageJson(analysis, projectName));
  writeFile(outputDir, "postcss.config.js", genPostcss());
  writeFile(outputDir, "tailwind.config.ts", genTailwindConfig(analysis));
  writeFile(outputDir, "Dockerfile", genDockerfile(port, analysis));
  writeFile(outputDir, "docker-compose.yml", genDockerCompose(projectName, port));
  writeFile(outputDir, ".dockerignore", genDockerignore());
  writeFile(outputDir, ".gitignore", genGitignore());

  if (analysis.hasShadcn) {
    ensureDir(path.join(outputDir, "src/lib"));
    writeFile(outputDir, "src/lib/utils.ts", genUtils());
    writeFile(outputDir, "components.json", genComponentsJson(analysis));
  }
}

// ─── File writers ────────────────────────────────────────────────────────────

function ensureDir(dir: string) {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

function writeFile(base: string, relative: string, content: string) {
  const fullPath = path.join(base, relative);
  ensureDir(path.dirname(fullPath));
  writeFileSync(fullPath, content, "utf-8");
}

function copySourceFile(analysis: AnalysisResult, outputDir: string) {
  const ext = analysis.isTypeScript ? ".tsx" : ".jsx";
  const dest = path.join(outputDir, `src/App${ext}`);
  let content = readFileSync(analysis.filePath, "utf-8");

  // Rewrite shadcn relative-style imports to @/ alias style
  content = content.replace(
    /from\s+['"](?:\.\.\/)*components\/ui\//g,
    'from "@/components/ui/'
  );
  content = content.replace(
    /from\s+['"](?:\.\.\/)*lib\//g,
    'from "@/lib/'
  );

  writeFileSync(dest, content, "utf-8");
}

// ─── Template generators ─────────────────────────────────────────────────────

function genMain(analysis: AnalysisResult): string {
  const ext = analysis.isTypeScript ? ".tsx" : ".jsx";
  return `import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
${analysis.hasTailwind ? "import './index.css'" : ""}
import App from './App${ext}'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
`;
}

function genIndexHtml(projectName: string): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${projectName}</title>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>
`;
}

function genViteIndexHtml(projectName: string): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${projectName}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`;
}

function genViteConfig(port: number): string {
  return `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: ${port},
    host: '0.0.0.0',
  },
  preview: {
    port: ${port},
    host: '0.0.0.0',
  },
})
`;
}

function genTsConfig(): string {
  return JSON.stringify(
    {
      compilerOptions: {
        target: "ES2020",
        useDefineForClassFields: true,
        lib: ["ES2020", "DOM", "DOM.Iterable"],
        module: "ESNext",
        skipLibCheck: true,
        moduleResolution: "bundler",
        allowImportingTsExtensions: true,
        isolatedModules: true,
        moduleDetection: "force",
        noEmit: true,
        jsx: "react-jsx",
        strict: true,
        noUnusedLocals: false,
        noUnusedParameters: false,
        noFallthroughCasesInSwitch: true,
        baseUrl: ".",
        paths: { "@/*": ["./src/*"] },
      },
      include: ["src"],
      references: [{ path: "./tsconfig.node.json" }],
    },
    null,
    2
  );
}

function genTsConfigNode(): string {
  return JSON.stringify(
    {
      compilerOptions: {
        target: "ES2022",
        lib: ["ES2023"],
        module: "ESNext",
        skipLibCheck: true,
        moduleResolution: "bundler",
        allowImportingTsExtensions: true,
        isolatedModules: true,
        moduleDetection: "force",
        noEmit: true,
        strict: true,
      },
      include: ["vite.config.ts"],
    },
    null,
    2
  );
}

function genPackageJson(analysis: AnalysisResult, name: string): string {
  const { dependencies, devDependencies } = buildDependencies(analysis.externalPackages);

  if (analysis.hasTailwind) {
    devDependencies["tailwindcss"] = "^3.4.17";
    devDependencies["autoprefixer"] = "^10.4.20";
    devDependencies["postcss"] = "^8.4.49";
  }

  return JSON.stringify(
    {
      name,
      private: true,
      version: "0.0.1",
      type: "module",
      scripts: {
        dev: "vite",
        build: "tsc -b && vite build",
        preview: "vite preview",
      },
      dependencies,
      devDependencies,
    },
    null,
    2
  );
}

function genPostcss(): string {
  return `export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
`;
}

function genTailwindConfig(analysis: AnalysisResult): string {
  const shadcnExtras = analysis.hasShadcn
    ? `
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],`
    : `
  theme: {
    extend: {},
  },
  plugins: [],`;

  return `/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx,js,jsx}",
  ],${shadcnExtras}
}
`;
}

function genDockerfile(port: number, analysis: AnalysisResult): string {
  const shadcnStep = analysis.hasShadcn && analysis.shadcnComponents.length > 0
    ? `\n# Install shadcn/ui components detected in the artifact\nRUN npx shadcn@latest add ${analysis.shadcnComponents.join(" ")} --yes 2>/dev/null || true\n`
    : "";

  return `# ── Build stage ──────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci
${shadcnStep}
COPY . .
RUN npm run build

# ── Production stage ──────────────────────────────────────────────────────────
FROM nginx:alpine AS runner

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE ${port}

CMD ["nginx", "-g", "daemon off;"]
`;
}

function genDockerCompose(name: string, port: number): string {
  return `services:
  app:
    build: .
    container_name: ${name}
    ports:
      - "${port}:${port}"
    restart: unless-stopped
    environment:
      - NODE_ENV=production
`;
}

function genDockerignore(): string {
  return `node_modules
dist
.git
.gitignore
*.md
.env*
`;
}

function genGitignore(): string {
  return `# Logs
logs
*.log

# Runtime data
pids
*.pid

node_modules
dist
dist-ssr
*.local

.env
.env.*
!.env.example

.DS_Store
`;
}

function genUtils(): string {
  return `import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
`;
}

function genComponentsJson(analysis: AnalysisResult): string {
  return JSON.stringify(
    {
      $schema: "https://ui.shadcn.com/schema.json",
      style: "default",
      rsc: false,
      tsx: analysis.isTypeScript,
      tailwind: {
        config: "tailwind.config.ts",
        css: "src/index.css",
        baseColor: "slate",
        cssVariables: true,
        prefix: "",
      },
      aliases: {
        components: "@/components",
        utils: "@/lib/utils",
        ui: "@/components/ui",
        lib: "@/lib",
        hooks: "@/hooks",
      },
    },
    null,
    2
  );
}
