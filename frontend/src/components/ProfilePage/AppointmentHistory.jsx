import React, { useState, useEffect, useCallback } from 'react';
import './AppointmentHistory.css';
import { doctorApi, patientApi, ratingApi } from '../../api/Api';
import RatingModal from './RatingModal';

// Объект для перевода статусов на русский язык
const statusTranslations = {
    SCHEDULED: 'Запланирован',
    COMPLETED: 'Завершен',
    CANCELED: 'Отменен', // Общий статус для отмены
    // Если бэкенд будет возвращать более специфичные статусы отмены, их можно добавить сюда
    // Например, если бы были CANCELLED_BY_PATIENT, CANCELLED_BY_DOCTOR
};

// Опции статусов для выпадающего списка для врача
const statusOptions = [
    { value: 'SCHEDULED', label: 'Запланирован' },
    { value: 'COMPLETED', label: 'Завершен' },
    { value: 'CANCELED', label: 'Отменен врачом' }, // Значение CANCELED, лейбл для ясности
];

function AppointmentHistory({ userRole }) {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
    const [selectedAppointmentForRating, setSelectedAppointmentForRating] = useState(null);
    
    // Состояние для отслеживания обновляемого статуса
    const [updatingStatusMap, setUpdatingStatusMap] = useState({});

    const fetchAppointments = useCallback(async () => {
        try {
            setLoading(true);
            const api = userRole === 'DOCTOR' ? doctorApi : patientApi;
            const data = await api.getAppointmentHistory();
            setAppointments(Array.isArray(data) ? data : []);
            setError('');
        } catch (err) {
            setError('Ошибка загрузки истории приемов: ' + (err.response?.data?.detail || err.message));
            console.error("Error fetching appointment history:", err);
        } finally {
            setLoading(false);
        }
    }, [userRole]);

    useEffect(() => {
        fetchAppointments();
    }, [fetchAppointments]);

    const handleOpenRatingModal = (appointment) => {
        setSelectedAppointmentForRating(appointment);
        setIsRatingModalOpen(true);
    };

    const handleCloseRatingModal = () => {
        setIsRatingModalOpen(false);
        setSelectedAppointmentForRating(null);
    };

    const handleRateAppointment = async (rating, comment) => {
        if (!selectedAppointmentForRating) return;

        const appointmentIdToRate = selectedAppointmentForRating.id;
        const doctorIdForApiCall = selectedAppointmentForRating.doctor.id;

        try {
            await ratingApi.rateDoctorVisit(doctorIdForApiCall, appointmentIdToRate, rating, comment);
            alert('Оценка успешно отправлена!');
            fetchAppointments();
        } catch (err) {
            alert('Ошибка при отправке оценки: ' + (err.response?.data?.detail || err.message));
            console.error("Error rating appointment:", err);
        } finally {
            setIsRatingModalOpen(false);
        }
    };

    const handleStatusChange = async (appointmentId, newStatus) => {
        setUpdatingStatusMap(prev => ({ ...prev, [appointmentId]: true }));
        try {
            await doctorApi.updateAppointmentStatus(appointmentId, newStatus);
            // Обновляем статус в локальном состоянии
            setAppointments(prevAppointments =>
                prevAppointments.map(app =>
                    app.id === appointmentId ? { ...app, status: newStatus } : app
                )
            );
            alert('Статус приема успешно обновлен!');
        } catch (err) {
            let errorMessage = 'Ошибка при обновлении статуса.';
            if (err.response?.data) {
                // Попытка извлечь осмысленное сообщение об ошибке из ответа бэкенда
                const data = err.response.data;
                if (data.detail) {
                    errorMessage += ` ${data.detail}`;
                } else if (data.status && Array.isArray(data.status)) {
                    errorMessage += ` Статус: ${data.status.join(', ')}`;
                } else if (typeof data === 'object') {
                    errorMessage += ` ${JSON.stringify(data)}`;
                }
            } else if (err.message) {
                errorMessage += ` ${err.message}`;
            }
            alert(errorMessage);
            console.error("Error updating appointment status:", err.response?.data || err.message || err);
        } finally {
            setUpdatingStatusMap(prev => ({ ...prev, [appointmentId]: false }));
        }
    };

    if (loading) return <div className="loading">Загрузка истории приемов...</div>;
    if (error) return <div className="error-message">{error}</div>;

    return (
        <div className="appointment-history">
            <h2>История приемов</h2>
            {appointments.length === 0 ? (
                <p>У вас пока нет записей в истории.</p>
            ) : (
                <ul className="appointments-list">
                    {appointments.map((appointment) => (
                        <li key={appointment.id} className={`appointment-item status-${appointment.status?.toLowerCase()}`}>
                            <div className="appointment-info">
                                <p><strong>Дата:</strong> {new Date(appointment.time_slot.start_time).toLocaleDateString()}</p>
                                <p><strong>Время:</strong> {new Date(appointment.time_slot.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(appointment.time_slot.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                {userRole === 'PATIENT' && (
                                    <p><strong>Врач:</strong> {appointment.doctor.first_name} {appointment.doctor.last_name} ({appointment.doctor.specialty})</p>
                                )}
                                {userRole === 'DOCTOR' && (
                                    <p><strong>Пациент:</strong> {appointment.patient.first_name} {appointment.patient.last_name}</p>
                                )}
                                <p>
                                    <strong>Статус:</strong> {statusTranslations[appointment.status] || appointment.status}
                                </p>
                            </div>
                            
                            {userRole === 'DOCTOR' && (
                                <div className="appointment-actions doctor-actions">
                                    <select 
                                        value={appointment.status} 
                                        onChange={(e) => handleStatusChange(appointment.id, e.target.value)}
                                        disabled={updatingStatusMap[appointment.id]} // Блокируем на время обновления
                                        className="status-select"
                                    >
                                        {statusOptions.map(option => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                    {updatingStatusMap[appointment.id] && <span className="loading-indicator"> Обновление...</span>}
                                </div>
                            )}

                            {userRole === 'PATIENT' && appointment.status === 'COMPLETED' && !appointment.is_rated && (
                                <div className="appointment-actions">
                                    <button 
                                        onClick={() => handleOpenRatingModal(appointment)} 
                                        className="button rate-button"
                                    >
                                        Оценить врача
                                    </button>
                                </div>
                            )}
                        </li>
                    ))}
                </ul>
            )}
            {selectedAppointmentForRating && (
                <RatingModal
                    isOpen={isRatingModalOpen}
                    onClose={handleCloseRatingModal}
                    onSubmit={handleRateAppointment}
                    appointmentTime={new Date(selectedAppointmentForRating.time_slot.start_time).toLocaleString()}
                    doctorName={`${selectedAppointmentForRating.doctor.first_name} ${selectedAppointmentForRating.doctor.last_name}`}
                />
            )}
        </div>
    );
}

export default AppointmentHistory;