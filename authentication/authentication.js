const http = require('http');
const git = require('nodegit');
const path = require('path');
const fs = require('fs');
const express = require('express');
const bodyParser = require('body-parser');
const querystring = require('querystring');
var request = require('request');

const authNode = express();
const PORT_NUM = 3004;
authNode.use(bodyParser.json());
authNode.use(bodyParser.urlencoded({ extended: true }));

//handler for when manager node tries to allow a client to log in
//should poll DB for login details
authNode.post('/login', (req,res) => {
	console.log('Received login request.');
	var email_string = req.body.email;
	var pword_string = req.body.pword;
	var status = true;

	//create mySQLlite query to check Db for user, and get their priviledge level
	//will need to encrypt data
	if(status){
		res.json({status: 200});
	}
});

authNode.listen(PORT_NUM, (err) => {
	if(err){
		return console.log('Authentication Server cannot listen on port 3004.');
	}
	console.log('Authentication Server listening on port 3004');
});