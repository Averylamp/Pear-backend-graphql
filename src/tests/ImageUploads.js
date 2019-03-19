const debug = require('debug')('dev:tests:ImageUpload');
const errorLog = require('debug')('dev:error:ImageUpload');
const fs = require('fs');
const path = require('path');
const request = require('request');

const imageUploadHost = 'localhost:1337';
const testImageLoad = process.env.TEST_IMAGE_LOAD === 'true';
// const imageUploadHost = "koala.mit.edu:1337"


export const uploadImagesFromFolder = async (folder, uploadedByUser_id) => {
  const filePath = path.join(__dirname, `testImages/${folder}`);
  const imageMetadataPromises = [];

  return new Promise((fsResolve, fsReject) => {
    fs.readdir(filePath, (err, items) => {
      if (err) {
        errorLog(err);
        fsReject(Error('Image folder not found'));
      }
      const finalItems = testImageLoad ? items.concat(items, items, items, items) : items;
      finalItems.forEach((item) => {
        debug(`Uploading image for ${folder}: ${item}`);
        const itemPath = path.join(__dirname, `testImages/${folder}/${item}`);
        const base64Image = fs.readFileSync(itemPath, { encoding: 'base64' });
        const newPromise = new Promise((resolve, reject) => {
          request.post(`http://${imageUploadHost}/upload_image`, {
            json: {
              image: base64Image,
            },
          }, (error, res, body) => {
            if (error) {
              errorLog(error);
              reject(error);
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
          const finalImageResult = imageResult;
          finalImageResult.uploadedByUser_id = uploadedByUser_id;
          imageMetadata.push(finalImageResult);
        });
        fsResolve(imageResults);
      }).catch((allImagesError) => {
        errorLog(allImagesError);
        fsReject(allImagesError);
      });
    });
  });
};
