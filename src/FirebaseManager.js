const debug = require('debug')('dev:FirebaseManager');
const errorLog = require('debug')('error:FirebaseManager');
const testLog = require('debug')('tests:FirebaseManager');
const firebaseAdmin = require('firebase-admin');
const serviceAccount = require('../pear-firebase-adminsdk.json');

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
    databaseURL: 'https://pear-59123.firebaseio.com',
  });
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

export const authenticateUser = function authenticateUser(uid, token) {
  return new Promise((resolve, reject) => getFirebaseAuth()
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
};

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

export const createEndorsementChat = ({ documentID, firstPerson, secondPerson }) => (
  createChat({
    documentID,
    firstPerson,
    secondPerson,
    type: 'ENDORSEMENT',
  })
);

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

export const sendServerMessage = async ({ chatID, params, paramsToMessage }) => {
  try {
    const db = getFirebaseDb();
    const now = new Date();
    const chatDocRef = db.collection(CHAT_COLLECTION_NAME)
      .doc(chatID);
    const newMessageRef = chatDocRef.collection('messages')
      .doc();
    // in general we don't do rollbacks because chat messages are pretty low stakes
    await newMessageRef.set({
      documentID: newMessageRef.id,
      type: 'SERVER_MESSAGE',
      contentType: 'TEXT',
      content: paramsToMessage(params),
      timestamp: now,
    });
    await chatDocRef.set({
      lastActivity: now,
    }, { merge: true });
  } catch (e) {
    errorLog(`error sending server message: ${e}`);
  }
};

export const sendNewEndorsementMessage = async ({ chatID, endorser, endorsee }) => {
  const paramsToMessage = ({ u1, u2 }) => `${u1.firstName} created a profile for ${u2.firstName}.`;
  await sendServerMessage({
    chatID,
    params: {
      u1: endorser,
      u2: endorsee,
    },
    paramsToMessage,
  });
};

export const sendMatchRequestServerMessage = async ({ chatID, initiator, hasMatchmaker }) => {
  const paramsToMessage = ({ u, matchmaker }) => (matchmaker
    ? `${u.firstName} sent both of you a match request.`
    : `${u.firstName} sent a match request.`);
  await sendServerMessage({
    chatID,
    params: {
      u: initiator,
      matchmaker: hasMatchmaker,
    },
    paramsToMessage,
  });
};

export const notifyEndorsementChatNewRequest = async ({
  chatID, sentBy, sentFor, receivedBy,
}) => {
  const paramsToMessage = ({ u1, u2, u3 }) => `${u1.firstName} wants to Pear ${u2.firstName} with ${u3.firstName}.`;
  await sendServerMessage({
    chatID,
    params: {
      u1: sentBy,
      u2: sentFor,
      u3: receivedBy,
    },
    paramsToMessage,
  });
};

export const sendMatchAcceptedServerMessage = async ({ chatID }) => {
  const paramsToMessage = () => 'Chat request accepted.';
  await sendServerMessage({
    chatID,
    params: {},
    paramsToMessage,
  });
};

export const notifyEndorsementChatAcceptedRequest = async ({
  chatID, sentBy, sentFor, receivedBy,
}) => {
  const paramsToMessage = ({ u1, u2, u3 }) => `${u1.firstName} Peared ${u2.firstName} with ${u3.firstName}.`;
  await sendServerMessage({
    chatID,
    params: {
      u1: sentBy,
      u2: sentFor,
      u3: receivedBy,
    },
    paramsToMessage,
  });
};
