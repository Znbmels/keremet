import React, { useState, useEffect } from 'react';
import { doctorApi, ratingApi } from '../../api/Api';
import './DoctorAppointments.css';

function DoctorAppointments() {
    const [appointments, setAppointments] = useState([]);
    const [timeSlots, setTimeSlots] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [newSlot, setNewSlot] = useState({
        date: '',
        startTime: '',
        endTime: '',
    });
    const [doctorRating, setDoctorRating] = useState(0);
    const [ratingCount, setRatingCount] = useState(0);

    useEffect(() => {
        fetchAppointments();
        fetchTimeSlots();
        fetchDoctorRating();
    }, [selectedDate]);

    const fetchAppointments = async () => {
        try {
            const data = await doctorApi.getMyAppointments(selectedDate);
            setAppointments(data);
        } catch (error) {
            console.error('Error fetching appointments:', error);
        }
    };

    const fetchTimeSlots = async () => {
        try {
            const data = await doctorApi.getMyTimeSlots(selectedDate);
            setTimeSlots(data);
        } catch (error) {
            console.error('Error fetching time slots:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchDoctorRating = async () => {
        try {
            const ratingsData = await ratingApi.getAllRatings();
            if (Array.isArray(ratingsData) && ratingsData.length > 0) {
                const avgRating = ratingsData.reduce((sum, item) => sum + item.rating, 0) / ratingsData.length;
                setDoctorRating(avgRating);
                setRatingCount(ratingsData.length);
            } else if (typeof ratingsData === 'object' && ratingsData.average_rating !== undefined) {
                setDoctorRating(ratingsData.average_rating);
                setRatingCount(ratingsData.rating_count || 0);
            }
        } catch (error) {
            console.error('Ошибка при загрузке рейтинга для DoctorDashboard:', error);
        }
    };

    const handleAddTimeSlot = async (e) => {
        e.preventDefault();
        try {
            await doctorApi.createTimeSlot(newSlot);
            fetchTimeSlots();
            setNewSlot({ date: '', startTime: '', endTime: '' });
        } catch (error) {
            console.error('Error creating time slot:', error);
        }
    };

    const handleDeleteTimeSlot = async (slotId) => {
        try {
            await doctorApi.deleteTimeSlot(slotId);
            fetchTimeSlots();
        } catch (error) {
            console.error('Error deleting time slot:', error);
        }
    };

    if (loading) return <div className="doctor-dashboard-loading">Загрузка...</div>;

    return (
        <div className="doctor-appointments-container">
            <div className="dashboard-header">
                <h1>Управление расписанием</h1>
                <div className="doctor-rating-summary">
                    <h3>Ваш рейтинг</h3>
                    <div className="doctor-dashboard-rating-display">
                        <span className="doctor-dashboard-rating-value">
                            {doctorRating.toFixed(1)}
                        </span>
                        <span className="doctor-dashboard-rating-count">
                            ({ratingCount} {getRatingWord(ratingCount)})
                        </span>
                    </div>
                </div>
                <div className="date-selector">
                    <input
                        type="date"
                        value={selectedDate.toISOString().split('T')[0]}
                        onChange={(e) => setSelectedDate(new Date(e.target.value))}
                    />
                </div>
            </div>

            <div className="time-slots-section">
                <h2>Добавить временной слот</h2>
                <form onSubmit={handleAddTimeSlot} className="add-slot-form">
                    <input
                        type="date"
                        value={newSlot.date}
                        onChange={(e) => setNewSlot({...newSlot, date: e.target.value})}
                        required
                    />
                    <input
                        type="time"
                        value={newSlot.startTime}
                        onChange={(e) => setNewSlot({...newSlot, startTime: e.target.value})}
                        required
                    />
                    <input
                        type="time"
                        value={newSlot.endTime}
                        onChange={(e) => setNewSlot({...newSlot, endTime: e.target.value})}
                        required
                    />
                    <button type="submit">Добавить слот</button>
                </form>

                <div className="time-slots-list">
                    <h2>Мои временные слоты</h2>
                    {timeSlots.length === 0 ? (
                        <p>Нет доступных временных слотов</p>
                    ) : (
                        timeSlots.map(slot => (
                            <div key={slot.id} className="time-slot-item">
                                <span>{new Date(slot.date).toLocaleDateString()}</span>
                                <span>{slot.startTime} - {slot.endTime}</span>
                                <button 
                                    onClick={() => handleDeleteTimeSlot(slot.id)}
                                    className="delete-slot-btn"
                                >
                                    Удалить
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>

            <div className="appointments-section">
                <h2>Записи на прием</h2>
                {appointments.length === 0 ? (
                    <p>Нет записей на выбранную дату</p>
                ) : (
                    <div className="appointments-list">
                        {appointments.map(appointment => (
                            <div key={appointment.id} className="appointment-item">
                                <div className="patient-info">
                                    <h3>{appointment.patient.first_name} {appointment.patient.last_name}</h3>
                                    <p>Телефон: {appointment.patient.phone}</p>
                                </div>
                                <div className="appointment-time">
                                    <p>Дата: {new Date(appointment.date).toLocaleDateString()}</p>
                                    <p>Время: {appointment.time}</p>
                                </div>
                                <div className="appointment-status">
                                    Статус: {appointment.status}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function getRatingWord(count) {
    if (count % 10 === 1 && count % 100 !== 11) {
        return 'оценка';
    } else if ([2, 3, 4].includes(count % 10) && ![12, 13, 14].includes(count % 100)) {
        return 'оценки';
    } else {
        return 'оценок';
    }
}

export default DoctorAppointments; 