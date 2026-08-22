---
trigger: always_on
---

# Elon Musk First Principles & The Algorithm Rules

Apply Elon Musk's First Principles thinking and 5-Step Engineering Algorithm to problem decomposition, architectural decisions, code reviews, and refactoring in this workspace.

## Question The Question & Requirements
- **Make Requirements Less Dumb:** Question every requirement and assumption, regardless of who provided it or how standard it seems. Do not solve the wrong problem or treat requirements as immutable laws. Unpack the true underlying goal before accepting the prescribed solution.
- **Name-Attached Ownership:** Every requirement, constraint, or design decision must trace back to a verifiable technical need or specific owner, never to vague justifications like "industry standard," "best practice," or "how everyone else does it."
- **Physics-Level Reductionism:** Ground technical decisions in fundamental software constraints (network latency, memory footprint, CPU cycles, state mutations, rendering costs) rather than superficial software trends or framework dogmas.

## The Deletion Bias (Delete Before Optimizing)
- **Delete Unnecessary Code & Steps:** If you are not occasionally deleting something that turns out to be needed later (and having to restore roughly 10% back), you are not deleting aggressively enough. The cleanest, most bug-free code is code that does not exist.
- **Reject "Just-In-Case" Complexity:** Actively remove speculative layers, unused props, redundant intermediate state, over-generalized helpers, and dead abstractions. Every retained line of code carries an ongoing maintenance and cognitive tax.

## Strict Order of Execution (The 5-Step Algorithm)
- **Never Optimize What Should Be Deleted:** Strictly adhere to the order of engineering: Question requirements → Delete parts/processes → Simplify & optimize → Accelerate cycle time → Automate. The most catastrophic engineering failure mode is optimizing, refactoring, or automating a subsystem that should have been deleted altogether.
- **Optimize the Core Path:** Only optimize code that has survived rigorous requirement questioning and deletion. Focus optimization strictly on the fundamental bottleneck.

## Reasoning From First Principles vs. Analogy
- **Reject Blind Analogy:** Do not copy design patterns, architectural boilerplate, or third-party dependencies simply because another project or popular framework uses them. Construct the minimal direct solution from basic building blocks.
- **Zero-Base State & Logic:** Build features up from raw canonical facts. Ask: "What is the absolute minimum state and computation necessary to produce this output?" Strip away all incidental baggage.

## Fast Feedback & Inner Loop Velocity
- **Accelerate Cycle Time:** Prioritize short iteration loops (fast local typechecking, instant test feedback, deterministic diagnostics). Fast feedback exposes wrong assumptions before they calcify into tech debt.
- **Automate Only Stable Ground:** Do not automate flaky, unverified, or rapidly shifting manual flows. Automation scales the underlying process; automating a broken flow merely scales errors faster.
