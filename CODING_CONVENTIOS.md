# Coding Conventions
**Draft v1**

---

## 1. Purpose & Scope

This document defines a shared set of coding conventions intended to improve readability, consistency, maintainability, and collaboration across the codebase.

Its goals are to:
- Reduce ambiguity and subjective debates
- Speed up onboarding
- Ensure the codebase can scale safely over time

This document differentiates between:
- **Mandatory rules** (must be followed)
- **Recommended guidelines** (should be followed unless there is a strong reason not to)

---

## 2. Guiding Principles (Non-Negotiables)

All coding decisions are guided by the following principles:

- **Readability over cleverness**
- **Explicit is better than implicit**
- **Consistency beats personal preference**
- **Design for change, not for today**

When an individual rule conflicts with a guiding principle, **the principle takes precedence**.

---

## 3. Naming Conventions

Naming is one of the highest-impact aspects of code quality. Names must prioritize clarity, intent, and long-term readability.

### 3.1 General Rules

- Names must communicate **intent**, not mechanics
- Prefer **clarity over brevity**
- Avoid abbreviations unless they are domain-standard
- A name should answer: *“What is this responsible for?”*

> If a name requires a comment to be understood, the name is wrong.

---

### 3.2 Variables

#### Rules
- Use concrete, descriptive nouns
- Avoid generic placeholders

❌ **Avoid**
```ts
data
item
value
result
```

✅ **Prefer**
```ts
userProfile
invoiceTotal
retryCount
expirationData
```

#### Booleans
- Booleans must read naturally as true/false statements
- Use affirmative prefixes: `is`, `has`, `can`, `should`
- Avoid negated booleans
  
❌ **Avoid**
```ts
authenticated
pending
reetryEnabled
isNotValid
```
> Negated booleans increase cognitive load and make conditional logic harder to reason about.

✅ **Prefer**
```ts
isAuthenticated
hasPendingInvoices
canRetry
shouldRefreshCache
```

---

### 3.3 Functions

Function and method names must clearly express **what they do and whether they cause side effects**.

#### Commands vs Queries
- Queries
  - Return data
  - Do not cause side effects
  - Should be referentially transparent
- Commands
  - Cause side effects (mutations, I/O, persistance)
    - May retun `void` or status/result

❌ **Avoid**
```ts
handleUser()
processData()
doStuff()
runLogic()
```

✅ **Prefer**
```ts
getUserById()
calculateTotal()
findActiveSessions()
```
```ts
saveInvoice()
sendEmail()
archiveRecord()
```

#### Side Effects

If a function mutates state, performs I/O, or persists data, the name must make that clear.

❌ **Avoid**
```ts
updateUser()
```

✅ **Prefer**
```ts
persistUserChanges()
applyUserUpdates()
```

> Ambiguous verbs such as `handle`, `process`, or `manage` should be avoided.

---

### 3.4 Classes

Classes and types represent concepts, not actions.

#### Rules
- Use **nouns**
- A class should have a single, clear responsibility
- Avoid vague or generic suffixes unlesss architecturally meaningful

❌ **Avoid**
```ts
UserManager
InvoiceHelper
DataProcessor
```

✅ **Prefer**
```ts
UserRepository
InvoiceCalculator
PaymentValidator
```

> If a class cannot be named without using “Manager”, its responsibility is likely unclear or too broad.

---

### 3.5 Collections

#### Rules
- Use **plural nouns** for collections
- Use **singular nouns** for single entities
- Do not encode data structures into names

❌ **Avoid**
```ts
userList
invoiceArray
sessionMap
```

✅ **Prefer**
```ts
users
invoices
activeSessions
```

> The underlying data structure should be an implementation detail unless it is relevant to the domain.

---

### 3.6 Context Matters

Short or generic names are acceptable only in very small, obvious scopes.

❌ **Avoid**
```ts
const d = fetchData()
const x = calculate()
```

✅ **Prefer**
```ts
for (const i of items) {
  ...
}
```
```ts
for (const user of users) {
  ...
}
```

> The broader the scope, the more explicit the name must be.

---

### 3.7 Consistency Over Perfection

When multiple valid naming options exist, consistency with the existing codebase is more important than theoretical correctness.

Introduce new naming patterns only when they provide a clear improvement and can be applied consistently.

---

## 4. File & Folder Organization

The structure of files and folders defines how developers **navigate, understand, and change** the system.  
Good organization minimizes cognitive load, reduces accidental coupling, and makes ownership clear.

Folder structure is not cosmetic — it is a core architectural decision.

---

### 4.1 General Principles
- Optimize for **discoverability**, not theoretical purity
- Prefer **consistency** over local optimization
- Structure should reflect **how the system is understood**, not how the framework enforces it
- A developer should be able to locate relevant code **without searching**

> If you need documentation to explain the folder structure, the structure has failed.

---

### 4.2 Feature-Based vs Layer-Based Organization

#### Preferred: Feature-Based Organization

When possible, group files by **feature or domain concept**, not by technical role. Avoid **pure layer-based organization**

❌ **Avoid**
```txt
controllers/
services/
repositories/
validators/
```

Layer-based structures often:
- Scatter related logic
- Increase coupling
- Make refactoring harder

Layer-based organization may be acceptable at very small scale or for infrastructure-only code, but should not be the default.

✅ **Prefer**
```txt
users/
    UserController.ts
    UserService.ts
    UserRepository.ts
    user.routes.ts
    user.validation.ts
```

> This keeps all related logic close together and reduces cross-folder navigation.

---

### 4.3 File Responsability

Each file should have **one clear responsibility**.

#### Rules
- A file should answer one primary question
- Avoid “catch-all” files that grow indefinitely
- Large files are a signal that responsibilities are mixed

