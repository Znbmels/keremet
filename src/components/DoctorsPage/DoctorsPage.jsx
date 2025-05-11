import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';

const DoctorsPage = () => {
  const [doctors, setDoctors] = useState([]);

  const fetchDoctors = useCallback(async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/doctors/');
      setDoctors(response.data);
    } catch (error) {
      console.error('Error fetching doctors:', error);
    }
  }, []);

  useEffect(() => {
    fetchDoctors();
  }, [fetchDoctors]);

  return (
    <div>
      {/* Render your doctors component here */}
    </div>
  );
};

export default DoctorsPage; 