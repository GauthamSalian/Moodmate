// src/components/PsychologistCard.jsx
import React from 'react';

const PsychologistCard = ({ doctor, onBook }) => {
  return (
    <div className="border p-6 rounded-xl shadow-lg flex flex-col items-center bg-gradient-to-br from-blue-50 to-white hover:shadow-2xl transition-shadow duration-200">
      <img
        src={doctor.image}
        alt={doctor.name}
        className="w-28 h-28 rounded-full mb-4 object-cover border-4 border-blue-200 shadow"
      />
      <h3 className="text-xl font-bold text-blue-900 mb-1">{doctor.name}</h3>
      <p className="text-sm text-blue-700 font-medium mb-2">{doctor.specialty}</p>
      <div className="flex flex-wrap justify-center gap-2 mt-2">
        {doctor.slots.map((slot, index) => (
          <button
            key={index}
            onClick={() => onBook(doctor.name, slot)}
            className="text-sm bg-gradient-to-r from-blue-600 to-blue-400 text-white px-4 py-1.5 rounded-full shadow hover:from-blue-700 hover:to-blue-500 transition-colors duration-150"
          >
            {slot}
          </button>
        ))}
      </div>
    </div>
  );
};

export default PsychologistCard;
