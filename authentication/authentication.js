const http = require('http');
const git = require('nodegit');
const path = require('path');
const fs = require('fs');
const express = require('express');
const bodyParser = require('body-parser');
const querystring = require('querystring');
const sqlite3 = require('sqlite3').verbose();
var request = require('request');

const authNode = express();
const PORT_NUM = 3004;
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
	var email_string = req.body.email;
	var pword_string = req.body.password;

	let sql = 'SELECT Email email, Password password FROM users WHERE email = ? ';

	db.get(sql, [email_string], (err, row) => {
		console.log(row.password);
	    if(pword_string == row.password){
	    	console.log('found row');
	    	res.json({status:200, msg: 'logged in'});
	    }
	    else if(err){
	    	console.log(err.message);
	    }
	    else{
	    	res.send('error');
	    }
	});
});

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