import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';

const AppointmentBookingPage = () => {
  const [doctorId, setDoctorId] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);

  const fetchAvailableSlots = useCallback(async () => {
    try {
      const response = await axios.get(`http://localhost:8000/api/doctors/${doctorId}/available-slots/`);
      setAvailableSlots(response.data);
    } catch (error) {
      console.error('Error fetching available slots:', error);
    }
  }, [doctorId]);

  useEffect(() => {
    fetchAvailableSlots();
  }, [fetchAvailableSlots]);

  return (
    <div>
      {/* Render your component content here */}
    </div>
  );
};

export default AppointmentBookingPage; 