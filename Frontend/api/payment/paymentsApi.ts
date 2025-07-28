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

export async function createPayment(payment: NewPaymentInput) {
  try {
    const formData = new FormData();

    const dto = {
      clientDni: payment.clientDni,
      amount: payment.amount,
      createdAt: payment.createdAt,
      expiresAt: payment.expiresAt,
      methodType: "transfer",
      confNumber: Math.floor(Math.random() * 1000000),
      paymentStatus: payment.paymentStatus,
    };

    formData.append("payment", new Blob([JSON.stringify(dto)], {
      type: "application/json"
    }))

    if (payment.file) {
      formData.append("file", payment.file)
    }

    const response = await fetch(`${BASE_URL}/new`, {
      method: "POST",
      body: formData
    });

    if (!response.ok) {
      throw new Error("Error al crear el pago");
    }

    return await response.json();
  } catch (error) {
    console.error("Error creando el pago:", error);
    throw error;
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
