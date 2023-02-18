import bot from './assets/bot.svg'
import user from './assets/user.svg'

const form = document.querySelector('form')
const chatContainer = document.querySelector('#chat_container')

let loadInterval

function loader(element) {
    element.textContent = ''

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
    let index = 0

    let interval = setInterval(() => {
        if (index < text.length) {
            element.innerHTML += text.charAt(index)
            index++
        } else {
            clearInterval(interval)
        }
    }, 20)
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
    )
}
const handleSubmit = async (e) => {
  e.preventDefault()

  const data = new FormData(form)

  // user's chatstripe
  chatContainer.innerHTML += chatStripe(false, data.get('prompt'))

  // log the user's question
  console.log(`User question: ${data.get('prompt')}`);

  // to clear the textarea input 
  form.reset()

  // bot's chatstripe
  const uniqueId = generateUniqueId()
  chatContainer.innerHTML += chatStripe(true, " ", uniqueId)

  // to focus scroll to the bottom 
  chatContainer.scrollTop = chatContainer.scrollHeight;

  // specific message div 
  const messageDiv = document.getElementById(uniqueId)

  // messageDiv.innerHTML = "..."
  loader(messageDiv)

  const question = data.get('prompt')
  const airtableUrl = 'https://api.airtable.com/v0/appolcoyLfSXX3Xhy/QA'

  const requestBody = {
    records: [
      {
        fields: {
          Question: question,
          Answer: ''
        }
      }
    ]
  }

  const response = await fetch(airtableUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer keyO4UTbHbZ9n0vui`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody)
  })

  if (response.ok) {
    // Wait for up to 60 seconds for the answer field to be populated
    const startTime = Date.now()
    let answer = ''

    while (!answer && (Date.now() - startTime) < 60000) {
      const response = await fetch(airtableUrl, {
        headers: {
          'Authorization': `Bearer keyO4UTbHbZ9n0vui`
        }
      })
      
      const data = await response.json()
      const record = data.records.find(record => record.fields.Question === question)

      if (record && record.fields.Answer) {
        answer = record.fields.Answer
      } else {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }

    clearInterval(loadInterval)
    messageDiv.innerHTML = " "
    typeText(messageDiv, answer)
  } else {
    clearInterval(loadInterval)
    messageDiv.innerHTML = "Something went wrong"
    alert(response.statusText)
  }
}
