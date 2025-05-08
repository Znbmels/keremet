import React from 'react';
import './DoctorCard.css';

const SPECIALTY_LABELS = {
    THERAPIST: 'Терапевт',
    CARDIOLOGIST: 'Кардиолог',
    NEUROLOGIST: 'Невролог',
    PEDIATRICIAN: 'Педиатр',
    SURGEON: 'Хирург',
    DENTIST: 'Стоматолог'
};

function DoctorCard({ doctor, onSelect, isPatientView, isCurrentDoctor }) {
    const fullName = `${doctor.first_name} ${doctor.last_name}`;
    const specialtyRu = SPECIALTY_LABELS[doctor.specialty] || doctor.specialty;
    const experienceYears = doctor.experience || 0;
    const experienceText = `${experienceYears} ${experienceYears === 1 ? 'год' : experienceYears < 5 ? 'года' : 'лет'}`;

    const renderButton = () => {
        if (isCurrentDoctor) {
            return <button className="schedule-btn">Моё расписание</button>;
        }
        if (isPatientView) {
            return <button className="appointment-btn">Записаться на прием</button>;
        }
        return <button className="view-profile-btn">Посмотреть профиль</button>;
    };

    return (
        <div className="doctor-card" onClick={onSelect}>
            <div className="doctor-photo">
                {doctor.photo ? (
                    <img src={doctor.photo} alt={`${doctor.first_name} ${doctor.last_name}`} />
                ) : (
                    <div className="doctor-photo-placeholder">
                        {doctor.first_name[0]}{doctor.last_name[0]}
                    </div>
                )}
                </div>
            <div className="doctor-info">
                <h3 className="doctor-name">{fullName}</h3>
                <p className="doctor-specialty">{specialtyRu}</p>
                {doctor.experience && (
                    <p className="doctor-experience">Опыт работы: {experienceText}</p>
                )}
                {renderButton()}
            </div>
            
            <div className="doctor-card-body">
                {doctor.description && (
                <p className="doctor-description">{doctor.description}</p>
                )}
                {doctor.education && (
                    <div className="doctor-education">
                        <h4>Образование:</h4>
                        <p>{doctor.education}</p>
                    </div>
                )}
                {doctor.achievements && (
                    <div className="doctor-achievements">
                        <h4>Достижения:</h4>
                        <p>{doctor.achievements}</p>
                    </div>
                )}
            </div>
            
            <div className="doctor-card-footer">
                {doctor.consultation_price && (
                    <div className="consultation-price">
                        Стоимость консультации: {doctor.consultation_price} сом
                    </div>
                )}
                {doctor.available_for_online && (
                    <div className="online-available">
                        Доступен для онлайн-консультаций
                    </div>
                )}
            </div>
        </div>
    );
}

export default DoctorCard;