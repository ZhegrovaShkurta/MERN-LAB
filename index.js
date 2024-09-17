require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

const JWT_SECRET = 'bd5dbd5e52d057f073dc538ae28c78239798fe0eb22cb6d2d5f979122f6feb441536fb0612442e3934a25fd372a284627f39af6ea621f5a0d88dc6edd48c9957'; // Use environment variable for security

// MySQL connection
const mysqlConnection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'data',
  database: 'backend'
});

mysqlConnection.connect(err => {
  if (err) throw err;
  console.log('Connected to MySQL');
});

// MongoDB connection
mongoose.connect('mongodb+srv://shkurta:shkurta@cluster0.iz357vq.mongodb.net/booking?retryWrites=true&w=majority&appName=Cluster0s',
  { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));


// MySQL - Register Route
app.post('/register', async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const query = 'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, "user")'; // Default role as 'user'
    mysqlConnection.query(query, [name, email, hashedPassword], (err) => {
      if (err) {
        console.error('Error registering user:', err);
        return res.status(500).send('Error registering user');
      }
      res.status(201).send('User registered successfully');
    });
  } catch (error) {
    console.error('Error processing request:', error);
    res.status(500).send('Error processing request');
  }
});

// MySQL - Login Route
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  const query = 'SELECT * FROM users WHERE email = ?';
  mysqlConnection.query(query, [email], async (err, results) => {
    if (err) {
      console.error('Error logging in:', err);
      return res.status(500).send('Error logging in');
    }
    if (results.length === 0) {
      return res.status(400).send('User not found');
    }

    const user = results[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).send('Invalid password');
    }

    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  });
});


// MongoDB Schema and Model for Posts

const postSchema = new mongoose.Schema({
  title: String,   // The title of the post
  content: String, // The content of the post
  user_id: Number, // The ID of the user who created the post
});

const Post = mongoose.model('Post', postSchema);

// MongoDB Schema and Model for Car Rentals

const carRentalSchema = new mongoose.Schema({
  carModel: { type: String, required: true },
  pickupLocation: { type: String, required: true },
  dropoffLocation: { type: String, required: true },
  pickupDate: { type: Date, required: true },
  dropoffDate: { type: Date, required: true },
  userId: { type: Number, required: true }
});

const CarRental = mongoose.model('CarRental', carRentalSchema);

// Middleware to authenticate token and check user role
const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).send('Access Denied');

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      console.error('Invalid token:', err);
      return res.status(403).send('Invalid token');
    }
    req.user = user;

    // Query to get the user's role from the database
    mysqlConnection.query('SELECT role FROM users WHERE id = ?', [user.id], (err, results) => {
      if (err || results.length === 0) {
        return res.status(403).send('Error retrieving user role');
      }

      req.user.role = results[0].role; // Add the role to the user object
      next();
    });
  });
};

// Create a new car rental booking
app.post('/car-rentals', authenticateToken, async (req, res) => {
  const { carModel, pickupLocation, dropoffLocation, pickupDate, dropoffDate } = req.body;
  const userId = req.user.id;

  console.log('Creating car rental with data:', { carModel, pickupLocation, dropoffLocation, pickupDate, dropoffDate });

  try {
    const newBooking = new CarRental({ carModel, pickupLocation, dropoffLocation, pickupDate, dropoffDate, userId });
    const savedBooking = await newBooking.save();
    res.status(201).json(savedBooking);
  } catch (err) {
    console.error('Error creating car rental:', err);
    res.status(500).send('Error creating car rental');
  }
});

// Get all car rentals for the logged-in user or all if admin
app.get('/car-rentals', authenticateToken, async (req, res) => {
  try {
    let rentals;
    if (req.user.role === 'admin') {
      // Admin can see all car rentals
      rentals = await CarRental.find();
    } else {
      // Normal user can see only their own rentals
      rentals = await CarRental.find({ userId: req.user.id });
    }
    res.json(rentals);
  } catch (err) {
    console.error('Error fetching car rentals:', err);
    res.status(500).send('Error fetching car rentals');
  }
});

// Update a car rental booking
app.put('/car-rentals/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { carModel, pickupLocation, dropoffLocation, pickupDate, dropoffDate } = req.body;

  console.log('Update request received for rental ID:', id);
  console.log('Data received:', { carModel, pickupLocation, dropoffLocation, pickupDate, dropoffDate });

  try {
    const rental = await CarRental.findById(id);
    if (!rental) {
      return res.status(404).send('Rental not found');
    }

    // Allow admin to update any rental or user to update their own rental
    if (rental.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).send('You do not have permission to update this rental');
    }

    rental.carModel = carModel;
    rental.pickupLocation = pickupLocation;
    rental.dropoffLocation = dropoffLocation;
    rental.pickupDate = pickupDate;
    rental.dropoffDate = dropoffDate;

    const updatedRental = await rental.save();
    res.json({ message: 'Rental updated successfully', rental: updatedRental });
  } catch (err) {
    console.error('Error updating rental:', err);
    res.status(500).send('Error updating rental');
  }
});

// Delete a car rental booking
app.delete('/car-rentals/:id', authenticateToken, async (req, res) => {
  const rentalId = req.params.id;
  try {
    // Ensure rentalId is valid
    const rental = await CarRental.findById(rentalId);
    if (!rental) {
      return res.status(404).json({ message: 'Rental not found' });
    }

    // Perform deletion
    await CarRental.findByIdAndDelete(rentalId);
    return res.status(200).json({ message: 'Rental deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error', error });
  }
});

// Create a new post - MongoDB
app.post('/posts', authenticateToken, async (req, res) => {
  const { title, content } = req.body;
  const userId = req.user.id;

  try {
    const newPost = new Post({ title, content, user_id: userId });
    const savedPost = await newPost.save();
    res.status(201).json(savedPost);
  } catch (err) {
    console.error('Error creating post:', err);
    res.status(500).send('Error creating post');
  }
});

// Read all posts - MongoDB
app.get('/posts', authenticateToken, async (req, res) => {
  try {
    const user = req.user; // Ensure req.user is set by the authenticateToken middleware

    if (user.role === 'admin') {
      // Admin can see all posts
      const posts = await Post.find();
      res.json(posts);
    } else {
      // Non-admin users can only see their own posts
      const posts = await Post.find({ user_id: user.id });
      res.json(posts);
    }
  } catch (err) {
    console.error('Error fetching posts:', err);
    res.status(500).send('Error fetching posts');
  }
});

// Update a post - MongoDB
app.put('/posts/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { title, content } = req.body;

  try {
    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).send('Post not found');
    }

    if (post.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).send('You do not have permission to edit this post');
    }

    post.title = title;
    post.content = content;
    const updatedPost = await post.save();

    res.json({ message: 'Post updated successfully', post: updatedPost });
  } catch (err) {
    console.error('Error updating post:', err);
    res.status(500).send('Error updating post');
  }
});

// Delete a post - MongoDB
app.delete('/posts/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    console.log('Deleting post with ID:', id);
    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).send('Post not found');
    }

    if (post.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).send('You do not have permission to delete this post');
    }

    const result = await Post.findByIdAndDelete(id);
    if (!result) {
      return res.status(404).send('Post not found');
    }

    res.json({ message: 'Post deleted successfully' });
  } catch (err) {
    console.error('Error deleting post:', err);
    res.status(500).send('Error deleting post');
  }
});

// Start the server
app.listen(3001, () => {
  console.log('Server running on http://localhost:3001');
});
