const http = require('http');
const path = require('path');
const fs = require('fs');
const express = require('express');
const bodyParser = require('body-parser');
const querystring = require('querystring');
var request = require('request');
var CryptoJS = require("crypto-js");

var clientNode = express();
clientNode.use(bodyParser.json());
clientNode.use(bodyParser.urlencoded({ extended: true }));

var pword = process.argv[2];
var ip = process.argv[3];
var sesh = process.argv[4];
var ticket_string = process.argv[5];

//decrypt the ip_and sesh key with the args values
var ip_bytes = CryptoJS.AES.decrypt(ip, pword);
var server_ip = ip_bytes.toString(CryptoJS.enc.Utf8);
console.log('IP: '+ server_ip);

var sesh_bytes = CryptoJS.AES.decrypt(sesh, pword);
var session_key = sesh_bytes.toString(CryptoJS.enc.Utf8);
console.log('SK: '+ session_key);

//create encrypted msg
var s = 'login';
var msg = CryptoJS.AES.encrypt(s, session_key).toString();

//create request and send it to the proxy
//get response of a token
request.post(
        'http://localhost:3000/login',
        { json: {
          ticket : ticket_string,
          message : msg
      } }, (error, response, body) => {
	  if(error){
	  	console.log('Error on register there pal.');
	  }
	  else if(response && response.body.status == 200){
	  	//allow register
	  	//make res the UL/DL page
	  	res.send('Registered');
	  }
	  else{
	  	//no log in
	  	//make res the login page again
	  	//res.send('Conn failed');
	  	console.log('well');
	  }

	});