const { chromium } = require("playwright-extra");
const stealth = require("puppeteer-extra-plugin-stealth")();
chromium.use(stealth);
const axios = require("axios");
const cron = require("node-cron");
const mongoose = require("mongoose");
const { History , Ranking } = require('./models');


const MONGODB_URL= "mongodb+srv://admin:vgxVuFLaF2PUw4zP@cluster0.r8rb0ar.mongodb.net/naverdev";
const BOT_TOKEN = "6664775756:AAGjZdsR6OmIQeaBvQS5IzExdY8rT07BrJ0"; // Replace with your Bot token from BotFather
const CHANNEL_CHAT_ID = "-4022041614"; // Replace with your channel's chat ID

const sendMessage = async (text) => {
  try {
    const response = await axios.post(
      `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
      {
        chat_id: CHANNEL_CHAT_ID,
        text: text,
        parse_mode: "html",
      }
    );
  } catch (error) {
    console.error("Error sending message:", error);
  }
};

const checkRank = async (page, siteUrl) => {
  await page.waitForSelector(".lst_total");
  const elementsArray = await page.evaluate(() => {
    // Perform DOM operations within page.evaluate
    // Select elements that match your criteria and extract relevant data
    const ulElement = document.querySelector("ul.lst_total");

    if (ulElement) {
      // Get all li elements within the ul
      const liElements = ulElement.querySelectorAll("li");

      // Array to store the final HTML content
      const liHtmlArray = [];

      // Loop through each li element
      liElements.forEach((li) => {
        // Get the first anchor tag within the li
        const anchorTag = li.querySelector("a[href]");

        // Check if an anchor tag is found within the li
        if (anchorTag) {
          // Get the data-url attribute value from the anchor tag and push it to the array
          const dataUrl = anchorTag.getAttribute("data-url");
          if (dataUrl) {
            liHtmlArray.push(dataUrl);
          }
        }
      });

      // Return the array containing HTML content of the second anchor tags in li elements
      return liHtmlArray;
    }
  });
  for (let i = 0; i < elementsArray.length; i++) {
    if (elementsArray[i].indexOf(siteUrl) !== -1) {
      return i + 1;
    }
  }
  return -1;
};

const nextPage = async (page) => {

    try {
      let btn = await page
        .locator("#main_pack")
        .getByRole("button", { name: "다음", timeout: 3000 }).click();

    } catch (error) {
      console.error("Error clicking the button:", error);
      // Handle the error or retry logic here
      return false;
    }
    return true;
};

let msg = '';
const getRank = async (searchText, siteUrl) => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto("https://www.naver.com/");
  await page.getByPlaceholder("검색어를 입력해 주세요.").click();
  await page.getByPlaceholder("검색어를 입력해 주세요.").fill(searchText);
  try{
    await page.getByRole("button", { name: "검색", exact: true }).click();
    await page.getByRole("link", { name: "검색결과 더보기" }).click();
  }
  catch(e){
    console.log(e);
  }

  let pageNo = 0;
  let finalRank = 0;

  while (pageNo < 8) {
    let rank = await checkRank(page, siteUrl);
    if (rank == -1) {
      pageNo++;
      let res = await nextPage(page);
      if(!res) pageNo = 100;
    } else {
      finalRank = pageNo * 15 + rank;
      break;
    }
  }

  msg += "rank for " + searchText + " , " + siteUrl + " is: " + finalRank + '\n';

  // await page.pause();
  await browser.close();
  return finalRank;
};

let initialConnectionState
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

    const documents = await Ranking.find({ "category":{ $ne: "nshop" }});

    msg = "";
    for (const ele of documents) {
      try {
        let rank = await getRank(ele.keywords, ele.url);
        sendMessage('Rank Check for ' + ele.keywords + ' url:' + ele.url + 'is : ' + rank);
        //update Ranking Table
        let updateData = await Ranking.updateOne(
          { _id: ele._id },
          {
            $set: {
              rank: rank,
            },
          }
        );

        //add record to history
        const newHistory = new History({
          ranking: ele._id, // Replace with an actual Ranking ID
          rank: rank, // Replace with the desired rank
        });

        await newHistory
          .save()
          .then((result) => {
            console.log("New History inserted:", result);
          })
          .catch((err) => {
            console.error("Error inserting History:", err);
          });
      } catch (err) {
        console.log("whole crash handle Error occurred:", err);
        sendMessage(
          "some issue checking rank pls contact dev for entry",
          ele.keywords + ele.url
        );
        // Handle the error for a specific element
      }
    }
    sendMessage('Automatic Rank Check For Site is completed.');
    sendMessage(msg);
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

executeTaskListSequentially();

// Schedule the cron job
cron.schedule(
  "0 6,18 * * *",
  () => {
    executeTaskListSequentially();
  },
  {
    scheduled: true,
    timezone: "Asia/Seoul",
  }
);
