 import bot from './assets/bot.svg';
import user from './assets/user.svg';
import dotenv from 'dotenv';

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

const addNewQuestion = async (question) => {
  const airtableUrl = `https://api.airtable.com/v0/appolcoyLfSXX3Xhy/QA`;

  try {
    const response = await fetch(airtableUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fields: {
          Question: question,
        },
      }),
    });

    if (response.ok) {
      console.log(`Question "${question}" added to Airtable table.`);
    } else {
      console.log(`Failed to add question "${question}" to Airtable table.`);
    }
  } catch (error) {
    console.error(error);
  }
};const handleSubmit = async (e) => {
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
  const airtableUrl = `https://api.airtable.com/v0/appolcoyLfSXX3Xhy/QA`;

  try {
    // Add new question to Airtable table
    await addNewQuestion(question);

    // Wait up to 10 seconds for the answer to be populated
    let answer;
    for (let i = 0; i < 10; i++) {
      const response = await getAnswerByQuestion(question);

      if (response) {
        answer = response;
        break;
      }

      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    if (answer) {
      // If the response is successful, send back the answer field value as a JSON response
      typeText(messageDiv, answer);
    } else {
      // If no answer is found after 10 seconds, send a timeout error response
      messageDiv.innerHTML = "I'm sorry, I couldn't find an answer to your question.";
    }
  } catch (error) {
    console.error(error);
    messageDiv.innerHTML = "I'm sorry, an error occurred while processing your question.";
  }
};
