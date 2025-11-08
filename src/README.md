# Agentic Memory Server

**Enterprise-grade persistent memory for AI assistants - completely offline and secure.**

The Agentic Memory Server provides your AI with intelligent, persistent memory that works entirely offline. No internet required, no data breaches, complete privacy. Your project's knowledge stays local and secure while enabling powerful AI assistance.

## Why Choose Agentic Memory Server

### Complete Offline Operation

- **Zero internet dependency** - works entirely local to your machine
- **No data transmission** - your project knowledge never leaves your system
- **Enhanced security** - eliminates external attack vectors and data breach risks
- **Team collaboration** - SQLite database can be shared with your project for instant team onboarding

### High-Performance Architecture

- **Sub-second search responses** across thousands of entities
- **SQLite-powered storage** with intelligent indexing and query optimization
- **Smart relevance scoring** - name matches (10pts) > type matches (8pts) > content matches (3pts)
- **Memory optimization** - automatic text compression and storage efficiency

### Intelligent Organization

- **Branch-based architecture** - organize knowledge by domain (frontend, backend, security, etc.)
- **Cross-branch search** - find related information across your entire project
- **Auto-relationship detection** - automatically connects related concepts
- **Smart observation management** - detailed technical knowledge with version tracking

## Proven Performance at Scale

Based on comprehensive testing with enterprise-scale data:

- **500+ memory branches** with complex domain separation
- **2500+ detailed entities** with hundreds of technical observations each
- **Enhanced search operations** with intelligent multi-term processing
- **Robust error handling** for all edge cases and invalid operations
- **Cross-reference linking** between related entities across branches

### Search Performance

- **Multi-term queries**: "kafka stream processing real-time" → 6 relevant entities in <10ms in test database
- **Cross-branch search**: Single query across 500+ branches with intelligent relevance ranking
- **Individual branch isolation**: Perfect domain-specific searches when needed
- **Complex technical queries**: Handles enterprise software terminology and metrics

## Key Features

### Branching Memory System

```bash
# Organize by domain
frontend-architecture/     # UI components, state management
backend-apis/             # API endpoints, database schemas
microservices-architecture/ # Service mesh, distributed systems
kubernetes-deployment/    # Container orchestration, scaling
real-time-processing/     # Stream processing, event handling
```

### Intelligent Search

- **Smart term processing** - removes stop words, handles complex phrases
- **Wildcard search** - use `*` to search across all branches
- **Branch-specific search** - target specific domains for focused results
- **Context-aware ranking** - most relevant results first

### Enterprise Entity Management

- **Complex technical entities** with detailed observations
- **Version tracking** and timestamp management
- **Status management** - active, deprecated, archived entities
- **Cross-references** between related components

### Team Collaboration

- **Shared SQLite database** - commit `.memory/` folder to version control
- **Instant project onboarding** - new team members get full project context immediately
- **Consistent AI knowledge** - entire team's AI assistants work from same knowledge base
- **No setup required** - works immediately when project is cloned

## Getting Started

### 1. Installation & Configuration

First, install the agentic memory server:

```bash
npm install -g @prism.enterprises/agentic-memory-server
```

Then add to your IDE's MCP configuration (e.g., Cursor's `mcp.json`):

```json
{
  "mcpServers": {
    "enhanced-memory": {
      "command": "npx",
      "args": ["@prism.enterprises/agentic-memory-server"],
      "env": {
        "MEMORY_PATH": "/path/to/your/project"
      }
    }
  }
}
```

### 2. Basic Usage

**Create organized knowledge branches:**

```
Create a memory branch called "api-design" for our REST API architecture
```

**Store complex technical information:**

```
Remember that our Kafka cluster processes 500 million events daily with 12 brokers and replication factor 3
```

**Intelligent search across domains:**

```
Search for "authentication" across all branches
Search for "database optimization" in the backend-apis branch
```

**Cross-reference related components:**

```
Link the frontend auth guard to the OAuth2 integration in the security branch
```

### 3. Advanced Features

**Smart Search Examples:**

- `"microservices distributed system"` → Finds service mesh, orchestration, scaling components
- `"real-time stream processing"` → Returns Kafka, Flink, event sourcing entities
- `"API gateway rate limiting"` → Discovers security, routing, performance entities

**Branch Organization:**

- **Technical domains**: `microservices-architecture`, `kubernetes-deployment`
- **Business domains**: `payment-processing`, `customer-experience`
- **Infrastructure**: `monitoring-observability`, `distributed-caching`

## Memory Storage Structure

```
your-project/
├── .memory/
│   ├── memory.db          # SQLite database (main storage)
│   ├── backups/           # Automatic JSON backups
│   │   ├── main_2024-01-15.json
│   │   └── frontend_2024-01-15.json
│   └── logs/              # Operation logs
├── your-code/
└── ...
```

**Commit `.memory/` to version control** for team collaboration and project continuity.

## Technical Architecture

### SQLite-Powered Backend

- **WAL mode** for concurrent read/write operations
- **Optimized indexing** on names, types, branches, and content
- **Foreign key constraints** for data integrity
- **Automatic backup** to JSON format

### Memory Optimization

- **Intelligent text compression** reduces storage by up to 40%
- **Relevance-based search** with weighted scoring algorithms
- **Connection pooling** handles concurrent operations efficiently
- **Resource monitoring** tracks performance and usage patterns

### Error Handling

- **Graceful failure recovery** for invalid operations
- **Input validation** prevents data corruption
- **Edge case management** handles empty queries, missing entities
- **Transaction safety** ensures data consistency

## Privacy & Security

### Complete Offline Operation

- **No external API calls** - works entirely on your local machine
- **No data transmission** - project knowledge stays private
- **Local SQLite storage** - industry-standard database security
- **Version control friendly** - team sharing through standard Git workflows

### Data Protection

- **Project-contained storage** - all data stays within your project directory
- **No cloud dependencies** - eliminates external security risks
- **Access control** - standard file system permissions apply
- **Audit trail** - complete operation logging for transparency

---

**Transform your AI assistant into a project expert with persistent, intelligent memory - completely offline and secure.**
