import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { patientApi } from '../../api/Api';
import './AppointmentBookingPage.css';

export default function AppointmentBookingPage({ onBook }) {
  const location = useLocation();
  const [step, setStep] = useState(1);
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(location.state?.selectedDoctor || null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Загрузка списка врачей
  useEffect(() => {
    if (step === 1) {
      fetchDoctors();
    }
  }, [step]);

  // Загрузка доступных слотов при выборе врача
  useEffect(() => {
    if (selectedDoctor) {
      fetchAvailableSlots();
    }
  }, [selectedDoctor]);

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const data = await patientApi.getDoctors();
      setDoctors(data);
      setError(null);
    } catch (err) {
      setError('Ошибка при загрузке списка врачей');
      console.error('Error fetching doctors:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableSlots = async () => {
    try {
      setLoading(true);
      const data = await patientApi.getDoctorTimeSlots(selectedDoctor.id);
      setAvailableSlots(data);
      setError(null);
    } catch (err) {
      setError('Ошибка при загрузке доступного времени');
      console.error('Error fetching time slots:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDoctor = (doctor) => {
    setSelectedDoctor(doctor);
    setStep(2);
    setSelectedSlot(null);
  };

  const handleBook = async () => {
    try {
      setLoading(true);
      await patientApi.bookAppointment({
        doctor_id: selectedDoctor.id,
        time_slot_id: selectedSlot.id,
      });
      setSuccess(true);
      if (onBook) {
        onBook({
          doctor: selectedDoctor,
          time_slot: selectedSlot,
          status: 'SCHEDULED',
        });
      }
    } catch (err) {
      setError('Ошибка при записи на прием');
      console.error('Error booking appointment:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToDoctors = () => {
    setStep(1);
    setSelectedDoctor(null);
    setSelectedSlot(null);
  };

  if (loading) {
    return <div className="loading">Загрузка...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="appointment-booking">
      <h1>Запись на прием</h1>
      <div className="steps">
        <span className={step === 1 ? 'active' : ''}>1. Выбор врача</span>
        <span className={step === 2 ? 'active' : ''}>2. Выбор времени</span>
      </div>

      {success ? (
        <div className="success-message">
          <h2>Вы успешно записались на прием!</h2>
          <p>Врач: {selectedDoctor.first_name} {selectedDoctor.last_name}</p>
          <p>Время: {new Date(selectedSlot.start_time).toLocaleString()}</p>
        </div>
      ) : (
        <>
          {step === 1 && (
            <div>
              <h3>Выберите врача</h3>
              <div className="doctor-list">
                {doctors.map(doctor => (
                  <div key={doctor.id} className="doctor-card" onClick={() => handleSelectDoctor(doctor)}>
                    <div className="doctor-photo">
                      {doctor.photo_url ? (
                        <img src={doctor.photo_url} alt={`${doctor.first_name} ${doctor.last_name}`} />
                      ) : (
                        <div className="doctor-initials">
                          {doctor.first_name[0]}{doctor.last_name[0]}
                        </div>
                      )}
                    </div>
                    <div className="doctor-info">
                      <h4>{doctor.first_name} {doctor.last_name}</h4>
                      <p className="specialty">{doctor.specialty}</p>
                      <p className="experience">Стаж: {doctor.experience} лет</p>
                      {doctor.consultation_price && (
                        <p className="price">Стоимость приема: {doctor.consultation_price} сом</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 2 && selectedDoctor && (
            <div>
              <h3>Выберите время приема для {selectedDoctor.first_name} {selectedDoctor.last_name}</h3>
              <div className="timeslot-list">
                {availableSlots.length === 0 ? (
                  <p>Нет свободных слотов для записи к этому врачу.</p>
                ) : (
                  availableSlots.map(slot => (
                    <button
                      key={slot.id}
                      className={`time-slot ${selectedSlot?.id === slot.id ? 'selected' : ''}`}
                      onClick={() => setSelectedSlot(slot)}
                    >
                      {new Date(slot.start_time).toLocaleString([], {
                        dateStyle: 'short',
                        timeStyle: 'short'
                      })}
                    </button>
                  ))
                )}
              </div>
              <div className="booking-actions">
                <button
                  className="book-btn"
                  disabled={!selectedSlot}
                  onClick={handleBook}
                >
                  Записаться
                </button>
                <button
                  className="back-btn"
                  onClick={handleBackToDoctors}
                >
                  Назад к выбору врача
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}