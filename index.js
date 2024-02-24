const express = require('express');
const bodyParser = require('body-parser');
const Botly = require('botly');
const axios = require('axios');

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
app.use("/", botly.router());

// Handle initial greeting and image sending
botly.on('message', async (sender, message, data) => {
  const userId = sender;
  const text = message.message.text
  const currentTime = new Date().getTime();

  // Check if the user interacted in the last minute
  if (!userLastInteraction[userId] || currentTime - userLastInteraction[userId] >= 60000) {

    // Send initial greeting
    botly.sendText({ id: userId, text: 'جاري تلبيت طلبك...' });

    const genert = await generateImage(text)

    // Send images
    const images = genert.imgs
    if (images) {
      userLastInteraction[userId] = currentTime;
   images.forEach((image) => {
      botly.sendImage({ id: userId, url: image });
    });


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
        const response = await axios.post(url, data, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        return response.data;
    } catch (error) {
        console.error("Error:", error);
        throw error;
    }
        }