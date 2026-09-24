import { useState } from "react";
import NavBar from "./components/NavBar.jsx";
import DashboardScreen from "./screens/dashboard/DashboardScreen.jsx";
import PatientDirectory from "./screens/patients/PatientDirectory.jsx";
import DoctorDirectory from "./screens/doctors/DoctorDirectory.jsx";
import AppointmentList from "./screens/appointments/AppointmentList.jsx";
import PaymentsScreen from "./screens/payments/PaymentsScreen.jsx";

const SCREENS = {
  dashboard: DashboardScreen,
  appointments: AppointmentList,
  patients: PatientDirectory,
  doctors: DoctorDirectory,
  payments: PaymentsScreen,
};

export default function App() {
  const [screen, setScreen] = useState("dashboard");
  const ActiveScreen = SCREENS[screen] ?? DashboardScreen;

  return (
    <div className="app-layout">
      <NavBar current={screen} onNavigate={setScreen} />
      <div className="app-main-area">
        <header className="app-top-header">
          <h1 className="app-header-title">Clinica Medika Office - Management System</h1>
          <p className="app-header-subtitle">
            Management system for scheduling, appointing, listing patients and doctors, and creating payments.
          </p>
        </header>
        <main className="app-content">
          <ActiveScreen />
        </main>
      </div>
    </div>
  );
}
