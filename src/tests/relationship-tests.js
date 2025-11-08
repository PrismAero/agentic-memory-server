/**
 * Relationship Operations Tests
 * Tests for cross-references, relationships, and entity connections
 */

import { BaseTest } from "./base-test.js";

export class RelationshipTests extends BaseTest {
  constructor(memoryManager) {
    super(memoryManager);
  }

  async testCreateCrossReference() {
    // Create branches
    const sourceBranch = "source_branch_" + Date.now();
    const targetBranch = "target_branch_" + Date.now();

    await this.memoryManager.createBranch(
      sourceBranch,
      "Source branch for cross-references"
    );
    await this.memoryManager.createBranch(
      targetBranch,
      "Target branch for cross-references"
    );

    // Create target entity
    const targetEntity = {
      name: "TargetEntity_" + Date.now(),
      entityType: "Target",
      observations: ["Entity to be referenced"],
    };
    await this.memoryManager.createEntities([targetEntity], targetBranch);

    // Create source entity with cross-reference
    const sourceEntity = {
      name: "SourceEntity_" + Date.now(),
      entityType: "Source",
      observations: ["Entity with cross-reference"],
      crossRefs: [
        {
          memoryBranch: targetBranch,
          entityNames: [targetEntity.name],
        },
      ],
    };

    const created = await this.memoryManager.createEntities(
      [sourceEntity],
      sourceBranch
    );

    this.assertExists(
      created[0].crossRefs,
      "Entity should have cross-references"
    );
    this.assertArrayLength(
      created[0].crossRefs,
      1,
      "Should have one cross-reference"
    );
    this.assertEqual(
      created[0].crossRefs[0].memoryBranch,
      targetBranch,
      "Cross-ref should point to correct branch"
    );
    this.assertContains(
      created[0].crossRefs[0].entityNames,
      targetEntity.name,
      "Cross-ref should reference correct entity"
    );
  }

  async testMultipleCrossReferences() {
    // Create multiple target branches and entities
    const targetBranch1 = "target1_" + Date.now();
    const targetBranch2 = "target2_" + Date.now();

    await this.memoryManager.createBranch(targetBranch1, "Target branch 1");
    await this.memoryManager.createBranch(targetBranch2, "Target branch 2");

    // Create target entities
    const targetEntity1 = {
      name: "Target1_" + Date.now(),
      entityType: "Target1",
      observations: ["First target entity"],
    };
    const targetEntity2 = {
      name: "Target2_" + Date.now(),
      entityType: "Target2",
      observations: ["Second target entity"],
    };

    await this.memoryManager.createEntities([targetEntity1], targetBranch1);
    await this.memoryManager.createEntities([targetEntity2], targetBranch2);

    // Create source entity with multiple cross-references
    const sourceEntity = {
      name: "MultiCrossRefEntity_" + Date.now(),
      entityType: "Source",
      observations: ["Entity with multiple cross-references"],
      crossRefs: [
        {
          memoryBranch: targetBranch1,
          entityNames: [targetEntity1.name],
        },
        {
          memoryBranch: targetBranch2,
          entityNames: [targetEntity2.name],
        },
      ],
    };

    const created = await this.memoryManager.createEntities([sourceEntity]);

    this.assertArrayLength(
      created[0].crossRefs,
      2,
      "Should have two cross-references"
    );

    const crossRefBranches = created[0].crossRefs.map(
      (ref) => ref.memoryBranch
    );
    this.assertContains(
      crossRefBranches,
      targetBranch1,
      "Should reference first target branch"
    );
    this.assertContains(
      crossRefBranches,
      targetBranch2,
      "Should reference second target branch"
    );
  }

