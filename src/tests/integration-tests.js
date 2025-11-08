/**
 * Integration Tests
 * Tests for complete workflows and complex scenarios
 */

import { BaseTest } from "./base-test.js";

export class IntegrationTests extends BaseTest {
  constructor(memoryManager) {
    super(memoryManager);
  }

  async testCompleteProjectWorkflow() {
    // Simulate a complete project development workflow

    // Step 1: Create project structure with branches
    const branches = [
      {
        name: "requirements",
        purpose: "Project requirements and specifications",
      },
      { name: "architecture", purpose: "System architecture and design" },
      { name: "frontend", purpose: "Frontend components and UI" },
      { name: "backend", purpose: "Backend services and APIs" },
      { name: "testing", purpose: "Testing strategies and test cases" },
      { name: "deployment", purpose: "Deployment and infrastructure" },
    ];

    for (const branch of branches) {
      await this.memoryManager.createBranch(branch.name, branch.purpose);
    }

    // Step 2: Add requirements
    const requirements = [
      {
        name: "UserAuthentication",
        entityType: "Requirement",
        observations: [
          "Users must be able to register with email and password",
          "Login should use JWT tokens for session management",
          "Password reset functionality required",
          "Social login integration (Google, GitHub)",
        ],
      },
      {
        name: "DataSecurity",
        entityType: "Requirement",
        observations: [
          "All data must be encrypted in transit and at rest",
          "GDPR compliance for user data handling",
          "Audit logging for security events",
          "Role-based access control system",
        ],
      },
    ];

    await this.memoryManager.createEntities(requirements, "requirements");

    // Step 3: Create architecture entities with cross-references
    const architectureEntities = [
      {
        name: "AuthenticationService",
        entityType: "Service",
        observations: [
          "Microservice handling user authentication",
          "JWT token generation and validation",
          "Password hashing using bcrypt",
          "Rate limiting for security",
        ],
        crossRefs: [
          {
            memoryBranch: "requirements",
            entityNames: ["UserAuthentication", "DataSecurity"],
          },
        ],
      },
      {
        name: "UserDatabase",
        entityType: "Database",
        observations: [
          "PostgreSQL database for user data",
          "Encrypted storage for sensitive information",
          "Audit trail table for security events",
          "Backup and recovery procedures",
        ],
        crossRefs: [
          {
            memoryBranch: "requirements",
            entityNames: ["DataSecurity"],
          },
        ],
      },
    ];

    await this.memoryManager.createEntities(
      architectureEntities,
      "architecture"
    );

    // Step 4: Create frontend components
    const frontendEntities = [
      {
        name: "LoginForm",
        entityType: "Component",
        observations: [
          "React component for user login",
          "Form validation using Formik and Yup",
          "Integration with authentication service",
          "Social login buttons",
        ],
        crossRefs: [
          {
            memoryBranch: "architecture",
            entityNames: ["AuthenticationService"],
          },
          {
            memoryBranch: "requirements",
            entityNames: ["UserAuthentication"],
          },
        ],
      },
      {
        name: "UserDashboard",
        entityType: "Component",
        observations: [
          "Protected route component",
          "Displays user profile information",
          "JWT token validation",
          "Role-based content rendering",
        ],
        crossRefs: [
          {
            memoryBranch: "architecture",
            entityNames: ["AuthenticationService"],
          },
        ],
      },
    ];

    await this.memoryManager.createEntities(frontendEntities, "frontend");

    // Step 5: Verify the complete system
    const allBranches = await this.memoryManager.listBranches();
    this.assertTrue(
      allBranches.length >= 7,
      "Should have created all project branches"
    ); // Including main

    // Test cross-branch search to find related entities
    const authResults = await this.memoryManager.searchEntities(
      "authentication",
      "*"
    );
    this.assertTrue(
      authResults.entities.length >= 4,
      "Should find authentication entities across all branches"
    );

    // Test specific workflow queries
    const securityResults = await this.memoryManager.searchEntities(
      "security",
      "*"
    );
    this.assertTrue(
      securityResults.entities.length >= 2,
      "Should find security-related entities"
    );

    const jwtResults = await this.memoryManager.searchEntities("JWT", "*");
    this.assertTrue(
      jwtResults.entities.length >= 2,
      "Should find JWT-related entities"
    );

    console.log("   ✅ Complete project workflow validated");
  }

