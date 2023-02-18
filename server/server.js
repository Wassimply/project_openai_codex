require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");
const app = express();
const port = process.env.PORT || 3000;
const airtableUrl = `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/QA`;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.post("/webhook", async (req, res) => {
  const question = req.body.message.text;

  const airtableParams = {
    maxRecords: 1,
    filterByFormula: `AND({Question}="${question}")`,
  };

  try {
    const { data } = await axios.get(airtableUrl, {
      params: airtableParams,
      headers: {
        Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}`,
      },
    });

    const botResponse = data.records.length > 0 ? data.records[0].fields.Answer : "I'm sorry, I don't understand your question.";

    const response = {
      bot: {
        name: "AirtableBot",
        response: botResponse,
      },
    };

    res.send(response);
  } catch (error) {
    console.log(error);
    res.sendStatus(500);
  }
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
