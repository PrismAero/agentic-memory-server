/**
 * Keyword and Similarity Tests
 * Tests for keyword extraction, similarity matching, and text processing
 */

import { BaseTest } from "./base-test.js";

export class KeywordTests extends BaseTest {
  constructor(memoryManager) {
    super(memoryManager);
  }

  async testKeywordExtraction() {
    // Create entities with rich content for keyword extraction
    const entities = [
      {
        name: "TechnicalDocument_" + Date.now(),
        entityType: "Documentation",
        observations: [
          "This document covers advanced JavaScript programming techniques",
          "It includes modules, async/await patterns, and React components",
          "Performance optimization strategies are discussed in detail",
          "TypeScript integration and type safety best practices",
        ],
      },
      {
        name: "APISpecification_" + Date.now(),
        entityType: "API",
        observations: [
          "RESTful API specification for user authentication service",
          "Includes JWT token management and refresh mechanisms",
          "Rate limiting and security headers implementation",
          "OpenAPI 3.0 specification with comprehensive examples",
        ],
      },
    ];

    const created = await this.memoryManager.createEntities(entities, "main");

    this.assertArrayLength(
      created,
      2,
      "Should create entities for keyword testing"
    );

    // Test search using technical keywords
    const jsResults = await this.memoryManager.searchEntities(
      "JavaScript",
      "main"
    );
    this.assertTrue(
      jsResults.entities.length > 0,
      "Should find entities with JavaScript keyword"
    );

    const apiResults = await this.memoryManager.searchEntities("API", "main");
    this.assertTrue(
      apiResults.entities.length > 0,
      "Should find entities with API keyword"
    );

    const authResults = await this.memoryManager.searchEntities(
      "authentication",
      "main"
    );
    this.assertTrue(
      authResults.entities.length > 0,
      "Should find entities with authentication keyword"
    );
  }

  async testSimilarityMatching() {
    // Create entities with similar but not identical content
    const similarEntities = [
      {
        name: "WebAuthentication_" + Date.now(),
        entityType: "System",
        observations: [
          "Web application user login system",
          "Handles user credentials and session management",
          "JWT token-based authentication mechanism",
          "Secure password hashing and validation",
        ],
      },
      {
        name: "MobileAuth_" + Date.now(),
        entityType: "System",
        observations: [
          "Mobile app user authentication service",
          "Manages user login and session tokens",
          "JSON Web Token implementation for mobile",
          "Biometric authentication integration",
        ],
      },
      {
        name: "DatabaseSchema_" + Date.now(),
        entityType: "Schema",
        observations: [
          "User account database design",
          "Stores login credentials securely",
          "Authentication token storage table",
          "User session tracking schema",
        ],
      },
    ];

    const created = await this.memoryManager.createEntities(
      similarEntities,
      "main"
    );
    this.assertArrayLength(created, 3, "Should create similar entities");

    // Search for authentication-related content
    const authResults = await this.memoryManager.searchEntities(
      "user login authentication",
      "main"
    );

    this.assertTrue(
      authResults.entities.length >= 2,
      "Should find multiple similar entities"
    );

    // All three entities should be found as they're all related to authentication
    const foundNames = authResults.entities.map((e) => e.name);

    let foundSimilarEntities = 0;
    for (const entity of similarEntities) {
      if (foundNames.includes(entity.name)) {
        foundSimilarEntities++;
      }
    }

    this.assertTrue(
      foundSimilarEntities >= 2,
      "Should find at least 2 of the similar entities"
    );
  }

  async testTechnicalTermRecognition() {
    // Create entities with various technical terms
    const techEntities = [
      {
        name: "ReactComponent_" + Date.now(),
        entityType: "Component",
        observations: [
          "React functional component with hooks",
          "Uses useState and useEffect for state management",
          "TypeScript props interface definition",
          "CSS modules for styling implementation",
        ],
      },
      {
        name: "NodejsAPI_" + Date.now(),
        entityType: "Service",
        observations: [
          "Node.js Express server implementation",
          "MongoDB database connection with Mongoose ODM",
          "JWT middleware for route protection",
          "CORS configuration for cross-origin requests",
        ],
      },
      {
        name: "DockerDeployment_" + Date.now(),
        entityType: "Infrastructure",
        observations: [
          "Docker containerization for microservices",
          "Kubernetes deployment configuration files",
          "CI/CD pipeline with GitHub Actions",
          "AWS ECS deployment automation",
        ],
      },
    ];

    await this.memoryManager.createEntities(techEntities, "main");

    // Test recognition of various technical terms
    const testTerms = [
      "React",
      "TypeScript",
      "MongoDB",
      "Kubernetes",
      "Docker",
      "Express",
      "AWS",
    ];

    for (const term of testTerms) {
      const results = await this.memoryManager.searchEntities(term, "main");
      this.assertTrue(
        results.entities.length > 0,
        `Should recognize technical term: ${term}`
      );
    }
  }

