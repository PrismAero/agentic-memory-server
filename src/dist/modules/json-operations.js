import { promises as fs } from "fs";
import path from "path";
import { BaseMemoryManager } from "./memory-core.js";
/**
 * JSON-based Memory Operations
 * Handles line-delimited JSON storage for human readability and backups
 */
export class JSONOperations extends BaseMemoryManager {
    async initialize() {
        // Ensure directories exist
        await fs.mkdir(this.basePath, { recursive: true });
        await fs.mkdir(this.branchesPath, { recursive: true });
        // Create main memory file if it doesn't exist
        const mainPath = this.getBranchPath("main");
        try {
            await fs.access(mainPath);
        }
        catch {
            await fs.writeFile(mainPath, "");
            console.error(`Created main memory file: ${mainPath}`);
        }
    }
    async ensureDirectoryExists(filePath) {
        const dir = path.dirname(filePath);
        try {
            await fs.access(dir);
        }
        catch {
            await fs.mkdir(dir, { recursive: true });
        }
    }
    async loadGraph(branchName) {
        const memoryPath = this.getBranchPath(branchName);
        try {
            const data = await fs.readFile(memoryPath, "utf-8");
            const lines = data.split("\n").filter((line) => line.trim() !== "");
            return lines.reduce((graph, line) => {
                const item = JSON.parse(line);
                if (item.type === "entity")
                    graph.entities.push(item);
                if (item.type === "relation")
                    graph.relations.push(item);
                return graph;
            }, { entities: [], relations: [] });
        }
        catch (error) {
            if (error instanceof Error &&
                "code" in error &&
                error.code === "ENOENT") {
                return { entities: [], relations: [] };
            }
            throw error;
        }
    }
    async saveGraph(graph, branchName) {
        const memoryPath = this.getBranchPath(branchName);
        await this.ensureDirectoryExists(memoryPath);
        const lines = [
            ...graph.entities.map((e) => JSON.stringify({ type: "entity", ...e })),
            ...graph.relations.map((r) => JSON.stringify({ type: "relation", ...r })),
        ];
        await fs.writeFile(memoryPath, lines.join("\n"));
    }
    // Implementation of abstract methods
    async createEntities(entities, branchName) {
        const graph = await this.loadGraph(branchName);
        const createdEntities = [];
        for (const entity of entities) {
            // Check if entity already exists
            if (graph.entities.some((e) => e.name === entity.name)) {
                console.warn(`Entity "${entity.name}" already exists in branch "${branchName || "main"}"`);
                continue;
            }
            const optimizedEntity = {
                ...entity,
                status: entity.status || "active",
                lastUpdated: new Date().toISOString(),
            };
            graph.entities.push(optimizedEntity);
            createdEntities.push(optimizedEntity);
        }
        await this.saveGraph(graph, branchName);
        return createdEntities;
    }
    async updateEntity(entity, branchName) {
        const graph = await this.loadGraph(branchName);
        const index = graph.entities.findIndex((e) => e.name === entity.name);
        if (index === -1) {
            throw new Error(`Entity "${entity.name}" not found`);
        }
        graph.entities[index] = {
            ...entity,
            lastUpdated: new Date().toISOString(),
        };
        await this.saveGraph(graph, branchName);
        return graph.entities[index];
    }
    async deleteEntities(entityNames, branchName) {
        const graph = await this.loadGraph(branchName);
        graph.entities = graph.entities.filter((e) => !entityNames.includes(e.name));
        graph.relations = graph.relations.filter((r) => !entityNames.includes(r.from) && !entityNames.includes(r.to));
        await this.saveGraph(graph, branchName);
    }
    async createRelations(relations, branchName) {
        const graph = await this.loadGraph(branchName);
        const newRelations = relations.filter((r) => !graph.relations.some((existing) => existing.from === r.from &&
            existing.to === r.to &&
            existing.relationType === r.relationType));
        graph.relations.push(...newRelations);
        await this.saveGraph(graph, branchName);
        return newRelations;
    }
    async deleteRelations(relations, branchName) {
        const graph = await this.loadGraph(branchName);
        graph.relations = graph.relations.filter((r) => !relations.some((delRelation) => r.from === delRelation.from &&
            r.to === delRelation.to &&
            r.relationType === delRelation.relationType));
        await this.saveGraph(graph, branchName);
    }
    async searchEntities(query, branchName, includeStatuses) {
        const graph = await this.loadGraph(branchName);
        // Filter by status
        const defaultStatuses = includeStatuses || ["active"];
        const statusFiltered = graph.entities.filter((entity) => {
            const entityStatus = entity.status || "active";
            return defaultStatuses.includes(entityStatus);
        });
        // Filter by search query
        const searchFiltered = statusFiltered.filter((e) => e.name.toLowerCase().includes(query.toLowerCase()) ||
            e.entityType.toLowerCase().includes(query.toLowerCase()) ||
            e.observations.some((o) => o.toLowerCase().includes(query.toLowerCase())));
        const filteredEntityNames = new Set(searchFiltered.map((e) => e.name));
        const filteredRelations = graph.relations.filter((r) => filteredEntityNames.has(r.from) && filteredEntityNames.has(r.to));
        return {
            entities: searchFiltered,
            relations: filteredRelations,
        };
    }
    async findEntityByName(name, branchName) {
        const graph = await this.loadGraph(branchName);
        return graph.entities.find((e) => e.name === name) || null;
    }
    async createBranch(branchName, purpose) {
        if (branchName === "main") {
            throw new Error('Cannot create a branch named "main" - it already exists');
        }
        const branchPath = this.getBranchPath(branchName);
        // Check if branch already exists
        try {
            await fs.access(branchPath);
            throw new Error(`Branch "${branchName}" already exists`);
        }
        catch (error) {
            if (error.code !== "ENOENT") {
                throw error;
            }
        }
        // Create empty branch
        await this.saveGraph({ entities: [], relations: [] }, branchName);
        return {
            name: branchName,
            path: branchPath,
            purpose: purpose || `Custom memory branch: ${branchName}`,
            entityCount: 0,
            relationCount: 0,
            lastUpdated: new Date().toISOString(),
        };
    }
    async deleteBranch(branchName) {
        if (branchName === "main") {
            throw new Error("Cannot delete the main branch");
        }
        const branchPath = this.getBranchPath(branchName);
        try {
            await fs.unlink(branchPath);
        }
        catch (error) {
            if (error.code === "ENOENT") {
                throw new Error(`Branch "${branchName}" not found`);
            }
            throw error;
        }
    }
    async listBranches() {
        const branches = [];
        // Add main branch
        try {
            const mainGraph = await this.loadGraph("main");
            const mainStats = await fs
                .stat(this.getBranchPath("main"))
                .catch(() => null);
            branches.push({
                name: "main",
                path: this.getBranchPath("main"),
                purpose: "Main project memory - core entities, business logic, and system architecture",
                entityCount: mainGraph.entities.length,
                relationCount: mainGraph.relations.length,
                lastUpdated: mainStats?.mtime.toISOString() || new Date().toISOString(),
            });
        }
        catch (error) {
            branches.push({
                name: "main",
                path: this.getBranchPath("main"),
                purpose: "Main project memory - core entities, business logic, and system architecture",
                entityCount: 0,
                relationCount: 0,
                lastUpdated: new Date().toISOString(),
            });
        }
        // Add sub-branches
        try {
            const files = await fs.readdir(this.branchesPath);
            for (const file of files) {
                if (file.endsWith(".json") && !file.startsWith("memory.json")) {
                    const branchName = file.replace(".json", "");
                    const branchPath = path.join(this.branchesPath, file);
                    try {
                        const branchGraph = await this.loadGraph(branchName);
                        const branchStats = await fs.stat(branchPath);
                        let purpose = "Custom memory branch";
                        if (branchName === "docs")
                            purpose =
                                "Technical documentation, API specs, and development guides";
                        else if (branchName === "marketing")
                            purpose =
                                "Marketing content, user stories, and business communications";
                        else if (branchName === "frontend")
                            purpose =
                                "Frontend components, UI elements, and client-side logic";
                        else if (branchName === "backend")
                            purpose = "Backend services, APIs, and server-side logic";
                        branches.push({
                            name: branchName,
                            path: branchPath,
                            purpose,
                            entityCount: branchGraph.entities.length,
                            relationCount: branchGraph.relations.length,
                            lastUpdated: branchStats.mtime.toISOString(),
                        });
                    }
                    catch (error) {
                        console.error(`Error reading branch ${branchName}:`, error);
                    }
                }
            }
        }
        catch (error) {
            // Branches directory doesn't exist yet
        }
        return branches.sort((a, b) => a.name === "main"
            ? -1
            : b.name === "main"
                ? 1
                : a.name.localeCompare(b.name));
    }
    async exportBranch(branchName) {
        return await this.loadGraph(branchName);
    }
    async importData(data, branchName) {
        await this.saveGraph(data, branchName);
    }
    async addObservations(observations, branchName) {
        const graph = await this.loadGraph(branchName);
        const results = [];
        for (const obs of observations) {
            const entity = graph.entities.find((e) => e.name === obs.entityName);
            if (entity) {
                const addedObservations = [];
                for (const content of obs.contents) {
                    if (content && content.trim()) {
                        entity.observations = entity.observations || [];
                        entity.observations.push(content);
                        addedObservations.push(content);
                    }
                }
                entity.lastUpdated = new Date().toISOString();
                results.push({
                    entityName: obs.entityName,
                    addedObservations,
                });
            }
            else {
                console.warn(`Entity "${obs.entityName}" not found in branch ${branchName || "main"}`);
            }
        }
        await this.saveGraph(graph, branchName);
        return results;
    }
    async deleteObservations(deletions, branchName) {
        const graph = await this.loadGraph(branchName);
        for (const deletion of deletions) {
            const entity = graph.entities.find((e) => e.name === deletion.entityName);
            if (entity && entity.observations) {
                // Remove specific observations
                entity.observations = entity.observations.filter((obs) => !deletion.observations.includes(obs));
                entity.lastUpdated = new Date().toISOString();
            }
            else {
                console.warn(`Entity "${deletion.entityName}" not found in branch ${branchName || "main"}`);
            }
        }
        await this.saveGraph(graph, branchName);
    }
    async createCrossReference(entityName, targetBranch, targetEntityNames, sourceBranch) {
        const sourceGraph = await this.loadGraph(sourceBranch);
        const targetGraph = await this.loadGraph(targetBranch);
        const sourceEntity = sourceGraph.entities.find((e) => e.name === entityName);
        if (!sourceEntity) {
            throw new Error(`Entity "${entityName}" not found in branch ${sourceBranch || "main"}`);
        }
        // Verify target entities exist
        const validTargets = targetEntityNames.filter((targetName) => targetGraph.entities.some((e) => e.name === targetName));
        if (validTargets.length === 0) {
            throw new Error(`No valid target entities found in branch "${targetBranch}"`);
        }
        // Add cross-reference information to the source entity
        sourceEntity.crossReferences = sourceEntity.crossReferences || [];
        for (const targetName of validTargets) {
            const crossRef = {
                targetBranch,
                targetEntity: targetName,
                createdAt: new Date().toISOString(),
            };
            // Avoid duplicates
            const exists = sourceEntity.crossReferences.some((ref) => ref.targetBranch === targetBranch && ref.targetEntity === targetName);
            if (!exists) {
                sourceEntity.crossReferences.push(crossRef);
            }
        }
        sourceEntity.lastUpdated = new Date().toISOString();
        await this.saveGraph(sourceGraph, sourceBranch);
    }
    async close() {
        // JSON operations don't need cleanup
    }
}
