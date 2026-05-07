export declare function resolveVersion(pkg: string): string;
export declare function isDevDependency(pkg: string): boolean;
export declare function buildDependencies(packages: string[]): {
    dependencies: Record<string, string>;
    devDependencies: Record<string, string>;
};
//# sourceMappingURL=packages.d.ts.map