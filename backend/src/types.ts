export interface InventoryItem {
    id: string;
    name: string;
    quantity: number;
    minStockLevel: number; // Minimalny stan, poniżej którego wyświetla się alert
    price: number; // Cena bazowa
    currency: string; // Waluta bazowa artykułu
    location: string; // Np. "Magazyn A", "Regał 4"
    updatedAt: Date;
}

export interface InventoryFilters {
    name?: string;
    location?: string;
    displayCurrency: string;
    minPrice?: number;
    maxPrice?: number;
}

export interface InventoryItemWithTotal extends InventoryItem {
    totalValueBase: number; // Ilość * Cena bazowa
    totalValueTarget: number; // Wartość przeliczona na walutę docelową
    targetCurrency: string; // Potwierdzenie waluty docelowej
}

export interface InventorySummaryResponse {
    items: InventoryItem[];
    pagination: {
        totalItems: number;
        currentPage: number;
        totalPages: number;
    };

    summary: {
        totalItemsCount: number;
        totalValueSum: number; // Suma wartości całego magazynu w targetCurrency
        lowStockAlerts: number; // Liczba artykułów poniżej minStockLevel
        targetCurrency: string;
    };
}
