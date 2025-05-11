import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import TopBar from './components/TopBar/TopBar';
import HomePage from './components/HomePage/HomePage';
import AboutUsPage from './components/AboutUsPage/AboutUsPage';
import ContactUsPage from './components/ContactUsPage/ContactUsPage';
import DoctorsPage from './components/DoctorsPage/DoctorsPage';
import ProfilePage from './components/ProfilePage/ProfilePage';
import AnalysesPage from './components/AnalysesPage/AnalysesPage';
import Footer from './components/Footer/Footer';
import AppointmentBookingPage from './components/AppointmentBookingPage/AppointmentBookingPage';
import LoginPage from './components/Auth/LoginPage';
import RegisterPage from './components/Auth/RegisterPage';
import ProtectedRoute from './components/ProtectedRoute';
import DoctorSchedulePage from './components/DoctorSchedule/DoctorSchedulePage';
import './index.css';

function App() {
  const token = localStorage.getItem('access_token');
  const userRole = localStorage.getItem('user_role');

  const AppointmentPage = () => {
    if (userRole === 'DOCTOR') {
      return <DoctorSchedulePage />;
    }
    return <AppointmentBookingPage />;
  };

  return (
    <Router>
      <div className="app">
        <TopBar />
        <Routes>
          <Route path="/login" element={token ? <Navigate to="/home" /> : <LoginPage />} />
          <Route path="/register" element={token ? <Navigate to="/home" /> : <RegisterPage />} />
          <Route path="/about" element={<AboutUsPage />} />
          <Route path="/contacts" element={<ContactUsPage />} />
          <Route path="/" element={token ? <Navigate to="/home" /> : <Navigate to="/login" />} />
          <Route path="/home" element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          } />
          {userRole === 'PATIENT' && (
            <Route path="/doctors" element={
              <ProtectedRoute>
                <DoctorsPage />
              </ProtectedRoute>
            } />
          )}
          <Route path="/tests" element={
            <ProtectedRoute>
              <AnalysesPage userRole={userRole} />
            </ProtectedRoute>
          } />
          <Route path="/profile/*" element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          } />
          <Route path="/appointment" element={
            <ProtectedRoute>
              <AppointmentPage />
            </ProtectedRoute>
          } />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
        <Footer />
      </div>
    </Router>
  );
}

export default App;