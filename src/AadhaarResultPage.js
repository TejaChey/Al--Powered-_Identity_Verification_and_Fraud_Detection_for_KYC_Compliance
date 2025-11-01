import React, { useState } from 'react';
import { CheckCircle, AlertCircle, Upload } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function AadhaarResultPage() {
  const navigate = useNavigate();
  const [extractedData] = useState({
    name: "Rajesh Kumar Singh",
    dob: "15/08/1990",
    gender: "Male",
    aadhaarNo: "1234 5678 9012",
    address: "House No. 123, Block A, Sector 15, Bhubaneswar, Odisha - 751001"
  });

  const [isConfirming, setIsConfirming] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleConfirm = () => {
    setIsConfirming(true);
    setTimeout(() => {
      setIsConfirming(false);
      setShowSuccess(true);
    }, 1500);
  };

  const handleReupload = () => {
    navigate('/dashboard');
  };

  if (showSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{
        background: 'linear-gradient(135deg, #0369a1 0%, #0891b2 50%, #06b6d4 100%)'
      }}>
        <div className="bg-white rounded-lg shadow-2xl p-12 max-w-md w-full text-center">
          <div className="mb-6">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-3">Verification Successful!</h2>
          <p className="text-gray-600 mb-8">
            Your Aadhaar KYC has been verified and submitted successfully.
          </p>
          <button
            onClick={() => setShowSuccess(false)}
            className="w-full bg-blue-600 text-white py-3 rounded font-semibold hover:bg-blue-700 transition-colors shadow-md"
          >
            Continue
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{
      background: 'linear-gradient(135deg, #0369a1 0%, #0891b2 50%, #06b6d4 100%)'
    }}>
      <div className="bg-white rounded-lg shadow-2xl p-8 max-w-2xl w-full">
        <h1 className="text-3xl font-bold text-gray-800 mb-2 text-center">Aadhaar KYC Verification</h1>
        <p className="text-gray-600 mb-6 text-center">Review and confirm extracted details</p>

        <div className="bg-green-50 border border-green-200 rounded p-3 mb-6 flex items-center">
          <CheckCircle className="w-5 h-5 text-green-600 mr-2 flex-shrink-0" />
          <span className="text-green-800 text-sm font-medium">Data extracted successfully</span>
        </div>

        <div className="space-y-4 mb-6">
          <div className="grid grid-cols-3 gap-4 items-center py-3 border-b border-gray-200">
            <label className="text-sm font-semibold text-gray-700">Full Name:</label>
            <span className="col-span-2 text-gray-900">{extractedData.name}</span>
          </div>

          <div className="grid grid-cols-3 gap-4 items-center py-3 border-b border-gray-200">
            <label className="text-sm font-semibold text-gray-700">Date of Birth:</label>
            <span className="col-span-2 text-gray-900">{extractedData.dob}</span>
          </div>

          <div className="grid grid-cols-3 gap-4 items-center py-3 border-b border-gray-200">
            <label className="text-sm font-semibold text-gray-700">Gender:</label>
            <span className="col-span-2 text-gray-900">{extractedData.gender}</span>
          </div>

          <div className="grid grid-cols-3 gap-4 items-center py-3 border-b border-gray-200">
            <label className="text-sm font-semibold text-gray-700">Aadhaar Number:</label>
            <span className="col-span-2 text-gray-900 font-mono tracking-wider">{extractedData.aadhaarNo}</span>
          </div>

          <div className="grid grid-cols-3 gap-4 py-3">
            <label className="text-sm font-semibold text-gray-700">Address:</label>
            <span className="col-span-2 text-gray-900 leading-relaxed">{extractedData.address}</span>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-6 flex items-start">
          <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
          <p className="text-sm text-blue-900">
            Please verify all details carefully. If any information is incorrect, click "Re-upload Aadhaar" to submit a new document.
          </p>
        </div>

        <div className="flex gap-4">
          <button
            onClick={handleReupload}
            className="flex-1 bg-white border-2 border-gray-300 text-gray-700 py-3 px-6 rounded font-semibold hover:bg-gray-50 transition-colors flex items-center justify-center shadow-sm"
          >
            <Upload className="w-5 h-5 mr-2" />
            Re-upload Aadhaar
          </button>
          
          <button
            onClick={handleConfirm}
            disabled={isConfirming}
            className="flex-1 bg-blue-600 text-white py-3 px-6 rounded font-semibold hover:bg-blue-700 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed flex items-center justify-center shadow-md"
          >
            {isConfirming ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Processing...
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5 mr-2" />
                Confirm & Submit
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
