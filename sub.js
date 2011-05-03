var sys = require("sys"),http = require("http"),url = require("url"),path = require("path"),fs = require("fs"),myapp=require("./myapp");    
var args = process.argv.splice(2);
//argv[0] = subscriber id
//argv[1] = subscriber port
//argv[2] =Key
//argv[3] = Broker ID
var port = args[1];
var my_name = args[0];
var key = args[2];
var broker = args[3];
var ports = myapp.port;

var filter = "function(content){ if(content.length>1) {return true;}};";

function subscribe(){

	var data ={
		port:port,
		my_name:my_name,
		key:key,
		broker:broker,
		filter:filter
	};
	try{
	
		var site = http.createClient(ports[broker], "e-yantra.org");
		var req = site.request("GET", "/subscribe/"+escape(JSON.stringify(data)), {'host' : "e-yantra.org"});
			req.on('response', function(resp) {
					
			});
		req.end();
	}catch(ex){sys.puts("error occured"+ex);}
		
}
subscribe();

http.createServer(function(request, response) {
	var uri = url.parse(request.url).pathname; 
	var commands = uri.split("/");
	if(commands[1]==="notify")
	{
		
		var data = JSON.parse(unescape(commands[2]));
	
		sys.puts(my_name+" received notification :"+data.item);
	}
	

	response.end();
}).listen(port);

