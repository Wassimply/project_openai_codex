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
    const prompt = req.body.prompt;

    // Construct Airtable API URL with filter formula
    const airtableUrl = `https://api.airtable.com/v0/appolcoyLfSXX3Xhy/QA`;

    // Add new question to Airtable table
const response = await axios.post(airtableUrl, {
  fields: {
    Question: prompt,
    Answer: '', // initially empty until the bot responds
  },
}, {
  headers: {
    Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}`,
    'Content-Type': 'application/json',
  },
});


    console.log(response.data);

    // Wait up to 10 seconds for the answer to be populated
    let answer;
    for (let i = 0; i < 10; i++) {
      const response = await axios.get(airtableUrl, {
        params: {
          maxRecords: 1,
          filterByFormula: `AND({Question}="${prompt}", NOT({Answer}=""))`,
        },
        headers: {
          Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}`,
        },
      });

      console.log(response.data);

      if (response.data.records.length > 0) {
        answer = response.data.records[0].fields.Answer;
        break;
      }

      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    if (answer) {
      // If the response is successful, send back the answer field value as a JSON response
      res.json({ answer });
    } else {
      // If no answer is found after 10 seconds, send a timeout error response
      res.status(408).json({ error: 'A timeout error occurred while fetching the answer.' });
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
