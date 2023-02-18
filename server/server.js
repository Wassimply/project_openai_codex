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

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  next();
});

// POST endpoint to receive question from client
app.post('/question', async (req, res) => {
  try {
    const question = req.body.question;

    // Construct Airtable API URL with filter formula
    const airtableUrl = `https://api.airtable.com/v0/appolcoyLfSXX3Xhy/QA?maxRecords=1&filterByFormula=AND({Question}="${question}")`;

    // Send GET request to Airtable API with authentication headers
    const response = await axios.get(airtableUrl, {
      headers: {
        Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}`,
      },
    });

    // If the response is successful and has at least one record, send back the answer field value as a JSON response
    if (response.status === 200 && response.data.records && response.data.records.length > 0) {
      const answer = response.data.records[0].fields.Answer;
      res.json({ answer });
    } else {
      // If the question does not exist in the Airtable table, wait for 30 seconds and then return the response with a default message
      const defaultAnswer = "idk but i'll make sure to dig deeper into it and get back to you next time!";
      setTimeout(() => {
        res.json({ answer: defaultAnswer });
      }, 30000);
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
