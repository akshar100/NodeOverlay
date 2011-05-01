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
var r_table_pub = {};
var r_table_sub = {};
var profiles = myapp.profiles;
var port = myapp.port;
var myPort=port[me_name];

function console(obj)
{
	for(i in obj)
	{
		sys.puts(i+":"+obj[i]);
	}
}

function update_r_table(key,list,parent,type)
{
	
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
		r_table_pub[key] = children.slice(); 
	}
	if(parent)
	{
		if(type==="pub")
		{
			if(myParent!=="")
			{
				r_table_pub[key].push(myParent);
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

IAmRoot();
//sys.puts(myPort);
http.createServer(function(request, response) {
	var uri = url.parse(request.url).pathname; 
	var commands = uri.split("/");
	if(commands[1]==="admin_sub")
	{
		//sys.puts("Admin Sub"+commands[2]);
		var data = JSON.parse(unescape(commands[2]));
		//sys.puts(commands[2]);
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
	}
	response.end();
}).listen(myPort);