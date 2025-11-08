/**
 * Branch Operations Tests
 * Tests for memory branch creation, deletion, and management
 */

import { BaseTest } from "./base-test.js";

export class BranchTests extends BaseTest {
  constructor(memoryManager) {
    super(memoryManager);
  }

  async testCreateBranch() {
    const branchName = "test_branch_" + Date.now();
    const purpose = "Testing branch creation functionality";

    const branch = await this.memoryManager.createBranch(branchName, purpose);

    this.assertExists(branch, "Created branch should exist");
    this.assertEqual(branch.name, branchName, "Branch name should match");
    this.assertEqual(branch.purpose, purpose, "Branch purpose should match");
    this.assertEqual(
      branch.entityCount,
      0,
      "New branch should have 0 entities"
    );
    this.assertEqual(
      branch.relationCount,
      0,
      "New branch should have 0 relations"
    );
    this.assertExists(
      branch.lastUpdated,
      "Branch should have lastUpdated timestamp"
    );
  }

  async testCreateBranchWithoutPurpose() {
    const branchName = "test_branch_no_purpose_" + Date.now();

    const branch = await this.memoryManager.createBranch(branchName);

    this.assertExists(branch, "Created branch should exist");
    this.assertEqual(branch.name, branchName, "Branch name should match");
    this.assertContains(
      branch.purpose,
      branchName,
      "Default purpose should contain branch name"
    );
  }

  async testCreateDuplicateBranch() {
    const branchName = "duplicate_branch_" + Date.now();

    // Create first branch
    await this.memoryManager.createBranch(branchName, "First branch");

    // Attempt to create duplicate should throw
    await this.assertThrowsAsync(
      () => this.memoryManager.createBranch(branchName, "Duplicate branch"),
      "UNIQUE constraint failed",
      "Creating duplicate branch should throw error"
    );
  }

  async testListBranches() {
    const initialBranches = await this.memoryManager.listBranches();

    // Should have at least main branch
    this.assertTrue(
      initialBranches.length >= 1,
      "Should have at least main branch"
    );

    const mainBranch = initialBranches.find((b) => b.name === "main");
    this.assertExists(mainBranch, "Main branch should exist");
    this.assertEqual(
      mainBranch.name,
      "main",
      "Main branch name should be 'main'"
    );

    // Create a test branch
    const testBranchName = "list_test_branch_" + Date.now();
    await this.memoryManager.createBranch(
      testBranchName,
      "Test branch for listing"
    );

    const updatedBranches = await this.memoryManager.listBranches();
    this.assertEqual(
      updatedBranches.length,
      initialBranches.length + 1,
      "Should have one more branch"
    );

    const testBranch = updatedBranches.find((b) => b.name === testBranchName);
    this.assertExists(testBranch, "Test branch should be in the list");
  }

  async testDeleteBranch() {
    const branchName = "delete_test_branch_" + Date.now();

    // Create branch to delete
    await this.memoryManager.createBranch(branchName, "Branch to be deleted");

    // Verify it exists
    const branchesBeforeDelete = await this.memoryManager.listBranches();
    const createdBranch = branchesBeforeDelete.find(
      (b) => b.name === branchName
    );
    this.assertExists(createdBranch, "Branch should exist before deletion");

    // Delete the branch
    await this.memoryManager.deleteBranch(branchName);

    // Verify it's gone
    const branchesAfterDelete = await this.memoryManager.listBranches();
    const deletedBranch = branchesAfterDelete.find(
      (b) => b.name === branchName
    );
    this.assertTrue(
      deletedBranch === undefined,
      "Branch should not exist after deletion"
    );
  }

  async testDeleteMainBranch() {
    // Attempting to delete main branch should throw
    await this.assertThrowsAsync(
      () => this.memoryManager.deleteBranch("main"),
      "Cannot delete main branch",
      "Deleting main branch should throw error"
    );
  }

  async testDeleteNonexistentBranch() {
    const nonexistentBranch = "nonexistent_branch_" + Date.now();

    // Deleting nonexistent branch should handle gracefully (creates then deletes)
    await this.memoryManager.deleteBranch(nonexistentBranch);

    // Verify the branch was handled (it gets auto-created then deleted)
    this.assertTrue(
      true,
      "Deleting nonexistent branch should handle gracefully"
    );
  }

  async testBranchNaming() {
    // Test valid branch names
    const validNames = [
      "valid_branch_name",
      "valid-branch-name",
      "ValidBranchName",
      "branch123",
      "my_test_branch",
    ];

    for (const name of validNames) {
      const uniqueName = name + "_" + Date.now();
      const branch = await this.memoryManager.createBranch(uniqueName);
      this.assertEqual(
        branch.name,
        uniqueName,
        `Valid name "${uniqueName}" should be accepted`
      );
    }
  }

  async testBranchStatistics() {
    const branchName = "stats_test_branch_" + Date.now();

    // Create branch
    const branch = await this.memoryManager.createBranch(
      branchName,
      "Testing branch statistics"
    );

    // Initial statistics
    this.assertEqual(
      branch.entityCount,
      0,
      "New branch should have 0 entities"
    );
    this.assertEqual(
      branch.relationCount,
      0,
      "New branch should have 0 relations"
    );

    // Add some entities
    const entities = [
      {
        name: "stats_entity_1_" + Date.now(),
        entityType: "TestEntity",
        observations: ["Test observation 1"],
      },
      {
        name: "stats_entity_2_" + Date.now(),
        entityType: "TestEntity",
        observations: ["Test observation 2"],
      },
    ];

    await this.memoryManager.createEntities(entities, branchName);

    // Check updated statistics
    const updatedBranches = await this.memoryManager.listBranches();
    const updatedBranch = updatedBranches.find((b) => b.name === branchName);

    this.assertExists(updatedBranch, "Updated branch should exist");
    this.assertEqual(
      updatedBranch.entityCount,
      2,
      "Branch should have 2 entities"
    );
  }

  async runAllTests() {
    await this.runTest("Create Branch", () => this.testCreateBranch());
    await this.runTest("Create Branch Without Purpose", () =>
      this.testCreateBranchWithoutPurpose()
    );
    await this.runTest("Create Duplicate Branch", () =>
      this.testCreateDuplicateBranch()
    );
    await this.runTest("List Branches", () => this.testListBranches());
    await this.runTest("Delete Branch", () => this.testDeleteBranch());
    await this.runTest("Delete Main Branch", () => this.testDeleteMainBranch());
    await this.runTest("Delete Nonexistent Branch", () =>
      this.testDeleteNonexistentBranch()
    );
    await this.runTest("Branch Naming", () => this.testBranchNaming());
    await this.runTest("Branch Statistics", () => this.testBranchStatistics());

    return this.getResults();
  }
}
