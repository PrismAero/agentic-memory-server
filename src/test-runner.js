#!/usr/bin/env node

/**
 * Memory Server Test Runner
 * Comprehensive test suite for validating core memory server functionality
 *
 * Usage: node test-runner.js [test-suite]
 *
 * Test Suites:
 * - all: Run all tests (default)
 * - branches: Test branch operations
 * - entities: Test entity operations
 * - relationships: Test cross-reference and relationship operations
 * - search: Test search functionality
 * - keywords: Test keyword extraction and similarity
 * - integration: Test full workflow scenarios
 * - performance: Test performance under load
 */

import fs from "fs";
import path from "path";
import { EnhancedMemoryManager } from "./dist/enhanced-memory-manager-modular.js";
import { BranchTests } from "./tests/branch-tests.js";
import { EntityTests } from "./tests/entity-tests.js";
import { IntegrationTests } from "./tests/integration-tests.js";
import { KeywordTests } from "./tests/keyword-tests.js";
import { PerformanceTests } from "./tests/performance-tests.js";
import { RelationshipTests } from "./tests/relationship-tests.js";
import { SearchTests } from "./tests/search-tests.js";

class TestRunner {
  constructor() {
    this.testPath = path.join(process.cwd(), "test-memory");
    this.memoryManager = null;
    this.results = {
      passed: 0,
      failed: 0,
      skipped: 0,
      errors: [],
    };
    this.startTime = null;
  }

  async initialize() {
    console.log("🚀 Initializing Memory Server Test Suite");
    console.log("=".repeat(50));

    // Clean up any existing test data
    if (fs.existsSync(this.testPath)) {
      fs.rmSync(this.testPath, { recursive: true, force: true });
    }

    // Set up test environment
    process.env.MEMORY_PATH = this.testPath;
    this.memoryManager = new EnhancedMemoryManager();

    try {
      await this.memoryManager.initialize();
      console.log("✅ Memory manager initialized successfully");
      return true;
    } catch (error) {
      console.error("❌ Failed to initialize memory manager:", error);
      return false;
    }
  }

  async cleanup() {
    if (this.memoryManager) {
      await this.memoryManager.close();
    }

    // Keep test data for inspection if tests failed
    if (this.results.failed === 0) {
      if (fs.existsSync(this.testPath)) {
        fs.rmSync(this.testPath, { recursive: true, force: true });
      }
      console.log("🧹 Test data cleaned up");
    } else {
      console.log(`📁 Test data preserved at: ${this.testPath}`);
    }
  }

  async runTestSuite(suiteName, TestClass) {
    console.log(`\n🔧 Running ${suiteName} Tests`);
    console.log("-".repeat(30));

    const testInstance = new TestClass(this.memoryManager);
    const results = await testInstance.runAllTests();

    this.results.passed += results.passed;
    this.results.failed += results.failed;
    this.results.skipped += results.skipped;
    this.results.errors.push(...results.errors);

    console.log(
      `📊 ${suiteName}: ${results.passed} passed, ${results.failed} failed, ${results.skipped} skipped`
    );

    if (results.errors.length > 0) {
      console.log("❌ Errors:");
      results.errors.forEach((error) => console.log(`   ${error}`));
    }

    return results;
  }

  async runTests(requestedSuite = "all") {
    this.startTime = Date.now();

    if (!(await this.initialize())) {
      process.exit(1);
    }

    try {
      const testSuites = [
        { name: "Branch Operations", class: BranchTests, key: "branches" },
        { name: "Entity Operations", class: EntityTests, key: "entities" },
        {
          name: "Relationship Operations",
          class: RelationshipTests,
          key: "relationships",
        },
        { name: "Search Functionality", class: SearchTests, key: "search" },
        { name: "Keyword Processing", class: KeywordTests, key: "keywords" },
        {
          name: "Integration Scenarios",
          class: IntegrationTests,
          key: "integration",
        },
        {
          name: "Performance Tests",
          class: PerformanceTests,
          key: "performance",
        },
      ];

      // Filter test suites based on request
      const suitesToRun =
        requestedSuite === "all"
          ? testSuites
          : testSuites.filter((suite) => suite.key === requestedSuite);

      if (suitesToRun.length === 0) {
        console.log(`❌ Unknown test suite: ${requestedSuite}`);
        console.log(
          "Available suites: all, branches, entities, relationships, search, keywords, integration, performance"
        );
        return;
      }

      // Run selected test suites
      for (const suite of suitesToRun) {
        await this.runTestSuite(suite.name, suite.class);
      }

      // Print summary
      this.printSummary();
    } catch (error) {
      console.error("💥 Test runner crashed:", error);
      this.results.errors.push(`Test runner crash: ${error.message}`);
    } finally {
      await this.cleanup();
    }
  }

  printSummary() {
    const duration = Date.now() - this.startTime;
    const total =
      this.results.passed + this.results.failed + this.results.skipped;

    console.log("\n" + "=".repeat(50));
    console.log("📋 TEST SUMMARY");
    console.log("=".repeat(50));
    console.log(`⏱️  Duration: ${duration}ms`);
    console.log(`📊 Total Tests: ${total}`);
    console.log(`✅ Passed: ${this.results.passed}`);
    console.log(`❌ Failed: ${this.results.failed}`);
    console.log(`⏭️  Skipped: ${this.results.skipped}`);

    if (this.results.failed > 0) {
      console.log("\n❌ FAILED TESTS:");
      this.results.errors.forEach((error, i) => {
        console.log(`${i + 1}. ${error}`);
      });
      console.log(`\n💡 Test data available for inspection: ${this.testPath}`);
    } else {
      console.log("\n🎉 ALL TESTS PASSED! 🎉");
    }

    console.log("=".repeat(50));

    // Exit with appropriate code
    process.exit(this.results.failed > 0 ? 1 : 0);
  }
}

// Main execution
async function main() {
  const requestedSuite = process.argv[2] || "all";
  const runner = new TestRunner();

  // Handle graceful shutdown
  process.on("SIGINT", async () => {
    console.log("\n🛑 Test run interrupted");
    await runner.cleanup();
    process.exit(1);
  });

  await runner.runTests(requestedSuite);
}

main().catch((error) => {
  console.error("💥 Fatal error:", error);
  process.exit(1);
});
