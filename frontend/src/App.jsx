import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import DashboardLayout from './components/layout/DashboardLayout';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';

// Admin & Shared Staff Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import PatientsPage from './pages/admin/PatientsPage';
import DoctorsPage from './pages/admin/DoctorsPage';
import DepartmentsPage from './pages/admin/DepartmentsPage';
import ReceptionistsPage from './pages/admin/ReceptionistsPage';
import AppointmentsPage from './pages/admin/AppointmentsPage';
import BillingPage from './pages/admin/BillingPage';

// Doctor Pages
import DoctorDashboard from './pages/doctor/DoctorDashboard';
import DoctorAvailabilityPage from './pages/doctor/DoctorAvailabilityPage';
import MedicalRecordsPage from './pages/doctor/MedicalRecordsPage';
import PrescriptionsPage from './pages/doctor/PrescriptionsPage';

// Receptionist Pages
import ReceptionistDashboard from './pages/receptionist/ReceptionistDashboard';

// Patient Pages
import PatientDashboard from './pages/patient/PatientDashboard';
import BrowseDoctorsPage from './pages/patient/BrowseDoctorsPage';
import PatientAppointmentsPage from './pages/patient/PatientAppointmentsPage';
import PatientRecordsPage from './pages/patient/PatientRecordsPage';

const RootRedirect = () => {
  const { isAuthenticated, user, getRoleDashboardPath } = useAuth();
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }
  return <Navigate to={getRoleDashboardPath(user.role)} replace />;
};

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<RootRedirect />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* ================= ADMIN ROUTES ================= */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <DashboardLayout>
                  <AdminDashboard />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/patients"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <DashboardLayout>
                  <PatientsPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/doctors"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <DashboardLayout>
                  <DoctorsPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/receptionists"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <DashboardLayout>
                  <ReceptionistsPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/departments"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <DashboardLayout>
                  <DepartmentsPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/appointments"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <DashboardLayout>
                  <AppointmentsPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/billing"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <DashboardLayout>
                  <BillingPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* ================= DOCTOR ROUTES ================= */}
          <Route
            path="/doctor/dashboard"
            element={
              <ProtectedRoute allowedRoles={['doctor']}>
                <DashboardLayout>
                  <DoctorDashboard />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/doctor/availability"
            element={
              <ProtectedRoute allowedRoles={['doctor']}>
                <DashboardLayout>
                  <DoctorAvailabilityPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/doctor/appointments"
            element={
              <ProtectedRoute allowedRoles={['doctor']}>
                <DashboardLayout>
                  <AppointmentsPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/doctor/medical-records"
            element={
              <ProtectedRoute allowedRoles={['doctor']}>
                <DashboardLayout>
                  <MedicalRecordsPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/doctor/prescriptions"
            element={
              <ProtectedRoute allowedRoles={['doctor']}>
                <DashboardLayout>
                  <PrescriptionsPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* ================= RECEPTIONIST ROUTES ================= */}
          <Route
            path="/receptionist/dashboard"
            element={
              <ProtectedRoute allowedRoles={['receptionist']}>
                <DashboardLayout>
                  <ReceptionistDashboard />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/receptionist/patients"
            element={
              <ProtectedRoute allowedRoles={['receptionist']}>
                <DashboardLayout>
                  <PatientsPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/receptionist/appointments"
            element={
              <ProtectedRoute allowedRoles={['receptionist']}>
                <DashboardLayout>
                  <AppointmentsPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/receptionist/billing"
            element={
              <ProtectedRoute allowedRoles={['receptionist']}>
                <DashboardLayout>
                  <BillingPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* ================= PATIENT ROUTES ================= */}
          <Route
            path="/patient/dashboard"
            element={
              <ProtectedRoute allowedRoles={['patient']}>
                <DashboardLayout>
                  <PatientDashboard />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/patient/doctors"
            element={
              <ProtectedRoute allowedRoles={['patient']}>
                <DashboardLayout>
                  <BrowseDoctorsPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/patient/appointments"
            element={
              <ProtectedRoute allowedRoles={['patient']}>
                <DashboardLayout>
                  <PatientAppointmentsPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/patient/records"
            element={
              <ProtectedRoute allowedRoles={['patient']}>
                <DashboardLayout>
                  <PatientRecordsPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/patient/billing"
            element={
              <ProtectedRoute allowedRoles={['patient']}>
                <DashboardLayout>
                  <BillingPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
