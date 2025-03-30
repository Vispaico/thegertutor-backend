const express = require('express');
const admin = require('firebase-admin');
const cors = require('cors');

// Initialize Express app
const app = express();

// Initialize Firebase Admin with error handling
const serviceAccount = require('./service-account.json');
try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
  console.log('Firebase Admin initialized successfully');
} catch (error) {
  console.error('Error initializing Firebase Admin:', error);
  process.exit(1); // Exit if Firebase fails to initialize
}

// Middleware
app.use(cors());
app.use(express.json());

// Route: Get lessons from Firestore
app.get('/api/lessons', async (req, res) => {
  try {
    console.log('Received request for /api/lessons');
    const lessonsSnapshot = await admin.firestore().collection('lessons').get();
    console.log('Fetched lessons from Firestore');
    if (lessonsSnapshot.empty) {
      console.log('No lessons found in Firestore');
      return res.json([]); // Return empty array if no documents exist
    }
    const lessons = lessonsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(lessons);
  } catch (error) {
    console.error('Error fetching lessons:', error);
    res.status(500).json({ error: 'Failed to fetch lessons', details: error.message });
  }
});

// Route: Save user progress to Firestore
app.post('/api/progress', async (req, res) => {
  try {
    console.log('Received request for /api/progress');
    const { userId, lessonId, score } = req.body;
    if (!userId || !lessonId || score === undefined) {
      return res.status(400).json({ error: 'Missing required fields: userId, lessonId, or score' });
    }
    const progressRef = await admin.firestore().collection('progress').add({
      userId,
      lessonId,
      score,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log(`Progress saved with ID: ${progressRef.id}`);
    res.json({ success: true, progressId: progressRef.id });
  } catch (error) {
    console.error('Error saving progress:', error);
    res.status(500).json({ error: 'Failed to save progress', details: error.message });
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// Export for Vercel deployment
module.exports = app;