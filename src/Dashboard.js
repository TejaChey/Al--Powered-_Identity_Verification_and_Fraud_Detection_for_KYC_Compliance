import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { uploadDocument, getUserDocs } from "./api";

function Dashboard() {
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [message, setMessage] = useState("");
  const [docs, setDocs] = useState([]);

  //  On load, check token & fetch docs
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/"); // redirect to login
    } else {
      fetchDocuments(token);
    }
  }, [navigate]);

  const fetchDocuments = async (token) => {
    try {
      const data = await getUserDocs(token);
      setDocs(data.documents || []);
    } catch (err) {
      setMessage("Failed to fetch documents or not authorized.");
    }
  };

  //  Handle file input + preview
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      if (file.type.startsWith("image/")) {
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
      } else {
        setPreviewUrl(null);
      }
    }
  };

  // Upload Aadhaar/PAN document
  const handleExtractData = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("You are not logged in!");
      navigate("/");
      return;
    }

    if (!selectedFile) {
      alert("Please select a file first");
      return;
    }

    try {
      setMessage(" Uploading and extracting data...");
      await uploadDocument(token, selectedFile);
      setMessage("Document uploaded successfully!");
      fetchDocuments(token);
    } catch (err) {
      setMessage(" Upload failed! Please check your file or token.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  return (
    <div
      className="min-h-screen relative overflow-hidden"
      style={{
        background:
          "linear-gradient(135deg, #0066cc 0%, #00bfb3 50%, #0099cc 100%)",
      }}
    >
      {/* Decorative elements */}
      <div
        className="absolute top-20 left-10 w-32 h-32 rounded-full opacity-20"
        style={{
          background:
            "radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%)",
          filter: "blur(2px)",
        }}
      ></div>
      <div
        className="absolute top-40 left-32 w-24 h-24 rounded-full opacity-20"
        style={{
          background:
            "radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%)",
          filter: "blur(2px)",
        }}
      ></div>
      <div
        className="absolute bottom-32 right-20 w-40 h-40 rounded-full opacity-20"
        style={{
          background:
            "radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%)",
          filter: "blur(2px)",
        }}
      ></div>

      {/* Aadhaar Logo Section */}
      <div className="absolute left-10 top-1/2 transform -translate-y-1/2 hidden lg:block">
        <div className="relative">
          {/* Magnifying glass circle */}
          <div className="w-72 h-72 rounded-full border-8 border-gray-300 bg-white bg-opacity-10 backdrop-blur-sm flex items-center justify-center relative">
            {/* Dotted pattern overlay */}
            <div className="absolute inset-0 rounded-full overflow-hidden">
              <div
                className="w-full h-full"
                style={{
                  backgroundImage:
                    "radial-gradient(circle, rgba(0,0,0,0.4) 1px, transparent 1px)",
                  backgroundSize: "8px 8px",
                }}
              ></div>
            </div>

            {/* Aadhaar fingerprint icon */}
            <div className="relative z-10 text-center">
              <div className="text-6xl mb-2">
                <svg
                  viewBox="0 0 24 24"
                  className="w-32 h-32 mx-auto"
                  fill="currentColor"
                >
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm0-6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                </svg>
              </div>
              <div className="text-2xl font-bold text-gray-800 tracking-wider">
                AADHAAR
              </div>
            </div>
          </div>
          {/* Magnifying glass handle */}
          <div
            className="absolute bottom-0 right-0 w-16 h-32 bg-gray-700 rounded-full transform rotate-45 origin-top-left"
            style={{
              left: "70%",
              top: "70%",
            }}
          ></div>
          <div
            className="absolute bottom-0 right-0 w-12 h-24 bg-gray-900 rounded-full transform rotate-45 origin-top-left"
            style={{
              left: "72%",
              top: "72%",
            }}
          ></div>
        </div>

        {/* Decorative arrows */}
        <div className="absolute -left-20 top-20 space-y-4">
          <div className="text-red-500 text-3xl">▶</div>
          <div className="text-red-500 text-3xl">▶</div>
          <div className="text-red-500 text-3xl">▶</div>
          <div className="text-red-500 text-3xl">▶</div>
        </div>
        <div className="absolute -left-10 top-40 space-y-4">
          <div className="text-green-400 text-3xl">▶</div>
          <div className="text-green-400 text-3xl">▶</div>
          <div className="text-yellow-400 text-3xl">▶</div>
        </div>
      </div>

      {/* Main Upload Card */}
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="bg-white rounded-lg shadow-2xl p-8 w-full max-w-md relative z-10">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800 text-center">
              Aadhaar KYC Upload
            </h1>
            <button
              onClick={handleLogout}
              className="text-sm bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition"
            >
              Logout
            </button>
          </div>

          <div className="space-y-6">
            {/* File Input */}
            <div>
              <input
                type="file"
                id="fileInput"
                onChange={handleFileChange}
                accept="image/*,.pdf"
                className="hidden"
              />
              <label
                htmlFor="fileInput"
                className="inline-block px-4 py-2 bg-gray-200 text-gray-700 rounded cursor-pointer hover:bg-gray-300 transition-colors"
              >
                Choose file
              </label>
              <span className="ml-3 text-gray-600 text-sm">
                {selectedFile ? selectedFile.name : "No file chosen"}
              </span>
            </div>

            {/* Preview Area */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 min-h-[200px] flex items-center justify-center bg-gray-50">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="max-w-full max-h-64 object-contain"
                />
              ) : (
                <p className="text-gray-500 text-center">
                  File preview will appear here.
                </p>
              )}
            </div>

            {/* Upload Button */}
            <button
              onClick={handleExtractData}
              className="w-full py-3 px-6 bg-blue-600 text-white font-medium rounded hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Extract Data
            </button>

            {/* Upload Status */}
            {message && (
              <p className="text-center text-gray-700 text-sm">{message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Uploaded Docs Section */}
      {docs.length > 0 && (
        <div className="absolute bottom-0 left-0 right-0 bg-white bg-opacity-90 backdrop-blur-sm p-4 shadow-inner">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            Uploaded Documents
          </h3>
          <ul className="max-h-40 overflow-y-auto">
            {docs.map((doc) => (
              <li
                key={doc._id}
                className="flex justify-between text-sm text-gray-700 border-b py-1"
              >
                <span>{doc.filename}</span>
                <span className="text-gray-500">{doc.docType}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
