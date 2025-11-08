import path from "path";
import { MemoryOptimizer } from "../memory-optimizer.js";
import { BackupOperations } from "./backup-operations.js";
import { JSONOperations } from "./json-operations.js";
import { logger } from "./logger.js";
import { MigrationUtils } from "./migration-utils.js";
import { ModularSQLiteOperations } from "./sqlite/index.js";
/**
 * Hybrid Memory Manager - Lightweight Orchestrator
 * Coordinates SQLite, JSON, optimization, and backup operations
 * Much smaller and focused on delegation rather than implementation
 */
export class HybridMemoryManager {
    sqliteOps;
    jsonOps;
    migrationUtils;
    backupOps;
    optimizer;
    useSQLite = true;
    migrationInProgress = false;
    constructor(basePath) {
        const memoryPath = basePath || process.env.MEMORY_PATH || path.join(process.cwd(), "memory");
        this.sqliteOps = new ModularSQLiteOperations(memoryPath);
        this.jsonOps = new JSONOperations(memoryPath);
        this.migrationUtils = new MigrationUtils(memoryPath);
        this.backupOps = new BackupOperations(memoryPath);
        this.optimizer = new MemoryOptimizer({
            compressionLevel: "aggressive", // Use aggressive for maximum compression
            extractKeywords: true,
            extractEntities: true,
        });
    }
    async initialize() {
        // Initialize backup system
        await this.backupOps.initialize();
        if (this.useSQLite) {
            // Initialize SQLite
            await this.sqliteOps.initialize();
            logger.info("Enhanced Memory Manager initialized with SQLite, text optimization, and keyword extraction");
            // Perform migration if needed
            await this.performMigration();
        }
        else {
            // Initialize JSON
            await this.jsonOps.initialize();
            logger.info("Enhanced Memory Manager initialized with JSON, text optimization, and keyword extraction");
        }
    }
    async performMigration() {
        this.migrationInProgress = true;
        try {
            const memoryFiles = await this.migrationUtils.discoverMemoryFiles();
            if (memoryFiles.length === 0) {
                logger.info("No existing memory files found - starting fresh");
                this.migrationInProgress = false;
                return;
            }
            logger.info(`Found ${memoryFiles.length} memory files to migrate`);
            for (const { path: filePath, branch } of memoryFiles) {
                logger.info(`Migrating ${branch} branch from ${filePath}...`);
                // Parse JSON file
                const graph = await this.migrationUtils.parseJsonMemoryFile(filePath);
                if (graph.entities.length > 0 || graph.relations.length > 0) {
                    // Import to SQLite
                    await this.sqliteOps.importData(graph, branch);
                    logger.info(`Migrated ${graph.entities.length} entities and ${graph.relations.length} relations to SQLite`);
                    // Create backup before cleanup
                    await this.migrationUtils.createMigrationBackup(filePath, branch);
                }
            }
            logger.info("Migration completed successfully");
        }
        catch (error) {
            logger.error("Migration failed:", error);
        }
        finally {
            this.migrationInProgress = false;
        }
    }
    // Delegate to appropriate storage backend
    async createEntities(entities, branchName) {
        // Don't use SQLite during migration to avoid recursion
        if (this.useSQLite && !this.migrationInProgress) {
            logger.debug(`Using SQLite for entity creation`);
            // Apply optimization before storing
            const optimizedEntities = entities.map((entity) => {
                // Optimize each observation individually for better results
                const optimizedObservations = (entity.observations || []).map((obs) => {
                    const optimization = this.optimizer.optimize(obs);
                    return optimization.optimized;
                });
                // Also optimize the overall entity content for keyword extraction
                const content = JSON.stringify({
                    name: entity.name,
                    entityType: entity.entityType,
                    observations: entity.observations,
                });
                const optimization = this.optimizer.optimize(content);
                logger.debug(`Entity "${entity.name}" optimized: ${optimization.originalTokenCount} → ${optimization.tokenCount} tokens (${Math.round(optimization.compressionRatio * 100)}%)`);
                logger.debug(`Keywords: ${optimization.keywords.join(", ")}`);
                return {
                    ...entity,
                    observations: optimizedObservations, // Use optimized observations
                    status: entity.status || "active",
                    lastUpdated: new Date().toISOString(),
                    _keywordData: {
                        keywords: optimization.keywords,
                        entities: optimization.entities,
                        compressionRatio: optimization.compressionRatio,
                    },
                };
            });
            const result = await this.sqliteOps.createEntities(optimizedEntities, branchName);
            // Create backup
            const graph = await this.sqliteOps.exportBranch(branchName);
            await this.backupOps.createBackup(graph, branchName);
            return result;
        }
        else {
            logger.warn(`Using JSON fallback (migration: ${this.migrationInProgress})`);
            return await this.jsonOps.createEntities(entities, branchName);
        }
    }
    async updateEntity(entity, branchName) {
        if (this.useSQLite && !this.migrationInProgress) {
            return await this.sqliteOps.updateEntity(entity, branchName);
        }
        else {
            return await this.jsonOps.updateEntity(entity, branchName);
        }
    }
    async deleteEntities(entityNames, branchName) {
        if (this.useSQLite && !this.migrationInProgress) {
            return await this.sqliteOps.deleteEntities(entityNames, branchName);
        }
        else {
            return await this.jsonOps.deleteEntities(entityNames, branchName);
        }
    }
    async createRelations(relations, branchName) {
        if (this.useSQLite && !this.migrationInProgress) {
            return await this.sqliteOps.createRelations(relations, branchName);
        }
        else {
            return await this.jsonOps.createRelations(relations, branchName);
        }
    }
    async deleteRelations(relations, branchName) {
        if (this.useSQLite && !this.migrationInProgress) {
            return await this.sqliteOps.deleteRelations(relations, branchName);
        }
        else {
            return await this.jsonOps.deleteRelations(relations, branchName);
        }
    }
    async searchEntities(query, branchName, includeStatuses) {
        if (this.useSQLite && !this.migrationInProgress) {
            return await this.sqliteOps.searchEntities(query, branchName, includeStatuses);
        }
        else {
            return await this.jsonOps.searchEntities(query, branchName, includeStatuses);
        }
    }
    async findEntityByName(name, branchName) {
        if (this.useSQLite && !this.migrationInProgress) {
            return await this.sqliteOps.findEntityByName(name, branchName);
        }
        else {
            return await this.jsonOps.findEntityByName(name, branchName);
        }
    }
    async createBranch(branchName, purpose) {
        if (this.useSQLite && !this.migrationInProgress) {
            return await this.sqliteOps.createBranch(branchName, purpose);
        }
        else {
            return await this.jsonOps.createBranch(branchName, purpose);
        }
    }
    async deleteBranch(branchName) {
        if (this.useSQLite && !this.migrationInProgress) {
            return await this.sqliteOps.deleteBranch(branchName);
        }
        else {
            return await this.jsonOps.deleteBranch(branchName);
        }
    }
    async listBranches() {
        if (this.useSQLite && !this.migrationInProgress) {
            return await this.sqliteOps.listBranches();
        }
        else {
            return await this.jsonOps.listBranches();
        }
    }
    async exportBranch(branchName) {
        if (this.useSQLite && !this.migrationInProgress) {
            return await this.sqliteOps.exportBranch(branchName);
        }
        else {
            return await this.jsonOps.exportBranch(branchName);
        }
    }
    async importData(data, branchName) {
        if (this.useSQLite && !this.migrationInProgress) {
            return await this.sqliteOps.importData(data, branchName);
        }
        else {
            return await this.jsonOps.importData(data, branchName);
        }
    }
    async close() {
        // Clean up old backups before closing
        await this.backupOps.cleanupBackups(5);
        if (this.useSQLite) {
            await this.sqliteOps.close();
        }
        await this.jsonOps.close();
        logger.info("Hybrid Memory Manager closed");
    }
    // Utility methods
    async suggestBranch(entityType, content) {
        return await this.sqliteOps.suggestBranch(entityType, content);
    }
    // Legacy compatibility methods for existing API
    async readGraph(branchName, includeStatuses, autoCrossContext = true) {
        return await this.exportBranch(branchName);
    }
    async searchNodes(query, branchName, includeStatuses, autoCrossContext = true) {
        return await this.searchEntities(query, branchName, includeStatuses);
    }
    async openNodes(names, branchName, includeStatuses, autoCrossContext = true) {
        // Use direct entity lookup instead of search
        const foundEntities = [];
        const allRelations = [];
        for (const name of names) {
            // Use findEntityByName for exact lookup
            const entity = await this.findEntityByName(name, branchName);
            if (entity) {
                // Check status filter if provided
                if (!includeStatuses ||
                    includeStatuses.includes(entity.status)) {
                    foundEntities.push(entity);
                    // Get all relations involving this entity from the full branch
                    const branchGraph = await this.exportBranch(branchName);
                    const entityRelations = branchGraph.relations.filter((r) => r.from === name || r.to === name);
                    allRelations.push(...entityRelations);
                }
            }
        }
        // Remove duplicate relations
        const uniqueRelations = allRelations.filter((relation, index, arr) => arr.findIndex((r) => r.from === relation.from &&
            r.to === relation.to &&
            r.relationType === relation.relationType) === index);
        return { entities: foundEntities, relations: uniqueRelations };
    }
    // Additional compatibility methods
    async addObservations(observations, branchName) {
        if (this.useSQLite && !this.migrationInProgress) {
            return await this.sqliteOps.addObservations(observations, branchName);
        }
        else {
            return await this.jsonOps.addObservations(observations, branchName);
        }
    }
    async updateEntityStatus(entityName, newStatus, statusReason, branchName) {
        const entity = await this.findEntityByName(entityName, branchName);
        if (!entity) {
            throw new Error(`Entity "${entityName}" not found`);
        }
        const updatedEntity = {
            ...entity,
            status: newStatus,
            statusReason,
            lastUpdated: new Date().toISOString(),
        };
        await this.updateEntity(updatedEntity, branchName);
    }
    async deleteObservations(deletions, branchName) {
        if (this.useSQLite && !this.migrationInProgress) {
            return await this.sqliteOps.deleteObservations(deletions, branchName);
        }
        else {
            return await this.jsonOps.deleteObservations(deletions, branchName);
        }
    }
    async createCrossReference(entityName, targetBranch, targetEntityNames, sourceBranch) {
        if (this.useSQLite && !this.migrationInProgress) {
            return await this.sqliteOps.createCrossReference(entityName, targetBranch, targetEntityNames, sourceBranch);
        }
        else {
            return await this.jsonOps.createCrossReference(entityName, targetBranch, targetEntityNames, sourceBranch);
        }
    }
    async getCrossContext(entityNames, sourceBranch) {
        if (entityNames.length > 0) {
            return await this.searchEntities(entityNames.join(" "), sourceBranch);
        }
        else {
            return await this.exportBranch(sourceBranch);
        }
    }
}
