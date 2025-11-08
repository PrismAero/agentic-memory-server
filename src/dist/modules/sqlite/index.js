import { logger } from "../logger.js";
import { SQLiteBranchOperations } from "./sqlite-branch-operations.js";
import { SQLiteConnection } from "./sqlite-connection.js";
import { SQLiteEntityOperations } from "./sqlite-entity-operations.js";
import { SQLiteRelationOperations } from "./sqlite-relation-operations.js";
import { SQLiteSearchOperations } from "./sqlite-search-operations.js";
/**
 * Modular SQLite Operations Orchestrator
 * Delegates work to focused operation modules
 */
export class ModularSQLiteOperations {
    connection;
    entityOps;
    relationOps;
    branchOps;
    searchOps;
    constructor(basePath) {
        this.connection = new SQLiteConnection(basePath);
        this.entityOps = new SQLiteEntityOperations(this.connection);
        this.relationOps = new SQLiteRelationOperations(this.connection);
        this.branchOps = new SQLiteBranchOperations(this.connection);
        this.searchOps = new SQLiteSearchOperations(this.connection, this.entityOps, this.relationOps);
    }
    async initialize() {
        return await this.connection.initialize();
    }
    async close() {
        return await this.connection.close();
    }
    // Entity operations - delegate to EntityOperations
    async createEntities(entities, branchName) {
        return await this.entityOps.createEntities(entities, branchName);
    }
    async updateEntity(entity, branchName) {
        return await this.entityOps.updateEntity(entity, branchName);
    }
    async deleteEntities(entityNames, branchName) {
        return await this.entityOps.deleteEntities(entityNames, branchName);
    }
    async findEntityByName(name, branchName) {
        return await this.entityOps.findEntityByName(name, branchName);
    }
    // Relation operations - delegate to RelationOperations
    async createRelations(relations, branchName) {
        return await this.relationOps.createRelations(relations, branchName);
    }
    async deleteRelations(relations, branchName) {
        return await this.relationOps.deleteRelations(relations, branchName);
    }
    // Search operations - delegate to SearchOperations
    async searchEntities(query, branchName, includeStatuses) {
        return await this.searchOps.searchEntities(query, branchName, includeStatuses);
    }
    // Branch operations - delegate to BranchOperations
    async createBranch(branchName, purpose) {
        return await this.branchOps.createBranch(branchName, purpose);
    }
    async deleteBranch(branchName) {
        return await this.branchOps.deleteBranch(branchName);
    }
    async listBranches() {
        return await this.branchOps.listBranches();
    }
    async suggestBranch(entityType, content) {
        return await this.branchOps.suggestBranch(entityType, content);
    }
    // Additional entity operations
    async addObservations(observations, branchName) {
        return await this.entityOps.addObservations(observations, branchName);
    }
    async deleteObservations(deletions, branchName) {
        return await this.entityOps.deleteObservations(deletions, branchName);
    }
    async createCrossReference(entityName, targetBranch, targetEntityNames, sourceBranch) {
        return await this.entityOps.createCrossReference(entityName, targetBranch, targetEntityNames, sourceBranch);
    }
    // Import/Export operations
    async exportBranch(branchName) {
        const branchId = await this.connection.getBranchId(branchName);
        // Get entities with observations
        const entityRows = await this.connection.runQuery(`
      SELECT e.*, GROUP_CONCAT(o.content, '|') as observations
      FROM entities e
      LEFT JOIN observations o ON e.id = o.entity_id
      WHERE e.branch_id = ?
      GROUP BY e.id
    `, [branchId]);
        const entities = await this.entityOps.convertRowsToEntities(entityRows);
        const relations = await this.relationOps.getAllRelationsForBranch(branchId);
        return { entities, relations };
    }
    async importData(data, branchName) {
        if (!data) {
            logger.warn("No data provided for import");
            return;
        }
        const branchId = await this.connection.getBranchId(branchName);
        logger.info(`Importing data to branch ${branchName || "main"}: ${data.entities?.length || 0} entities, ${data.relations?.length || 0} relations`);
        // Import entities first
        if (data.entities && data.entities.length > 0) {
            await this.entityOps.createEntities(data.entities, branchName);
        }
        // Import relations after entities
        if (data.relations && data.relations.length > 0) {
            await this.relationOps.createRelations(data.relations, branchName);
        }
        // Update branch timestamp
        await this.connection.runQuery("UPDATE memory_branches SET updated_at = ? WHERE id = ?", [new Date().toISOString(), branchId]);
    }
}
