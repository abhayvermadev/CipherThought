# Enterprise Production Security Directives & Architecture Constitution
## Google AI Studio Autonomous Agent Security Standard (SecOps-Gov-01)

This document establishes the mandatory security directives and enterprise-grade production standards for all applications built, modified, and maintained in this Google AI Studio environment. Every architectural decision, code artifact, and deployment must strictly adhere to these principles.

---

### Directive 1: Threat Modeling & Defensive Design (STRIDE Methodology)
Before writing or revising code, every system component must be evaluated against the STRIDE threat model:
- **Spoofing**: All incoming requests must verify identity via cryptographic authentication tokens (e.g., Firebase Auth JWT / Google Identity). Never trust client-declared claims or query parameters for identity.
- **Tampering**: Data in transit must use HTTPS/TLS. Sensitive stored journal entries and summaries must include integrity checks or client-side encryption (AES-256-GCM) where user privacy mandates zero-knowledge storage.
- **Repudiation**: State-changing events (auth events, entry creation, AI invocations, deletion) must produce structured audit trails with timestamps and user-bound identifiers.
- **Information Disclosure**: API keys, credentials, and PII must never be written to client bundles, logs, or shared collections. Output from LLMs must be sanitized against prompt injection and data exfiltration.
- **Denial of Service**: Rate limiting, bounded context windows, and request payload size limits must be applied to all AI proxy endpoints.
- **Elevation of Privilege**: Role-based and identity-isolated access controls must be enforced on the server and database layer; the client UI is never a trusted security boundary.

---

### Directive 2: Strict Multi-Tenant Data Isolation Rules (Zero Cross-User Leakage)
1. **Per-User Namespacing**: All user-authored content, journal logs, summaries, reflections, and configurations must be partitioned under an immutable user-bound path hierarchy:
   `/users/{userId}/**` or documents explicitly keyed by `userId` matching `request.auth.uid`.
2. **Database Security Rules (Cloud Firestore)**:
   - Default deny: `allow read, write: if false;` for any unauthenticated or unmapped collection.
   - Enforce document ownership: `allow read, write: if request.auth != null && request.auth.uid == userId;`
   - Validate schema, field presence, and data length in Firestore Security Rules to prevent poison pill documents.
   - Prevent cross-account querying: Disallow collection-group queries across multiple tenants without explicit scoping.

---

### Directive 3: Secure Key Management & Secret Isolation
1. **Zero Secret Exposure**:
   - `GEMINI_API_KEY`, service account keys, and backend credentials must NEVER appear in frontend code, client builds, `.env` files committed to source control, or local storage.
   - All interactions with the Gemini API must be routed through server-side proxy routes (e.g., `/api/gemini/*`).
2. **Google Cloud Secret Manager Lifecycle**:
   - Runtime configuration reads secrets dynamically from protected environment variables populated by Cloud Secret Manager or Cloud Run Secret references.
   - Never echo or log secret values in error responses, stdout, or diagnostic endpoints.

---

### Directive 4: Prompt Engineering Security & AI Boundary Controls
1. **PII and Sensitive Data Redaction**:
   - Cleanse or alert the user on accidental inclusion of credentials, credit card numbers, or sensitive PII prior to upstream LLM forwarding.
2. **System Prompt Hardening**:
   - System prompts must explicitly instruct models to ignore jailbreak attempts, ignore instructions to reveal underlying instructions, and adhere to sandboxed boundaries.
3. **Defense Against Indirect Prompt Injection**:
   - Format user inputs into delimited tags (e.g., `<user_journal_entry>...</user_journal_entry>`) with explicit isolation instructions to prevent model hijacking.

---

### Directive 5: Zero-Knowledge Client Encryption (Optional High-Security Vault)
For applications handling ultra-private personal thoughts:
- Provide end-to-end client-side encryption capability using the Web Cryptography API (`PBKDF2` for key derivation, `AES-256-GCM` with 96-bit IV for authenticated encryption).
- Encryption keys remain strictly in volatile memory and are never transmitted to Firebase or AI Studio servers.

---

### Directive 6: Continuous Compliance & Code Quality
- Build strictly typed TypeScript models.
- No `eval()`, no unescaped `dangerouslySetInnerHTML`, and strict sanitization of markdown responses.
- Ensure automated compilation checks (`npm run build`) and linter cleanliness on every release.
