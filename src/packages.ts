// Known package versions — keep these reasonably current
const PACKAGE_VERSIONS: Record<string, string> = {
  react: "^18.3.1",
  "react-dom": "^18.3.1",
  "@types/react": "^18.3.12",
  "@types/react-dom": "^18.3.1",

  // Tailwind / styling
  tailwindcss: "^3.4.17",
  autoprefixer: "^10.4.20",
  postcss: "^8.4.49",
  "class-variance-authority": "^0.7.1",
  clsx: "^2.1.1",
  "tailwind-merge": "^2.5.5",
  "tailwind-animate": "^1.0.7",

  // shadcn / Radix
  "@radix-ui/react-accordion": "^1.2.2",
  "@radix-ui/react-alert-dialog": "^1.1.4",
  "@radix-ui/react-avatar": "^1.1.2",
  "@radix-ui/react-badge": "^1.0.0",
  "@radix-ui/react-button": "^1.0.0",
  "@radix-ui/react-card": "^1.0.0",
  "@radix-ui/react-checkbox": "^1.1.3",
  "@radix-ui/react-collapsible": "^1.1.2",
  "@radix-ui/react-context-menu": "^2.2.4",
  "@radix-ui/react-dialog": "^1.1.4",
  "@radix-ui/react-dropdown-menu": "^2.1.4",
  "@radix-ui/react-form": "^0.1.0",
  "@radix-ui/react-hover-card": "^1.1.4",
  "@radix-ui/react-icons": "^1.3.2",
  "@radix-ui/react-input": "^1.0.0",
  "@radix-ui/react-label": "^2.1.1",
  "@radix-ui/react-menubar": "^1.1.4",
  "@radix-ui/react-navigation-menu": "^1.2.3",
  "@radix-ui/react-popover": "^1.1.4",
  "@radix-ui/react-progress": "^1.1.1",
  "@radix-ui/react-radio-group": "^1.2.2",
  "@radix-ui/react-scroll-area": "^1.2.2",
  "@radix-ui/react-select": "^2.1.4",
  "@radix-ui/react-separator": "^1.1.1",
  "@radix-ui/react-sheet": "^1.0.0",
  "@radix-ui/react-skeleton": "^1.0.0",
  "@radix-ui/react-slider": "^1.2.2",
  "@radix-ui/react-slot": "^1.1.1",
  "@radix-ui/react-switch": "^1.1.2",
  "@radix-ui/react-table": "^1.0.0",
  "@radix-ui/react-tabs": "^1.1.2",
  "@radix-ui/react-toast": "^1.2.4",
  "@radix-ui/react-toggle": "^1.1.1",
  "@radix-ui/react-toggle-group": "^1.1.1",
  "@radix-ui/react-tooltip": "^1.1.6",
  cmdk: "^1.0.4",
  vaul: "^1.1.2",
  "embla-carousel-react": "^8.5.1",
  "react-day-picker": "^8.10.1",
  "input-otp": "^1.4.1",
  sonner: "^1.7.1",

  // Charts
  recharts: "^2.14.1",
  "chart.js": "^4.4.7",
  "react-chartjs-2": "^5.2.0",

  // Router
  "react-router-dom": "^7.1.0",
  wouter: "^3.6.0",

  // State
  zustand: "^5.0.3",
  jotai: "^2.11.0",
  "@reduxjs/toolkit": "^2.5.0",
  recoil: "^0.7.7",

  // Icons
  "lucide-react": "^0.468.0",
  "react-icons": "^5.4.0",
  "@heroicons/react": "^2.2.0",
  "phosphor-react": "^1.4.1",

  // Animation
  "framer-motion": "^11.15.0",
  "@react-spring/web": "^9.7.5",
  motion: "^11.15.0",

  // Markdown
  "react-markdown": "^9.0.1",
  marked: "^15.0.6",

  // HTTP
  axios: "^1.7.9",

  // Data fetching
  "@tanstack/react-query": "^5.62.13",
  swr: "^2.3.0",

  // Forms
  "react-hook-form": "^7.54.2",
  "@hookform/resolvers": "^3.9.1",
  zod: "^3.24.1",

  // Date
  "date-fns": "^4.1.0",
  dayjs: "^1.11.13",

  // Utils
  uuid: "^11.0.4",
  lodash: "^4.17.21",
  "@types/lodash": "^4.17.14",
};

const ALWAYS_DEV: Set<string> = new Set([
  "typescript",
  "@types/react",
  "@types/react-dom",
  "@types/node",
  "@types/lodash",
  "tailwindcss",
  "autoprefixer",
  "postcss",
  "@vitejs/plugin-react",
  "vite",
]);

export function resolveVersion(pkg: string): string {
  return PACKAGE_VERSIONS[pkg] ?? "latest";
}

export function isDevDependency(pkg: string): boolean {
  return ALWAYS_DEV.has(pkg);
}

export function buildDependencies(packages: string[]): {
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
} {
  const dependencies: Record<string, string> = {
    react: resolveVersion("react"),
    "react-dom": resolveVersion("react-dom"),
  };

  const devDependencies: Record<string, string> = {
    "@types/react": resolveVersion("@types/react"),
    "@types/react-dom": resolveVersion("@types/react-dom"),
    "@types/node": "^22.10.0",
    "@vitejs/plugin-react": "^4.3.4",
    typescript: "^5.7.0",
    vite: "^6.0.5",
  };

  for (const pkg of packages) {
    if (["react", "react-dom"].includes(pkg)) continue;
    const version = resolveVersion(pkg);
    if (isDevDependency(pkg)) {
      devDependencies[pkg] = version;
    } else {
      dependencies[pkg] = version;
    }
  }

  return { dependencies, devDependencies };
}
