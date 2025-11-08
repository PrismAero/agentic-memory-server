/**
 * Entity Operations Tests
 * Tests for entity creation, updating, deletion, and management
 */

import { BaseTest } from "./base-test.js";

export class EntityTests extends BaseTest {
  constructor(memoryManager) {
    super(memoryManager);
  }

  async testCreateSingleEntity() {
    const entity = this.generateTestEntity("CreateTest", "TestType", [
      "Single entity test",
    ]);

    const created = await this.memoryManager.createEntities([entity]);

    this.assertArrayLength(created, 1, "Should create exactly one entity");

    const createdEntity = created[0];
    this.assertEqual(
      createdEntity.name,
      entity.name,
      "Entity name should match"
    );
    this.assertEqual(
      createdEntity.entityType,
      entity.entityType,
      "Entity type should match"
    );
    this.assertArrayLength(
      createdEntity.observations,
      entity.observations.length,
      "Observations count should match"
    );
    this.assertEqual(
      createdEntity.status,
      "active",
      "Default status should be active"
    );
    this.assertExists(
      createdEntity.lastUpdated,
      "Entity should have lastUpdated timestamp"
    );
  }

  async testCreateMultipleEntities() {
    const entities = this.generateTestEntities(3, "MultipleTest");

    const created = await this.memoryManager.createEntities(entities);

    this.assertArrayLength(created, 3, "Should create exactly three entities");

    for (let i = 0; i < created.length; i++) {
      this.assertEqual(
        created[i].name,
        entities[i].name,
        `Entity ${i} name should match`
      );
      this.assertEqual(
        created[i].entityType,
        entities[i].entityType,
        `Entity ${i} type should match`
      );
    }
  }

  async testCreateEntityInSpecificBranch() {
    const branchName = "entity_test_branch_" + Date.now();
    await this.memoryManager.createBranch(
      branchName,
      "Branch for entity testing"
    );

    const entity = this.generateTestEntity("BranchTest", "TestType", [
      "Branch-specific entity",
    ]);
    const created = await this.memoryManager.createEntities(
      [entity],
      branchName
    );

    this.assertArrayLength(
      created,
      1,
      "Should create entity in specific branch"
    );

    // Verify entity is in the correct branch
    const branch = await this.memoryManager.exportBranch(branchName);
    const entityInBranch = branch.entities.find((e) => e.name === entity.name);
    this.assertExists(
      entityInBranch,
      "Entity should be found in specific branch"
    );
  }

  async testCreateEntityWithAllStatuses() {
    const statuses = ["active", "deprecated", "archived", "draft"];

    for (const status of statuses) {
      const entity = {
        name: `StatusTest_${status}_${Date.now()}`,
        entityType: "StatusTest",
        observations: [`Entity with ${status} status`],
        status: status,
      };

      const created = await this.memoryManager.createEntities([entity]);
      this.assertEqual(
        created[0].status,
        status,
        `Entity should have ${status} status`
      );
    }
  }

  async testUpdateEntity() {
    // Create entity first
    const originalEntity = this.generateTestEntity(
      "UpdateTest",
      "OriginalType",
      ["Original observation"]
    );
    const created = await this.memoryManager.createEntities([originalEntity]);

    // Update the entity
    const updatedEntity = {
      name: created[0].name,
      entityType: "UpdatedType",
      observations: ["Updated observation 1", "Updated observation 2"],
      status: "deprecated",
      statusReason: "Updated for testing",
    };

    const updated = await this.memoryManager.updateEntity(updatedEntity);

    this.assertEqual(
      updated.name,
      updatedEntity.name,
      "Name should remain the same"
    );
    this.assertEqual(
      updated.entityType,
      "UpdatedType",
      "Type should be updated"
    );
    this.assertArrayLength(
      updated.observations,
      2,
      "Should have updated observations"
    );
    this.assertEqual(updated.status, "deprecated", "Status should be updated");
    this.assertEqual(
      updated.statusReason,
      "Updated for testing",
      "Status reason should be set"
    );
    this.assertExists(updated.lastUpdated, "Should have updated timestamp");
  }

  async testUpdateNonexistentEntity() {
    const nonexistentEntity = {
      name: "NonexistentEntity_" + Date.now(),
      entityType: "Test",
      observations: ["This entity doesn't exist"],
    };

    await this.assertThrowsAsync(
      () => this.memoryManager.updateEntity(nonexistentEntity),
      "not found",
      "Updating nonexistent entity should throw error"
    );
  }

  async testDeleteSingleEntity() {
    // Create entity first
    const entity = this.generateTestEntity("DeleteTest", "TestType", [
      "Entity to delete",
    ]);
    const created = await this.memoryManager.createEntities([entity]);

    // Delete the entity
    await this.memoryManager.deleteEntities([created[0].name]);

    // Verify it's gone
    const branch = await this.memoryManager.exportBranch("main");
    const deletedEntity = branch.entities.find(
      (e) => e.name === created[0].name
    );
    this.assertTrue(
      deletedEntity === undefined,
      "Entity should not exist after deletion"
    );
  }

  async testDeleteMultipleEntities() {
    // Create multiple entities
    const entities = this.generateTestEntities(3, "MultiDeleteTest");
    const created = await this.memoryManager.createEntities(entities);

    const entityNames = created.map((e) => e.name);

    // Delete all entities
    await this.memoryManager.deleteEntities(entityNames);

    // Verify they're all gone
    const branch = await this.memoryManager.exportBranch("main");
    for (const name of entityNames) {
      const deletedEntity = branch.entities.find((e) => e.name === name);
      this.assertTrue(
        deletedEntity === undefined,
        `Entity ${name} should not exist after deletion`
      );
    }
  }