❌ **Avoid**
```ts
userUtils.ts
helpers.ts
common.ts
```

✅ **Prefer**
```ts
userEmailFormatter.ts
passwordPolicy.ts
invoiceTotals.ts
```

> If a file name ends with “utils” or “helpers”, its responsibility is unclear.

---

### 4.4 Co-location Rules

Related files should be co-located when they change together.

#### Rules
- Test
- Validation schemas
- Feature-specific types
- Feature-specific configuration

**Example**
```txt
orders/
  OrderService.ts
  OrderRepository.ts
  OrderValidator.ts
  OrderService.test.ts
```

> Avoid separating files solely based on file type if they belong to the same feature.

---

### 4.5 Index files

Index files (`index.ts`) are allowed only when they improve clarity.

❌ **Avoid**
- Hiding complex logic
- Large re-export lists
- Using index filex to mask poor structure

> Index files should simplify imports, not obscure structure

✅ **Prefer**
```ts
// orders/index.ts
export { OrderService } from "./OrderService";
export { OrderRepository } from "./OrderRepository";
```

---

### 4.6 Naming of Files and Folders

#### Rules
- File and folder names must be **descriptive and predictable**
- Use consistent casing per languaje / ecosystem
- Avoid abbreviations unless domain-standard

❌ **Avoid**
```txt
proc/
auth2/
calc.ts
```

> File names should reflect what the file contains, not how it is implemented.

✅ **Prefer**
```txt
payment-processing/
user-authentication/
invoice-calculation.ts
```

---

### 4.7 Folder Path

#### Rules
- Prefer **shallow hierarchies**
- Avoid nesting deeper than necessary
- Deep nesting often signals missing abstractions

❌ **Avoid**
```txt
features/
  user/
    domain/
      services/
        impl/
```

✅ **Prefer**
```txt
users/
  UserService.ts
  UserRepository.ts
```

> If navigating to a file requires more than ~3 directory levels, reconsider the structure.

---

### 4.8 Cross-Feature Dependencies

#### Rules
- Features should not depend on each other implicitly
- Shared logic must live in explicitly named shared modules

❌ **Avoid**
```ts
import { calculateDiscount } from "../orders/OrderService";
```

✅ **Prefer**
```txt
pricing/
  DiscountCalculator.ts
```

```ts
import { DiscountCalculator } from "@/pricing/DiscountCalculator";
```

> Shared code should be intentionally shared, not accidentally reused.

---

### 4.9 Tests and Test Placement

#### Rules
- Tests should be easy to find
- Prefer co-locating tests with the code they verify
- Test folder structure should mirror source structure

**Example**
```txt
users/
  UserService.ts
  UserService.test.ts
```

> Avoid central test folders that require navigating away from the feature context.

---

### 4.10 Refactoring Signals

#### Rules
Revisit folder structure when:
- Files grow without clear boundaries
- Navigation becomes confusing
- Changes require touching many unrelated folders

> Folder structure is expected to **evolve** with the system 

---

### 4.11 Consistency Over Novelty

#### Rules
Once a structure is established:
- Follow existing patterns
- Avoid introducing new structures without strong justification
- Structural consistency matters more than theoretical elegance

---

## 5. Formatting & Style

Formatting and style rules exist to make code **easy to read, scan, and reason about**.  
They are not about personal taste, but about reducing cognitive load and ensuring consistency across the codebase.

Most formatting rules should be **automated and enforced by tooling**, not debated in code reviews.

---

### 5.1 General Principles

#### Rules
- Code should be readable without horizontal scrolling
- Visual structure should reflect logical structure
- Consistency is more important than individual preferences
- Formatting decisions should minimize noise in code reviews

> If a formatting rule is discussed frequently in reviews, it should be automated.

---

### 5.2 Indentation & Line Length

#### Rules
- Use consistent indentation across the codebase
- Do not mix indentation styles
- Keep lines reasonably short to improve readability

**Guidelines**
- Prefer line breaks over long, dense expressions
- Break lines at logical boundaries
- Align continuation lines for clarity when appropriate

❌ **Avoid**
```ts
const total = items.map(i => i.price * i.quantity).filter(v => v > 0).reduce((a, b) => a + b, 0);
```

✅ **Prefer**
```ts
const total = items
  .map(item => item.price * item.quantity)
  .filter(value => value > 0)
  .reduce((sum, value) => sum + value, 0);
```

---

### 5.3 Whitespace & Visual Grouping

Whitespace is a primary tool for expressing structure.

#### Rules
- Use blank lines to separate logical sections
- Group related statements together
- Avoid dense blocks of code without visual separation

❌ **Avoid**
```ts
validate(input);
normalize(input);
save(input);
sendNotification(input);
```

✅ **Prefer**
```ts
validate(input);
normalize(input);

save(input);

sendNotification(input);
```

> Blank lines signal conceptual boundaries and improve scanability.

---

### 5.4 Braces, Blocks, and Control Flow

#### Rules
- Always use braces for control flow blocks
- Avoid single-line conditionals without braces
- Nested blocks should remain shallow and readable

❌ **Avoid**
```ts
if (isValid) save(data);
```

✅ **Prefer**
```ts
if (isValid) {
  save(data);
}
```

> Explicit blocks reduce the risk of errors during refactoring.

---

### 5.5 Comments

Comments are a tool of last resort.
Well-written code should explain what it does through structure and naming.

#### When Comments Are Appropriate
- Explaining why a decision was made
- Clarifying non-obvious business rules
- Documenting constrains or trade-offs

#### When Comments Are a Smell
- Restating what the code already says
- Explaining poor naming or structure

❌ **Avoid**
```ts
// Increment i by one
i++;
```

✅ **Prefer**
```ts
// We intentionally retry only once to avoid duplicate charges
retryPayment();
```