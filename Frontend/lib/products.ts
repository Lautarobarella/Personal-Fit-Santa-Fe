/**
 * Tipos de datos para productos
 */
export interface Product {
    id: string;
    name: string;
    description: string;
    price: number;
}

/**
 * Obtiene la cuota mensual desde la API de settings
 * @returns Promise<number> Precio de la cuota mensual
 */
async function getMonthlyFee(): Promise<number> {
    try {
        // Importar dinámicamente para evitar problemas de SSR
        const { fetchMonthlyFee } = await import('@/api/settings/settingsApi');
        return await fetchMonthlyFee();
    } catch (error) {
        console.error('Error fetching monthly fee:', error);
        // Retornar un valor por defecto en caso de error
        return 25000;
    }
}

/**
 * Obtiene todos los productos disponibles
 * @returns Promise<Product[]> Lista de productos
 */
export async function getProducts(): Promise<Product[]> {
    // Obtener la cuota mensual dinámicamente
    const monthlyFee = await getMonthlyFee();
    
    const productsDatabase: Product[] = [
        {
            id: "123",
            name: "Cuota mensual gimnasio",
            description: "Cuota mensual gimnasio Personal Fit",
            price: monthlyFee,
        },
    ];

    // Simular delay de base de datos
    await new Promise(resolve => setTimeout(resolve, 100));

    return productsDatabase;
}

/**
 * Obtiene un producto por su ID
 * @param id - ID del producto
 * @returns Promise<Product | null> Producto encontrado o null
 */
export async function getProductById(id: string): Promise<Product | null> {
    // Obtener la cuota mensual dinámicamente
    const monthlyFee = await getMonthlyFee();
    
    const productsDatabase: Product[] = [
        {
            id: "123",
            name: "Cuota mensual gimnasio",
            description: "Cuota mensual gimnasio Personal Fit",
            price: monthlyFee,
        },
    ];

    // Simular delay de base de datos
    await new Promise(resolve => setTimeout(resolve, 100));

    const product = productsDatabase.find(p => p.id === id);
    return product || null;
} 