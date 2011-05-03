var sys = require("sys"),http = require("http"),url = require("url"),path = require("path"),fs = require("fs"),myapp=require("./myapp");    
var args = process.argv.splice(2);

var me= args[0]; //the name of the node like root.india
var me_name=me.split(".").pop();
if(me_name==="root")
{
	var myParent="";
}
else
{
	var arr = me.split(".");	
	var myParent=arr[arr.length-2];
}
var r_table_pub = {}; //A table that returns True of False for a given key. If true only then the broker accepts published event
var r_table_sub = {}; //A table that returns a set of brokers to whom the event should be forwarded
var subscription= {};//A table that returns True of False for a given key. If true only then the broker accepts subscriber requests.
var profiles = myapp.profiles;
var port = myapp.port;
var myPort=port[me_name];
var subscriber_list={};

function console(obj)
{
	for(i in obj)
	{
		sys.puts(i+":"+obj[i]);
	}
}

function update_r_table(key,list,parent,type)
{
	if(type==="pub")
	{
		if(list.indexOf(me)>-1)
		{
			r_table_pub[key] = true ; 
		}
	}
	if(type==="sub")
	{
		if(list.indexOf(me)>-1)
		{
			subscription[key] = true ; 
		}
	}
	if(parent==undefined || !parent)
	{
		parent= false; 
	}
	var children = max_unique_children(me,list);
	if(type==="sub")
	{
		r_table_sub[key] = children.slice(); 
	}
	else
	{
		//r_table_pub[key] = children.slice(); 
	}
	if(parent)
	{
		if(type==="pub")
		{
			if(myParent!=="")
			{
				//r_table_pub[key].push(myParent);
			}
		}
		else
		{	
			if(myParent!=="")
			{
				r_table_sub[key].push(myParent);
			}
		}
		
	}
	var i=0;
	
	for(i=0;i<children.length;i++)
	{
		
		
		if(children.length>1){ parent = true;  } 
		var data ={key:key,list:list,parent:parent,type:type};
		var site = http.createClient(port[children[i]], "e-yantra.org");
		try{
			sys.puts("Asking "+me+"'s children to update "+children[i]);
			var req = site.request("GET", "/admin_"+type+"/"+escape(JSON.stringify(data)), {'host' : "e-yantra.org"});
				req.on('response', function(resp) {
						
				});
				req.end();
		}catch(ex){}
		
		
	}
	
}
function max_unique_children(me,list)
{
	var count = [];
	var i=0;
	var explode =[];
	var depth = me.split(".").length-1;
	for(i=0;i<list.length;i++)
	{
		explode.push(list[i].split("."));
	}
	for(i=0;i<explode.length;i++)
	{
		if(explode[i].length-1<=depth) { continue; } 
		if(explode[i][depth]===me_name && (explode[i][depth+1]!=undefined || explode[i][depth+1]!=null))
		{
			if(explode[i][depth+1]!==true)
			{
				
				count.push(explode[i][depth+1] );
			}
		}
	}
	if(count.length>0)
	{
		count = unique(count);
	}
	return count;
	
}

function unique(arrayName)
{
	var newArray=new Array();
	label:for(var i=0; i<arrayName.length;i++ )
	{  
		for(var j=0; j<newArray.length;j++ )
		{
			if(newArray[j]==arrayName[i]) 
				continue label;
		}
		newArray[newArray.length] = arrayName[i];
	}
	return newArray;
}

function IAmRoot()
{
	if(me==="root")
	{
		var i=0;
		for(i=0;i<profiles.length;i++)
		{
			update_r_table(profiles[i].key,profiles[i].subs,false,"sub");
			update_r_table(profiles[i].key,profiles[i].pubs,false,"pub");
			
		}
	}
}
function propogate_event(data)
{
	var children = r_table_sub[data.key];
	var i=0;
	for(i=0;i<children.length;i++)
	{
		var site = http.createClient(port[children[i]], "e-yantra.org");
		var req = site.request("GET", "/push/"+escape(JSON.stringify(data)), {'host' : "e-yantra.org"});
					req.on('response', function(resp) {
							
					});
					req.end();
	}
}

function receive_event(data)
{
	var forward_to = r_table_sub[data.key];
	if(forward_to.indexOf(data.current_forwarder)>-1)
	{
		forward_to.splice(forward_to.indexOf(data.current_forwarder),1); //delete the orginator;
	}
	data.current_forwarder = me_name;
	propogate_event(data);
	sys.puts("Broker "+me_name+" got the event.");
	
	if(subscription[data.key]!=="undefined" && subscription[data.key])
	{
		if(subscriber_list)
		{
			var i=0;
			for(i in subscriber_list)
			{
				
				var sub = subscriber_list[i];
				
				if(sub.filter)
				{
					sys.puts(sub.filter);
					var filter;
					eval("filter="+sub.filter);
					if(filter(data.item))
					{
						var site = http.createClient(sub.port, "e-yantra.org");
						var req = site.request("GET", "/notify/"+escape(JSON.stringify(data)), {'host' : "e-yantra.org"});
							req.on('response', function(resp) {
									
							});
						req.end();
						sys.puts("Forwarding to subscriber "+i);
					}
				}
				
			}
		}
	}
}

function add_subscriber(data)
{
	sys.puts("Subscriber is added to "+me_name);
	subscriber_list[data.my_name] = data;
}

IAmRoot();
//sys.puts(myPort);
http.createServer(function(request, response) {
	var uri = url.parse(request.url).pathname; 
	var commands = uri.split("/");
	if(commands[1]==="admin_sub")
	{
		
		var data = JSON.parse(unescape(commands[2]));
		update_r_table(data.key,data.list,data.parent,data.type);
		console(r_table_pub);
	}
	if(commands[1]==="admin_pub")
	{
		//sys.puts("Admin Pub"+commands[2]);
		var data = JSON.parse(unescape(commands[2]));
		//sys.puts(commands[2]);
		update_r_table(data.key,data.list,data.parent,data.type);
		console(r_table_pub);
	}
	if(commands[1]==="status")
	{
		sys.puts("Routing table of "+me);
		sys.puts("Sub "+JSON.stringify(r_table_sub));
		sys.puts("Pub "+JSON.stringify(r_table_pub));
		sys.puts("################");
	}
	if(commands[1]==="publish")
	{
		var key = commands[2];
		var item = commands[3]; 
		if(r_table_pub[key]!="undefined" && r_table_pub[key])
		{
			var data = {
				key:key,
				item:item,
				origin:me_name,
				current_forwarder:me_name
				
			};
			//propogate_event(data); 
			
			receive_event(data);
		}
		else
		{
			response.write("Cant publish. You dont have permission to publish from this node. ");
		}
	}
	if(commands[1]==="push")
	{
		var data =JSON.parse(unescape(commands[2]));
		receive_event(data);
	}
	
	if(commands[1]==="subscribe")
	{
		var data =JSON.parse(unescape(commands[2]));
		add_subscriber(data);
	}
	
	response.end();
}).listen(myPort);