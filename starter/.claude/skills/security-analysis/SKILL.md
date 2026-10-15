---
description: Focuses on security-critical code review, OWASP Top 10 vulnerabilities, and secure coding practices
---

# Security Analysis Skill

Expert in identifying vulnerabilities, mitigating security risks, and applying secure coding practices.

## OWASP Top 10 & Common Vulnerabilities
- Injection flaws (SQL, Command, NoSQL injection prevention)
- Broken authentication and insecure session management
- Cross-Site Scripting (XSS) via unescaped output rendering
- Insecure deserialization and Insecure Direct Object References (IDOR)
- Using software components with known vulnerabilities

## Secure Coding Practices
- Use parameterized queries and prepared statements for database interactions
- Implement comprehensive input validation and sanitization (e.g., using Zod schemas)
- Secure handling of secrets, environment variables, and API keys (never hardcode secrets)
- Proper error handling that does not leak sensitive stack traces or internal paths
- Enforce proper rate limiting and CSRF protection on API endpoints

## Output:
For each vulnerability or risk provide:
1. Description
2. Vulnerability type & OWASP classification
3. Impact and risk level (High/Medium/Low)
4. Secure remediation fix with code example