# art2dock

Convert AI-generated TSX/JSX artifacts into Docker-ready project folders with a single command.

```
art2dock dashboard.tsx
```

Takes a React component file from Claude, v0, Bolt, or any AI tool and outputs a complete, buildable project: Vite + React, Tailwind, shadcn/ui, multi-stage Dockerfile, nginx config, and `docker-compose.yml`. Run `docker compose up --build` and you're live.

---

## Installation

```bash
git clone <repo>
cd artifact2Docker
npm install
npm run build
```

To use it globally:

```bash
npm link
art2dock --help
```

---

## Usage

```bash
art2dock <file> [options]
```

### Arguments

| Argument | Description |
|---|---|
| `<file>` | Path to the `.tsx`, `.jsx`, `.ts`, or `.js` artifact file |

### Options

| Flag | Default | Description |
|---|---|---|
| `-o, --output <dir>` | `<name>-docker` | Output directory for the generated project |
| `-p, --port <number>` | `3000` | Port exposed in Docker and nginx |
| `-n, --name <name>` | Derived from filename | Project name (used in `package.json` and `docker-compose.yml`) |
| `-V, --version` | | Print version |
| `-h, --help` | | Show help |

### Examples

```bash
# Minimal — output goes to ./dashboard-docker/
art2dock dashboard.tsx

# Custom output directory
art2dock dashboard.tsx -o ./my-project

# Custom port and project name
art2dock dashboard.tsx -p 8080 -n my-dashboard

# All options
art2dock ~/Downloads/artifact.tsx -o ./artifact-app -p 4000 -n artifact-app
```

---

## What gets generated

Running `art2dock dashboard.tsx` produces:

```
dashboard-docker/
├── src/
│   ├── App.tsx           ← your artifact (imports rewritten to @/ aliases)
│   ├── main.tsx          ← React entry point
│   ├── index.css         ← Tailwind directives + shadcn CSS variables
│   └── lib/
│       └── utils.ts      ← cn() helper (only if shadcn detected)
├── public/
│   └── index.html
├── index.html            ← Vite entry HTML
├── package.json          ← detected dependencies with pinned versions
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts        ← @/ alias, host 0.0.0.0, configured port
├── tailwind.config.ts    ← shadcn tokens if detected
├── postcss.config.js
├── components.json       ← shadcn config (only if shadcn detected)
├── Dockerfile            ← multi-stage: Node build → nginx serve
├── docker-compose.yml
├── nginx.conf            ← SPA routing + gzip
├── .dockerignore
└── .gitignore
```

---

## What gets detected

art2dock parses your artifact's imports and classNames to figure out what the project needs — no configuration required.

### Libraries and frameworks

| Category | Detected packages |
|---|---|
| **Styling** | `tailwindcss`, `class-variance-authority`, `clsx`, `tailwind-merge` |
| **shadcn/ui** | All `@/components/ui/*` imports → added to Dockerfile via `npx shadcn@latest add` |
| **Charts** | `recharts`, `chart.js`, `react-chartjs-2`, `victory`, `nivo`, `d3` |
| **Icons** | `lucide-react`, `react-icons`, `@heroicons/react`, `phosphor-react` |
| **Router** | `react-router-dom`, `wouter`, `@tanstack/react-router` |
| **State** | `zustand`, `jotai`, `@reduxjs/toolkit`, `recoil`, `mobx` |
| **Animation** | `framer-motion`, `@react-spring/web`, `motion` |
| **Data fetching** | `axios`, `@tanstack/react-query`, `swr` |
| **Forms** | `react-hook-form`, `@hookform/resolvers`, `zod` |
| **Markdown** | `react-markdown`, `marked` |
| **Date** | `date-fns`, `dayjs` |
| **Utilities** | `uuid`, `lodash` |

### shadcn/ui handling

When shadcn components are detected (e.g. `import { Card } from "@/components/ui/card"`), art2dock:

1. Adds `src/lib/utils.ts` with the `cn()` helper
2. Generates `components.json` with the correct Tailwind and alias config
3. Injects a `npx shadcn@latest add <components> --yes` step in the Dockerfile so components are installed during the Docker build

The generated Dockerfile handles everything — you don't need to run `shadcn init` yourself.

### Tailwind detection

Tailwind is detected either by an explicit `tailwindcss` import or by heuristic — if your JSX contains classNames with typical utility patterns (`flex`, `bg-`, `text-`, `rounded`, etc.) Tailwind config and CSS are generated automatically.

---

## The generated Docker setup

### Dockerfile

Multi-stage build — the final image is just nginx serving static files.

```dockerfile
# Stage 1: build
FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci
# (shadcn components installed here if detected)
COPY . .
RUN npm run build

# Stage 2: serve
FROM nginx:alpine AS runner
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 3000
CMD ["nginx", "-g", "daemon off;"]
```

### docker-compose.yml

```yaml
services:
  app:
    build: .
    container_name: my-app
    ports:
      - "3000:3000"
    restart: unless-stopped
    environment:
      - NODE_ENV=production
```

### nginx.conf

Configured for SPA routing (`try_files $uri /index.html`) with gzip compression enabled for JS, CSS, and JSON assets.

---

## Running the generated project

```bash
cd dashboard-docker

# With Docker (production build)
docker compose up --build

# Without Docker (local dev)
npm install
npm run dev

# Without Docker (local preview of production build)
npm install
npm run build
npm run preview
```

Open `http://localhost:3000` (or the port you configured).

---

## Import rewriting

Artifacts from AI tools often use inconsistent import paths. art2dock normalizes them automatically:

| Original import | Rewritten to |
|---|---|
| `from "../../components/ui/card"` | `from "@/components/ui/card"` |
| `from "../lib/utils"` | `from "@/lib/utils"` |
| `from "@/components/ui/button"` | `from "@/components/ui/button"` (unchanged) |

Path aliases (`@/`) are wired up in both `vite.config.ts` and `tsconfig.json`.

---

## Project structure (art2dock itself)

```
artifact2Docker/
├── src/
│   ├── cli.ts        ← CLI entry point (Commander)
│   ├── analyzer.ts   ← parses imports, detects libraries and patterns
│   ├── generator.ts  ← writes all project files from templates
│   └── packages.ts   ← version map for known npm packages
├── examples/
│   └── dashboard.tsx ← example artifact for testing
├── package.json
└── tsconfig.json
```

### Development

```bash
npm run dev    # watch mode — recompiles on change
npm run build  # compile once
npm run lint   # TypeScript type check
```

---

## Known limitations

- Output is always a **Vite + React** SPA. Next.js artifacts (server components, API routes) are not supported yet.
- Packages not in the known version map get pinned to `"latest"`, which may cause build instability.
- shadcn components are downloaded during `docker build` — requires internet access at build time.
- JSX artifacts without TypeScript extensions (`.jsx`) generate a JS project; types won't be strict.
