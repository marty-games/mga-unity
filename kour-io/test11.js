const RELAY_WSS = "wss://relay-lx0q.onrender.com/intercept";

(function(){
  if (window.__exitgames_ws_proxy_installed) return;
  window.__exitgames_ws_proxy_installed = true;

  const NativeWebSocket = window.WebSocket;
  const stubs = new Map();
  let nextConnId = 1;
  let relay = null;
  let relayReady = false;
  const pendingQueue = [];

  function connectRelay() {
    relay = new NativeWebSocket(RELAY_WSS);
    relay.binaryType = "arraybuffer";

    relay.addEventListener("open", () => {
      relayReady = true;
      while (pendingQueue.length) relay.send(JSON.stringify(pendingQueue.shift()));
      console.log("[proxy-client] relay connected");
    });

    relay.addEventListener("message", (ev) => {
      let msg;
      try { msg = JSON.parse(ev.data); } catch(e){ return; }
      const stub = stubs.get(msg.connId);
      if (!stub) return;

      if (msg.type === "message") {
        const data = msg.isBinary 
          ? Uint8Array.from(atob(msg.payload), c => c.charCodeAt(0)).buffer 
          : msg.payload;
        stub.onmessage && stub.onmessage({ data });
      } else if (msg.type === "open") stub.onopen && stub.onopen({ target: stub });
      else if (msg.type === "close") stub.onclose && stub.onclose({ code: msg.code, reason: msg.reason });
      else if (msg.type === "error") stub.onerror && stub.onerror({ message: msg.message });
    });

    relay.addEventListener("close", () => { 
      relayReady = false; 
      relay = null; 
      console.warn("[proxy-client] relay closed"); 
    });

    relay.addEventListener("error", (e) => console.error("[proxy-client] relay error", e));
  }

  function sendRelay(msg) {
    if (!relay) connectRelay();
    if (relayReady) relay.send(JSON.stringify(msg));
    else pendingQueue.push(msg);
  }

  function genConnId(){ return "c"+(nextConnId++); }

  // Override WebSocket
  window.WebSocket = function(url, protocols){
    if (!/exitgames\.com/.test(url)) {
      return protocols === undefined ? new NativeWebSocket(url) : new NativeWebSocket(url, protocols);
    }

    const connId = genConnId();
    const stub = { 
      _connId: connId, 
      onopen:null, onmessage:null, onclose:null, onerror:null,
      binaryType: "arraybuffer",
      readyState: 0 // CONNECTING
    };

    stub.send = (msg) => sendRelay({ 
      type:"send", 
      connId, 
      isBinary: msg instanceof ArrayBuffer, 
      payload: msg instanceof ArrayBuffer 
        ? btoa(String.fromCharCode(...new Uint8Array(msg))) 
        : msg 
    });

    stub.close = (code, reason) => {
      sendRelay({ type:"close", connId, code, reason });
      stub.readyState = 3; // CLOSED
    };

    stubs.set(connId, stub);
    sendRelay({ type:"open", connId, target:url, protocols });

    return stub;
  };

  console.log("[proxy-client] installed lazy ExitGames WS proxy");
})();
