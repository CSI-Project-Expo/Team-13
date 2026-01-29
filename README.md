# Do4U 🚀

### An AI‑Powered Hyperlocal Favour Exchange Platform

Do4U is a full‑stack web application that enables users to request short‑term favours (tasks) and connect with verified helpers called _Genies_. The platform focuses on **trust, fair pricing, and safe task execution**, using AI-assisted pricing and a transparent job lifecycle.

---

## 📌 Problem Statement

People often need quick, local help for everyday tasks such as pet walking, household chores, or academic assistance. Existing platforms lack a secure, transparent, and intelligent system for hyperlocal, short-duration tasks involving strangers. Do4U addresses this gap by combining **AI-driven price suggestions**, **verified helpers**, and an **end-to-end task management workflow**.

---

## 🎯 MVP Features (Locked)

### Core

- User, Genie, and Admin authentication (Firebase Auth)
- Role-based access control
- User & Genie profiles
- Genie identity verification with admin approval

### Job Flow

- Post a favour (task)
- Job lifecycle: `Posted → Accepted → In Progress → Completed`
- Skill and location-based genie matching
- Bargaining (counter-offer) system

### AI (RAG-Based)

- AI-assisted price suggestion
- Pricing fairness warnings (advisory)

### Payments (Mocked)

- In-app wallet (mock)
- Escrow simulation
- Payment release on job completion

### Trust & Safety

- Ratings and reviews
- Complaint raising with evidence upload
- Admin-led dispute resolution

### Admin

- Genie verification dashboard
- User & genie management
- Complaint resolution panel

---

## 🧱 Tech Stack

### Frontend

- React (Vite)
- Tailwind CSS
- React Router
- Axios
- Firebase Client SDK

### Backend

- FastAPI (Python)
- REST APIs
- Firebase Admin SDK
- Role-based access control (RBAC)

### Database & Services

- Firebase Firestore (primary database)
- Firebase Authentication
- Firebase Storage (documents & evidence)
- Firebase Cloud Messaging (notifications)

### AI

- Retrieval‑Augmented Generation (RAG)
- FAISS (vector store)
- SentenceTransformers / OpenAI embeddings
- LLM: Gemini / Mistral / OpenAI
- LangChain / LlamaIndex

---

## 🧩 System Architecture

Frontend (React)
|
| REST APIs
|
Backend (FastAPI)
|
|-----------------------|
| |
Firebase Services AI Layer (RAG)
(Auth, Firestore, (FAISS + LLM)
Storage, FCM)

---

## 📁 Project Folder Structure

do4U/
├── frontend/
│ ├── src/
│ │ ├── components/
│ │ ├── pages/
│ │ ├── services/
│ │ ├── context/
│ │ ├── routes/
│ │ └── utils/
│ └── package.json
│
├── backend/
│ ├── app/
│ │ ├── core/
│ │ ├── models/
│ │ ├── schemas/
│ │ ├── routes/
│ │ ├── services/
│ │ └── utils/
│ └── requirements.txt
│
├── ai/
│ ├── data/
│ ├── embeddings/
│ ├── vector_store/
│ ├── rag/
│ └── prompts/
│
├── docs/
│ ├── architecture.md
│ ├── api_endpoints.md
│ ├── demo_flow.md
│ └── future_scope.md
│
└── README.md

---

## 🧪 Demo Flow (MVP)

1. User logs in and posts a favour
2. AI suggests a fair price
3. Genie receives the job and sends a counter-offer
4. User selects a genie
5. Job progresses through status updates
6. Job is completed and payment is released (mock)
7. User rates the genie

---


## 🚀 Deployment

- Frontend: Vercel / Netlify
- Backend: Render / Railway
- Firebase: Auth, Firestore, Storage, Notifications

---

## 🔮 Future Scope

- Real payment gateway integration
- Live GPS tracking
- Emergency SOS system
- Advanced trust score
- Mobile application

---

## 📄 License

This project is developed by sea plus plus.
