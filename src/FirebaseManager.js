const debug = require('debug')('dev:FirebaseManager');
const errorLog = require('debug')('error:FirebaseManager');
const firebaseAdmin = require('firebase-admin');
const serviceAccount = require('../pear-firebase-adminsdk.json');

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

export const createEndorsementChat = ({ documentID, firstPerson, secondPerson }) => {
  const db = getFirebaseDb();
  return db.collection('chats-brian')
    .doc(documentID)
    .set({
      documentID,
      type: 'ENDORSEMENT',
      firstPerson_id: firstPerson._id.toString(),
      secondPerson_id: secondPerson._id.toString(),
      lastActivity: new Date(),
      firstPersonLastOpened: new Date(0), // default to 0 millis past epoch
      secondPersonLastOpened: new Date(0),
      access: [firstPerson.firebaseAuthID, secondPerson.firebaseAuthID],
    })
    .then((docRef) => {
      debug(`created document ${docRef}`);
    })
    .catch((err) => {
      errorLog(`error creating chat document: ${err}`);
      throw err;
    });
};


export const sendNewEndorsementMessage = ({ chatID, endorser, endorsee }) => {
  const db = getFirebaseDb();
  const newMessageRef = db.collection('chats-brian')
    .doc(chatID)
    .collection('messages')
    .doc();
  return newMessageRef
    .set({
      documentID: newMessageRef.id,
      content: `${endorser.firstName} created a profile for ${endorsee.firstName}.`,
      contentType: 'TEXT',
      type: 'SERVER_MESSAGE',
      timestamp: new Date(),
    })
    .catch((err) => {
      errorLog(`error sending new endorsement message: ${err}`);
    });
};
