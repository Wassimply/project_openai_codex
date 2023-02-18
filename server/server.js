import express from 'express'
import * as dotenv from 'dotenv'
import cors from 'cors'
import axios from 'axios'

dotenv.config()

const app = express()
app.use(cors())
app.use(express.json())

const MAX_RETRIES = 3;
const RETRY_DELAY = 2000;

app.get('/', async (req, res) => {
  res.status(200).send({
    message: 'Hello from Pure!'
  })
})

app.post('/', async (req, res) => {
  try {
    const question = req.body.prompt;
    const airtableUrl = `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/QA?maxRecords=1&filterByFormula=AND({Question}="${question}")`;
    const headers = {
      Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}`
    };
    
    let retryCount = 0;
    let answer = '';

    while (retryCount < MAX_RETRIES) {
      const response = await axios.get(airtableUrl, { headers });
      const record = response.data.records[0];
      
      if (record && record.fields.Answer) {
        answer = record.fields.Answer;
        break;
      }

      retryCount++;
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
    }

    if (answer) {
      res.status(200).send({
        bot: answer
      });
    } else {
      res.status(500).send('No answer found');
    }

  } catch (error) {
    console.error(error)
    res.status(500).send(error || 'Something went wrong');
  }
})

app.listen(5000, () => console.log('AI server started on http://localhost:5000'))
