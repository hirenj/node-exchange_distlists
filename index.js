#!/usr/bin/env node
'use strict';

const EWS = require('node-ews');
const keytar = require('keytar');
const nconf = require('nconf');

nconf.env().argv();


let email = nconf.get('username');

let listnames = nconf.get('list');

if ( ! email && ! listnames ) {
  console.log("Usage: groupgetter --username abc123@emailaddress --list list1@emailaddress --list list2@emailaddress");
  process.exit(1);
}

let base_host = email.split('@')[1];

let has_password = keytar.getPassword('eduroam',`${email}`);

has_password.then( password => { if ( ! password ) throw new Error('No password found'); return password; })
.then( password => {
  // exchange server connection info 
  let ewsConfig = {
    username: email,
    password: password,
    host: `https://webmail.${base_host}`,
    auth: 'basic'
  };
  let options = {
   auth: { user: ewsConfig.username, pass: ewsConfig.password, sendImmediately: true }
  };
 
  // initialize node-ews 
  let ews = new EWS(ewsConfig,options);
   
  // define ews api function 
  let ewsFunction = 'ExpandDL';
  let all_results = listnames.map( dist_list => {
    // define ews api function args 
    let ewsArgs = {
      'Mailbox': {
        'EmailAddress':dist_list
      }
    };
 
    // query EWS and print resulting JSON to console 
    return ews.run(ewsFunction, ewsArgs)
      .then(result => {
        return result.ResponseMessages.ExpandDLResponseMessage.DLExpansion.Mailbox.map( box => box.EmailAddress );
      });
  });
  return Promise.all(all_results);
}).then( emails => {
  console.log(JSON.stringify(emails));
}).catch( err => {
  console.log(err);
  process.exit(1);
});
 


