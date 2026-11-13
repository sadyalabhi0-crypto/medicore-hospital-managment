# MediCore HMS — Full-Stack Hospital Management System (MERN)

A complete, portfolio-grade **Hospital Management System** built with the **MERN Stack** (MongoDB, Express.js, React.js with Vite, Node.js), **Tailwind CSS**, **Recharts**, and **JWT Role-Based Access Control**.

It digitizes hospital operations across four distinct role-based workspaces: **Administrator**, **Doctor**, **Receptionist**, and **Patient**.

---

## Key Features by Role

### 1. Administrator (`admin`)
- **Executive Analytics Dashboard:** Live KPI cards (Total Patients, Total Doctors, Today's Appointments, Total Revenue), 7-Day Appointment Activity AreaChart, Status Breakdown BarChart, Recent Appointments, and New Patient Registrations.
- **Doctor Management:** Add, update, filter, and remove doctors with specialization, qualification, consultation fee, experience, and department assignment.
- **Department Management:** Create, edit, and delete hospital clinical departments and assign Head Doctors.
- **Receptionist Management:** Manage front-desk receptionist staff accounts and active status.
- **Patient Directory:** Full CRUD, search by name/email/phone, filter by blood group & gender, pagination, and clinical history viewer.
- **Appointments & Billing Reports:** Full appointment queue management, revenue breakdown by payment channel, invoice generation, and payment settlement.

### 2. Doctor (`doctor`)
- **Clinical Workspace Dashboard:** Today's schedule, upcoming appointments, unique patients count, and recent medical records authored.
- **Assigned Appointments:** Update appointment statuses (`checked-in`, `completed`, `cancelled`), reschedule, and add clinical notes.
- **Medical Records:** Author and search patient diagnoses, reported symptoms, treatment plans, and physician notes.
- **Electronic Prescriptions (e-Rx):** Issue multi-medicine prescriptions with dosage, frequency, duration, and dietary instructions.
- **Weekly Availability Editor:** Configure working days, shift start/end hours, and standard consultation fee.

### 3. Receptionist (`receptionist`)
- **Front-Desk Dashboard:** Quick patient registration, appointment booking, today's live arrival queue, and instant patient search.
- **Patient Registration & Directory:** Register walk-in patients, update demographics & emergency contacts, and view patient profiles.
- **Appointment Scheduling & Check-In:** Book appointments with real-time double-booking prevention, reschedule visits, and mark patient check-ins.
- **Billing Desk:** Create patient invoices and record payments (`card`, `cash`, `insurance`, `online`).

### 4. Patient (`patient`)
- **Patient Health Portal:** Welcome banner, upcoming appointments, active prescriptions, and visit history.
- **Browse Specialists:** Search active hospital doctors by department or specialization and view their weekly availability slots.
- **Interactive Appointment Booking:** Pick a specialist, select a date, choose from real-time available 30-minute time slots, or cancel upcoming appointments.
- **Prescriptions & Medical Records:** View personal clinical diagnoses, treatment plans, and medication instructions.
- **Billing & Online Payment:** View consultation invoices and pay pending bills.

---

## Project Architecture

```text
hosiptal managment system/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js                        # Mongoose connection configuration
│   │   ├── controllers/
│   │   │   ├── authController.js            # Register, login, and session verification
│   │   │   ├── dashboardController.js       # Role-aware dashboard KPIs & Recharts data
│   │   │   ├── patientController.js         # Patient CRUD, search, pagination & history
│   │   │   ├── doctorController.js          # Doctor CRUD & weekly availability management
│   │   │   ├── departmentController.js      # Clinical department CRUD & head doctor link
│   │   │   ├── receptionistController.js    # Receptionist staff account management
│   │   │   ├── appointmentController.js     # Slot generation, conflict guard & scheduling
│   │   │   ├── medicalRecordController.js   # Clinical diagnosis & treatment history
│   │   │   ├── prescriptionController.js    # Structured e-Rx medication management
│   │   │   └── billController.js            # Invoicing, payment status & revenue metrics
│   │   ├── middleware/
│   │   │   ├── authMiddleware.js            # JWT Bearer protection & role authorization
│   │   │   └── errorMiddleware.js           # Centralized API error handler
│   │   ├── models/                          # 8 Mongoose Schemas
│   │   │   ├── User.js
│   │   │   ├── Doctor.js
│   │   │   ├── Patient.js
│   │   │   ├── Department.js
│   │   │   ├── Appointment.js
│   │   │   ├── MedicalRecord.js
│   │   │   ├── Prescription.js
│   │   │   └── Bill.js
│   │   ├── routes/                          # Modular Express routers
│   │   ├── utils/
│   │   │   └── seeder.js                    # Realistic demo data seeder
│   │   └── server.js                        # Express server entry point
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   └── axios.js                     # Axios client with JWT interceptor
│   │   ├── components/
│   │   │   ├── common/                      # ProtectedRoute, StatCard, StatusBadge
│   │   │   └── layout/                      # Responsive Sidebar, Topbar, DashboardLayout
│   │   ├── context/
│   │   │   └── AuthContext.jsx              # Authentication provider & role router
│   │   ├── pages/
│   │   │   ├── auth/                        # LoginPage, RegisterPage
│   │   │   ├── admin/                       # AdminDashboard, PatientsPage, DoctorsPage,
│   │   │   │                                # DepartmentsPage, ReceptionistsPage,
│   │   │   │                                # AppointmentsPage, BillingPage
│   │   │   ├── doctor/                      # DoctorDashboard, DoctorAvailabilityPage,
│   │   │   │                                # MedicalRecordsPage, PrescriptionsPage
│   │   │   ├── receptionist/                # ReceptionistDashboard
│   │   │   └── patient/                     # PatientDashboard, BrowseDoctorsPage,
│   │   │                                    # PatientAppointmentsPage, PatientRecordsPage
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── .env.example
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── package.json
├── package.json
└── README.md
```

---

## REST API Endpoints Summary

| Module | Endpoints | Access Roles |
| :--- | :--- | :--- |
| **Auth** | `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me` | Public / Authenticated |
| **Dashboard** | `GET /api/dashboard` | All Roles (returns role-tailored analytics) |
| **Doctors** | `GET /api/doctors`, `POST /api/doctors`, `GET /api/doctors/:id`, `PUT /api/doctors/:id`, `DELETE /api/doctors/:id`, `PUT /api/doctors/me/availability` | All (Read), Admin (CRUD), Doctor (Availability) |
| **Departments** | `GET /api/departments`, `POST /api/departments`, `PUT /api/departments/:id`, `DELETE /api/departments/:id` | All (Read), Admin (Write) |
| **Receptionists**| `GET /api/receptionists`, `POST /api/receptionists`, `PUT /api/receptionists/:id`, `DELETE /api/receptionists/:id` | Admin |
| **Patients** | `GET /api/patients`, `POST /api/patients`, `GET /api/patients/:id`, `PUT /api/patients/:id`, `DELETE /api/patients/:id` | Admin, Receptionist, Doctor, Patient (own) |
| **Appointments**| `GET /api/appointments`, `GET /api/appointments/booked-slots`, `POST /api/appointments`, `GET /api/appointments/:id`, `PUT /api/appointments/:id`, `DELETE /api/appointments/:id` | All Roles (scoped by role) |
| **Medical Records**| `GET /api/medical-records`, `GET /api/medical-records/:patientId`, `POST /api/medical-records` | Admin, Doctor, Patient (own) |
| **Prescriptions**| `GET /api/prescriptions`, `GET /api/prescriptions/:patientId`, `POST /api/prescriptions` | Admin, Doctor, Patient (own) |
| **Billing** | `GET /api/bills`, `POST /api/bills`, `PUT /api/bills/:id` | Admin, Receptionist, Patient (own) |

---

## Local Setup & Running Instructions

### 1. Environment Configuration
Ensure **MongoDB** is running locally on `mongodb://127.0.0.1:27017` (or set your MongoDB Atlas connection string in `backend/.env`).

- `backend/.env` (already created from `.env.example`):
  ```env
  PORT=5000
  NODE_ENV=development
  MONGODB_URI=mongodb://127.0.0.1:27017/hospital_management_system
  JWT_SECRET=hms_dev_secret_key_change_in_production_2026
  JWT_EXPIRES_IN=7d
  FRONTEND_URL=http://localhost:5173
  ```
- `frontend/.env` (already created from `.env.example`):
  ```env
  VITE_API_BASE_URL=http://localhost:5000/api
  ```

### 2. Seed Realistic Demo Data
```bash
cd backend
npm run seed
```
This populates 5 clinical departments, doctors, receptionist, patients, appointments, medical records, prescriptions, and bills.

### 3. Start Backend & Frontend Servers
Open two terminals:

**Terminal 1 — Backend API (`http://localhost:5000`)**:
```bash
cd backend
npm run dev
```

**Terminal 2 — React Frontend (`http://localhost:5173`)**:
```bash
cd frontend
npm run dev
```

---

## Demo Login Credentials

All demo accounts share the password: **`Password123!`** (Also available as one-click quick-fill buttons on the `/login` screen):

- **Admin:** `admin@medicore.com`
- **Doctor:** `doctor@medicore.com`
- **Receptionist:** `receptionist@medicore.com`
- **Patient:** `patient@medicore.com`
