const accountSid = 'AC78a2a002835fe186a8c6d290a27d308d';
const authToken = '3dd7f2cbe6d56127f1a074123f9e05f0';
const client = require('twilio')(accountSid, authToken);

// const debug = require('debug')('dev:SMSHelper');

const sendMessage = (to, body) => {
  client.messages
    .create({
      body,
      to,
      from: '+16172997444',
    })
    .then(message => console.log(message.sid))
    .done();
};

export default sendMessage;
