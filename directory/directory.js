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

let db = new sqlite3.Database('directory.db', (err) => {
	if(err){
		return console.error(err.message);
	}
	console.log('Connected to the in-memory SQlite database.');
});
db.run("CREATE TABLE IF NOT EXISTS File_Directory (name TEXT PRIMARY KEY, server_ip TEXT NOT NULL)");

//handler for when manager wants to know where a file is
directoryNode.post('/download', (req,res) =>{
	var file_string = req.body.name;
	let sql = 'SELECT name fileName, server_ip ip FROM File_Directory WHERE name = ? ';

	db.get(sql, [file_string], (err, row) => {
		if(err){
			console.log(err.message);
			res.send('error, file doesnt exist');
		}
		else{
			console.log('Found file');
			res.json({ip: row.server_ip});
		}

	});

});


//handler for when the manager wants to upload a file
//will have to decide how to decide which node to send a file to
directoryNode('/upload', (req,res) =>{
	var file_string = req.body.name;
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