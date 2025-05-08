import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
    const token = localStorage.getItem('access_token');
    const location = useLocation();
    if (!token) {
        if (location.pathname !== '/login') {
            return <Navigate to="/login" replace />;
        }
        return null;
    }
    return children;
};

export default ProtectedRoute; 