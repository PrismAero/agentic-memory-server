import { logger } from "../logger.js";
/**
 * Search and Query Handlers
 * Handles intelligent search with similarity enhancement
 */
export class SearchHandlers {
    memoryManager;
    modernSimilarity;
    constructor(memoryManager, modernSimilarity) {
        this.memoryManager = memoryManager;
        this.modernSimilarity = modernSimilarity;
    }
    async handleSmartSearch(args) {
        if (!args.query) {
            throw new Error("query is required");
        }
        if (!args.branch_name) {
            throw new Error("branch_name is required. Use '*' to search all branches.");
        }
        const contextDepth = args.context_depth || 2;
        const searchAllBranches = args.branch_name === "*";
        const branchToSearch = searchAllBranches
            ? undefined
            : args.branch_name;
        logger.info(`Smart search ${searchAllBranches
            ? "across all branches"
            : `isolated to branch: "${args.branch_name}"`}`);
        // Search specific branch with smart context expansion
        const searchResults = await this.memoryManager.searchNodes(args.query, branchToSearch, args.include_statuses, true // Always enable auto cross context for smart search
        );
        // Enhance with similarity engine for related entity detection
        // Disable similarity enhancement for global search to avoid performance issues
        if (!searchAllBranches && searchResults.entities.length > 0) {
            logger.info(`Smart search enhancing results with similarity detection...`);
            try {
                // If we found entities, use similarity engine to find additional related entities
                const allBranchEntities = await this.memoryManager.readGraph(args.branch_name, args.include_statuses, false // Don't include cross-context for similarity processing
                );
                const additionalEntities = new Set();
                // For each found entity, find similar ones that weren't in the original search
                for (const foundEntity of searchResults.entities) {
                    const similarEntities = await this.modernSimilarity.detectSimilarEntities(foundEntity, allBranchEntities.entities.filter((e) => e.name !== foundEntity.name &&
                        !searchResults.entities.some((se) => se.name === e.name)));
                    // Add medium and high confidence similar entities to context
                    for (const match of similarEntities) {
                        if (match.confidence === "high" || match.confidence === "medium") {
                            additionalEntities.add(match.entity.name);
                        }
                    }
                }
                // Fetch additional entities and their relations
                if (additionalEntities.size > 0) {
                    const additionalResults = await this.memoryManager.openNodes(Array.from(additionalEntities), args.branch_name, args.include_statuses, true);
                    // Merge additional entities into search results
                    const entityNames = new Set(searchResults.entities.map((e) => e.name));
                    const newEntities = additionalResults.entities.filter((e) => !entityNames.has(e.name));
                    const newRelations = additionalResults.relations.filter((r) => !searchResults.relations.some((sr) => sr.from === r.from &&
                        sr.to === r.to &&
                        sr.relationType === r.relationType));
                    searchResults.entities.push(...newEntities);
                    searchResults.relations.push(...newRelations);
                    logger.info(`Smart search added ${newEntities.length} similar entities via similarity engine`);
                }
            }
            catch (error) {
                logger.warn("Similarity enhancement failed, using standard search results:", error);
            }
        }
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify({
                        results: searchResults,
                        branch_searched: args.branch_name,
                        query: args.query,
                        context_depth: contextDepth,
                        search_type: "smart_search",
                        branch_isolation: searchAllBranches ? "none" : "enforced",
                        summary: `Smart search found ${searchResults.entities.length} entities and ${searchResults.relations.length} relations in ${searchAllBranches
                            ? "all branches"
                            : `branch "${args.branch_name}"`}`,
                    }, null, 2),
                },
            ],
        };
    }
}
