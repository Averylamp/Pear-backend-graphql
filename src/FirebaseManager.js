import { generateSentryError } from './SentryHelper';

const debug = require('debug')('dev:FirebaseManager');
const errorLog = require('debug')('error:FirebaseManager');
const testLog = require('debug')('tests:FirebaseManager');
const firebaseAdmin = require('firebase-admin');
const serviceAccount = require('../lifestyle-5991f-firebase-adminsdk-qw4ou-542edad9db.json');

// if DB_NAME specified, hit chats-$DB_NAME
// if CHAT_COLLECTION env variable specified, override and use that collection
const dbName = process.env.DB_NAME ? process.env.DB_NAME : 'dev';
let chatCollection = `chats-${dbName}`;
chatCollection = process.env.CHAT_COLLECTION
  ? process.env.CHAT_COLLECTION
  : chatCollection;
export const CHAT_COLLECTION_NAME = chatCollection;

let initialized = false;

const initialize = () => {
  firebaseAdmin.initializeApp({
    credential: firebaseAdmin.credential.cert(serviceAccount),
    // databaseURL: 'https://pear-59123.firebaseio.com',
  });
};

const getAdminObj = () => {
  if (!initialized) {
    initialize();
    initialized = true;
  }
  return firebaseAdmin;
};

const getFirebaseDb = () => {
  if (!initialized) {
    initialize();
    initialized = true;
  }
  return firebaseAdmin.firestore();
};

const getFirebaseAuth = () => {
  if (!initialized) {
    initialize();
    initialized = true;
  }
  return firebaseAdmin.auth();
};

export const getChatDocPathFromId = firebaseId => `${CHAT_COLLECTION_NAME}/${firebaseId}`;

export const authenticateUser = async (uid, token) => new
Promise((resolve, reject) => getFirebaseAuth()
  .verifyIdToken(token)
  .then((decodedToken) => {
    const tokenUID = decodedToken.uid;
    if (uid === tokenUID) {
      resolve(uid);
    } else {
      debug(`Failed Authentication for uid: ${uid}`);
      reject(Error('Unauthenticated Token'));
    }
  }));

export const deleteChatsCollection = async () => {
  if (chatCollection === 'chats' || chatCollection === 'chats-prod') {
    errorLog('CAN\'T DELETE PROD CHATS PROGRAMMATICALLY');
    throw new Error('CAN\'T DELETE PROD CHATS PROGRAMMATICALLY');
  }
  const db = getFirebaseDb();
  const allChatsSnapshot = await db.collection(CHAT_COLLECTION_NAME)
    .get();
  const deleteChatsPromises = [];
  for (const doc of allChatsSnapshot.docs) {
    testLog('deleting chat');
    const docRef = doc.ref;
    const snapshot = await docRef.collection('messages').get();
    const deleteMsgsPromises = [];
    for (const msg of snapshot.docs) {
      deleteMsgsPromises.push(msg.ref.delete());
    }
    await Promise.all(deleteMsgsPromises);
    deleteChatsPromises.push(docRef.delete());
  }
  await Promise.all(deleteChatsPromises);
};

const createChat = ({
  documentID, firstPerson, secondPerson, type, mongoID,
}) => {
  const db = getFirebaseDb();
  const now = new Date();
  const setObj = {
    documentID,
    type,
    firstPerson_id: firstPerson._id.toString(),
    secondPerson_id: secondPerson._id.toString(),
    lastActivity: now,
    firstPersonLastOpened: new Date(0), // default to 0 millis past epoch
    secondPersonLastOpened: new Date(0),
    access: [firstPerson.firebaseAuthID, secondPerson.firebaseAuthID],
  };
  if (mongoID) {
    setObj.mongoDocument_id = mongoID.toString();
  }
  return db.collection(CHAT_COLLECTION_NAME)
    .doc(documentID)
    .set(setObj)
    .catch((err) => {
      errorLog(`error creating chat document: ${err}`);
      throw err;
    });
};

// throws if fails
export const createEndorsementChat = ({ documentID, firstPerson, secondPerson }) => (
  createChat({
    documentID,
    firstPerson,
    secondPerson,
    type: 'ENDORSEMENT',
  })
);

// throws if fails
export const createMatchChat = ({
  documentID, firstPerson, secondPerson, mongoID,
}) => (
  createChat({
    documentID,
    firstPerson,
    secondPerson,
    type: 'MATCH',
    mongoID,
  })
);

// does not throw
export const sendMessage = async ({
  chatID, messageType, content, sender_id, contentType,
}) => {
  try {
    const db = getFirebaseDb();
    const now = new Date();
    const chatDocRef = db.collection(CHAT_COLLECTION_NAME)
      .doc(chatID);
    const newMessageRef = chatDocRef.collection('messages')
      .doc();
    // in general we don't do rollbacks because chat messages are pretty low stakes
    const messageSetObj = {
      documentID: newMessageRef.id,
      type: messageType,
      contentType: contentType || 'TEXT',
      content,
      timestamp: now,
    };
    if (sender_id) {
      messageSetObj.sender_id = sender_id;
    }
    await newMessageRef.set(messageSetObj);
    await chatDocRef.set({
      lastActivity: now,
    }, { merge: true });
  } catch (e) {
    errorLog(`error sending server message: ${e}`);
  }
};

export const sendNewEndorsementMessage = async ({ chatID, endorser, endorsee }) => {
  const paramsToMessage = ({ u1, u2 }) => `${u1.firstName} created a profile for ${u2.firstName}.`;
  const params = {
    u1: endorser,
    u2: endorsee,
  };
  return sendMessage({
    chatID,
    messageType: 'SERVER_MESSAGE',
    content: paramsToMessage(params),
  });
};

