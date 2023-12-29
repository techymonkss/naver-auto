const TelegramBot = require('node-telegram-bot-api');
const cron = require('node-cron');
const { User } = require('./models');
const mongoose = require("mongoose");

// Replace with your Telegram Bot token
const token = '6440113170:AAHjQntyJSl5o7eCMPoolThAzNAzXbTOFKw';
const MONGODB_URL= "mongodb+srv://admin:vgxVuFLaF2PUw4zP@cluster0.r8rb0ar.mongodb.net/naverdev";

let initialConnectionState;
async function initailizeDb()
{
  initialConnectionState = mongoose.connection.readyState;

  if (initialConnectionState !== 1) { // not connected
    try {
      await mongoose.connect(MONGODB_URL, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      console.log("Database connected");
    } catch (error) {
      console.error("Database connection error:", error);
      return false;
    }
  }
  return true;
}

async function executeTaskListSequentially() {
  
    try {
      await initailizeDb();

      // Initialize Telegram Bot
      const bot = new TelegramBot(token);

      await bot
        .getUpdates()
        .then((updates) => {
          console.log(updates);
          updates.forEach(async (update) => {
            const { message } = update;
            const { from } = message;
            if (from.id && from.username) {
              // If the message ID matches any stored ID
              console.log(`Match found for user ID: ${from.id}`);
              console.log(`Corresponding chat name: ${from.username}`);
              //   const documents = await User.find({ telegramId: from.username });

              const result = await User.updateMany(
                { telegramId: from.username },
                { $set: { telegramUUID: from.id } }
              );

              console.log(`${result.modifiedCount} document(s) updated`);
            }
          });
        })
        .catch((error) => {
          console.error("Error fetching updates:", error);
        });

    } catch (e) {
      console.log(e);
    } finally {
      // Close the connection if it was initially closed
      if (initialConnectionState !== 1) {
        setTimeout(()=>mongoose.connection.close(),60_000)
        
        console.log("Database connection closed requested");
      }
    }
  }


executeTaskListSequentially();
// Cron job to call getUpdates every 2hrs (adjust the schedule as needed)
cron.schedule("0 */2 * * *", () => {
    executeTaskListSequentially();
});
