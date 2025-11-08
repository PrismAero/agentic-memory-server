# Security Policy

## Supported Versions

We release patches for security vulnerabilities for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 4.x.x   | ✅ Yes             |
| 3.x.x   | ⚠️ Critical only   |
| < 3.0   | ❌ No              |

## Reporting a Vulnerability

The Agentic Memory Server team takes security bugs seriously. We appreciate your efforts to responsibly disclose your findings, and will make every effort to acknowledge your contributions.

### How to Report Security Issues

**Please do not report security vulnerabilities through public GitHub issues.**

Instead, please report them via one of the following methods:

1. **Email**: Send an email to `security@prismaero.com` with:
   - A description of the vulnerability
   - Steps to reproduce the issue
   - Possible impact
   - Any suggested fixes

2. **GitHub Security Advisories**: Use GitHub's private vulnerability reporting feature in this repository

### What to Include

When reporting security issues, please include:

- **Type of issue** (e.g. buffer overflow, SQL injection, cross-site scripting, etc.)
- **Full paths of source file(s)** related to the manifestation of the issue
- **The location of the affected source code** (tag/branch/commit or direct URL)
- **Any special configuration** required to reproduce the issue
- **Step-by-step instructions** to reproduce the issue
- **Proof-of-concept or exploit code** (if possible)
- **Impact of the issue**, including how an attacker might exploit the issue

### Response Timeline

- **Initial Response**: Within 48 hours
- **Status Update**: Within 7 days with next steps
- **Resolution**: Depends on complexity, typically within 30 days

### Security Considerations for Users

The Agentic Memory Server is designed with security in mind:

#### ✅ **What We Secure**
- **Local-only operation** - No data transmission to external servers
- **File system isolation** - Data stored only in designated project directories
- **Input validation** - All user inputs are validated and sanitized
- **SQLite security** - Database operations use parameterized queries

#### ⚠️ **Your Responsibilities**
- **File permissions** - Ensure appropriate permissions on your `MEMORY_PATH`
- **Access control** - Limit access to the memory database files
- **Network security** - If running in networked environments, secure your connections
- **Updates** - Keep the package updated to the latest version

#### 🚨 **Potential Risks**
- **File system access** - The server can read/write files in the configured memory path
- **Local data exposure** - Memory data is stored in plain text SQLite databases
- **Process permissions** - Server runs with the same permissions as the invoking process

### Best Practices

1. **Isolate memory paths** - Use project-specific directories
2. **Regular backups** - The `.memory/backups/` folder contains JSON backups
3. **Monitor file access** - Be aware of what data is being stored
4. **Network isolation** - Run in isolated environments when possible
5. **Version management** - Keep packages updated

### Security Features

- **No external dependencies** for core memory operations
- **Offline-first design** eliminates many attack vectors
- **Structured data validation** prevents injection attacks
- **Automatic backups** provide data recovery options
- **Audit logs** track all memory operations

For more information about security practices, please see our [Contributing Guidelines](CONTRIBUTING.md).

## Vulnerability Disclosure Policy

We believe that coordinated vulnerability disclosure is in the best interest of both our users and the broader community. When we receive a security bug report, we will:

1. Confirm the problem and determine affected versions
2. Audit code to find any similar problems
3. Prepare fixes for all supported releases
4. Release patched versions as quickly as possible
5. Provide credit to the reporter (if desired)

Thank you for helping keep the Agentic Memory Server and its users safe!
