/**
 * Gestión de términos y condiciones en localStorage
 * Controla si un usuario ya aceptó los términos y condiciones
 */

import type { UserType } from "./types"

const TERMS_STORAGE_KEY = 'personalfit_terms_accepted'

/**
 * Verifica si un usuario ya aceptó los términos y condiciones
 * @param userId ID del usuario
 * @returns boolean - true si ya aceptó, false si no
 */
export function hasAcceptedTerms(userId: number): boolean {
  try {
    const acceptedUsers = getAcceptedUsers()
    return acceptedUsers.includes(userId)
  } catch (error) {
    console.error('Error verificando términos aceptados:', error)
    return false
  }
}

/**
 * Marca que un usuario aceptó los términos y condiciones
 * @param userId ID del usuario
 */
export function markTermsAsAccepted(userId: number): void {
  try {
    const acceptedUsers = getAcceptedUsers()
    
    if (!acceptedUsers.includes(userId)) {
      acceptedUsers.push(userId)
      localStorage.setItem(TERMS_STORAGE_KEY, JSON.stringify(acceptedUsers))
    }
  } catch (error) {
    console.error('Error guardando términos aceptados:', error)
  }
}

/**
 * Obtiene la lista de usuarios que aceptaron los términos
 * @returns number[] - Array de IDs de usuarios
 */
