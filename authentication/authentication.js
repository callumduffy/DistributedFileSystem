const http = require('http');
const git = require('nodegit');
const path = require('path');
const fs = require('fs');
const express = require('express');
const bodyParser = require('body-parser');
const querystring = require('querystring');
const sqlite3 = require('sqlite3').verbose();
var CryptoJS = require("crypto-js");
var request = require('request');

const serverKey = 'encryption';
const authNode = express();
const PORT_NUM = 3004;
var server_ip = 'http://localhost:3000';
authNode.use(bodyParser.json());
authNode.use(bodyParser.urlencoded({ extended: true }));

//first need to initialise the DB	
let db = new sqlite3.Database('directory.db', (err) => {
	if(err){
		return console.error(err.message);
	}
	console.log('Connected to the in-memory SQlite database.');
});
db.run("CREATE TABLE IF NOT EXISTS Users (Email TEXT PRIMARY KEY, Password TEXT NOT NULL)");

//handler for when manager node tries to allow a client to log in
//should poll DB for login details
authNode.post('/login', (req,res) => {
	console.log('Received login request.');
	var email_string = req.body.Email;
	var pword_encrypted = req.body.Password;
	console.log(pword_encrypted);
	var session_key = 'random_key';
	var login_key = 'login';

	let sql = 'SELECT Email email, Password password FROM users WHERE email = ? ';

	db.get(sql, [email_string], (err, row) => {
		console.log(row.password);
		var bytes  = CryptoJS.AES.decrypt(pword_encrypted.toString(), row.password);
		var pword_decrypted = bytes.toString(CryptoJS.enc.Utf8);
		//get pword and decypt users pword with it
	    if(pword_decrypted == row.password){
	    	console.log('Password decrypted successfully');
	    	//res.send('deciphered');
	    	//now to encrypt the (ticket, server ip, and the session key) = token -> encryped with pword
	    	//(session key) = ticket -> encrypted with server encryption key
	    	var ticket = CryptoJS.AES.encrypt(session_key, serverKey).toString();
	    	var ip_key = CryptoJS.AES.encrypt(server_ip, pword_decrypted).toString();
	    	var sesh_key = CryptoJS.AES.encrypt(session_key, pword_decrypted).toString();
	    	var token = {ticket: ticket, ip_key: ip_key, sesh_key: sesh_key};
	    	//send encrypted data
	    	//now send to client server, then post info back to browser
	    	request.post('http://localhost:3006/login', 
	    	{json:{
	    		token: token
	    	}}, (error, response, body) =>{
	    		//handle data back from client server here
	    		if(error){
	    			console.log('Error communicating with the Client for login - Err: ' + error.message);
	    		}
	    		else if(response.body.status ==200){
	    			res.status(200).sendFile(path.join(__dirname,'home.html'));
	    		}
	    		else{
	    			res.status(404).send('Login process failed.')
	    		}
	    	});
	    }
	    else if(err){
	    	console.log(err.message);
	    }
	    else{
	    	res.send('error');
	    }
	});
});

//register is only used for adding details atm, not implemented properly
authNode.post('/register', (req,res) =>{
	console.log('Received register request.');
	var email_string = req.body.email;
	var pword_string = req.body.password;
	console.log('email: ' + email_string + ' pword: ' + pword_string);

	//insert to the table, if exists
	let sql = 'INSERT INTO Users VALUES(?,?)';
	db.run(sql, [email_string,pword_string], (err) =>{
		if(err){
			console.log(err.message);
			res.json({status:404});
		}
		else{
			console.log('inserted');
			res.json({status:200});
		}
	});
})

authNode.listen(PORT_NUM, (err) => {
	if(err){
		return console.log('Authentication Server cannot listen on port: ' + PORT_NUM);
	}
	console.log('Authentication Server listening on port: ' + PORT_NUM);
});