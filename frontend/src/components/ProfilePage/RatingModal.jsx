import React, { useState } from 'react';
import './RatingModal.css'; // Создадим этот файл для стилей

function RatingModal({ isOpen, onClose, onSubmit, appointmentTime, doctorName }) {
    const [rating, setRating] = useState(3); // Начальное значение оценки
    const [comment, setComment] = useState('');

    if (!isOpen) {
        return null;
    }

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(rating, comment);
    };

    return (
        <div className="rating-modal-overlay">
            <div className="rating-modal">
                <h3>Оценить прием</h3>
                <p><strong>Врач:</strong> {doctorName}</p>
                <p><strong>Время приема:</strong> {appointmentTime}</p>
                
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="rating-input">Ваша оценка (от 1 до 5): {rating}</label>
                        <input 
                            type="range" 
                            id="rating-input"
                            min="1" 
                            max="5" 
                            step="1" // Оценки целыми числами
                            value={rating} 
                            onChange={(e) => setRating(Number(e.target.value))} 
                            className="rating-slider"
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="comment-input">Комментарий (необязательно):</label>
                        <textarea 
                            id="comment-input"
                            value={comment} 
                            onChange={(e) => setComment(e.target.value)} 
                            rows="3"
                            placeholder="Ваш отзыв о приеме..."
                        />
                    </div>
                    <div className="modal-actions">
                        <button type="button" onClick={onClose} className="button secondary-button">
                            Отмена
                        </button>
                        <button type="submit" className="button primary-button">
                            Отправить оценку
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default RatingModal; 