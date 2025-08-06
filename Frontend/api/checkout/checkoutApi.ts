import { jwtPermissionsApi } from "@/api/JWTAuth/api";
import { handleApiError } from "@/lib/error-handler";

/**
 * Crea una preferencia de pago en MercadoPago
 * @param productId - ID del producto
 * @param productName - Nombre del producto
 * @param productPrice - Precio del producto
 * @param userEmail - Email del usuario
 * @param userDni - DNI del usuario
 * @returns Promise<any> Respuesta de MercadoPago
 */
export async function createCheckoutPreference(
  productId: string, 
  productName: string, 
  productPrice: number,
  userEmail: string,
  userDni: string
): Promise<any> {
  try {
    return await jwtPermissionsApi.post('/api/checkout', {
      productId,
      productName,
      productPrice,
      userEmail,
      userDni
    });
  } catch (error) {
    handleApiError(error, 'Error al crear la preferencia de pago');
    throw error;
  }
} 