export const notifyEndorsementChatNewRequest = async ({
  chatID, sentBy, sentFor, receivedBy,
}) => {
  const paramsToMessage = ({ u1, u2, u3 }) => `${u1.firstName} wants to Pear ${u2.firstName} with ${u3.firstName}.`;
  const params = {
    u1: sentBy,
    u2: sentFor,
    u3: receivedBy,
  };
  return sendMessage({
    chatID,
    messageType: 'SERVER_MESSAGE',
    content: paramsToMessage(params),
  });
};

export const sendMatchAcceptedServerMessage = async ({ chatID }) => {
  const paramsToMessage = () => 'Chat request accepted.';
  return sendMessage({
    chatID,
    messageType: 'SERVER_MESSAGE',
    content: paramsToMessage(),
  });
};

export const notifyEndorsementChatAcceptedRequest = async ({
  chatID, sentBy, sentFor, receivedBy,
}) => {
  const paramsToMessage = ({ u1, u2, u3 }) => `${u1.firstName} Peared ${u2.firstName} with ${u3.firstName}.`;
  const params = {
    u1: sentBy,
    u2: sentFor,
    u3: receivedBy,
  };
  return sendMessage({
    chatID,
    messageType: 'SERVER_MESSAGE',
    content: paramsToMessage(params),
  });
};

export const sendMatchmakerRequestMessage = async ({
  chatID,
  sentBy,
  requestText,
  likedPhoto,
  likedPrompt,
}) => {
  const contentObj = {};
  let contentType = 'TEXT';
  if (requestText) {
    contentObj.message = requestText;
  }
  if (likedPhoto) {
    contentObj.likedPhoto = likedPhoto;
    contentType = 'PHOTO_LIKE';
  } else if (likedPrompt) {
    contentObj.likedPrompt = likedPrompt;
    contentType = 'PROMPT_LIKE';
  }
  sendMessage({
    chatID,
    messageType: 'MATCHMAKER_REQUEST',
    content: contentType === 'TEXT' ? (requestText || '') : JSON.stringify(contentObj),
    contentType,
    sender_id: sentBy._id.toString(),
  });
};

export const sendPersonalRequestMessage = async ({
  chatID,
  sentBy,
  requestText,
  likedPhoto,
  likedPrompt,
}) => {
  const contentObj = {};
  let contentType = 'TEXT';
  if (requestText) {
    contentObj.message = requestText;
  }
  if (likedPhoto) {
    contentObj.likedPhoto = likedPhoto;
    contentType = 'PHOTO_LIKE';
  } else if (likedPrompt) {
    contentObj.likedPrompt = likedPrompt;
    contentType = 'PROMPT_LIKE';
  }
  sendMessage({
    chatID,
    messageType: 'PERSONAL_REQUEST',
    content: contentType === 'TEXT' ? (requestText || '') : JSON.stringify(contentObj),
    contentType,
    sender_id: sentBy._id.toString(),
  });
};

export const sendPushNotification = async ({ deviceToken, title, body }) => {
  try {
    if (deviceToken) {
      const admin = getAdminObj();
      const message = {
        notification: {
          title,
          body,
        },
        token: deviceToken,
        apns: {
          payload: {
            aps: {
              'content-available': true, // this is necessary to ensure client logic executes in bg
              sound: 'default',
            },
          },
        },
      };
      admin.messaging()
        .send(message)
        .catch((err) => {
          generateSentryError({
            args: { deviceToken, title, body },
            errorName: 'error sending push notification',
            errorMsg: err,
          });
          errorLog(`error occurred sending push notification: ${err}`);
        });
    }
  } catch (e) {
    generateSentryError({
      args: { deviceToken, title, body },
      errorName: 'error sending push notification',
      errorMsg: e,
    });
    errorLog(`error occurred sending push notification: ${e}`);
  }
};

export const sendProfileApprovedPushNotification = async ({ creator, user }) => (
  sendPushNotification({
    deviceToken: creator.firebaseRemoteInstanceID,
    title: 'Start Pear-ing for your friend',
    body: `${user.firstName} approved the profile you wrote for them!`,
  }));

export const sendMatchReceivedByPushNotification = async ({ receivedBy }) => (
  sendPushNotification({
    deviceToken: receivedBy.firebaseRemoteInstanceID,
    title: 'New match request',
    body: 'Tap to check them out 😉',
  }));

export const sendMatchSentForPushNotification = async ({ sentBy, sentFor }) => (
  sendPushNotification({
    deviceToken: sentFor.firebaseRemoteInstanceID,
    title: 'New match request',
    body: `${sentBy.firstName} wants to Pear you with someone new 🙈 🙉`,
  }));

export const sendMatchAcceptedPushNotification = async ({ user, otherUser }) => (
  sendPushNotification({
    deviceToken: user.firebaseRemoteInstanceID,
    title: 'It\'s a Pear!',
    body: `You matched with ${otherUser.firstName}`,
  }));

export const sendMatchAcceptedMatchmakerPushNotification = async ({ sentBy, sentFor }) => (
  sendPushNotification({
    deviceToken: sentBy.firebaseRemoteInstanceID,
    title: 'It\'s a Pear!',
    body: `You helped your friend ${sentFor.firstName} find a match!`,
  }));

export const sendNewMessagePushNotification = async ({ from, to }) => (
  sendPushNotification({
    deviceToken: to.firebaseRemoteInstanceID,
    body: `${from.firstName} sent you a new message`,
  }));
