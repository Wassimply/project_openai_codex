const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;

app.post('/question', async (req, res) => {
  try {
    const question = req.body.question;
    const airtableUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/QA?maxRecords=1&filterByFormula=AND({Question}="${question}")`;

    const response = await axios.get(airtableUrl, {
      headers: {
        Authorization: `Bearer ${AIRTABLE_API_KEY}`,
      },
    });

    const answer = response.data.records[0].fields.Answer;
    res.json({ answer });
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