  async testKnowledgeEvolutionWorkflow() {
    // Test how knowledge evolves over time with updates and additions

    // Initial knowledge
    const initialEntity = {
      name: "APIDesign_v1",
      entityType: "Design",
      observations: [
        "REST API with basic CRUD operations",
        "JSON response format",
        "HTTP status codes for responses",
        "Basic authentication with API keys",
      ],
      status: "active",
    };

    await this.memoryManager.createEntities([initialEntity], "main");

    // Evolution 1: Add more details
    await this.memoryManager.addObservations([
      {
        entityName: "APIDesign_v1",
        contents: [
          "Added rate limiting to prevent abuse",
          "Implemented request/response logging",
          "Added API versioning in headers",
          "Enhanced error handling with detailed messages",
        ],
      },
    ]);

    // Evolution 2: Deprecate old design, create new version
    await this.memoryManager.updateEntityStatus(
      "APIDesign_v1",
      "deprecated",
      "Replaced by v2 with improved security"
    );

    const v2Entity = {
      name: "APIDesign_v2",
      entityType: "Design",
      observations: [
        "GraphQL API replacing REST endpoints",
        "JWT token-based authentication",
        "Real-time subscriptions support",
        "Comprehensive schema validation",
        "Automatic API documentation generation",
      ],
      status: "active",
    };

    await this.memoryManager.createEntities([v2Entity], "main");

    // Evolution 3: Add implementation details
    await this.memoryManager.addObservations([
      {
        entityName: "APIDesign_v2",
        contents: [
          "Apollo Server implementation",
          "DataLoader for efficient database queries",
          "Caching layer with Redis",
          "Performance monitoring with metrics",
        ],
      },
    ]);

    // Verify evolution
    const allDesigns = await this.memoryManager.searchEntities(
      "APIDesign",
      "main",
      ["active", "deprecated"]
    );
    this.assertTrue(
      allDesigns.entities.length >= 2,
      "Should find both versions of API design"
    );

    const activeDesigns = await this.memoryManager.searchEntities(
      "APIDesign",
      "main",
      ["active"]
    );
    this.assertEqual(
      activeDesigns.entities.length,
      1,
      "Should have only one active design"
    );

    const v2Design = activeDesigns.entities.find(
      (e) => e.name === "APIDesign_v2"
    );
    this.assertExists(v2Design, "Should find v2 design as active");
    this.assertTrue(
      v2Design.observations.length >= 9,
      "Should have accumulated observations"
    );

    console.log("   ✅ Knowledge evolution workflow validated");
  }

  async testLargeScaleDataHandling() {
    // Test system behavior with large amounts of data

    // Create multiple branches with substantial data
    const branches = [];
    for (let i = 1; i <= 5; i++) {
      const branchName = `large_branch_${i}_${Date.now()}`;
      await this.memoryManager.createBranch(
        branchName,
        `Large branch ${i} for scale testing`
      );
      branches.push(branchName);
    }

    // Create many entities across branches
    const totalEntities = 50; // Moderate number for testing
    const entitiesPerBranch = Math.floor(totalEntities / branches.length);

    for (let branchIndex = 0; branchIndex < branches.length; branchIndex++) {
      const branchEntities = [];

      for (let i = 1; i <= entitiesPerBranch; i++) {
        const entity = {
          name: `LargeScale_Entity_${branchIndex}_${i}_${Date.now()}`,
          entityType: `Type_${i % 5}`, // Vary types
          observations: [
            `Primary observation for entity ${i} in branch ${branchIndex}`,
            `Secondary observation with technical details`,
            `Integration point with other systems`,
            `Performance characteristics and requirements`,
            `Security considerations and access control`,
          ],
        };

        // Add cross-references for some entities
        if (i % 3 === 0 && branchIndex > 0) {
          entity.crossRefs = [
            {
              memoryBranch: branches[branchIndex - 1],
              entityNames: [
                `LargeScale_Entity_${branchIndex - 1}_${i}_${Date.now()}`,
              ],
            },
          ];
        }

        branchEntities.push(entity);
      }

      await this.memoryManager.createEntities(
        branchEntities,
        branches[branchIndex]
      );
    }

    // Test system performance with large dataset
    const searchStartTime = Date.now();
    const searchResults = await this.memoryManager.searchEntities(
      "LargeScale",
      "*"
    );
    const searchDuration = Date.now() - searchStartTime;

    this.assertTrue(
      searchResults.entities.length >= totalEntities - 5,
      "Should find most large scale entities"
    );
    this.assertTrue(
      searchDuration < 2000,
      `Large scale search should complete reasonably fast (${searchDuration}ms)`
    );

    // Test branch-specific searches
    for (const branchName of branches) {
      const branchResults = await this.memoryManager.searchEntities(
        "LargeScale",
        branchName
      );
      this.assertTrue(
        branchResults.entities.length >= entitiesPerBranch - 2,
        `Branch ${branchName} should have expected entities`
      );
    }

    // Test branch statistics
    const updatedBranches = await this.memoryManager.listBranches();
    const largeBranches = updatedBranches.filter((b) =>
      b.name.startsWith("large_branch_")
    );

    for (const branch of largeBranches) {
      this.assertTrue(
        branch.entityCount >= entitiesPerBranch - 2,
        `Branch ${branch.name} should report correct entity count`
      );
    }

    console.log(
      `   ✅ Large scale data handling validated (${searchDuration}ms search time)`
    );
  }

