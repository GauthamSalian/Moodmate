// src/pages/BookingPage.jsx
import React from 'react';
import PsychologistCard from '../components/PsychologistCard';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Psychologist1 from '../assets/Psychologist1.jpeg';
import Psychologist2 from '../assets/Psychologist2.jpeg';
import Psychologist3 from '../assets/Psychologist3.jpeg';


const psychologists = [
  {
    name: "Dr. Maya Kapoor",
    specialty: "Clinical Psychologist",
    image: Psychologist3,
    slots: ["10:00 AM", "2:30 PM", "6:00 PM"]
  },
  {
    name: "Dr. Arjun Mehta",
    specialty: "Stress & Trauma Expert",
    image: Psychologist2,
    slots: ["9:00 AM", "1:00 PM", "4:00 PM"]
  },
  {
    name: "Dr. Priya Sharma",
    specialty: "Adolescent Counselor",
    image: Psychologist1,
    slots: ["11:00 AM", "3:00 PM", "5:30 PM"]
  }
];


const BookingPage = (props) => {
  const handleBooking = (name, slot) => {
    toast.success(`🎉 Appointment booked with ${name} at ${slot}`);
    // Optional: send to backend or Firestore
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4 text-center">🩺 Book a Session</h1>
      <p className="text-center text-gray-600 mb-6">Choose a psychologist and time slot that works best for you.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {psychologists.map((doc, i) => (
          <PsychologistCard key={i} doctor={doc} onBook={handleBooking} />
        ))}
      </div>
      <ToastContainer />
    </div>
  );
}

export default BookingPage;