function getAcceptedUsers(): number[] {
  try {
    const stored = localStorage.getItem(TERMS_STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch (error) {
    console.error('Error leyendo términos del localStorage:', error)
    return []
  }
}

/**
 * Genera el texto personalizado de términos y condiciones con datos del usuario
 * @param user Datos del usuario
 * @returns string - Texto personalizado
 */
export function generatePersonalizedTermsText(user: UserType): string {
  const currentDate = new Date()
  const formattedDate = currentDate.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
  const location = "Santa Fe, Argentina"
  
  const fullName = `${user.firstName} ${user.lastName}`
  const userAddress = user.address && user.address.trim() !== '' ? user.address : '________________________'
  
  return `DESLINDE DE RESPONSABILIDAD
USO DE IMAGEN
DATOS PERSONALES:

Nombres y Apellido: ${fullName}
D.N.I.: ${user.dni}
Dirección: ${userAddress}
Números de contactos de emergencia:
1)
2)
Correo electrónico: ${user.email}

DECLARACIÓN JURADA APTITUD FÍSICA:

Por la presente y con carácter de DECLARACIÓN JURADA, manifiesto que no padezco afecciones físicas adquiridas o congénitas, ni lesiones que pudieran ocasionar trastornos en mi salud o condiciones de vida como consecuencia de y/o en los programas de acondicionamiento físico y/o ejercicios deportivos de toda índole que sean impartidos por MATIAS NICOLAS GUTIERREZ (DNI 36.265.798) en el ámbito de PERSONAL FIT SANTA FE y/o exteriores del mismo.-

En caso de presentar afecciones físicas y/o lesiones y/o fracturas se detallan en el anexo.-

Asimismo declaro bajo juramento que me he realizado un chequeo médico y me encuentro en condiciones físicas óptimas para participar y/o entrenar, como así también asumo todos los riesgos asociados con el entrenamiento y/o con los programas de acondicionamiento físico (lesiones, golpes, caídas, contacto con otros participantes, fallecimiento y/o muerte súbita y/o cualquier otra clase de riesgo que se pudiera ocasionar).

Tomo conocimiento y acepto voluntariamente, que PERSONAL FIT SANTA FE y/o MATIAS NICOLAS GUTIERREZ y/o ORGANIZADORES y/o RESPONSABLES JURIDICOS DE PERSONAL FIT SANTA FE y/o sus representantes, directores, accionistas, profesores NO toman a su cargo ni se responsabilizan por ningún tipo de indemnización, reclamo, costo, daño y/o perjuicio reclamado, incluyendo y no limitado a, daños por accidentes, daños materiales, físicos o psíquicos o morales, lucro cesante, causados a mi persona o a mis derechohabientes, con motivo y en ocasión del entrenamiento y/o programas de acondicionamiento físico y/o todo ejercicio deportivo en la que participaré en el ámbito de PERSONAL FIT SANTA FE y/o en exteriores al mismo.-

RESPONSABILIDAD:

Habiendo leído esta declaración y conociendo estos hechos, libero a PERSONAL FIT SANTA FE y/o MATIAS NICOLAS GUTIERREZ y/o ORGANIZADORES y/o RESPONSABLES JURÍDICOS DE PERSONAL FIT SANTA FE y/o sus representantes, directores, accionistas, profesores de todo y cualquier reclamo o responsabilidad de cualquier tipo que surja de mi participación, aunque esta responsabilidad pueda surgir por negligencia o culpa de parte de las personas nombradas en esta declaración, así como de cualquier extravío, robo y/o hurto que pudiera sufrir EN MIS PERTENENCIAS Y/O BIENES A MI CUIDADO.-

Como así también manifiesto que no serán responsables por robos, hurtos, caso fortuito, cualquiera fuera la causa que lo origine, daño en mi salud provenientes de riñas o peleas de terceros, daño en mi salud proveniente de afecciones físicas o no, que puedan acontecer con anterioridad, durante el transcurso o con posterioridad al entrenamiento físico ya sea dentro del ámbito de PERSONAL FIT SANTA FE y/o en sus exteriores.-

En consecuencia, ASUMO, ATENTO LAS CARACTERÍSTICAS DEL ENTRENAMIENTO Y/O PROGRAMA DE ACONDICIONAMIENTO FÍSICO EN EL QUE VOLUNTARIAMENTE PARTICIPO, QUE CONLLEVA RIESGO DE LESIONES, QUE HE EVALUADO CONCIENZUDAMENTE MI PARTICIPACIÓN, CONTEMPLANDO A TALES EFECTOS MI SITUACIÓN PERSONAL, EDAD, CONDICIÓN FÍSICA Y PESO.

DECLARO QUE MI CONDICIÓN FÍSICA NO CONSTITUYE RIESGO ADICIONAL QUE IMPIDA MI PARTICIPACIÓN, POR ELLO, HE DECIDIDO POR MI PROPIA Y EXCLUSIVA VOLUNTAD PARTICIPAR EN LOS PROGRAMAS DE ACONDICIONAMIENTO FÍSICO Y/O EJERCICIOS DEPORTIVOS DE TODA ÍNDOLE, LIBERANDO DE TODA RESPONSABILIDAD, DEL TIPO QUE FUERA, A PERSONAL FIT SANTA FE y/o MATIAS NICOLAS GUTIERREZ y/o ORGANIZADORES y/o RESPONSABLES JURÍDICOS DE PERSONAL FIT SANTA FE y/o sus representantes, directores, accionistas, profesores.-

PROHIBICIONES:

Manifiesto que se me ha informado la prohibición del uso de sustancias prohibidas y/o bebidas alcohólicas y/o uso de celular durante la clase y/o entrenamiento y/o programa de acondicionamiento físico dentro del establecimiento de PERSONAL FIT SANTA FE y/o exteriores, asumiendo totalmente la responsabilidad por daños y perjuicios que pueda provocar por mi negligencia e impericia, LIBERANDO DE TODA RESPONSABILIDAD, DEL TIPO QUE FUERA, A PERSONAL FIT SANTA FE y/o MATIAS NICOLAS GUTIERREZ y/o ORGANIZADORES y/o RESPONSABLES JURIDICOS DE PERSONAL FIT SANTA FE y/o sus representantes, directores, accionistas, profesores.-

DERECHO DE ADMISIÓN Y PERMANENCIA – SUSPENSIÓN:

Entiendo que PERSONAL FIT SANTA FE y/o MATIAS NICOLAS GUTIERREZ y/o ORGANIZADORES y/o RESPONSABLES JURÍDICOS DE PERSONAL FIT SANTA FE se reserva el derecho de admisión y permanencia en el establecimiento de PERSONAL FIT SANTA FE como así también podrá suspender el programa de acondicionamiento físico sin derecho de reembolso.-

USO DE IMAGEN:

Autorizo a PERSONAL FIT SANTA FE y/o MATIAS NICOLAS GUTIERREZ a utilizar, reproducir, distribuir y/o publicar fotografías, películas, videos, grabaciones y/o cualquier otro medio de registración en redes oficiales de PERSONAL FIT SANTA FE de mi persona tomadas con motivo y en ocasión del ejercicio físico, sin compensación económica alguna a mi favor.-

Leídas detenidamente, comprendidas y analizadas las condiciones establecidas precedentemente, la firma de conformidad del presente constituye una cabal e incondicional aceptación a su contenido.

FIRMA:
ACLARACIÓN:
DNI: ${user.dni}
LUGAR Y FECHA: ${location}, ${formattedDate}`
}

/**
 * Texto completo de términos y condiciones
 */
export const TERMS_AND_CONDITIONS_TEXT = `DESLINDE DE RESPONSABILIDAD
USO DE IMAGEN
DATOS PERSONALES:

Nombres y Apellido:
D.N.I.:
Dirección:
Números de contactos de emergencia:
1)
2)
Correo electrónico:

DECLARACIÓN JURADA APTITUD FÍSICA:

Por la presente y con carácter de DECLARACIÓN JURADA, manifiesto que no padezco afecciones físicas adquiridas o congénitas, ni lesiones que pudieran ocasionar trastornos en mi salud o condiciones de vida como consecuencia de y/o en los programas de acondicionamiento físico y/o ejercicios deportivos de toda índole que sean impartidos por MATIAS NICOLAS GUTIERREZ (DNI 36.265.798) en el ámbito de PERSONAL FIT SANTA FE y/o exteriores del mismo.-

En caso de presentar afecciones físicas y/o lesiones y/o fracturas se detallan en el anexo.-

Asimismo declaro bajo juramento que me he realizado un chequeo médico y me encuentro en condiciones físicas óptimas para participar y/o entrenar, como así también asumo todos los riesgos asociados con el entrenamiento y/o con los programas de acondicionamiento físico (lesiones, golpes, caídas, contacto con otros participantes, fallecimiento y/o muerte súbita y/o cualquier otra clase de riesgo que se pudiera ocasionar).

Tomo conocimiento y acepto voluntariamente, que PERSONAL FIT SANTA FE y/o MATIAS NICOLAS GUTIERREZ y/o ORGANIZADORES y/o RESPONSABLES JURIDICOS DE PERSONAL FIT SANTA FE y/o sus representantes, directores, accionistas, profesores NO toman a su cargo ni se responsabilizan por ningún tipo de indemnización, reclamo, costo, daño y/o perjuicio reclamado, incluyendo y no limitado a, daños por accidentes, daños materiales, físicos o psíquicos o morales, lucro cesante, causados a mi persona o a mis derechohabientes, con motivo y en ocasión del entrenamiento y/o programas de acondicionamiento físico y/o todo ejercicio deportivo en la que participaré en el ámbito de PERSONAL FIT SANTA FE y/o en exteriores al mismo.-

RESPONSABILIDAD:

Habiendo leído esta declaración y conociendo estos hechos, libero a PERSONAL FIT SANTA FE y/o MATIAS NICOLAS GUTIERREZ y/o ORGANIZADORES y/o RESPONSABLES JURÍDICOS DE PERSONAL FIT SANTA FE y/o sus representantes, directores, accionistas, profesores de todo y cualquier reclamo o responsabilidad de cualquier tipo que surja de mi participación, aunque esta responsabilidad pueda surgir por negligencia o culpa de parte de las personas nombradas en esta declaración, así como de cualquier extravío, robo y/o hurto que pudiera sufrir EN MIS PERTENENCIAS Y/O BIENES A MI CUIDADO.-

Como así también manifiesto que no serán responsables por robos, hurtos, caso fortuito, cualquiera fuera la causa que lo origine, daño en mi salud provenientes de riñas o peleas de terceros, daño en mi salud proveniente de afecciones físicas o no, que puedan acontecer con anterioridad, durante el transcurso o con posterioridad al entrenamiento físico ya sea dentro del ámbito de PERSONAL FIT SANTA FE y/o en sus exteriores.-

En consecuencia, ASUMO, ATENTO LAS CARACTERÍSTICAS DEL ENTRENAMIENTO Y/O PROGRAMA DE ACONDICIONAMIENTO FÍSICO EN EL QUE VOLUNTARIAMENTE PARTICIPO, QUE CONLLEVA RIESGO DE LESIONES, QUE HE EVALUADO CONCIENZUDAMENTE MI PARTICIPACIÓN, CONTEMPLANDO A TALES EFECTOS MI SITUACIÓN PERSONAL, EDAD, CONDICIÓN FÍSICA Y PESO.

DECLARO QUE MI CONDICIÓN FÍSICA NO CONSTITUYE RIESGO ADICIONAL QUE IMPIDA MI PARTICIPACIÓN, POR ELLO, HE DECIDIDO POR MI PROPIA Y EXCLUSIVA VOLUNTAD PARTICIPAR EN LOS PROGRAMAS DE ACONDICIONAMIENTO FÍSICO Y/O EJERCICIOS DEPORTIVOS DE TODA ÍNDOLE, LIBERANDO DE TODA RESPONSABILIDAD, DEL TIPO QUE FUERA, A PERSONAL FIT SANTA FE y/o MATIAS NICOLAS GUTIERREZ y/o ORGANIZADORES y/o RESPONSABLES JURÍDICOS DE PERSONAL FIT SANTA FE y/o sus representantes, directores, accionistas, profesores.-

PROHIBICIONES:

Manifiesto que se me ha informado la prohibición del uso de sustancias prohibidas y/o bebidas alcohólicas y/o uso de celular durante la clase y/o entrenamiento y/o programa de acondicionamiento físico dentro del establecimiento de PERSONAL FIT SANTA FE y/o exteriores, asumiendo totalmente la responsabilidad por daños y perjuicios que pueda provocar por mi negligencia e impericia, LIBERANDO DE TODA RESPONSABILIDAD, DEL TIPO QUE FUERA, A PERSONAL FIT SANTA FE y/o MATIAS NICOLAS GUTIERREZ y/o ORGANIZADORES y/o RESPONSABLES JURIDICOS DE PERSONAL FIT SANTA FE y/o sus representantes, directores, accionistas, profesores.-

DERECHO DE ADMISIÓN Y PERMANENCIA – SUSPENSIÓN:

Entiendo que PERSONAL FIT SANTA FE y/o MATIAS NICOLAS GUTIERREZ y/o ORGANIZADORES y/o RESPONSABLES JURÍDICOS DE PERSONAL FIT SANTA FE se reserva el derecho de admisión y permanencia en el establecimiento de PERSONAL FIT SANTA FE como así también podrá suspender el programa de acondicionamiento físico sin derecho de reembolso.-

USO DE IMAGEN:

Autorizo a PERSONAL FIT SANTA FE y/o MATIAS NICOLAS GUTIERREZ a utilizar, reproducir, distribuir y/o publicar fotografías, películas, videos, grabaciones y/o cualquier otro medio de registración en redes oficiales de PERSONAL FIT SANTA FE de mi persona tomadas con motivo y en ocasión del ejercicio físico, sin compensación económica alguna a mi favor.-

Leídas detenidamente, comprendidas y analizadas las condiciones establecidas precedentemente, la firma de conformidad del presente constituye una cabal e incondicional aceptación a su contenido.

FIRMA:
ACLARACIÓN:
DNI:
LUGAR Y FECHA:`