import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { commonApi } from '../../api/Api';
import './DoctorsPage.css';
import DoctorCard from './DoctorCard';

function DoctorsPage() {
    const navigate = useNavigate();
    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedSpecialty, setSelectedSpecialty] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const userRole = localStorage.getItem('user_role');

    const specialties = [
        { value: '', label: 'Все специальности' },
        { value: 'THERAPIST', label: 'Терапевт' },
        { value: 'SURGEON', label: 'Хирург' },
        { value: 'PEDIATRICIAN', label: 'Педиатр' },
        { value: 'NEUROLOGIST', label: 'Невролог' },
        { value: 'CARDIOLOGIST', label: 'Кардиолог' },
        { value: 'DENTIST', label: 'Стоматолог' },
    ];

    useEffect(() => {
        const checkAuth = () => {
            const token = localStorage.getItem('access_token');
            if (!token) {
                navigate('/login');
                return;
            }
        };
        checkAuth();
    }, [navigate]);

    const fetchDoctors = useCallback(async () => {
        try {
            setLoading(true);
            const data = await commonApi.getDoctors(selectedSpecialty);
            setDoctors(data);
            setError('');
        } catch (err) {
            setError('Ошибка при загрузке списка врачей');
            console.error('Error fetching doctors:', err);
            if (err.response?.status === 401) {
                navigate('/login');
            }
        } finally {
            setLoading(false);
        }
    }, [selectedSpecialty, navigate]);

    useEffect(() => {
        fetchDoctors();
    }, [fetchDoctors]);

    const handleDoctorSelect = (doctor) => {
        if (userRole === 'PATIENT') {
            navigate('/appointment', { state: { selectedDoctor: doctor } });
        } else if (userRole === 'DOCTOR') {
            // Если текущий пользователь - врач, проверяем, его ли это профиль
            const currentUserId = localStorage.getItem('user_id');
            if (doctor.id === parseInt(currentUserId)) {
                navigate('/doctor/schedule'); // Перенаправляем на страницу расписания
            } else {
                navigate(`/doctor/${doctor.id}`); // Просмотр профиля другого врача
            }
        }
    };

    const filteredDoctors = doctors.filter(doctor => {
        const fullName = `${doctor.first_name} ${doctor.last_name}`.toLowerCase();
        const specialty = doctor.specialty.toLowerCase();
        const search = searchTerm.toLowerCase();
        
        return fullName.includes(search) || specialty.includes(search);
    });

    if (loading) return <div className="doctors-loading">Загрузка...</div>;
    if (error) return <div className="doctors-error">{error}</div>;

    return (
        <div className="doctors-page">
            <h1 className="doctors-title">Наши специалисты</h1>
            
            <div className="doctors-filters">
                <div className="specialty-buttons">
                    {specialties.map(spec => (
                        <button
                            key={spec.value}
                            className={`specialty-button ${selectedSpecialty === spec.value ? 'active' : ''}`}
                            onClick={() => setSelectedSpecialty(spec.value)}
                        >
                            {spec.label}
                        </button>
                    ))}
                </div>
                
                <div className="search-container">
                    <input
                        type="text"
                        placeholder="Поиск врача по имени или специальности..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input"
                    />
                </div>
            </div>

            {filteredDoctors.length === 0 ? (
                <div className="no-doctors-found">
                    {searchTerm ? 
                        'По вашему запросу врачей не найдено' :
                        'В выбранной специальности врачей не найдено'
                    }
                </div>
            ) : null}
            <div className="doctors-grid">
                {filteredDoctors.map(doctor => (
                    <DoctorCard
                        key={doctor.id}
                        doctor={doctor}
                        onSelect={() => handleDoctorSelect(doctor)}
                        isPatientView={userRole === 'PATIENT'}
                        isCurrentDoctor={doctor.id === parseInt(localStorage.getItem('user_id'))}
                    />
                ))}
            </div>
        </div>
    );
}

export default DoctorsPage;