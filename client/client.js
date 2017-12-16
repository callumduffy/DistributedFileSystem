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
const PORT_NUM = 3006;

clientNode.get('/', (req,res) =>{
	//to start up the File system, send Login page
	res.sendFile(path.join(__dirname,'index.html'));
});

clientNode.post('/login', (req,res) =>{
	if(!req.body){
		console.log('Error, not token received.');
	}
	else{
		var token = req.body.token;
		var ip = token.ip_key;
		var sesh = token.sesh_key;
		var ticket_string = token.ticket;
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
			  	console.log('Error connecting to the Proxy for login');
			  }
			  else if(response && response.body.status == 200){
			  	//now send response to the AS to say we are logged in
			  	console.log(response.body.msg);
			  	res.send({status:200});
			  }
			  else{
			  	//tell AS that login failed
			  	res.send({status:404, err: response.body.err_msg});
			  }
		});
	}
});

clientNode.listen(PORT_NUM, (err) => {
	if(err){
		return console.log('Client cannot listen on port: '+ PORT_NUM);
	}
	console.log('Client listening on port: ' + PORT_NUM);
});