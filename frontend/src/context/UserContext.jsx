import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { userAPI } from '../services/api';

const UserContext = createContext({});

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within UserProvider');
  }
  return context;
};

export const UserProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (currentUser) {
        try {
          const response = await userAPI.getProfile();
          setUserProfile(response.data);
        } catch (error) {
          console.error('Error fetching user profile:', error);
        }
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    };

    fetchUserProfile();
  }, [currentUser]);

  const updateUserProfile = (data) => {
    setUserProfile(prev => ({ ...prev, ...data }));
  };

  const value = {
    userProfile,
    updateUserProfile,
    loading,
    isUser: userProfile?.role === 'user',
    isGenie: userProfile?.role === 'genie',
    isAdmin: userProfile?.role === 'admin',
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};

export default UserContext;
