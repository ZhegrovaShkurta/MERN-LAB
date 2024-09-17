import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import axios from 'axios';
import './App.css';
import About from './pages/About';
import CarRental from './pages/CarRental';
import AdminDashboard from './pages/AdminDashboard';
import '@fortawesome/fontawesome-free/css/all.min.css';
import './AuthForm.css';

const Navbar = ({ user, handleLogout }) => (
  <nav className="navbar">
    <div className="navbar-brand">Booking App</div>
    {user && (
      <div className="navbar-links">
        {user.role === 'admin' && (
          <Link to="/admindashboard" className="nav-link">
            <i className="fas fa-tachometer-alt"></i> Admin Dashboard
          </Link>
        )}
        <Link to="/" className="nav-link">
          <i className="fas fa-home"></i> Home
        </Link>
        <Link to="/about" className="nav-link">
          <i className="fas fa-book"></i> My Bookings
        </Link>
        <Link to="/car-rentals" className="nav-link">
          <i className="fas fa-car"></i> Car Rental
        </Link>
       
        <button className="logout-button" onClick={handleLogout}>
          <i className="fas fa-sign-out-alt"></i> Log Out
        </button>
      </div>
    )}
  </nav>
);


const AuthForm = ({
  isRegistering,
  setIsRegistering,
  handleRegister,
  handleLogin,
  name,
  setName,
  email,
  setEmail,
  password,
  setPassword,
  message
}) => (
  <div className="auth-form">
    <h1>{isRegistering ? 'Register' : 'Login'}</h1>
    <div className="form-group">
      {isRegistering && (
        <div className="form-field">
          <i className="fas fa-user icon"></i>
          <input
            type="text"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input-field"
          />
        </div>
      )}
      <div className="form-field">
        <i className="fas fa-envelope icon"></i>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="input-field"
        />
      </div>
      <div className="form-field">
        <i className="fas fa-lock icon"></i>
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="input-field"
        />
      </div>
    </div>
    <button
      onClick={isRegistering ? handleRegister : handleLogin}
      className="auth-button"
    >
      {isRegistering ? 'Register' : 'Login'}
    </button>
    <p className="toggle-auth">
      {isRegistering ? 'Already have an account?' : "Don't have an account?"}
      <button
        onClick={() => setIsRegistering(!isRegistering)}
        className="toggle-button"
      >
        {isRegistering ? 'Login' : 'Register'}
      </button>
    </p>
    {message && <p className="message">{message}</p>}
  </div>
);

const BookingForm = ({ editPostId, title, content, setTitle, setContent, handleCreateOrUpdatePost, successMessage }) => (
  
  <div className="booking-form-container">
  <div className="welcome-message">
    <h1>Welcome to Our App!</h1>
    <p>Come travel with us and explore beautiful destinations.</p>
    <div className="icons">
      <i className="fas fa-hotel icon hotel-icon"></i>
      <i className="fas fa-umbrella-beach icon beach-icon"></i>
    </div>
  </div>
  <div className="booking-form">
    <h2>{editPostId ? 'Edit Booking' : 'Create a Booking'}</h2>
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
      {editPostId ? 'Update Booking' : 'Create Booking'}
    </button>
    {successMessage && (
      <div className="success-message">
        {successMessage} <Link to="/about">Click here</Link>
      </div>
    )}
  </div>
</div>
);

function App() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [user, setUser] = useState(null);
  const [isRegistering, setIsRegistering] = useState(true);
  const [message, setMessage] = useState('');
  const [posts, setPosts] = useState([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [editPostId, setEditPostId] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (user) {
      fetchPosts();
    }
  }, [user]);

  const fetchPosts = async () => {
    try {
      const response = await axios.get('http://localhost:3001/posts', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      setPosts(response.data);
    } catch (err) {
      console.error('Error fetching posts:', err);
    }
  };

  const handleRegister = async () => {
    try {
      await axios.post('http://localhost:3001/register', { name, email, password });
      setMessage('Registration successful! Please log in.');
    } catch (err) {
      setMessage('Error registering user');
      console.error(err);
    }
  };

  const handleLogin = async () => {
    try {
      const response = await axios.post('http://localhost:3001/login', { email, password });
      setUser(response.data.user);
      localStorage.setItem('token', response.data.token);
      setMessage('');
      fetchPosts(); // Fetch posts immediately after login
    } catch (err) {
      setMessage('Error logging in');
      console.error(err);
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('token');
  };

  const handleCreateOrUpdatePost = async () => {
    try {
      if (editPostId) {
        // Update an existing post
        await axios.put(
          `http://localhost:3001/posts/${editPostId}`,
          { title, content },
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
          }
        );
        setEditPostId(null); // Reset editPostId after update
        setSuccessMessage('Post updated successfully!');
      } else {
        // Create a new post
        await axios.post(
          'http://localhost:3001/posts',
          { title, content },
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
          }
        );
        setSuccessMessage('Post created successfully!');
      }
      setTitle('');
      setContent('');
      fetchPosts(); // Refresh posts after creating or updating
    } catch (err) {
      console.error('Error creating or updating post:', err);
    }
  };

  const handleEditPost = (post) => {
    setEditPostId(post._id); // Use _id if that's what your backend provides
    setTitle(post.title);
    setContent(post.content);
  };

  const handleDeletePost = async (id) => {
    try {
      await axios.delete(`http://localhost:3001/posts/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      fetchPosts(); // Refresh posts after deletion
    } catch (err) {
      console.error('Error deleting post:', err);
    }
  };

  // Filter posts for non-admin users
  const filteredPosts = user && user.role === 'admin' ? posts : posts.filter(post => post.user_id === user.id);

  return (
    <Router>
      <div className="app">
        <Navbar user={user} handleLogout={handleLogout} />

        <main>
          <Routes>
            <Route path="/" element={
              user ? (
                <BookingForm
                  editPostId={editPostId}
                  title={title}
                  content={content}
                  setTitle={setTitle}
                  setContent={setContent}
                  handleCreateOrUpdatePost={handleCreateOrUpdatePost}
                  successMessage={successMessage}
                />
              ) : (
                <AuthForm
                  isRegistering={isRegistering}
                  setIsRegistering={setIsRegistering}
                  handleRegister={handleRegister}
                  handleLogin={handleLogin}
                  name={name}
                  setName={setName}
                  email={email}
                  setEmail={setEmail}
                  password={password}
                  setPassword={setPassword}
                  message={message}
                />
              )
            } />
            {user && (
              <>
                <Route path="/about" element={
                  <About
                    posts={filteredPosts}
                    handleEditPost={handleEditPost}
                    handleDeletePost={handleDeletePost}
                    title={title}
                    content={content}
                    setTitle={setTitle}
                    setContent={setContent}
                    editPostId={editPostId}
                    handleCreateOrUpdatePost={handleCreateOrUpdatePost}
                  />
                } />
                {user.role === 'admin' && (
                  <Route path="/admindashboard" element={<AdminDashboard />} />
                )}
              </>
            )}
            <Route path="/car-rentals" element={<CarRental />} />
          </Routes>
       
        </main>
      </div>
    </Router>
  );
}

export default App;
