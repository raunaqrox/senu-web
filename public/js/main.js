$(document).ready(function(){
	var socket = null;
	var disconnected = false;
	var myId;
	
	function init(){
		socket = io();
		addEventHandlers();
	}

	function setStatus(status){
		$('#status').text(status);
	}

	function addEventHandlers(){
		// before close of tab ask if sure
		window.addEventListener("beforeunload", function (e) {
			if(!disconnected){
				var confirmationMessage = "Are you sure?";
				(e || window.event).returnValue = confirmationMessage; //Gecko + IE
				 return confirmationMessage;                      //Webkit, Safari, Chrome
				
			}
		});
		// on close of tab
		$( window ).unload(function() {
			if(!disconnected)
  				socket.emit("disconnect");
		});
		// on click of disconnect
		$( '#disconnect').click(function(){
			if(!disconnected)
				socket.disconnect();
			disconnected = true;
			setStatus("Disconnected");
		});
	}

	function OpenInNewTab(url) {
		try{
			var win = window.open(url, '_blank');
			win.focus();
		}catch(e){
			console.log("did not open");
			$('#openUrl').attr("onClick","window.open('"+url+"','_blank');")
			$('#openUrl').click(function(){
				console.log("this is called");
			});
		}
	}
	
	init();

	socket.on("connection", function(data){
		
	});

	socket.on("id", function(id){
		myId = id;
		console.log("got id " + myId);
		socket.emit("gotId");
	});

	socket.on("joint", function(){
		disconnected = false;
		console.log("joint");
		$('#status').text("Connected");
		myId = $('#myId').text();
		socket.emit("gotId", myId);
		setStatus("Joint");
	});

	socket.on("bothConnected", function(){

	});

	socket.on("openUrl", function(url){		
		OpenInNewTab(url);
	});

	socket.on("error", function(data){
		alert(data);
	});

	socket.on("disconnected", function(data){
		disconnected = true;
		socket.emit("disconnect");
		$('#status').text("Disconnected");
	});
});
