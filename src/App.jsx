// src/App.jsx 

import React, { useState } from 'react';

// The main application component
function App() {
    // STATE: Used to manage data that changes the UI
    const [selectedFile, setSelectedFile] = useState(null);
    const [status, setStatus] = useState('');
    const [previewURL, setPreviewURL] = useState(''); 
    const [isLoading, setIsLoading] = useState(false); 

    // --- STYLE OBJECTS FOR CENTERING AND BACKGROUND ---

    // Style for the full screen wrapper (to center content and hold the background)
    const FullScreenWrapperStyle = {
        minHeight: '100vh', // Takes full height of the viewport
        width: '100vw',
        display: 'flex',
        justifyContent: 'center', // Center horizontally
        alignItems: 'center',     // Center vertically
        
        // Background Image Styles
        // IMPORTANT: The path is relative to the 'public' folder!
        backgroundImage: "url('/bg-aadhaar.jpg')", 
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
    };

    // Style for the inner content box (to make it stand out from the background)
    const ContentBoxStyle = {
        maxWidth: '600px',
        padding: '40px',
        backgroundColor: 'rgba(255, 255, 255, 0.95)', // Semi-transparent white box
        borderRadius: '10px',
        boxShadow: '0 8px 25px rgba(0, 0, 0, 0.2)', // Soft shadow
    };
    // ----------------------------------------------------


    // HANDLERS: Functions that run on user action
    const handleFileChange = (event) => {
        const file = event.target.files[0];
        setSelectedFile(file);
        setStatus(''); 
        
        if (file) {
            setPreviewURL(URL.createObjectURL(file));
        } else {
            setPreviewURL('');
        }
    };
    
    const uploadAadhaar = async () => {
        if (!selectedFile) return;

        setIsLoading(true);
        setStatus('Uploading and extracting data...');

        const formData = new FormData();
        formData.append("file", selectedFile); 

        try {
            const response = await fetch("http://localhost:5000/api/extract", {
                method: "POST",
                body: formData
            });

            if (!response.ok) {
                // If response is bad (e.g., 404, 500), throw an error
                throw new Error("Server error or invalid file format.");
            }

            const data = await response.json();
            
            console.log("Successfully Extracted Data:", data);
            // We just update the status, since we aren't switching to a ResultPage
            setStatus('Success! Data extracted. Check console for details.'); 

        } catch (error) {
            console.error("Upload Error:", error);
            setStatus(`Error: ${error.message}. Please try again.`);
        } finally {
            setIsLoading(false);
        }
    };


    // JSX: What the component renders to the screen
    return (
        // Apply the full-screen style here
        <div style={FullScreenWrapperStyle}> 
            {/* Apply the content box style here */}
            <div style={ContentBoxStyle}>
                <h1>Aadhaar KYC Upload</h1>

                {/* Input to select file */}
                <input 
                    type="file" 
                    accept="image/*, application/pdf" 
                    onChange={handleFileChange}
                    style={{ display: 'block', margin: '20px 0' }}
                    disabled={isLoading}
                />
                
                {/* File Preview Area */}
                <div style={{ padding: '10px', border: '1px dashed #aaa', minHeight: '100px', textAlign: 'center', marginTop: '15px', marginBottom: '15px' }}>
                    {previewURL && selectedFile.type.startsWith('image/') ? (
                        <img src={previewURL} alt="Aadhaar Document Preview" style={{ maxWidth: '100%', maxHeight: '300px' }} />
                    ) : (
                        <p>{selectedFile ? `File selected: ${selectedFile.name}` : 'File preview will appear here.'}</p>
                    )}
                </div>
                
                {/* Extract Data Button */}
                <button 
                    onClick={uploadAadhaar} 
                    style={{ marginTop: '20px', padding: '10px 20px', cursor: 'pointer', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px' }}
                    disabled={!selectedFile || isLoading} 
                >
                    {isLoading ? 'Extracting...' : 'Extract Data'}
                </button>

                {/* Status Message */}
                <p style={{marginTop: '15px', color: status.includes('Error') ? 'red' : 'green'}}>{status}</p>
            </div>
        </div>
    );
}

// Export the App component
export default App;