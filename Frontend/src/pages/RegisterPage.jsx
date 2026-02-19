import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../api';
import { useAuthStore } from '../store';
import { Button, Card, Input, Alert } from '../components/UI';

export function RegisterPage() {
  const navigate = useNavigate();
  const { setToken, setUser } = useAuthStore();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    password2: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.password !== formData.password2) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const { data } = await authAPI.register(
        formData.username,
        formData.email,
        formData.password,
        formData.password2
      );
      localStorage.setItem('access_token', data.access);
      localStorage.setItem('refresh_token', data.refresh);
      setToken(data.access);

      navigate('/dashboard');
    } catch (err) {
      // Handle different types of validation errors
      let errorMessage = 'Registration failed';
      
      if (err.response?.data) {
        const data = err.response.data;
        
        // Check for field-specific errors
        if (data.password) {
          errorMessage = Array.isArray(data.password) ? data.password[0] : data.password;
        } else if (data.username) {
          errorMessage = Array.isArray(data.username) ? data.username[0] : data.username;
        } else if (data.email) {
          errorMessage = Array.isArray(data.email) ? data.email[0] : data.email;
        } else if (data.non_field_errors) {
          errorMessage = Array.isArray(data.non_field_errors) ? data.non_field_errors[0] : data.non_field_errors;
        } else if (data.detail) {
          errorMessage = data.detail;
        }
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-medical-600 to-medical-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src="/heart-pulse.svg" alt="Health Monitor Logo" className="w-16 h-16 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900">Health Monitor</h1>
          <p className="text-gray-600 mt-2">Create Your Account</p>
        </div>

        {error && <Alert type="error" onClose={() => setError('')}>{error}</Alert>}

        <form onSubmit={handleSubmit}>
          <Input
            label="Username"
            type="text"
            placeholder="Enter your username"
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            required
            disabled={loading}
          />
          <Input
            label="Email"
            type="email"
            placeholder="Enter your email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
            disabled={loading}
          />
          <Input
            label="Password"
            type="password"
            placeholder="Enter your password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
            disabled={loading}
          />
          <Input
            label="Confirm Password"
            type="password"
            placeholder="Confirm your password"
            value={formData.password2}
            onChange={(e) => setFormData({ ...formData, password2: e.target.value })}
            required
            disabled={loading}
          />

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full mt-4"
            disabled={loading}
          >
            {loading ? 'Registering...' : 'Register'}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="text-medical-600 hover:text-medical-700 font-medium">
              Login here
            </Link>
          </p>
        </div>
      </Card>
    </div>
  );
}