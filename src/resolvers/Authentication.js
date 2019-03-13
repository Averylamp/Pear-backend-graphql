const debug = require('debug')('dev:Authentication');

const firebaseAdmin = require('firebase-admin');
const serviceAccount = require('../../pear-firebase-adminsdk.json');

firebaseAdmin.initializeApp({
  credential: firebaseAdmin.credential.cert(serviceAccount),
  databaseURL: 'https://pear-59123.firebaseio.com',
});


export const authenticateUser = function authenticateUser(uid, token) {
  return new Promise((resolve, reject) => firebaseAdmin.auth()
    .verifyIdToken(token).then((decodedToken) => {
      const tokenUID = decodedToken.uid;
      if (uid === tokenUID) {
        resolve(uid);
      } else {
        debug(`Failed Authentication for uid: ${uid}`);
        reject(Error('Unauthenticated Token'));
      }
    }));
};
