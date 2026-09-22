import { useState } from "react";
import NavBar from "./components/NavBar.jsx";
import PatientDirectory from "./screens/patients/PatientDirectory.jsx";
import PatientRegistration from "./screens/patients/PatientRegistration.jsx";
import DoctorDirectory from "./screens/doctors/DoctorDirectory.jsx";
import DoctorRegistration from "./screens/doctors/DoctorRegistration.jsx";
import BookAppointment from "./screens/appointments/BookAppointment.jsx";
import AppointmentList from "./screens/appointments/AppointmentList.jsx";
import PaymentsScreen from "./screens/payments/PaymentsScreen.jsx";

// No React Router per the tech stack decision — screens are switched with
// plain state. Add a new screen by: (1) adding it to SCREENS below,
// (2) adding a button for it in NavBar.jsx.
const SCREENS = {
  patients: PatientDirectory,
  "register-patient": PatientRegistration,
  doctors: DoctorDirectory,
  "register-doctor": DoctorRegistration,
  "book-appointment": BookAppointment,
  appointments: AppointmentList,
  payments: PaymentsScreen,
};

export default function App() {
  const [screen, setScreen] = useState("patients");
  const ActiveScreen = SCREENS[screen] ?? PatientDirectory;

  return (
    <div className="app-shell">
      <NavBar current={screen} onNavigate={setScreen} />
      <main className="app-content">
        <ActiveScreen />
      </main>
    </div>
  );
}
