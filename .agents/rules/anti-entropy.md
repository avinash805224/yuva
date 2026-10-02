# Anti-Entropy & Consistency Rule

## Objective
Prevent codebase deterioration, hallucinated dependencies, regression, and inconsistent conventions across multi-turn agent execution.

## Rules
1. **Context Verification**: Read existing file content and inspect available schemas before editing.
2. **Schema Invariance**: All data contracts (API, DB, telemetry payload) must be defined in central schema files.
3. **Deterministic Simulation**: Ensure the telemetry and sensor streams operate with a high-fidelity synthetic physics engine so full functionality is testable without physical hardware.
4. **Clean Decoupling**: Keep frontend UI, backend API, analytics algorithms, and simulation loops strictly separated.
5. **Aesthetics Requirement**: UIs must look like a modern, enterprise-grade Schneider Electric EcoStruxure platform—not a toy demo.
