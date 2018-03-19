'use strict';

// Load required modules
const AWS = require('aws-sdk/global');
const SSM = require('aws-sdk/clients/ssm');

/**
 * Loads secrets from Amazon AWS Parameters Store
 * and adds them as environment variables
 *
 * @param {object} secretsRequest
 * @return {object}
 */
module.exports = function(secretsRequest) {

  /*
  * Use this variable as a flag to tell the event
  * loop blocker that the processing is done
  */
  let isProcessDone = false;
  const secretsLoaded = {};

  // Initiate an AWS connection
  AWS.config.update({
    region: secretsRequest.regions[0],
    credentials: new AWS.Credentials(
      secretsRequest.accessKeyId,
      secretsRequest.secretKey
    )
  });

  // Initiate a SSM instance
  const AwsSSM = new SSM({
    region: secretsRequest.regions[0],
  });

  // Request secrets from AWS
  AwsSSM.getParameters({
    Names: secretsRequest.names,
    WithDecryption: true
  }, (error, secrets) => {

    // If secret found
    if (!error && secrets && secrets.Parameters) {

      // Iterate all secrets returned
      for(let secret of secrets.Parameters) {

        // Add secret to environment
        process.env[secret.Name] = secret.Value;

        // Add secret to an output arra
        secretsLoaded[secret.Name] = secret.Value;
      }

      // Let the event loop blocker know that the process is complete!
      isProcessDone = true;
    }
  })

  // Wait until the process is complete
  require('deasync').loopWhile(() => !isProcessDone);

  // Return the secrets
  return secretsLoaded;
};
