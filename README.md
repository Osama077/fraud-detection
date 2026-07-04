# FraudShield — Credit Card Fraud Detection Platform

> **DEPI Microsoft ML Course | Graduation Project 2025**  
> A production-grade, full-stack machine learning platform that detects credit card fraud in real time.  
> Built with **FastAPI + Next.js 14 + PostgreSQL + Redis + Celery + Scikit-learn + XGBoost**.

---

## Table of Contents

- [Overview](#overview)
- [What Makes This Project Different?](#what-makes-this-project-different)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
  - [System Architecture Diagram](#system-architecture-diagram)
  - [Docker Services](#docker-services)
- [User Flows](#user-flows)
  - [Flow A: Single Transaction Prediction](#flow-a-single-transaction-prediction)
  - [Flow B: Batch CSV Upload](#flow-b-batch-csv-upload)
  - [Flow C: Dashboard Monitoring](#flow-c-dashboard-monitoring)
  - [Flow D: Alert Management](#flow-d-alert-management)
  - [Flow E: Model Management & Threshold Tuning](#flow-e-model-management--threshold-tuning)
- [API Reference](#api-reference)
  - [Authentication (6 endpoints)](#authentication)
  - [Predictions (3 endpoints)](#predictions)
  - [Alerts (4 endpoints)](#alerts)
  - [Transactions (5 endpoints)](#transactions)
  - [Analytics (5 endpoints)](#analytics)
  - [Models (3 endpoints)](#model-management)
  - [Admin (5 endpoints)](#admin)
  - [Health (1 endpoint)](#health)
- [Dataset](#dataset)
  - [Source & Structure](#source--structure)
  - [Statistics](#statistics)
- [ML Pipeline](#ml-pipeline)
  - [End-to-End Training Pipeline](#end-to-end-training-pipeline)
  - [Training Details](#training-details)
  - [Inference Pipeline (Runtime)](#inference-pipeline-at-runtime)
- [Model Performance](#model-performance)
  - [Primary Models](#primary-models)
  - [Confusion Matrices](#confusion-matrices)
  - [Anomaly Detection (Isolation Forest)](#anomaly-detection-isolation-forest)
  - [Feature Engineering Impact](#feature-engineering-impact)
- [Alert Severity System](#alert-severity-system)
- [Role-Based Access Control](#role-based-access-control)
- [Quick Start](#quick-start)
  - [Prerequisites](#prerequisites)
  - [1. Clone & Configure](#1-clone--configure)
  - [2. Download the Dataset](#2-download-the-dataset)
  - [3. Start All Services](#3-start-all-services)
  - [4. Train the Model](#4-train-the-model)
  - [5. Create a User](#5-create-a-user)
  - [6. Make Your First Prediction](#6-make-your-first-prediction)
- [Project Structure](#project-structure)
- [Running Tests](#running-tests)
- [Environment Variables](#environment-variables)
- [CI / CD](#ci--cd)
- [Team](#team)
- [License](#license)

---

## Overview

FraudShield is an end-to-end credit card fraud detection system that transforms a raw transaction into a fraud verdict in under **100 milliseconds**. It combines **machine learning** (Random Forest, XGBoost, Logistic Regression, Isolation Forest) with a **production-grade full-stack application** (Next.js dashboard, FastAPI REST API, Celery workers, PostgreSQL, Redis) — all orchestrated via Docker Compose.

### How Users Interact with the System

| Action | Location | Description |
|---|---|---|
| **Single Transaction Check** | `/predict` | Fill a form with 30 values (Time, Amount, V1–V28) and click Predict — fraud probability appears instantly |
| **Upload CSV File** | `/upload` | Drag-and-drop a CSV with thousands of transactions — processed in the background via Celery with live progress |
| **Monitor Dashboard** | `/dashboard` | View live statistics: total transactions, fraud rate, model performance, alerts |
| **Manage Alerts** | `/alerts` | Investigate, resolve, or mark alerts as false positive |
| **View Models** | `/models` | See which model is active, activate a different version with one click |
| **Adjust Sensitivity** | `/settings` | Change the decision threshold from 10% to 95% at runtime |
| **Admin Tasks** | `/admin/users`, `/admin/audit-logs` | Manage users and view immutable audit trail (admin only) |

---

## What Makes This Project Different?

The machine learning techniques used here (Random Forest, Logistic Regression, SMOTE, PCA features) are well-established and widely available in Kaggle notebooks and academic papers. **FraudShield is not "novel ML research"** — it is a **production-grade full-stack application** that wraps those models into a deployable, usable product. This is what makes it a strong graduation project.

| Capability | FraudShield | Typical Jupyter Notebook |
|---|---|---|
| **Real-time inference API** | ✅ FastAPI with rate limiting, JWT auth, auto-docs | ❌ |
| **Interactive web dashboard** | ✅ Next.js 14 with live Recharts, responsive layout | ❌ |
| **Batch CSV processing** | ✅ Async Celery workers with progress bar | ❌ |
| **Multi-model training pipeline** | ✅ 4 algorithms in a single run with threshold optimization | ⚠️ Usually one model |
| **Model versioning & registry** | ✅ Registry with version numbers, one-click activation | ❌ |
| **Runtime threshold tuning** | ✅ Adjustable from Settings page, no redeployment | ❌ |
| **Alert management** | ✅ Auto-created alerts with severity levels, investigation workflow | ❌ |
| **Role-based access control** | ✅ Admin / Analyst / Viewer with route guards | ❌ |
| **Audit logging** | ✅ Immutable trace for every mutation (who, what, when, IP) | ❌ |
| **Persistent database** | ✅ PostgreSQL with 6 tables, Alembic migrations | ❌ |
| **Caching & token management** | ✅ Redis (app cache + Celery broker + result backend) | ❌ |
| **Containerized deployment** | ✅ 7-service Docker Compose stack with health checks | ❌ |
| **CI pipeline** | ✅ GitHub Actions — automated tests on push | ❌ |

---

## Features

### For End Users

| Feature | Description |
|---|---|
| Single Transaction Prediction | Enter 30 features via a form and get an instant fraud probability with a visual gauge |
| Batch CSV Upload | Drag-and-drop a CSV with thousands of transactions; processed asynchronously with a live progress bar |
| Dashboard | Real-time KPIs (total transactions, fraud count, open alerts), trend charts, model performance bars, confusion matrix |
| Alert Management | Review, investigate, resolve, or mark as false positive; full lifecycle with notes |
| Threshold Tuning | Adjust the fraud probability cutoff (10%–95%) at runtime — no redeployment needed |
| Model Management | View all trained versions with metrics, activate any version with one click |
| Transaction History | Browse past transactions with filters (fraud status, amount range, date) |
| CSV Exports | Download transactions and alerts for external analysis |

### For Administrators

| Feature | Description |
|---|---|
| User Management | CRUD users, assign roles (admin/analyst/viewer), activate/deactivate accounts |
| Audit Logs | Immutable log of every mutating action: who did what, when, and from which IP |
| Role Assignment | Granular permissions: Admin (full access), Analyst (predictions + alerts), Viewer (read-only) |

### For Developers

| Feature | Description |
|---|---|
| Interactive API Docs | Auto-generated Swagger UI at `/docs` with try-it-out |
| JWT Authentication | Access tokens (30 min) + refresh tokens (7 days) with Redis-backed revocation |
| Docker Compose | Single command spins up 7 services with health checks, resource limits, and dependencies |
| Celery + Flower | Background task processing with a real-time monitoring UI at `:5555` |
| Rate Limiting | Per-endpoint rate limits (100/min for predictions, general 60/min) |
| Comprehensive Tests | pytest suite covering auth, predictions, alerts, ML model loading, admin |

---

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | Next.js 14 (App Router), React 18, TypeScript | SSR dashboard with dynamic routing |
| **UI Components** | Tailwind CSS, Recharts, Lucide React | Responsive layout, interactive charts, icons |
| **State / API Client** | TanStack Query, Axios | Auto-caching, polling, JWT interceptor with auto-refresh |
| **Backend** | FastAPI 0.110, Uvicorn, Pydantic v2 | High-performance async REST API with auto-generated OpenAPI docs |
| **ML / Training** | scikit-learn 1.8, XGBoost 3.2, imbalanced-learn 0.14 | Model training, evaluation, SMOTE oversampling |
| **Model Serialization** | joblib | Save / load `.pkl` model artifacts |
| **Task Queue** | Celery 5.3 + Redis (broker & result backend) | Async batch CSV processing |
| **Primary Database** | PostgreSQL 16 (Alpine) | Persistent storage — 6 tables (users, transactions, predictions, fraud_alerts, model_versions, audit_logs) |
| **Cache & Tokens** | Redis 7 (Alpine) | Session caching, JWT refresh token blacklist, Celery broker (DB 1), Celery results (DB 2) |
| **Authentication** | python-jose (JWT), passlib + bcrypt | Token generation, password hashing, refresh token rotation |
| **Reverse Proxy** | Nginx 1.25 (Alpine) | Unified entry point, routes `/api/*` to backend, `/*` to frontend |
| **Orchestration** | Docker Compose | Multi-service orchestration with health checks, resource limits, named volumes |
| **CI** | GitHub Actions | Automated test runs on push and pull requests |
| **Database Migrations** | Alembic | Schema versioning and auto-migration |

---

## Architecture

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          NGINX (Port 80)                                │
│     ┌─────────────────────┐           ┌───────────────────────────┐     │
│     │ /api/* → backend:8000         │ /* → frontend:3000         │     │
│     │ /docs  → backend:8000         │ (Next.js SSR + static)     │     │
│     └─────────────────────┘           └───────────────────────────┘     │
└─────────────────────────────────────────────────────────────────────────┘
                       │                             │
                       ▼                             ▼
┌─────────────────────────────────┐   ┌──────────────────────────────────┐
│      FastAPI Backend (:8000)     │   │     Next.js Frontend (:3000)     │
│                                  │   │                                  │
│  ┌───────────────────────────┐   │   │  Pages:                         │
│  │ API Endpoints (32 routes) │   │   │  /auth/login                    │
│  │  - Auth (register, login, │   │   │  /auth/register                 │
│  │    refresh, logout, me)   │   │   │  /dashboard (KPI hub)           │
│  │  - Predict (single, batch)│   │   │  /predict (single form)         │
│  │  - Alerts (CRUD + export) │   │   │  /upload (drag-drop CSV)        │
│  │  - Transactions (list,    │   │   │  /alerts (manage)               │
│  │    stats, export)         │   │   │  /transactions (table)          │
│  │  - Analytics (dashboard,  │   │   │  /models (version mgmt)         │
│  │    trend, conf-matrix)    │   │   │  /settings (profile + thresh.)  │
│  │  - Models (list, activate) │   │   │  /admin/users (admin only)     │
│  │  - Admin (users, audit)   │   │   │  /admin/audit-logs (admin only)│
│  │  - Health                  │   │   │                                  │
│  └───────────────────────────┘   │   │  Components:                    │
│                                  │   │  Sidebar, TopBar, KpiCard,       │
│  ┌───────────────────────────┐   │   │  AuthGuard, ProbabilityGauge,   │
│  │ Services Layer             │   │   │  FraudTrendChart,              │
│  │  - AuthService (JWT)       │   │   │  ModelMetricsChart,            │
│  │  - PredictionService       │   │   │  ConfusionMatrix, RocCurve     │
│  │  - Celery Tasks (batch)    │   │   │                                  │
│  └───────────────────────────┘   │   │  Hooks: TanStack Query          │
│                                  │   │  (polling, auto-refetch)         │
│  ┌───────────────────────────┐   │   │                                  │
│  │ ML Layer                   │   │   │  API Client: Axios              │
│  │  - ModelRegistry (singleton)│   │   │  (JWT interceptor + auto-refresh)│
│  │  - Pipeline/train.py      │   │   └──────────────────────────────────┘
│  │  - 4 trained models (.pkl)│   │
│  └───────────────────────────┘   │
│                                  │
│  ┌───────────────────────────┐   │
│  │ Middleware                 │   │
│  │  - CORS (configured origins)│   │
│  │  - Rate Limit (slowapi)   │   │
│  │  - Audit Logging (auto)   │   │
│  │  - Error Handling         │   │
│  └───────────────────────────┘   │
└──────────────┬──────────────────┘
               │              │
               ▼              ▼
┌────────────────────┐  ┌────────────────────┐
│    PostgreSQL      │  │      Redis          │
│    (Port 5432)     │  │    (Port 6379)      │
│                    │  │                     │
│  Tables:           │  │  DB 0: App cache    │
│   - users          │  │  DB 1: Celery broker│
│   - transactions   │  │  DB 2: Celery result│
│   - predictions    │  │                     │
│   - fraud_alerts   │  │  Keys:              │
│   - model_versions │  │   - refresh:* (JWT) │
│   - audit_logs     │  │   - celery-task-meta│
└────────────────────┘  └────────────────────┘

┌─────────────────────────────────────────────┐
│         Celery Worker + Flower               │
│                                              │
│  - fraud_celery container                     │
│  - Processes: batch_predict_task              │
│  - Parses CSV with pandas                    │
│  - Runs vectorized inference via ModelRegistry│
│  - Writes transactions + predictions to DB   │
│  - Auto-creates FraudAlerts with severity    │
│  - Flower monitoring UI at :5555             │
└─────────────────────────────────────────────┘
```

### Docker Services

| Service | Container Name | Base Image | Exposed Port(s) | Depends On |
|---|---|---|---|---|
| `postgres` | `fraud_postgres` | postgres:16-alpine | 5432 | — |
| `redis` | `fraud_redis` | redis:7-alpine | 6379 | — |
| `backend` | `fraud_backend` | python:3.11-slim | 8000 | postgres (healthy), redis (healthy) |
| `celery_worker` | `fraud_celery` | python:3.11-slim | — | backend (healthy) |
| `flower` | `fraud_flower` | python:3.11-slim | 5555 | redis, celery_worker |
| `frontend` | `fraud_frontend` | node:20-alpine | 3000 | backend |
| `nginx` | `fraud_nginx` | nginx:1.25-alpine | 80 → 3000 (UI), 8000 (API) | backend, frontend |

All services include **health checks**, **resource limits**, and **restart policies**. Data is persisted via named Docker volumes (`postgres_data`, `redis_data`).

---

## User Flows

### Flow A: Single Transaction Prediction

```
User navigates to /predict
        │
        ▼
Fills a form with 30 values:
  Time (seconds since first transaction)
  Amount (USD)
  V1 through V28 (PCA-transformed features)
        │
        ▼
Clicks "Predict Transaction"
        │
        ▼
Frontend → POST /api/v1/predict/single
        │
        ▼
Backend PredictionService.predict_single():
  1. Validates input via Pydantic schema
  2. Creates Transaction record in PostgreSQL
  3. ModelRegistry.predict(features):
     a. np.array(features) → reshape(1, -1)
     b. RobustScaler.transform() on ALL 30 columns
     c. Model.predict_proba(scaled)[0][1] → fraud probability
     d. Compare to global threshold → label (0 = legitimate, 1 = fraud)
     e. Measures inference latency (typically < 50ms)
  4. Creates Prediction record (with latency + model version)
  5. If label == 1: auto-creates FraudAlert with severity
  6. Returns PredictionResult to frontend
        │
        ▼
Frontend renders:
  ┌──────────────────────────────────┐
  │  Probability Gauge (red→green)   │
  │  Fraud Probability: 2.3%         │
  │  Verdict: LEGITIMATE             │
  │  Threshold: 0.78                 │
  │  Latency: 12.5 ms                │
  │  Model: Random Forest v2.0.0     │
  └──────────────────────────────────┘
```

### Flow B: Batch CSV Upload

```
User navigates to /upload
        │
        ▼
Drags-and-drops a CSV file
  Required columns: Time, Amount, V1, V2, ..., V28
  Optional column: Class (for evaluation)
  Max file size: 100 MB
        │
        ▼
Clicks "Start Batch Prediction"
        │
        ▼
Frontend → POST /api/v1/predict/batch (multipart form)
        │
        ▼
Backend validates:
  ✓ ML model is loaded (ModelRegistry has an active model)
  ✓ File extension is .csv
  ✓ File size ≤ 100 MB
        │
        ▼
Backend calls batch_predict_task.delay(csv_text, user_id)
  → Celery task enqueued on Redis broker (DB 1)
  → Returns HTTP 202 Accepted with job_id immediately
        │
        ▼
Frontend polls GET /api/v1/predict/batch/{job_id} every 2 seconds
  Response: { "status": "processing", "progress": { "current": 500, "total": 10000 } }
        │
        ▼
[Meanwhile, Celery Worker processes the task:]
  1. Parse CSV with pandas
  2. Validate required columns are present
  3. For each row:
     a. Create Transaction record
     b. ModelRegistry.predict_batch() — vectorized for all rows
     c. Create Prediction record (with latency, model version)
     d. If fraud probability ≥ threshold: create FraudAlert with severity
  4. Commit all records in a single DB transaction
  5. Update job status to "completed" with summary
        │
        ▼
Frontend receives completion:
  - Progress bar reaches 100%
  - Summary card: Total transactions, Fraud count, Legitimate count
  - Links to /transactions and /alerts for details
```

### Flow C: Dashboard Monitoring

```
User navigates to /dashboard
        │
        ▼
Frontend calls (auto-refreshes every 30 seconds via TanStack Query polling):
  GET /api/v1/analytics/dashboard
  GET /api/v1/analytics/trend?days=7
  GET /api/v1/analytics/confusion-matrix
  GET /api/v1/analytics/fraud-by-amount
  GET /api/v1/analytics/top-alerts?limit=5
        │
        ▼
User sees:
  ┌──────────────────────────────────────────────────────────────────┐
  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
  │  │Total Txns│  │  Fraud   │  │  Open    │  │  Fraud   │       │
  │  │ 142,305  │  │  Detected│  │  Alerts  │  │   Rate   │       │
  │  │          │  │  1,234   │  │   56     │  │  0.87%   │       │
  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘       │
  │                                                                  │
  │  [Transaction Volume Trend Chart (7/14/30 day)]                  │
  │                                                                  │
  │  [Model Performance Bars: Precision, Recall, F1, AUC-ROC]       │
  │                                                                  │
  │  [Fraud-by-Amount Distribution]                                  │
  │                                                                  │
  │  [Top Critical Alerts List]                                      │
  │                                                                  │
  │  [Confusion Matrix: TP=87, FP=12, FN=9, TN=56848]               │
  └──────────────────────────────────────────────────────────────────┘
```

### Flow D: Alert Management

```
User navigates to /alerts
        │
        ▼
Filters by:
  - Status: Open / Investigating / Resolved / False Positive
  - Severity: Low / Medium / High / Critical
  - Date range
  - Assigned user
        │
        ▼
Clicks "Review" on an alert → modal opens with full transaction details
        │
        ▼
User can:
  - Read transaction details (all 30 features + prediction result)
  - Add investigation notes
  - Change status to "Investigating"
  - Assign to another team member
  - Mark as "Resolved"
  - Mark as "False Positive" (improves model evaluation metrics)
        │
        ▼
PUT /api/v1/alerts/{id} → status updated + audit logged
```

### Flow E: Model Management & Threshold Tuning

```
User navigates to /models
        │
        ▼
Sees all trained model versions with metrics:
  ┌──────┬─────────┬───────────┬────────┬──────────┬──────────┐
  │ Ver  │ Algo    │ Precision │ Recall │ F1 Score │ AUC-ROC  │
  ├──────┼─────────┼───────────┼────────┼──────────┼──────────┤
  │ v2.0 │ RF      │ 0.846     │ 0.786  │ 0.815    │ 0.985    │ ← active
  │ v1.1 │ XGB     │ 0.637     │ 0.878  │ 0.738    │ 0.980    │
  │ v1.0 │ LR      │ 0.138     │ 0.898  │ 0.238    │ 0.972    │
  └──────┴─────────┴───────────┴────────┴──────────┴──────────┘
        │
        ▼
Clicks "Activate" on any version
  → POST /api/v1/models/{id}/activate
  → ModelRegistry hot-reloads the new .pkl file
  → No server restart needed
        │
        ▼
Navigates to /settings
  → Adjusts threshold slider (10%–95%)
  → Clicks "Apply"
  → POST /api/v1/models/threshold
  → Global threshold updated in DB and applied instantly
```

---

## API Reference

### Authentication

| Method | Endpoint | Description | Request Body | Auth |
|---|---|---|---|---|
| POST | `/api/v1/auth/register` | Register a new user | `{ email, password, full_name, role? }` | No |
| POST | `/api/v1/auth/login` | Login, returns access + refresh tokens | `{ email, password }` | No |
| POST | `/api/v1/auth/refresh` | Refresh expired access token | `{ refresh_token }` | Refresh token |
| POST | `/api/v1/auth/logout` | Revoke refresh token (Redis blacklist) | — | Yes |
| GET | `/api/v1/auth/me` | Get current user profile | — | Yes |
| PUT | `/api/v1/auth/me` | Update profile (name / password) | `{ full_name?, password? }` | Yes |

### Predictions

| Method | Endpoint | Description | Rate Limit | Auth |
|---|---|---|---|---|
| POST | `/api/v1/predict/single` | Predict a single transaction | 100/min | Yes |
| POST | `/api/v1/predict/batch` | Upload CSV for batch prediction | 10/min | Yes |
| GET | `/api/v1/predict/batch/{job_id}` | Poll batch job progress | — | Yes |

**Request Body — Single Prediction:**
```json
{
  "time_seconds": 0.0,
  "amount": 250.50,
  "v1": -1.359807, "v2": -0.072781, "v3": 2.536347,
  "v4": 1.378155, "v5": -0.338321, "v6": 0.462388,
  "v7": 0.239599, "v8": 0.098698, "v9": 0.363787,
  "v10": 0.090794, "v11": -0.551600, "v12": -0.617801,
  "v13": -0.991390, "v14": -0.311169, "v15": 1.468177,
  "v16": -0.470401, "v17": 0.207971, "v18": 0.025791,
  "v19": 0.403993, "v20": 0.251412, "v21": -0.018307,
  "v22": 0.277838, "v23": -0.110474, "v24": 0.066928,
  "v25": 0.128539, "v26": -0.189115, "v27": 0.133558,
  "v28": -0.021053
}
```

**Response — Single Prediction:**
```json
{
  "transaction_id": "550e8400-e29b-41d4-a716-446655440000",
  "prediction_id": "550e8400-e29b-41d4-a716-446655440001",
  "prediction": 0,
  "fraud_probability": 0.023,
  "threshold": 0.78,
  "is_fraud": false,
  "latency_ms": 12.5,
  "model_version": "v2.0.0",
  "model_name": "Random Forest"
}
```

### Alerts

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/api/v1/alerts` | List alerts (filter by status, severity, assigned_to) | Yes |
| GET | `/api/v1/alerts/{alert_id}` | Get a single alert with full transaction details | Yes |
| PUT | `/api/v1/alerts/{alert_id}` | Update alert (status, notes, assignment) | Yes |
| GET | `/api/v1/alerts/export` | Download alerts as CSV | Yes |

### Transactions

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/api/v1/transactions` | List transactions (filter by fraud, amount range, date) | Yes |
| GET | `/api/v1/transactions/{tx_id}` | Get single transaction with prediction | Yes |
| GET | `/api/v1/transactions/stats` | Aggregate statistics (total, fraud count, avg amount) | Yes |
| DELETE | `/api/v1/transactions/{tx_id}` | Soft-delete transaction | Admin |
| GET | `/api/v1/transactions/export` | Download transactions as CSV | Yes |

### Analytics

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/api/v1/analytics/dashboard` | Dashboard KPIs (totals, fraud rate, model metrics) | Yes |
| GET | `/api/v1/analytics/trend` | Daily transaction + fraud counts (`?days=7/14/30`) | Yes |
| GET | `/api/v1/analytics/confusion-matrix` | TP / TN / FP / FN from known-label predictions | Yes |
| GET | `/api/v1/analytics/fraud-by-amount` | Fraud count bucketed by amount ranges | Yes |
| GET | `/api/v1/analytics/top-alerts` | Most critical open alerts (`?limit=5`) | Yes |

### Model Management

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/api/v1/models` | List all model versions with metrics | Yes |
| POST | `/api/v1/models/{id}/activate` | Promote a model version to production | Yes |
| POST | `/api/v1/models/threshold` | Update global decision threshold | Yes |

### Admin

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/api/v1/admin/users` | List all users | Admin |
| GET | `/api/v1/admin/users/{user_id}` | Get user details | Admin |
| PATCH | `/api/v1/admin/users/{user_id}` | Update user (role, active status, name) | Admin |
| DELETE | `/api/v1/admin/users/{user_id}` | Deactivate user (soft-delete) | Admin |
| GET | `/api/v1/admin/audit-logs` | List audit trail (filter by action, user, date range) | Admin |

### Health

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/v1/health` | System health check (DB connection, Redis ping, ML model status) |

> **Interactive Swagger docs**: `http://localhost:8000/docs` — full OpenAPI specification with try-it-out.

---

## Dataset

### Source & Structure

The dataset is the [Credit Card Fraud Detection Dataset](https://www.kaggle.com/datasets/mlg-ulb/creditcardfraud) from the Machine Learning Group at Université Libre de Bruxelles (ULB).

It contains transactions made by European cardholders over two days in September 2013.

| Column | Count | Type | Description |
|---|---|---|---|
| `Time` | 1 | float64 | Seconds elapsed between this transaction and the first transaction in the dataset |
| `Amount` | 1 | float64 | Transaction amount in USD ($0.00 – $25,691.16) |
| `V1` – `V28` | 28 | float64 | PCA-transformed features (anonymized for confidentiality — original features are not disclosed) |
| `Class` | 1 | int64 | Response variable: 0 = legitimate, 1 = fraud |

### Statistics

| Metric | Value |
|---|---|
| Total transactions | 284,807 |
| Fraudulent transactions | 492 |
| Fraud rate | **0.173%** (highly imbalanced) |
| Legitimate transactions | 284,315 |
| Missing values | **0** (complete case) |
| Duplicate rows | 1,081 |
| Min amount | $0.00 |
| Max amount | $25,691.16 |
| Mean amount | $88.35 |
| Median amount | $22.00 |
| Standard deviation (amount) | $250.12 |

> **Imbalance Note**: With only 0.17% fraud, this is a classic **highly imbalanced classification** problem. Standard accuracy is meaningless (99.83% accuracy by predicting "legitimate" for everything). The project uses **SMOTE oversampling**, **class_weight="balanced"**, and **threshold optimization** to handle this.

---

## ML Pipeline

### End-to-End Training Pipeline

```
ml/data/creditcard.csv  (284,807 transactions, 31 columns, 0.173% fraud rate)
        │
        ▼
┌────────────────────────────────────────────────────────────────────┐
│  1. LOAD & EXPLORATORY DATA ANALYSIS (EDA)                         │
│                                                                     │
│     • Load CSV with pandas                                         │
│     • Check shape: 284,807 rows × 31 columns                       │
│     • Check class distribution: 492 fraud (0.173%)                 │
│     • Verify missing values: 0 (none)                              │
│     • Check duplicates: 1,081 duplicate rows                       │
│     • Analyze amount distribution: min=$0, max=$25,691, mean=$88   │
│     • Analyze time distribution: 0 – 172,792 seconds               │
└────────────────────────────────────────────────────────────────────┘
        │
        ▼
┌────────────────────────────────────────────────────────────────────┐
│  2. STRATIFIED TRAIN/TEST SPLIT (80/20)                            │
│                                                                     │
│     • `StratifiedShuffleSplit` preserves fraud ratio across splits │
│     • Train set: 227,845 transactions                              │
│       - 227,451 legitimate (99.83%)                                │
│       - 394 fraud (0.17%)                                          │
│     • Test set: 56,962 transactions                                │
│       - 56,864 legitimate (99.83%)                                 │
│       - 98 fraud (0.17%)                                           │
│     • Test set is held out UNTOUCHED until final evaluation        │
└────────────────────────────────────────────────────────────────────┘
        │
        ▼
┌────────────────────────────────────────────────────────────────────┐
│  3. ROBUSTSCALER (fit on TRAIN only)                                │
│                                                                     │
│     • Applied to ALL 30 feature columns (Time, Amount, V1–V28)    │
│     • Uses median and IQR (interquartile range)                    │
│     • More robust to outliers than StandardScaler                  │
│       - Amount ranges $0–$25K with extreme outliers                │
│       - Median=$22, IQR handles skew better than mean+std          │
│     • Test set uses train's scaler (transform only, no refit)     │
│     • Scaler saved to: ml/models/scaler.pkl                       │
└────────────────────────────────────────────────────────────────────┘
        │
        ▼
┌────────────────────────────────────────────────────────────────────┐
│  4. SMOTE — SYNTHETIC MINORITY OVERSAMPLING                        │
│                                                                     │
│     • Applied to TRAINING SET ONLY (NEVER touches test set)        │
│     • k_neighbors = 5                                              │
│     • Before SMOTE: 227,451 legit + 394 fraud                      │
│     • After SMOTE:  227,451 legit + 227,451 fraud                  │
│     • Result: balanced training set (50/50) — 454,902 total        │
│     • SMOTE creates synthetic fraud samples (not simple copies)    │
│       by interpolating between existing fraud neighbors            │
└────────────────────────────────────────────────────────────────────┘
        │
        ▼
┌────────────────────────────────────────────────────────────────────┐
│  5. TRAIN 4 MODELS (parallel on all CPU cores)                      │
│                                                                     │
│  ┌────────────────────────┐  ┌────────────────────────┐            │
│  │ RANDOM FOREST          │  │ XGBOOST                │            │
│  │                        │  │                        │            │
│  │ • 200 estimators       │  │ • 200 estimators       │            │
│  │ • max_depth=15         │  │ • max_depth=6          │            │
│  │ • class_weight=        │  │ • learning_rate=0.05   │            │
│  │   "balanced"           │  │ • subsample=0.8        │            │
│  │ • min_samples_split=5  │  │ • colsample_bytree=0.8 │            │
│  │ • n_jobs=-1 (all CPUs) │  │ • scale_pos_weight=    │            │
│  │ • random_state=42      │  │   577 (imbalance ratio)│            │
│  └────────────────────────┘  │ • eval_metric='aucpr'  │            │
│                               └────────────────────────┘            │
│  ┌────────────────────────┐  ┌────────────────────────┐            │
│  │ LOGISTIC REGRESSION    │  │ ISOLATION FOREST       │            │
│  │                        │  │                        │            │
│  │ • GridSearchCV         │  │ • 100 estimators       │            │
│  │   C=[0.1, 1.0, 10.0]  │  │ • bootstrap=True       │            │
│  │ • solver='saga'        │  │ • contamination=       │            │
│  │ • max_iter=1000        │  │   0.001727 (≈ fraud    │            │
│  │ • cv=2 (fast CV)       │  │   rate in data)        │            │
│  │ • class_weight=        │  │ • random_state=42      │            │
│  │   "balanced"           │  │ • n_jobs=-1            │            │
│  │ • n_jobs=-1            │  └────────────────────────┘            │
│  └────────────────────────┘                                        │
└────────────────────────────────────────────────────────────────────┘
        │
        ▼
┌────────────────────────────────────────────────────────────────────┐
│  6. EVALUATE ON UNTOUCHED TEST SET (56,962 transactions)           │
│                                                                     │
│     For each model:                                                │
│       1. Transform test set with the pre-fitted RobustScaler       │
│       2. Get fraud probabilities via predict_proba() (or           │
│          decision_function + sigmoid for Isolation Forest)         │
│       3. Threshold optimization:                                   │
│          - Grid search from 0.30 to 0.80 (step size 0.01)         │
│          - For each threshold: compute F1 score                   │
│          - Pick the threshold with the HIGHEST F1 score            │
│       4. Compute final metrics at optimal threshold:               │
│          - Precision, Recall, F1 Score, AUC-ROC                   │
│          - Confusion Matrix (TP, FP, FN, TN)                      │
│       5. Save per-model metadata to JSON                          │
└────────────────────────────────────────────────────────────────────┘
        │
        ▼
┌────────────────────────────────────────────────────────────────────┐
│  7. SAVE ARTIFACTS TO ml/models/                                    │
│                                                                     │
│     File                  Size      Description                     │
│     ─────────────────────────────────────────────────────────      │
│     random_forest.pkl     21.9 MB   Trained Random Forest model    │
│     xgboost.pkl           706 KB    Trained XGBoost model          │
│     logistic_regression.pkl 1.1 KB  Trained Logistic Regression    │
│     isolation_forest.pkl  856 KB    Trained Isolation Forest       │
│     scaler.pkl            983 B     Fitted RobustScaler            │
│     rf_metadata.json      498 B     RF metrics + threshold         │
│     xgb_metadata.json     496 B     XGB metrics + threshold        │
│     lr_metadata.json      495 B     LR metrics + threshold         │
│     training_summary.json 1.2 KB    All metrics in one file        │
└────────────────────────────────────────────────────────────────────┘
        │
        ▼
┌────────────────────────────────────────────────────────────────────┐
│  8. BACKEND STARTUP (automatic, no manual steps)                    │
│                                                                     │
│     On every backend container start:                               │
│       1. Scans ml/models/ for available .pkl artifacts             │
│       2. Loads in priority order:                                  │
│          RF v2.0.0 > XGB v1.1.0 > LR v1.0.0                       │
│       3. Auto-registers model version in model_versions table      │
│          (if not already registered)                               │
│       4. Loads model + scaler into ModelRegistry singleton         │
│       5. Verifies model responds to predict_proba()                │
│       6. Logs: "Model loaded: Random Forest v2.0.0"               │
│       7. Ready for inference                                       │
└────────────────────────────────────────────────────────────────────┘
```

### Training Details

| Parameter | Value |
|---|---|
| Training hardware | CPU (all cores via `n_jobs=-1`) |
| Training time (all 4 models) | ~15–20 minutes on full dataset |
| Test set size | 56,962 transactions (98 fraud cases) |
| Threshold search range | 0.30 – 0.80 (step 0.01) |
| Threshold selection criteria | Maximize F1 score |
| CV folds (LR only) | 2-fold (Stratified) |
| SMOTE k_neighbors | 5 |
| Random seed (all models) | 42 |

### Inference Pipeline (at runtime)

```
Incoming features [time, amount, v1, v2, ..., v28] — 30 values
        │
        ▼
ModelRegistry.predict(features)
  1. np.array(features).reshape(1, -1)       (single transaction)
     — OR —
     np.array(features).reshape(n, -1)         (batch of n transactions)
        │
        ▼
  2. scaler.transform(arr)
     → ALL 30 columns scaled using pre-fitted RobustScaler
     → Uses median + IQR (same scaler from training)
        │
        ▼
  3. model.predict_proba(scaled)[:, 1]
     → Returns fraud probability for each transaction
     → For models without predict_proba (Isolation Forest):
       decision_function() → sigmoid transform → probability
        │
        ▼
  4. Compare to global threshold (e.g., 0.78)
     → probability >= threshold → label = 1 (fraud)
     → probability < threshold  → label = 0 (legitimate)
        │
        ▼
  Returns: { "prediction": 0/1, "probability": float, "threshold": float }
```

---

## Model Performance

Performance measured on the **held-out test set** (56,962 transactions, 98 fraud cases).

### Primary Models

| Model | Precision | Recall | F1 Score | AUC-ROC | Optimal Threshold | File Size |
|---|---|---|---|---|---|---|
| **Random Forest** | **0.846** | **0.786** | **0.815** | **0.985** | 0.78 | 21.9 MB |
| XGBoost | 0.637 | 0.878 | 0.738 | 0.980 | 0.79 | 706 KB |
| Logistic Regression | 0.138 | 0.898 | 0.238 | 0.972 | 0.79 | 1.1 KB |
| Isolation Forest | 0.308 | 0.337 | 0.322 | 0.668 | — | 856 KB |

**Recommendation**: Random Forest is the **primary production model** due to its best balance of precision (0.85) and recall (0.79), yielding the highest F1 score (0.82) and virtually perfect AUC-ROC (0.985). It also produces only **14 false positives** vs 552 for Logistic Regression.

### Confusion Matrices

**Random Forest** (best overall — primary production model):
```
               Predicted
               Legit  Fraud
Actual Legit  56850    14     ← 14 false positives (very low)
       Fraud     21    77     ← 21 false negatives (missed fraud)
```

**XGBoost** (best recall — catches 88% of fraud):
```
               Predicted
               Legit  Fraud
Actual Legit  56815    49     ← 49 false positives
       Fraud     12    86     ← 12 false negatives
```

**Logistic Regression** (highest recall but many false positives):
```
               Predicted
               Legit  Fraud
Actual Legit  56312   552     ← 552 false positives (too many)
       Fraud     10    88     ← 10 false negatives
```

### Anomaly Detection (Isolation Forest)

Isolation Forest is not a classifier but an **anomaly detector**. It is included as an alternative approach: it isolates anomalies instead of profiling normal points.

| Metric | Value |
|---|---|
| Precision | 0.308 |
| Recall | 0.337 |
| F1 Score | 0.322 |
| AUC-ROC | 0.668 |
| Contamination | 0.001727 (set to actual fraud rate) |

### Feature Engineering Impact

| Change | Before | After (current) | Δ |
|---|---|---|---|
| Scaler | StandardScaler (Time+Amount only) | **RobustScaler (all 30 features)** | — |
| Best Precision (any model) | 0.70 (LR) | **0.85 (RF)** | **+0.15** |
| Best F1 (any model) | 0.76 | **0.81** | **+0.05** |
| Best AUC-ROC (any model) | 0.95 | **0.99** | **+0.04** |
| False Positives | 552 (LR) | **14 (RF)** | **-538** |
| False Negatives | 10 (LR) | 21 (RF) | +11 |

---

## Alert Severity System

When a transaction is flagged as fraud, an alert is auto-created with a severity level based on the fraud probability:

| Fraud Probability | Severity | Color | Action Required |
|---|---|---|---|
| ≥ 95% | **Critical** | Red | Immediate investigation |
| ≥ 80% | **High** | Orange | Prompt review |
| ≥ 60% | **Medium** | Yellow | Standard review |
| < 60% | **Low** | Blue | Monitor |

### Alert Lifecycle

```
Open → Investigating → Resolved
                  ↘ False Positive (feedback for model improvement)
```

Each status transition is logged in the `audit_logs` table with timestamp, user, IP address, and previous/next status.

---

## Role-Based Access Control

| Role | Permissions |
|---|---|
| **Admin** | Full access: manage users, view audit logs, all predictions, manage alerts, activate models, change threshold |
| **Analyst** | Predictions (single + batch), manage alerts, view models, change threshold, view dashboard |
| **Viewer** | Read-only: view dashboard, transactions, alerts, models — cannot predict, modify, or export |

---

## Quick Start

### Prerequisites

- Docker Desktop ≥ 25.0 (with Docker Compose v2)
- Git
- At least **8 GB RAM** (recommended: 16 GB)
- At least **2 GB free disk space** for model artifacts + containers

### 1. Clone & Configure

```bash
git clone https://github.com/your-org/fraud-detection.git
cd fraud-detection
cp .env.example .env
```

> Edit `.env` to customize passwords, secrets, and paths if needed. Key variables:

| Variable | Default | Description |
|---|---|---|
| `POSTGRES_PASSWORD` | `changeme_in_prod` | PostgreSQL password |
| `REDIS_PASSWORD` | `changeme_in_prod` | Redis password |
| `JWT_SECRET_KEY` | `your-secret-key-here` | Secret for JWT token signing |
| `JWT_REFRESH_SECRET_KEY` | `your-refresh-secret-key-here` | Secret for refresh token signing |
| `CELERY_BROKER_URL` | `redis://:changeme_in_prod@redis:6379/1` | Redis broker for Celery |
| `DATABASE_URL` | `postgresql+asyncpg://...` | PostgreSQL connection string |

### 2. Download the Dataset

Download `creditcard.csv` from [Kaggle](https://www.kaggle.com/datasets/mlg-ulb/creditcardfraud) and place it at:

```
ml/data/creditcard.csv
```

### 3. Start All Services

```bash
docker compose up --build -d
```

This starts 7 containers:

| Service | URL | Description |
|---|---|---|
| Frontend UI | http://localhost:3000 | Next.js dashboard |
| Backend API | http://localhost:8000 | FastAPI REST API |
| API Docs (Swagger) | http://localhost:8000/docs | Interactive API documentation |
| Nginx (unified) | http://localhost:80 | Reverse proxy (routes by path) |
| Flower (monitor) | http://localhost:5555 | Celery task monitoring UI |

### 4. Train the Model

```bash
docker compose exec backend python -m app.ml.pipeline.train
```

Training time: **~15–20 minutes** on the full dataset (284K rows, 4 models with threshold optimization).

The trained artifacts are automatically saved to `ml/models/` and will be loaded on the next backend restart.

### 5. Create a User

```bash
# Via the UI
open http://localhost:3000/auth/register

# Or via the API
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@demo.com",
    "password": "Admin1234!",
    "full_name": "Admin User",
    "role": "admin"
  }'
```

Roles available: `admin`, `analyst`, `viewer`

### 6. Make Your First Prediction

```bash
# 1. Login to get a token
TOKEN=$(curl -s -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@demo.com","password":"Admin1234!"}' \
  | python -c "import sys,json; print(json.load(sys.stdin)['access_token'])")

# 2. Predict a single transaction (legitimate example)
curl -s -X POST http://localhost:8000/api/v1/predict/single \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "time_seconds": 0.0,
    "amount": 250.50,
    "v1": -1.359807, "v2": -0.072781, "v3": 2.536347,
    "v4": 1.378155, "v5": -0.338321, "v6": 0.462388,
    "v7": 0.239599, "v8": 0.098698, "v9": 0.363787,
    "v10": 0.090794, "v11": -0.551600, "v12": -0.617801,
    "v13": -0.991390, "v14": -0.311169, "v15": 1.468177,
    "v16": -0.470401, "v17": 0.207971, "v18": 0.025791,
    "v19": 0.403993, "v20": 0.251412, "v21": -0.018307,
    "v22": 0.277838, "v23": -0.110474, "v24": 0.066928,
    "v25": 0.128539, "v26": -0.189115, "v27": 0.133558,
    "v28": -0.021053
  }' | python -m json.tool
```

Expected response:
```json
{
  "transaction_id": "550e8400-...",
  "prediction": 0,
  "fraud_probability": 0.023,
  "is_fraud": false,
  "latency_ms": 12.5,
  "model_version": "v2.0.0",
  "model_name": "Random Forest"
}
```

### Training Directly on Host (Alternative)

If Docker is unavailable, you can train directly on the host:

```bash
cd backend
pip install -r requirements.txt
python -m app.ml.pipeline.train
```

This produces all 9 artifact files in `ml/models/` which the backend auto-loads at startup.

---

## Project Structure

```
fraud-detection/
│
├── backend/                          # FastAPI Python backend
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                   # FastAPI app factory, startup events, middleware
│   │   ├── api/
│   │   │   └── v1/
│   │   │       ├── __init__.py
│   │   │       ├── router.py         # Aggregate all endpoint routers
│   │   │       └── endpoints/
│   │   │           ├── auth.py       # Register, login, refresh, logout, me
│   │   │           ├── predict.py    # Single prediction, batch upload, batch status
│   │   │           ├── transactions.py # List, detail, stats, export, soft-delete
│   │   │           ├── alerts.py     # List, detail, update, export
│   │   │           ├── analytics.py  # Dashboard, trend, confusion matrix, etc.
│   │   │           ├── models.py     # List models, activate, update threshold
│   │   │           ├── admin.py      # User management, audit logs
│   │   │           └── health.py     # System health check
│   │   ├── core/
│   │   │   ├── config.py            # Settings from environment variables
│   │   │   ├── security.py          # JWT creation, password hashing
│   │   │   ├── celery_app.py        # Celery application instance
│   │   │   └── rate_limit.py        # Rate limit configuration
│   │   ├── db/
│   │   │   ├── __init__.py
│   │   │   ├── session.py           # SQLAlchemy async engine + session factory
│   │   │   └── base.py              # Declarative base
│   │   ├── ml/
│   │   │   ├── __init__.py
│   │   │   ├── pipeline/
│   │   │   │   └── train.py         # Full training pipeline: 4 models + threshold opt
│   │   │   └── model_registry.py    # Singleton: load model, predict, predict_batch
│   │   ├── models/                   # SQLAlchemy ORM models
│   │   │   ├── __init__.py
│   │   │   └── models.py            # User, Transaction, Prediction, FraudAlert,
│   │   │                              # ModelVersion, AuditLog
│   │   ├── schemas/                  # Pydantic validation schemas
│   │   │   ├── __init__.py
│   │   │   ├── auth.py              # LoginRequest, RegisterRequest, TokenResponse
│   │   │   ├── predict.py           # SinglePredictionRequest, BatchPredictionResponse
│   │   │   ├── transaction.py       # TransactionResponse
│   │   │   ├── alert.py             # AlertResponse, AlertUpdate
│   │   │   ├── model.py             # ModelVersionResponse, ThresholdUpdate
│   │   │   └── analytics.py         # DashboardResponse, TrendResponse
│   │   └── services/
│   │       ├── __init__.py
│   │       ├── auth_service.py      # Business logic: register, login, refresh
│   │       ├── prediction_service.py # Single + batch prediction orchestration
│   │       └── celery_tasks.py      # batch_predict_task (Celery async task)
│   ├── alembic/
│   │   ├── env.py
│   │   └── versions/                # Database migration scripts
│   ├── tests/
│   │   ├── conftest.py              # Pytest fixtures (test DB, test client)
│   │   ├── test_auth.py             # Registration, login, token refresh, logout
│   │   ├── test_predictions.py      # Single prediction, batch upload, job polling
│   │   ├── test_alerts.py           # Alert listing, filtering, status updates
│   │   ├── test_transactions.py     # CRUD, stats, export, admin soft-delete
│   │   ├── test_admin.py            # User management, audit log listing
│   │   └── test_ml.py              # ModelRegistry singleton, load, predict
│   ├── Dockerfile
│   └── requirements.txt
│
├── frontend/                         # Next.js 14 React frontend
│   ├── app/                          # App Router pages
│   │   ├── layout.tsx               # Root layout (providers, auth guard)
│   │   ├── page.tsx                 # Landing → redirects to /dashboard
│   │   ├── auth/
│   │   │   ├── login/page.tsx       # Login form with email + password
│   │   │   └── register/page.tsx    # Registration form
│   │   ├── dashboard/page.tsx       # KPI hub with live charts
│   │   ├── predict/page.tsx         # Single transaction form + result
│   │   ├── upload/page.tsx          # Batch CSV drag-and-drop + progress
│   │   ├── alerts/page.tsx          # Alert table with filters + review modal
│   │   ├── transactions/page.tsx    # Transaction table with filters
│   │   ├── models/page.tsx          # Model version list + activation
│   │   ├── settings/page.tsx        # Profile edit + threshold slider
│   │   └── admin/
│   │       ├── users/page.tsx       # User CRUD table (admin only)
│   │       └── audit-logs/page.tsx  # Audit log viewer (admin only)
│   ├── components/
│   │   ├── charts/                  # Recharts wrappers
│   │   │   ├── FraudTrendChart.tsx
│   │   │   ├── ModelMetricsChart.tsx
│   │   │   ├── ConfusionMatrix.tsx
│   │   │   └── RocCurve.tsx
│   │   ├── shared/                  # Shared layout components
│   │   │   ├── Sidebar.tsx
│   │   │   ├── TopBar.tsx
│   │   │   ├── KpiCard.tsx
│   │   │   └── AuthGuard.tsx
│   │   └── ui/                      # Reusable form elements
│   │       ├── Button.tsx
│   │       ├── Input.tsx
│   │       ├── Select.tsx
│   │       └── Modal.tsx
│   ├── lib/
│   │   └── api.ts                   # Axios client with JWT interceptor + auto-refresh
│   ├── hooks/                        # TanStack Query hooks
│   │   ├── useAuth.ts
│   │   ├── usePredictions.ts
│   │   ├── useAlerts.ts
│   │   └── useAnalytics.ts
│   ├── types/                        # TypeScript type definitions
│   │   └── index.ts
│   ├── Dockerfile
│   └── package.json
│
├── ml/                               # ML artifacts (mounted into containers)
│   ├── data/
│   │   └── creditcard.csv           # Place Kaggle dataset here (gitignored)
│   └── models/                       # Trained .pkl files (auto-generated)
│       ├── random_forest.pkl
│       ├── xgboost.pkl
│       ├── logistic_regression.pkl
│       ├── isolation_forest.pkl
│       ├── scaler.pkl
│       ├── rf_metadata.json
│       ├── xgb_metadata.json
│       ├── lr_metadata.json
│       └── training_summary.json
│
├── nginx/
│   └── nginx.conf                   # Reverse proxy config
│
├── scripts/
│   └── init.sql                     # DB initialization (role + database creation)
│
├── .github/workflows/
│   └── ci.yml                       # GitHub Actions — test backend on push
│
├── docker-compose.yml               # Main orchestration (7 services)
├── docker-compose.override.yml      # Dev overrides (hot reload, volume mounts)
├── docker-compose.prod.yml          # Production overrides (optimized builds)
├── .env.example                     # Environment variable template
├── .env                             # Active environment variables (gitignored)
├── Makefile                         # Common command shortcuts
└── README.md                        # This file
```

---

## Running Tests

### Backend Tests

```bash
# Inside the Docker container
docker compose exec backend pytest -v

# With coverage report
docker compose exec backend pytest --cov=app --cov-report=term-missing -v

# Or locally (requires Python 3.11+)
cd backend
pip install -r requirements-dev.txt
pytest --cov=app --cov-report=term-missing -v
```

### Test Coverage Areas

| Test File | What It Covers |
|---|---|
| `tests/test_auth.py` | Registration, login, token refresh, logout, profile CRUD, JWT validation |
| `tests/test_predictions.py` | Single prediction, batch upload, job polling, rate limiting, auth checks |
| `tests/test_alerts.py` | Alert listing, severity filtering, status updates, export, false positive marking |
| `tests/test_transactions.py` | CRUD, aggregate stats, CSV export, admin soft-delete |
| `tests/test_admin.py` | User management CRUD, role assignment, audit log listing |
| `tests/test_ml.py` | ModelRegistry singleton pattern, model loading, predict, predict_batch on all 4 models |

---

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `DATABASE_URL` | Yes | `postgresql+asyncpg://...` | PostgreSQL async connection string |
| `REDIS_URL` | Yes | `redis://:password@redis:6379/0` | Redis connection string (app cache) |
| `CELERY_BROKER_URL` | Yes | `redis://:password@redis:6379/1` | Redis DB 1 — Celery broker |
| `CELERY_RESULT_BACKEND` | Yes | `redis://:password@redis:6379/2` | Redis DB 2 — Celery results |
| `JWT_SECRET_KEY` | Yes | — | Signing key for access tokens |
| `JWT_REFRESH_SECRET_KEY` | Yes | — | Signing key for refresh tokens |
| `JWT_ALGORITHM` | No | `HS256` | JWT signing algorithm |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | No | `30` | Access token lifetime |
| `REFRESH_TOKEN_EXPIRE_DAYS` | No | `7` | Refresh token lifetime |
| `POSTGRES_USER` | Yes | `frauduser` | PostgreSQL user |
| `POSTGRES_PASSWORD` | Yes | `changeme_in_prod` | PostgreSQL password |
| `POSTGRES_DB` | Yes | `fraud_detection` | PostgreSQL database name |
| `REDIS_PASSWORD` | Yes | `changeme_in_prod` | Redis password |
| `ALLOWED_ORIGINS` | No | `http://localhost:3000` | CORS allowed origins (comma-separated) |
| `RATE_LIMIT_GENERAL` | No | `60/minute` | Default rate limit |
| `RATE_LIMIT_PREDICT` | No | `100/minute` | Prediction endpoint rate limit |
| `RATE_LIMIT_BATCH` | No | `10/minute` | Batch upload rate limit |
| `ML_MODELS_DIR` | No | `/app/ml/models` | Path to model artifacts |

---

## CI / CD

A GitHub Actions workflow (`.github/workflows/ci.yml`) automatically runs on every push:

```yaml
Triggers: push to main, pull requests

Jobs:
  1. test-backend:
     - Checkout code
     - Set up Python 3.11
     - Install dependencies (pip install -r requirements.txt)
     - Run pytest with coverage
     - Upload coverage report to Codecov

  2. lint-frontend: (optional)
     - Set up Node.js 20
     - npm ci
     - npm run lint
```

---

## Team

| Name | Role |
|---|---|
| Ahmed Mahmoud Abdelgawad | Team Leader |
| Osama Nasser Mohamed | Data Engineer |
| Roaa Sameh Mohamed | ML Engineer |
| Ziad Mohamed Sayed Abdelsalam | Model Evaluator |
| Antonious Nashaat Hosny Rashed | Documentation Lead |

---

## License

This project was developed as a graduation project for the **DEPI Microsoft Machine Learning Course** (2025).
