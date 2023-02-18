const handleSubmit = async (e) => {
  e.preventDefault();

  const data = new FormData(form);

  // user's chatstripe
  chatContainer.innerHTML += chatStripe(false, data.get('prompt'));

  // to clear the textarea input 
  form.reset();

  // bot's chatstripe
  const uniqueId = generateUniqueId();
  chatContainer.innerHTML += chatStripe(true, " ", uniqueId);

  // to focus scroll to the bottom 
  chatContainer.scrollTop = chatContainer.scrollHeight;

  // specific message div 
  const messageDiv = document.getElementById(uniqueId);

  // messageDiv.innerHTML = "..."
  loader(messageDiv);

  const question = data.get('prompt');
  const airtableUrl = `https://api.airtable.com/v0/appolcoyLfSXX3Xhy/QA?maxRecords=1&filterByFormula=AND({Question}="${question}")`;

  const response = await fetch(airtableUrl, {
    headers: {
      'Authorization': `Bearer keyO4UTbHbZ9n0vui`
    }
  });

  clearInterval(loadInterval)
  messageDiv.innerHTML = " "

  if (response.ok) {
    const data = await response.json();
    if (data.records.length > 0) {
      const answer = data.records[0].fields.Answer.trim(); // get the answer field value from the Airtable response
      typeText(messageDiv, answer);
    } else {
      // no record found
      messageDiv.innerHTML = "Sorry, I couldn't find an answer to that question. I'll look into it and get back to you soon!";
    }
  } else {
    const err = await response.text();

    messageDiv.innerHTML = "Something went wrong";
    alert(err);
  }

  // display default message after 10 seconds
  const defaultAnswer = "Sorry, I couldn't find an answer to that question. I'll look into it and get back to you soon!";
  setTimeout(() => {
    messageDiv.innerHTML = defaultAnswer;
  }, 10000);
}

form.addEventListener('submit', handleSubmit)
form.addEventListener('keyup', (e) => {
    if (e.keyCode === 13) {
        handleSubmit(e)
    }
});
