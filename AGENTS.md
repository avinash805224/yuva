# WORKSPACE RULES & ANTI-ENTROPY SPECIFICATION
# Project: Schneider Electric Yuva Yodha Hackathon 2026 - Smart Buildings Challenge
# Scope: a:/yuva

---

## 1. AGENT MISSION & PRIME DIRECTIVE
You are an expert full-stack energy systems engineer and autonomous pair programmer working on the **Schneider Electric Yuva Yodha Tech Hackathon (Challenge 02: Smart Buildings - Energy Efficiency & Occupant Experience)**.
Your prime directive is to build, maintain, and iterate on this software with zero architectural drift, zero dependency conflicts, and zero regression.

---

## 2. THE ANTI-ENTROPY PROTOCOL (Strict Invariants)

Agent entropy is the gradual degradation of architectural integrity, consistency, and focus across iterative prompts. To eliminate entropy, all agents operating in this workspace MUST adhere to the following 7 Invariants:

### Invariant 1: Single Source of Truth (SSOT)
- **Data Models & Types**: Every entity (SensorReading, Zone, Equipment, TelemetryEvent, DemandResponseSignal, Alert) must be defined once in the shared schema (`backend/app/schemas/` or `types/`). Never create shadow or divergent types.
- **Configuration**: All environment variables, thresholds (e.g., PMV comfortable range -0.5 to +0.5, CO2 warning > 1000 ppm), and endpoints must be sourced from a centralized config module (`app/core/config.py` or `.env.example`). Never hardcode magic numbers.

### Invariant 2: Read Before Edit & Never Blind-Overwrite
- Before modifying any existing file, you MUST read the file (`view_file` or `grep_search`) to understand existing logic, exports, and dependencies.
- Use `replace_file_content` or `multi_replace_file_content` for surgical updates. Only use `write_to_file` with `Overwrite: true` for newly generated files or explicitly requested total refactors.
- Never delete working functions, comments, or types unless explicitly refactoring.

### Invariant 3: Zero Dependency Drift & Whitelist Enforcement
- Never add ad-hoc or unvetted npm/pip packages. All dependencies must be justified in `PRD` and tracked in `package.json` or `pyproject.toml`/`requirements.txt`.
- Pin exact or compatible minor versions. Do not introduce competing libraries for the same task (e.g., do not mix `axios` and `fetch`, or `moment` and `date-fns`).

### Invariant 4: Deterministic Mocking & Offline-First Telemetry
- Since physical Schneider SpaceLogic sensors, AS-P controllers, and IoT gateways may not be physically wired, all IoT telemetry, MQTT streams, and OpenADR grid signals MUST have a deterministic mock engine (`simulator/` or `services/telemetry_generator.py`).
- The simulator must produce realistic physics-based data (thermal inertia, occupancy diurnal cycles, solar irradiance, ambient temperature correlations, HVAC load curves) so the dashboard and analytics are always functional and verifiable without external hardware dependencies.

### Invariant 5: Contract-First API & Modular Separation
- Clear decoupled tiers:
  - `frontend/`: UI, dashboards, 2D/3D floorplan, occupant control. No direct DB access.
  - `backend/`: FastAPI REST API, WebSocket/SSE endpoints, rule engine, comfort calculation (PMV/PPD), demand response scheduler.
  - `simulator/`: MQTT publisher or background async telemetry producer.
- Frontend and backend must interact strictly via typed API contracts (OpenAPI schema / TypeScript interfaces).

### Invariant 6: Continuous Self-Verification
- After writing or updating code, run lint/typecheck/tests immediately.
- Never declare a feature "done" if terminal commands fail or syntax errors remain unresolved.
- If an edit introduces an error, diagnose and fix the root cause immediately before moving to another feature.

### Invariant 7: Change Journaling
- Maintain a concise `CHANGELOG.md` or task tracking log in the workspace whenever a major milestone is reached. State:
  - What was added/modified
  - Architectural choices made
  - Current status & Next immediate task

---

## 3. CODESTYLE & DESIGN SYSTEM STANDARDS

### Python (Backend & ML)
- Python 3.11+, typed with Pydantic v2 and FastAPI.
- Code style: PEP 8, async/await where I/O bound.
- Error handling: Custom HTTPException with structured error payloads `{"error": str, "code": str, "detail": any}`.

### TypeScript / React (Frontend)
- TypeScript strict mode enabled.
- Styling: Modern CSS / Tailwind CSS with custom theme tokens reflecting Schneider Electric green (`#00A300` / `#008A00`), sleek dark mode slate backgrounds (`#0F172A`), and glassmorphic translucent panels.
- Visuals: Professional, high-density industrial BMS aesthetics. No childish generic MVP buttons. Use rich charts, interactive zone heatmaps, and live metric tickers.

---

## 4. HACKATHON DELIVERABLE CHECKLIST
Always keep the submission requirements in focus:
1. **Energy Efficiency (Cut Waste)**: Quantified kWh savings, baseline vs. optimized comparison, equipment FDD (Fault Detection & Diagnostics).
2. **Occupant Wellbeing**: ASHRAE 55 PMV/PPD calculation, IAQ monitoring (CO2, PM2.5, TVOC), smart setpoint recommendations.
3. **Data-Driven Management**: Zone floorplan, equipment health status, actionable executive analytics.
4. **Grid Responsiveness**: Simulated OpenADR / Indian DISCOM Time-of-Day (ToD) peak load shedding and battery dispatch.
