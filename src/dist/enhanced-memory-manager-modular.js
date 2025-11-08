/**
 * Modular Enhanced Memory Manager
 * Lightweight orchestrator that delegates to focused modules
 *
 * modular architecture where each module has a single responsibility.
 */
import { HybridMemoryManager } from "./modules/hybrid-memory-manager.js";
/**
 * Enhanced Memory Manager - Now just a thin wrapper around the hybrid manager
 * Maintains API compatibility while providing cleaner internal architecture
 */
export class EnhancedMemoryManager {
    hybridManager;
    constructor() {
        this.hybridManager = new HybridMemoryManager();
    }
    // Core operations - simple delegation
    async initialize() {
        return await this.hybridManager.initialize();
    }
    async close() {
        return await this.hybridManager.close();
    }
    // Entity operations
    async createEntities(entities, branchName) {
        return await this.hybridManager.createEntities(entities, branchName);
    }
    async updateEntity(entity, branchName) {
        return await this.hybridManager.updateEntity(entity, branchName);
    }
    async deleteEntities(entityNames, branchName) {
        return await this.hybridManager.deleteEntities(entityNames, branchName);
    }
    // Relation operations
    async createRelations(relations, branchName) {
        return await this.hybridManager.createRelations(relations, branchName);
    }
    async deleteRelations(relations, branchName) {
        return await this.hybridManager.deleteRelations(relations, branchName);
    }
    // Search operations
    async searchEntities(query, branchName, includeStatuses) {
        return await this.hybridManager.searchEntities(query, branchName, includeStatuses);
    }
    async findEntityByName(name, branchName) {
        return await this.hybridManager.findEntityByName(name, branchName);
    }
    // Branch operations
    async createBranch(branchName, purpose) {
        return await this.hybridManager.createBranch(branchName, purpose);
    }
    async deleteBranch(branchName) {
        return await this.hybridManager.deleteBranch(branchName);
    }
    async listBranches() {
        return await this.hybridManager.listBranches();
    }
    // Export/Import
    async exportBranch(branchName) {
        return await this.hybridManager.exportBranch(branchName);
    }
    async importData(data, branchName) {
        return await this.hybridManager.importData(data, branchName);
    }
    // Utility methods
    async suggestBranch(entityType, content) {
        return await this.hybridManager.suggestBranch(entityType, content);
    }
    // Legacy compatibility methods (maintain exact API)
    async readGraph(branchName, includeStatuses, autoCrossContext = true) {
        return await this.hybridManager.readGraph(branchName, includeStatuses, autoCrossContext);
    }
    async searchNodes(query, branchName, includeStatuses, autoCrossContext = true) {
        return await this.hybridManager.searchNodes(query, branchName, includeStatuses, autoCrossContext);
    }
    async openNodes(names, branchName, includeStatuses, autoCrossContext = true) {
        return await this.hybridManager.openNodes(names, branchName, includeStatuses, autoCrossContext);
    }
    async addObservations(observations, branchName) {
        return await this.hybridManager.addObservations(observations, branchName);
    }
    async updateEntityStatus(entityName, newStatus, statusReason, branchName) {
        return await this.hybridManager.updateEntityStatus(entityName, newStatus, statusReason, branchName);
    }
    async deleteObservations(deletions, branchName) {
        return await this.hybridManager.deleteObservations(deletions, branchName);
    }
    async createCrossReference(entityName, targetBranch, targetEntityNames, sourceBranch) {
        return await this.hybridManager.createCrossReference(entityName, targetBranch, targetEntityNames, sourceBranch);
    }
    async getCrossContext(entityNames, sourceBranch) {
        return await this.hybridManager.getCrossContext(entityNames, sourceBranch);
    }
}
