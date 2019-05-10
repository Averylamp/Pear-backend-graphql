import { Match } from '../../models/MatchModel';
import { MATCH1_ID, MATCH4_ID } from '../TestsContants';
import { sendMessage } from '../../FirebaseManager';

const testLogger = require('debug')('tests:SendChatMessagesTest');

const chalk = require('chalk');

const testCaseStyling = chalk.yellow.bold;
const successStyling = chalk.rgb(75, 255, 67).bold;

const testLog = log => testLogger(testCaseStyling(log));
const successLog = log => testLogger(successStyling(log));

export const runSendChatMessagesTest = async () => {
  testLog('TESTING: Sending Chat Messages');
  const match1 = await Match.findById(MATCH1_ID);
  const match3 = await Match.findById(MATCH4_ID);
  await sendMessage({
    chatID: match1.firebaseChatDocumentID,
    messageType: 'USER_MESSAGE',
    content: 'Hey there!',
    sender_id: match1.receivedByUser_id.toString(),
  });
  await sendMessage({
    chatID: match3.firebaseChatDocumentID,
    messageType: 'USER_MESSAGE',
    content: 'Nice to meet you :)',
    sender_id: match3.sentForUser_id.toString(),
  });
  await sendMessage({
    chatID: match3.firebaseChatDocumentID,
    messageType: 'USER_MESSAGE',
    content: 'Cool pics uwu',
    sender_id: match3.receivedByUser_id.toString(),
  });
  await sendMessage({
    chatID: match1.firebaseChatDocumentID,
    messageType: 'USER_MESSAGE',
    content: 'wanna get boba?',
    sender_id: match1.sentForUser_id.toString(),
  });
  successLog('***** Success Sending Chats *****');
};
