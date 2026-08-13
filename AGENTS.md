# AGENTS.md

## Project Overview

This repository is a brand-new production-oriented application built with:

* Node.js
* TypeScript
* GraphQL
* GraphQL API server
* Strong typing throughout the application
* Automated testing
* Environment-based configuration

The repository also contains a `plan.md`.

**`plan.md` is the source of truth for application requirements and functionality.**

Agents must implement `plan.md` completely while following the engineering standards defined in this file.

---

# 1. Core Engineering Principles

Follow these principles for every change:

1. Prefer simple, maintainable solutions.
2. Use strong typing instead of runtime assumptions.
3. Prefer explicit behavior over implicit magic.
4. Keep modules small and focused.
5. Separate business logic from transport/API concerns.
6. Keep GraphQL resolvers thin.
7. Never put substantial business logic directly inside resolvers.
8. Validate external input at system boundaries.
9. Fail fast on invalid configuration.
10. Never silently swallow errors.
11. Avoid unnecessary dependencies.
12. Avoid premature abstractions.
13. Do not implement functionality that is not required by `plan.md`.
14. Do not leave TODOs or placeholder implementations unless explicitly required.
15. Do not declare work complete until it has been tested and verified.

---

# 2. Technology Standards

Use the project's configured versions of:

* Node.js
* TypeScript
* GraphQL

Do not upgrade major versions unless explicitly required.

Use the package manager and lockfile already configured by the repository.

If the project is new and no package manager has been established, choose one and use it consistently throughout the repository.

Do not mix package managers.

---

# 3. TypeScript

TypeScript must be used throughout application code.

## Required

Use strict TypeScript configuration.

The project should enable, where practical:

```text
strict
noImplicitAny
strictNullChecks
noUncheckedIndexedAccess
noImplicitReturns
noFallthroughCasesInSwitch
```

Avoid:

```typescript
any
```

Use `unknown` when the type is genuinely unknown and narrow it safely.

Do not use type assertions merely to silence compiler errors.

Avoid:

```typescript
const value = something as SomeType;
```

unless the assertion is justified and safe.

Prefer type guards, validation, schemas, or proper typing.

## Nullability

Handle `null` and `undefined` explicitly.

Do not use non-null assertions:

```typescript
foo!.bar
```

unless there is a documented and provably safe reason.

## Types

Prefer:

* `type` for unions/compositions.
* `interface` where extension/implementation semantics are useful.
* discriminated unions for state/result modeling.
* readonly types where mutation is not intended.

Keep domain types separate from transport-specific types when appropriate.

---

# 4. Node.js

Use modern Node.js APIs and async/await.

Prefer:

```typescript
async function doSomething(): Promise<Result> {
  ...
}
```

over callback-based APIs.

Handle promises explicitly.

Never create unhandled promises.

Avoid unnecessary synchronous filesystem operations in request paths.

Use structured logging rather than `console.log` for application logging.

Never log:

* Passwords
* Authentication tokens
* API keys
* Session tokens
* Sensitive user data
* Database credentials

---

# 5. Project Architecture

Use a clear separation of concerns.

A recommended structure is:

```text
src/
  config/
  graphql/
    schema/
    resolvers/
    context/
    directives/
  modules/
    <domain>/
      domain/
      application/
      infrastructure/
      graphql/
  services/
  repositories/
  db/
  middleware/
  errors/
  logging/
  utils/
  server.ts
```

The exact structure may be adapted to the requirements in `plan.md`.

Do not create directories simply because they appear in this example.

Use the simplest structure that keeps responsibilities clear.

---

# 6. Domain / Business Logic

Business logic belongs outside GraphQL resolvers.

Bad:

```typescript
const resolvers = {
  Mutation: {
    createUser: async (_, args) => {
      // 100 lines of business logic
    }
  }
};
```

Prefer:

```typescript
const resolvers = {
  Mutation: {
    createUser: (_, args, context) =>
      context.userService.createUser(args.input)
  }
};
```

Services/use-cases should contain application behavior.

Repositories should handle persistence.

Resolvers should primarily:

1. Receive GraphQL input.
2. Authenticate/authorize where appropriate.
3. Call application services.
4. Map the result to GraphQL output.

---

# 7. GraphQL Schema

GraphQL schema design must be intentional.

Prefer:

* Clear domain-oriented types.
* Explicit input types.
* Explicit output types.
* Pagination for potentially large collections.
* Meaningful field names.
* Strong nullability.
* Descriptive schema documentation.

Avoid unnecessary nullable fields.

Do not make every field nullable simply because it is easier.

Use:

```graphql
type User {
  id: ID!
  email: String!
  name: String!
}
```

rather than unnecessarily weak schemas such as:

```graphql
type User {
  id: ID
  email: String
  name: String
}
```

---

# 8. GraphQL Inputs

Never trust GraphQL input simply because GraphQL provides schema validation.

Validate business constraints separately.

Examples:

