import { readFileSync } from "fs";
import path from "path";
// Packages that ship with shadcn/ui setups
const SHADCN_PACKAGES = [
    "@radix-ui",
    "class-variance-authority",
    "clsx",
    "tailwind-merge",
    "cmdk",
    "vaul",
    "embla-carousel-react",
    "react-day-picker",
    "input-otp",
    "recharts",
    "sonner",
];
const CHART_PACKAGES = ["recharts", "chart.js", "react-chartjs-2", "victory", "nivo", "d3"];
const ROUTER_PACKAGES = ["react-router-dom", "react-router", "wouter", "tanstack/react-router"];
const STATE_PACKAGES = [
    "zustand",
    "jotai",
    "recoil",
    "@reduxjs/toolkit",
    "redux",
    "mobx",
    "mobx-react",
];
const ICON_PACKAGES = ["lucide-react", "react-icons", "@heroicons/react", "phosphor-react"];
const ANIMATION_PACKAGES = ["framer-motion", "react-spring", "@react-spring/web", "motion"];
const MARKDOWN_PACKAGES = ["react-markdown", "marked", "remark", "unified"];
export function analyzeFile(filePath) {
    const absolutePath = path.resolve(filePath);
    const content = readFileSync(absolutePath, "utf-8");
    const fileName = path.basename(absolutePath);
    const ext = path.extname(fileName).toLowerCase();
    const isTypeScript = ext === ".tsx" || ext === ".ts";
    const importLines = extractImports(content);
    // Exclude relative paths, absolute paths, and Vite/TS path aliases (e.g. @/)
    const externalPackages = importLines.filter((pkg) => !pkg.startsWith(".") && !pkg.startsWith("/") && !pkg.startsWith("@/"));
    const shadcnComponents = extractShadcnComponents(content);
    return {
        filePath: absolutePath,
        fileName,
        isTypeScript,
        imports: importLines,
        externalPackages,
        hasTailwind: hasTailwindUsage(content, externalPackages),
        hasShadcn: externalPackages.some((p) => SHADCN_PACKAGES.some((s) => p.startsWith(s))) || shadcnComponents.length > 0,
        hasRouter: externalPackages.some((p) => ROUTER_PACKAGES.some((r) => p.startsWith(r))),
        hasStateManagement: externalPackages.some((p) => STATE_PACKAGES.some((s) => p.startsWith(s))),
        hasCharts: externalPackages.some((p) => CHART_PACKAGES.some((c) => p.startsWith(c))),
        hasIcons: externalPackages.some((p) => ICON_PACKAGES.some((i) => p.startsWith(i))),
        hasAnimations: externalPackages.some((p) => ANIMATION_PACKAGES.some((a) => p.startsWith(a))),
        hasMarkdown: externalPackages.some((p) => MARKDOWN_PACKAGES.some((m) => p.startsWith(m))),
        hasFetch: /fetch\s*\(|axios|useQuery|useSWR/.test(content),
        shadcnComponents,
        detectedPorts: [],
    };
}
function extractImports(content) {
    const importRegex = /(?:import|from)\s+['"]([^'"]+)['"]/g;
    const dynamicImportRegex = /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
    const requireRegex = /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
    const packages = new Set();
    for (const regex of [importRegex, dynamicImportRegex, requireRegex]) {
        let match;
        regex.lastIndex = 0;
        while ((match = regex.exec(content)) !== null) {
            const pkg = match[1];
            // Normalize scoped packages and sub-paths to root package name
            const rootPkg = pkg.startsWith("@")
                ? pkg.split("/").slice(0, 2).join("/")
                : pkg.split("/")[0];
            packages.add(rootPkg);
        }
    }
    return [...packages];
}
function extractShadcnComponents(content) {
    const regex = /from\s+['"](?:@\/|\.\.\/)*components\/ui\/([^'"]+)['"]/g;
    const components = new Set();
    let match;
    while ((match = regex.exec(content)) !== null) {
        components.add(match[1].split("/")[0]);
    }
    return [...components];
}
function hasTailwindUsage(content, packages) {
    if (packages.includes("tailwindcss"))
        return true;
    // Heuristic: className with Tailwind-like utility classes
    const tailwindPattern = /className=["'`][^"'`]*(?:flex|grid|text-|bg-|p-|m-|w-|h-|border|rounded|shadow|gap-|space-)[^"'`]*["'`]/;
    return tailwindPattern.test(content);
}
//# sourceMappingURL=analyzer.js.map