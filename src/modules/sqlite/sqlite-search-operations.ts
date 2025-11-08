import { Entity, EntityStatus, KnowledgeGraph } from "../../memory-types.js";
import { SQLiteConnection } from "./sqlite-connection.js";
import { SQLiteEntityOperations } from "./sqlite-entity-operations.js";
import { SQLiteRelationOperations } from "./sqlite-relation-operations.js";

/**
 * SQLite Search Operations
 * Handles search and query operations for entities and relations
 */
export class SQLiteSearchOperations {
  constructor(
    private connection: SQLiteConnection,
    private entityOps: SQLiteEntityOperations,
    private relationOps: SQLiteRelationOperations
  ) {}

  async searchEntities(
    query: string,
    branchName?: string,
    includeStatuses?: EntityStatus[]
  ): Promise<KnowledgeGraph> {
    const entities = await this.performSearch(
      query,
      branchName,
      includeStatuses
    );

    // Get relations for the found entities
    let relations: any[] = [];
    if (entities.length > 0) {
      const branchId = branchName
        ? await this.connection.getBranchId(branchName)
        : undefined;
      const entityNames = entities.map((e) => e.name);
      relations = await this.relationOps.getRelationsForEntities(
        entityNames,
        branchId
      );
    }

    return { entities, relations };
  }

  private async performSearch(
    query: string,
    branchName?: string,
    includeStatuses?: EntityStatus[]
  ): Promise<Entity[]> {
    // Handle special case: "*" means search all branches
    const branchId =
      branchName && branchName !== "*"
        ? await this.connection.getBranchId(branchName)
        : null;

    // Enhanced search with multiple strategies
    const searchTerms = this.prepareSearchTerms(query);
    const results = await this.executeEnhancedSearch(
      searchTerms,
      branchId,
      includeStatuses
    );

    return this.entityOps.convertRowsToEntities(results);
  }

  private prepareSearchTerms(query: string): string[] {
    // Split query into individual words and clean them
    const terms = query
      .toLowerCase()
      .split(/[\s\-_,./]+/)
      .filter((term) => term.length > 1)
      .map((term) => term.trim());

    // Remove duplicates and common stop words
    const stopWords = new Set([
      "the",
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
    ]);
    return Array.from(new Set(terms)).filter((term) => !stopWords.has(term));
  }

  private async executeEnhancedSearch(
    searchTerms: string[],
    branchId: number | null,
    includeStatuses?: EntityStatus[]
  ): Promise<any[]> {
    if (searchTerms.length === 0) return [];

    // Combine multiple search strategies
    const results = new Map<number, any>();

    // Strategy 1: Keyword-based search (highest priority)
    const keywordResults = await this.searchByKeywords(
      searchTerms,
      branchId,
      includeStatuses
    );
    keywordResults.forEach((result) => {
      results.set(result.id, {
        ...result,
        relevance_score: (result.relevance_score || 0) + 15,
      });
    });

    // Strategy 2: FTS search (high priority)
    const ftsResults = await this.searchByFTS(
      searchTerms,
      branchId,
      includeStatuses
    );
    ftsResults.forEach((result) => {
      const existing = results.get(result.id);
      if (existing) {
        existing.relevance_score += 10;
      } else {
        results.set(result.id, { ...result, relevance_score: 10 });
      }
    });

    // Strategy 3: Traditional LIKE search (fallback)
    const likeResults = await this.searchByLike(
      searchTerms,
      branchId,
      includeStatuses
    );
    likeResults.forEach((result) => {
      const existing = results.get(result.id);
      if (existing) {
        existing.relevance_score += 5;
      } else {
        results.set(result.id, { ...result, relevance_score: 5 });
      }
    });

    // Convert to array and sort by relevance
    return Array.from(results.values())
      .filter((result) => result.relevance_score > 0)
      .sort((a, b) => b.relevance_score - a.relevance_score)
      .slice(0, 50);
  }

