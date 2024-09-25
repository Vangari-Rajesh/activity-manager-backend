import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import mongoose from 'mongoose';


dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 5000;

app.use(bodyParser.json());
app.use(cors());

app.use(express.static(path.join(__dirname, 'build')));

const DB_URL = 'mongodb+srv://user:kmit1@cluster0.ueflwgp.mongodb.net/activity-manager?retryWrites=true&w=majority'

// console.log(DB_URL);
mongoose.connect(DB_URL)
.then(() => {
  console.log('Database connected successfully');
})
.catch((err) => {
  console.error('Database connection error:', err);
});

// Activity schema
const activitySchema = new mongoose.Schema({
  activity: String,
  createdAt: { type: Date, default: Date.now }, // Submission date
  deadline: Date, // Deadline date
  progress: String, // Progress of the activity
});
const Activity = mongoose.model('Activity', activitySchema);


app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});




// Routes
app.get('/api/activities', async (req, res) => {
  try {
    const activities = await Activity.find().sort({ createdAt: -1 });
    res.json({ activities });
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});


app.post('/api/activities', async (req, res) => {
  try {
    const { activity, deadline } = req.body;

    // Check if the deadline is in the past
    if (new Date(deadline) < new Date()) {
      return res.status(400).json({ error: 'Cannot set a deadline in the past' });
    }

    const newActivity = new Activity({ activity, deadline, progress: null }); // Set progress as null
    await newActivity.save();
    res.status(201).json({ message: 'Activity saved successfully' });
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});


app.post('/api/activities/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body;

    // Update activity status
    const activity = await Activity.findById(id);
    if (!activity) {
      return res.status(404).json({ error: 'Activity not found' });
    }

    if (action === 'completed') {
      activity.progress = 'Completed';
    } else if (action === 'cancel') {
      activity.progress = 'Cancelled';
    }

    await activity.save();
    res.json({ message: 'Activity status updated successfully' });
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// Endpoint to get activities filtered by creation date
app.get('/api/activities', (req, res) => {
  // Get the date from the query parameters
  const { date } = req.query;

  console.log(date);

  // Filter activities based on the creation date
  const filteredActivities = activities.filter(activity => {
      return activity.createdAt.startsWith(date);
  });

  res.json({ activities: filteredActivities });
});


// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
