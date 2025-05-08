import React, { useState, useEffect } from 'react';
import './AppointmentHistory.css';
import { doctorApi, patientApi } from '../../api/Api';

function AppointmentHistory({ userRole }) {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchAppointmentHistory();
    }, [userRole]);

    const fetchAppointmentHistory = async () => {
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
    };

    if (loading) return <div>Загрузка...</div>;
    if (error) return <div className="error">{error}</div>;

    return (
        <section className="appointment-history-section">
            <h2>История приемов</h2>
            {appointments.length > 0 ? (
                <ul className="appointment-history-list">
                    {appointments.map(appointment => (
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
                                    {new Date(appointment.time_slot.start_time).toLocaleDateString()}
                                </p>
                                <p className="appointment-time">
                                    <i className="time-icon"></i>
                                    {new Date(appointment.time_slot.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                                {userRole === 'PATIENT' && (
                                    <p className="appointment-specialty">{appointment.doctor.specialty}</p>
                                )}
                            </div>
                            <div className="appointment-details">
                                <p className="appointment-reason">Примечания: {appointment.reason}</p>
                                <span className={`appointment-status ${appointment.status.toLowerCase()}`}>
                                    {appointment.status === 'COMPLETED' ? 'Завершен' : 
                                     appointment.status === 'CANCELED' ? 'Отменен' : 
                                     appointment.status}
                                </span>
                            </div>
                        </li>
                    ))}
                </ul>
            ) : (
                <p>История приемов пуста</p>
            )}
        </section>
    );
}

export default AppointmentHistory;