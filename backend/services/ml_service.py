import asyncio
import os
import pickle
import joblib
from datetime import datetime, timedelta
from typing import List, Dict, Optional, Tuple, Any
from pathlib import Path
import json
import gc

import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest, RandomForestClassifier
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, confusion_matrix
from sklearn.cluster import DBSCAN
try:
    import tensorflow as tf
    from tensorflow import keras
    from tensorflow.keras import layers, models
    TENSORFLOW_AVAILABLE = True
except Exception:
    TENSORFLOW_AVAILABLE = False
    tf = None
    keras = None
    layers = None
    models = None
try:
    import torch
    import torch.nn as nn
    import torch.optim as optim
    from torch.utils.data import DataLoader, TensorDataset
    TORCH_AVAILABLE = True
except Exception:
    TORCH_AVAILABLE = False
    torch = None
    nn = None
    optim = None
    DataLoader = None
    TensorDataset = None
from loguru import logger

from ..core.config import settings

class NetworkTrafficLSTM(nn.Module):
    """LSTM model for network traffic anomaly detection"""
    
    def __init__(self, input_size: int, hidden_size: int = 128, num_layers: int = 2, dropout: float = 0.2):
        super(NetworkTrafficLSTM, self).__init__()
        self.hidden_size = hidden_size
        self.num_layers = num_layers
        
        self.lstm = nn.LSTM(
            input_size=input_size,
            hidden_size=hidden_size,
            num_layers=num_layers,
            dropout=dropout,
            batch_first=True
        )
        
        self.classifier = nn.Sequential(
            nn.Linear(hidden_size, 64),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(64, 32),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(32, 1),
            nn.Sigmoid()
        )
        
    def forward(self, x):
        # LSTM forward pass
        lstm_out, (hidden, cell) = self.lstm(x)
        
        # Use the last output for classification
        last_output = lstm_out[:, -1, :]
        
        # Classification
        output = self.classifier(last_output)
        
        return output

class IndustrialProtocolCNN(nn.Module):
    """CNN model for industrial protocol analysis"""
    
    def __init__(self, input_channels: int = 1, num_classes: int = 5):
        super(IndustrialProtocolCNN, self).__init__()
        
        self.conv_layers = nn.Sequential(
            nn.Conv1d(input_channels, 64, kernel_size=3, padding=1),
            nn.ReLU(),
            nn.MaxPool1d(2),
            nn.Conv1d(64, 128, kernel_size=3, padding=1),
            nn.ReLU(),
            nn.MaxPool1d(2),
            nn.Conv1d(128, 256, kernel_size=3, padding=1),
            nn.ReLU(),
            nn.AdaptiveAvgPool1d(1)
        )
        
        self.classifier = nn.Sequential(
            nn.Linear(256, 128),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(128, 64),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(64, num_classes)
        )
        
    def forward(self, x):
        x = self.conv_layers(x)
        x = x.view(x.size(0), -1)  # Flatten
        x = self.classifier(x)
        return x

