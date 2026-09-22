const LINKS = [
  { key: "patients", label: "Patients" },
  { key: "register-patient", label: "Register Patient" },
  { key: "doctors", label: "Doctors" },
  { key: "register-doctor", label: "Register Doctor" },
  { key: "book-appointment", label: "Book Appointment" },
  { key: "appointments", label: "Appointments" },
  { key: "payments", label: "Payments" },
];

export default function NavBar({ current, onNavigate }) {
  return (
    <nav className="nav-bar">
      {LINKS.map((link) => (
        <button
          key={link.key}
          className={link.key === current ? "nav-link active" : "nav-link"}
          onClick={() => onNavigate(link.key)}
        >
          {link.label}
        </button>
      ))}
    </nav>
  );
}
