import { Entity, EntityStatus } from "../../memory-types.js";
import { logger } from "../logger.js";
import { SQLiteConnection } from "./sqlite-connection.js";

/**
 * SQLite Entity Operations
 * Handles CRUD operations for entities and observations
 */
export class SQLiteEntityOperations {
  constructor(private connection: SQLiteConnection) {}

  async createEntities(
    entities: Entity[],
    branchName?: string
  ): Promise<Entity[]> {
    const branchId = await this.connection.getBranchId(branchName);
    const created: Entity[] = [];

    for (const entity of entities) {
      try {
        const createdEntity = await this.createSingleEntity(entity, branchId);
        created.push(createdEntity);
      } catch (error) {
        logger.error(`Failed to create entity "${entity.name}":`, error);
        // Continue with other entities
      }
    }

    return created;
  }

  async updateEntity(entity: Entity, branchName?: string): Promise<Entity> {
    const branchId = await this.connection.getBranchId(branchName);

    // Find the existing entity
    const existingEntity = await this.connection.getQuery(
      "SELECT id FROM entities WHERE name = ? AND branch_id = ?",
      [entity.name, branchId]
    );

    if (!existingEntity) {
      throw new Error(
        `Entity "${entity.name}" not found in branch ${branchName || "main"}`
      );
    }

    // Update the entity
    await this.connection.execQuery(
      `UPDATE entities 
       SET entity_type = ?, status = ?, status_reason = ?, updated_at = ?
       WHERE id = ?`,
      [
        entity.entityType,
        entity.status || "active",
        entity.statusReason || null,
        new Date().toISOString(),
        existingEntity.id,
      ]
    );

    // Update observations - delete old ones and insert new ones
    await this.connection.execQuery(
      "DELETE FROM observations WHERE entity_id = ?",
      [existingEntity.id]
    );

    if (entity.observations && entity.observations.length > 0) {
      for (let i = 0; i < entity.observations.length; i++) {
        await this.connection.execQuery(
          `INSERT INTO observations (entity_id, content, optimized_content, sequence_order)
           VALUES (?, ?, ?, ?)`,
          [existingEntity.id, entity.observations[i], entity.observations[i], i]
        );
      }
    }

    // Update cross-references - delete old ones and create new ones
    await this.connection.execQuery(
      "DELETE FROM cross_references WHERE from_entity_id = ?",
      [existingEntity.id]
    );

    const crossRefs = (entity as any).crossRefs || [];
    if (crossRefs.length > 0) {
      const branchName = await this.connection.getBranchName(branchId);
      for (const crossRef of crossRefs) {
        try {
          await this.createCrossReference(
            entity.name,
            crossRef.memoryBranch,
            crossRef.entityNames,
            branchName
          );
        } catch (error) {
          logger.error(
            `Failed to update cross-reference for entity "${entity.name}":`,
            error
          );
        }
      }
    }

    // Retrieve cross-references for the updated entity
    const entityCrossRefs = await this.getCrossReferences(
      entity.name,
      branchId
    );

    return {
      ...entity,
      lastUpdated: new Date().toISOString(),
      crossRefs: entityCrossRefs,
    };
  }

  async deleteEntities(
    entityNames: string[],
    branchName?: string
  ): Promise<void> {
    if (!entityNames || entityNames.length === 0) {
      return;
    }

    const branchId = await this.connection.getBranchId(branchName);

    for (const entityName of entityNames) {
      try {
        // Get entity ID first
        const entity = await this.connection.getQuery(
          "SELECT id FROM entities WHERE name = ? AND branch_id = ?",
          [entityName, branchId]
        );

        if (!entity) {
          logger.warn(
            `Entity "${entityName}" not found in branch ${branchName || "main"}`
          );
          continue;
        }

        // Delete observations first (foreign key constraints)
        await this.connection.execQuery(
          "DELETE FROM observations WHERE entity_id = ?",
          [entity.id]
        );

        // Delete relations involving this entity
        await this.connection.execQuery(
          "DELETE FROM relations WHERE from_entity_id = ? OR to_entity_id = ?",
          [entity.id, entity.id]
        );

        // Delete keywords
        await this.connection.execQuery(
          "DELETE FROM keywords WHERE entity_id = ?",
          [entity.id]
        );

        // Delete cross references
        await this.connection.execQuery(
          "DELETE FROM cross_references WHERE from_entity_id = ?",
          [entity.id]
        );

        // Finally delete the entity (FTS trigger will handle FTS cleanup)
        await this.connection.execQuery("DELETE FROM entities WHERE id = ?", [
          entity.id,
        ]);

        logger.info(`Deleted entity "${entityName}" and all related data`);
      } catch (error) {
        logger.error(`Failed to delete entity "${entityName}":`, error);
        throw error;
      }
    }
  }