  async testAcronymAndAbbreviationHandling() {
    // Create entities with acronyms and abbreviations
    const acronymEntities = [
      {
        name: "HTTPSProtocol_" + Date.now(),
        entityType: "Protocol",
        observations: [
          "HTTPS secure communication protocol",
          "SSL/TLS encryption for web traffic",
          "HTTP over secure socket layer",
          "Certificate authority validation process",
        ],
      },
      {
        name: "RESTfulAPI_" + Date.now(),
        entityType: "API",
        observations: [
          "REST architectural style implementation",
          "Representational State Transfer principles",
          "HTTP methods: GET, POST, PUT, DELETE",
          "Stateless client-server communication",
        ],
      },
      {
        name: "SQLDatabase_" + Date.now(),
        entityType: "Database",
        observations: [
          "SQL database management system",
          "Structured Query Language for data operations",
          "ACID compliance for transaction integrity",
          "Relational database management principles",
        ],
      },
    ];

    await this.memoryManager.createEntities(acronymEntities, "main");

    // Test searching for both acronyms and full forms
    const acronymTests = [
      { acronym: "HTTPS", fullForm: "secure communication" },
      { acronym: "REST", fullForm: "Representational State Transfer" },
      { acronym: "SQL", fullForm: "Structured Query Language" },
      { acronym: "SSL", fullForm: "secure socket layer" },
      { acronym: "API", fullForm: "interface" },
    ];

    for (const test of acronymTests) {
      // Search for acronym
      const acronymResults = await this.memoryManager.searchEntities(
        test.acronym,
        "main"
      );
      this.assertTrue(
        acronymResults.entities.length > 0,
        `Should find entities for acronym: ${test.acronym}`
      );

      // Search for full form
      const fullFormResults = await this.memoryManager.searchEntities(
        test.fullForm,
        "main"
      );
      this.assertTrue(
        fullFormResults.entities.length > 0,
        `Should find entities for full form: ${test.fullForm}`
      );
    }
  }

  async testStopWordFiltering() {
    // Create entities with content that includes stop words
    const stopWordEntity = {
      name: "StopWordTest_" + Date.now(),
      entityType: "Test",
      observations: [
        "This is a test of the emergency broadcast system",
        "The quick brown fox jumps over the lazy dog",
        "In the beginning was the word, and the word was code",
        "To be or not to be, that is the question of software development",
      ],
    };

    await this.memoryManager.createEntities([stopWordEntity], "main");

    // Search using stop words should focus on meaningful terms
    const meaningfulResults = await this.memoryManager.searchEntities(
      "emergency broadcast system",
      "main"
    );
    this.assertTrue(
      meaningfulResults.entities.length > 0,
      "Should find entities despite stop words"
    );

    // Search for pure stop words might return fewer or no results
    const stopWordResults = await this.memoryManager.searchEntities(
      "the is a",
      "main"
    );
    // This behavior may vary - document what happens
    console.log(
      `   ℹ️  Stop word search returned ${stopWordResults.entities.length} results`
    );
  }

  async testProgrammingLanguageDetection() {
    // Create entities with programming language-specific content
    const codeEntities = [
      {
        name: "PythonScript_" + Date.now(),
        entityType: "Script",
        observations: [
          "Python script for data analysis with pandas",
          "Uses numpy for numerical computations",
          "Flask web framework implementation",
          "Virtual environment setup with pip requirements",
        ],
      },
      {
        name: "JavaApplication_" + Date.now(),
        entityType: "Application",
        observations: [
          "Java Spring Boot application development",
          "Maven build configuration and dependencies",
          "Hibernate ORM for database operations",
          "JUnit testing framework implementation",
        ],
      },
      {
        name: "GoMicroservice_" + Date.now(),
        entityType: "Service",
        observations: [
          "Go microservice with goroutines and channels",
          "Docker container deployment configuration",
          "gRPC protocol buffer implementation",
          "Kubernetes service mesh integration",
        ],
      },
    ];

    await this.memoryManager.createEntities(codeEntities, "main");

    // Test language-specific searches
    const languageTests = [
      "Python",
      "Java",
      "Go",
      "pandas",
      "Spring Boot",
      "goroutines",
    ];

    for (const lang of languageTests) {
      const results = await this.memoryManager.searchEntities(lang, "main");
      this.assertTrue(
        results.entities.length > 0,
        `Should detect programming language/framework: ${lang}`
      );
    }
  }