  private async searchByKeywords(
    searchTerms: string[],
    branchId: number | null,
    includeStatuses?: EntityStatus[]
  ): Promise<any[]> {
    const statuses =
      includeStatuses && includeStatuses.length > 0
        ? includeStatuses
        : ["active"];

    // Search for entities that have matching keywords
    let params: any[] = [];
    const keywordConditions = searchTerms
      .map(() => "k.keyword LIKE ?")
      .join(" OR ");
    searchTerms.forEach((term) => params.push(`%${term}%`));

    let whereClause = `WHERE (${keywordConditions})`;

    if (branchId !== null) {
      whereClause += " AND e.branch_id = ?";
      params.push(branchId);
    }

    whereClause += ` AND e.status IN (${statuses.map(() => "?").join(",")})`;
    params.push(...statuses);

    const results = await this.connection.runQuery(
      `
      SELECT DISTINCT e.*, 
             GROUP_CONCAT(o.content, '|') as observations,
             COUNT(k.id) * MAX(k.weight) as relevance_score
      FROM entities e
      LEFT JOIN observations o ON e.id = o.entity_id
      LEFT JOIN keywords k ON e.id = k.entity_id
      ${whereClause}
      GROUP BY e.id
      ORDER BY relevance_score DESC
      `,
      params
    );

    return results;
  }

  private async searchByFTS(
    searchTerms: string[],
    branchId: number | null,
    includeStatuses?: EntityStatus[]
  ): Promise<any[]> {
    const statuses =
      includeStatuses && includeStatuses.length > 0
        ? includeStatuses
        : ["active"];
    const query = searchTerms.join(" OR ");

    let params: any[] = [query];
    let whereClause = "";

    if (branchId !== null) {
      whereClause += " AND e.branch_id = ?";
      params.push(branchId);
    }

    whereClause += ` AND e.status IN (${statuses.map(() => "?").join(",")})`;
    params.push(...statuses);

    try {
      const results = await this.connection.runQuery(
        `
        SELECT DISTINCT e.*, 
               GROUP_CONCAT(o.content, '|') as observations,
               fts.rank as relevance_score
        FROM entities_fts fts
        JOIN entities e ON e.id = fts.rowid
        LEFT JOIN observations o ON e.id = o.entity_id
        WHERE entities_fts MATCH ?${whereClause}
        GROUP BY e.id
        ORDER BY fts.rank
        `,
        params
      );
      return results;
    } catch (error) {
      // FTS might fail, fallback gracefully
      console.warn("FTS search failed:", error);
      return [];
    }
  }

  private async searchByLike(
    searchTerms: string[],
    branchId: number | null,
    includeStatuses?: EntityStatus[]
  ): Promise<any[]> {
    // Build dynamic WHERE clause with scoring
    let whereConditions: string[] = [];
    let params: any[] = [];
    let scoreCalculation: string[] = [];

    // Exact name matches (highest priority)
    searchTerms.forEach((term, index) => {
      whereConditions.push(`(e.name LIKE ? OR e.entity_type LIKE ?)`);
      params.push(`%${term}%`, `%${term}%`);

      // Add scoring for relevance
      scoreCalculation.push(`
        CASE 
          WHEN e.name LIKE ? THEN 10
          WHEN e.entity_type LIKE ? THEN 8
          ELSE 0
        END
      `);
      params.push(`%${term}%`, `%${term}%`);
    });

    // Content matches (lower priority but included)
    const contentConditions = searchTerms
      .map(() => `o.content LIKE ?`)
      .join(" OR ");
    if (contentConditions) {
      whereConditions.push(`(${contentConditions})`);
      searchTerms.forEach((term) => {
        params.push(`%${term}%`);
        scoreCalculation.push(`CASE WHEN o.content LIKE ? THEN 3 ELSE 0 END`);
        params.push(`%${term}%`);
      });
    }

    let whereClause =
      whereConditions.length > 0
        ? `WHERE (${whereConditions.join(" OR ")})`
        : "WHERE 1=1";

    if (branchId !== null) {
      whereClause += " AND e.branch_id = ?";
      params.push(branchId);
    }

    // Add status filtering
    const statuses =
      includeStatuses && includeStatuses.length > 0
        ? includeStatuses
        : ["active"];
    whereClause += ` AND e.status IN (${statuses.map(() => "?").join(",")})`;
    params.push(...statuses);

    // Build the score calculation
    const scoreExpression =
      scoreCalculation.length > 0
        ? `(${scoreCalculation.join(" + ")}) as relevance_score`
        : "0 as relevance_score";

    const results = await this.connection.runQuery(
      `
      SELECT DISTINCT e.*, 
             GROUP_CONCAT(o.content, '|') as observations,
             ${scoreExpression}
      FROM entities e
      LEFT JOIN observations o ON e.id = o.entity_id
      ${whereClause}
      GROUP BY e.id
      HAVING relevance_score > 0
      ORDER BY relevance_score DESC, e.last_accessed DESC
    `,
      params
    );

    return results;
  }
}