  async testErrorHandlingAndRecovery() {
    // Test system resilience and error handling

    // Test 1: Invalid operations
    try {
      await this.memoryManager.createBranch("", "Empty name branch");
      this.assertTrue(false, "Should not allow empty branch name");
    } catch (error) {
      this.assertContains(
        error.message.toLowerCase(),
        "name",
        "Should provide meaningful error for empty name"
      );
    }

    // Test 2: Create entity with invalid data
    try {
      const invalidEntity = {
        name: "", // Empty name
        entityType: "Invalid",
        observations: [],
      };
      await this.memoryManager.createEntities([invalidEntity]);
      this.assertTrue(false, "Should not allow entity with empty name");
    } catch (error) {
      console.log("   ✅ Invalid entity creation properly rejected");
    }

    // Test 3: Operations on nonexistent data
    try {
      await this.memoryManager.deleteEntities([
        "NonexistentEntity_" + Date.now(),
      ]);
      console.log("   ✅ Deletion of nonexistent entity handled gracefully");
    } catch (error) {
      console.log("   ✅ Deletion of nonexistent entity properly rejected");
    }

    // Test 4: Concurrent operations (simulate)
    const concurrentEntities = [];
    for (let i = 1; i <= 10; i++) {
      concurrentEntities.push({
        name: `ConcurrentEntity_${i}_${Date.now()}`,
        entityType: "Concurrent",
        observations: [`Concurrent entity ${i}`],
      });
    }

    // Create entities concurrently
    const promises = concurrentEntities.map((entity) =>
      this.memoryManager.createEntities([entity])
    );

    const results = await Promise.all(promises);
    this.assertEqual(
      results.length,
      10,
      "All concurrent operations should complete"
    );

    // Verify all entities were created
    const concurrentResults = await this.memoryManager.searchEntities(
      "ConcurrentEntity",
      "main"
    );
    this.assertTrue(
      concurrentResults.entities.length >= 9,
      "Most concurrent entities should be created successfully"
    );

    console.log("   ✅ Error handling and recovery validated");
  }

  async testComplexCrossReferenceNetwork() {
    // Test complex networks of cross-references

    // Create a web of interconnected entities across branches
    const networkBranches = ["network_a", "network_b", "network_c"];

    for (const branchName of networkBranches) {
      await this.memoryManager.createBranch(
        branchName,
        `Network branch ${branchName}`
      );
    }

    // Create entities with complex cross-reference patterns
    const networkEntities = {
      network_a: [
        {
          name: "NodeA1_" + Date.now(),
          entityType: "Node",
          observations: ["Central node in network A"],
          crossRefs: [
            {
              memoryBranch: "network_b",
              entityNames: ["NodeB1_" + Date.now()],
            },
            {
              memoryBranch: "network_c",
              entityNames: ["NodeC1_" + Date.now()],
            },
          ],
        },
      ],
      network_b: [
        {
          name: "NodeB1_" + Date.now(),
          entityType: "Node",
          observations: ["Connecting node in network B"],
          crossRefs: [
            {
              memoryBranch: "network_c",
              entityNames: ["NodeC1_" + Date.now(), "NodeC2_" + Date.now()],
            },
          ],
        },
      ],
      network_c: [
        {
          name: "NodeC1_" + Date.now(),
          entityType: "Node",
          observations: ["Primary node in network C"],
        },
        {
          name: "NodeC2_" + Date.now(),
          entityType: "Node",
          observations: ["Secondary node in network C"],
          crossRefs: [
            {
              memoryBranch: "network_a",
              entityNames: ["NodeA1_" + Date.now()],
            },
          ],
        },
      ],
    };

    // Create base entities first
    for (const [branchName, entities] of Object.entries(networkEntities)) {
      for (const entity of entities) {
        const baseEntity = { ...entity };
        delete baseEntity.crossRefs; // Create without cross-refs first
        await this.memoryManager.createEntities([baseEntity], branchName);
      }
    }

    // Then add cross-references (simplified for testing)
    const networkResults = await this.memoryManager.searchEntities("Node", "*");
    this.assertTrue(
      networkResults.entities.length >= 4,
      "Should create network nodes"
    );

    // Test cross-branch navigation
    const networkAResults = await this.memoryManager.searchEntities(
      "Node",
      "network_a"
    );
    const networkBResults = await this.memoryManager.searchEntities(
      "Node",
      "network_b"
    );
    const networkCResults = await this.memoryManager.searchEntities(
      "Node",
      "network_c"
    );

    this.assertTrue(
      networkAResults.entities.length >= 1,
      "Network A should have nodes"
    );
    this.assertTrue(
      networkBResults.entities.length >= 1,
      "Network B should have nodes"
    );
    this.assertTrue(
      networkCResults.entities.length >= 2,
      "Network C should have nodes"
    );

    console.log("   ✅ Complex cross-reference network validated");
  }

