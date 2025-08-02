import { API_CONFIG } from "@/lib/config";

const BASE_URL = API_CONFIG.NOTIFICATION_URL;

export async function fetchNotifications() {
    try {
        const response = await fetch(`${BASE_URL}/getAll`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`Error al obtener las notificaciones: ${response.status}`);
        }

        return await response.json();

    } catch (error) {
        console.error('Error fetching notifications:', error);
        return [];
    }
}

export async function fetchNotificationsMock(): Promise<Response> {
    const mockNotifications = [
        {
            id: "notif-001",
            title: "Payment Received",
            message: "You have received a new payment of $50.",
            infoType: "success",
            read: false,
            archived: false,
            createdAt: new Date(),
            notificationCategory: "payment",
        },
        {
            id: "notif-002",
            title: "New Client Registered",
            message: "A new client has signed up.",
            infoType: "info",
            read: false,
            archived: false,
            createdAt: new Date("2025-07-25T11:00:00"),
            notificationCategory: "client",
        },
        {
            id: "notif-003",
            title: "Enrollment Completed",
            message: "Client John Doe has completed enrollment.",
            infoType: "success",
            read: false,
            archived: false,
            createdAt: new Date("2025-07-24T14:45:00"),
            notificationCategory: "enrollment",
        },
        {
            id: "notif-004",
            title: "Suspicious Activity",
            message: "Unusual login detected on your account.",
            infoType: "warning",
            read: false,
            archived: false,
            createdAt: new Date("2025-07-23T08:20:00"),
            notificationCategory: "activity",
        },
        {
            id: "notif-005",
            title: "Payment Failed",
            message: "A client’s payment was declined.",
            infoType: "error",
            read: false,
            archived: false,
            createdAt: new Date("2025-07-22T19:10:00"),
            notificationCategory: "payment",
        },
        {
            id: "notif-006",
            title: "Client Info Updated",
            message: "Client Jane Smith updated their contact details.",
            infoType: "info",
            read: false,
            archived: false,
            createdAt: new Date("2025-07-21T16:00:00"),
            notificationCategory: "client",
        },
        {
            id: "notif-007",
            title: "Enrollment Cancelled",
            message: "Enrollment for client Robert Brown was cancelled.",
            infoType: "warning",
            read: false,
            archived: false,
            createdAt: new Date("2025-07-20T09:25:00"),
            notificationCategory: "enrollment",
        },
        {
            id: "notif-008",
            title: "Monthly Payment Received",
            message: "Subscription payment received for July.",
            infoType: "success",
            read: false,
            archived: false,
            createdAt: new Date("2025-07-19T12:10:00"),
            notificationCategory: "payment",
        },
        {
            id: "notif-009",
            title: "New Login Activity",
            message: "Login from a new device was detected.",
            infoType: "info",
            read: false,
            archived: false,
            createdAt: new Date("2025-07-18T21:00:00"),
            notificationCategory: "activity",
        },
        {
            id: "notif-010",
            title: "Account Suspended",
            message: "Client Alice Cooper's account was suspended.",
            infoType: "error",
            read: false,
            archived: false,
            createdAt: new Date("2025-07-17T18:40:00"),
            notificationCategory: "client",
        },
        {
            id: "notif-011",
            title: "Payment Reminder",
            message: "Payment due in 3 days.",
            infoType: "warning",
            read: false,
            archived: false,
            createdAt: new Date("2025-07-16T10:00:00"),
            notificationCategory: "payment",
        },
        {
            id: "notif-012",
            title: "Enrollment Reminder",
            message: "Client hasn’t completed enrollment.",
            infoType: "info",
            read: false,
            archived: false,
            createdAt: new Date("2025-07-15T11:45:00"),
            notificationCategory: "enrollment",
        },
        {
            id: "notif-013",
            title: "Profile Change",
            message: "User profile was updated successfully.",
            infoType: "success",
            read: true,
            archived: false,
            createdAt: new Date("2025-07-14T14:30:00"),
            notificationCategory: "client",
        },
        {
            id: "notif-014",
            title: "System Alert",
            message: "System maintenance scheduled for this weekend.",
            infoType: "info",
            read: true,
            archived: false,
            createdAt: new Date("2025-07-13T08:00:00"),
            notificationCategory: "activity",
        },
        {
            id: "notif-015",
            title: "Payment Overdue",
            message: "Client has overdue payment.",
            infoType: "error",
            read: true,
            archived: true,
            createdAt: new Date("2025-07-12T13:15:00"),
            notificationCategory: "payment",
        },
        {
            id: "notif-016",
            title: "Client Feedback",
            message: "New feedback received from a client.",
            infoType: "info",
            read: true,
            archived: true,
            createdAt: new Date("2025-07-11T17:00:00"),
            notificationCategory: "client",
        },
        {
            id: "notif-017",
            title: "Successful Login",
            message: "You logged in successfully.",
            infoType: "success",
            read: true,
            archived: false,
            createdAt: new Date("2025-07-10T20:30:00"),
            notificationCategory: "activity",
        },
        {
            id: "notif-018",
            title: "Email Verified",
            message: "Your email was successfully verified.",
            infoType: "success",
            read: true,
            archived: false,
            createdAt: new Date("2025-07-09T18:00:00"),
            notificationCategory: "client",
        },
        {
            id: "notif-019",
            title: "New Message from Client",
            message: "You have a new message from client Michael Scott.",
            infoType: "info",
            read: true,
            archived: false,
            createdAt: new Date("2025-07-08T09:00:00"),
            notificationCategory: "client",
        },
        {
            id: "notif-020",
            title: "Low Balance Warning",
            message: "Your account balance is below the minimum threshold.",
            infoType: "warning",
            read: true,
            archived: true,
            createdAt: new Date("2025-07-07T07:15:00"),
            notificationCategory: "payment",
        },
    ];

    return new Response(JSON.stringify(mockNotifications), {
        status: 200,
        headers: {
            'Content-Type': 'application/json',
        },
    });
}