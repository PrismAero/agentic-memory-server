/**
 * Branch Management Handlers
 * Handles all memory branch operations
 */
export class BranchHandlers {
    memoryManager;
    constructor(memoryManager) {
        this.memoryManager = memoryManager;
    }
    async handleListMemoryBranches() {
        const branches = await this.memoryManager.listBranches();
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify({
                        branches,
                        summary: `Found ${branches.length} memory branches. Main branch has ${branches.find((b) => b.name === "main")?.entityCount || 0} entities.`,
                    }, null, 2),
                },
            ],
        };
    }
    async handleCreateMemoryBranch(args) {
        if (!args.branch_name) {
            throw new Error("branch_name is required");
        }
        const newBranch = await this.memoryManager.createBranch(args.branch_name, args.purpose);
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify({
                        message: `Created branch "${args.branch_name}"`,
                        branch: newBranch,
                    }, null, 2),
                },
            ],
        };
    }
    async handleDeleteMemoryBranch(args) {
        if (!args.branch_name) {
            throw new Error("branch_name is required");
        }
        await this.memoryManager.deleteBranch(args.branch_name);
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify({
                        message: `Deleted branch "${args.branch_name}"`,
                    }, null, 2),
                },
            ],
        };
    }
    async handleReadMemoryBranch(args) {
        const branchGraph = await this.memoryManager.readGraph(args.branch_name, args.include_statuses, args.include_auto_context !== false);
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify({
                        graph: branchGraph,
                        branch: args.branch_name || "main",
                        summary: `Branch "${args.branch_name || "main"}" contains ${branchGraph.entities.length} entities and ${branchGraph.relations.length} relations`,
                    }, null, 2),
                },
            ],
        };
    }
}
