import React, { useState, useEffect, useCallback } from 'react';
import './AppointmentHistory.css';
import { doctorApi, patientApi } from '../../api/Api';

function AppointmentHistory({ userRole }) {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchAppointmentHistory = useCallback(async () => {
        try {
            const api = userRole === 'DOCTOR' ? doctorApi : patientApi;
            const data = await api.getAppointmentHistory();
            setAppointments(data);
        } catch (err) {
            setError('Ошибка при загрузке истории приемов');
            console.error('Error fetching appointment history:', err);
        } finally {
            setLoading(false);
        }
    }, [userRole]);

    useEffect(() => {
        fetchAppointmentHistory();
    }, [fetchAppointmentHistory]);

    const formatDateTime = (dateString) => {
        const date = new Date(dateString);
        return {
            date: date.toLocaleDateString('ru-RU', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            }),
            time: date.toLocaleTimeString('ru-RU', {
                hour: '2-digit',
                minute: '2-digit'
            })
        };
    };

    const calculateExpectedTime = (startTime) => {
        const start = new Date(startTime);
        const expected = new Date(start.getTime() + 20 * 60000); // добавляем 20 минут
        return expected.toLocaleTimeString('ru-RU', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) return <div>Загрузка...</div>;
    if (error) return <div className="error">{error}</div>;

    return (
        <section className="appointment-history-section">
            <h2>История приемов</h2>
            {appointments.length > 0 ? (
                <ul className="appointment-history-list">
                    {appointments.map(appointment => {
                        // ВРЕМЕННО: выводим что реально приходит
                        // console.log('appointment:', appointment);
                        const slotTime = appointment.time_slot && appointment.time_slot.start_time ? appointment.time_slot.start_time : null;
                        const { date, time } = formatDateTime(slotTime);
                        const expectedTime = calculateExpectedTime(slotTime);
                        
                        return (
                            <li key={appointment.id} className="appointment-history-item">
                                <div className="appointment-info">
                                    <h3 className="doctor-name">
                                        {userRole === 'PATIENT' 
                                            ? `${appointment.doctor.first_name} ${appointment.doctor.last_name}`
                                            : `${appointment.patient.first_name} ${appointment.patient.last_name}`
                                        }
                                    </h3>
                                    <p className="appointment-date">
                                        <i className="calendar-icon"></i>
                                        {date}
                                    </p>
                                    <p className="appointment-time">
                                        <i className="time-icon"></i>
                                        Запись: {time}
                                    </p>
                                    <p className="expected-time">
                                        <i className="time-icon"></i>
                                        Ожидаемое время: {expectedTime}
                                    </p>
                                    {userRole === 'PATIENT' && (
                                        <p className="appointment-specialty">{appointment.doctor.specialty}</p>
                                    )}
                                </div>
                                <div className="appointment-details">
                                    <p className="appointment-reason">Примечания: {appointment.reason || 'Нет'}</p>
                                    <span className={`appointment-status ${appointment.status.toLowerCase()}`}>
                                        {appointment.status === 'COMPLETED' ? 'Завершен' : 
                                         appointment.status === 'CANCELED' ? 'Отменен' : 
                                         appointment.status === 'SCHEDULED' ? 'Запланирован' : 
                                         appointment.status}
                                    </span>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            ) : (
                <p>История приемов пуста</p>
            )}
        </section>
    );
}

export default AppointmentHistory;