* Email format
* String length
* Numeric ranges
* Date ranges
* Allowed state transitions
* Authorization rules
* Cross-field validation

Validation belongs at appropriate application boundaries.

GraphQL schema validation and business validation are separate concerns.

---

# 9. GraphQL Resolvers

Resolvers must remain thin.

Resolvers should not:

* Contain complex business logic.
* Directly manipulate database tables unless the project explicitly requires it.
* Duplicate authorization logic.
* Duplicate validation logic.
* Perform unnecessary network calls.
* Contain large try/catch blocks.

Prefer services/use cases.

Resolvers should be easy to read and test.

---

# 10. GraphQL Context

Use a typed GraphQL context.

Example:

```typescript
export interface GraphQLContext {
  requestId: string;
  user: AuthenticatedUser | null;
  services: Services;
}
```

Do not use:

```typescript
context: any
```

Context should contain only dependencies and request-scoped information actually needed by resolvers.

Do not put arbitrary global state into GraphQL context.

---

# 11. Authentication and Authorization

Authentication and authorization are different concerns.

Authentication determines:

> Who is the caller?

Authorization determines:

> Is this caller allowed to perform this operation?

Never assume that authentication implies authorization.

Authorization must be enforced server-side.

Never rely on frontend checks for security.

Resolvers/services must verify permissions for protected operations.

Avoid duplicating authorization rules throughout the codebase.

Centralize reusable authorization logic where practical.

---

# 12. GraphQL Errors

Never expose internal implementation details to clients.

Do not return:

* Stack traces
* Database connection strings
* SQL statements
* Internal filesystem paths
* Secrets
* Internal service details

Use appropriate GraphQL error handling.

Errors should provide useful client-facing information while preserving internal diagnostic information in server logs.

Use typed/custom application errors where appropriate.

---

# 13. Error Handling

Never silently swallow errors.

Bad:

```typescript
try {
  await doSomething();
} catch {
}
```

Also avoid:

```typescript
catch (error) {
  return null;
}
```

unless `null` is explicitly the correct business behavior.

Errors should either:

* Be handled intentionally.
* Be transformed into an appropriate domain/application error.
* Be logged and propagated.

Do not use exceptions as normal control flow when a typed result is clearer.

---

# 14. Database Access

If a database is introduced by `plan.md`:

* Keep database access behind repositories/data-access modules.
* Do not spread raw database queries throughout resolvers.
* Use migrations.
* Make migrations deterministic.
* Do not modify production schema manually.
* Use transactions for operations that require atomicity.
* Consider indexes for frequently queried fields.
* Avoid N+1 queries.

Database models should not automatically become GraphQL types.

Keep persistence concerns separate from API concerns.

---

# 15. GraphQL N+1 Prevention

When resolving relationships or lists, consider N+1 query behavior.

Use DataLoader or an equivalent batching/caching mechanism where appropriate.

Bad:

```text
Query users
  → query orders for user 1
  → query orders for user 2
  → query orders for user 3
  → ...
```

Prefer batching:

```text
Query users
  → batch query orders for all users
```

Do not introduce DataLoader everywhere automatically.

Use it where resolver access patterns justify it.

---

# 16. Pagination

For potentially large collections, use pagination.

Prefer cursor-based pagination for APIs where stable pagination is important.

A typical structure:

```graphql
type UserConnection {
  edges: [UserEdge!]!
  pageInfo: PageInfo!
}

type UserEdge {
  node: User!
  cursor: String!
}

type PageInfo {
  hasNextPage: Boolean!
  hasPreviousPage: Boolean!
  startCursor: String
  endCursor: String
}
```

Do not expose unbounded list queries for potentially large datasets.

---

# 17. Query Complexity and Abuse Protection

Consider protection against expensive GraphQL queries.

Where appropriate, implement:

* Query depth limits.
* Query complexity limits.
* Request timeouts.
* Pagination limits.
* Rate limiting.
* Maximum request size.
* Introspection restrictions appropriate to the deployment environment.

Do not introduce these mechanisms unless appropriate to the requirements and architecture.

Never allow an API client to request unlimited amounts of data by default.

---

# 18. Environment Configuration

All configuration must come from environment/configuration rather than hard-coded values.

Examples:

```text
DATABASE_URL
PORT
NODE_ENV
GRAPHQL_ENDPOINT
AUTH_SECRET
LOG_LEVEL
```

Never commit real secrets.

Provide:

```text
.env.example
```

with safe placeholder values.

Validate required environment variables at startup.

The application should fail fast with a clear error if required configuration is missing or invalid.

---

# 19. Logging

Use structured logging.

Logs should contain useful context such as:

* Timestamp
* Log level
* Request ID
* Operation name
* Relevant entity ID where safe
* Error information

Do not log sensitive information.

Avoid excessive logging in hot paths.

Use appropriate log levels:

* `debug`
* `info`
* `warn`
* `error`

---

# 20. Testing

Every significant feature implemented from `plan.md` must have appropriate tests.