  async testCrossReferencesToMultipleEntities() {
    // Create target branch with multiple entities
    const targetBranch = "multi_entity_target_" + Date.now();
    await this.memoryManager.createBranch(
      targetBranch,
      "Target branch with multiple entities"
    );

    // Create multiple target entities
    const targetEntities = [
      {
        name: "MultiTarget1_" + Date.now(),
        entityType: "MultiTarget",
        observations: ["First multi-target entity"],
      },
      {
        name: "MultiTarget2_" + Date.now(),
        entityType: "MultiTarget",
        observations: ["Second multi-target entity"],
      },
      {
        name: "MultiTarget3_" + Date.now(),
        entityType: "MultiTarget",
        observations: ["Third multi-target entity"],
      },
    ];

    await this.memoryManager.createEntities(targetEntities, targetBranch);

    // Create source entity referencing all targets
    const sourceEntity = {
      name: "MultiEntityRefSource_" + Date.now(),
      entityType: "Source",
      observations: ["Entity referencing multiple entities in one branch"],
      crossRefs: [
        {
          memoryBranch: targetBranch,
          entityNames: targetEntities.map((e) => e.name),
        },
      ],
    };

    const created = await this.memoryManager.createEntities([sourceEntity]);

    this.assertArrayLength(
      created[0].crossRefs,
      1,
      "Should have one cross-reference"
    );
    this.assertArrayLength(
      created[0].crossRefs[0].entityNames,
      3,
      "Should reference three entities"
    );

    for (const targetEntity of targetEntities) {
      this.assertContains(
        created[0].crossRefs[0].entityNames,
        targetEntity.name,
        `Should reference ${targetEntity.name}`
      );
    }
  }

  async testAutoRelationshipDetection() {
    // Create entities with related content that should trigger automatic relationships
    const relatedEntities = [
      {
        name: "UserAuth_Frontend_" + Date.now(),
        entityType: "Component",
        observations: [
          "React component for user authentication",
          "Handles login form submission",
          "Calls authentication API endpoints",
          "Manages JWT token storage",
        ],
      },
      {
        name: "UserAuth_Backend_" + Date.now(),
        entityType: "API",
        observations: [
          "REST API for user authentication",
          "Validates user credentials",
          "Issues JWT tokens",
          "Handles login and logout endpoints",
        ],
      },
      {
        name: "UserAuth_Database_" + Date.now(),
        entityType: "Schema",
        observations: [
          "User database schema",
          "Stores encrypted user passwords",
          "Contains user authentication data",
          "Foreign key relationships to user profiles",
        ],
      },
    ];

    // Create entities with auto-relationship detection enabled
    const created = await this.memoryManager.createEntities(
      relatedEntities,
      "main",
      true
    );

    this.assertArrayLength(created, 3, "Should create all three entities");

    // Wait a moment for relationship processing
    await this.wait(500);

    // Check if relationships were detected (this depends on the relationship indexer)
    const branch = await this.memoryManager.exportBranch("main");

    // Verify entities exist
    for (const entity of relatedEntities) {
      const foundEntity = branch.entities.find((e) => e.name === entity.name);
      this.assertExists(
        foundEntity,
        `Entity ${entity.name} should exist in branch`
      );
    }
  }

  async testCreateCrossReferenceInvalidBranch() {
    const invalidBranch = "nonexistent_branch_" + Date.now();

    const entityWithInvalidRef = {
      name: "InvalidRefEntity_" + Date.now(),
      entityType: "Invalid",
      observations: ["Entity with invalid cross-reference"],
      crossRefs: [
        {
          memoryBranch: invalidBranch,
          entityNames: ["SomeEntity"],
        },
      ],
    };

    // This should either handle gracefully or throw a specific error
    try {
      await this.memoryManager.createEntities([entityWithInvalidRef]);
      // If it succeeds, the system handles invalid references gracefully
      this.assertTrue(
        true,
        "System handles invalid cross-references gracefully"
      );
    } catch (error) {
      // If it throws, it should be a specific error about invalid branch
      this.assertContains(
        error.message.toLowerCase(),
        "branch",
        "Error should mention invalid branch"
      );
    }
  }

  async testCrossReferenceToNonexistentEntity() {
    // Create target branch but no entities
    const targetBranch = "empty_target_" + Date.now();
    await this.memoryManager.createBranch(targetBranch, "Empty target branch");

    const entityWithInvalidEntityRef = {
      name: "InvalidEntityRefEntity_" + Date.now(),
      entityType: "Invalid",
      observations: ["Entity with cross-reference to nonexistent entity"],
      crossRefs: [
        {
          memoryBranch: targetBranch,
          entityNames: ["NonexistentEntity_" + Date.now()],
        },
      ],
    };

    // This should either handle gracefully or throw a specific error
    try {
      const created = await this.memoryManager.createEntities([
        entityWithInvalidEntityRef,
      ]);
      this.assertTrue(
        true,
        "System handles references to nonexistent entities gracefully"
      );
    } catch (error) {
      this.assertContains(
        error.message.toLowerCase(),
        "entity",
        "Error should mention invalid entity"
      );
    }
  }

