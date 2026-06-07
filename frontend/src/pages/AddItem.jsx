import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

const AddItem = () => {
    const navigate = useNavigate();
    const [newItem, setNewItem] = useState({
        name: "",
        location: "",
        quantity: "",
        minStockLevel: "",
        price: "",
        currency: "USD",
    });

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            navigate("/login");
        }
    }, [navigate]);

    const handleAddItem = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...newItem,
                quantity: parseInt(newItem.quantity, 10),
                minStockLevel: parseInt(newItem.minStockLevel, 10),
                price: parseFloat(newItem.price),
            };

            const response = await api.post("/inventory", payload);
            if (response.data.success || response.status === 201) {
                // Po udanym dodaniu wracamy na główny widok Dashboardu
                navigate("/"); 
            }
        } catch (error) {
            console.error("Błąd podczas dodawania artykułu:", error);
            alert("Nie udało się dodać artykułu. Backend zwrócił błąd.");
        }
    };

    return (
        <div style={{ padding: "20px", fontFamily: "sans-serif", backgroundColor: "#f8f9fa", minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "flex-start" }}>
            <div style={{ backgroundColor: "#fff", padding: "30px", borderRadius: "8px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)", width: "100%", maxWidth: "600px", marginTop: "40px" }}>
                
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                    <h2 style={{ margin: 0, fontSize: "1.5rem" }}>Dodaj Nowy Artykuł</h2>
                    <button 
                        onClick={() => navigate("/")} 
                        style={{ padding: "6px 12px", backgroundColor: "#e9ecef", color: "#495057", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}
                    >
                        Wróć
                    </button>
                </div>

                <form onSubmit={handleAddItem} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                    <div>
                        <label style={{ display: "block", marginBottom: "5px", fontSize: "0.9rem", fontWeight: "bold" }}>Nazwa Artykułu *</label>
                        <input
                            type="text"
                            required
                            value={newItem.name}
                            onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                            style={{ width: "100%", padding: "10px", border: "1px solid #ccc", borderRadius: "4px", boxSizing: "border-box" }}
                        />
                    </div>
                    <div>
                        <label style={{ display: "block", marginBottom: "5px", fontSize: "0.9rem", fontWeight: "bold" }}>Lokalizacja *</label>
                        <input
                            type="text"
                            required
                            value={newItem.location}
                            onChange={(e) => setNewItem({ ...newItem, location: e.target.value })}
                            style={{ width: "100%", padding: "10px", border: "1px solid #ccc", borderRadius: "4px", boxSizing: "border-box" }}
                        />
                    </div>
                    <div style={{ display: "flex", gap: "15px" }}>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: "block", marginBottom: "5px", fontSize: "0.9rem", fontWeight: "bold" }}>Ilość *</label>
                            <input
                                type="number"
                                required
                                min="0"
                                value={newItem.quantity}
                                onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })}
                                style={{ width: "100%", padding: "10px", border: "1px solid #ccc", borderRadius: "4px", boxSizing: "border-box" }}
                            />
                        </div>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: "block", marginBottom: "5px", fontSize: "0.9rem", fontWeight: "bold" }}>Min. Stan *</label>
                            <input
                                type="number"
                                required
                                min="0"
                                value={newItem.minStockLevel}
                                onChange={(e) => setNewItem({ ...newItem, minStockLevel: e.target.value })}
                                style={{ width: "100%", padding: "10px", border: "1px solid #ccc", borderRadius: "4px", boxSizing: "border-box" }}
                            />
                        </div>
                    </div>
                    <div style={{ display: "flex", gap: "15px" }}>
                        <div style={{ flex: 2 }}>
                            <label style={{ display: "block", marginBottom: "5px", fontSize: "0.9rem", fontWeight: "bold" }}>Cena *</label>
                            <input
                                type="number"
                                required
                                min="0"
                                step="0.01"
                                value={newItem.price}
                                onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                                style={{ width: "100%", padding: "10px", border: "1px solid #ccc", borderRadius: "4px", boxSizing: "border-box" }}
                            />
                        </div>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: "block", marginBottom: "5px", fontSize: "0.9rem", fontWeight: "bold" }}>Waluta</label>
                            <select
                                value={newItem.currency}
                                onChange={(e) => setNewItem({ ...newItem, currency: e.target.value })}
                                style={{ width: "100%", padding: "10px", border: "1px solid #ccc", borderRadius: "4px", backgroundColor: "#fff" }}
                            >
                                <option value="PLN">PLN</option>
                                <option value="USD">USD</option>
                                <option value="EUR">EUR</option>
                                <option value="GBP">GBP</option>
                            </select>
                        </div>
                    </div>
                    <button
                        type="submit"
                        style={{
                            marginTop: "10px",
                            padding: "12px",
                            backgroundColor: "#2f9e44",
                            color: "white",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer",
                            fontWeight: "bold",
                            fontSize: "1rem",
                        }}
                    >
                        Zapisz Artykuł
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AddItem;