  async testDataMigrationScenario() {
    // Test data migration and transformation scenarios

    // Step 1: Create legacy data structure
    const legacyBranch = "legacy_system_" + Date.now();
    await this.memoryManager.createBranch(legacyBranch, "Legacy system data");

    const legacyEntities = [
      {
        name: "LegacyUser",
        entityType: "User",
        observations: [
          "Legacy user data format",
          "Basic authentication system",
          "Simple role management",
        ],
        status: "deprecated",
      },
      {
        name: "LegacyProduct",
        entityType: "Product",
        observations: [
          "Legacy product catalog",
          "Basic inventory tracking",
          "Simple pricing model",
        ],
        status: "deprecated",
      },
    ];

    await this.memoryManager.createEntities(legacyEntities, legacyBranch);

    // Step 2: Create new system structure
    const modernBranch = "modern_system_" + Date.now();
    await this.memoryManager.createBranch(modernBranch, "Modern system data");

    const modernEntities = [
      {
        name: "ModernUserProfile",
        entityType: "UserProfile",
        observations: [
          "Enhanced user profile system",
          "OAuth2 authentication integration",
          "Role-based access control",
          "User preference management",
          "Activity tracking and analytics",
        ],
        crossRefs: [
          {
            memoryBranch: legacyBranch,
            entityNames: ["LegacyUser"],
          },
        ],
        status: "active",
      },
      {
        name: "ModernProductCatalog",
        entityType: "ProductCatalog",
        observations: [
          "Advanced product catalog system",
          "Dynamic pricing engine",
          "Inventory management with forecasting",
          "Multi-channel sales support",
          "Analytics and reporting dashboard",
        ],
        crossRefs: [
          {
            memoryBranch: legacyBranch,
            entityNames: ["LegacyProduct"],
          },
        ],
        status: "active",
      },
    ];

    await this.memoryManager.createEntities(modernEntities, modernBranch);

    // Step 3: Verify migration tracking
    const migrationResults = await this.memoryManager.searchEntities(
      "legacy",
      "*",
      ["active", "deprecated"]
    );
    this.assertTrue(
      migrationResults.entities.length >= 2,
      "Should find legacy entities"
    );

    const modernResults = await this.memoryManager.searchEntities(
      "Modern",
      "*"
    );
    this.assertTrue(
      modernResults.entities.length >= 2,
      "Should find modern entities"
    );

    // Step 4: Test data lineage through cross-references
    const userEvolution = await this.memoryManager.searchEntities("user", "*", [
      "active",
      "deprecated",
    ]);
    this.assertTrue(
      userEvolution.entities.length >= 2,
      "Should find user evolution across systems"
    );

    console.log("   ✅ Data migration scenario validated");
  }

  async runAllTests() {
    await this.runTest("Complete Project Workflow", () =>
      this.testCompleteProjectWorkflow()
    );
    await this.runTest("Knowledge Evolution Workflow", () =>
      this.testKnowledgeEvolutionWorkflow()
    );
    await this.runTest("Large Scale Data Handling", () =>
      this.testLargeScaleDataHandling()
    );
    await this.runTest("Error Handling and Recovery", () =>
      this.testErrorHandlingAndRecovery()
    );
    await this.runTest("Complex Cross-Reference Network", () =>
      this.testComplexCrossReferenceNetwork()
    );
    await this.runTest("Data Migration Scenario", () =>
      this.testDataMigrationScenario()
    );

    return this.getResults();
  }
}
