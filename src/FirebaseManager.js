const debug = require('debug')('dev:FirebaseManager');
const errorLog = require('debug')('error:FirebaseManager');
const firebaseAdmin = require('firebase-admin');
const serviceAccount = require('../pear-firebase-adminsdk.json');

const CHAT_COLLECTION_NAME = 'chats-brian';
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

const createChat = ({ documentID, firstPerson, secondPerson, type }) => {
  const db = getFirebaseDb();
  const now = new Date();
  return db.collection(CHAT_COLLECTION_NAME)
    .doc(documentID)
    .set({
      documentID,
      type,
      firstPerson_id: firstPerson._id.toString(),
      secondPerson_id: secondPerson._id.toString(),
      lastActivity: now,
      firstPersonLastOpened: new Date(0), // default to 0 millis past epoch
      secondPersonLastOpened: new Date(0),
      access: [firstPerson.firebaseAuthID, secondPerson.firebaseAuthID],
    })
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

export const createMatchChat = ({ documentID, firstPerson, secondPerson }) => (
  createChat({
    documentID,
    firstPerson,
    secondPerson,
    type: 'MATCH',
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
