import React from "react";
import "./TopBar.css";
import logo from '../../assets/whitelogo.png';
import { Link, useNavigate } from 'react-router-dom';

const TopBar = () => {
    const navigate = useNavigate();
    const token = localStorage.getItem('access_token');

    const handleLogout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user_role');
        localStorage.removeItem('user_id');
        localStorage.removeItem('full_name');
        navigate('/login');
    };

    return (
        <header className="topbar">
            <Link to={token ? "/home" : "/"} style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
                <div className="topbar__logo">
                    <img src={logo} alt="Логотип Керемет" className="topbar__logo-img" />
                </div>
            </Link>
            <nav className="topbar__nav">
                {token ? (
                    <>
                        <Link to="/home" className="topbar__link">Главная</Link>
                        <Link to="/doctors" className="topbar__link">Врачи</Link>
                        <Link to="/appointment" className="topbar__link">Записаться на приём</Link>
                        <Link to="/tests" className="topbar__link">Анализы</Link>
                        <Link to="/about" className="topbar__link">О нас</Link>
                        <Link to="/contacts" className="topbar__link">Контакты</Link>
                        <Link to="/profile" className="topbar__link">Личный кабинет</Link>
                        <button onClick={handleLogout} className="topbar__btn topbar__btn--outline">Выйти</button>
                    </>
                ) : (
                    <>
                        <Link to="/about" className="topbar__link">О нас</Link>
                        <Link to="/contacts" className="topbar__link">Контакты</Link>
                        <Link to="/login" className="topbar__link">Войти</Link>
                    </>
                )}
            </nav>
        </header>
    );
};

export default TopBar;