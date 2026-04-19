const WebSocket = require("ws");
const http = require("http");

const server = http.createServer();
const wss = new WebSocket.Server({ server });

const PORT = process.env.PORT || 10000;

let players = {};

wss.on("connection", (ws) => {

    let id = null;

    ws.on("message", (msg) => {
        try{
            const data = JSON.parse(msg);

            if(data.type === "join"){
                id = data.id;
                players[id] = data.player;
            }

            if(data.type === "update" && id){
                players[id] = data.player;
            }

        }catch{}
    });

    ws.on("close", ()=>{
        if(id) delete players[id];
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

server.listen(PORT, ()=>console.log("running", PORT));
