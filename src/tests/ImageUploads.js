const debug = require('debug')('dev:tests:ImageUpload');
const errorLog = require('debug')('error:ImageUpload');
const fs = require('fs');
const path = require('path');
const request = require('request');

const imageUploadURL = 'https://u6qoh0vm77.execute-api.us-east-1.amazonaws.com/default/imageCompressorUploader';

export const uploadImagesFromFolder = async (folder, uploadedByUser_id) => {
  const filePath = path.join(__dirname, `testImages/${folder}`);
  const imageMetadataPromises = [];

  return new Promise((fsResolve, fsReject) => {
    fs.readdir(filePath, (err, items) => {
      if (err) {
        errorLog(err);
        fsReject(Error('Image folder not found'));
      }
      let finalItems = items;
      if (process.env.TEST_IMAGE_LOAD && Number(process.env.TEST_IMAGE_LOAD)) {
        const numCopies = Number(process.env.TEST_IMAGE_LOAD);
        for (let i = 0; i < numCopies - 1; i += 1) {
          finalItems = finalItems.concat(items);
        }
      }
      if (process.env.SKIP_IMAGES === 'true') {
        finalItems = [];
      }
      debug(`Uploading images for ${folder}: ${finalItems.length} found`);
      finalItems.forEach((item) => {
        const itemPath = path.join(__dirname, `testImages/${folder}/${item}`);
        const base64Image = fs.readFileSync(itemPath, { encoding: 'base64' });
        const newPromise = new Promise((resolve, reject) => {
          request.post(imageUploadURL, {
            json: {
              image: base64Image,
              dev: 'True', // If key exists, uploads to dev-images bucket
            },
            headers: {
              'x-api-key': '3gIpimRUcE54l1Vmq4DL56eJVGUDiymf92TH9YBJ',
              'Content-Type': 'application/json',
            },
          }, (error, res, body) => {
            if (error) {
              errorLog(error);
              reject(error);
            }
            debug(`Finished uploading for ${folder}: ${item}`);
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
