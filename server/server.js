import express from 'express';
import * as dotenv from 'dotenv';
import cors from 'cors';
import axios from 'axios';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', async (req, res) => {
  res.status(200).send({
    message: 'Hello from Pure!'
  });
});

app.post('/', async (req, res) => {
  try {
    const question = req.body.prompt;
    const airtableUrl = `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/QA?maxRecords=1&filterByFormula=AND({Question}="${question.replace(/"/g, '\\"')}")`;
    const headers = {
      Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}`
    };
    const response = await axios.get(airtableUrl, { headers });
    console.log('Response:', response.data);
    if (response.data.records.length > 0) {
      const record = response.data.records[0];
      const answer = record.fields.Answer;
      res.status(200).send({
        bot: answer
      });
    } else {
      res.status(404).send({
        message: 'No answer found for that question'
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).send(error || 'Something went wrong');
  }
});

app.listen(5000, () => console.log('AI server started on http://localhost:5000'));
