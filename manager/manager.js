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

//handler for initial setup of the server
//for when a client wants to sign in

managerNode.post('/login', (req,res) => {
	console.log('got to login');
	var ticket_encrypted = req.body.ticket;
	var message_encrypted = req.body.message;
	//must decrypt the ticket with server key
	var ticket_bytes = CryptoJS.AES.decrypt(ticket_encrypted, serverKey);
	var session_key = ticket_bytes.toString(CryptoJS.enc.Utf8);
	//now use the sesh key to decrypt the message
	var message_bytes = CryptoJS.AES.decrypt(message_encrypted, session_key);
	var message = message_bytes.toString(CryptoJS.enc.Utf8);
	console.log(message);
	//now we send the index homepage for upload/download to the client
	//they can work from there, they are now logged in.
	if(message == 'login'){
		res.send({status:200, msg: 'how'});
	}
	else{
		console.log('login message incorrect');
		res.send({status:404, err_msg: 'login message incorrect'});
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
		var ip ;

		request.post(
			'http://localhost:3006/checkCache',
			{ json: {
				fileName: fileName
			}}, (error, response, body) =>{
				if(error){
					console.log('Couldnt communicate with cache');
				}
				else if(response.body.status ==200){
					console.log('Sent file from cache');
					res.status(200).download(response.body.path);
				}
				else{
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
			     				request.post(
						       		ip + '/download',
						       		{ json: {
						          		fileName : req.body.fileName,
						          		ip: client_ip
						     		} }, (error, response, body) => {
						    			if(error){
						    				res.send('Error communicating with file server')
						     			}
						     			else if (response.body.status == 200){
						     				console.log('file seems to have been sent');
						     				res.status(200).download(response.body.path);
						     			}
						     			else{
						     				res.status(404).send('File not found');
						     			}
						     	});
			     			}
			     			else{
			     				res.status(404).send('File not found');
			     			}
			     	});
				}
		});
		//poll directory service for the file
		//console.log(req.body.fileName);
		//now get the data from the file server
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
					    		//now we want to add the file to the cache
					    		var cacheReq = request.post('http://localhost:3006/addToCache', function (err, c_resp, bod) {
							  		if (err) {
							    		console.log('Error sending to cache');
							    		console.log(err.message);
							    		deleteTempFile(filePath);
							    		res.status(200).send('File Uploaded but error connecting to the cache.');
							  		} else (c_resp.body.status == 200){
							    		console.log('File added to cache');
							    		deleteTempFile(filePath);
							    		res.status(200).send('File Uploaded and Cached.');
							  		}
								});
								var cform = cacheReq.form();
								cform.append('file', fs.createReadStream(filePath));
								cform.append('fileName', fileName);
					  		}
						});
						var uform = fileReq.form();
						uform.append('file', fs.createReadStream(filePath));
						uform.append('fileName', fileName);
     				}
     				else{
     					res.send('File of same name already uploaded, please change the name or upload a different file.');
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

function deleteTempFile(filePath){
	fs.unlink(filePath, (err)=>{
		if(err){
			console.log('Error deleting temp file');
		}
		else{
			console.log('Temp file deleted');
		}
	});
}

managerNode.listen(PORT_NUM, (err) => {
	if(err){
		return console.log('Manager cannot listen on port 3000.');
	}
	console.log('Manager listening on port 3000');
});