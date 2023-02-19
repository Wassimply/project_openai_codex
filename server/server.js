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

// Construct Airtable API URL
const airtableUrl = 'https://api.airtable.com/v0/appolcoyLfSXX3Xhy/QA';

// POST endpoint to receive question from client
app.post('/question', async (req, res) => {
  try {
    const question = req.body.prompt;

    // Look up existing question in Airtable
    const existingQuestionsResponse = await axios.get(airtableUrl, {
      params: {
        maxRecords: 1,
        filterByFormula: `{Question} = "${question}"`
      },
      headers: {
        'Authorization': `Bearer ${process.env.AIRTABLE_API_KEY}`
      }
    });

    const existingQuestionsData = existingQuestionsResponse.data;

    if (existingQuestionsData.records.length > 0) {
      // If the question already exists, get the answer from Airtable and return it
      const existingQuestion = existingQuestionsData.records[0];
      const answer = existingQuestion.fields.Answer.trim();
      console.log(`Bot's answer to question "${question}" is "${answer}"`);
      res.json({ answer });
    } else {
      // If the question does not exist, add a new record to Airtable with an empty answer
      const newQuestionResponse = await axios.post(airtableUrl, {
        fields: {
          Question: question,
          Answer: ''
        }
      }, {
        headers: {
          'Authorization': `Bearer ${process.env.AIRTABLE_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      console.log(`Added new question "${question}" to Airtable`);
      res.json({ answer: '' });
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
