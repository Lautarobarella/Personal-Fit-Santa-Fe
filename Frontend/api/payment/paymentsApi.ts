import { NewPaymentInput } from "@/lib/types";

const BASE_URL = 'http://localhost:8080/api/payment';


export async function fetchPayments() {
  try {
    const response = await fetch(`${BASE_URL}/getAll`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Error al obtener los pagos: ${response.status}`);
    }

    return await response.json();

  } catch (error) {
    console.error('Error fetching payments:', error);
    return [];
  }
}

// export async function createPayment(payment: NewPaymentInput) {
//   try {
//     const formData = new FormData();
//     console.log("Creando pago:", payment);
//     const dto = {
//       clientId: 1,
//       clientDni: payment.clientDni,
//       amount: payment.amount,
//       createdAt: new Date(payment.createdAt + 'T00:00:00').toISOString().slice(0, 19),
//       expiresAt: new Date(payment.expiresAt + 'T00:00:00').toISOString().slice(0, 19),
//       methodType: "transfer",
//       confNumber: Math.floor(Math.random() * 1000000),
//       paymentStatus: payment.paymentStatus,
//     };

//     formData.append("payment", new Blob([JSON.stringify(dto)], {
//       type: "application/json"
//     }))

//     if (payment.file) {
//       formData.append("file", payment.file)
//     }

//     for (let pair of formData.entries()) {
//       console.log(pair[0], pair[1]);
//     }


//     const response = await fetch(`${BASE_URL}/new`, {
//       method: "POST",
//       body: formData
//     });

//     if (!response.ok) {
//       throw new Error("Error al crear el pago");
//     }

//     return await response.json();
//   } catch (error) {
//     console.error("Error creando el pago:", error);
//     throw error;
//   }
// }

export async function createPayment({
  clientDni,
  amount,
  createdAt,
  expiresAt,
  file
}: {
  clientDni: number
  amount: number
  createdAt: string
  expiresAt: string
  file?: File
}) {
  const formData = new FormData()

  // Crear un objeto payment compatible con el DTO del backend
  const payment = {
    clientDni,
    amount,
    createdAt: new Date(createdAt + "T00:00:00").toISOString().slice(0, 19),
    expiresAt: new Date(expiresAt + "T00:00:00").toISOString().slice(0, 19),
    paymentStatus: "pending",
  }

  // Agregar el JSON como Blob
  formData.append("payment", new Blob([JSON.stringify(payment)], { type: "application/json" }))

  // Agregar el archivo si hay uno
  if (file) {
    formData.append("file", file)
  }

  const response = await fetch("http://localhost:8080/api/payments/new", {
    method: "POST",
    body: formData
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Error en el servidor: ${response.status} - ${errorText}`)
  }
}



export async function fetchPaymentsById(id: number) {
  try {
    const response = await fetch(`${BASE_URL}/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Error al obtener los pagos: ${response.status}`);
    }

    return await response.json();

  } catch (error) {
    console.error('Error fetching payments:', error);
    return [];
  }
}

export async function fetchPaymentDetail(id: number) {
  try {
    const response = await fetch(`${BASE_URL}/info/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }

    return await response.json();

  } catch (error) {
    console.error('Error fetching payment:', error);
    throw error;
  }
}

export async function fetchPendingPaymentDetail() {
  try {
    const response = await fetch(`${BASE_URL}/info/pending`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }

    return await response.json();

  } catch (error) {
    console.error('Error fetching payment:', error);
    throw error;
  }
}

export async function updatePayment(id: number, status: "paid" | "rejected", rejectionReason?: string) {
  try {
    const response = await fetch(`${BASE_URL}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status, rejectionReason }),
    });

    if (!response.ok) {
      throw new Error(`Error al actualizar el pago: ${response.status}`);
    }

    return await response.json();

  } catch (error) {
    console.error('Error updating payment:', error);
    throw error;
  }
}
