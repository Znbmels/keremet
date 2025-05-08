import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../../api/Api';
import styles from './Auth.module.css';

const RegisterPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    inn: '',
    phone: '',
    specialization: '',
    password: '',
    confirmPassword: '',
    role: 'PATIENT',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check if user is already logged in (один раз при монтировании)
    const token = localStorage.getItem('access_token');
    if (token) {
      navigate('/home', { replace: true });
    }
    // eslint-disable-next-line
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError(''); // Clear error when user makes changes
  };

  const validateForm = () => {
    if (formData.password !== formData.confirmPassword) {
      setError('Пароли не совпадают');
      return false;
    }
    if (formData.inn.length !== 12) {
      setError('ИНН должен содержать ровно 12 цифр');
      return false;
    }
    if (!formData.email || !formData.firstName || !formData.lastName) {
      setError('Пожалуйста, заполните все обязательные поля');
      return false;
    }
    if (formData.role === 'DOCTOR' && !formData.specialization) {
      setError('Для доктора необходимо указать специализацию');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLoading) return;

    setError('');
    setIsLoading(true);

    if (!validateForm()) {
      setIsLoading(false);
      return;
    }

    try {
      await authApi.register(formData);
      // After successful registration, redirect to login page
      window.location.href = '/login';
    } catch (err) {
      console.error('Registration error:', err);
      if (err.response?.data) {
        // Показываем все ошибки из объекта
        const errorMessage = Object.entries(err.response.data)
          .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
          .join(', ');
        setError(`Ошибка при регистрации: ${errorMessage}`);
      } else {
        setError('Ошибка при регистрации. Пожалуйста, проверьте введенные данные.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.authContainer}>
      <h1>Регистрация</h1>

      <div className={styles.roleSelection}>
        <button 
          className={`${styles.roleButton} ${formData.role === 'DOCTOR' ? styles.active : ''}`}
          onClick={() => setFormData(prev => ({ ...prev, role: 'DOCTOR' }))}
          type="button"
          disabled={isLoading}
        >
          <img src="/doctor-icon.svg" alt="Доктор" />
          Доктор
        </button>
        <button 
          className={`${styles.roleButton} ${formData.role === 'PATIENT' ? styles.active : ''}`}
          onClick={() => setFormData(prev => ({ ...prev, role: 'PATIENT' }))}
          type="button"
          disabled={isLoading}
        >
          <img src="/patient-icon.svg" alt="Пациент" />
          Пациент
        </button>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <input
            type="text"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            placeholder="Имя *"
            required
            disabled={isLoading}
          />
        </div>

        <div className={styles.formGroup}>
          <input
            type="text"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            placeholder="Фамилия *"
            required
            disabled={isLoading}
          />
        </div>

        <div className={styles.formGroup}>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Email *"
            required
            disabled={isLoading}
          />
        </div>

        <div className={styles.formGroup}>
          <input
            type="text"
            name="inn"
            value={formData.inn}
            onChange={handleChange}
            placeholder="ИНН *"
            required
            pattern="[0-9]{12}"
            title="ИНН должен содержать ровно 12 цифр"
            disabled={isLoading}
          />
          <small>ИНН должен содержать ровно 12 цифр</small>
        </div>

        <div className={styles.formGroup}>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="Телефон *"
            required
            disabled={isLoading}
          />
        </div>

        {formData.role === 'DOCTOR' && (
          <div className={styles.formGroup}>
            <select
              name="specialization"
              value={formData.specialization}
              onChange={handleChange}
              required={formData.role === 'DOCTOR'}
              disabled={isLoading}
            >
              <option value="">Выберите специализацию *</option>
              <option value="therapist">Терапевт</option>
              <option value="surgeon">Хирург</option>
              <option value="pediatrician">Педиатр</option>
              <option value="neurologist">Невролог</option>
              <option value="cardiologist">Кардиолог</option>
              <option value="dentist">Стоматолог</option>
            </select>
          </div>
        )}

        <div className={styles.formGroup}>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Пароль *"
            required
            disabled={isLoading}
          />
        </div>

        <div className={styles.formGroup}>
          <input
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder="Подтверждение пароля *"
            required
            disabled={isLoading}
          />
        </div>

        {error && <div className={styles.error}>{error}</div>}

        <button 
          type="submit" 
          className={styles.submitButton}
          disabled={isLoading}
        >
          {isLoading ? 'Регистрация...' : 'Зарегистрироваться'}
        </button>

        <div className={styles.loginLink}>
          <Link to="/login">Уже есть аккаунт? Войти</Link>
        </div>
      </form>
    </div>
  );
};

export default RegisterPage; 