class MLService:
    """Machine Learning service for cybersecurity threat detection"""
    
    def __init__(self):
        self.models = {}
        self.scalers = {}
        self.encoders = {}
        self.model_metadata = {}
        self.training_data = []
        self.device = (torch.device('cuda' if torch and torch.cuda.is_available() else 'cpu') if TORCH_AVAILABLE else 'cpu')
        
        # Model paths
        self.model_dir = Path(settings.ML_MODEL_DIR)
        self.model_dir.mkdir(parents=True, exist_ok=True)
        
    async def initialize(self):
        """Initialize ML service and load existing models"""
        try:
            await self._load_existing_models()
            await self._initialize_default_models()
            logger.info(f"ML Service initialized with device: {self.device}")
        except Exception as e:
            logger.error(f"Error initializing ML service: {e}")
            
    async def _load_existing_models(self):
        """Load existing trained models from disk"""
        try:
            model_files = list(self.model_dir.glob('*.pkl')) + list(self.model_dir.glob('*.joblib'))
            
            for model_file in model_files:
                try:
                    model_name = model_file.stem
                    
                    if model_file.suffix == '.pkl':
                        with open(model_file, 'rb') as f:
                            self.models[model_name] = pickle.load(f)
                    elif model_file.suffix == '.joblib':
                        self.models[model_name] = joblib.load(model_file)
                        
                    logger.info(f"Loaded model: {model_name}")
                    
                except Exception as e:
                    logger.warning(f"Failed to load model {model_file}: {e}")
                    
            # Load PyTorch models
            pytorch_models = list(self.model_dir.glob('*.pth'))
            for model_file in pytorch_models:
                try:
                    model_name = model_file.stem
                    # Model loading will be handled when needed
                    logger.info(f"Found PyTorch model: {model_name}")
                except Exception as e:
                    logger.warning(f"Failed to load PyTorch model {model_file}: {e}")
                    
        except Exception as e:
            logger.error(f"Error loading existing models: {e}")
            
    async def _initialize_default_models(self):
        """Initialize default models if none exist"""
        try:
            # Initialize Isolation Forest for anomaly detection
            if 'isolation_forest' not in self.models:
                self.models['isolation_forest'] = IsolationForest(
                    contamination=0.1,
                    random_state=42,
                    n_estimators=100
                )
                
            # Initialize Random Forest for classification
            if 'random_forest' not in self.models:
                self.models['random_forest'] = RandomForestClassifier(
                    n_estimators=100,
                    random_state=42,
                    max_depth=10
                )
                
            # Initialize DBSCAN for clustering
            if 'dbscan' not in self.models:
                self.models['dbscan'] = DBSCAN(
                    eps=0.5,
                    min_samples=5
                )
                
            # Initialize scalers
            if 'standard_scaler' not in self.scalers:
                self.scalers['standard_scaler'] = StandardScaler()
                
            # Initialize encoders
            if 'label_encoder' not in self.encoders:
                self.encoders['label_encoder'] = LabelEncoder()
                
            logger.info("Default models initialized")
            
        except Exception as e:
            logger.error(f"Error initializing default models: {e}")
            
    async def analyze_network_traffic(self, features: List[Dict]) -> List[Dict]:
        """Analyze network traffic features for threats"""
        try:
            if not features:
                return []
                
            # Convert features to DataFrame
            df = pd.DataFrame(features)
            
            # Preprocess features
            processed_features = await self._preprocess_features(df)
            
            # Run multiple models for ensemble prediction
            predictions = []
            
            for i, feature_row in processed_features.iterrows():
                prediction = {
                    'timestamp': features[i].get('timestamp'),
                    'threat_score': 0.0,
                    'threat_type': 'Normal',
                    'confidence': 0.0,
                    'anomaly_score': 0.0,
                    'model_predictions': {}
                }
                
                # Isolation Forest prediction
                if 'isolation_forest' in self.models:
                    try:
                        feature_array = feature_row.values.reshape(1, -1)
                        anomaly_score = self.models['isolation_forest'].decision_function(feature_array)[0]
                        is_anomaly = self.models['isolation_forest'].predict(feature_array)[0] == -1
                        
                        prediction['anomaly_score'] = float(anomaly_score)
                        prediction['model_predictions']['isolation_forest'] = {
                            'is_anomaly': bool(is_anomaly),
                            'score': float(anomaly_score)
                        }
                        
                        if is_anomaly:
                            prediction['threat_score'] = max(prediction['threat_score'], 0.7)
                            prediction['threat_type'] = 'Anomaly'
                            
                    except Exception as e:
                        logger.debug(f"Isolation Forest prediction failed: {e}")
                        
                # Random Forest prediction
                if 'random_forest' in self.models:
                    try:
                        feature_array = feature_row.values.reshape(1, -1)
                        
                        # Check if model is trained
                        if hasattr(self.models['random_forest'], 'classes_'):
                            proba = self.models['random_forest'].predict_proba(feature_array)[0]
                            pred_class = self.models['random_forest'].predict(feature_array)[0]
                            
                            prediction['model_predictions']['random_forest'] = {
                                'predicted_class': str(pred_class),
                                'probabilities': proba.tolist()
                            }
                            
                            # Update threat score based on classification
                            max_proba = max(proba)
                            if pred_class != 0:  # Assuming 0 is normal class
                                prediction['threat_score'] = max(prediction['threat_score'], float(max_proba))
                                prediction['threat_type'] = f'Classification_{pred_class}'
                                
                    except Exception as e:
                        logger.debug(f"Random Forest prediction failed: {e}")
                        
                # Industrial protocol specific analysis
                industrial_threat = await self._analyze_industrial_protocols(features[i])
                if industrial_threat['is_threat']:
                    prediction['threat_score'] = max(prediction['threat_score'], industrial_threat['score'])
                    prediction['threat_type'] = industrial_threat['type']
                    
                # Calculate final confidence
                prediction['confidence'] = min(prediction['threat_score'] * 1.2, 1.0)
                
                predictions.append(prediction)
                
            return predictions
            
        except Exception as e:
            logger.error(f"Error analyzing network traffic: {e}")
            return [{'error': str(e)} for _ in features]
            
    async def _preprocess_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Preprocess features for ML models"""
        try:
            # Create a copy to avoid modifying original
            processed_df = df.copy()
            
            # Handle missing values
            processed_df = processed_df.fillna(0)
            
            # Encode categorical features
            categorical_columns = ['protocol', 'flags']
            for col in categorical_columns:
                if col in processed_df.columns:
                    processed_df[col] = processed_df[col].astype(str)
                    
                    # Simple encoding for now
                    unique_values = processed_df[col].unique()
                    value_map = {val: idx for idx, val in enumerate(unique_values)}
                    processed_df[col] = processed_df[col].map(value_map)
                    
            # Convert IP addresses to numerical features
            ip_columns = ['src_ip', 'dst_ip']
            for col in ip_columns:
                if col in processed_df.columns:
                    processed_df[col] = processed_df[col].apply(self._ip_to_int)
                    
            # Select numerical features only
            numerical_columns = processed_df.select_dtypes(include=[np.number]).columns
            processed_df = processed_df[numerical_columns]
            
            # Scale features if scaler is fitted
            if 'standard_scaler' in self.scalers and hasattr(self.scalers['standard_scaler'], 'mean_'):
                try:
                    scaled_features = self.scalers['standard_scaler'].transform(processed_df)
                    processed_df = pd.DataFrame(scaled_features, columns=processed_df.columns, index=processed_df.index)
                except Exception as e:
                    logger.debug(f"Scaling failed, using unscaled features: {e}")
                    
            return processed_df
            
        except Exception as e:
            logger.error(f"Error preprocessing features: {e}")
            return df
            
    def _ip_to_int(self, ip_str) -> int:
        """Convert IP address string to integer"""
        try:
            if pd.isna(ip_str) or ip_str is None:
                return 0
            parts = str(ip_str).split('.')
            if len(parts) != 4:
                return 0
            return sum(int(part) << (8 * (3 - i)) for i, part in enumerate(parts))
        except:
            return 0
            
    async def _analyze_industrial_protocols(self, features: Dict) -> Dict:
        """Analyze industrial protocol specific threats"""
        threat_info = {
            'is_threat': False,
            'score': 0.0,
            'type': 'Normal'
        }
        
        try:
            # Modbus analysis
            if features.get('is_modbus', False):
                # Check for suspicious Modbus activity
                if features.get('dst_port') == 502:
                    # Unusual payload sizes or patterns
                    payload_size = features.get('payload_size', 0)
                    if payload_size > 1000 or payload_size == 0:
                        threat_info['is_threat'] = True
                        threat_info['score'] = 0.8
                        threat_info['type'] = 'Modbus_Anomaly'
                        
            # S7 protocol analysis
            if features.get('is_s7', False):
                # Check for unauthorized S7 communication
                if features.get('dst_port') == 102:
                    # S7 communication outside business hours might be suspicious
                    timestamp = features.get('timestamp')
                    if timestamp:
                        hour = datetime.fromtimestamp(timestamp).hour
                        if hour < 6 or hour > 22:  # Outside typical business hours
                            threat_info['is_threat'] = True
                            threat_info['score'] = 0.6
                            threat_info['type'] = 'S7_Off_Hours'
                            
            # DNP3 analysis
            if features.get('is_dnp3', False):
                # DNP3 traffic analysis
                if features.get('dst_port') == 20000:
                    # High frequency DNP3 requests might indicate scanning
                    # This would require temporal analysis across multiple packets
                    pass
                    
        except Exception as e:
            logger.debug(f"Error in industrial protocol analysis: {e}")
            
        return threat_info
        
    async def train_models(self, training_data: List[Dict], labels: List[str] = None):
        """Train ML models with provided data"""
        try:
            if not training_data:
                logger.warning("No training data provided")
                return
                
            logger.info(f"Training models with {len(training_data)} samples")
            
            # Convert to DataFrame
            df = pd.DataFrame(training_data)
            
            # Preprocess features
            processed_features = await self._preprocess_features(df)
            
            # Fit scaler
            if 'standard_scaler' in self.scalers:
                self.scalers['standard_scaler'].fit(processed_features)
                scaled_features = self.scalers['standard_scaler'].transform(processed_features)
                processed_features = pd.DataFrame(scaled_features, columns=processed_features.columns)
                
            # Train Isolation Forest (unsupervised)
            if 'isolation_forest' in self.models:
                self.models['isolation_forest'].fit(processed_features)
                logger.info("Isolation Forest trained")
                
            # Train Random Forest (supervised, if labels provided)
            if labels and 'random_forest' in self.models:
                if len(labels) == len(training_data):
                    # Encode labels
                    if 'label_encoder' in self.encoders:
                        encoded_labels = self.encoders['label_encoder'].fit_transform(labels)
                    else:
                        encoded_labels = labels
                        
                    # Split data
                    X_train, X_test, y_train, y_test = train_test_split(
                        processed_features, encoded_labels, test_size=0.2, random_state=42
                    )
                    
                    # Train model
                    self.models['random_forest'].fit(X_train, y_train)
                    
                    # Evaluate
                    y_pred = self.models['random_forest'].predict(X_test)
                    logger.info(f"Random Forest trained. Accuracy: {(y_pred == y_test).mean():.3f}")
                    
            # Train DBSCAN
            if 'dbscan' in self.models:
                clusters = self.models['dbscan'].fit_predict(processed_features)
                n_clusters = len(set(clusters)) - (1 if -1 in clusters else 0)
                logger.info(f"DBSCAN clustering completed. Found {n_clusters} clusters")
                
            # Save models
            await self._save_models()
            
            # Update metadata
            self.model_metadata['last_training'] = datetime.now().isoformat()
            self.model_metadata['training_samples'] = len(training_data)
            
            logger.info("Model training completed successfully")
            
        except Exception as e:
            logger.error(f"Error training models: {e}")
            
    async def train_deep_learning_models(self, training_data: List[Dict], labels: List[str] = None):
        """Train deep learning models (LSTM, CNN)"""
        try:
            if not training_data:
                logger.warning("No training data provided for deep learning")
                return
                
            logger.info(f"Training deep learning models with {len(training_data)} samples")
            
            # Prepare data for deep learning
            df = pd.DataFrame(training_data)
            processed_features = await self._preprocess_features(df)
            
            # Convert to numpy arrays
            X = processed_features.values.astype(np.float32)
            
            if labels:
                # Supervised learning
                y = np.array([1 if label != 'Normal' else 0 for label in labels], dtype=np.float32)
                
                # Train LSTM model
                await self._train_lstm_model(X, y)
                
                # Train CNN model for industrial protocols
                await self._train_cnn_model(X, y)
                
            else:
                # Unsupervised learning (autoencoder)
                await self._train_autoencoder(X)
                
            logger.info("Deep learning model training completed")
            
        except Exception as e:
            logger.error(f"Error training deep learning models: {e}")
            
    async def _train_lstm_model(self, X: np.ndarray, y: np.ndarray):
        """Train LSTM model for sequence analysis"""
        try:
            # Reshape data for LSTM (samples, timesteps, features)
            # For now, we'll use a simple approach with timesteps=1
            X_reshaped = X.reshape(X.shape[0], 1, X.shape[1])
            
            # Convert to PyTorch tensors
            X_tensor = torch.FloatTensor(X_reshaped).to(self.device)
            y_tensor = torch.FloatTensor(y).to(self.device)
            
            # Create dataset and dataloader
            dataset = TensorDataset(X_tensor, y_tensor)
            dataloader = DataLoader(dataset, batch_size=32, shuffle=True)
            
            # Initialize model
            model = NetworkTrafficLSTM(input_size=X.shape[1]).to(self.device)
            criterion = nn.BCELoss()
            optimizer = optim.Adam(model.parameters(), lr=0.001)
            
            # Training loop
            model.train()
            for epoch in range(50):  # Reduced epochs for demo
                total_loss = 0
                for batch_X, batch_y in dataloader:
                    optimizer.zero_grad()
                    outputs = model(batch_X).squeeze()
                    loss = criterion(outputs, batch_y)
                    loss.backward()
                    optimizer.step()
                    total_loss += loss.item()
                    
                if epoch % 10 == 0:
                    logger.info(f"LSTM Epoch {epoch}, Loss: {total_loss/len(dataloader):.4f}")
                    
            # Save model
            torch.save(model.state_dict(), self.model_dir / 'lstm_model.pth')
            self.models['lstm'] = model
            
            logger.info("LSTM model training completed")
            
        except Exception as e:
            logger.error(f"Error training LSTM model: {e}")
            
    async def _train_cnn_model(self, X: np.ndarray, y: np.ndarray):
        """Train CNN model for industrial protocol analysis"""
        try:
            # Reshape for CNN (samples, channels, length)
            X_reshaped = X.reshape(X.shape[0], 1, X.shape[1])
            
            # Convert to PyTorch tensors
            X_tensor = torch.FloatTensor(X_reshaped).to(self.device)
            y_tensor = torch.LongTensor(y.astype(int)).to(self.device)
            
            # Create dataset and dataloader
            dataset = TensorDataset(X_tensor, y_tensor)
            dataloader = DataLoader(dataset, batch_size=32, shuffle=True)
            
            # Initialize model
            model = IndustrialProtocolCNN(input_channels=1, num_classes=2).to(self.device)
            criterion = nn.CrossEntropyLoss()
            optimizer = optim.Adam(model.parameters(), lr=0.001)
            
            # Training loop
            model.train()
            for epoch in range(30):  # Reduced epochs for demo
                total_loss = 0
                for batch_X, batch_y in dataloader:
                    optimizer.zero_grad()
                    outputs = model(batch_X)
                    loss = criterion(outputs, batch_y)
                    loss.backward()
                    optimizer.step()
                    total_loss += loss.item()
                    
                if epoch % 10 == 0:
                    logger.info(f"CNN Epoch {epoch}, Loss: {total_loss/len(dataloader):.4f}")
                    
            # Save model
            torch.save(model.state_dict(), self.model_dir / 'cnn_model.pth')
            self.models['cnn'] = model
            
            logger.info("CNN model training completed")
            
        except Exception as e:
            logger.error(f"Error training CNN model: {e}")
            
    async def _train_autoencoder(self, X: np.ndarray):
        """Train autoencoder for unsupervised anomaly detection"""
        try:
            # Build autoencoder with Keras
            input_dim = X.shape[1]
            encoding_dim = max(input_dim // 4, 8)  # Compressed representation
            
            # Encoder
            input_layer = keras.Input(shape=(input_dim,))
            encoded = layers.Dense(encoding_dim * 2, activation='relu')(input_layer)
            encoded = layers.Dense(encoding_dim, activation='relu')(encoded)
            
            # Decoder
            decoded = layers.Dense(encoding_dim * 2, activation='relu')(encoded)
            decoded = layers.Dense(input_dim, activation='sigmoid')(decoded)
            
            # Autoencoder model
            autoencoder = keras.Model(input_layer, decoded)
            autoencoder.compile(optimizer='adam', loss='mse')
            
            # Train autoencoder
            history = autoencoder.fit(
                X, X,
                epochs=50,
                batch_size=32,
                validation_split=0.2,
                verbose=0
            )
            
            # Save model
            autoencoder.save(self.model_dir / 'autoencoder.h5')
            self.models['autoencoder'] = autoencoder
            
            logger.info(f"Autoencoder training completed. Final loss: {history.history['loss'][-1]:.4f}")
            
        except Exception as e:
            logger.error(f"Error training autoencoder: {e}")
            
    async def _save_models(self):
        """Save trained models to disk"""
        try:
            # Save sklearn models
            sklearn_models = ['isolation_forest', 'random_forest', 'dbscan']
            for model_name in sklearn_models:
                if model_name in self.models:
                    model_path = self.model_dir / f"{model_name}.joblib"
                    joblib.dump(self.models[model_name], model_path)
                    
            # Save scalers and encoders
            for scaler_name, scaler in self.scalers.items():
                if hasattr(scaler, 'mean_'):  # Check if fitted
                    scaler_path = self.model_dir / f"{scaler_name}.joblib"
                    joblib.dump(scaler, scaler_path)
                    
            for encoder_name, encoder in self.encoders.items():
                if hasattr(encoder, 'classes_'):  # Check if fitted
                    encoder_path = self.model_dir / f"{encoder_name}.joblib"
                    joblib.dump(encoder, encoder_path)
                    
            # Save metadata
            metadata_path = self.model_dir / 'model_metadata.json'
            with open(metadata_path, 'w') as f:
                json.dump(self.model_metadata, f, indent=2)
                
            logger.info("Models saved successfully")
            
        except Exception as e:
            logger.error(f"Error saving models: {e}")
            
    async def get_model_info(self) -> Dict:
        """Get information about loaded models"""
        model_info = {
            'loaded_models': list(self.models.keys()),
            'scalers': list(self.scalers.keys()),
            'encoders': list(self.encoders.keys()),
            'device': str(self.device),
            'model_directory': str(self.model_dir),
            'metadata': self.model_metadata
        }
        
        # Add model-specific information
        for model_name, model in self.models.items():
            if hasattr(model, 'get_params'):
                model_info[f'{model_name}_params'] = model.get_params()
            elif hasattr(model, 'state_dict'):
                model_info[f'{model_name}_type'] = 'PyTorch'
            elif hasattr(model, 'summary'):
                model_info[f'{model_name}_type'] = 'Keras'
                
        return model_info
        
    async def health_check(self) -> bool:
        """Perform a lightweight health check for the ML service.
        Ensures model directory exists, default models are initialized, and a simple
        prediction pipeline runs without errors.
        """
        try:
            # Ensure model directory exists
            if not self.model_dir.exists():
                self.model_dir.mkdir(parents=True, exist_ok=True)

            # Lazily initialize default models if not yet initialized
            if not self.models:
                await self._initialize_default_models()

            # Build a minimal sample and run through the analysis pipeline
            sample = {
                'timestamp': int(datetime.now().timestamp()),
                'protocol': 'TCP',
                'flags': 'S',
                'src_ip': '127.0.0.1',
                'dst_ip': '127.0.0.1',
                'dst_port': 80,
                'payload_size': 10,
                'is_modbus': False,
                'is_s7': False,
                'is_dnp3': False,
            }

            preds = await self.analyze_network_traffic([sample])
            # If the pipeline returns a list with at least one prediction dict, consider healthy
            return isinstance(preds, list) and len(preds) > 0 and isinstance(preds[0], dict)
        except Exception as e:
            logger.error(f"MLService health_check failed: {e}")
            return False

    async def cleanup(self):
        """Cleanup ML resources (models, GPU memory, TF sessions)."""
        try:
            # Clear TensorFlow/Keras sessions if available
            if TENSORFLOW_AVAILABLE:
                try:
                    tf.keras.backend.clear_session()
                except Exception:
                    pass

            # Clear PyTorch CUDA cache if available
            if TORCH_AVAILABLE and torch.cuda.is_available():
                try:
                    torch.cuda.empty_cache()
                except Exception:
                    pass

            # Release references to models, scalers, encoders
            self.models.clear()
            self.scalers.clear()
            self.encoders.clear()

            # Run garbage collection
            gc.collect()

            logger.info("MLService resources cleaned up successfully")
        except Exception as e:
            logger.error(f"Error during MLService cleanup: {e}")
        
    async def predict_single(self, features: Dict) -> Dict:
        """Make prediction for a single feature set"""
        try:
            predictions = await self.analyze_network_traffic([features])
            return predictions[0] if predictions else {'error': 'No prediction generated'}
        except Exception as e:
            logger.error(f"Error in single prediction: {e}")
            return {'error': str(e)}
            
    async def batch_predict(self, features_list: List[Dict]) -> List[Dict]:
        """Make predictions for a batch of features"""
        try:
            return await self.analyze_network_traffic(features_list)
        except Exception as e:
            logger.error(f"Error in batch prediction: {e}")
            return [{'error': str(e)} for _ in features_list]
            
    async def update_models(self, new_data: List[Dict], labels: List[str] = None):
        """Update existing models with new data (incremental learning)"""
        try:
            logger.info(f"Updating models with {len(new_data)} new samples")
            
            # For now, retrain models with combined data
            # In production, you might want to implement true incremental learning
            self.training_data.extend(new_data)
            
            # Keep only recent data to prevent memory issues
            max_training_samples = 10000
            if len(self.training_data) > max_training_samples:
                self.training_data = self.training_data[-max_training_samples:]
                
            # Retrain models
            await self.train_models(self.training_data, labels)
            
            logger.info("Models updated successfully")
            
        except Exception as e:
            logger.error(f"Error updating models: {e}")
            
    async def evaluate_models(self, test_data: List[Dict], test_labels: List[str]) -> Dict:
        """Evaluate model performance on test data"""
        try:
            if not test_data or not test_labels:
                return {'error': 'No test data provided'}
                
            # Get predictions
            predictions = await self.analyze_network_traffic(test_data)
            
            # Extract predicted labels (simplified)
            predicted_labels = []
            for pred in predictions:
                if pred.get('threat_score', 0) > 0.5:
                    predicted_labels.append('Threat')
                else:
                    predicted_labels.append('Normal')
                    
            # Calculate metrics
            from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
            
            # Convert test labels to binary
            binary_test_labels = ['Threat' if label != 'Normal' else 'Normal' for label in test_labels]
            
            metrics = {
                'accuracy': accuracy_score(binary_test_labels, predicted_labels),
                'precision': precision_score(binary_test_labels, predicted_labels, pos_label='Threat', zero_division=0),
                'recall': recall_score(binary_test_labels, predicted_labels, pos_label='Threat', zero_division=0),
                'f1_score': f1_score(binary_test_labels, predicted_labels, pos_label='Threat', zero_division=0),
                'test_samples': len(test_data)
            }
            
            logger.info(f"Model evaluation completed. Accuracy: {metrics['accuracy']:.3f}")
            
            return metrics
            
        except Exception as e:
            logger.error(f"Error evaluating models: {e}")
            return {'error': str(e)}