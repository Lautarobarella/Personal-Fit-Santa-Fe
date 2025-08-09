/**
 * Tipos de datos para compras
 */
export interface Purchase {
    id: string;
    productId: string;
    userId: string;
    amount: number;
    status: 'pending' | 'approved' | 'rejected' | 'cancelled';
    paymentId?: string;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Base de datos simulada de compras
 * En un entorno real, esto vendría de una base de datos
 */
const purchasesDatabase: Purchase[] = [];

/**
 * Genera un ID único para las compras
 * @returns string ID único
 */
function generatePurchaseId(): string {
    return `purchase_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Crea una nueva compra
 * @param options - Opciones para crear la compra
 * @returns Promise<Purchase> Compra creada
 */
export async function createPurchase(options: {
    productId: string;
    userId: string;
    amount: number;
}): Promise<Purchase> {
    // Simular delay de base de datos
    await new Promise(resolve => setTimeout(resolve, 100));

    const purchase: Purchase = {
        id: generatePurchaseId(),
        productId: options.productId,
        userId: options.userId,
        amount: options.amount,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    purchasesDatabase.push(purchase);

    console.log(`Compra creada: ${purchase.id} para producto ${purchase.productId}`);

    return purchase;
}

/**
 * Obtiene una compra por su ID
 * @param purchaseId - ID de la compra
 * @returns Promise<Purchase | null> Compra encontrada o null
 */
export async function getPurchaseById(purchaseId: string): Promise<Purchase | null> {
    // Simular delay de base de datos
    await new Promise(resolve => setTimeout(resolve, 100));

    return purchasesDatabase.find(p => p.id === purchaseId) || null;
}

/**
 * Confirma una compra cuando el pago es aprobado
 * @param purchaseId - ID de la compra
 * @param paymentId - ID del pago de MercadoPago
 * @returns Promise<Purchase> Compra actualizada
 */
export async function confirmPurchase(purchaseId: string, paymentId?: string): Promise<Purchase> {
    // Simular delay de base de datos
    await new Promise(resolve => setTimeout(resolve, 100));

    const purchaseIndex = purchasesDatabase.findIndex(p => p.id === purchaseId);

    if (purchaseIndex === -1) {
        throw new Error(`Compra no encontrada: ${purchaseId}`);
    }

    const purchase = purchasesDatabase[purchaseIndex];

    // Actualizar estado de la compra
    purchasesDatabase[purchaseIndex] = {
        ...purchase,
        status: 'approved',
        paymentId: paymentId || purchase.paymentId,
        updatedAt: new Date(),
    };

    console.log(`Compra confirmada: ${purchaseId} con pago ${paymentId}`);

    return purchasesDatabase[purchaseIndex];
}

/**
 * Rechaza una compra
 * @param purchaseId - ID de la compra
 * @param reason - Razón del rechazo
 * @returns Promise<Purchase> Compra actualizada
 */
export async function rejectPurchase(purchaseId: string, reason?: string): Promise<Purchase> {
    // Simular delay de base de datos
    await new Promise(resolve => setTimeout(resolve, 100));

    const purchaseIndex = purchasesDatabase.findIndex(p => p.id === purchaseId);

    if (purchaseIndex === -1) {
        throw new Error(`Compra no encontrada: ${purchaseId}`);
    }

    const purchase = purchasesDatabase[purchaseIndex];

    // Actualizar estado de la compra
    purchasesDatabase[purchaseIndex] = {
        ...purchase,
        status: 'rejected',
        updatedAt: new Date(),
    };

    console.log(`Compra rechazada: ${purchaseId} - ${reason || 'Sin razón especificada'}`);

    return purchasesDatabase[purchaseIndex];
}

/**
 * Obtiene todas las compras de un usuario
 * @param userId - ID del usuario
 * @returns Promise<Purchase[]> Lista de compras del usuario
 */
export async function getPurchasesByUserId(userId: string): Promise<Purchase[]> {
    // Simular delay de base de datos
    await new Promise(resolve => setTimeout(resolve, 100));

    return purchasesDatabase.filter(p => p.userId === userId);
}

/**
 * Obtiene todas las compras (para administración)
 * @returns Promise<Purchase[]> Lista de todas las compras
 */
export async function getAllPurchases(): Promise<Purchase[]> {
    // Simular delay de base de datos
    await new Promise(resolve => setTimeout(resolve, 100));

    return [...purchasesDatabase];
} 