# Memory Server Test Suite

Comprehensive test utilities for validating the Agentic Memory Server functionality, performance, and reliability.

## Quick Start

```bash
# Run all tests
node test-runner.js

# Run specific test suite
node test-runner.js branches
node test-runner.js entities
node test-runner.js search
```

## Test Suites

### 🌿 Branch Operations (`branches`)

Tests memory branch creation, deletion, and management:

- Branch creation with/without purpose
- Duplicate branch prevention
- Branch listing and statistics
- Main branch protection
- Branch naming validation

### 📦 Entity Operations (`entities`)

Tests entity CRUD operations and lifecycle:

- Single and batch entity creation
- Entity updates and status changes
- Entity deletion and cleanup
- Observation management
- Cross-reference handling
- Large observation sets

### 🔗 Relationship Operations (`relationships`)

Tests cross-references and entity relationships:

- Cross-reference creation and validation
- Multiple cross-references per entity
- References to multiple entities
- Auto-relationship detection
- Invalid reference handling
- Bidirectional relationships

### 🔍 Search Functionality (`search`)

Tests smart search capabilities:

- Basic and cross-branch search
- Partial term matching
- Multi-term search queries
- Status-based filtering
- Context depth control
- Special character handling
- Search performance validation

### 🏷️ Keyword Processing (`keywords`)

Tests keyword extraction and similarity:

- Technical term recognition
- Acronym and abbreviation handling
- Programming language detection
- Similarity matching algorithms
- Contextual relevance scoring
- Synonym recognition

### 🔄 Integration Scenarios (`integration`)

Tests complete workflows and complex scenarios:

- Full project development workflow
- Knowledge evolution over time
- Large-scale data handling
- Error handling and recovery
- Complex cross-reference networks
- Data migration scenarios

### ⚡ Performance Tests (`performance`)

Tests system performance and scalability:

- Operation timing and throughput
- Memory usage monitoring
- Concurrent operation handling
- Scalability limit testing
- Database performance validation
- Resource usage analysis

## Test Structure

### Base Test Class

All tests extend `BaseTest` which provides:

- Assertion methods (`assertEqual`, `assertTrue`, etc.)
- Test execution helpers
- Data generators
- Utility functions

### Assertion Methods

```javascript
// Basic assertions
this.assertEqual(actual, expected, message);
this.assertTrue(value, message);
this.assertExists(value, message);

// Collection assertions
this.assertArrayLength(array, expectedLength, message);
this.assertContains(container, item, message);

// Pattern matching
this.assertMatches(actual, pattern, message);

// Error handling
this.assertThrows(func, expectedError, message);
await this.assertThrowsAsync(asyncFunc, expectedError, message);
```

### Test Data Generators

```javascript
// Generate test entities
const entity = this.generateTestEntity("Name", "Type", ["observation"]);
const entities = this.generateTestEntities(3, "Prefix");
const relatedEntities = this.generateRelatedEntities();
```

## Running Tests

### Command Line Options

```bash
# Run all test suites
node test-runner.js

# Run specific test suite
node test-runner.js [suite-name]

# Available suites:
# - all (default)
# - branches
# - entities
# - relationships
# - search
# - keywords
# - integration
# - performance
```

### Test Environment

Tests create an isolated environment:

- Temporary test directory: `test-memory/`
- Clean slate for each test run
- Automatic cleanup on success
- Test data preserved on failure for inspection

### Exit Codes

- `0`: All tests passed
- `1`: One or more tests failed

## Test Output

### Real-time Progress

```
🚀 Initializing Memory Server Test Suite
==================================================
✅ Memory manager initialized successfully

🔧 Running Branch Operations Tests
------------------------------
   🔧 Create Branch
   ✅ Create Branch (45ms)
   🔧 Delete Branch
   ✅ Delete Branch (23ms)
   ...
📊 Branch Operations: 8 passed, 0 failed, 0 skipped
```

### Summary Report

```
==================================================
📋 TEST SUMMARY
==================================================
⏱️  Duration: 15432ms
📊 Total Tests: 67
✅ Passed: 67
❌ Failed: 0
⏭️  Skipped: 0

🎉 ALL TESTS PASSED! 🎉
==================================================
```

