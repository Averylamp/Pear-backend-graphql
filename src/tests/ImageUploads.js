const debug = require('debug')('dev:tests:ImageUpload');
const fs = require('fs');
const path = require('path');
const request = require('request');

export const uploadImagesFromFolder = async function uploadImagesFromFolder(folder) {
  debug(folder);
  const filePath = path.join(__dirname, `testImages/${folder}`);
  debug(filePath);
  const imageMetadataPromises = [];

  return fs.readdir(filePath, (err, items) => {
    if (err) {
      return [];
    }
    items.forEach((item) => {
      debug(`Found image: ${item}`);
      const itemPath = path.join(__dirname, `testImages/${folder}/${item}`);
      const base64Image = fs.readFileSync(itemPath, { encoding: 'base64' });
      const newPromise = new Promise((resolve) => {
        request.post('http://koala.mit.edu:1337/upload_image', {
          json: {
            image: base64Image,
          },
        }, (error, res, body) => {
          if (error) {
            debug(error);
            resolve(error);
          }
          debug(`Finished uploading image: ${item}`);
          resolve(body);
        });
      });
      imageMetadataPromises.push(newPromise);
    });

    return Promise.all(imageMetadataPromises).then((imageResults) => {
      const imageMetadata = [];
      imageResults.forEach((imageResult) => {
        if (imageResult instanceof Error) {
          debug(`Failed to upload image: ${imageResult}`);
        } else {
          imageMetadata.push(imageResult);
        }
      });
      return imageResults;
    });
  });
};
