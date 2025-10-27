import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
  IconButton,
  InputAdornment,
  Card,
  CardContent,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Link
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Storage,
  Security,
  CheckCircle,
  Error,
  Info
} from '@mui/icons-material';
import { DatabaseConfig, ConnectionStatus } from '../types/Common';

interface DatabaseSetupDialogProps {
  open: boolean;
  onClose?: () => void;
  onConnect: (config: DatabaseConfig) => Promise<boolean>;
  isFirstTime?: boolean;
}

const DatabaseSetupDialog: React.FC<DatabaseSetupDialogProps> = ({
  open,
  onClose,
  onConnect,
  isFirstTime = false
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    isConnected: false
  });
  const [formData, setFormData] = useState({
    host: '',
    database: '',
    username: '',
    password: '',
    useSSL: true,
    authSource: 'admin'
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const steps = [
    {
      label: 'MongoDB Atlas Setup',
      description: 'Create your MongoDB Atlas cluster'
    },
    {
      label: 'Connection Details',
      description: 'Enter your database connection information'
    },
    {
      label: 'Test Connection',
      description: 'Verify your database connection'
    }
  ];

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.host.trim()) {
      newErrors.host = 'Host is required';
    } else if (!formData.host.includes('mongodb.net') && !formData.host.includes('localhost')) {
      newErrors.host = 'Please enter a valid MongoDB Atlas host or localhost';
    }

    if (!formData.database.trim()) {
      newErrors.database = 'Database name is required';
    }

    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    }

    if (!formData.password.trim()) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const buildConnectionUri = (): string => {
    const { host, username, password, database, useSSL, authSource } = formData;
    
    // MongoDB Atlas format
    if (host.includes('mongodb.net')) {
      return `mongodb+srv://${encodeURIComponent(username)}:${encodeURIComponent(password)}@${host}/${database}?retryWrites=true&w=majority`;
    }
    
    // Local MongoDB format (default port 27017)
    const sslParam = useSSL ? '&ssl=true' : '';
    const authParam = authSource !== 'admin' ? `&authSource=${authSource}` : '';
    return `mongodb://${encodeURIComponent(username)}:${encodeURIComponent(password)}@${host}:27017/${database}?${sslParam}${authParam}`;
  };

  const testConnection = async (): Promise<boolean> => {
    if (!validateForm()) {
      return false;
    }

    setIsConnecting(true);
    setConnectionStatus({ isConnected: false });

    try {
      const config: DatabaseConfig = {
        connectionString: buildConnectionUri(),
        databaseName: formData.database
      };

      const startTime = Date.now();
      const success = await onConnect(config);
      const latency = Date.now() - startTime;

      if (success) {
        setConnectionStatus({
          isConnected: true,
          lastConnected: new Date(),
          latency
        });
        return true;
      } else {
        setConnectionStatus({
          isConnected: false,
          error: 'Failed to connect to the database'
        });
        return false;
      }
    } catch (error: any) {
      setConnectionStatus({
        isConnected: false,
        error: error?.message || 'Unknown connection error'
      });
      return false;
    } finally {
      setIsConnecting(false);
    }
  };

  const handleNext = async () => {
    if (activeStep === 1) {
      // Validate form on connection details step
      if (!validateForm()) {
        return;
      }
    }
    
    if (activeStep === 2) {
      // Test connection step
      const success = await testConnection();
      if (success) {
        // Save configuration and close
        await window.electronAPI.dbOperation('saveConfig', JSON.stringify({
          connectionString: buildConnectionUri(),
          databaseName: formData.database
        }));
        onClose?.();
      }
      return;
    }

    setActiveStep(prev => prev + 1);
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  const handleInputChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box sx={{ py: 2 }}>
            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="body2">
                This application requires a MongoDB database to store your business data securely.
                We recommend using MongoDB Atlas (free tier available).
              </Typography>
            </Alert>

            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  <Storage sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Quick Setup with MongoDB Atlas
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Follow these simple steps to set up your free MongoDB Atlas database:
                </Typography>
                <ol style={{ paddingLeft: '1.2rem' }}>
                  <li>
                    Visit{' '}
                    <Link href="https://www.mongodb.com/cloud/atlas" target="_blank" rel="noopener">
                      MongoDB Atlas
                    </Link>{' '}
                    and create a free account
                  </li>
                  <li>Create a new cluster (select the free M0 tier)</li>
                  <li>Create a database user with read/write permissions</li>
                  <li>Add your IP address to the whitelist (or allow access from anywhere for testing)</li>
                  <li>Get your connection string from the "Connect" button</li>
                </ol>
              </CardContent>
            </Card>

            <Alert severity="success">
              <Typography variant="body2">
                <Security sx={{ mr: 1, verticalAlign: 'middle' }} />
                Your database credentials are encrypted and stored locally on your device.
              </Typography>
            </Alert>
          </Box>
        );

      case 1:
        return (
          <Box sx={{ py: 2 }}>
            <Typography variant="body2" color="text.secondary" paragraph>
              Enter your MongoDB connection details. For Atlas, you'll find these in your cluster's "Connect" section.
            </Typography>

            <TextField
              fullWidth
              label="MongoDB Host"
              placeholder="cluster0.xxxxx.mongodb.net (for Atlas) or localhost"
              value={formData.host}
              onChange={handleInputChange('host')}
              error={!!errors.host}
              helperText={errors.host || 'MongoDB server hostname or Atlas cluster URL'}
              margin="normal"
              required
            />

            <TextField
              fullWidth
              label="Database Name"
              placeholder="business_dashboard"
              value={formData.database}
              onChange={handleInputChange('database')}
              error={!!errors.database}
              helperText={errors.database || 'Name for your business database'}
              margin="normal"
              required
            />

            <TextField
              fullWidth
              label="Username"
              placeholder="admin"
              value={formData.username}
              onChange={handleInputChange('username')}
              error={!!errors.username}
              helperText={errors.username || 'Database user with read/write permissions'}
              margin="normal"
              required
            />

            <TextField
              fullWidth
              label="Password"
              placeholder="Enter your database password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={handleInputChange('password')}
              error={!!errors.password}
              helperText={errors.password}
              margin="normal"
              required
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />

            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body2">
                💡 <strong>Tip:</strong> For MongoDB Atlas, the host usually ends with '.mongodb.net' 
                and you don't need to change the port number.
              </Typography>
            </Alert>
          </Box>
        );

      case 2:
        return (
          <Box sx={{ py: 2 }}>
            <Typography variant="body2" color="text.secondary" paragraph>
              Click "Test Connection" to verify your database setup before proceeding.
            </Typography>

            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Connection Summary
                </Typography>
                <Typography variant="body2">
                  <strong>Host:</strong> {formData.host}
                </Typography>
                <Typography variant="body2">
                  <strong>Database:</strong> {formData.database}
                </Typography>
                <Typography variant="body2">
                  <strong>Username:</strong> {formData.username}
                </Typography>
              </CardContent>
            </Card>

            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <Button
                variant="outlined"
                onClick={testConnection}
                disabled={isConnecting}
                startIcon={isConnecting ? <CircularProgress size={20} /> : <Storage />}
                size="large"
              >
                {isConnecting ? 'Testing Connection...' : 'Test Connection'}
              </Button>
            </Box>

            {connectionStatus.isConnected && (
              <Alert severity="success" icon={<CheckCircle />}>
                <Typography variant="body2">
                  ✅ Connection successful! Latency: {connectionStatus.latency}ms
                  <br />
                  Your database is ready to use.
                </Typography>
              </Alert>
            )}

            {connectionStatus.error && (
              <Alert severity="error" icon={<Error />}>
                <Typography variant="body2">
                  ❌ Connection failed: {connectionStatus.error}
                  <br />
                  Please check your credentials and try again.
                </Typography>
              </Alert>
            )}
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog
      open={open}
      onClose={isFirstTime ? undefined : onClose}
      maxWidth="md"
      fullWidth
      disableEscapeKeyDown={isFirstTime}
    >
      <DialogTitle sx={{ pb: 1 }}>
        {isFirstTime ? '🚀 Welcome to Business Dashboard' : '⚙️ Database Setup'}
      </DialogTitle>
      <DialogContent sx={{ pt: 0 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          {isFirstTime 
            ? 'Let\'s set up your database to get started'
            : 'Configure your MongoDB database connection'
          }
        </Typography>
        <Stepper activeStep={activeStep} orientation="vertical">
          {steps.map((step, index) => (
            <Step key={step.label}>
              <StepLabel>
                <Typography variant="subtitle1">{step.label}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {step.description}
                </Typography>
              </StepLabel>
              <StepContent>
                {renderStepContent(index)}
              </StepContent>
            </Step>
          ))}
        </Stepper>
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button
          onClick={handleBack}
          disabled={activeStep === 0 || isConnecting}
        >
          Back
        </Button>
        
        {!isFirstTime && (
          <Button onClick={onClose} disabled={isConnecting}>
            Cancel
          </Button>
        )}
        
        <Button
          variant="contained"
          onClick={handleNext}
          disabled={isConnecting || (activeStep === 2 && !connectionStatus.isConnected)}
        >
          {activeStep === steps.length - 1 
            ? (connectionStatus.isConnected ? 'Complete Setup' : 'Test Connection')
            : 'Next'
          }
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DatabaseSetupDialog;