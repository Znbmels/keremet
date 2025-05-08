import React, { Component } from 'react';
import { authApi } from '../../api/Api';
import styles from './Auth.module.css';

class LoginPage extends Component {
  state = {
    email: '',
    password: '',
    error: null,
    isLoading: false
  };

  componentDidMount() {
    // Check if user is already logged in
    const token = localStorage.getItem('access_token');
    if (token) {
      window.location.replace('/home');
    }
  }

  handleInputChange = (e) => {
    this.setState({
      [e.target.name]: e.target.value,
      error: null
    });
  };

  handleSubmit = async (e) => {
    e.preventDefault();
    if (this.state.isLoading) return;

    this.setState({ isLoading: true, error: null });
    
    try {
      // Clear old data
      localStorage.clear();

      const response = await authApi.login(this.state.email, this.state.password);
      
      if (!response || !response.access) {
        throw new Error('Неверный ответ от сервера');
      }

      // Save new data
      localStorage.setItem('access_token', response.access);
      localStorage.setItem('refresh_token', response.refresh);
      localStorage.setItem('user_role', response.user_role || 'PATIENT');
      localStorage.setItem('user_id', response.user_id?.toString() || '');
      localStorage.setItem('full_name', response.full_name || `${response.first_name || ''} ${response.last_name || ''}`);

      // Force navigation to home page
      window.location.replace('/home');

    } catch (error) {
      console.error('Login error:', error);
      this.setState({
        error: error.response?.data?.detail || error.message || 'Ошибка входа. Проверьте email и пароль.',
        isLoading: false
      });
    }
  };

  render() {
    const { email, password, error, isLoading } = this.state;

    return (
      <div className={styles.authContainer}>
        <div className={styles.authForm}>
          <h2>Вход в систему</h2>
          
          {error && (
            <div className={styles.error} style={{ 
              color: 'red', 
              marginBottom: '10px',
              padding: '10px',
              backgroundColor: '#ffebee',
              borderRadius: '4px'
            }}>
              {error}
            </div>
          )}

          <form onSubmit={this.handleSubmit}>
            <div className={styles.formGroup}>
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={email}
                onChange={this.handleInputChange}
                disabled={isLoading}
                required
                style={{ 
                  width: '100%', 
                  padding: '10px',
                  marginBottom: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
              />
            </div>

            <div className={styles.formGroup}>
              <input
                type="password"
                name="password"
                placeholder="Пароль"
                value={password}
                onChange={this.handleInputChange}
                disabled={isLoading}
                required
                style={{ 
                  width: '100%', 
                  padding: '10px',
                  marginBottom: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
              />
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: isLoading ? '#cccccc' : '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                fontSize: '16px'
              }}
            >
              {isLoading ? 'Вход...' : 'Войти'}
            </button>
          </form>

          <div style={{ 
            marginTop: '15px', 
            textAlign: 'center',
            fontSize: '14px'
          }}>
            <a 
              href="/register" 
              style={{ 
                color: '#007bff', 
                textDecoration: 'none',
                ':hover': {
                  textDecoration: 'underline'
                }
              }}
            >
              Регистрация
            </a>
          </div>
        </div>
      </div>
    );
  }
}

export default LoginPage;