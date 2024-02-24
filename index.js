const express = require('express');
const bodyParser = require('body-parser');
const Botly = require('botly');
const fetch = require('node-fetch');

const app = express();
const port = process.env.PORT || 3000;
const botly = new Botly({
    accessToken: process.env.PAGE_ACCESS_TOKEN,
    verifyToken: process.env.VERIFY_TOKEN,
    webHookPath: "/",
});

const userLastInteraction = {}; // To track the last interaction time for each user
const userm = [];

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.get('/', (req, res) => {
  res.send('<h1> Hello World </h1>');
});

// Handle initial greeting and image sending
botly.on('message', async (sender, message, data) => {
  const userId = sender;
  const text = message.message.text
  const currentTime = new Date().getTime();

  // Check if the user interacted in the last minute
  if (!userLastInteraction[userId] || currentTime - userLastInteraction[userId] >= 60000) {

    // Send initial greeting
    botly.sendText({ id: userId, text: 'جاري تلبيت طلبك...' });


    let data = await generateImage(text)
    if (data && data.imgs.length > 0) {
      for (let i = 0; i < data.imgs.length; i++) {
      botly.sendImage({ id: userId, url: data.imgs[i] });
      }
    // Notify the user that the bot is ready for the next interaction
    setTimeout(() => {
      botly.sendText({ id: userId, text: 'الروبوت جاهز لطلبك التالي!' });
    }, 60000);
    } else {
      botly.sendText({ id: userId, text: 'يتعذر تنفيذ الطلب' });
    }

  } else {
    if (!userm.includes(userId)) {
    // Notify the user that they need to wait before the next interaction
    botly.sendText({ id: userId, text: 'يمكنك التفاعل مع الروبوت مرة واحدة بعد دقيقة. انتظر من فضلك.' });
    // add userid to userm
    userm.push(userId)
    }    

  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

async function generateImage(captionInput) {
    const data = {
        captionInput,
        captionModel: "default"
    };

    const url = 'https://chat-gpt.photos/api/generateImage';

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();
        return result;
    } catch (error) {
        console.error("Error:", error);
        throw error;
    }
}