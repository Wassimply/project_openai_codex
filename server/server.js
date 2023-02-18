import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Enable CORS middleware
app.use(cors());

// Parse incoming JSON requests
app.use(express.json());

// POST endpoint to receive question from client
app.post('/question', async (req, res) => {
  try {
    const question = req.body.question;

    // Send POST request to Airtable API to insert a new record
    const insertUrl = `https://api.airtable.com/v0/appolcoyLfSXX3Xhy/QA`;
    const insertData = { records: [ { fields: { Question: question } } ] };
    const insertResponse = await axios.post(insertUrl, insertData, {
      headers: {
        Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    // Get the ID of the newly inserted record
    const recordId = insertResponse.data.records[0].id;

    // Poll the Airtable API until the "Answer" field is populated
    const startTime = new Date();
    let answer = null;
    while (!answer && new Date() - startTime < 60000) {
      const selectUrl = `https://api.airtable.com/v0/appolcoyLfSXX3Xhy/QA/${recordId}`;
      const selectResponse = await axios.get(selectUrl, {
        headers: {
          Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}`,
        },
      });
      answer = selectResponse.data.fields.Answer;
      await new Promise(resolve => setTimeout(resolve, 5000));
    }

    // If the "Answer" field is populated, send it back to the client as a JSON response
    if (answer) {
      res.json({ answer });
    } else {
      // Otherwise, send an error response
      res.status(500).json({ error: 'Timed out while waiting for the answer to be added to the database.' });
    }
  } catch (error) {
    if (error.response && error.response.status === 401) {
      console.error('Airtable API key is invalid or missing.');
      res.status(500).json({ error: 'An internal server error occurred.' });
    } else {
      console.error(error);
      res.status(500).json({ error: 'An internal server error occurred.' });
    }
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}.`);
});
