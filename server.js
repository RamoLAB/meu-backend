const WebSocket = require("ws");

const wss = new WebSocket.Server({ port: 3000 });

let players = {};

wss.on("connection", (ws) => {

    const id = Math.random().toString(36).substr(2, 9);

    players[id] = {};

    ws.send(JSON.stringify({ type:"init", id }));

    ws.on("message", (msg) => {
        try{
            const data = JSON.parse(msg);

            if(data.type==="update"){
                players[id] = data.player;
            }
        }catch{}
    });

    ws.on("close", ()=>{
        delete players[id];
    });
});

setInterval(()=>{
    const payload = JSON.stringify({
        type:"state",
        players
    });

    wss.clients.forEach(c=>{
        if(c.readyState===1) c.send(payload);
    });

},50);

console.log("rodando na 3000");
