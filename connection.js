
var Connection = function(socket){
	this.listeners = {};
	this.responses = {};
	this.id = 0;
	
	this.socket = socket;
	var self = this;
	this.socket.on("message", function(message){
		self.receive(message);
	});
};

Connection.prototype = {
	addListener: function(key, listener){
		this.listeners[key] = listener;
	},
	
	send: function(key, param, handler){
		var meta = {
			param: param,
			key: key,
			type: "req",
			id: this.id
		};
		this.responses[this.id] = handler;
		console.log("send: " + JSON.stringify(meta));
		this.socket.send(JSON.stringify(meta));
		this.id++;
	},
	
	receive: function(message){
		var obj = JSON.parse(message);
		console.log("received: " + message);
		if(obj.type === undefined || obj.id === undefined){
			console.error("received broken packet: " + message + " - Required field missing");
			return;
		}
		
		if(obj.type == "req" && obj.key !== undefined ){
			var listener = this.listeners[obj.key];
			if(listener !== undefined){
				var ans = listener(obj.param);
				var answer = {
					id: obj.id,
					type: "res",
					param: ans
				};
				this.socket.send(JSON.stringify(answer));
			}
		}
		else if(obj.type == "res"){
			var handler = this.responses[obj.id];
			if(handler !== undefined){
				handler(obj.param);
				this.responses[obj.id] = undefined;
			}
		}
		else{
			console.error("received broken packet: " + message + " - Invalid type");
			return;
		}
	}
};

module.exports = Connection;