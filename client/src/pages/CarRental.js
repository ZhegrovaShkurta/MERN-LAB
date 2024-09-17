import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaCalendarAlt, FaEdit, FaTrash } from 'react-icons/fa'; // Importing icons
import './Style.css';

function ExportButton() {
  const handleExport = async () => {
    try {
      const response = await fetch('http://localhost:3002/export-car-rentals', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'car_rentals.xlsx';
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (error) {
      console.error('Error exporting data:', error);
    }
  };

  return (
    <button onClick={handleExport}>Export Car Rentals</button>
  );
}


function CarRental() {
  const [carModel, setCarModel] = useState('');
  const [pickupLocation, setPickupLocation] = useState('');
  const [dropoffLocation, setDropoffLocation] = useState('');
  const [pickupDate, setPickupDate] = useState('');
  const [dropoffDate, setDropoffDate] = useState('');

  const [rentals, setRentals] = useState([]);

  const [editMode, setEditMode] = useState(false);
  const [editingRentalId, setEditingRentalId] = useState(null);
  const [editCarModel, setEditCarModel] = useState('');
  const [editPickupLocation, setEditPickupLocation] = useState('');
  const [editDropoffLocation, setEditDropoffLocation] = useState('');
  const [editPickupDate, setEditPickupDate] = useState('');
  const [editDropoffDate, setEditDropoffDate] = useState('');

  const handleCreateBooking = async (e) => {
    e.preventDefault();
    try {
      await axios.post(
        'http://localhost:3002/car-rentals',
        { carModel, pickupLocation, dropoffLocation, pickupDate, dropoffDate },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      fetchRentals();
      // Clear form after submission
      setCarModel('');
      setPickupLocation('');
      setDropoffLocation('');
      setPickupDate('');
      setDropoffDate('');
    } catch (err) {
      console.error('Error creating car rental:', err);
    }
  };

  const fetchRentals = async () => {
    try {
      const response = await axios.get('http://localhost:3002/car-rentals', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setRentals(response.data);
    } catch (err) {
      console.error('Error fetching rentals:', err);
    }
  };

  const handleEditRental = (rental) => {
    setEditMode(true);
    setEditingRentalId(rental._id);
    setEditCarModel(rental.carModel);
    setEditPickupLocation(rental.pickupLocation);
    setEditDropoffLocation(rental.dropoffLocation);
    setEditPickupDate(rental.pickupDate);
    setEditDropoffDate(rental.dropoffDate);
  };

  const handleSubmitEdit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(
        `http://localhost:3002/car-rentals/${editingRentalId}`,
        {
          carModel: editCarModel,
          pickupLocation: editPickupLocation,
          dropoffLocation: editDropoffLocation,
          pickupDate: editPickupDate,
          dropoffDate: editDropoffDate,
        },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      setEditMode(false);
      setEditingRentalId(null);
      fetchRentals();
    } catch (err) {
      console.error('Error editing rental:', err);
    }
  };

  const handleDeleteRental = async (rentalId) => {
    if (!window.confirm('Are you sure you want to delete this rental?')) return;

    try {
      await axios.delete(`http://localhost:3002/car-rentals/${rentalId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      alert('Rental deleted successfully');
      fetchRentals();
    } catch (err) {
      console.error('Error deleting rental:', err.response || err.message);
      alert('Failed to delete rental: ' + (err.response?.data || err.message));
    }
  };

  useEffect(() => {
    fetchRentals();
  }, []);

  return (
    <div className="contact-container">
      <ExportButton />
      <h2>Create a Car Rental Booking</h2>
      <form className="booking-form" onSubmit={handleCreateBooking}>
        <input
          type="text"
          placeholder="Car Model"
          value={carModel}
          onChange={(e) => setCarModel(e.target.value)}
        />
        <input
          type="text"
          placeholder="Pick-up Location"
          value={pickupLocation}
          onChange={(e) => setPickupLocation(e.target.value)}
        />
        <input
          type="text"
          placeholder="Drop-off Location"
          value={dropoffLocation}
          onChange={(e) => setDropoffLocation(e.target.value)}
        />
        <div className="date-inputs">
          <input
            type="date"
            value={pickupDate}
            onChange={(e) => setPickupDate(e.target.value)}
          />
          <FaCalendarAlt className="calendar-icon" />
          <input
            type="date"
            value={dropoffDate}
            onChange={(e) => setDropoffDate(e.target.value)}
          />
          <FaCalendarAlt className="calendar-icon" />
        </div>
        <button type="submit" className="submit-button">Create Booking</button>
      </form>

      <h2>Your Car Rentals</h2>
      <table className="rentals-table">
        <thead>
          <tr>
            <th>Car Model</th>
            <th>Pick-up Location</th>
            <th>Drop-off Location</th>
            <th>Pick-up Date</th>
            <th>Drop-off Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {rentals.map((rental) => (
            <tr key={rental._id}>
              <td>{rental.carModel}</td>
              <td>{rental.pickupLocation}</td>
              <td>{rental.dropoffLocation}</td>
              <td>{rental.pickupDate}</td>
              <td>{rental.dropoffDate}</td>
              <td>
                <button onClick={() => handleEditRental(rental)} className="action-button">
                  <FaEdit />
                </button>
                <button onClick={() => handleDeleteRental(rental._id)} className="action-button">
                  <FaTrash />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {editMode && (
        <div className="edit-form">
          <h2>Edit Rental</h2>
          <form onSubmit={handleSubmitEdit}>
            <input
              type="text"
              value={editCarModel}
              onChange={(e) => setEditCarModel(e.target.value)}
            />
            <input
              type="text"
              value={editPickupLocation}
              onChange={(e) => setEditPickupLocation(e.target.value)}
            />
            <input
              type="text"
              value={editDropoffLocation}
              onChange={(e) => setEditDropoffLocation(e.target.value)}
            />
            <input
              type="date"
              value={editPickupDate}
              onChange={(e) => setEditPickupDate(e.target.value)}
            />
            <input
              type="date"
              value={editDropoffDate}
              onChange={(e) => setEditDropoffDate(e.target.value)}
            />
            <button type="submit" className="submit-button">Submit Edit</button>
          </form>
        </div>
      )}
    </div>
  );
}

export default CarRental;