  async testContextualSimilarity() {
    // Create entities with different contexts but similar keywords
    const contextEntities = [
      {
        name: "WebSecurity_" + Date.now(),
        entityType: "Security",
        observations: [
          "Web application security best practices",
          "XSS and CSRF attack prevention",
          "Input validation and sanitization",
          "Security headers configuration",
        ],
      },
      {
        name: "NetworkSecurity_" + Date.now(),
        entityType: "Security",
        observations: [
          "Network security infrastructure design",
          "Firewall rules and intrusion detection",
          "VPN configuration for remote access",
          "Network monitoring and threat analysis",
        ],
      },
      {
        name: "SecurityAudit_" + Date.now(),
        entityType: "Process",
        observations: [
          "Security audit procedures and checklists",
          "Vulnerability assessment methodologies",
          "Compliance reporting requirements",
          "Risk assessment documentation",
        ],
      },
    ];

    await this.memoryManager.createEntities(contextEntities, "main");

    // Search for "security" should find all three but with appropriate ranking
    const securityResults = await this.memoryManager.searchEntities(
      "security",
      "main"
    );
    this.assertTrue(
      securityResults.entities.length >= 3,
      "Should find all security-related entities"
    );

    // More specific searches should prioritize relevant contexts
    const webSecResults = await this.memoryManager.searchEntities(
      "web application security",
      "main"
    );
    this.assertTrue(
      webSecResults.entities.length > 0,
      "Should find web security entities"
    );

    const networkSecResults = await this.memoryManager.searchEntities(
      "network security",
      "main"
    );
    this.assertTrue(
      networkSecResults.entities.length > 0,
      "Should find network security entities"
    );
  }

  async testSynonymRecognition() {
    // Create entities with synonymous terms
    const synonymEntities = [
      {
        name: "UserInterface_" + Date.now(),
        entityType: "Interface",
        observations: [
          "User interface design principles",
          "UI components and layout structure",
          "Frontend user experience optimization",
          "Interface accessibility guidelines",
        ],
      },
      {
        name: "GraphicalInterface_" + Date.now(),
        entityType: "Interface",
        observations: [
          "Graphical user interface development",
          "GUI framework implementation",
          "Visual design patterns and components",
          "Interactive element design",
        ],
      },
    ];

    await this.memoryManager.createEntities(synonymEntities, "main");

    // Test synonym recognition
    const uiResults = await this.memoryManager.searchEntities("UI", "main");
    const guiResults = await this.memoryManager.searchEntities("GUI", "main");
    const interfaceResults = await this.memoryManager.searchEntities(
      "interface",
      "main"
    );

    this.assertTrue(
      uiResults.entities.length > 0,
      "Should find entities for UI"
    );
    this.assertTrue(
      guiResults.entities.length > 0,
      "Should find entities for GUI"
    );
    this.assertTrue(
      interfaceResults.entities.length > 0,
      "Should find entities for interface"
    );

    // Results might overlap due to synonymy
    console.log(
      `   ℹ️  UI search: ${uiResults.entities.length}, GUI search: ${guiResults.entities.length}, Interface search: ${interfaceResults.entities.length}`
    );
  }

  async runAllTests() {
    await this.runTest("Keyword Extraction", () =>
      this.testKeywordExtraction()
    );
    await this.runTest("Similarity Matching", () =>
      this.testSimilarityMatching()
    );
    await this.runTest("Technical Term Recognition", () =>
      this.testTechnicalTermRecognition()
    );
    await this.runTest("Acronym and Abbreviation Handling", () =>
      this.testAcronymAndAbbreviationHandling()
    );
    await this.runTest("Stop Word Filtering", () =>
      this.testStopWordFiltering()
    );
    await this.runTest("Programming Language Detection", () =>
      this.testProgrammingLanguageDetection()
    );
    await this.runTest("Contextual Similarity", () =>
      this.testContextualSimilarity()
    );
    await this.runTest("Synonym Recognition", () =>
      this.testSynonymRecognition()
    );

    return this.getResults();
  }
}
