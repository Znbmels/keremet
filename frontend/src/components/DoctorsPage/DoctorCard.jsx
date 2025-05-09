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

function DoctorCard({ doctor, onSelect, isPatientView }) {
    const fullName = `${doctor.first_name} ${doctor.last_name}`;
    const specialtyRu = SPECIALTY_LABELS[doctor.specialty] || doctor.specialty;
    const experienceYears = doctor.experience || 0;
    const experienceText = `${experienceYears} ${experienceYears === 1 ? 'год' : experienceYears < 5 ? 'года' : 'лет'}`;

    return (
        <div className="doctor-card-vertical">
            <div className="doctor-photo-vertical">
                {doctor.photo ? (
                    <img src={doctor.photo} alt={fullName} />
                ) : (
                    <div className="doctor-photo-placeholder doctor-initials-large">
                        {doctor.first_name[0]}{doctor.last_name[0]}
                    </div>
                )}
            </div>
            <div className="doctor-info-vertical">
                <h3 className="doctor-name-vertical">{fullName}</h3>
                <div className="doctor-specialty-vertical">{specialtyRu}</div>
                {doctor.experience && (
                    <div className="doctor-experience-vertical">Опыт: {experienceText}</div>
                )}
                {doctor.education && (
                    <div className="doctor-education-inline">
                        <span className="doctor-education-label">Образование:</span> {doctor.education}
                    </div>
                )}
                {doctor.consultation_price && (
                    <div className="consultation-price-inline">
                        Стоимость: {doctor.consultation_price} сом
                    </div>
                )}
                {isPatientView && (
                    <button className="appointment-btn-wide">Записаться на прием</button>
                )}
            </div>
            {(doctor.description || doctor.achievements) && (
                <div className="doctor-extra-info">
                    {doctor.description && <div className="doctor-description-vertical">{doctor.description}</div>}
                    {doctor.achievements && <div className="doctor-achievements-vertical">Достижения: {doctor.achievements}</div>}
                </div>
            )}
            {doctor.available_for_online && (
                <div className="online-available-vertical">Доступен для онлайн-консультаций</div>
            )}
        </div>
    );
}

export default DoctorCard;