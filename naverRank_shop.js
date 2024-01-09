const { chromium } = require("playwright-extra");
const stealth = require("puppeteer-extra-plugin-stealth")();
chromium.use(stealth);
const axios = require("axios");
const cron = require("node-cron");
const mongoose = require("mongoose");
const { History , Ranking , User } = require('./models');

const MONGODB_URL =
  "mongodb+srv://admin:vgxVuFLaF2PUw4zP@cluster0.r8rb0ar.mongodb.net/naverdev";
const BOT_TOKEN = "6440113170:AAHjQntyJSl5o7eCMPoolThAzNAzXbTOFKw"; // Replace with your Bot token from BotFather
const CHANNEL_CHAT_ID = "-1001929837998"; // Replace with your channel's chat ID

const sendMessage = async (text,chatId) => {
  try {
    const response = await axios.post(
      `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
      {
        chat_id: chatId ? chatId : CHANNEL_CHAT_ID,
        text: text,
        parse_mode: "html",
      }
    );
  } catch (error) {
    console.error("Error sending message:", error);
  }
};

const checkRank = async (page, siteUrl) => {
  await page.waitForLoadState('domcontentloaded');
 
  await page.evaluate(() => {
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  });

  await new Promise((resolve) => setTimeout(resolve, 2_000));

  await page.evaluate(() => {
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  });
 
  await new Promise((resolve) => setTimeout(resolve, 2_000));

  await page.evaluate(() => {
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  });
 
  await new Promise((resolve) => setTimeout(resolve, 2_000));

  await page.evaluate(() => {
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  });
 
  await new Promise((resolve) => setTimeout(resolve, 2_000));

  // await page.waitForSelector(".lst_total");
  const elementsArray = await page.evaluate(() => {
    // Perform DOM operations within page.evaluate
    // Select elements that match your criteria and extract relevant data

      // Get all div elements within 
      const liElements = document.querySelectorAll('.thumbnail_thumb_wrap__RbcYO._wrapper');
      const li2Elements = document.querySelectorAll('.product_mall_title__Xer1m')
      console.log(liElements.length)
      // Array to store the final HTML content
      const liHtmlArray = [];

      // Loop through each li element
      liElements.forEach((li) => {
        // Get the first anchor tag within the li
        const anchorTag = li.querySelector("a[href]");

        // Check if an anchor tag is found within the li
        if (anchorTag) {
          // Get the data-i attribute value from the anchor tag and push it to the array
          const dataUrl = anchorTag.getAttribute("data-i");
          if (dataUrl) {
            liHtmlArray.push(dataUrl);
          }
        }
      });

      const li2HtmlArray = [];
      li2Elements.forEach((li) => {
        // Get the first anchor tag within the li
        const anchorTag = li.querySelector("a[href]");

        // Check if an anchor tag is found within the li
        if (anchorTag) {
          // Get the data-i attribute value from the anchor tag and push it to the array
          const dataUrl = anchorTag.getAttribute("href");
          if (dataUrl) {
            li2HtmlArray.push(dataUrl);
          }
        }
      });

      // Return the array containing HTML content of the second anchor tags in li elements
      return [liHtmlArray,li2HtmlArray];
  });
  let arr1 = elementsArray[0];
  let arr2 = elementsArray[1];
  for (let i = 0; i < arr1.length; i++) {

    if ((siteUrl).includes(arr1[i])) {
      return i + 1;
    }
  }

  for (let i = 0; i < arr2.length; i++) {
    let params = new URLSearchParams(new URL(arr2[i]).search);
    let desiredString = params?.get('url')?.split('/').pop();

    // console.log(arr2[i],desiredString);
    if ((siteUrl).includes(desiredString)) {
      return i + 1;
    }
  }
  
  return -1;
};

const nextPage = async (page) => {

    try {
      await page.getByRole('link', { name: '다음', timeout: 3000 }).click();
      
      await new Promise((resolve) => setTimeout(resolve, 2_000)); 
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

  // await page.pause();

  await page.goto('https://shopping.naver.com/home');
  await page.getByRole('textbox', { name: '검색어 입력' }).click();
  await page.getByRole('textbox', { name: '검색어 입력' }).fill(searchText);
  await page.getByRole('button', { name: '네이버쇼핑 검색' }).click();

  // try{
  //   await page.getByRole("button", { name: "검색", exact: true }).click();
  //   await page.getByRole("link", { name: "검색결과 더보기" }).click();
  // }
  // catch(e){
  //   console.log(e);
  // }

  let pageNo = 0;
  let finalRank = 0;

  while (pageNo < 8) {
    let rank = await checkRank(page, siteUrl);
    if (rank == -1) {
      pageNo++;
      let res = await nextPage(page);
      if(!res) pageNo = 100;
    } else {
      finalRank = pageNo * 50 + rank;
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
      await mongoose.connect(MONGODB_URL);
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

    const documents = await Ranking.find({ "category": "nshop" });

    msg = "";

    for (const ele of documents) {
      try {
        let rank = await getRank(ele.keywords, ele.url);

        //update Ranking Table
        let updateData = await Ranking.updateOne(
          { _id: ele._id },
          {
            $set: {
              rank: rank,
              prevRank: ele.rank 
            },
          }
        );

        const diff = ele.rank - rank;
        const rankMsg =
          "Rank Check for " +
          ele.keywords +
          " url:" +
          ele.url +
          ": " +
          rank +
          " (" +
          (diff == 0 ? "No Change" : diff > 0 ? "+" + diff : diff) +
          ")";

        sendMessage(rankMsg);

        const getOwnerForEntry = await User.findOne({_id: ele.createdBy });
        
        if (getOwnerForEntry.telegramUUID && diff !== 0) {
          sendMessage(rankMsg, getOwnerForEntry.telegramUUID);
          console.log("Sent the message to" + getOwnerForEntry.telegramId);
        }

        //add record to history
        const newHistory = new History({
          ranking: ele._id, // Replace with an actual Ranking ID
          rank: rank, // Replace with the desired rank
        });

        await newHistory
          .save()
          .then((result) => {
            // console.log("New History inserted:", result);
          })
          .catch((err) => {
            console.error("Error inserting History:" + err);
          });
      } catch (err) {
        console.log("some issue checking rank pls contact dev for entry:" + err);
        sendMessage(
          "some issue checking rank pls contact dev for entry" + ele.keywords + ele.url
        );
        // Handle the error for a specific element
      }
    }
    sendMessage('Automatic Rank Check For Shop is now completed.');
  } catch (e) {
    console.log('automation error:' + e);
  } finally {
    // Close the confnection if it was initially closed
    if (initialConnectionState !== 1) {
      await mongoose.connection.close();
      console.log("Database connection closed");
    }
  }
}

executeTaskListSequentially();

// Schedule the cron job
cron.schedule(
  "0 7,19 * * *",
  () => {
    executeTaskListSequentially();
  },
  {
    scheduled: true,
    timezone: "Asia/Seoul",
  }
);
