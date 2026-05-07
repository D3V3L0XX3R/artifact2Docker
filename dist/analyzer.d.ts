export interface AnalysisResult {
    filePath: string;
    fileName: string;
    isTypeScript: boolean;
    imports: string[];
    externalPackages: string[];
    hasTailwind: boolean;
    hasShadcn: boolean;
    hasRouter: boolean;
    hasStateManagement: boolean;
    hasCharts: boolean;
    hasIcons: boolean;
    hasAnimations: boolean;
    hasMarkdown: boolean;
    hasFetch: boolean;
    shadcnComponents: string[];
    detectedPorts: number[];
}
export declare function analyzeFile(filePath: string): AnalysisResult;
//# sourceMappingURL=analyzer.d.ts.map