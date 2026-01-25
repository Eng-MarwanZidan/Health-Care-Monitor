import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store';
import { authAPI } from '../api';

export function Layout({ children }) {
  const navigate = useNavigate();
  const { user, setUser, token, logout } = useAuthStore();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const profileMenuRef = useRef(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleProfileMenu = () => {
    setIsProfileMenuOpen(!isProfileMenuOpen);
  };

  // Fetch user profile data
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (token && !user) {
        setIsLoadingProfile(true);
        try {
          const response = await authAPI.getProfile();
          setUser(response.data);
        } catch (error) {
          console.error('Failed to fetch user profile:', error);
          // If profile fetch fails, try to extract user info from token
          try {
            const tokenPayload = JSON.parse(atob(token.split('.')[1]));
            setUser({ username: tokenPayload.username });
          } catch (tokenError) {
            console.error('Failed to parse token:', tokenError);
          }
        } finally {
          setIsLoadingProfile(false);
        }
      }
    };

    fetchUserProfile();
  }, [token, user, setUser]);

  // Close profile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setIsProfileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm p-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <div className="text-4xl mr-3">❤️</div>
              <div>
                <h1 className="text-3xl font-bold text-medical-600">Health Monitor</h1>
                <p className="text-2xs text-balck-700">Medical Dashboard</p>
              </div>
            </div>

            {/* Navigation */}
            <nav className="hidden md:flex space-x-6">
              <NavLink to="/dashboard" label="Dashboard" />
              <NavLink to="/patients" label="Patients" />
              <NavLink to="/measurements" label="Measurements" />
              <NavLink to="/predictions" label="Predictions" />
            </nav>

            {/* User Profile */}
            <div className="relative" ref={profileMenuRef}>
              <button
                onClick={toggleProfileMenu}
                className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 focus:outline-none"
                disabled={isLoadingProfile}
              >
                <div className="w-8 h-8 bg-medical-100 rounded-full flex items-center justify-center">
                  {isLoadingProfile ? (
                    <div className="w-4 h-4 border-2 border-medical-600 border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <span className="text-sm font-semibold text-medical-600">
                      {user?.username?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  )}
                </div>
                <span className="hidden sm:block text-sm font-medium">
                  {isLoadingProfile ? 'Loading...' : user?.username || 'User'}
                </span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Profile Dropdown */}
              {isProfileMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg py-1 z-10 border border-gray-200">
                  <div className="px-4 py-3 border-b border-gray-200">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-medical-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-semibold text-medical-600">
                          {user?.username?.charAt(0).toUpperCase() || 'U'}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{user?.username || 'User'}</p>
                        <p className="text-xs text-gray-500">{user?.email || 'No email'}</p>
                      </div>
                    </div>
                    {user?.is_verified !== undefined && (
                      <div className="mt-2 flex items-center">
                        <div className={`w-2 h-2 rounded-full mr-2 ${user.is_verified ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                        <span className="text-xs text-gray-600">
                          {user.is_verified ? 'Verified Account' : 'Unverified Account'}
                        </span>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-white font-semibold bg-red-600 rounded-lg hover:bg-red-700 flex items-center transition-colors"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Logout
                  </button>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button className="text-gray-700 hover:text-gray-900">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden border-t border-gray-200 bg-gray-50">
          <nav className="px-4 py-2 space-y-1">
            <MobileNavLink to="/dashboard" label="Dashboard" />
            <MobileNavLink to="/patients" label="Patients" />
            <MobileNavLink to="/measurements" label="Measurements" />
            <MobileNavLink to="/predictions" label="Predictions" />
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-4 md:mb-0">
              <span className="text-2sm text-gray-900">Health Monitor - Medical Dashboard</span>
            </div>
            <div className="flex space-x-6 text-sm text-gray-900">
              <span>© 2026 Health Monitor</span>
              <span>•</span>
              <span>Version 1.0.0</span>
              <span>•</span>
              <span>All rights reserved</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function NavLink({ to, label }) {
  const navigate = useNavigate();
  const isActive = window.location.pathname === to;

  return (
    <button
      onClick={() => navigate(to)}
      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
        isActive
          ? 'bg-medical-100 text-medical-700'
          : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
      }`}
    >
      {label}
    </button>
  );
}

function MobileNavLink({ to, label }) {
  const navigate = useNavigate();
  const isActive = window.location.pathname === to;

  return (
    <button
      onClick={() => navigate(to)}
      className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
        isActive
          ? 'bg-medical-200 text-medical-800'
          : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
      }`}
    >
      {label}
    </button>
  );
}
