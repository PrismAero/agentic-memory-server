/**
 * Base Test Class
 * Provides common testing functionality and assertions
 */

export class BaseTest {
  constructor(memoryManager) {
    this.memoryManager = memoryManager;
    this.results = {
      passed: 0,
      failed: 0,
      skipped: 0,
      errors: [],
    };
  }

  // Assertion methods
  assertEqual(actual, expected, message = "") {
    if (actual === expected) {
      return true;
    }
    throw new Error(`${message} - Expected: ${expected}, Actual: ${actual}`);
  }

  assertNotEqual(actual, expected, message = "") {
    if (actual !== expected) {
      return true;
    }
    throw new Error(`${message} - Values should not be equal: ${actual}`);
  }

  assertTrue(value, message = "") {
    if (value === true) {
      return true;
    }
    throw new Error(`${message} - Expected true, got: ${value}`);
  }

  assertFalse(value, message = "") {
    if (value === false) {
      return true;
    }
    throw new Error(`${message} - Expected false, got: ${value}`);
  }

  assertExists(value, message = "") {
    if (value !== null && value !== undefined) {
      return true;
    }
    throw new Error(`${message} - Expected value to exist, got: ${value}`);
  }

  assertArrayLength(array, expectedLength, message = "") {
    if (!Array.isArray(array)) {
      throw new Error(`${message} - Expected array, got: ${typeof array}`);
    }
    if (array.length === expectedLength) {
      return true;
    }
    throw new Error(
      `${message} - Expected array length ${expectedLength}, got: ${array.length}`
    );
  }

  assertContains(container, item, message = "") {
    if (Array.isArray(container)) {
      if (container.includes(item)) {
        return true;
      }
      throw new Error(`${message} - Array does not contain: ${item}`);
    }
    if (typeof container === "string") {
      if (container.includes(item)) {
        return true;
      }
      throw new Error(`${message} - String does not contain: ${item}`);
    }
    if (container && typeof container === "object") {
      if (item in container) {
        return true;
      }
      throw new Error(`${message} - Object does not contain key: ${item}`);
    }
    throw new Error(
      `${message} - Cannot check contains for type: ${typeof container}`
    );
  }

  assertMatches(actual, pattern, message = "") {
    const regex = pattern instanceof RegExp ? pattern : new RegExp(pattern);
    if (regex.test(actual)) {
      return true;
    }
    throw new Error(
      `${message} - "${actual}" does not match pattern: ${pattern}`
    );
  }

  assertThrows(func, expectedErrorMessage = null, message = "") {
    try {
      func();
      throw new Error(`${message} - Expected function to throw an error`);
    } catch (error) {
      if (
        expectedErrorMessage &&
        !error.message.includes(expectedErrorMessage)
      ) {
        throw new Error(
          `${message} - Expected error message to contain "${expectedErrorMessage}", got: ${error.message}`
        );
      }
      return true;
    }
  }

  async assertThrowsAsync(
    asyncFunc,
    expectedErrorMessage = null,
    message = ""
  ) {
    try {
      await asyncFunc();
      throw new Error(`${message} - Expected async function to throw an error`);
    } catch (error) {
      if (
        expectedErrorMessage &&
        !error.message.includes(expectedErrorMessage)
      ) {
        throw new Error(
          `${message} - Expected error message to contain "${expectedErrorMessage}", got: ${error.message}`
        );
      }
      return true;
    }
  }

  // Test execution helper
  async runTest(testName, testFunction) {
    const startTime = Date.now();

    try {
      console.log(`   🔧 ${testName}`);
      await testFunction();
      const duration = Date.now() - startTime;
      console.log(`   ✅ ${testName} (${duration}ms)`);
      this.results.passed++;
      return { passed: true, duration };
    } catch (error) {
      const duration = Date.now() - startTime;
      console.log(`   ❌ ${testName} (${duration}ms): ${error.message}`);
      this.results.failed++;
      this.results.errors.push(`${testName}: ${error.message}`);
      return { passed: false, error: error.message, duration };
    }
  }

  skipTest(testName, reason = "") {
    console.log(`   ⏭️  ${testName} (skipped: ${reason})`);
    this.results.skipped++;
    return { skipped: true, reason };
  }

  // Test data generators
  generateTestEntity(
    name = "TestEntity",
    type = "Test",
    observations = ["Test observation"]
  ) {
    return {
      name: name + "_" + Date.now(),
      entityType: type,
      observations: observations,
      status: "active",
    };
  }

  generateTestEntities(count = 3, prefix = "TestEntity") {
    const entities = [];
    for (let i = 1; i <= count; i++) {
      entities.push(
        this.generateTestEntity(`${prefix}_${i}`, "TestType", [
          `Observation ${i} for ${prefix}`,
          `Additional data for entity ${i}`,
        ])
      );
    }
    return entities;
  }

  generateRelatedEntities() {
    return [
      {
        name: "Frontend_Component_" + Date.now(),
        entityType: "Component",
        observations: [
          "React component for user interface",
          "Uses TypeScript",
          "Handles user authentication",
        ],
      },
      {
        name: "Backend_API_" + Date.now(),
        entityType: "API",
        observations: [
          "REST API endpoint",
          "Handles authentication requests",
          "Returns JWT tokens",
        ],
      },
      {
        name: "Database_Schema_" + Date.now(),
        entityType: "Schema",
        observations: [
          "User authentication table",
          "Stores encrypted passwords",
          "Has foreign key relationships",
        ],
      },
    ];
  }

  // Utility methods
  async wait(ms = 100) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  randomString(length = 8) {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  async runAllTests() {
    // This method should be overridden by subclasses
    throw new Error("runAllTests() must be implemented by subclass");
  }

  getResults() {
    return { ...this.results };
  }
}
