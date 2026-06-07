import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios'; // Powrót do komunikacji sieciowej

const Register = () => {
    const [formData, setFormData] = useState({ username: '', password: '' });
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Strzał do prawdziwego endpointu rejestracji
            await api.post('/register', formData);
            alert('Konto utworzone pomyślnie! Możesz się zalogować.');
            navigate('/login');
        } catch (error) {
            console.error("Błąd rejestracji:", error);
            alert(error.response?.data?.message || 'Błąd rejestracji. Backend nie odpowiada.');
        }
    };

    return (
        <div className="auth-wrapper">
            <div className="auth-container">
                <h2>Rejestracja</h2>
                <form onSubmit={handleSubmit} className="auth-form">
                    <input 
                        type="text" 
                        placeholder="Nazwa użytkownika" 
                        className="auth-input"
                        value={formData.username}
                        onChange={(e) => setFormData({...formData, username: e.target.value})}
                        required 
                    />
                    <input 
                        type="password" 
                        placeholder="Hasło" 
                        className="auth-input"
                        value={formData.password}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                        required 
                    />
                    <button type="submit" className="auth-button">Zarejestruj się</button>
                </form>
                <p className="auth-link-text">
                    Masz już konto? <Link to="/login" className="auth-link">Zaloguj się</Link>
                </p>
            </div>
        </div>
    );
};

export default Register;