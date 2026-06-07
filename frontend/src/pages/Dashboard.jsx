import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

const Dashboard = () => {
    const navigate = useNavigate();
    const [items, setItems] = useState([]);
    const [summary, setSummary] = useState(null);

    // Stan formularza filtrów
    const [filters, setFilters] = useState({
        name: "",
        location: "",
        displayCurrency: "USD",
        minPrice: "",
        maxPrice: "",
    });

    const fetchInventory = async () => {
        try {
            const params = Object.fromEntries(
                Object.entries(filters).filter(([_, v]) => v !== ""),
            );

            const response = await api.get("/inventory/search", { params });

            setItems(response.data.items || []);
            setSummary(response.data.summary || null);
        } catch (error) {
            console.error("Błąd pobierania danych z API:", error);
            if (error.response && error.response.status === 401) {
                localStorage.removeItem("token");
                navigate("/login");
            }
        }
    };

    // Pobierz dane przy pierwszym wejściu
    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            navigate("/login");
            return;
        }
        fetchInventory();
    }, []);

    const handleSearch = (e) => {
        e.preventDefault();
        fetchInventory();
    };

    // Prawdziwe usuwanie przez metodę DELETE
    const handleDelete = async (id) => {
        if (
            !window.confirm(
                "Na pewno chcesz bezpowrotnie usunąć ten artykuł z bazy danych?",
            )
        )
            return;

        try {
            const response = await api.delete(`/inventory/${id}`);
            if (response.data.success) {
                // Po udanym usunięciu odświeżamy dane z bazy
                fetchInventory();
            }
        } catch (error) {
            console.error("Błąd podczas usuwania z bazy:", error);
            alert("Nie udało się usunąć artykułu. Backend zwrócił błąd.");
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        navigate("/login");
    };

    return (
        <div
            className="dashboard"
            style={{
                padding: "20px",
                fontFamily: "sans-serif",
                backgroundColor: "#f8f9fa",
                minHeight: "100vh",
            }}
        >
            <header
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    backgroundColor: "#fff",
                    padding: "15px 20px",
                    borderRadius: "8px",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                    marginBottom: "20px",
                }}
            >
                <h1 style={{ margin: 0, fontSize: "1.5rem", color: "#333" }}>
                    System Monitorowania Stanu Magazynowego
                </h1>
                <div
                    style={{
                        display: "flex",
                        gap: "15px",
                        alignItems: "center",
                    }}
                >
                    <span style={{ fontWeight: "500" }}>Zalogowany: Admin</span>
                    <button
                        onClick={handleLogout}
                        style={{
                            padding: "8px 16px",
                            backgroundColor: "#000",
                            border: "1px solid #ccc",
                            borderRadius: "4px",
                            cursor: "pointer",
                            fontWeight: "bold",
                        }}
                    >
                        Wyloguj
                    </button>
                </div>
            </header>

            <section
                style={{
                    backgroundColor: "#fff",
                    padding: "20px",
                    borderRadius: "8px",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                    marginBottom: "20px",
                }}
            >
                <form
                    onSubmit={handleSearch}
                    style={{
                        display: "flex",
                        gap: "15px",
                        flexWrap: "wrap",
                        alignItems: "flex-end",
                    }}
                >
                    <div style={{ flex: 1, minWidth: "150px" }}>
                        <label
                            style={{
                                display: "block",
                                marginBottom: "5px",
                                fontSize: "0.9rem",
                                fontWeight: "bold",
                            }}
                        >
                            Nazwa Artykułu
                        </label>
                        <input
                            type="text"
                            placeholder="Nazwa artykułu"
                            value={filters.name}
                            onChange={(e) =>
                                setFilters({ ...filters, name: e.target.value })
                            }
                            style={{
                                width: "100%",
                                padding: "8px",
                                boxSizing: "border-box",
                                border: "1px solid #ccc",
                                borderRadius: "4px",
                            }}
                        />
                    </div>
                    <div style={{ flex: 1, minWidth: "150px" }}>
                        <label
                            style={{
                                display: "block",
                                marginBottom: "5px",
                                fontSize: "0.9rem",
                                fontWeight: "bold",
                            }}
                        >
                            Lokalizacja
                        </label>
                        <input
                            type="text"
                            placeholder="Lokalizacja"
                            value={filters.location}
                            onChange={(e) =>
                                setFilters({
                                    ...filters,
                                    location: e.target.value,
                                })
                            }
                            style={{
                                width: "100%",
                                padding: "8px",
                                boxSizing: "border-box",
                                border: "1px solid #ccc",
                                borderRadius: "4px",
                            }}
                        />
                    </div>
                    <div style={{ width: "100px" }}>
                        <label
                            style={{
                                display: "block",
                                marginBottom: "5px",
                                fontSize: "0.9rem",
                                fontWeight: "bold",
                            }}
                        >
                            Cena Min.
                        </label>
                        <input
                            type="number"
                            placeholder="Cena"
                            value={filters.minPrice}
                            onChange={(e) =>
                                setFilters({
                                    ...filters,
                                    minPrice: e.target.value,
                                })
                            }
                            style={{
                                width: "100%",
                                padding: "8px",
                                boxSizing: "border-box",
                                border: "1px solid #ccc",
                                borderRadius: "4px",
                            }}
                        />
                    </div>
                    <div style={{ width: "100px" }}>
                        <label
                            style={{
                                display: "block",
                                marginBottom: "5px",
                                fontSize: "0.9rem",
                                fontWeight: "bold",
                            }}
                        >
                            Cena Max.
                        </label>
                        <input
                            type="number"
                            placeholder="Cena"
                            value={filters.maxPrice}
                            onChange={(e) =>
                                setFilters({
                                    ...filters,
                                    maxPrice: e.target.value,
                                })
                            }
                            style={{
                                width: "100%",
                                padding: "8px",
                                boxSizing: "border-box",
                                border: "1px solid #ccc",
                                borderRadius: "4px",
                            }}
                        />
                    </div>
                    <div style={{ width: "100px" }}>
                        <label
                            style={{
                                display: "block",
                                marginBottom: "5px",
                                fontSize: "0.9rem",
                                fontWeight: "bold",
                            }}
                        >
                            Waluta
                        </label>
                        <select
                            value={filters.displayCurrency}
                            onChange={(e) =>
                                setFilters({
                                    ...filters,
                                    displayCurrency: e.target.value,
                                })
                            }
                            style={{
                                width: "100%",
                                padding: "8px",
                                border: "1px solid #ccc",
                                borderRadius: "4px",
                                backgroundColor: "#000",
                            }}
                        >
                            <option value="PLN">PLN</option>
                            <option value="USD">USD</option>
                            <option value="EUR">EUR</option>
                            <option value="GBP">GBP</option>
                        </select>
                    </div>
                    <button
                        type="submit"
                        style={{
                            padding: "9px 24px",
                            backgroundColor: "#0056b3",
                            color: "white",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer",
                            fontWeight: "bold",
                            fontSize: "1rem",
                        }}
                    >
                        Szukaj
                    </button>
                </form>
            </section>

            <section
                style={{
                    backgroundColor: "#fff",
                    padding: "20px",
                    borderRadius: "8px",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                    marginBottom: "20px",
                }}
            >
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "15px",
                    }}
                >
                    <h2 style={{ margin: 0, fontSize: "1.25rem" }}>
                        Aktualny Stan Magazynu
                    </h2>
                    <button
                        type="button"
                        onClick={() =>
                            alert(
                                "Wymóg integracyjny eksportu zostanie obsłużony przez endpoint backendu.",
                            )
                        }
                        style={{
                            padding: "6px 12px",
                            border: "1px solid #ccc",
                            borderRadius: "4px",
                            backgroundColor: "#000",
                            cursor: "pointer",
                        }}
                    >
                        Wyeksportuj Dane (JSON/XML)
                    </button>
                </div>
                <table
                    style={{
                        width: "100%",
                        borderCollapse: "collapse",
                        textAlign: "left",
                    }}
                >
                    <thead>
                        <tr
                            style={{
                                backgroundColor: "#f1f3f5",
                                borderBottom: "2px solid #dee2e6",
                            }}
                        >
                            <th style={{ padding: "12px" }}>ID</th>
                            <th style={{ padding: "12px" }}>Nazwa Artykułu</th>
                            <th style={{ padding: "12px" }}>Lokalizacja</th>
                            <th style={{ padding: "12px" }}>Ilość</th>
                            <th style={{ padding: "12px" }}>Minimalny Stan</th>
                            <th style={{ padding: "12px" }}>Cena Bazowa</th>
                            <th style={{ padding: "12px" }}>
                                Wartość Łączna ({filters.displayCurrency})
                            </th>
                            <th style={{ padding: "12px" }}>UpdatedAt</th>
                            <th style={{ padding: "12px" }}>Akcje</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.length > 0 ? (
                            items.map((item) => {
                                const isLowStock =
                                    item.quantity < item.minStockLevel;
                                return (
                                    <tr
                                        key={item.id}
                                        style={{
                                            borderBottom: "1px solid #dee2e6",
                                            backgroundColor: isLowStock
                                                ? "#fff5f5"
                                                : "transparent",
                                        }}
                                    >
                                        <td style={{ padding: "12px" }}>
                                            {item.id}
                                        </td>
                                        <td
                                            style={{
                                                padding: "12px",
                                                fontWeight: "500",
                                            }}
                                        >
                                            {item.name}{" "}
                                            {isLowStock && (
                                                <span
                                                    style={{ color: "#e03131" }}
                                                >
                                                    ⚠️
                                                </span>
                                            )}
                                        </td>
                                        <td
                                            style={{
                                                padding: "12px",
                                                color: "#666",
                                            }}
                                        >
                                            {item.location}
                                        </td>
                                        <td
                                            style={{
                                                padding: "12px",
                                                fontWeight: "bold",
                                                color: isLowStock
                                                    ? "#e03131"
                                                    : "#2b2b2b",
                                            }}
                                        >
                                            {item.quantity}
                                        </td>
                                        <td
                                            style={{
                                                padding: "12px",
                                                color: "#2f9e44",
                                            }}
                                        >
                                            {item.minStockLevel}
                                        </td>
                                        <td style={{ padding: "12px" }}>
                                            {item.price
                                                ? item.price.toFixed(2)
                                                : "0.00"}{" "}
                                            {item.currency}
                                        </td>
                                        {/* Backend zwraca totalValueTarget przeliczone przez API walutowe */}
                                        <td
                                            style={{
                                                padding: "12px",
                                                fontWeight: "500",
                                            }}
                                        >
                                            {item.totalValueTarget
                                                ? item.totalValueTarget.toFixed(
                                                      2,
                                                  )
                                                : "0.00"}{" "}
                                            {item.targetCurrency ||
                                                filters.displayCurrency}
                                        </td>
                                        <td
                                            style={{
                                                padding: "12px",
                                                fontSize: "0.85rem",
                                                color: "#888",
                                            }}
                                        >
                                            {item.updatedAt
                                                ? new Date(
                                                      item.updatedAt,
                                                  ).toLocaleDateString()
                                                : "-"}
                                        </td>
                                        <td style={{ padding: "12px" }}>
                                            <button
                                                onClick={() =>
                                                    handleDelete(item.id)
                                                }
                                                style={{
                                                    padding: "4px 8px",
                                                    backgroundColor: "#fa5252",
                                                    color: "white",
                                                    border: "none",
                                                    borderRadius: "4px",
                                                    cursor: "pointer",
                                                }}
                                            >
                                                Usuń
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })
                        ) : (
                            <tr>
                                <td
                                    colSpan="9"
                                    style={{
                                        padding: "20px",
                                        textAlign: "center",
                                        color: "#888",
                                    }}
                                >
                                    Brak danych lub brak połączenia z serwerem.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </section>

            {summary && (
                <footer
                    style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr 1fr",
                        gap: "20px",
                    }}
                >
                    <div
                        style={{
                            backgroundColor: "#fff",
                            padding: "20px",
                            borderRadius: "8px",
                            boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                        }}
                    >
                        <span
                            style={{
                                fontSize: "0.9rem",
                                color: "#666",
                                fontWeight: "500",
                            }}
                        >
                            Suma Artykułów
                        </span>
                        <div
                            style={{
                                fontSize: "1.8rem",
                                fontWeight: "bold",
                                color: "#2f9e44",
                                marginTop: "5px",
                            }}
                        >
                            {summary.totalItemsCount}
                        </div>
                    </div>
                    <div
                        style={{
                            backgroundColor: "#fff",
                            padding: "20px",
                            borderRadius: "8px",
                            boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                        }}
                    >
                        <span
                            style={{
                                fontSize: "0.9rem",
                                color: "#666",
                                fontWeight: "500",
                            }}
                        >
                            Całkowita Wartość ({summary.targetCurrency})
                        </span>
                        <div
                            style={{
                                fontSize: "1.8rem",
                                fontWeight: "bold",
                                color: "#333",
                                marginTop: "5px",
                            }}
                        >
                            {summary.totalValueSum
                                ? summary.totalValueSum.toLocaleString(
                                      "pl-PL",
                                      {
                                          minimumFractionDigits: 2,
                                          maximumFractionDigits: 2,
                                      },
                                  )
                                : "0,00"}
                        </div>
                        <span style={{ fontSize: "0.75rem", color: "#999" }}>
                            Dynamically updated with filters (
                            {summary.targetCurrency})
                        </span>
                    </div>
                    <div
                        style={{
                            backgroundColor: "#fff",
                            padding: "20px",
                            borderRadius: "8px",
                            boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                        }}
                    >
                        <span
                            style={{
                                fontSize: "0.9rem",
                                color: "#666",
                                fontWeight: "500",
                            }}
                        >
                            Alerty Niskiego Stanu
                        </span>
                        <div
                            style={{
                                fontSize: "1.8rem",
                                fontWeight: "bold",
                                color:
                                    summary.lowStockAlerts > 0
                                        ? "#e03131"
                                        : "#2f9e44",
                                marginTop: "5px",
                            }}
                        >
                            {summary.lowStockAlerts}
                        </div>
                    </div>
                </footer>
            )}
        </div>
    );
};

export default Dashboard;
