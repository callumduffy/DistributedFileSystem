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
var nodes = ['http://localhost:3001','http://localhost:3002','http://localhost:3003'];
directoryNode.use(bodyParser.json());
directoryNode.use(bodyParser.urlencoded({ extended: true }));

let db = new sqlite3.Database('directory.db', (err) => {
	if(err){
		return console.error(err.message);
	}
	console.log('Connected to the in-memory SQlite database.');
});
db.run("CREATE TABLE IF NOT EXISTS File_Directory (name TEXT PRIMARY KEY, server_ip TEXT NOT NULL)");

//handler to show the client the files on the server
directoryNode.get('/getFiles', (req,res) =>{
	var htmlcontent = '<p>';
	db.all("SELECT * FROM File_Directory", function(err, rows) {  
    rows.forEach(function (row) {  
        htmlcontent += row.name + ', ';
    });
    htmlcontent += '<br/>PRESS BACK TO RETURN TO HOME PAGE.';

    res.send(htmlcontent);  
});
});

//handler for when manager wants to know where a file is
directoryNode.post('/download', (req,res) =>{
	var file_string = req.body.fileName;
	console.log(file_string);
	let sql = 'SELECT name fileName, server_ip ip FROM File_Directory WHERE fileName = ? ';

	db.get(sql, [file_string], (err, row) => {
		if(err){
			console.log(err.message);
			console.log('error');
			res.send({status:400, msg:'Please change file name'});
		}
		else if(!row){
			res.json({msg:'Error: File doesnt exist', status: 404});
		}
		else{
			console.log('Found file');
			res.send({ip:row.ip, status:200});
		}

	});

});


//handler for when the manager wants to upload a file
//will have to decide how to decide which node to send a file to
directoryNode.post('/upload', (req,res) =>{
	var file_string = req.body.fileName;
	//random number between 0 and 2 for index
	var rand = Math.floor(Math.random()*(2-0+1)+0); 

	//insert to the table, if exists
	let sql = 'INSERT INTO File_Directory VALUES(?,?)';
	db.run(sql, [file_string,(nodes[rand])], (err) =>{
		if(err){
			console.log(err.message);
			res.send({status:404, error: err.message})
		}
		else{
			console.log('inserted');
			res.send({status:200, ip:nodes[rand]});
		}
	});
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