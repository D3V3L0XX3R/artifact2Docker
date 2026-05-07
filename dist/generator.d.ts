import { AnalysisResult } from "./analyzer.js";
export interface GeneratorOptions {
    outputDir: string;
    port: number;
    projectName: string;
}
export declare function generate(analysis: AnalysisResult, opts: GeneratorOptions): void;
//# sourceMappingURL=generator.d.ts.map