Use a testing pyramid:

```text
        E2E
       /   \
 Integration
    /       \
    Unit Tests
```

## Unit tests

Test:

* Business logic.
* Services/use cases.
* Validation.
* Utility functions.
* Domain behavior.

## Integration tests

Test:

* GraphQL operations.
* Database interaction.
* Repository behavior.
* Authentication/authorization.
* Service integration.

## End-to-end tests

Test important real user workflows.

Do not rely exclusively on mocked tests.

---

# 21. GraphQL Testing

Test actual GraphQL operations.

For example:

```graphql
query GetUser($id: ID!) {
  user(id: $id) {
    id
    email
    name
  }
}
```

Verify:

* Successful responses.
* Validation failures.
* Authentication failures.
* Authorization failures.
* Not-found behavior.
* Expected GraphQL errors.
* Nested resolver behavior.
* Pagination.
* Important mutations.

Tests should validate behavior rather than implementation details.

---

# 22. Code Quality

Before considering a change complete:

* Format code.
* Run lint.
* Run TypeScript compilation/type checking.
* Run tests.
* Build the project.

Do not leave:

* Debug statements.
* Temporary files.
* Commented-out code.
* Unused imports.
* Unused variables.
* Dead code.
* Placeholder implementations.
* Unnecessary TODOs.

---

# 23. API Compatibility

GraphQL schema changes must be considered API changes.

Before changing a field:

* Check existing queries/mutations.
* Check tests.
* Check frontend/client usage.
* Check whether the change is breaking.

Prefer additive changes when possible.

Do not remove or rename public GraphQL fields without explicit authorization from `plan.md`.

---

# 24. Security

Treat all external input as untrusted.

Protect against:

* Injection attacks.
* Unauthorized access.
* Broken access control.
* Excessive query execution.
* Information disclosure.
* Credential leakage.
* Unsafe file operations.
* Insecure configuration.

Never commit secrets.

Never disable security controls simply to make development easier.

---

# 25. Git Hygiene

Make focused changes.

Do not modify unrelated files.

Do not commit:

```text
.env
node_modules/
dist/
build/
coverage/
logs/
```

unless the repository explicitly requires them.

Do not rewrite Git history.

Do not delete existing work unless required.

---

# 26. Implementation Workflow

When implementing `plan.md`, follow this workflow:

```text
Read plan.md
     ↓
Inspect repository
     ↓
Understand architecture
     ↓
Implement one logical feature
     ↓
Format
     ↓
Lint
     ↓
Type-check
     ↓
Unit tests
     ↓
Integration tests
     ↓
Build
     ↓
Fix failures
     ↓
Continue to next feature
     ↓
Complete plan.md
     ↓
Full test suite
     ↓
Full build
     ↓
Start application
     ↓
Run critical workflows
     ↓
Final plan.md audit
     ↓
Final report
```

---

# 27. Definition of Done

A task is complete only when:

* The requirement exists in the implementation.
* The implementation follows the architecture.
* TypeScript has no type errors.
* Lint passes.
* Tests pass.
* The application builds.
* The application starts.
* GraphQL operations work.
* Important integrations work.
* No known runtime errors remain.
* No secrets are exposed.
* Existing functionality has not been unintentionally broken.
* The corresponding requirement in `plan.md` has been verified.

A green build alone does NOT mean the task is complete.

---

# 28. Instructions for AI Coding Agents

When `plan.md` exists:

**READ IT FIRST.**

Treat it as the authoritative implementation specification.

Do not:

* Rewrite the plan.
* Create a competing architecture without justification.
* Skip requirements.
* Stop after implementing only the easy portions.
* Declare success based only on compilation.
* Ask for confirmation between normal implementation steps.
* Leave known errors unresolved.

Instead:

* Inspect.
* Implement.
* Test.
* Debug.
* Verify.
* Continue.
* Audit.
* Report.

When uncertain, prefer the simplest solution consistent with the existing architecture and `plan.md`.

---

# 29. Final Verification Requirement

Before declaring the project complete, re-read `plan.md` from beginning to end.

For every requirement, identify:

```text
Requirement
→ Implementation
→ Test
→ Verification
```

If any requirement does not have a corresponding implementation and verification, the work is not complete.

Only declare completion after the full audit.

---

# 30. Final Response

When finished, provide:

## Summary

What was implemented.

## Verification

Actual commands executed and their results.

Example:

```text
npm install       PASS
npm run lint      PASS
npm run typecheck PASS
npm test          PASS
npm run build     PASS
npm run e2e       PASS
```

Never fabricate results.

## Applications Verified

For each application:

```text
Application:
Build: PASS
Tests: PASS
Startup: PASS
Health check: PASS
Critical workflow: PASS
```

## Remaining Issues

List anything that could not be verified or remains unresolved.

If everything is verified:

```text
IMPLEMENTATION COMPLETE — ALL AVAILABLE VERIFICATION PASSED.
```

Otherwise, clearly identify what remains unresolved.
