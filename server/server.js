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

    // Construct Airtable API URL with filter formula
    const airtableUrl = https://api.airtable.com/v0/appolcoyLfSXX3Xhy/QA?maxRecords=1&filterByFormula=AND({Question}="${question}");



    // Send GET request to Airtable API with authentication headers
    const response = await axios.get(airtableUrl, {
      headers: {
        Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}`,
      },
    });

    // If the response is successful, send back the answer field value as a JSON response
    if (response.status === 200) {
      const answer = response.data.records[0].fields.Answer;
      res.json({ answer });
    } else {
      // Otherwise, send an error response
      res.status(response.status).json({ error: 'An error occurred while fetching the answer.' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An internal server error occurred.' });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}.`);
});