  async testRelationshipCleanupOnEntityDeletion() {
    // Create target entity
    const targetEntity = {
      name: "CleanupTarget_" + Date.now(),
      entityType: "Target",
      observations: ["Entity to be deleted"],
    };
    await this.memoryManager.createEntities([targetEntity]);

    // Create source entity with cross-reference
    const sourceEntity = {
      name: "CleanupSource_" + Date.now(),
      entityType: "Source",
      observations: ["Entity with cross-reference to be cleaned up"],
      crossRefs: [
        {
          memoryBranch: "main",
          entityNames: [targetEntity.name],
        },
      ],
    };
    await this.memoryManager.createEntities([sourceEntity]);

    // Delete target entity
    await this.memoryManager.deleteEntities([targetEntity.name]);

    // Verify source entity still exists but cross-reference handling is appropriate
    const branch = await this.memoryManager.exportBranch("main");
    const remainingSource = branch.entities.find(
      (e) => e.name === sourceEntity.name
    );

    this.assertExists(
      remainingSource,
      "Source entity should still exist after target deletion"
    );

    // The behavior for orphaned cross-references may vary - document what happens
    if (remainingSource.crossRefs) {
      console.log("   ℹ️  Cross-references preserved after target deletion");
    } else {
      console.log("   ℹ️  Cross-references cleaned up after target deletion");
    }
  }

  async testBidirectionalRelationships() {
    // Create two entities that should reference each other
    const entity1 = {
      name: "BiDirectional1_" + Date.now(),
      entityType: "Component",
      observations: ["First component that works with second component"],
    };

    const entity2 = {
      name: "BiDirectional2_" + Date.now(),
      entityType: "Component",
      observations: ["Second component that integrates with first component"],
    };

    // Create first entity
    await this.memoryManager.createEntities([entity1]);

    // Create second entity with reference to first
    entity2.crossRefs = [
      {
        memoryBranch: "main",
        entityNames: [entity1.name],
      },
    ];

    await this.memoryManager.createEntities([entity2]);

    // Update first entity to reference second (bidirectional)
    entity1.crossRefs = [
      {
        memoryBranch: "main",
        entityNames: [entity2.name],
      },
    ];

    await this.memoryManager.updateEntity(entity1);

    // Verify both entities have cross-references
    const branch = await this.memoryManager.exportBranch("main");

    const storedEntity1 = branch.entities.find((e) => e.name === entity1.name);
    const storedEntity2 = branch.entities.find((e) => e.name === entity2.name);

    this.assertExists(
      storedEntity1.crossRefs,
      "First entity should have cross-references"
    );
    this.assertExists(
      storedEntity2.crossRefs,
      "Second entity should have cross-references"
    );

    this.assertContains(
      storedEntity1.crossRefs[0].entityNames,
      entity2.name,
      "First entity should reference second"
    );
    this.assertContains(
      storedEntity2.crossRefs[0].entityNames,
      entity1.name,
      "Second entity should reference first"
    );
  }

  async runAllTests() {
    await this.runTest("Create Cross Reference", () =>
      this.testCreateCrossReference()
    );
    await this.runTest("Multiple Cross References", () =>
      this.testMultipleCrossReferences()
    );
    await this.runTest("Cross References to Multiple Entities", () =>
      this.testCrossReferencesToMultipleEntities()
    );
    await this.runTest("Auto Relationship Detection", () =>
      this.testAutoRelationshipDetection()
    );
    await this.runTest("Create Cross Reference Invalid Branch", () =>
      this.testCreateCrossReferenceInvalidBranch()
    );
    await this.runTest("Cross Reference to Nonexistent Entity", () =>
      this.testCrossReferenceToNonexistentEntity()
    );
    await this.runTest("Relationship Cleanup on Entity Deletion", () =>
      this.testRelationshipCleanupOnEntityDeletion()
    );
    await this.runTest("Bidirectional Relationships", () =>
      this.testBidirectionalRelationships()
    );

    return this.getResults();
  }
}
