import React, { useState } from 'react';
import { login } from '../../services/api';
import { setToken } from '../../utils/auth';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('PATIENT');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const data = await login(email, password);
      setToken(data.access, data.refresh);
      window.location.href = role === 'DOCTOR' ? '/doctor/dashboard' : '/patient/dashboard';
    } catch {
      setError('Неверный email или пароль');
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: '60px auto', padding: 32, background: '#fff', borderRadius: 8 }}>
      <h2 style={{ textAlign: 'center' }}>Вход в личный кабинет</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
          <button
            type="button"
            style={{
              background: role === 'DOCTOR' ? '#00b3b3' : '#eee',
              color: role === 'DOCTOR' ? '#fff' : '#333',
              border: 'none',
              padding: '8px 16px',
              borderRadius: 4,
              marginRight: 8,
              cursor: 'pointer'
            }}
            onClick={() => setRole('DOCTOR')}
          >
            Доктор
          </button>
          <button
            type="button"
            style={{
              background: role === 'PATIENT' ? '#00b3b3' : '#eee',
              color: role === 'PATIENT' ? '#fff' : '#333',
              border: 'none',
              padding: '8px 16px',
              borderRadius: 4,
              cursor: 'pointer'
            }}
            onClick={() => setRole('PATIENT')}
          >
            Пациент
          </button>
        </div>
        <input
          type="email"
          placeholder="Email"
          value={email}
          required
          onChange={e => setEmail(e.target.value)}
          style={{ width: '100%', marginBottom: 12, padding: 8, borderRadius: 4, border: '1px solid #ccc' }}
        />
        <input
          type="password"
          placeholder="Пароль"
          value={password}
          required
          onChange={e => setPassword(e.target.value)}
          style={{ width: '100%', marginBottom: 12, padding: 8, borderRadius: 4, border: '1px solid #ccc' }}
        />
        {error && <div style={{ color: 'red', marginBottom: 8 }}>{error}</div>}
        <button
          type="submit"
          style={{
            width: '100%',
            background: '#00b3b3',
            color: '#fff',
            padding: 10,
            border: 'none',
            borderRadius: 4,
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          Войти
        </button>
      </form>
      <div style={{ textAlign: 'center', marginTop: 16 }}>
        Нет аккаунта? <a href="/register">Зарегистрироваться</a>
      </div>
    </div>
  );
};

export default LoginPage; 