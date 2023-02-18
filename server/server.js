// Import necessary libraries
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

// Create an instance of Express
const app = express();

// Middleware to parse request bodies
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Enable Cross-Origin Resource Sharing (CORS)
app.use(cors());

// Get the Airtable base ID and API key from environment variables
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;

// Endpoint for handling POST requests to /question
app.post('/question', async (req, res) => {
  try {
    const question = req.body.question;

    // Construct the Airtable API URL with the question as a filter
    const airtableUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/QA?maxRecords=1&filterByFormula=AND({Question}="${question}")`;

    // Make a GET request to the Airtable API with the authorization header
    const response = await axios.get(airtableUrl, {
      headers: {
        Authorization: `Bearer ${AIRTABLE_API_KEY}`,
      },
    });

    // If the response is OK, get the answer field value from the Airtable response
    if (response.ok) {
      const data = response.data;
      const answer = data.records[0].fields.Answer.trim();

      // Send the answer as a JSON response
      res.json({ answer });
    } else {
      // If the response is not OK, send a 500 Internal Server Error response
      res.sendStatus(500);
    }
  } catch (error) {
    // If there is an error, log it to the console and send a 500 Internal Server Error response
    console.error(error);
    res.sendStatus(500);
  }
});

// Get the port number from the environment variable or use 3000 as the default
const PORT = process.env.PORT || 3000;

// Start the server and listen on the specified port
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
