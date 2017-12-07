const http = require('http');
const git = require('nodegit');
const path = require('path');
const fs = require('fs');
const express = require('express');
const bodyParser = require('body-parser');
const querystring = require('querystring');
var request = require('request');

const managerNode = express();
const PORT_NUM = 3000;
managerNode.use(bodyParser.json());
managerNode.use(bodyParser.urlencoded({ extended: true }));

//gonna be the server that manages everything, client proxy if you will
//will connect to the nodes containing the files
//each node will just be a reader or a writer to a MySQL DB

//manager will also need to speak to the directory service
//this will allow the mager to know which server node each file is on

//will have to have some form of user interface to allow the client to communicate
//this will allow UL/DL of files, and also -> sign in
//this will be managed by the authentication server

//handler for initial setup of the server
//for when a client wants to sign in
managerNode.get('/login', (req,res) => {
	//will send get req to authentication server on whether to allow access to the client
	//if okay, will post on the UL/DL html file 
	var email_string = req.body.email;
	var pword_string = req.body.pword;

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


//handler for when client wants to download a file
managerNode.get('/download', (req,res) => {
	//on DL, post file name to dir service
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