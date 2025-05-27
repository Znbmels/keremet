import React, { useEffect, useState } from 'react';
import './DoctorCard.css';
// import CustomStarIcon from '../common/CustomStarIcon'; // Больше не используем
import { ratingApi } from '../../api/Api';

const SPECIALTY_LABELS = {
    THERAPIST: 'Терапевт',
    CARDIOLOGIST: 'Кардиолог',
    NEUROLOGIST: 'Невролог',
    PEDIATRICIAN: 'Педиатр',
    SURGEON: 'Хирург',
    DENTIST: 'Стоматолог'
};

function DoctorCard({ doctor, onSelect, isPatientView }) {
    const [doctorRating, setDoctorRating] = useState(doctor.average_rating || 0);
    // const [ratingCount, setRatingCount] = useState(doctor.rating_count || 0); // Можно будет раскомментировать если нужно отображать кол-во оценок
    
    useEffect(() => {
        const fetchDoctorRating = async () => {
            try {
                // doctor.id должен быть user_id врача, если DoctorSerializer отдает user.id как id врача
                // Или, если DoctorSerializer отдает Doctor.id, то надо убедиться, что ratingApi.getDoctorRating ожидает Doctor.id
                // Судя по бэкенду, average-rating эндпоинт ожидает User ID (doctor_id)
                // DoctorSerializer в поле 'user' содержит ID пользователя User.
                // Поэтому doctor.user (если это ID) или doctor.id (если это User ID)
                
                let effectiveDoctorId = doctor.user; // Предполагаем, что doctor.user это ID пользователя-врача
                if (typeof doctor.user === 'object' && doctor.user !== null) {
                    effectiveDoctorId = doctor.user.id; // Если doctor.user это объект User
                }
                 if (!effectiveDoctorId && doctor.id) { // Фоллбэк на doctor.id если doctor.user не определен
                    effectiveDoctorId = doctor.id;
                }

                if (effectiveDoctorId) {
                    const ratingData = await ratingApi.getDoctorRating(effectiveDoctorId);
                    // Теперь ratingData это объект { average_rating: X, rating_count: Y }
                    if (ratingData && typeof ratingData.average_rating === 'number') {
                        setDoctorRating(ratingData.average_rating);
                        // setRatingCount(ratingData.rating_count); // Если нужно будет отображать
                    } else {
                        // Если вдруг API вернуло что-то не то, но не ошибку (например, пустой объект)
                        // оставляем то, что пришло с doctor.average_rating или 0
                        setDoctorRating(doctor.average_rating || 0);
                    }
                } else {
                    // Если нет ID врача, используем то, что уже есть в doctor.average_rating
                     setDoctorRating(doctor.average_rating || 0);
                }
            } catch (error) {
                console.error(`Ошибка при загрузке рейтинга для врача ID ${doctor.user || doctor.id}:`, error);
                // В случае ошибки оставляем значение, которое пришло с doctor.average_rating или 0
                setDoctorRating(doctor.average_rating || 0);
            }
        };
        
        // Загружаем рейтинг только если у нас есть объект doctor
        if (doctor) {
             fetchDoctorRating();
        } else {
            // Если нет объекта doctor, ставим рейтинг в 0 или оставляем начальное значение
            setDoctorRating(doctor.average_rating || 0);
        }

    }, [doctor]); // Зависимость от всего объекта doctor

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
                        Стоимость: {doctor.consultation_price} тенге
                    </div>
                )}
                <div className="doctor-rating-display-simple">
                   Рейтинг: <span className="doctor-rating-value-simple">{typeof doctorRating === 'number' ? doctorRating.toFixed(1) : 'Н/Д'}</span>
                </div>

                {isPatientView && (
                    <button 
                        className="appointment-btn-wide"
                        onClick={onSelect}
                    >
                        Записаться на прием
                    </button>
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