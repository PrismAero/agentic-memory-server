import path from "path";
/**
 * Base Memory Manager - common functionality
 */
export class BaseMemoryManager {
    basePath;
    branchesPath;
    constructor(basePath) {
        this.basePath = basePath;
        this.branchesPath = path.join(this.basePath, ".memory");
    }
    // Branch path resolution
    getBranchPath(branchName) {
        if (!branchName || branchName === "main") {
            return path.join(this.branchesPath, "memory.json");
        }
        return path.join(this.branchesPath, `${branchName}.json`);
    }
    // Smart branch suggestion
    suggestBranch(entityType, content) {
        if (!entityType && !content)
            return "main";
        const lower = `${entityType || ""} ${content || ""}`.toLowerCase();
        if (lower.includes("api") ||
            lower.includes("documentation") ||
            lower.includes("guide") ||
            lower.includes("tutorial") ||
            lower.includes("example") ||
            lower.includes("code") ||
            lower.includes("technical") ||
            lower.includes("spec") ||
            lower.includes("readme")) {
            return "docs";
        }
        if (lower.includes("marketing") ||
            lower.includes("campaign") ||
            lower.includes("user story") ||
            lower.includes("feature") ||
            lower.includes("product") ||
            lower.includes("customer") ||
            lower.includes("business") ||
            lower.includes("brand") ||
            lower.includes("copy")) {
            return "marketing";
        }
        if (lower.includes("ui") ||
            lower.includes("component") ||
            lower.includes("frontend") ||
            lower.includes("react") ||
            lower.includes("vue") ||
            lower.includes("angular") ||
            lower.includes("css") ||
            lower.includes("html")) {
            return "frontend";
        }
        if (lower.includes("api") ||
            lower.includes("backend") ||
            lower.includes("server") ||
            lower.includes("database") ||
            lower.includes("service") ||
            lower.includes("endpoint")) {
            return "backend";
        }
        return "main";
    }
}
