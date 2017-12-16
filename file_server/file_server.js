const http = require('http');
const path = require('path');
const fs = require('fs');
const express = require('express');
const bodyParser = require('body-parser');
const querystring = require('querystring');
var request = require('request');
var FormData = require('form-data');
const formidable = require('formidable');
var util = require('util');
var format = require('util').format;

const fileNode = express();
const PORT_NUM = process.argv[2];
fileNode.use(bodyParser.json());
fileNode.use(bodyParser.urlencoded({ extended: true }));

//handler for when the proxy sends server a file to store
fileNode.post('/upload', (req,res) => {
	console.log('made it here on UL');
	//will do once the download is done, should be able to handle files well then
	var form = new formidable.IncomingForm();
	form.uploadDir = path.join(__dirname,'/files');
	form.keepExtensions = true;
	 if (!form) {
      return res.send({ status:404, success: false, message: "No multipart/form-data detected."});
    }
	form.parse(req, function(err, fields, files) {
		console.log(fields.fileName);
		console.log(files.file.name);
		console.log(util.inspect({fields: fields, files: files}));
		res.send({status:200, msg: 'uploaded'});
	});
	form.on('fileBegin', function(name, file) {
		file.path = form.uploadDir + "/" + file.name;
	});
});

//handler for sending a file back to the proxy on receipt of a file name
fileNode.post('/download', (req,res) =>{
	var fileName = req.body.fileName;
	var client_ip = req.body.ip;
	var subpath = '/files/' + fileName;
	console.log('made it here on DL');
	if(!fileName){
		res.send({status:404,err:'Must contain a file name'});
	}
	else{
		var filePath = path.join(__dirname,subpath);
		if(!fs.existsSync(filePath)){
			res.send({status:404,err:'File is not on this server'});
		}
		else{
			console.log('File Found, ready to send');
			//res.send({status:200, msg: 'Downloaded'});
			//send path to proxy and sexy direct download link to client
			res.send({status:200, path:filePath});

			// var fileReq = request.post(client_ip, function (err, resp, bod) {
			// 	if (err) {
			// 		console.log(err.message);
			// 		} 
			// 	else {
			// 		console.log('File sent to client');
			// 	}
			// });
			// var form = fileReq.form();
			// form.append('file', fs.createReadStream(filePath));
			// form.append('fileName', fileName);

			// res.append('file', fs.createReadStream(filePath));
			// res.append('fileName', fileName);
			// res.attachment(filePath);
			// res.sendFile(filePath);
		}
	}
});

fileNode.listen(PORT_NUM, (err) => {
	if(err){
		return console.log('File Server cannot listen on port: '+ PORT_NUM);
	}
	console.log('File Server listening on port: ' + PORT_NUM);
});