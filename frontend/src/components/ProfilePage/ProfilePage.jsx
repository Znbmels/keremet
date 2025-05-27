import React, { useState, useEffect, useCallback } from 'react';
import './ProfilePage.css';
import { Link, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import EditProfileModal from './EditProfileModal';
import AppointmentHistory from './AppointmentHistory';
import AnalysesPage from '../AnalysesPage/AnalysesPage';
import MedicalCard from './MedicalCard';
import { profileApi, doctorApi, patientApi, ratingApi } from '../../api/Api';

function ProfilePage() {
    const location = useLocation();
    const navigate = useNavigate();
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [profileData, setProfileData] = useState(null);
    const [upcomingAppointments, setUpcomingAppointments] = useState([]);
    const [dashboardData, setDashboardData] = useState({ appointments: [], ratings: [], average_rating: 0 });

    const [pageIsLoading, setPageIsLoading] = useState(true); // Основное состояние загрузки страницы
    const [profileError, setProfileError] = useState('');
    const [appointmentsError, setAppointmentsError] = useState('');
    const [dashboardError, setDashboardError] = useState('');

    const fetchProfileDataInternal = useCallback(async () => {
        try {
            // Сбрасываем ошибку профиля перед каждой попыткой
            setProfileError('');
            const data = await profileApi.getUserProfile();
            if (!localStorage.getItem('access_token')) { // Дополнительная проверка на случай race condition
                navigate('/login', { replace: true });
                return null; // Важно вернуть null, чтобы прервать дальнейшую загрузку
            }
            setProfileData(data);
            return data; // Возвращаем данные для использования в цепочке вызовов
        } catch (err) {
            if (err.response && (err.response.status === 401 || err.response.status === 403)) {
                localStorage.clear();
                if (window.location.pathname !== '/login') {
                    navigate('/login', { replace: true });
                }
                return null; // Важно вернуть null
            }
            setProfileError('Ошибка при загрузке профиля: ' + (err.response?.data?.detail || err.message));
            console.error('Error fetching profile:', err);
            return null; // Важно вернуть null
        }
    }, [navigate]);

    const fetchUpcomingAppointmentsInternal = useCallback(async (currentProfileData) => {
        if (!currentProfileData) return;
        try {
            setAppointmentsError('');
            const api = currentProfileData.role === 'DOCTOR' ? doctorApi : patientApi;
            const appointments = await api.getUpcomingAppointments();
             if (!localStorage.getItem('access_token')) { // Дополнительная проверка
                navigate('/login', { replace: true });
                return;
            }
            setUpcomingAppointments(appointments);
        } catch (err) {
            if (err.response && (err.response.status === 401 || err.response.status === 403)) {
                localStorage.clear();
                if (window.location.pathname !== '/login') {
                    navigate('/login', { replace: true });
                }
                return;
            }
            setAppointmentsError('Ошибка при загрузке ближайших приемов: ' + (err.response?.data?.detail || err.message));
            console.error('Error fetching upcoming appointments:', err);
        }
    }, [navigate]);

    const fetchDashboardDataInternal = useCallback(async (currentProfileData) => {
        if (!currentProfileData || currentProfileData.role !== 'DOCTOR') return;
        try {
            setDashboardError('');
            const appointmentsData = await doctorApi.getAppointmentHistory();
            const ratingsData = await ratingApi.getAllRatings();

            let averageRating = 0;
            if (ratingsData && ratingsData.length > 0) {
                const sum = ratingsData.reduce((acc, rating) => acc + rating.rating, 0);
                averageRating = sum / ratingsData.length;
            }
            
            setDashboardData({
                appointments: Array.isArray(appointmentsData) ? appointmentsData : [],
                ratings: Array.isArray(ratingsData) ? ratingsData : [],
                average_rating: averageRating
            });
        } catch (err) {
             if (err.response && (err.response.status === 401 || err.response.status === 403)) {
                localStorage.clear();
                if (window.location.pathname !== '/login') {
                    navigate('/login', { replace: true });
                }
                return;
            }
            const message = err.response?.data?.detail || err.message || 'Неизвестная ошибка при загрузке данных дашборда';
            setDashboardError('Ошибка дашборда: ' + message);
            console.error('Error fetching dashboard data:', err);
        }
    }, [navigate]); // Добавил navigate в зависимости, т.к. он используется

    // Основной useEffect для начальной загрузки данных
    useEffect(() => {
        const loadPageData = async () => {
            setPageIsLoading(true);
            setProfileError('');
            setAppointmentsError('');
            setDashboardError('');

            const currentProfile = await fetchProfileDataInternal();

            if (currentProfile) { // Продолжаем, только если профиль успешно загружен
                // Загружаем параллельно, если это возможно и имеет смысл
                const promises = [fetchUpcomingAppointmentsInternal(currentProfile)];
                if (currentProfile.role === 'DOCTOR') {
                    promises.push(fetchDashboardDataInternal(currentProfile));
                }
                await Promise.all(promises);
            }
            // Гарантированно выключаем загрузку, даже если были ошибки выше
            // или если currentProfile был null (и произошел редирект)
            setPageIsLoading(false); 
        };

        loadPageData();
    }, [fetchProfileDataInternal, fetchUpcomingAppointmentsInternal, fetchDashboardDataInternal]);


    const handleSaveProfile = async (updatedData) => {
        try {
            setProfileError(''); // Сбрасываем ошибку перед обновлением
            const updated = await profileApi.updateUserProfile(updatedData);
            setProfileData(updated);
            setIsEditModalOpen(false);
        } catch (err) {
            setProfileError('Ошибка при обновлении профиля: ' + (err.response?.data?.detail || err.message));
            console.error('Error updating profile:', err);
        }
    };

    // Автоматическое обновление дашборда для врача
    useEffect(() => {
        let interval;
        if (profileData?.role === 'DOCTOR') {
            interval = setInterval(() => {
                // Передаем текущий profileData, чтобы избежать замыкания на старое значение
                fetchDashboardDataInternal(profileData); 
            }, 30000); // 30 секунд
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [profileData, fetchDashboardDataInternal]); // Зависимость от profileData, чтобы перезапустить интервал при его изменении

    if (pageIsLoading) return <div className="loading">Загрузка...</div>;
    
    // Если профиль не загружен после попытки (и pageIsLoading уже false), но есть ошибка профиля
    if (!profileData && profileError) return <div className="error">{profileError}</div>;
    // Если профиль все еще не загружен, но нет ошибки (например, произошел редирект, и компонент еще не размонтирован)
    if (!profileData) return <div className="loading">Загрузка профиля...</div>; // Или другое сообщение или null

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
                            {profileError && <div className="error-message page-error">{profileError}</div>}
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
                                {appointmentsError && <div className="error-message">{appointmentsError}</div>}
                                {!appointmentsError && upcomingAppointments.length > 0 ? (
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
                                    !appointmentsError && <p>Нет предстоящих приемов</p>
                                )}
                            </section>

                            {profileData.role === 'DOCTOR' && (
                                <>
                                    {dashboardError && <div className="error-message page-error">{dashboardError}</div>}
                                    <section className="doctor-rating-section">
                                        <h2>Ваш средний рейтинг
                                            <button
                                                onClick={() => fetchDashboardDataInternal(profileData)} // Передаем актуальный profileData
                                                className="edit-button ml-2"
                                                disabled={!profileData} // Блокируем, если профиль еще не загружен
                                            >
                                                Обновить
                                            </button>
                                        </h2>
                                        <div className="flex items-center space-x-1">
                                            <span className="text-lg font-medium">
                                                {dashboardData.average_rating > 0 ? dashboardData.average_rating.toFixed(1) : 'Нет оценок'}
                                            </span>
                                        </div>
                                    </section>
                                    <section className="doctor-ratings-list">
                                        <h2>Ваши оценки</h2>
                                        {dashboardData.ratings.length === 0 && !dashboardError ? (
                                            <p>Пока нет оценок.</p>
                                        ) : (
                                            !dashboardError && dashboardData.ratings.map((rating) => (
                                                <div key={rating.id} className="p-4 border rounded-lg mb-2">
                                                    <div className="mb-2">
                                                        <p className="text-sm text-gray-700">
                                                            Пациент: {rating.visit && rating.visit.patient ? `${rating.visit.patient.first_name} ${rating.visit.patient.last_name}` : 'Не указан'}
                                                        </p>
                                                        <p className="text-lg font-semibold">Оценка: {rating.rating}/5</p>
                                                    </div>
                                                    <p className="text-gray-600">{rating.comment || 'Без комментария'}</p>
                                                    <p className="text-sm text-gray-500">
                                                        Оставлено: {new Date(rating.created_at).toLocaleString()}
                                                    </p>
                                                </div>
                                            ))
                                        )}
                                    </section>
                                </>
                            )}
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
                profile={profileData} // profileData здесь будет null, если не загружен
                onSave={handleSaveProfile}
            />
        </div>
    );
}

export default ProfilePage;