# 🛡️ AI-Powered KYC Verification System
> A Next-Gen "Know Your Customer" (KYC) compliance solution leveraging Advanced AI, Graph Neural Networks, and Real-Time OCR for fraud detection and identity verification.
![Project Banner](https://via.placeholder.com/1200x400.png?text=KYC+Neural+Network+System)

## 🚀 Overview
This project is a robust **Identity Verification & Fraud Detection System** designed to automate the KYC process. It combines a high-performance **FastAPI** backend with a futuristic **React** frontend to provide:
1.  **Instant Document Parsing**: Extracts data from Aadhaar, PAN, and Driving Licenses using Tesseract & EasyOCR.
2.  **AI Fraud Detection**: Uses a **Graph Neural Network (GNN)** to detect fraud rings and a **CNN** to identify image manipulation (Photoshop/Editing).
3.  **Real-Time Feedback**: Client-side image quality analysis ensures users upload readable documents.
4.  **Cyber-Secure UI**: A premium, "Glassmorphism" interface with role-based access control (RBAC).
---
## ✨ Key Features
### 🧠 Artificial Intelligence Module
- **Graph Neural Network (GNN)**: Analyzes user connections and device fingerprints to detect "Sybil attacks" and organized fraud rings.
- **CNN Image Analysis**: Detects digital tampering or "deepfake" documents.
- **Live OCR**: Immediate text extraction feedback (Aadhaar/PAN masking included).
### 🖥️ Frontend Experience
- **Futuristic UI**: "Cyber-Glass" aesthetic with animated backgrounds and smooth tab transitions.
- **Smart Uploads**: Drag-and-drop zone with instant quality checks (blur detection).
- **Interactive Dashboard**: Skeleton loading screens, Toast notifications, and real-time status updates.
- **Admin Panel**: Dedicated portal for compliance officers to Approve/Reject submissions and view fraud insights.
### 🔒 Security & Backend
- **Device Fingerprinting**: Captures IP, User-Agent, and Screen resolution to identify suspicious device reuse.
- **AES-256 Encryption**: Sensitive data handled securely.
- **RBAC**: Strict separation between [User](cci:2://file:///t:/Infosys%20Internship/Project/Infosys_Internship6.0_Backend/app/models.py:3:0-9:57) and [Admin](cci:1://file:///t:/Infosys%20Internship/Project/Infosys_Internship6.0_Frontend/src/components/AdminPanel.jsx:29:0-387:1) roles.
---
## 🛠️ Tech Stack
### Frontend
- **Framework**: React.js (CRA)
- **Styling**: TailwindCSS (Custom "Cyber" Theme)
- **Icons**: Lucide React
- **State Management**: React Hooks & Context API
- **Visualization**: Chart.js
### Backend
- **Framework**: FastAPI (Python)
- **Database**: MongoDB (Motor Async Driver)
- **ML/AI**: PyTorch (GNN), TensorFlow (CNN), Scikit-Learn
- **OCR Engine**: EasyOCR, Tesseract (pytesseract)
- **Authentication**: JWT (JSON Web Tokens) with Bcrypt hashing
---
## 📦 Installation & Setup
### Prerequisites
- Python 3.9+
- Node.js 16+
- Tesseract-OCR installed on your system.
### 1. Backend Setup

# Create virtual environment
python -m venv venv
# Windows: venv\Scripts\activate
# Mac/Linux: source venv/bin/activate
# Install dependencies
pip install -r requirements.txt
# Run Server
uvicorn app.main:app --reload
Backend runs on: http://localhost:8000

2. Frontend Setup
bash
cd Infosys_Internship6.0_Frontend
# Install node modules
npm install
# Start React App
npm start
Frontend runs on: http://localhost:3000

📂 Project Structure
bash
📦 Project Root
 ┣ 📂 Infosys_Internship6.0_Backend  # API & AI Logic
 ┃ ┣ 📂 app
 ┃ ┃ ┣ 📂 mobile_models  # GNN/CNN Models
 ┃ ┃ ┣ 📜 fraud.py       # Fraud Detection Engine
 ┃ ┃ ┣ 📜 ocr.py         # OCR Processing Logic
 ┃ ┃ ┗ 📜 main.py        # App Entry Point
 ┃ ┗ 📜 requirements.txt
 ┃
 ┗ 📂 Infosys_Internship6.0_Frontend # React UI
   ┣ 📂 src
   ┃ ┣ 📂 components     # Dashboard, VerificationCard, AdminPanel
   ┃ ┣ 📜 Dashboard.js   # Main User Hub
   ┃ ┗ 📜 index.css      # Tailwind & Animations
   ┗ 📜 package.json
🛡️ API Endpoints (Snapshot)
Method	Endpoint	Description
POST	/auth/login	Authenticate user & get Token
POST	/upload/files	Upload multiple documents (AI Scan)
GET	/compliance/docs	Fetch user submissions
GET	/admin/stats	Get system-wide fraud stats

👨‍💻 Contributors
Y Teja- Lead Developer
