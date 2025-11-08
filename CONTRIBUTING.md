# Contributing to Agentic Memory Server

Thank you for your interest in contributing to the Agentic Memory Server! 🎉

## How to Contribute

### 🐛 Reporting Bugs
- Use our [Bug Report template](.github/ISSUE_TEMPLATE/bug_report.md)
- Include detailed reproduction steps
- Provide your environment information
- Share relevant configuration and logs

### 💡 Suggesting Features
- Use our [Feature Request template](.github/ISSUE_TEMPLATE/feature_request.md)
- Describe your use case clearly
- Explain the expected benefit
- Consider implementation complexity

### ❓ Getting Help
- Use our [Question template](.github/ISSUE_TEMPLATE/question.md)
- Check existing issues first
- Provide context about what you're trying to accomplish

## Development Model

This is a **public mirror repository** for community engagement. The actual development happens in a private repository.

### How it Works
1. **Issues & Discussions**: Reported here in the public repo
2. **Development**: Happens in private repository
3. **Releases**: Automatically mirrored to this public repo
4. **Community**: All interaction happens here

### What We Accept
✅ **Bug reports** - Help us identify and fix issues  
✅ **Feature requests** - Suggest improvements and new capabilities  
✅ **Questions** - Get help with setup and usage  
✅ **Documentation improvements** - Suggest clearer explanations  

### What We Don't Accept
❌ **Direct code contributions** - Development is private  
❌ **Pull requests** - Use issues for suggestions instead  

## Issue Labels

| Label | Description |
|-------|-------------|
| `bug` | Something isn't working |
| `enhancement` | New feature or request |
| `question` | Further information is requested |
| `documentation` | Improvements or additions to docs |
| `needs-triage` | Needs initial review |
| `priority-high` | Important issue |
| `priority-low` | Nice to have |

## Response Times

We aim to:
- **Acknowledge** new issues within 48 hours
- **Triage** bugs within 1 week
- **Respond** to questions within 3 days
- **Consider** feature requests based on priority and complexity

## Code of Conduct

This project follows a simple code of conduct:

### Our Standards
- **Be respectful** and inclusive
- **Be helpful** and constructive
- **Stay on topic** and relevant
- **Provide context** when reporting issues

### Unacceptable Behavior
- Harassment or discrimination
- Spam or off-topic content
- Sharing sensitive information
- Demanding immediate responses

## Getting Started

### Installation
```bash
npm install -g @prism.enterprises/agentic-memory-server
```

### Basic Setup
```json
{
  "mcp": {
    "servers": {
      "contextual-memory": {
        "command": "npx",
        "args": ["@prism.enterprises/agentic-memory-server"],
        "env": {
          "MEMORY_PATH": "/path/to/your/project"
        }
      }
    }
  }
}
```

### Documentation
- [Main README](README.md) - Complete setup guide
- [Configuration Examples](examples/README.md) - IDE-specific setups

## Package Information

- **NPM Package**: [@prism.enterprises/agentic-memory-server](https://www.npmjs.com/package/@prism.enterprises/agentic-memory-server)
- **License**: MIT
- **Node.js**: Requires Node.js 18+ (recommended: 20+)

## Contact

- **Issues & Questions**: Use this repository's issue tracker
- **Package Issues**: Report via [NPM](https://www.npmjs.com/package/@prism.enterprises/agentic-memory-server)

Thank you for helping make the Agentic Memory Server better! 🚀
