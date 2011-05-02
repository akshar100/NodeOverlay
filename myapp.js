var port={"india":8081, "america":8082,"root":8080,"mumbai":8083,"pune":8084,"ny":8085,"ca":8086};
var profiles= [{
	name:"iitb",
	key:'key1',
	pubs:["root.india.mumbai"],
	subs:["root.india.mumbai","root.india.pune","root.america.ny"]
}
];

exports.port = port;
exports.profiles = profiles;