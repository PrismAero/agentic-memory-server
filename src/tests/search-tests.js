/**
 * Search Functionality Tests
 * Tests for smart search, branch-specific search, and search features
 */

import { BaseTest } from "./base-test.js";

export class SearchTests extends BaseTest {
  constructor(memoryManager) {
    super(memoryManager);
    this.testDataSetup = false;
    this.testBranches = null;
  }

  async setupSearchTestData() {
    // Only setup once to avoid duplicate entity errors
    if (this.testDataSetup) {
      return this.testBranches;
    }

    // Create test data across multiple branches for comprehensive search testing
    const timestamp = Date.now();
    const branches = [
      { name: `frontend_${timestamp}`, purpose: "Frontend components and UI" },
      { name: `backend_${timestamp}`, purpose: "Backend APIs and services" },
      {
        name: `database_${timestamp}`,
        purpose: "Database schemas and queries",
      },
    ];

    // Create branches
    for (const branch of branches) {
      await this.memoryManager.createBranch(branch.name, branch.purpose);
    }

    // Create entities in different branches
    const frontendEntities = [
      {
        name: "UserAuthForm",
        entityType: "Component",
        observations: [
          "React component for user authentication",
          "Handles login and registration forms",
          "Uses TypeScript for type safety",
          "Integrates with authentication API",
        ],
      },
      {
        name: "NavigationBar",
        entityType: "Component",
        observations: [
          "Main navigation component",
          "Responsive design for mobile and desktop",
          "Contains user profile dropdown",
          "Shows authentication status",
        ],
      },
    ];

    const backendEntities = [
      {
        name: "AuthenticationAPI",
        entityType: "Service",
        observations: [
          "REST API for user authentication",
          "JWT token generation and validation",
          "Password hashing with bcrypt",
          "Rate limiting for security",
        ],
      },
      {
        name: "UserService",
        entityType: "Service",
        observations: [
          "User management service",
          "CRUD operations for user data",
          "Profile management functionality",
          "Integration with authentication system",
        ],
      },
    ];

    const databaseEntities = [
      {
        name: "UserSchema",
        entityType: "Schema",
        observations: [
          "Database schema for user data",
          "Contains authentication credentials",
          "Encrypted password storage",
          "Foreign key relationships",
        ],
      },
      {
        name: "SessionSchema",
        entityType: "Schema",
        observations: [
          "Database schema for user sessions",
          "JWT token storage and management",
          "Session expiration tracking",
          "Links to user authentication data",
        ],
      },
    ];

    await this.memoryManager.createEntities(frontendEntities, branches[0].name);
    await this.memoryManager.createEntities(backendEntities, branches[1].name);
    await this.memoryManager.createEntities(databaseEntities, branches[2].name);

    // Also create some entities in main branch
    const mainEntities = [
      {
        name: "AuthenticationFlow",
        entityType: "Process",
        observations: [
          "Complete authentication process documentation",
          "Frontend to backend to database flow",
          "Security best practices included",
          "Error handling procedures",
        ],
      },
    ];

    await this.memoryManager.createEntities(mainEntities, "main");

    // Mark setup as complete and cache branch info
    this.testDataSetup = true;
    this.testBranches = branches;
    return branches;
  }

  async testBasicSearch() {
    await this.setupSearchTestData();

    // Test basic search in main branch
    const results = await this.memoryManager.searchEntities(
      "authentication",
      "main"
    );

    this.assertExists(results, "Search results should exist");
    this.assertTrue(
      results.entities.length > 0,
      "Should find authentication-related entities"
    );

    // Check that results contain expected entity
    const authFlow = results.entities.find(
      (e) => e.name === "AuthenticationFlow"
    );
    this.assertExists(authFlow, "Should find AuthenticationFlow entity");
  }

  async testCrossbranchSearch() {
    const branches = await this.setupSearchTestData();

    // Test search across all branches using '*'
    const results = await this.memoryManager.searchEntities(
      "authentication",
      "*"
    );

    this.assertExists(results, "Cross-branch search results should exist");
    this.assertTrue(
      results.entities.length >= 3,
      "Should find authentication entities across multiple branches"
    );

    // Should find entities from different branches
    const entityNames = results.entities.map((e) => e.name);
    const expectedEntities = [
      "AuthenticationFlow",
      "UserAuthForm",
      "AuthenticationAPI",
    ];

    for (const expected of expectedEntities) {
      this.assertContains(
        entityNames,
        expected,
        `Should find ${expected} in cross-branch search`
      );
    }
  }

