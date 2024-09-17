import React from 'react';
import { FaEdit, FaTrash } from 'react-icons/fa'; // Importing icons from react-icons
import '../About.css'; // Importing CSS file

const About = ({ posts, handleEditPost, handleDeletePost, title, content, setTitle, setContent, editPostId, handleCreateOrUpdatePost }) => {
  return (
    <div className="about-page">
      <header className="header">
        <h1>Your Reservation</h1>
        <p>Manage and view your reservations easily</p>
      </header>

      <section className="booking-list">
        <h2>Your Bookings</h2>
        <ul className="booking-table">
          {posts.map(post => (
            <li key={post._id} className="booking-item">
              <div className="booking-header">
                <h3>{post.title}</h3>
                <div className="action-buttons">
                  <button className="edit-button" onClick={() => handleEditPost(post)}>
                    <FaEdit /> Edit
                  </button>
                  <button className="delete-button" onClick={() => handleDeletePost(post._id)}>
                    <FaTrash /> Delete
                  </button>
                </div>
              </div>
              <p className="booking-content">{post.content}</p>
            </li>
          ))}
        </ul>
      </section>

      {editPostId && (
        <section className="booking-form">
          <h2>Edit Booking</h2>
          <input
            type="text"
            placeholder="Booking Title"
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="input-field"
          />
          <textarea
            placeholder="Booking Details"
            value={content}
            onChange={e => setContent(e.target.value)}
            className="input-field textarea"
          />
          <button className="submit-button" onClick={handleCreateOrUpdatePost}>
            Update Booking
          </button>
        </section>
      )}
    </div>
  );
};

export default About;
