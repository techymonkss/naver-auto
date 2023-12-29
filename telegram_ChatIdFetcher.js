const TelegramBot = require('node-telegram-bot-api');
const cron = require('node-cron');
const { User } = require('./models');

// Replace with your Telegram Bot token
const token = '6440113170:AAHjQntyJSl5o7eCMPoolThAzNAzXbTOFKw';

// Initialize Telegram Bot
const bot = new TelegramBot(token, { polling: true });

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

      //   const documents = await Ranking.find({});
      bot
        .getUpdates()
        .then((updates) => {
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
        await mongoose.connection.close();
        console.log("Database connection closed");
      }
    }
  }

// Cron job to call getUpdates every 2hrs (adjust the schedule as needed)
cron.schedule("0 */2 * * *", () => {
    executeTaskListSequentially();
});
