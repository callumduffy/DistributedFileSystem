const http = require('http');
const git = require('nodegit');
const path = require('path');
const fs = require('fs');
const express = require('express');
const bodyParser = require('body-parser');
const querystring = require('querystring');
var request = require('request');
var formidable = require('formidable')
var util = require('util');

const managerNode = express();
const PORT_NUM = 3000;
managerNode.use(bodyParser.json());
managerNode.use(bodyParser.urlencoded({ extended: false }));

//gonna be the server that manages everything, client proxy if you will
//will connect to the nodes containing the files
//each node will just be a reader or a writer to a MySQL DB

//manager will also need to speak to the directory service
//this will allow the manager to know which server node each file is on

//will have to have some form of user interface to allow the client to communicate
//this will allow UL/DL of files, and also -> sign in
//this will be managed by the authentication server

//handler for initial setup of the server
//for when a client wants to sign in
managerNode.post('/login', (req,res) => {
	//will send get req to authentication server on whether to allow access to the client
	//if okay, will post on the UL/DL html file 
	var email_string = req.body.Email;
	var pword_string = req.body.Password;
	console.log('email: ' + email_string + ' pword: ' + pword_string);

	//auth server not set up yet
	request.post(
        'http://localhost:3004/login',
        { json: {
          email : email_string,
          password : pword_string
      } }, (error, response, body) => {
	  if(error){
	  	console.log('Error on login there pal.');
	  }
	  else if(response && response.body.status == 200){
	  	//allow log in
	  	//make res the UL/DL page
	  	res.send('Logged in.');
	  }
	  else{
	  	//no log in
	  	//make res the login page again
	  	res.send('Conn failed');
	  }

	});
});

managerNode.post('/register', (req,res) => {
	var email_string = req.body.Email;
	var pword_string = req.body.Password;
	console.log('email: ' + email_string + ' pword: ' + pword_string);

	request.post(
        'http://localhost:3004/register',
        { json: {
          email : email_string,
          password : pword_string
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
	  	res.send('Conn failed');
	  }

	});
})


//handler for when client wants to download a file
managerNode.get('/download', (req,res) => {
	//on DL, send get to dir service to get location of file @ 3005
	//get server ip of file back
	//send get to that server for file

});


//handler for when client wants to UL a file
managerNode.post('/upload', (req,res) => {
	//plan is to send name to dir service, if name doesnt exist, upload
	//else ask client for a new name

});

managerNode.listen(PORT_NUM, (err) => {
	if(err){
		return console.log('Manager cannot listen on port 3000.');
	}
	console.log('Manager listening on port 3000');
});