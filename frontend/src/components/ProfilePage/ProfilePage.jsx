import React, { useState, useEffect } from 'react';
import './ProfilePage.css';
import { Link, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import EditProfileModal from './EditProfileModal';
import AppointmentHistory from './AppointmentHistory';
import AnalysesPage from '../AnalysesPage/AnalysesPage';
import MedicalCard from './MedicalCard';
import { profileApi, doctorApi, patientApi } from '../../api/Api';

function ProfilePage() {
    const location = useLocation();
    const navigate = useNavigate();
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [profileData, setProfileData] = useState(null);
    const [upcomingAppointments, setUpcomingAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchProfileData();
        // eslint-disable-next-line
    }, []);

    useEffect(() => {
        if (profileData && profileData.role) {
            fetchUpcomingAppointments();
        }
        // eslint-disable-next-line
    }, [profileData?.role]);

    const fetchProfileData = async () => {
        try {
            const data = await profileApi.getUserProfile();
            if (!localStorage.getItem('access_token')) return;
            setProfileData(data);
        } catch (err) {
            if (err.response && (err.response.status === 401 || err.response.status === 403)) {
                localStorage.clear();
                if (window.location.pathname !== '/login') {
                    navigate('/login', { replace: true });
                }
                return;
            }
            setError('Ошибка при загрузке профиля: ' + (err.response?.data?.detail || err.message));
            console.error('Error fetching profile:', err);
            setLoading(false);
        }
    };

    const fetchUpcomingAppointments = async () => {
        try {
            const api = profileData.role === 'DOCTOR' ? doctorApi : patientApi;
            const appointments = await api.getUpcomingAppointments();
            if (!localStorage.getItem('access_token')) return;
            setUpcomingAppointments(appointments);
        } catch (err) {
            if (err.response && (err.response.status === 401 || err.response.status === 403)) {
                localStorage.clear();
                if (window.location.pathname !== '/login') {
                    navigate('/login', { replace: true });
                }
                return;
            }
            setError('Ошибка при загрузке приемов: ' + (err.response?.data?.detail || err.message));
            console.error('Error fetching appointments:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveProfile = async (updatedData) => {
        try {
            const updated = await profileApi.updateUserProfile(updatedData);
            setProfileData(updated);
            setIsEditModalOpen(false);
        } catch (err) {
            setError('Ошибка при обновлении профиля: ' + (err.response?.data?.detail || err.message));
            console.error('Error updating profile:', err);
        }
    };

    if (loading) return <div className="loading">Загрузка...</div>;
    if (error) return <div className="error">{error}</div>;
    if (!profileData) return <div className="error">Ошибка загрузки профиля</div>;

    return (
        <div className="profile-page">
            <div className="profile-sidebar">
                <div className="profile-header">
                    <div className="profile-avatar">
                        {`${profileData.first_name[0]}${profileData.last_name[0]}`}
                    </div>
                    <h2 className="profile-name">{`${profileData.first_name} ${profileData.last_name}`}</h2>
                </div>
                <nav className="profile-navigation">
                    <Link
                        to="/profile"
                        className={`profile-nav-item ${location.pathname === '/profile' || location.pathname === '/profile/' ? 'active' : ''}`}
                    >
                        Личная информация
                    </Link>
                    <Link
                        to="/profile/appointments-history"
                        className={`profile-nav-item ${location.pathname === '/profile/appointments-history' ? 'active' : ''}`}
                    >
                        История приемов
                    </Link>
                    <Link
                        to="/profile/medical-card"
                        className={`profile-nav-item ${location.pathname === '/profile/medical-card' ? 'active' : ''}`}
                    >
                        Медицинская карта
                    </Link>
                    <Link
                        to="/profile/analyses"
                        className={`profile-nav-item ${location.pathname === '/profile/analyses' ? 'active' : ''}`}
                    >
                        Анализы
                    </Link>
                </nav>
            </div>

            <div className="profile-content">
                <Routes>
                    <Route path="/" element={
                        <>
                            <section className="personal-info">
                                <h2>Личная информация
                                    <button onClick={() => setIsEditModalOpen(true)} className="edit-button">
                                        Редактировать
                                    </button>
                                </h2>
                                <div className="info-grid">
                                    <div className="info-item">
                                        <label>Имя</label>
                                        <span>{profileData.first_name}</span>
                                    </div>
                                    <div className="info-item">
                                        <label>Фамилия</label>
                                        <span>{profileData.last_name}</span>
                                    </div>
                                    <div className="info-item">
                                        <label>Email</label>
                                        <span>{profileData.email}</span>
                                    </div>
                                    <div className="info-item">
                                        <label>Телефон</label>
                                        <span>{profileData.phone}</span>
                                    </div>
                                    <div className="info-item">
                                        <label>ИНН</label>
                                        <span>{profileData.inn}</span>
                                    </div>
                                    <div className="info-item">
                                        <label>Роль</label>
                                        <span>{profileData.role === 'PATIENT' ? 'Пациент' : 'Врач'}</span>
                                    </div>
                                    {profileData.role === 'DOCTOR' && (
                                        <div className="info-item">
                                            <label>Специализация</label>
                                            <span>{profileData.specialty}</span>
                                        </div>
                                    )}
                                </div>
                            </section>

                            <section className="upcoming-appointments">
                                <h2>Ближайшие приемы</h2>
                                {error && <div className="error">{error}</div>}
                                {upcomingAppointments.length > 0 ? (
                                    <ul className="appointments-list">
                                        {upcomingAppointments.map((appointment) => (
                                            <li key={appointment.id} className="appointment-item">
                                                <span>{new Date(appointment.time_slot.start_time).toLocaleDateString()}</span>
                                                <span>{new Date(appointment.time_slot.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                <span>
                                                    {profileData.role === 'PATIENT'
                                                        ? `${appointment.doctor.first_name} ${appointment.doctor.last_name} (${appointment.doctor.specialty})`
                                                        : `${appointment.patient.first_name} ${appointment.patient.last_name}`}
                                                </span>
                                                <button>Подробнее</button>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p>Нет предстоящих приемов</p>
                                )}
                            </section>
                        </>
                    } />
                    <Route path="medical-card" element={<MedicalCard />} />
                    <Route path="appointments-history" element={<AppointmentHistory userRole={profileData.role} />} />
                    <Route path="analyses" element={<AnalysesPage userRole={profileData.role} isProfileView={true} />} />
                </Routes>
            </div>

            <div className="profile-notifications">
                <h2>Уведомления</h2>
                <p>Пока нет уведомлений.</p>
            </div>

            <EditProfileModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                profile={profileData}
                onSave={handleSaveProfile}
            />
        </div>
    );
}

export default ProfilePage;