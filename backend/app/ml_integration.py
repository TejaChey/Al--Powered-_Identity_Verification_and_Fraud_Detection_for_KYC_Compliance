
import os
import sys
import numpy as np
from PIL import Image
import io
import traceback

# Deep Learning Imports
try:
    import torch
    import torch.nn as nn
    import torch.nn.functional as F
    from torch_geometric.data import Data
    from torch_geometric.nn import GCNConv
except ImportError:
    print("⚠️ PyTorch / Geometric not installed. ML features disabled.")

# Global model variables
cnn_model = None
gnn_model = None

# Paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.path.join(os.path.dirname(BASE_DIR), "models")
CNN_PATH = os.path.join(MODELS_DIR, "kyc_cnn_model.h5")
GNN_PATH = os.path.join(MODELS_DIR, "kyc_gnn_model.pth")

# ----------------------------------------------------
# 1. GNN Model Definition (Must match Friend's Code)
# ----------------------------------------------------
class FraudGNN(nn.Module):
    def __init__(self):
        super(FraudGNN, self).__init__()
        num_features = 16  # Fixed from code provided
        # Two Graph Convolutional Layers
        self.conv1 = GCNConv(num_features, 32)
        self.conv2 = GCNConv(32, 2) # Output: [Prob_Not_Fraud, Prob_Fraud]

    def forward(self, data):
        x, edge_index = data.x, data.edge_index

        x = self.conv1(x, edge_index)
        x = F.relu(x)
        x = F.dropout(x, training=self.training)
        x = self.conv2(x, edge_index)

        return F.log_softmax(x, dim=1)

# ----------------------------------------------------
# 2. Model Loading Logic
# ----------------------------------------------------
def load_models():
    """
    Load CNN and GNN models into memory.
    """
    global cnn_model, gnn_model
    
    # --- Load CNN ---
    try:
        if os.path.exists(CNN_PATH):
            import tensorflow as tf
            cnn_model = tf.keras.models.load_model(CNN_PATH)
            print(f"✅ CNN Model loaded from {CNN_PATH}")
        else:
            print(f"⚠️ CNN Model not found at {CNN_PATH}")
    except Exception as e:
        print(f"❌ Failed to load CNN Model: {e}")

    # --- Load GNN ---
    try:
        if os.path.exists(GNN_PATH):
            # Initialize the class framework
            device = torch.device('cpu')
            gnn_model = FraudGNN().to(device)
            
            # Load weights (State Dict)
            # We try strict=False in case of minor version mismatch
            try:
                state_dict = torch.load(GNN_PATH, map_location=device, weights_only=True)
                gnn_model.load_state_dict(state_dict)
            except Exception:
                # Fallback for full model pickle (if friend changed their mind)
                gnn_model = torch.load(GNN_PATH, map_location=device, weights_only=False)
                
            gnn_model.eval()
            print(f"✅ GNN Model loaded from {GNN_PATH}")
        else:
            print(f"⚠️ GNN Model not found at {GNN_PATH}")
    except Exception as e:
        print(f"❌ Error loading GNN file: {e}")

# ----------------------------------------------------
# 3. Prediction Functions
# ----------------------------------------------------

def predict_cnn_manipulation(image_bytes: bytes):
    """
    Run CNN to detect image manipulation.
    """
    if cnn_model is None: return 0.0

    try:
        # Preprocess
        img = Image.open(io.BytesIO(image_bytes)).convert('RGB')
        img = img.resize((224, 224)) 
        img_array = np.array(img) / 255.0
        img_array = np.expand_dims(img_array, axis=0)
        
        # Predict
        prediction = cnn_model.predict(img_array, verbose=0)
        score = float(prediction[0][0]) if prediction.shape[-1] == 1 else float(prediction[0][1])
        return score
    except Exception as e:
        print(f"❌ CNN Prediction Error: {e}")
        return 0.0

def predict_gnn_fraud(graph_data_dict: dict):
    """
    Run GNN on a dynamically constructed graph.
    Args:
        graph_data_dict: Contains metadata to build features/edges
           - 'connections': int (number of shared device links)
           - 'risk_score': float (heuristic risk)
           - 'features': list (optional custom features)
    """
    if gnn_model is None: return 0.0

    try:
        # 1. Feature Engineering (Map to size 16 vector)
        # We construct a feature vector based on real inputs + padding
        connections = graph_data_dict.get('connections', 0)
        risk = graph_data_dict.get('risk_score', 0)
        
        # Feature Vector [Risk, Connections, ...zeros...]
        feat_vec = [risk, float(connections)] + [0.0] * 14 # Pad to 16
        
        # Create Tensor
        x = torch.tensor([feat_vec], dtype=torch.float32) # Single node for current user
        
        # Create Edges
        # If user has connections (from MongoDB check), we simulate an edge to a "Ghost Node"
        # Since GNN layer conv2 output dimension is 2 (Not Fraud/Fraud), it expects a graph.
        
        # For simplicity in this demo: Self-loop or Star graph based on 'connections' count.
        # If connections > 0, we add random neighbor nodes to represent the "Ring".
        
        num_neighbors = min(connections, 5) # Cap at 5 for performance
        if num_neighbors > 0:
            # Create feature vectors for neighbors (random/high risk)
            x_neighbors = torch.randn((num_neighbors, 16))
            x = torch.cat([x, x_neighbors], dim=0)
            
            # Create edges (Center <-> Neighbors)
            src = [0] * num_neighbors + list(range(1, num_neighbors+1))
            dst = list(range(1, num_neighbors+1)) + [0] * num_neighbors
            edge_index = torch.tensor([src, dst], dtype=torch.long)
        else:
            # Single node, self loop
            edge_index = torch.tensor([[0], [0]], dtype=torch.long)
            
        data = Data(x=x, edge_index=edge_index)
        
        # Predict
        with torch.no_grad():
            out = gnn_model(data)
            # out is log_softmax -> [log(prob_safe), log(prob_fraud)]
            # We take index 0 (current user)
            user_out = out[0] 
            prob = torch.exp(user_out) # Convert log_prob to prob
            fraud_prob = prob[1].item() # Probability of Class 1 (Fraud)
            
            return fraud_prob
            
    except Exception as e:
        print(f"❌ GNN Prediction Error: {e}")
        # traceback.print_exc()
        return 0.0

# Initial load
load_models()
