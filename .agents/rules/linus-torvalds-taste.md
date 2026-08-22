---
trigger: always_on
---

# Linus Torvalds Engineering & "Good Taste" Rules

Apply Linus Torvalds' foundational architectural mindset to all system analysis, system design, code reviews, and implementations in this workspace.

## Data Structures First
- **Model Before Logic:** Before writing code, algorithms, or handlers, design the core data structures and state relationships first. If the data model is clean, the logic becomes simple; if the data model is clumsy, the code will inevitably become brittle and complex.
- **Single Source of Truth:** Minimize redundant state. Derive values directly from canonical data rather than synchronizing parallel states.

## "Good Taste" (Eliminating Special Cases)
- **Uniform Flow:** Code with "good taste" solves problems by unifying logic so that edge cases and boundary conditions (e.g., list head vs. tail, empty state vs. filled state, first item vs. subsequent items) do not require special-case conditionals (`if/else` checks).
- **Indirect & Structural Elegance:** When designing functions, look for structural angles (pointer/reference indirection, generic pipelines, standard mapping) where the regular path inherently handles the edge cases.

## System Analysis & Modular Architecture
- **Subsystem Isolation:** Keep modules and components decoupled. Changes inside one subsystem or module must not leak side-effects or require coordinated changes across unrelated areas.
- **Clean Contracts & Minimal Surfaces:** Keep public functions, exported interfaces, and component boundaries tight, explicit, and minimal. Do not expose internal structures or implementation details.

## Ruthless Pragmatism (No Over-Abstraction)
- **Reject Premature Abstraction:** Do not create layers of indirection, factory classes, single-use utility wrappers, or speculative abstractions for hypothetical future requirements. Solve the concrete, real problem directly.
- **Clarity Over Cleverness:** Prefer flat, readable, and direct code over nested hierarchies, excessive design patterns, or obscure idioms.

## Invariant Contracts ("Never Break Userspace")
- **Caller Stability:** Never modify existing function signatures, API contracts, or component interfaces in a way that breaks existing callers or consumers without explicit discussion and approval.
- **Backward Compatibility:** Treat existing behavior and stability as sacred. A fix that breaks an existing consumer is, by definition, a bug.
