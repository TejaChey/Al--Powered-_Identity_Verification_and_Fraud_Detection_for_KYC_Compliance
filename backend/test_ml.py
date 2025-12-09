
import os
import sys

# Add current directory to path so we can import app modules
sys.path.append(os.getcwd())

print("🔍 Testing ML Model Integration...")

try:
    from app import ml_integration
    print("\n✅ Module 'app.ml_integration' imported successfully.")
except ImportError as e:
    print(f"\n❌ Failed to import app.ml_integration: {e}")
    sys.exit(1)

# Check CNN
print("\n[1] Checking CNN (Image Manipulation Model)...")
if ml_integration.cnn_model:
    print("   ✅ CNN Model is LOADED into memory.")
    try:
        # Create a dummy white image (100x100)
        from PIL import Image
        import io
        img = Image.new('RGB', (100, 100), color = 'white')
        img_byte_arr = io.BytesIO()
        img.save(img_byte_arr, format='JPEG')
        img_bytes = img_byte_arr.getvalue()
        
        # Predict
        print("   ⏳ Running test prediction...")
        score = ml_integration.predict_cnn_manipulation(img_bytes)
        print(f"   ✅ Prediction Successful! Score: {score}")
    except Exception as e:
        print(f"   ❌ Prediction Failed: {e}")
else:
    print("   ❌ CNN Model variable is None. (Did you install tensorflow? Check 'models' folder path.)")
    print(f"      Expected Path: {ml_integration.CNN_PATH}")

# Check GNN
print("\n[2] Checking GNN (Fraud Ring Graph Model)...")
if ml_integration.gnn_model:
    print("   ✅ GNN Model is LOADED into memory.")
    try:
        # Dummy features (Dictionary format for dynamic graph)
        dummy_input = {
            "connections": 2, # Simulate a small ring
            "risk_score": 0.8,
            "features": []
        }
        print("   ⏳ Running test prediction...")
        score_gnn = ml_integration.predict_gnn_fraud(dummy_input)
        print(f"   ✅ Prediction Successful! Score: {score_gnn}")
    except Exception as e:
        print(f"   ❌ Prediction Failed: {e}")
else:
    print("   ❌ GNN Model variable is None. (Did you install torch? Check 'models' folder path.)")
    print(f"      Expected Path: {ml_integration.GNN_PATH}")

print("\n--- Test Complete ---")
