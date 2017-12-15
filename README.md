# DistributedFileSystem
Distributed File System for Internet Applications module in Trinity College Dublin.

## Login  
Client initially must login, this is done by sending their email, and their encrypted password to the Authtication Server,
the server will then poll the DB for the email given to retrieve their password. They will then use this password to decrypt the password.
If all is correct, the client will then be sent a session key and the ip of the server they wish to talk to, encrypted with their password. And a ticket encrypted with the Secret, known only by the Proxy and the Authentication Server.  
  
From here the client will decrypt the ip and the session key with their password, and use the session key to encrypt their login message to the proxy. They will send this along with the ticket.  
The Proxy will use the Secret to decrypt the ticket, to get the session key and then use that to decrypt the message, if everything is correct the the client will be allowed to log in to the system.  
  
## UL/DL  
The client will then be led to the home page, to allow them to access the features of the distributed transparent file system. This will allow them to upload and download files.
When the proxy receives a request to upload it will poll the Directory server to see if the file exists, if not, it will add it to the directory and then the directory will give it an IP of a node to store the data.
The proxy will send the file there for distributed storage.  
On download, the client enters a human-readable file name, and from there the proxy sends this to the 
directory server, who finds the ip of where the file is stored, if stored. If found, it will send the proxy
the IP of the node containing the file, the proxy will request the file and then post it back to the user.  
