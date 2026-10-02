# EcoPulse 360 — AI-Powered Smart Building Operating System
**Schneider Electric Yuva Yodha Tech Hackathon 2026**
*Challenge 02: Smart Buildings — Energy Efficiency & Occupant Experience*

EcoPulse 360 is an autonomous building energy management prototype. It transforms raw sensor telemetry into actionable intelligence, providing predictive load forecasting, ASHRAE 55 thermal comfort tracking, and automated Demand Response shifting.

## 🚀 One-Click Deploy to Vercel

You can instantly deploy this project to Vercel. The deployment is already pre-configured for the `frontend` directory. 

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Favinash805224%2Fyuva&root-directory=frontend&env=VITE_SUPABASE_URL,VITE_SUPABASE_ANON_KEY&project-name=ecopulse-360&framework=vite)

### Deployment Steps:
1. Click the **Deploy** button above.
2. Vercel will ask you to connect your GitHub account.
3. In the **Environment Variables** section during setup, you must provide your Supabase credentials:
   - `VITE_SUPABASE_URL` = Your Supabase Project URL
   - `VITE_SUPABASE_ANON_KEY` = Your Supabase Anon/Public Key
4. Click **Deploy**! Vercel will build and host your app automatically.

## 🛠️ Local Development

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables:
   Copy `.env.example` to `.env` and enter your Supabase keys.
4. Run the development server:
   ```bash
   npm run dev
   ```

## 🏗️ Architecture
- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend/DB**: Supabase (PostgreSQL + Realtime WebSockets)
- **Engine**: Client-side high-fidelity physics simulator for offline-first resilience.
