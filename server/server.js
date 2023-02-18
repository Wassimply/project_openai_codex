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
      // If the question does not exist in the Airtable table, create a default answer object and send it as a JSON response
      const defaultAnswer = {
        records: [
          {
            id: '',
            createdTime: '',
            fields: {
              Question: question,
              Answer: "idk but i'll make sure to dig deeper into it and get back to you next time!",
            },
          },
        ],
      };
      setTimeout(() => {
        res.json(defaultAnswer);
      }, 10000);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An internal server error occurred.' });
  }
});
