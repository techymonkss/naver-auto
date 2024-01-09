const axios = require('axios');

function calculateTotalOrders(data, type) {
    let total = {};
  
    // Loop through the specified type (BUY or SELL)
    for (const key in data[type]) {
      const qty = data[type][key].quantity;
      const price = parseFloat(key);
  
      // Calculate the total for each price point
      if (!total[price]) {
        total[price] = qty;
      } else {
        total[price] += qty;
      }
    }
  
    return total;
  }

let config = {
  method: 'get',
  maxBodyLength: Infinity,
  url: 'https://prod.api.probo.in/api/v1/tms/trade/bestAvailablePrice?eventIds=1941427',
  headers: { 
    'authority': 'prod.api.probo.in', 
    'accept': '*/*', 
    'accept-language': 'en', 
    'appid': 'in.probo.pro', 
    'authorization': 'Bearer Mr7Xb/fFpGl+YE8Pgh+xgbcSnvUBHqaTS/R5IwXrLrk=', 
    'content-type': 'application/json', 
    'origin': 'https://trading.probo.in', 
    'referer': 'https://trading.probo.in/', 
    'sec-ch-ua': '"Not_A Brand";v="8", "Chromium";v="120", "Brave";v="120"', 
    'sec-ch-ua-mobile': '?0', 
    'sec-ch-ua-platform': '"macOS"', 
    'sec-fetch-dest': 'empty', 
    'sec-fetch-mode': 'cors', 
    'sec-fetch-site': 'same-site', 
    'sec-gpc': '1', 
    'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', 
    'x-device-os': 'ANDROID', 
    'x-version-name': '10'
  }
};

async function callApi(){
    let res = await axios.request(config)
    json = res.data
    // !json.data[0].allowTrade && console.log(`\n*************trading stopped*************`)
      // Example usage:
    logWithTimestamp("This is a message with a timestamp");
    console.log("Active Yes is", json.data[0]?.buy);
    console.log("Active No is", json.data[0]?.sell);
    // Calculate totals for BUY and SELL separately
    data = json.data[0].order_book;
    const buyTotals = calculateTotalOrders(data, "BUY");
    const sellTotals = calculateTotalOrders(data, "SELL");

    // Calculate overall total for BUY and SELL
    const overallBuyTotal = Object.values(buyTotals).reduce((acc, curr) => acc + curr, 0);
    const overallSellTotal = Object.values(sellTotals).reduce((acc, curr) => acc + curr, 0);

    // Calculate overall profit for BUY and SELL
    function calculateOverallTotal(obj, operation) {
      return Object.keys(obj).reduce((acc, curr) => {
        const currNum = parseInt(curr, 10);
        if (currNum < 18) {
          if (operation === 'buyTotalProf' || operation === 'sellTotalProf') {
            return acc + ((10 - currNum) * obj[curr]);
          } else if (operation === 'buyTotalInve' || operation === 'sellTotalInve') {
            return acc + (currNum * obj[curr]);
          }
        }
        return acc;
      }, 0);
    }
    
    const overallBuyTotalProf = calculateOverallTotal(buyTotals, 'buyTotalProf');
    const overallBuyTotalInve = calculateOverallTotal(buyTotals, 'buyTotalInve');
    const overallSellTotalProf = calculateOverallTotal(sellTotals, 'sellTotalProf');
    const overallSellTotalInve = calculateOverallTotal(sellTotals, 'sellTotalInve');
    
    // console.log("Total Buy Orders for Each Key:", buyTotals);
    // console.log("Total Sell Orders for Each Key:", sellTotals);

    console.log("Overall Total Buy Orders:", overallBuyTotal);
    console.log("Overall Total Sell Orders:", overallSellTotal);

    console.log("Overall Total Buy Orders Profit :", overallBuyTotalProf,'for',overallBuyTotalInve);
    console.log("Overall Total Sell Orders Profit :", overallSellTotalProf,'for',overallSellTotalInve);

    console.log("**** THE END***");
}
function logWithTimestamp(message) {
    const timestamp = new Date().toLocaleString();
    console.log(`[${timestamp}] ${message}`);
  }
  
callApi();

let int = setInterval(()=>callApi(),100);

// .then((response) => {
//   console.log(JSON.stringify(response.data));
// })
// .catch((error) => {
//   console.log(error);
// });
