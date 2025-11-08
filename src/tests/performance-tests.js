/**
 * Performance Tests
 * Tests for system performance, scalability, and resource usage
 */

import { BaseTest } from "./base-test.js";

export class PerformanceTests extends BaseTest {
  constructor(memoryManager) {
    super(memoryManager);
  }

  async measureOperation(operationName, operation) {
    const startTime = Date.now();
    const startMemory = process.memoryUsage();

    const result = await operation();

    const endTime = Date.now();
    const endMemory = process.memoryUsage();

    const duration = endTime - startTime;
    const memoryDelta = {
      rss: endMemory.rss - startMemory.rss,
      heapUsed: endMemory.heapUsed - startMemory.heapUsed,
      heapTotal: endMemory.heapTotal - startMemory.heapTotal,
    };

    console.log(
      `   ⏱️  ${operationName}: ${duration}ms (Memory: ${
        Math.round((memoryDelta.heapUsed / 1024 / 1024) * 100) / 100
      }MB)`
    );

    return { result, duration, memoryDelta };
  }

  async testBranchCreationPerformance() {
    const branchCount = 20;
    const branches = [];

    const { duration } = await this.measureOperation(
      `Creating ${branchCount} branches`,
      async () => {
        for (let i = 1; i <= branchCount; i++) {
          const branchName = `perf_branch_${i}_${Date.now()}`;
          await this.memoryManager.createBranch(
            branchName,
            `Performance test branch ${i}`
          );
          branches.push(branchName);
        }
      }
    );

    // Should complete within reasonable time
    this.assertTrue(
      duration < 5000,
      `Branch creation should be fast (${duration}ms for ${branchCount} branches)`
    );

    // Verify all branches were created
    const allBranches = await this.memoryManager.listBranches();
    this.assertTrue(
      allBranches.length >= branchCount,
      "All branches should be created"
    );

    return branches;
  }

  async testEntityCreationPerformance() {
    const entityCount = 100;

    // Test batch creation
    const entities = [];
    for (let i = 1; i <= entityCount; i++) {
      entities.push({
        name: `PerfEntity_${i}_${Date.now()}`,
        entityType: `Type_${i % 10}`,
        observations: [
          `Performance test entity ${i}`,
          `Generated for batch creation testing`,
          `Contains multiple observations for realistic data`,
          `Entity type ${i % 10} with index ${i}`,
          `Testing system performance under load`,
        ],
      });
    }

    const { duration: batchDuration } = await this.measureOperation(
      `Creating ${entityCount} entities in batch`,
      async () => {
        return await this.memoryManager.createEntities(entities);
      }
    );

    // Test individual creation for comparison
    const individualStartTime = Date.now();
    for (let i = 1; i <= 10; i++) {
      const entity = {
        name: `IndividualPerfEntity_${i}_${Date.now()}`,
        entityType: "Individual",
        observations: [`Individual creation test entity ${i}`],
      };
      await this.memoryManager.createEntities([entity]);
    }
    const individualDuration = Date.now() - individualStartTime;

    console.log(
      `   📊 Batch vs Individual: ${batchDuration}ms vs ${individualDuration}ms (10 entities)`
    );

    // Batch should be more efficient
    const estimatedIndividualTime = (individualDuration / 10) * entityCount;
    this.assertTrue(
      batchDuration < estimatedIndividualTime,
      "Batch creation should be more efficient"
    );

    // Should complete within reasonable time
    this.assertTrue(
      batchDuration < 10000,
      `Entity batch creation should be reasonably fast (${batchDuration}ms)`
    );
  }

  async testSearchPerformance() {
    // Create diverse search test data
    const searchTestEntities = [];
    const searchTerms = [
      "authentication",
      "database",
      "frontend",
      "backend",
      "security",
      "performance",
      "optimization",
      "testing",
      "deployment",
      "monitoring",
    ];

    for (let i = 1; i <= 50; i++) {
      const term = searchTerms[i % searchTerms.length];
      searchTestEntities.push({
        name: `SearchTest_${term}_${i}_${Date.now()}`,
        entityType: "SearchTest",
        observations: [
          `Entity related to ${term} functionality`,
          `Performance testing for search operations`,
          `Contains keywords: ${term}, system, implementation`,
          `Index ${i} for search performance validation`,
          `Additional content to make search more realistic`,
        ],
      });
    }

    await this.memoryManager.createEntities(searchTestEntities);

    // Test different search scenarios
    const searchTests = [
      { query: "authentication", description: "Single term search" },
      { query: "authentication system", description: "Multi-term search" },
      { query: "performance testing", description: "Common phrase search" },
      { query: "SearchTest", description: "Type-based search" },
    ];

    for (const test of searchTests) {
      const { duration, result } = await this.measureOperation(
        `Search: "${test.query}" (${test.description})`,
        async () => {
          return await this.memoryManager.searchEntities(test.query, "main");
        }
      );

      this.assertTrue(
        duration < 1000,
        `Search should be fast: ${test.query} (${duration}ms)`
      );
      this.assertTrue(
        result.entities.length > 0,
        `Search should find results: ${test.query}`
      );
    }

    // Test cross-branch search performance
    const branches = await this.testBranchCreationPerformance();
    const { duration: crossBranchDuration } = await this.measureOperation(
      `Cross-branch search across ${branches.length + 1} branches`,
      async () => {
        return await this.memoryManager.searchEntities("SearchTest", "*");
      }
    );

    this.assertTrue(
      crossBranchDuration < 2000,
      `Cross-branch search should be reasonably fast (${crossBranchDuration}ms)`
    );
  }

