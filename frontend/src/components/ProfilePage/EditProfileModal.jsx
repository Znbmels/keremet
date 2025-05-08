import React, { useState } from 'react';
import './ProfilePage.css'; // Используем стили из ProfilePage.css для единообразия

function EditProfileModal({ isOpen, onClose, profile, onSave }) {
    const [editedProfile, setEditedProfile] = useState({
        first_name: profile.first_name,
        last_name: profile.last_name,
        email: profile.email,
        phone: profile.phone,
        inn: profile.inn,
        specialty: profile.specialty
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setEditedProfile(prev => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(editedProfile);
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h2>Редактировать профиль</h2>
                <form className="modal-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Имя</label>
                        <input
                            type="text"
                            name="first_name"
                            value={editedProfile.first_name}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Фамилия</label>
                        <input
                            type="text"
                            name="last_name"
                            value={editedProfile.last_name}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Email</label>
                        <input
                            type="email"
                            name="email"
                            value={editedProfile.email}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Телефон</label>
                        <input
                            type="tel"
                            name="phone"
                            value={editedProfile.phone}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>ИНН</label>
                        <input
                            type="text"
                            name="inn"
                            value={editedProfile.inn}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    {profile.role === 'DOCTOR' && (
                        <div className="form-group">
                            <label>Специализация</label>
                            <input
                                type="text"
                                name="specialty"
                                value={editedProfile.specialty || ''}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    )}
                    <div className="modal-actions">
                        <button type="button" onClick={onClose}>Отмена</button>
                        <button type="submit" className="save-button">Сохранить</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default EditProfileModal;