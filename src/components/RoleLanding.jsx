import { Navigate } from 'react-router-dom';
import { Center, Loader } from '@mantine/core';
import { useAuth } from '../context/AuthContext.jsx';
import { DEFAULT_ROUTE } from '../constants/nav.js';

export const RoleLanding = () => {
  const { initializing, isAuthenticated, user } = useAuth();

  if (initializing) {
    return (
      <Center h="100vh">
        <Loader />
      </Center>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to={DEFAULT_ROUTE[user.role] || DEFAULT_ROUTE.operator} replace />;
};