  async testObservationManagementPerformance() {
    // Create entity for observation testing
    const testEntity = {
      name: "ObservationPerfTest_" + Date.now(),
      entityType: "PerformanceTest",
      observations: ["Initial observation for performance testing"],
    };

    const created = await this.memoryManager.createEntities([testEntity]);
    const entityName = created[0].name;

    // Test adding many observations
    const observationBatches = 5;
    const observationsPerBatch = 20;

    for (let batch = 1; batch <= observationBatches; batch++) {
      const observations = [];
      for (let i = 1; i <= observationsPerBatch; i++) {
        observations.push(
          `Batch ${batch} observation ${i} for performance testing`
        );
      }

      const { duration } = await this.measureOperation(
        `Adding ${observationsPerBatch} observations (batch ${batch})`,
        async () => {
          await this.memoryManager.addObservations([
            {
              entityName: entityName,
              contents: observations,
            },
          ]);
        }
      );

      this.assertTrue(
        duration < 2000,
        `Observation batch ${batch} should complete quickly (${duration}ms)`
      );
    }

    // Verify final entity has all observations
    const finalEntity = await this.memoryManager.exportBranch("main");
    const updatedEntity = finalEntity.entities.find(
      (e) => e.name === entityName
    );

    const expectedObservations = 1 + observationBatches * observationsPerBatch;
    this.assertTrue(
      updatedEntity.observations.length >= expectedObservations - 2,
      `Should have approximately ${expectedObservations} observations`
    );
  }

  async testConcurrentOperations() {
    // Test system behavior under concurrent load
    const concurrentOperations = 20;

    console.log(`   🔀 Testing ${concurrentOperations} concurrent operations`);

    const operations = [];

    // Mix of different operation types
    for (let i = 1; i <= concurrentOperations; i++) {
      if (i % 4 === 0) {
        // Branch creation
        operations.push(async () => {
          const branchName = `concurrent_branch_${i}_${Date.now()}`;
          return await this.memoryManager.createBranch(
            branchName,
            `Concurrent branch ${i}`
          );
        });
      } else if (i % 4 === 1) {
        // Entity creation
        operations.push(async () => {
          const entity = {
            name: `ConcurrentEntity_${i}_${Date.now()}`,
            entityType: "Concurrent",
            observations: [`Concurrent operation ${i}`],
          };
          return await this.memoryManager.createEntities([entity]);
        });
      } else if (i % 4 === 2) {
        // Search operation
        operations.push(async () => {
          return await this.memoryManager.searchEntities("concurrent", "main");
        });
      } else {
        // Read operation
        operations.push(async () => {
          return await this.memoryManager.exportBranch("main");
        });
      }
    }

    const { duration, result } = await this.measureOperation(
      `${concurrentOperations} concurrent operations`,
      async () => {
        return await Promise.allSettled(operations.map((op) => op()));
      }
    );

    // Check results
    const successful = result.filter((r) => r.status === "fulfilled").length;
    const failed = result.filter((r) => r.status === "rejected").length;

    console.log(
      `   📊 Concurrent operations: ${successful} succeeded, ${failed} failed`
    );

    this.assertTrue(
      successful >= concurrentOperations * 0.8,
      "At least 80% of concurrent operations should succeed"
    );
    this.assertTrue(
      duration < 10000,
      `Concurrent operations should complete in reasonable time (${duration}ms)`
    );
  }

  async testMemoryUsage() {
    // Monitor memory usage during operations
    const initialMemory = process.memoryUsage();

    // Create substantial data
    const heavyEntities = [];
    for (let i = 1; i <= 50; i++) {
      const largeObservations = [];
      for (let j = 1; j <= 20; j++) {
        largeObservations.push(
          `Large observation ${j} for entity ${i} with substantial content to test memory usage patterns and system behavior under memory pressure`
        );
      }

      heavyEntities.push({
        name: `MemoryTestEntity_${i}_${Date.now()}`,
        entityType: "MemoryTest",
        observations: largeObservations,
      });
    }

    await this.measureOperation(
      "Creating memory-intensive entities",
      async () => {
        await this.memoryManager.createEntities(heavyEntities);
      }
    );

    // Perform memory-intensive operations
    await this.measureOperation(
      "Memory-intensive search operations",
      async () => {
        for (let i = 0; i < 10; i++) {
          await this.memoryManager.searchEntities("MemoryTest", "main");
        }
      }
    );

    // Check memory usage
    const finalMemory = process.memoryUsage();
    const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
    const memoryIncreaseMB = memoryIncrease / 1024 / 1024;

    console.log(
      `   🧠 Memory increase: ${Math.round(memoryIncreaseMB * 100) / 100}MB`
    );

    // Memory increase should be reasonable (less than 100MB for this test)
    this.assertTrue(
      memoryIncreaseMB < 100,
      `Memory usage should be reasonable (${memoryIncreaseMB}MB increase)`
    );

    // Force garbage collection if available
    if (global.gc) {
      global.gc();
      const afterGCMemory = process.memoryUsage();
      const gcReclaimed = finalMemory.heapUsed - afterGCMemory.heapUsed;
      console.log(
        `   🗑️  GC reclaimed: ${
          Math.round((gcReclaimed / 1024 / 1024) * 100) / 100
        }MB`
      );
    }
  }