  async testBranchSpecificSearch() {
    const branches = await this.setupSearchTestData();

    // Test search in specific branch
    const frontendResults = await this.memoryManager.searchEntities(
      "component",
      branches[0].name
    );
    const backendResults = await this.memoryManager.searchEntities(
      "service",
      branches[1].name
    );

    // Frontend search should only return frontend entities
    this.assertTrue(
      frontendResults.entities.length > 0,
      "Should find components in frontend branch"
    );

    const frontendEntityNames = frontendResults.entities.map((e) => e.name);
    this.assertContains(
      frontendEntityNames,
      "UserAuthForm",
      "Should find UserAuthForm in frontend"
    );
    this.assertContains(
      frontendEntityNames,
      "NavigationBar",
      "Should find NavigationBar in frontend"
    );

    // Backend search should only return backend entities
    this.assertTrue(
      backendResults.entities.length > 0,
      "Should find services in backend branch"
    );

    const backendEntityNames = backendResults.entities.map((e) => e.name);
    this.assertContains(
      backendEntityNames,
      "AuthenticationAPI",
      "Should find AuthenticationAPI in backend"
    );
    this.assertContains(
      backendEntityNames,
      "UserService",
      "Should find UserService in backend"
    );
  }

  async testPartialTermMatching() {
    await this.setupSearchTestData();

    // Test partial matching
    const partialResults = await this.memoryManager.searchEntities("auth", "*");

    this.assertTrue(
      partialResults.entities.length > 0,
      "Partial term matching should work"
    );

    const entityNames = partialResults.entities.map((e) => e.name);

    // Should match entities containing "auth"
    const authRelatedEntities = entityNames.filter(
      (name) =>
        name.toLowerCase().includes("auth") ||
        partialResults.entities
          .find((e) => e.name === name)
          ?.observations?.some((obs) => obs.toLowerCase().includes("auth"))
    );

    this.assertTrue(
      authRelatedEntities.length > 0,
      "Should find entities with auth-related content"
    );
  }

  async testMultipleTermSearch() {
    await this.setupSearchTestData();

    // Test search with multiple terms
    const multiTermResults = await this.memoryManager.searchEntities(
      "user authentication",
      "*"
    );

    this.assertTrue(
      multiTermResults.entities.length > 0,
      "Multi-term search should work"
    );

    // Results should be relevant to both "user" and "authentication"
    const foundRelevantEntity = multiTermResults.entities.some((entity) => {
      const content = (
        entity.name +
        " " +
        entity.observations.join(" ")
      ).toLowerCase();
      return content.includes("user") && content.includes("authentication");
    });

    this.assertTrue(
      foundRelevantEntity,
      "Should find entities relevant to both terms"
    );
  }

  async testSearchWithDifferentStatuses() {
    await this.setupSearchTestData();

    // Create entities with different statuses
    const statusEntities = [
      {
        name: "ActiveEntity_" + Date.now(),
        entityType: "Test",
        observations: ["Active entity for status testing"],
        status: "active",
      },
      {
        name: "DeprecatedEntity_" + Date.now(),
        entityType: "Test",
        observations: ["Deprecated entity for status testing"],
        status: "deprecated",
      },
      {
        name: "ArchivedEntity_" + Date.now(),
        entityType: "Test",
        observations: ["Archived entity for status testing"],
        status: "archived",
      },
    ];

    await this.memoryManager.createEntities(statusEntities, "main");

    // Default search should only return active entities
    const defaultResults = await this.memoryManager.searchEntities(
      "status testing",
      "main"
    );
    const activeOnlyNames = defaultResults.entities.map((e) => e.name);

    this.assertContains(
      activeOnlyNames,
      statusEntities[0].name,
      "Should find active entity by default"
    );

    // Search including deprecated entities
    const withDeprecatedResults = await this.memoryManager.searchEntities(
      "status testing",
      "main",
      ["active", "deprecated"]
    );

    this.assertTrue(
      withDeprecatedResults.entities.length >= 2,
      "Should find both active and deprecated entities when specified"
    );
  }

