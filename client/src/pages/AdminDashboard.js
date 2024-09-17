import React, { useState, useEffect } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';

const AdminDashboard = () => {
  const [posts, setPosts] = useState([]);
  const [rentals, setRentals] = useState([]);
  const [importedData, setImportedData] = useState([]);

  // Fetch posts for admin
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await axios.get('http://localhost:3001/posts', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });
        console.log('Fetched posts:', response.data);
        setPosts(response.data);
      } catch (err) {
        console.error('Error fetching posts:', err);
      }
    };
    fetchPosts();
  }, []);

  // Fetch rentals for admin
  useEffect(() => {
    const fetchRentals = async () => {
      try {
        const response = await axios.get('http://localhost:3001/car-rentals', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });
        setRentals(response.data);
      } catch (err) {
        console.error('Error fetching rentals:', err);
      }
    };
    fetchRentals();
  }, []);

  // Export data to Excel
  const exportToExcel = () => {
    const postsData = posts.map(post => ({
      Title: post.title,
      Content: post.content,
    }));

    const rentalsData = rentals.map(rental => ({
      'Car Model': rental.carModel,
      'Pick-up Location': rental.pickupLocation,
      'Drop-off Location': rental.dropoffLocation,
    }));

    const workbook = XLSX.utils.book_new();

    const postsSheet = XLSX.utils.json_to_sheet(postsData);
    const rentalsSheet = XLSX.utils.json_to_sheet(rentalsData);

    XLSX.utils.book_append_sheet(workbook, postsSheet, 'Posts');
    XLSX.utils.book_append_sheet(workbook, rentalsSheet, 'Car Rentals');

    XLSX.writeFile(workbook, 'AdminData.xlsx');
  };

  // Import data from Excel
  const importFromExcel = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();

    reader.onload = (event) => {
      const data = new Uint8Array(event.target.result);
      const workbook = XLSX.read(data, { type: 'array' });

      // Assuming the first sheet contains relevant data
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];

      // Parse data from sheet
      const importedData = XLSX.utils.sheet_to_json(worksheet);

      console.log('Imported data:', importedData);
      setImportedData(importedData);  // Set the imported data to state
    };

    reader.readAsArrayBuffer(file);
  };

  return (
    <div style={styles.dashboardContainer}>
      <h1 style={styles.header}>Admin Dashboard</h1>

      <section style={styles.section}>
        <h2 style={styles.sectionHeader}>All Posts</h2>
        {posts.length > 0 ? (
          <div style={styles.tableContainer}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.tableHeader}>Title</th>
                  <th style={styles.tableHeader}>Content</th>
                </tr>
              </thead>
              <tbody>
                {posts.map(post => (
                  <tr key={post._id}>
                    <td style={styles.tableCell}>{post.title}</td>
                    <td style={styles.tableCell}>{post.content}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p>No posts available</p>
        )}
      </section>

      <section style={styles.section}>
        <h2 style={styles.sectionHeader}>All Car Rentals</h2>
        {rentals.length > 0 ? (
          <div style={styles.tableContainer}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.tableHeader}>Car Model</th>
                  <th style={styles.tableHeader}>Pick-up Location</th>
                  <th style={styles.tableHeader}>Drop-off Location</th>
                </tr>
              </thead>
              <tbody>
                {rentals.map(rental => (
                  <tr key={rental._id}>
                    <td style={styles.tableCell}>{rental.carModel}</td>
                    <td style={styles.tableCell}>{rental.pickupLocation}</td>
                    <td style={styles.tableCell}>{rental.dropoffLocation}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p>No car rentals available</p>
        )}
      </section>

      {/* Button to Export Data to Excel */}
      <button onClick={exportToExcel} style={styles.exportButton}>
        Export Data to Excel
      </button>

      {/* Input to Import Data from Excel */}
      <input type="file" onChange={importFromExcel} style={styles.importInput} />

      {/* Display Imported Data */}
      {importedData.length > 0 && (
        <section style={styles.section}>
          <h2 style={styles.sectionHeader}>Imported Data</h2>
          <div style={styles.tableContainer}>
            <table style={styles.table}>
              <thead>
                <tr>
                  {Object.keys(importedData[0]).map((key) => (
                    <th key={key} style={styles.tableHeader}>{key}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {importedData.map((row, index) => (
                  <tr key={index}>
                    {Object.values(row).map((value, i) => (
                      <td key={i} style={styles.tableCell}>{value}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
};

const styles = {
  dashboardContainer: { padding: '20px' },
  header: { fontSize: '24px', fontWeight: 'bold' },
  section: { marginTop: '20px' },
  sectionHeader: { fontSize: '20px', marginBottom: '10px' },
  tableContainer: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse' },
  tableHeader: { backgroundColor: '#f2f2f2', padding: '8px' },
  tableCell: { border: '1px solid #ddd', padding: '8px' },
  exportButton: {
    marginTop: '20px',
    padding: '10px 20px',
    backgroundColor: '#007bff',
    color: '#fff',
    border: 'none',
    cursor: 'pointer',
  },
  importInput: {
    marginTop: '20px',
    padding: '10px',
    cursor: 'pointer',
  },
};

export default AdminDashboard;
