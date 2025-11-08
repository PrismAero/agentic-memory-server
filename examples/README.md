# Configuration Examples

This directory contains sample configuration files for the Agentic Memory Server.

## Available Examples

### IDE Configurations

| File                         | IDE/Platform   | Description                 | Use Case                                   |
| ---------------------------- | -------------- | --------------------------- | ------------------------------------------ |
| `cursor-mcp.json`            | Cursor IDE     | Basic production setup      | Standard usage with latest stable packages |
| `vscode-settings.json`       | VS Code        | Basic VS Code configuration | For VS Code MCP extension                  |
| `claude-desktop-config.json` | Claude Desktop | Legacy Claude Desktop setup | For standalone Claude Desktop app          |

## Quick Setup for Cursor

### 1. Choose Your Configuration

**For most users (recommended):**

```bash
cp examples/cursor-mcp.json ~/.cursor/mcp.json
```

### 2. Customize Your Settings

Edit the copied file and update:

```json
{
  "mcp": {
    "servers": {
      "contextual-memory": {
        "env": {
          "MEMORY_PATH": "/path/to/your/actual/project"
        }
      }
    }
  }
}
```

**Important**: Replace `/Users/yourusername/your-project-folder` with your actual project path!

### 3. Restart Cursor

After updating the configuration, restart Cursor IDE to load the new MCP server.

## Quick Setup for VS Code

### 1. Install MCP Extension

Search for "Model Context Protocol" in VS Code extensions and install it.

### 2. Copy Configuration

```bash
# Copy the VS Code configuration to your settings
cp examples/vscode-settings.json ~/.vscode/settings.json
# Or merge with existing settings.json
```

### 3. Update Path

Edit the settings and replace `/Users/yourusername/your-project-folder` with your actual project path.

### 4. Reload VS Code

Press `Cmd/Ctrl + Shift + P` → "Developer: Reload Window"

## Quick Setup for Claude Desktop

### 1. Copy Configuration

```bash
# Copy to Claude Desktop config location
cp examples/claude-desktop-config.json ~/Library/Application\ Support/Claude/claude_desktop_config.json
```

### 2. Update Path

Edit the config file and replace `/Users/yourusername/your-project-folder` with your actual project path.

### 3. Restart Claude Desktop

Close and reopen the Claude Desktop application.

## Configuration Options

### Environment Variables

| Variable      | Description                     | Default  | Example                          |
| ------------- | ------------------------------- | -------- | -------------------------------- |
| `MEMORY_PATH` | Base directory for memory files | Required | `/Users/john/my-project`         |
| `LOG_LEVEL`   | Logging verbosity               | `warn`   | `debug`, `info`, `warn`, `error` |

### Package Tags

| Tag                 | Description           | Stability | Use Case                |
| ------------------- | --------------------- | --------- | ----------------------- |
| `@latest` (default) | Latest stable release | High      | Production use          |
| `@dev`              | Development builds    | Low       | Development and testing |

## Environment-Specific Setup

### Development Environment

```json
{
  "mcp": {
    "servers": {
      "contextual-memory-dev": {
        "command": "npx",
        "args": ["@prism.enterprises/agentic-memory-server@dev"],
        "env": {
          "MEMORY_PATH": "/Users/yourusername/dev-projects",
          "LOG_LEVEL": "debug"
        }
      }
    }
  }
}
```

**Benefits:**

- Latest development features
- Detailed debug logging
- Separate memory path for isolation

### Production Environment

```json
{
  "mcp": {
    "servers": {
      "contextual-memory": {
        "command": "npx",
        "args": ["@prism.enterprises/agentic-memory-server"],
        "env": {
          "MEMORY_PATH": "/Users/yourusername/production-projects",
          "LOG_LEVEL": "warn"
        }
      }
    }
  }
}
```

**Benefits:**

- Stable, tested releases
- Minimal logging for performance
- Optimized for production use

## Troubleshooting

### Common Issues

#### "Command not found" Error

```bash
# Install package globally first
npm install -g @prism.enterprises/agentic-memory-server
```

#### "Permission denied" Error

```bash
# Fix npm permissions
npm config set prefix ~/.npm-global
export PATH=~/.npm-global/bin:$PATH
```

#### "MEMORY_PATH not writable" Error

```bash
# Create and set permissions for memory path
mkdir -p /path/to/your/project
chmod 755 /path/to/your/project
```

### Validation Commands

```bash
# Test if package is accessible
npx @prism.enterprises/agentic-memory-server --help

# Check Cursor MCP configuration
cat ~/.cursor/mcp.json

# Verify memory path exists and is writable
ls -la /path/to/your/project
touch /path/to/your/project/test.txt && rm /path/to/your/project/test.txt
```

## Switching Between Environments

You can maintain multiple configuration files and switch between them:

```bash
# Save current config
cp ~/.cursor/mcp.json ~/.cursor/mcp-backup.json

# Switch to development
cp examples/cursor-mcp-development.json ~/.cursor/mcp.json

# Switch back to production
cp examples/cursor-mcp.json ~/.cursor/mcp.json
```

## Additional Resources

- [Main README](../README.md) - Complete setup guide
- [Memory Server Documentation](../src/memory/README.md) - Detailed server documentation

## Tips

1. **Use absolute paths** for `MEMORY_PATH` to avoid issues
2. **Keep separate memory paths** for different environments
3. **Start with basic configuration** and add options as needed
4. **Check Cursor logs** if server doesn't start properly
5. **Restart Cursor** after configuration changes
