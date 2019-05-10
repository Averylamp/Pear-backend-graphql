import { UPDATE_DISPLAYED_PHOTOS } from '../Mutations';
import { verbose } from '../../constants';
import {
  createDetachedProfiles,
  viewDetachedProfiles,
} from '../CreateTestDB';
import { checkForAndLogErrors } from '../Utils';
import { uploadImagesFromFolder } from '../ImageUploads';

const debug = require('debug')('tests:UpdateUserImagesTest');
const testLogger = require('debug')('tests:UpdateUserImagesTest');
const verboseDebug = require('debug')('tests:verbose:UpdateUserImagesTest');
const errorLogger = require('debug')('error:UpdateUserImagesTest');

const chalk = require('chalk');

const testCaseStyling = chalk.yellow.bold;
const successStyling = chalk.rgb(75, 255, 67).bold;
const errorStyling = chalk.red.bold;

const errorLog = log => errorLogger(errorStyling(log));
const testLog = log => testLogger(testCaseStyling(log));
const successLog = log => testLogger(successStyling(log));

export const runUpdateUserImagesTest = async (mutate) => {
  testLog('TESTING: Uploading Images');

  const uploadDetachedProfileImages = [];
  for (const detachedProfileVars of createDetachedProfiles) {
    const detachedProfileFirstName = detachedProfileVars
      .detachedProfileInput.firstName.toLowerCase();
    const creatorID = detachedProfileVars.detachedProfileInput.creatorUser_id;
    uploadDetachedProfileImages.push(
      uploadImagesFromFolder(detachedProfileFirstName, creatorID),
    );
  }

  const timerStart = process.hrtime();
  const uploadImagesResults = await Promise.all(uploadDetachedProfileImages)
    .catch((err) => {
      errorLog(`${err}`);
      process.exit(1);
    });
  if (verbose) uploadImagesResults.forEach((result) => { verboseDebug(result); });
  successLog('***** Success Uploading Images *****\n');
  let imageCount = 0;
  let imageErrorCount = 0;
  uploadImagesResults.forEach((result) => {
    imageCount += result.length;
    result.forEach((imageResult) => {
      if (!imageResult.imageID) {
        errorLog('Image not uploaded properly');
        errorLog(imageResult);
        imageErrorCount += 1;
      }
    });
  });
  debug(`Finished Uploading ${imageCount} Images in ${process.hrtime(timerStart)[0]}s`);
  if (imageErrorCount > 0) {
    errorLog((`ERROR UPLOADING ${imageErrorCount} Images`));
    process.exit(1);
  }

  testLog('TESTING: Updating User Images');
  for (let i = 0; i < createDetachedProfiles.length; i += 1) {
    const viewProfileVars = viewDetachedProfiles[i];
    // this looping works since createDetachedProfiles, uploadImageResults, and
    // viewDetachedProfiles are parallel arrays
    try {
      const addPhotosVariables = {
        updateUserPhotosInput: {
          user_id: viewProfileVars.user_id,
          displayedImages: uploadImagesResults[i],
          additionalImages: uploadImagesResults[i],
        },
      };
      const result = await mutate({
        mutation: UPDATE_DISPLAYED_PHOTOS,
        variables: addPhotosVariables,
      });
      if (verbose) {
        verboseDebug(result);
      }
      checkForAndLogErrors(result, 'updateUserPhotos');
    } catch (e) {
      errorLog((`${e}`));
      process.exit(1);
    }
  }

  successLog('***** Success Updating User Images *****\n');
};