  async findEntityByName(
    name: string,
    branchName?: string
  ): Promise<Entity | null> {
    const branchId = branchName
      ? await this.connection.getBranchId(branchName)
      : null;

    let whereClause = "WHERE e.name = ?";
    let params = [name];

    if (branchId) {
      whereClause += " AND e.branch_id = ?";
      params.push(branchId.toString());
    }

    const results = await this.connection.runQuery(
      `
      SELECT DISTINCT e.*, GROUP_CONCAT(o.content, '|') as observations
      FROM entities e
      LEFT JOIN observations o ON e.id = o.entity_id
      ${whereClause}
      GROUP BY e.id
    `,
      params
    );

    if (results.length === 0) {
      return null;
    }

    const entities = await this.convertRowsToEntities(results);
    return entities[0] || null;
  }

  private async createSingleEntity(
    entity: Entity,
    branchId: number
  ): Promise<Entity> {
    // Validate and sanitize entity data
    const validName = (entity.name || "").toString().trim() || "Unnamed Entity";
    const validEntityType =
      (entity.entityType || "").toString().trim() || "Unknown";
    const validObservations = (entity.observations || []).filter(
      (obs) => obs && obs.toString().trim()
    );

    // Check if entity already exists
    const existing = await this.connection.getQuery(
      "SELECT id FROM entities WHERE name = ? AND branch_id = ?",
      [validName, branchId]
    );

    if (existing) {
      throw new Error(`Entity "${validName}" already exists`);
    }

    const originalContent = JSON.stringify({
      name: validName,
      entityType: validEntityType,
      observations: validObservations,
    });

    // Insert entity
    await this.connection.execQuery(
      `
      INSERT INTO entities (name, entity_type, branch_id, status, status_reason, original_content, optimized_content, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
      [
        validName,
        validEntityType,
        branchId,
        entity.status || "active",
        entity.statusReason || null,
        originalContent,
        originalContent, // Will be optimized later
        new Date().toISOString(),
      ]
    );

    const entityRow = await this.connection.getQuery(
      "SELECT id FROM entities WHERE name = ? AND branch_id = ?",
      [validName, branchId]
    );

    // Insert observations
    if (validObservations.length > 0) {
      for (let i = 0; i < validObservations.length; i++) {
        await this.connection.execQuery(
          `
          INSERT INTO observations (entity_id, content, optimized_content, sequence_order)
          VALUES (?, ?, ?, ?)
        `,
          [entityRow.id, validObservations[i], validObservations[i], i]
        );
      }
    }

    // Store keywords if provided
    if ((entity as any)._keywordData?.keywords) {
      const keywords = (entity as any)._keywordData.keywords;
      for (let i = 0; i < keywords.length; i++) {
        const keyword = keywords[i];
        if (keyword && keyword.trim()) {
          await this.connection.execQuery(
            `INSERT INTO keywords (keyword, entity_id, weight, context)
             VALUES (?, ?, ?, ?)`,
            [keyword.trim().toLowerCase(), entityRow.id, 1.0, "entity_content"]
          );
        }
      }
      logger.info(
        `Stored ${keywords.length} keywords for entity "${validName}"`
      );
    }

    // Process cross-references if provided
    const crossRefs = (entity as any).crossRefs || [];
    if (crossRefs.length > 0) {
      const branchName = await this.connection.getBranchName(branchId);
      for (const crossRef of crossRefs) {
        try {
          await this.createCrossReference(
            validName,
            crossRef.memoryBranch,
            crossRef.entityNames,
            branchName
          );
        } catch (error) {
          logger.error(
            `Failed to create cross-reference for entity "${validName}":`,
            error
          );
        }
      }
    }

    // Retrieve cross-references for the created entity
    const entityCrossRefs = await this.getCrossReferences(validName, branchId);

    return {
      name: validName,
      entityType: validEntityType,
      observations: validObservations,
      status: entity.status || "active",
      statusReason: entity.statusReason,
      lastUpdated: new Date().toISOString(),
      crossRefs: entityCrossRefs,
    };
  }

  async addObservations(
    observations: { entityName: string; contents: string[] }[],
    branchName?: string
  ): Promise<{ entityName: string; addedObservations: string[] }[]> {
    const branchId = await this.connection.getBranchId(branchName);
    const results: { entityName: string; addedObservations: string[] }[] = [];

    for (const obs of observations) {
      try {
        // Find the entity
        const entity = await this.connection.getQuery(
          "SELECT id FROM entities WHERE name = ? AND branch_id = ?",
          [obs.entityName, branchId]
        );

        if (!entity) {
          logger.warn(
            `Entity "${obs.entityName}" not found in branch ${
              branchName || "main"
            }`
          );
          continue;
        }

        // Get current max sequence order
        const maxSeq = await this.connection.getQuery(
          "SELECT COALESCE(MAX(sequence_order), -1) as max_seq FROM observations WHERE entity_id = ?",
          [entity.id]
        );

        const startSeq = (maxSeq?.max_seq || -1) + 1;
        const addedObservations: string[] = [];

        // Add each new observation
        for (let i = 0; i < obs.contents.length; i++) {
          const content = obs.contents[i];
          if (content && content.trim()) {
            await this.connection.execQuery(
              `INSERT INTO observations (entity_id, content, optimized_content, sequence_order)
               VALUES (?, ?, ?, ?)`,
              [entity.id, content, content, startSeq + i]
            );
            addedObservations.push(content);
          }
        }

        // Update entity timestamp
        await this.connection.execQuery(
          "UPDATE entities SET updated_at = ? WHERE id = ?",
          [new Date().toISOString(), entity.id]
        );

        results.push({
          entityName: obs.entityName,
          addedObservations,
        });

        logger.info(
          `Added ${addedObservations.length} observations to "${obs.entityName}"`
        );
      } catch (error) {
        logger.error(
          `Failed to add observations to "${obs.entityName}":`,
          error
        );
      }
    }

    return results;
  }

  async deleteObservations(
    deletions: { entityName: string; observations: string[] }[],
    branchName?: string
  ): Promise<void> {
    const branchId = await this.connection.getBranchId(branchName);

    for (const deletion of deletions) {
      try {
        // Find the entity
        const entity = await this.connection.getQuery(
          "SELECT id FROM entities WHERE name = ? AND branch_id = ?",
          [deletion.entityName, branchId]
        );

        if (!entity) {
          logger.warn(
            `Entity "${deletion.entityName}" not found in branch ${
              branchName || "main"
            }`
          );
          continue;
        }

        // Delete specific observations
        for (const obsContent of deletion.observations) {
          await this.connection.execQuery(
            "DELETE FROM observations WHERE entity_id = ? AND content = ?",
            [entity.id, obsContent]
          );
        }

        // Update entity timestamp
        await this.connection.execQuery(
          "UPDATE entities SET updated_at = ? WHERE id = ?",
          [new Date().toISOString(), entity.id]
        );

        logger.info(
          `Deleted ${deletion.observations.length} observations from "${deletion.entityName}"`
        );
      } catch (error) {
        logger.error(
          `Failed to delete observations from "${deletion.entityName}":`,
          error
        );
      }
    }
  }

  async getCrossReferences(
    entityName: string,
    branchId: number
  ): Promise<Array<{ memoryBranch: string; entityNames: string[] }>> {
    const crossRefs = await this.connection.runQuery(
      `
      SELECT cr.target_branch_id, cr.target_entity_name, mb.name as branch_name
      FROM cross_references cr
      JOIN memory_branches mb ON cr.target_branch_id = mb.id
      JOIN entities e ON cr.from_entity_id = e.id
      WHERE e.name = ? AND e.branch_id = ?
      ORDER BY cr.target_branch_id
      `,
      [entityName, branchId]
    );

    // Group by target branch
    const groupedRefs: { [key: string]: string[] } = {};
    const branchNames: { [key: string]: string } = {};

    for (const ref of crossRefs) {
      const branchId = ref.target_branch_id.toString();
      if (!groupedRefs[branchId]) {
        groupedRefs[branchId] = [];
        branchNames[branchId] = ref.branch_name;
      }
      groupedRefs[branchId].push(ref.target_entity_name);
    }

    // Convert to expected format
    return Object.keys(groupedRefs).map((branchId) => ({
      memoryBranch: branchNames[branchId],
      entityNames: groupedRefs[branchId],
    }));
  }

  async createCrossReference(
    entityName: string,
    targetBranch: string,
    targetEntityNames: string[],
    sourceBranch?: string
  ): Promise<void> {
    const sourceBranchId = await this.connection.getBranchId(sourceBranch);
    const targetBranchId = await this.connection.getBranchId(targetBranch);

    // Find the source entity
    const sourceEntity = await this.connection.getQuery(
      "SELECT id FROM entities WHERE name = ? AND branch_id = ?",
      [entityName, sourceBranchId]
    );

    if (!sourceEntity) {
      throw new Error(
        `Entity "${entityName}" not found in branch ${sourceBranch || "main"}`
      );
    }

    // Create cross-references for each target entity
    for (const targetEntityName of targetEntityNames) {
      try {
        // Verify target entity exists
        const targetEntity = await this.connection.getQuery(
          "SELECT id FROM entities WHERE name = ? AND branch_id = ?",
          [targetEntityName, targetBranchId]
        );

        if (!targetEntity) {
          logger.warn(
            `Target entity "${targetEntityName}" not found in branch "${targetBranch}"`
          );
          continue;
        }

        // Insert cross-reference (ignore duplicates)
        await this.connection.execQuery(
          `INSERT OR IGNORE INTO cross_references (from_entity_id, target_branch_id, target_entity_name)
           VALUES (?, ?, ?)`,
          [sourceEntity.id, targetBranchId, targetEntityName]
        );

        logger.info(
          `Created cross-reference: "${entityName}" -> "${targetEntityName}" (${targetBranch})`
        );
      } catch (error) {
        logger.error(
          `Failed to create cross-reference to "${targetEntityName}":`,
          error
        );
      }
    }
  }

  async convertRowsToEntities(rows: any[]): Promise<Entity[]> {
    const entities = [];
    for (const row of rows) {
      const crossRefs = await this.getCrossReferences(row.name, row.branch_id);
      entities.push({
        name: row.name,
        entityType: row.entity_type,
        observations: row.observations ? row.observations.split("|") : [],
        status: row.status as EntityStatus,
        statusReason: row.status_reason,
        lastUpdated: row.updated_at,
        crossRefs: crossRefs,
      });
    }
    return entities;
  }
}
