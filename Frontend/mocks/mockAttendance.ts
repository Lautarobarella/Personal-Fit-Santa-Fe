import { Attendance } from "@/lib/types";

export const mockAttendance: Attendance[] = [
  // Actividad 1 - Cross Fit (participantes: [1, 2, 3])
  {
    id: "1",
    activityId: "1",
    userId: "1",
    createdAt: new Date("2024-01-15T09:00:00"),
    status: "present",
  },
  {
    id: "2",
    activityId: "1",
    userId: "2",
    createdAt: new Date("2024-01-15T09:00:00"),
    status: "late",
  },
  {
    id: "3",
    activityId: "1",
    userId: "3",
    createdAt: new Date("2024-01-15T09:00:00"),
    status: "present",
  },

  // Actividad 2 - Yoga Matutino (participantes: [4, 6])
  {
    id: "4",
    activityId: "2",
    userId: "4",
    createdAt: new Date("2024-01-20T08:30:00"),
    status: "absent",
  },
  {
    id: "5",
    activityId: "2",
    userId: "6",
    createdAt: new Date("2024-01-20T08:30:00"),
    status: "present",
  },

  // Actividad 3 - Entrenamiento Funcional (participantes: [5])
  {
    id: "6",
    activityId: "3",
    userId: "5",
    createdAt: new Date("2024-01-25T18:00:00"),
    status: "present",
  },

  // Actividad 4 - Zumba Dance (participantes: [1, 4, 5, 6])
  {
    id: "7",
    activityId: "4",
    userId: "1",
    createdAt: new Date("2024-02-01T17:00:00"),
    status: "present",
  },
  {
    id: "8",
    activityId: "4",
    userId: "4",
    createdAt: new Date("2024-02-01T17:00:00"),
    status: "late",
  },
  {
    id: "9",
    activityId: "4",
    userId: "5",
    createdAt: new Date("2024-02-01T17:00:00"),
    status: "absent",
  },
  {
    id: "10",
    activityId: "4",
    userId: "6",
    createdAt: new Date("2024-02-01T17:00:00"),
    status: "present",
  },

  // Actividad 5 - HIIT Avanzado (participantes: [2, 3])
  {
    id: "11",
    activityId: "5",
    userId: "2",
    createdAt: new Date("2024-02-05T19:00:00"),
    status: "present",
  },
  {
    id: "12",
    activityId: "5",
    userId: "3",
    createdAt: new Date("2024-02-05T19:00:00"),
    status: "late",
  },
]
