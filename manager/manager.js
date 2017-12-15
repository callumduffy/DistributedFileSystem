const http = require('http');
const git = require('nodegit');
const path = require('path');
const fs = require('fs');
const express = require('express');
const bodyParser = require('body-parser');
const querystring = require('querystring');
var CryptoJS = require("crypto-js");
var request = require('request');
var util = require('util');
var FormData = require('form-data');
const formidable = require('formidable');
var format = require('util').format;

const serverKey = 'encryption';
const managerNode = express();
const PORT_NUM = 3000;
managerNode.use(bodyParser.json());
managerNode.use(bodyParser.urlencoded({ extended: true }));

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
	var ticket_encrypted = req.body.ticket;
	var message_encrypted = req.body.message;
	//must decrypt the ticket with server key
	var ticket_bytes = CryptoJS.AES.decrypt(ticket_encrypted, serverKey);
	var session_key = ticket_bytes.toString(CryptoJS.enc.Utf8);
	//now use the sesh key to decrypt the message
	var message_bytes = CryptoJS.AES.decrypt(message_encrypted, session_key);
	var message = message_bytes.toString(CryptoJS.enc.Utf8);
	//now we send the index homepage for upload/download to the client
	//they can work from there, they are now logged in.
	if(message == 'login'){
		console.log('Log in successful');
		res.sendFile('home.html', {root: __dirname });
		//add in a token too 
	}
});

managerNode.post('/register', (req,res) => {
	var email_string = req.body.ticket;
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
managerNode.post('/download', (req,res) => {
	if(req.body.fileName){
		var fileName = req.body.fileName;
		var ip = 'temp';
		//poll directory service for the file
		//console.log(req.body.fileName);
		request.post(
       		'http://localhost:3005/download',
       		{ json: {
          		fileName : req.body.fileName
     		} }, (error, response, body) => {
    			if(error){
    				res.send('Error communicating with directory service')
     			}
     			else if (response.body.status == 200){
     				ip = response.body.ip;
     				console.log('File Found on directory, is at IP: ' + ip);
     			}
     			else{
     				res.status(404).send('File not found');
     			}
     	});
		//now get the data from the file server
		request.post(
       		ip + '/download',
       		{ json: {
          		fileName : req.body.fileName
     		} }, (error, response, body) => {
    			if(error){
    				res.send('Error communicating with file server')
     			}
     			else if (response.body.status == 200){
     				//send file to client here
     				var form = new formidable.IncomingForm();
	 				if (!form) {
      					return res.status(400).send({ success: false, message: "No multipart/form-data detected."});
    				}
					form.parse(req, function(err, fields, files) {

					});
     			}
     			else{
     				res.status(404).send('File not found');
     			}
     	});
		res.status(200).send(response.body.ip);
	}
	else{
		res.status(404).send('Must enter a file name');
	}
});


//handler for when client wants to UL a file
managerNode.post('/upload', (req,res) => {
	//plan is to send name to dir service, if name doesnt exist, upload
	//else ask client for a new name
	var filePath;
	var ip;
	var fileName;

	//have to make sure to save the path of the temp file
	var form = new formidable.IncomingForm();
	form.uploadDir = path.join(__dirname,'/temp/files');
	form.keepExtensions = true;
	if (!form) {
      return res.status(400).send({ success: false, message: "No multipart/form-data detected."});
    }
	form.parse(req, function(err, fields, files) {

	     if(files.UploadFile){
			//res.send('Got file');
			filePath = files.UploadFile.path;
			fileName = files.UploadFile.name;
			//poll dir service to see where to send the file. then send it.
			request.post(
        		'http://localhost:3005/upload',
        		{ json: {
          			fileName : files.UploadFile.name,
          			ood : false
      			} }, (error, response, body) => {
     				if(error){
     					res.send('Error communicating with directory service')
     				}
     				else if (response.body.status == 200){
     					//send file to a node here
     					ip = response.body.ip;
     					var fileReq = request.post(ip + '/upload', function (err, resp, bod) {
					  		if (err) {
					    		console.log(err.message);
					    		res.status(404).send('Couldnt upload to server');
					  		} else {
					    		console.log(resp.body.msg);
					    		res.status(200).send('File Uploaded');
					  		}
						});
						var form = fileReq.form();
						form.append('file', fs.createReadStream(filePath));
						form.append('fileName', fileName);
     				}
     		});
		}
		else{//no file
			res.status(404).send('Must include a file');
		}
	});
	form.on('fileBegin', function(name, file) {
		file.path = form.uploadDir + "/" + file.name;
	});
});

managerNode.listen(PORT_NUM, (err) => {
	if(err){
		return console.log('Manager cannot listen on port 3000.');
	}
	console.log('Manager listening on port 3000');
});