  async testEmptySearchQuery() {
    await this.setupSearchTestData();

    // Test empty search query
    try {
      const emptyResults = await this.memoryManager.searchEntities("", "main");
      // If this doesn't throw, check what behavior we get
      console.log("   ℹ️  Empty search query handled gracefully");
    } catch (error) {
      this.assertContains(
        error.message.toLowerCase(),
        "query",
        "Empty query should provide meaningful error"
      );
    }
  }

  async testSearchNonexistentBranch() {
    const nonexistentBranch = "nonexistent_branch_" + Date.now();

    // The memory manager auto-creates branches, so searching nonexistent branch
    // should handle gracefully (creates the branch then searches it)
    const results = await this.memoryManager.searchEntities(
      "test",
      nonexistentBranch
    );

    // Should return empty results for newly created empty branch
    this.assertTrue(
      results.entities.length === 0,
      "Empty branch should return no search results"
    );
  }

  async testSearchWithSpecialCharacters() {
    await this.setupSearchTestData();

    // Create entity with special characters
    const specialEntity = {
      name: "SpecialEntity_" + Date.now(),
      entityType: "Special",
      observations: [
        "Entity with special characters: !@#$%^&*()",
        "Contains symbols and punctuation",
        "Tests search handling of non-alphanumeric characters",
      ],
    };

    await this.memoryManager.createEntities([specialEntity], "main");

    // Test search with special characters
    const specialResults = await this.memoryManager.searchEntities(
      "special characters",
      "main"
    );

    this.assertTrue(
      specialResults.entities.length > 0,
      "Should handle special characters in search"
    );

    const foundSpecialEntity = specialResults.entities.find(
      (e) => e.name === specialEntity.name
    );
    this.assertExists(
      foundSpecialEntity,
      "Should find entity with special characters"
    );
  }

  async testContextDepthSearch() {
    await this.setupSearchTestData();

    // Test different context depths
    const shallowResults = await this.memoryManager.searchEntities(
      "authentication",
      "*",
      ["active"],
      1
    );

    const deepResults = await this.memoryManager.searchEntities(
      "authentication",
      "*",
      ["active"],
      3
    );

    this.assertTrue(
      shallowResults.entities.length > 0,
      "Shallow search should return results"
    );
    this.assertTrue(
      deepResults.entities.length > 0,
      "Deep search should return results"
    );

    // Deep search might return more related entities
    if (deepResults.entities.length > shallowResults.entities.length) {
      console.log("   ℹ️  Deep search returned more related entities");
    }
  }

  async testSearchPerformance() {
    await this.setupSearchTestData();

    // Test search performance with timing
    const startTime = Date.now();
    const results = await this.memoryManager.searchEntities(
      "authentication",
      "*"
    );
    const endTime = Date.now();

    const duration = endTime - startTime;

    this.assertTrue(
      duration < 1000,
      `Search should complete quickly (${duration}ms)`
    );
    this.assertTrue(
      results.entities.length > 0,
      "Performance test should still return results"
    );

    console.log(`   ⏱️  Search completed in ${duration}ms`);
  }

  async runAllTests() {
    await this.runTest("Basic Search", () => this.testBasicSearch());
    await this.runTest("Cross-branch Search", () =>
      this.testCrossbranchSearch()
    );
    await this.runTest("Branch-specific Search", () =>
      this.testBranchSpecificSearch()
    );
    await this.runTest("Partial Term Matching", () =>
      this.testPartialTermMatching()
    );
    await this.runTest("Multiple Term Search", () =>
      this.testMultipleTermSearch()
    );
    await this.runTest("Search with Different Statuses", () =>
      this.testSearchWithDifferentStatuses()
    );
    await this.runTest("Empty Search Query", () => this.testEmptySearchQuery());
    await this.runTest("Search Nonexistent Branch", () =>
      this.testSearchNonexistentBranch()
    );
    await this.runTest("Search with Special Characters", () =>
      this.testSearchWithSpecialCharacters()
    );
    await this.runTest("Context Depth Search", () =>
      this.testContextDepthSearch()
    );
    await this.runTest("Search Performance", () =>
      this.testSearchPerformance()
    );

    return this.getResults();
  }
}
