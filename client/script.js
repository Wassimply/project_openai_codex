import bot from './assets/bot.svg';
import user from './assets/user.svg';

const form = document.querySelector('form');
const chatContainer = document.querySelector('#chat_container');

let loadInterval;

function loader(element) {
  element.textContent = '';

  loadInterval = setInterval(() => {
    // Update the text content of the loading indicator
    element.textContent += '.';

    // If the loading indicator has reached three dots, reset it
    if (element.textContent === '....') {
      element.textContent = '';
    }
  }, 300);
}

function typeText(element, text) {
  let index = 0;

  let interval = setInterval(() => {
    if (index < text.length) {
      element.innerHTML += text.charAt(index);
      index++;
    } else {
      clearInterval(interval);
    }
  }, 20);
}

// generate unique ID for each message div of bot
// necessary for typing text effect for that specific reply
// without unique ID, typing text will work on every element
function generateUniqueId() {
  const timestamp = Date.now();
  const randomNumber = Math.random();
  const hexadecimalString = randomNumber.toString(16);

  return `id-${timestamp}-${hexadecimalString}`;
}

function chatStripe(isAi, value, uniqueId) {
  return (
    `
    <div class="wrapper ${isAi && 'ai'}">
        <div class="chat">
            <div class="profile">
                <img 
                  src=${isAi ? bot : user} 
                  alt="${isAi ? 'bot' : 'user'}" 
                />
            </div>
            <div class="message" id=${uniqueId}>${value}</div>
        </div>
    </div>
  `
  );
}
const handleSubmit = async (e) => {
  e.preventDefault();

  const data = new FormData(form);

  // Add new question to Airtable
  const airtableUrl = 'https://api.airtable.com/v0/appolcoyLfSXX3Xhy/QA';
  await fetch(airtableUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer keyO4UTbHbZ9n0vui`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      fields: {
        Question: data.get('prompt')
      }
    })
  });

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

  try {
    const airtableUrlWithFilter = `https://api.airtable.com/v0/appolcoyLfSXX3Xhy/QA`;

    // Add new question to Airtable table
    await fetch(airtableUrlWithFilter, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer keyO4UTbHbZ9n0vui`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        "fields": {
          "Question": question
        }
      })
    });

    // bot's chatstripe
    const uniqueId = generateUniqueId();
    chatContainer.innerHTML += chatStripe(true, " ", uniqueId);

    // specific message div 
    const messageDiv = document.getElementById(uniqueId);

    // messageDiv.innerHTML = "..."
    loader(messageDiv);

    const airtableUrlWithFilter = `https://api.airtable.com/v0/appolcoyLfSXX3Xhy/QA?maxRecords=1&filterByFormula=AND({Question}="${question}")`;

    // Wait up to 10 seconds for the answer to be populated
    let answer;
    for (let i = 0; i < 10; i++) {
      const response = await fetch(airtableUrlWithFilter, {
        headers: {
          'Authorization': `Bearer keyO4UTbHbZ9n0vui`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.records.length > 0 && data.records[0].fields.Answer) {
          answer = data.records[0].fields.Answer.trim();
          break;
        }
      }

      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    if (answer) {
      typeText(messageDiv, answer);
    } else {
      messageDiv.innerHTML = "Sorry, I don't have an answer for that right now.";
    }
  } catch (error) {
    console.error(error);
    messageDiv.innerHTML = "Oops, something went wrong. Please try again later.";
  }
};