  async testScalabilityLimits() {
    // Test system behavior at scale limits
    const scaleBranch = "scale_test_" + Date.now();
    await this.memoryManager.createBranch(
      scaleBranch,
      "Scalability testing branch"
    );

    // Test with progressively larger batches
    const batchSizes = [10, 25, 50, 100];
    const results = [];

    for (const batchSize of batchSizes) {
      const entities = [];
      for (let i = 1; i <= batchSize; i++) {
        entities.push({
          name: `ScaleEntity_${batchSize}_${i}_${Date.now()}`,
          entityType: "Scale",
          observations: [
            `Scale test entity ${i} in batch of ${batchSize}`,
            `Testing system scalability limits`,
            `Batch processing performance evaluation`,
          ],
        });
      }

      const { duration } = await this.measureOperation(
        `Batch size ${batchSize}`,
        async () => {
          await this.memoryManager.createEntities(entities, scaleBranch);
        }
      );

      results.push({
        batchSize,
        duration,
        throughput: batchSize / (duration / 1000),
      });
    }

    // Analyze scalability
    console.log("   📈 Scalability Analysis:");
    for (const result of results) {
      console.log(
        `      Batch ${result.batchSize}: ${result.duration}ms (${Math.round(
          result.throughput
        )} entities/sec)`
      );
    }

    // Throughput should not degrade significantly
    const firstThroughput = results[0].throughput;
    const lastThroughput = results[results.length - 1].throughput;
    const degradationRatio = lastThroughput / firstThroughput;

    this.assertTrue(
      degradationRatio > 0.3,
      `Throughput degradation should be reasonable (${Math.round(
        degradationRatio * 100
      )}% of initial)`
    );
  }

  async testDatabasePerformance() {
    // Test underlying database performance

    // Create data for database performance testing
    const dbTestEntities = [];
    for (let i = 1; i <= 30; i++) {
      dbTestEntities.push({
        name: `DBPerfEntity_${i}_${Date.now()}`,
        entityType: "DatabasePerf",
        observations: [
          `Database performance test entity ${i}`,
          `Testing SQLite operations under load`,
          `Measuring query performance and optimization`,
        ],
      });
    }

    await this.memoryManager.createEntities(dbTestEntities);

    // Test various database operations
    const dbOperations = [
      {
        name: "Multiple searches",
        operation: async () => {
          for (let i = 0; i < 5; i++) {
            await this.memoryManager.searchEntities("DatabasePerf", "main");
          }
        },
      },
      {
        name: "Branch listing",
        operation: async () => {
          for (let i = 0; i < 10; i++) {
            await this.memoryManager.listBranches();
          }
        },
      },
      {
        name: "Entity updates",
        operation: async () => {
          const entities = await this.memoryManager.exportBranch("main");
          const dbPerfEntity = entities.entities.find((e) =>
            e.name.includes("DBPerfEntity")
          );
          if (dbPerfEntity) {
            await this.memoryManager.updateEntityStatus(
              dbPerfEntity.name,
              "active",
              "Performance test update"
            );
          }
        },
      },
    ];

    for (const dbOp of dbOperations) {
      const { duration } = await this.measureOperation(
        `DB Operation: ${dbOp.name}`,
        dbOp.operation
      );

      this.assertTrue(
        duration < 3000,
        `Database operation ${dbOp.name} should complete quickly (${duration}ms)`
      );
    }
  }

  async runAllTests() {
    await this.runTest("Branch Creation Performance", () =>
      this.testBranchCreationPerformance()
    );
    await this.runTest("Entity Creation Performance", () =>
      this.testEntityCreationPerformance()
    );
    await this.runTest("Search Performance", () =>
      this.testSearchPerformance()
    );
    await this.runTest("Observation Management Performance", () =>
      this.testObservationManagementPerformance()
    );
    await this.runTest("Concurrent Operations", () =>
      this.testConcurrentOperations()
    );
    await this.runTest("Memory Usage", () => this.testMemoryUsage());
    await this.runTest("Scalability Limits", () =>
      this.testScalabilityLimits()
    );
    await this.runTest("Database Performance", () =>
      this.testDatabasePerformance()
    );

    return this.getResults();
  }
}
