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
 * Base de datos simulada de productos
 * En un entorno real, esto vendría de una base de datos
 */
const productsDatabase: Product[] = [
    {
        id: "123",
        name: "Cuota mensual gimnasio",
        description: "Cuota mensual gimnasio Personal Fit",
        price: 25000,
    },
];

/**
 * Obtiene todos los productos disponibles
 * @returns Promise<Product[]> Lista de productos
 */
export async function getProducts(): Promise<Product[]> {
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
    // Simular delay de base de datos
    await new Promise(resolve => setTimeout(resolve, 100));

    const product = productsDatabase.find(p => p.id === id);
    return product || null;
} 