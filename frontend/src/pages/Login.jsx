import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/axios";

const Login = () => {
    const [formData, setFormData] = useState({ username: "", password: "" });
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await api.post("/auth/login", formData);

            if (response.data && response.data.token) {
                localStorage.setItem("token", response.data.token);
            } else if (response.data && response.data.success) {
                localStorage.setItem("token", "authenticated-session");
            }

            navigate("/dashboard");
        } catch (error) {
            console.error("Błąd logowania:", error);
            alert(
                error.response?.data?.message ||
                    "Niepoprawne dane logowania lub brak połączenia z bazą.",
            );
        }
    };

    return (
        <div className="auth-wrapper">
            <div className="auth-container">
                <h2>Logowanie</h2>
                <form onSubmit={handleSubmit} className="auth-form">
                    <input
                        type="text"
                        placeholder="Nazwa użytkownika"
                        className="auth-input"
                        value={formData.username}
                        onChange={(e) =>
                            setFormData({
                                ...formData,
                                username: e.target.value,
                            })
                        }
                        required
                    />
                    <input
                        type="password"
                        placeholder="Hasło"
                        className="auth-input"
                        value={formData.password}
                        onChange={(e) =>
                            setFormData({
                                ...formData,
                                password: e.target.value,
                            })
                        }
                        required
                    />
                    <button type="submit" className="auth-button">
                        Zaloguj się
                    </button>
                </form>
                <p className="auth-link-text">
                    Nie masz konta?{" "}
                    <Link to="/register" className="auth-link">
                        Zarejestruj się
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default Login;
