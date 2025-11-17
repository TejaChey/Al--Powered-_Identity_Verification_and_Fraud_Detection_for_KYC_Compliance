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
      <div 
        className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" 
        style={{
          background: 'linear-gradient(135deg, #000000 0%, #1a1a1a 50%, #000000 100%)'
        }}
      >
        {/* Animated background */}
        <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-20 w-96 h-96 bg-luxury-gold rounded-full opacity-10 blur-3xl animate-pulse-slow"></div>
        <div className="absolute bottom-20 right-20 w-80 h-80 bg-luxury-neon rounded-full opacity-15 blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
        </div>

        <div className="bg-black/90 backdrop-blur-md rounded-2xl card-shadow p-12 max-w-md w-full text-center relative z-10 animate-scale-in hover-lift border border-luxury-gold/20">
          <div className="mb-6 animate-scale-in">
            <div className="w-24 h-24 bg-gradient-to-br from-luxury-gold to-luxury-neon rounded-full flex items-center justify-center mx-auto shadow-lg shadow-luxury-gold/50 animate-pulse-slow">
              <CheckCircle className="w-14 h-14 text-black" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gradient mb-4">Verification Successful!</h2>
          <p className="text-luxury-silver/70 mb-8 text-lg">
            Your Aadhaar KYC has been verified and submitted successfully.
          </p>
          <button
            onClick={() => setShowSuccess(false)}
            className="w-full gradient-accent text-black py-4 rounded-xl font-semibold hover:opacity-90 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl shadow-luxury-gold/50 relative overflow-hidden group"
          >
            <span className="relative z-10">Continue</span>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" 
      style={{
        background: 'linear-gradient(135deg, #000000 0%, #1a1a1a 50%, #000000 100%)'
      }}
    >
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-10 left-10 w-96 h-96 bg-luxury-gold rounded-full opacity-10 blur-3xl animate-pulse-slow"></div>
        <div className="absolute bottom-10 right-10 w-80 h-80 bg-luxury-neon rounded-full opacity-15 blur-3xl animate-pulse-slow" style={{ animationDelay: '1.5s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-luxury-gold rounded-full opacity-8 blur-2xl animate-pulse-slow" style={{ animationDelay: '3s' }}></div>
      </div>

      <div className="bg-black/90 backdrop-blur-md rounded-2xl card-shadow p-10 max-w-3xl w-full relative z-10 animate-scale-in hover-lift border border-luxury-gold/20">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gradient mb-3">Aadhaar KYC Verification</h1>
          <p className="text-luxury-silver/70 text-lg">Review and confirm extracted details</p>
        </div>

        <div className="bg-luxury-gold/10 border-2 border-luxury-gold/30 rounded-xl p-4 mb-6 flex items-center animate-slide-down">
          <CheckCircle className="w-6 h-6 text-luxury-gold mr-3 flex-shrink-0" />
          <span className="text-luxury-silver font-semibold">Data extracted successfully</span>
        </div>

        <div className="space-y-3 mb-6 bg-black/50 rounded-xl p-6 border border-luxury-gold/20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center py-3 border-b border-luxury-gold/20 animate-slide-up">
            <label className="text-sm font-bold text-luxury-gold">Full Name:</label>
            <span className="md:col-span-2 text-luxury-silver font-semibold text-lg">{extractedData.name}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center py-3 border-b border-luxury-gold/20 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <label className="text-sm font-bold text-luxury-gold">Date of Birth:</label>
            <span className="md:col-span-2 text-luxury-silver font-semibold">{extractedData.dob}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center py-3 border-b border-luxury-gold/20 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <label className="text-sm font-bold text-luxury-gold">Gender:</label>
            <span className="md:col-span-2 text-luxury-silver font-semibold">{extractedData.gender}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center py-3 border-b border-luxury-gold/20 animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <label className="text-sm font-bold text-luxury-gold">Aadhaar Number:</label>
            <span className="md:col-span-2 text-luxury-silver font-mono tracking-wider font-semibold text-lg bg-luxury-gold/10 px-3 py-2 rounded-lg border border-luxury-gold/20">{extractedData.aadhaarNo}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-3 animate-slide-up" style={{ animationDelay: '0.4s' }}>
            <label className="text-sm font-bold text-luxury-gold">Address:</label>
            <span className="md:col-span-2 text-luxury-silver leading-relaxed font-medium">{extractedData.address}</span>
          </div>
        </div>

        <div className="bg-luxury-gold/10 border-2 border-luxury-gold/30 rounded-xl p-4 mb-6 flex items-start animate-slide-down">
          <AlertCircle className="w-6 h-6 text-luxury-gold mt-0.5 mr-3 flex-shrink-0" />
          <p className="text-sm text-luxury-silver font-medium">
            Please verify all details carefully. If any information is incorrect, click "Re-upload Aadhaar" to submit a new document.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={handleReupload}
            className="flex-1 bg-black border-2 border-luxury-gold text-luxury-gold py-4 px-6 rounded-xl font-semibold hover:bg-luxury-gold hover:text-black transition-all duration-300 flex items-center justify-center shadow-lg hover:shadow-xl shadow-luxury-gold/50 transform hover:scale-105 active:scale-95"
          >
            <Upload className="w-5 h-5 mr-2" />
            Re-upload Aadhaar
          </button>
          
          <button
            onClick={handleConfirm}
            disabled={isConfirming}
            className="flex-1 gradient-accent text-black py-4 px-6 rounded-xl font-semibold hover:opacity-90 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-lg hover:shadow-xl shadow-luxury-gold/50 transform hover:scale-105 active:scale-95 relative overflow-hidden group"
          >
            {isConfirming ? (
              <>
                <svg className="animate-spin rounded-full h-5 w-5 border-b-2 border-black mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5 mr-2" />
                Confirm & Submit
              </>
            )}
            {!isConfirming && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