### Performance Metrics

Performance tests include timing and memory usage:

```
   ⏱️  Creating 100 entities in batch: 234ms (Memory: 2.3MB)
   📊 Batch vs Individual: 234ms vs 1240ms (10 entities)
   🧠 Memory increase: 15.2MB
   📈 Scalability Analysis:
      Batch 10: 45ms (222 entities/sec)
      Batch 50: 156ms (320 entities/sec)
```

## Debugging Failed Tests

### Test Data Inspection

When tests fail, data is preserved:

```
💡 Test data available for inspection: /path/to/test-memory
```

You can examine:

- SQLite database: `test-memory/memory.db`
- Backup files: `test-memory/backups/`
- Log files (if enabled)

### Common Failure Patterns

**Assertion Failures:**

```
❌ Create Branch (12ms): Expected: "test_branch", Actual: undefined
```

- Check entity creation logic
- Verify database operations
- Examine input validation

**Timeout Failures:**

```
❌ Search Performance (1245ms): Search should be fast: authentication (1245ms)
```

- Review search optimization
- Check database indexing
- Examine query complexity

**Memory Issues:**

```
❌ Memory Usage (5432ms): Memory usage should be reasonable (156.7MB increase)
```

- Look for memory leaks
- Check garbage collection
- Review object retention

## Extending Tests

### Adding New Test Cases

1. Create test method in appropriate test class:

```javascript
async testMyNewFeature() {
  // Setup
  const entity = this.generateTestEntity();

  // Execute
  const result = await this.memoryManager.someOperation(entity);

  // Verify
  this.assertExists(result, "Operation should return result");
  this.assertEqual(result.status, "success", "Operation should succeed");
}
```

2. Add to test suite:

```javascript
async runAllTests() {
  await this.runTest("My New Feature", () => this.testMyNewFeature());
  // ... other tests
  return this.getResults();
}
```

### Creating New Test Suites

1. Create new test file: `tests/my-new-tests.js`
2. Extend `BaseTest` class
3. Implement `runAllTests()` method
4. Add to test runner in `test-runner.js`

### Performance Test Patterns

Use `measureOperation` for timing:

```javascript
const { duration, result } = await this.measureOperation(
  "Operation description",
  async () => {
    return await this.memoryManager.someOperation();
  }
);

this.assertTrue(duration < 1000, `Operation should be fast (${duration}ms)`);
```

## Best Practices

### Test Design

- **Isolated**: Each test should be independent
- **Repeatable**: Tests should produce consistent results
- **Fast**: Aim for sub-second execution per test
- **Clear**: Test names and assertions should be descriptive

### Data Management

- Use generated test data with timestamps for uniqueness
- Clean up test data appropriately
- Avoid hardcoded values that might conflict

### Error Handling

- Test both success and failure cases
- Use appropriate assertion methods
- Provide meaningful error messages

### Performance Testing

- Establish baseline expectations
- Monitor resource usage
- Test under realistic load conditions
- Include scalability validation

## Troubleshooting

### Build Issues

```bash
# Ensure TypeScript is compiled
cd src/memory && npm run build

# Check for syntax errors
node -c test-runner.js
```

### Runtime Issues

```bash
# Verify memory manager initialization
node -e "
import('./dist/enhanced-memory-manager-modular.js').then(async (mod) => {
  const manager = new mod.EnhancedMemoryManager();
  await manager.initialize();
  console.log('✅ Manager works');
  await manager.close();
});
"
```

### Permission Issues

```bash
# Ensure test directory is writable
mkdir -p test-memory && chmod 755 test-memory
```

## Contributing

When adding new functionality:

1. **Write tests first** - Test-driven development
2. **Cover edge cases** - Not just happy path
3. **Include performance tests** - For new operations
4. **Update documentation** - Keep this guide current
5. **Validate existing tests** - Ensure no regressions

The test suite is a critical part of the memory server's reliability and should be maintained alongside the codebase.
