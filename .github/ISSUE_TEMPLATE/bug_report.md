---
name: Bug report
about: Create a report to help us improve the Agentic Memory Server
title: "[BUG] "
labels: ["bug", "needs-triage"]
assignees: ""
---

## Bug Description

A clear and concise description of what the bug is.

## To Reproduce

Steps to reproduce the behavior:

1. Set up MCP server with '...'
2. Run command '....'
3. See error

## Expected Behavior

A clear and concise description of what you expected to happen.

## Environment Information

- **OS**: [e.g. macOS 14.0, Windows 11, Ubuntu 22.04]
- **Node.js version**: [e.g. 20.5.0]
- **Package version**: [e.g. @prism.enterprises/agentic-memory-server@4.0.1]
- **IDE/Client**: [e.g. Cursor, VS Code, Claude Desktop]

## Configuration

```json
// Your MCP server configuration (remove sensitive paths)
{
  "mcp": {
    "servers": {
      "contextual-memory": {
        "command": "npx",
        "args": ["@prism.enterprises/agentic-memory-server"],
        "env": {
          "MEMORY_PATH": "/path/to/project",
          "LOG_LEVEL": "info"
        }
      }
    }
  }
}
```

## Error Messages/Logs

```
Paste any error messages or relevant log output here
```

## Memory Database Info

- **Database size**: [e.g. 2MB, 50MB]
- **Number of branches**: [e.g. 5 branches]
- **Number of entities**: [approximately]

## Additional Context

Add any other context about the problem here, such as:

- When did this start happening?
- Does it happen consistently or intermittently?
- Any recent changes to your setup?

## Troubleshooting Steps Tried

- [ ] Restarted IDE/client
- [ ] Cleared `.memory/` folder and started fresh
- [ ] Tried with different `MEMORY_PATH`
- [ ] Updated to latest package version
- [ ] Checked file permissions on memory path
