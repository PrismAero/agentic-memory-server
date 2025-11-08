/**
 * Relationship Indexer - Continuous Background Relationship Detection
 * Maintains an index of entities and their potential relationships like a search engine
 */
export class RelationshipIndexer {
    modernSimilarity;
    memoryManager;
    // Index storage
    entityIndex = new Map();
    branchIndices = new Map();
    typeIndices = new Map();
    keywordIndex = new Map();
    // Background processing
    taskQueue = [];
    isProcessing = false;
    processingInterval;
    // Configuration - Lowered thresholds for better detection
    AUTO_RELATION_THRESHOLD = 0.78;
    SUGGESTION_THRESHOLD = 0.7;
    PROCESS_INTERVAL_MS = 2000; // Faster processing
    constructor(memoryManager, modernSimilarity) {
        this.memoryManager = memoryManager;
        this.modernSimilarity = modernSimilarity;
    }
    async initialize() {
        console.error("🚀 Initializing Relationship Indexer...");
        // Start background processing
        this.startBackgroundProcessing();
        // Queue initial index build
        this.queueTask({
            id: `init_${Date.now()}`,
            type: "cleanup_stale",
            priority: "high",
            createdAt: new Date(),
        });
        console.error("✅ Relationship Indexer ready");
    }
    startBackgroundProcessing() {
        this.processingInterval = setInterval(() => {
            this.processTaskQueue();
        }, this.PROCESS_INTERVAL_MS);
    }
    async processTaskQueue() {
        if (this.isProcessing || this.taskQueue.length === 0)
            return;
        this.isProcessing = true;
        try {
            // Process one task at a time to avoid overwhelming the system
            const task = this.taskQueue.shift();
            if (task) {
                await this.processTask(task);
            }
        }
        catch (error) {
            console.error("❌ Background task failed:", error);
        }
        finally {
            this.isProcessing = false;
        }
    }
    async processTask(task) {
        switch (task.type) {
            case "index_entity":
                if (task.entityId) {
                    await this.indexEntity(task.entityId, task.branchName);
                }
                break;
            case "detect_relationships":
                if (task.entityId) {
                    await this.detectRelationshipsForEntity(task.entityId, task.branchName);
                }
                break;
            case "cleanup_stale":
                await this.buildInitialIndex();
                break;
        }
    }
    queueTask(task) {
        // Prevent duplicate tasks
        const exists = this.taskQueue.some((existing) => existing.type === task.type &&
            existing.entityId === task.entityId &&
            existing.branchName === task.branchName);
        if (!exists) {
            this.taskQueue.push(task);
        }
    }
    async indexEntity(entityId, branchName) {
        try {
            const entities = await this.memoryManager.openNodes([entityId], branchName);
            if (entities.entities.length === 0)
                return;
            const entity = entities.entities[0];
            const keywords = this.extractKeywords(entity);
            const indexEntry = {
                entityId: entity.name,
                entityType: entity.entityType,
                keywords,
                lastIndexed: new Date(),
                similarityScores: new Map(),
                suggestedRelations: new Map(),
            };
            this.entityIndex.set(entity.name, indexEntry);
            // Update indices
            const branchKey = branchName || "main";
            if (!this.branchIndices.has(branchKey)) {
                this.branchIndices.set(branchKey, new Set());
            }
            this.branchIndices.get(branchKey).add(entity.name);
            if (!this.typeIndices.has(entity.entityType)) {
                this.typeIndices.set(entity.entityType, new Set());
            }
            this.typeIndices.get(entity.entityType).add(entity.name);
            for (const keyword of keywords) {
                if (!this.keywordIndex.has(keyword)) {
                    this.keywordIndex.set(keyword, new Set());
                }
                this.keywordIndex.get(keyword).add(entity.name);
            }
            // Queue relationship detection
            this.queueTask({
                id: `detect_${entityId}_${Date.now()}`,
                type: "detect_relationships",
                entityId,
                branchName,
                priority: "normal",
                createdAt: new Date(),
            });
        }
        catch (error) {
            console.error(`❌ Failed to index entity ${entityId}:`, error);
        }
    }
    async detectRelationshipsForEntity(entityId, branchName) {
        try {
            const indexEntry = this.entityIndex.get(entityId);
            if (!indexEntry)
                return;
            const entities = await this.memoryManager.openNodes([entityId], branchName);
            if (entities.entities.length === 0)
                return;
            const targetEntity = entities.entities[0];
            // Get potential candidates from same branch/type
            const branchKey = branchName || "main";
            const entityIds = this.branchIndices.get(branchKey);
            if (!entityIds || entityIds.size <= 1)
                return;
            const candidateIds = Array.from(entityIds)
                .filter((id) => id !== entityId)
                .slice(0, 20); // Limit for performance
            const candidateEntities = await this.memoryManager.openNodes(candidateIds, branchName);
            // Use embedding similarity
            const similarEntities = await this.modernSimilarity.detectSimilarEntities(targetEntity, candidateEntities.entities);
            // Update index
            indexEntry.similarityScores.clear();
            indexEntry.suggestedRelations.clear();
            for (const match of similarEntities) {
                indexEntry.similarityScores.set(match.entity.name, match.similarity);
                if (match.confidence === "high" || match.confidence === "medium") {
                    indexEntry.suggestedRelations.set(match.entity.name, {
                        type: match.suggestedRelationType,
                        confidence: match.similarity,
                    });
                }
            }
            if (similarEntities.length > 0) {
                console.error(`🔍 Background indexed ${similarEntities.length} relationship candidates for ${entityId}`);
                // Log top matches for debugging
                for (const match of similarEntities.slice(0, 3)) {
                    console.error(`  ➤ Background match: "${match.entity.name}" similarity=${match.similarity.toFixed(3)} confidence=${match.confidence}`);
                }
            }
        }
        catch (error) {
            console.error(`❌ Failed to detect relationships for ${entityId}:`, error);
        }
    }
    async buildInitialIndex() {
        try {
            // Get all branches and index their entities
            const branches = await this.memoryManager.listBranches();
            for (const branch of branches) {
                const graph = await this.memoryManager.readGraph(branch.name === "main" ? undefined : branch.name, ["active", "draft"], false);
                // Queue indexing for each entity
                for (const entity of graph.entities.slice(0, 50)) {
                    // Limit initial index size
                    this.queueTask({
                        id: `index_${entity.name}_${Date.now()}`,
                        type: "index_entity",
                        entityId: entity.name,
                        branchName: branch.name === "main" ? undefined : branch.name,
                        priority: "low",
                        createdAt: new Date(),
                    });
                }
            }
            console.error(`🔄 Queued initial indexing for relationship detection`);
        }
        catch (error) {
            console.error("❌ Failed to build initial index:", error);
        }
    }
    // ===== PUBLIC API =====
    /**
     * Called when a new entity is created
     */
    onEntityCreated(entityId, branchName) {
        this.queueTask({
            id: `created_${entityId}_${Date.now()}`,
            type: "index_entity",
            entityId,
            branchName,
            priority: "high",
            createdAt: new Date(),
        });
    }
    /**
     * Get relationship suggestions for an entity
     */
    getRelationshipSuggestions(entityId) {
        const indexEntry = this.entityIndex.get(entityId);
        if (!indexEntry)
            return [];
        const suggestions = [];
        for (const [targetId, suggestion] of indexEntry.suggestedRelations) {
            suggestions.push({
                targetEntity: targetId,
                relationType: suggestion.type,
                confidence: suggestion.confidence,
                isAutoCreatable: suggestion.confidence > this.AUTO_RELATION_THRESHOLD,
            });
        }
        return suggestions.sort((a, b) => b.confidence - a.confidence).slice(0, 10);
    }
    /**
     * Get statistics about the index
     */
    getStatistics() {
        return {
            totalEntities: this.entityIndex.size,
            totalBranches: this.branchIndices.size,
            queueSize: this.taskQueue.length,
            isProcessing: this.isProcessing,
        };
    }
    /**
     * Shutdown background processing
     */
    shutdown() {
        if (this.processingInterval) {
            clearInterval(this.processingInterval);
            this.processingInterval = undefined;
        }
    }
    // ===== UTILITY METHODS =====
    extractKeywords(entity) {
        const keywords = new Set();
        // Entity type
        keywords.add(entity.entityType.toLowerCase());
        // Name words
        const nameWords = entity.name
            .toLowerCase()
            .split(/\W+/)
            .filter((word) => word.length > 2);
        nameWords.forEach((word) => keywords.add(word));
        // Observation words
        if (entity.observations) {
            for (const obs of entity.observations) {
                const words = obs
                    .toLowerCase()
                    .split(/\W+/)
                    .filter((word) => word.length > 2);
                words.forEach((word) => {
                    if (!this.isStopWord(word)) {
                        keywords.add(word);
                    }
                });
            }
        }
        return keywords;
    }
    isStopWord(word) {
        const stopWords = new Set([
            "the",
            "a",
            "an",
            "and",
            "or",
            "but",
            "in",
            "on",
            "at",
            "to",
            "for",
            "of",
            "with",
            "by",
            "this",
            "that",
            "is",
            "are",
            "was",
            "were",
            "have",
            "has",
            "had",
            "will",
            "would",
            "can",
        ]);
        return stopWords.has(word);
    }
}
