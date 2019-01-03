//var os = require('os');
//var commonModule = require(global.FRM_CONFIG.REAL_WEB_ROOT + '/Common');
//var logger = commonModule.logger(__filename);
 
 



var createSignalingChannel = function (key, handlers) {

    var id, status,
    doNothing = function () { },
    handlers = handlers || {},
    initHandler = function (h) {
      return ((typeof h === 'function') && h) || doNothing;
    },
    waitingHandler = initHandler(handlers.onWaiting),
    connectedHandler = initHandler(handlers.onConnected),
    messageHandler = initHandler(handlers.onMessage);

    var _socket;
    var _failureCB;
    function createSignal(req, params,bReq) {
      return { breq: bReq, signal: req, params: params };
    }

    
  // Set up connection with signaling server
  function connect(failureCB) {
      if(typeof failureCB == 'function')
      {
        _failureCB=failureCB;
      }
      else
      {
        _failureCB= function () { };
      }
     

    // Handle connection response, which should be error or status
    //  of "connected" or "waiting"
   
    // open XHR and send the connection request with the key
    var onOpen = function() {
      console.log("Socket opened and sent connect request");
      _socket=socket;
      _socket.send(JSON.stringify(createSignal('connect',{key:key},true)));
    },
   
    onMessage = function(data) {
      console.log("We get message:"+data);
      handler_rec(data.data);
    },
    onClose = function() {
      failureCB("Socket closed.");
    },
    onError = function() {
      failureCB("ws got an error.");
    },

    socket = new WebSocket("ws://10.1.7.86:5002/");
    socket.onopen = onOpen;
    socket.onclose = onClose;
    socket.onerror = onError;
    socket.onmessage = onMessage;
  }


  function handler_rec(data) {
    if (this.readyState == this.DONE) {
      if (data != null) 
      {
        var res = JSON.parse(data);
        if(res)
        {
          console.log("receve data "+ data);
        }
        else
        {
          console.log("receve data error "+data);
           return ;
        }

        if (res.signal == "connect") {
          
          
          if(res.breq)
          {
              status = "connected";
              connectedHandler();
          }
          else
          {
            // if no error, save status and server-generated id,
            // then start asynchronouse polling for messages
            id = res.params.id;
            status = res.params.status;
            //poll();

            // run user-provided handlers for waiting and connected
            // states
            if (status === "waiting") {
              waitingHandler();
            } else {
              connectedHandler();
            }
          }
        }
        else if (res.signal == "transmit") {
          handleMessage(res.params.message);
        }
      }
      else {
        _failureCB("HTTP error:  " + this.status);
        return;
      }
    }
  }


  
  // Schedule incoming messages for asynchronous handling.
  // This is used by getLoop() in poll().
  function handleMessage(msg) {   // process message asynchronously
    setTimeout(function () { messageHandler(msg); }, 0);
  }


  // Send a message to the other browser on the signaling channel
  function send(msg, responseHandler) {
    var reponseHandler = responseHandler || function () { };

    // parse response and send to handler
    function handler() {
      if (this.readyState == this.DONE) {
        if (this.status == 200 && this.response != null) {
          var res = JSON.parse(this.response);
          if (res.err) {
            responseHandler("error:  " + res.err);
            return;
          }
          responseHandler(res);
          return;
        } else {
          responseHandler("HTTP error:  " + this.status);
          return;
        }
      }
    }

    if(_socket)
    {
      var sendData = { "id": id, "message": msg };
      _socket.send(JSON.stringify(createSignal('transmit',sendData,true)));
    }
  }


  return {
    connect: connect,
    send: send
  };

};