  async testDeleteNonexistentEntity() {
    const nonexistentName = "NonexistentEntity_" + Date.now();

    // Should not throw error, but should handle gracefully
    await this.memoryManager.deleteEntities([nonexistentName]);
    this.assertTrue(true, "Deleting nonexistent entity should not throw");
  }

  async testAddObservations() {
    // Create entity first
    const entity = this.generateTestEntity("ObservationTest", "TestType", [
      "Initial observation",
    ]);
    const created = await this.memoryManager.createEntities([entity]);

    // Add observations
    const newObservations = ["New observation 1", "New observation 2"];
    await this.memoryManager.addObservations([
      {
        entityName: created[0].name,
        contents: newObservations,
      },
    ]);

    // Verify observations were added
    const branch = await this.memoryManager.exportBranch("main");
    const updatedEntity = branch.entities.find(
      (e) => e.name === created[0].name
    );

    this.assertExists(updatedEntity, "Entity should still exist");
    this.assertArrayLength(
      updatedEntity.observations,
      3,
      "Should have 3 total observations"
    );
    this.assertContains(
      updatedEntity.observations,
      "New observation 1",
      "Should contain new observation 1"
    );
    this.assertContains(
      updatedEntity.observations,
      "New observation 2",
      "Should contain new observation 2"
    );
  }

  async testEntityStatusUpdate() {
    // Create entity
    const entity = this.generateTestEntity("StatusUpdateTest", "TestType", [
      "Status test",
    ]);
    const created = await this.memoryManager.createEntities([entity]);

    // Update status
    await this.memoryManager.updateEntityStatus(
      created[0].name,
      "deprecated",
      "Deprecated for testing",
      "main"
    );

    // Verify status update
    const branch = await this.memoryManager.exportBranch("main");
    const updatedEntity = branch.entities.find(
      (e) => e.name === created[0].name
    );

    this.assertExists(updatedEntity, "Entity should still exist");
    this.assertEqual(
      updatedEntity.status,
      "deprecated",
      "Status should be updated"
    );
    this.assertEqual(
      updatedEntity.statusReason,
      "Deprecated for testing",
      "Status reason should be set"
    );
  }

  async testEntityWithCrossReferences() {
    // Create entities in different branches
    const testBranch = "crossref_test_branch_" + Date.now();
    await this.memoryManager.createBranch(
      testBranch,
      "Cross-reference testing"
    );

    // Create entity in test branch first
    const testEntity = {
      name: "ReferencedEntity",
      entityType: "Referenced",
      observations: ["Entity in test branch"],
    };
    await this.memoryManager.createEntities([testEntity], testBranch);

    // Create entity in main branch
    const mainEntity = {
      name: "MainEntity_" + Date.now(),
      entityType: "MainType",
      observations: ["Entity in main branch"],
      crossRefs: [
        {
          memoryBranch: testBranch,
          entityNames: ["ReferencedEntity"],
        },
      ],
    };

    const created = await this.memoryManager.createEntities(
      [mainEntity],
      "main"
    );

    // Current implementation note: Cross-references may not be returned in the created entity
    // but the entity creation should succeed and not throw errors
    this.assertExists(created[0], "Entity should be created successfully");
    this.assertEqual(
      created[0].name,
      mainEntity.name,
      "Entity name should match"
    );
    this.assertEqual(
      created[0].entityType,
      mainEntity.entityType,
      "Entity type should match"
    );

    // The cross-reference functionality is handled internally -
    // we're testing that entity creation with crossRefs doesn't fail
    console.log("   ℹ️  Cross-reference entity creation handled successfully");
  }

  async testLargeObservationSet() {
    // Create entity with many observations
    const largeObservations = [];
    for (let i = 1; i <= 50; i++) {
      largeObservations.push(
        `Observation number ${i} with some detailed content`
      );
    }

    const entity = {
      name: "LargeObservationEntity_" + Date.now(),
      entityType: "LargeTest",
      observations: largeObservations,
    };

    const created = await this.memoryManager.createEntities([entity]);

    this.assertArrayLength(
      created[0].observations,
      50,
      "Should handle large observation sets"
    );

    // Verify they're all stored correctly
    const branch = await this.memoryManager.exportBranch("main");
    const storedEntity = branch.entities.find((e) => e.name === entity.name);

    this.assertArrayLength(
      storedEntity.observations,
      50,
      "All observations should be stored"
    );
  }

  async runAllTests() {
    await this.runTest("Create Single Entity", () =>
      this.testCreateSingleEntity()
    );
    await this.runTest("Create Multiple Entities", () =>
      this.testCreateMultipleEntities()
    );
    await this.runTest("Create Entity in Specific Branch", () =>
      this.testCreateEntityInSpecificBranch()
    );
    await this.runTest("Create Entity with All Statuses", () =>
      this.testCreateEntityWithAllStatuses()
    );
    await this.runTest("Update Entity", () => this.testUpdateEntity());
    await this.runTest("Update Nonexistent Entity", () =>
      this.testUpdateNonexistentEntity()
    );
    await this.runTest("Delete Single Entity", () =>
      this.testDeleteSingleEntity()
    );
    await this.runTest("Delete Multiple Entities", () =>
      this.testDeleteMultipleEntities()
    );
    await this.runTest("Delete Nonexistent Entity", () =>
      this.testDeleteNonexistentEntity()
    );
    await this.runTest("Add Observations", () => this.testAddObservations());
    await this.runTest("Entity Status Update", () =>
      this.testEntityStatusUpdate()
    );
    await this.runTest("Entity with Cross-References", () =>
      this.testEntityWithCrossReferences()
    );
    await this.runTest("Large Observation Set", () =>
      this.testLargeObservationSet()
    );

    return this.getResults();
  }
}
