🧾 KYC Verification System (FastAPI + React)

This project is a Full Stack KYC (Know Your Customer) Verification System that allows users to sign up, log in securely, and upload Aadhaar/PAN documents. The backend performs OCR (Optical Character Recognition) using Tesseract to extract data from the uploaded documents, and the frontend provides a clean, modern dashboard for interaction.

🚀 Tech Stack

Frontend:

React (Create React App)

Tailwind CSS

React Router DOM

React Icons

Backend:

FastAPI

MongoDB (with PyMongo)

JWT Authentication

Python Tesseract (OCR)

⚙️ Project Setup
1️⃣ Clone the Repository
git clone https://github.com/your-username/KYC_VERIFICATION_SYSTEM.git
cd KYC_VERIFICATION_SYSTEM

2️⃣ Backend Setup
📁 Navigate to backend folder
cd backend

🧩 Create and activate virtual environment
python -m venv venv
venv\Scripts\activate   # on Windows
# or
source venv/bin/activate   # on Mac/Linux

📦 Install dependencies
pip install -r requirements.txt

🔐 Create .env file

Create a .env file in your backend folder:

MONGO_URI=your_mongodb_connection_string
SECRET_KEY=your_secret_key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

▶️ Run backend
uvicorn app.main:app --reload


Backend will run on:
👉 http://127.0.0.1:8000

Swagger docs available at:
👉 http://127.0.0.1:8000/docs

3️⃣ Frontend Setup
📁 Navigate to frontend folder
cd frontend

📦 Install dependencies
npm install

▶️ Run the app
npm start


Frontend will run on:
👉 http://localhost:3000

Environment: Point the frontend to your backend API
Create a `.env` file in the frontend root with the backend URL, for example:

REACT_APP_API_URL=http://127.0.0.1:8000

This ensures the frontend calls endpoints like `/docs/upload`, `/verify-doc`, and `/fraud-score` on your backend.

💡 Features

✅ User Signup & Login (JWT Authentication)
✅ Secure MongoDB data storage
✅ Document upload (Aadhaar / PAN)
✅ OCR-based data extraction using Tesseract
✅ User-specific dashboard displaying uploaded documents
✅ Clean, responsive UI built with Tailwind CSS

📁 Folder Structure
KYC_VERIFICATION_SYSTEM/
│
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── db.py
│   │   ├── utils.py
│   │   ├── ocr.py
│   ├── .env
│   ├── requirements.txt
│
└── frontend/
    ├── src/
    │   ├── api.js
    │   ├── Login.js
    │   ├── SignUp.js
    │   ├── Dashboard.js
    │   ├── App.js
    │   └── index.js
    ├── package.json

🧠 How It Works

Signup / Login: User details stored securely with hashed passwords (bcrypt).

JWT Tokens: Generated upon login and used for authentication.

Upload Document: Image is sent to backend via FastAPI.

OCR Processing: Text extracted using Tesseract and parsed for Aadhaar/PAN info.

MongoDB Storage: Data saved under each authenticated user.

Dashboard: Displays uploaded documents and extracted metadata.

🛡️ Environment Variables
Variable	Description
MONGO_URI	MongoDB connection string
SECRET_KEY	Secret key for JWT
ALGORITHM	JWT encoding algorithm (default: HS256)
ACCESS_TOKEN_EXPIRE_MINUTES	JWT token expiry time
🧩 API Endpoints
Method	Endpoint	Description
POST	/auth/signup	Register a new user (returns access_token)
POST	/auth/login	Authenticate and get JWT token (returns access_token)
POST	/docs/upload	Upload Aadhaar or PAN image (authenticated)
GET	/docs/my-docs	Fetch uploaded user documents (authenticated)
GET	/	API health check
	
🧾 License

This project is licensed under the MIT License.