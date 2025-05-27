import React, { useState, useEffect, useCallback } from 'react';
import { doctorApi } from '../../api/Api';
import './DoctorSchedulePage.css';

function DoctorSchedulePage() {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [timeSlots, setTimeSlots] = useState([]);
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [newSlot, setNewSlot] = useState({
        date: new Date().toISOString().split('T')[0],
        startTime: '',
        endTime: '',
        duration: 30
    });

    const fetchTimeSlots = useCallback(async () => {
        setLoading(true);
        try {
            const data = await doctorApi.getMyTimeSlots(selectedDate);
            setTimeSlots(data);
            setError(null);
        } catch (err) {
            setError('Ошибка при загрузке расписания');
            console.error('Error fetching time slots:', err);
        }
    }, [selectedDate]);

    const fetchAppointments = useCallback(async () => {
        try {
            const data = await doctorApi.getMyAppointments(selectedDate);
            setAppointments(data);
        } catch (err) {
            console.error('Error fetching appointments:', err);
        } finally {
            setLoading(false);
        }
    }, [selectedDate]);

    useEffect(() => {
        fetchTimeSlots();
        fetchAppointments();
    }, [fetchTimeSlots, fetchAppointments]);

    const handleAddTimeSlot = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            // Форматируем данные для отправки на сервер
            const timeSlotData = {
                start_time: `${newSlot.date}T${newSlot.startTime}:00Z`, // Добавляем Z для UTC
                end_time: `${newSlot.date}T${newSlot.endTime}:00Z`, // Добавляем Z для UTC
                status: 'AVAILABLE'
            };
            
            console.log('Sending time slot data:', timeSlotData); // Для отладки
            
            await doctorApi.createTimeSlot(timeSlotData);
            await fetchTimeSlots(); // Обновляем список слотов
            setNewSlot({
                ...newSlot,
                startTime: '',
                endTime: ''
            });
            setError(null);
        } catch (err) {
            const errorMessage = err.response?.data?.detail || 
                               err.response?.data?.non_field_errors?.[0] ||
                               err.message ||
                               'Произошла ошибка при добавлении слота';
            setError('Ошибка при добавлении временного слота: ' + errorMessage);
            console.error('Error creating time slot:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteTimeSlot = async (slotId) => {
        try {
            setLoading(true);
            await doctorApi.deleteTimeSlot(slotId);
            fetchTimeSlots();
        } catch (err) {
            setError('Ошибка при удалении временного слота');
            console.error('Error deleting time slot:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="loading">Загрузка...</div>;
    }

    return (
        <div className="doctor-schedule-page">
            <h1>Управление расписанием</h1>
            
            <div className="schedule-controls">
                <div className="date-picker">
                    <label>Выберите дату:</label>
                    <input
                        type="date"
                        value={selectedDate.toISOString().split('T')[0]}
                        onChange={(e) => setSelectedDate(new Date(e.target.value))}
                        min={new Date().toISOString().split('T')[0]}
                    />
                </div>

                <form onSubmit={handleAddTimeSlot} className="add-slot-form">
                    <h3>Добавить временной слот</h3>
                    <div className="form-group">
                        <label>Дата:</label>
                        <input
                            type="date"
                            value={newSlot.date}
                            onChange={(e) => setNewSlot({...newSlot, date: e.target.value})}
                            min={new Date().toISOString().split('T')[0]}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Время начала:</label>
                        <input
                            type="time"
                            value={newSlot.startTime}
                            onChange={(e) => setNewSlot({...newSlot, startTime: e.target.value})}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Время окончания:</label>
                        <input
                            type="time"
                            value={newSlot.endTime}
                            onChange={(e) => setNewSlot({...newSlot, endTime: e.target.value})}
                            required
                        />
                    </div>
                    <button type="submit" className="add-slot-btn" disabled={loading}>
                        {loading ? 'Добавление...' : 'Добавить слот'}
                    </button>
                </form>
            </div>

            {error && <div className="error-message">{error}</div>}

            <div className="schedule-content">
                <div className="time-slots-section">
                    <h2>Мои временные слоты</h2>
                    {timeSlots.length === 0 ? (
                        <p className="no-slots">На выбранную дату нет временных слотов</p>
                    ) : (
                        <div className="time-slots-list">
                            {timeSlots.map(slot => (
                                <div key={slot.id} className="time-slot-item">
                                    <div className="slot-info">
                                        <span className="slot-time">
                                            {new Date(slot.start_time).toLocaleTimeString([], {
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                            {' - '}
                                            {new Date(slot.end_time).toLocaleTimeString([], {
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </span>
                                        <span className={`slot-status ${slot.is_booked ? 'booked' : 'available'}`}>
                                            {slot.is_booked ? 'Занято' : 'Свободно'}
                                        </span>
                                    </div>
                                    {!slot.is_booked && (
                                        <button
                                            onClick={() => handleDeleteTimeSlot(slot.id)}
                                            className="delete-slot-btn"
                                        >
                                            Удалить
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="appointments-section">
                    <h2>Записи на прием</h2>
                    {appointments.length === 0 ? (
                        <p className="no-appointments">На выбранную дату нет записей</p>
                    ) : (
                        <div className="appointments-list">
                            {appointments.map(appointment => (
                                <div key={appointment.id} className="appointment-item">
                                    <div className="patient-info">
                                        <h4>{appointment.patient.first_name} {appointment.patient.last_name}</h4>
                                        <p>Телефон: {appointment.patient.phone}</p>
                                    </div>
                                    <div className="appointment-time">
                                        {new Date(appointment.time).toLocaleTimeString([], {
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </div>
                                    <div className="appointment-status">
                                        {appointment.status}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default DoctorSchedulePage; 