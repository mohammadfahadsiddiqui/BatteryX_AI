# BatteryX AI — Intelligent EV Battery Health Assessment & Second-Life Certification Platform

BatteryX AI is an AI-powered intelligence platform designed for EV manufacturers, service centers, fleet operators, and recyclers to assess battery State of Health (SOH), predict degradation and Remaining Useful Life (RUL), perform rule-based safety risk assessments, evaluate second-life suitability, and generate verifiable digital battery health certificates.

---

## 🌟 Key Features

- **State of Health (SOH) Estimation**: Multi-factor health estimation using capacity fade, internal resistance rise, cycle degradation, and calendar aging models.
- **Degradation & RUL Prediction**: Chemistry-specific degradation projections (LFP, NMC, NCA) across 6, 12, 24, and 36 months.
- **Safety Risk Scoring**: Multi-domain rule-based safety evaluation covering temperature, internal resistance, and cycle utilization.
- **Second-Life Suitability Engine**: Automated classification into *Continue EV Use*, *Second-Life Energy Storage*, *Refurbishment*, or *Responsible Recycling*.
- **Digital Health Certification**: Issue digital battery health certificates with QR verification codes and downloadable PDF certificates.
- **Modern Battery-Industry Visual Identity**: Clean, technical SaaS aesthetic built around the BatteryX Mint (`#66CC99`) color language.

---

## 🏗️ Architecture & Tech Stack

- **Frontend**: React 19, TypeScript, Vite, TailwindCSS v4, Recharts, Lucide Icons
- **Backend**: FastAPI (Python 3.11+), SQLAlchemy, Pydantic v2, ReportLab, Scikit-Learn
- **Database**: SQLite (local/serverless) / PostgreSQL (production)
- **Deployment**: Vercel Serverless (FastAPI + Vite unified fullstack)

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- Python 3.10+
- Node.js 18+ & npm

### One-Click Launch (Windows)
Double-click `start_all.bat` or run:
```bash
start_all.bat
```

### Manual Setup

1. **Backend**:
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   uvicorn app.main:app --reload --port 8000
   ```

2. **Frontend**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

3. **Access**:
   - Frontend UI: [http://localhost:5173](http://localhost:5173)
   - Backend API Docs: [http://localhost:8000/api/docs](http://localhost:8000/api/docs)
   - Demo Credentials: `admin@batteryx.ai` / `BatteryX2026!`

---

## ☁️ Deployment on Vercel

This repository is configured for out-of-the-box Vercel deployment with `vercel.json` and `api/index.py`.

### Deploying via Vercel CLI:
```bash
npx vercel
```

### Deploying via Vercel Web Dashboard:
1. Import `https://github.com/mohammadfahadsiddiqui/BatteryX_AI` on Vercel.
2. The framework preset (Vite) and root build command are automatically detected via `vercel.json`.
3. Click **Deploy**.

---

## 📄 License
MIT License.
