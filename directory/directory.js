const http = require('http');
const git = require('nodegit');
const path = require('path');
const fs = require('fs');
const express = require('express');
const bodyParser = require('body-parser');
const querystring = require('querystring');
const sqlite3 = require('sqlite3').verbose();
var request = require('request');

const directoryNode = express();
const PORT_NUM = 3005;
directoryNode.use(bodyParser.json());
directoryNode.use(bodyParser.urlencoded({ extended: true }));

//first need to initialise the DB	
let db = new sqlite3.Database('directory.db', (err) => {
	if(err){
		return console.error(err.message);
	}
	console.log('Connected to the in-memory SQlite database.');
});
db.run("CREATE TABLE IF NOT EXISTS users (email TEXT PRIMARY KEY, password TEXT NOT NULL)");

directoryNode.get('/login', (req,res) =>{
	//making simple log in first, then adding auth
	if (!req.body.email || !req.body.password) {
    	return res.send(400);
  	}

});


directoryNode.listen(PORT_NUM, (err) => {
	if(err){
		return console.log('Directory cannot listen on port: ' + PORT_NUM);
	}
	console.log('Directory listening on port: ' + PORT_NUM);
});

// db.close((err) => {
//   if (err) {
//     return console.error(err.message);
//   }
//   console.log('Close the database connection.');
// });