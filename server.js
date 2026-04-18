const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const path = require("path");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Serve o index.html automaticamente
app.use(express.static(__dirname));

let players = {};

// Configuração da Arena (vinda do seu pedido anterior)
const WORLD = {
    startTime: Date.now(),
    duration: 60000,
    arenaStart: 1000,
    shrinkStep: 100,
    shrinkInterval: 10000
};

wss.on("connection", (ws) => {
    let playerId = null;

    ws.on("message", (msg) => {
        try {
            const data = JSON.parse(msg);
            if (data.type === "join") {
                playerId = data.id;
                players[playerId] = { x: 500, y: 100, angle: 0, color: data.color };
            }
            if (data.type === "move" && players[data.id]) {
                players[data.id].x = data.x;
                players[data.id].y = data.y;
                players[data.id].angle = data.angle;
            }
        } catch (e) {}
    });

    ws.on("close", () => {
        if (playerId) delete players[playerId];
    });
});

// Loop Global: Envia dados e calcula Arena
setInterval(() => {
    const now = Date.now();
    let elapsed = now - WORLD.startTime;
    if (elapsed >= WORLD.duration) { WORLD.startTime = now; elapsed = 0; }

    const shrinkSteps = Math.floor(elapsed / WORLD.shrinkInterval);
    const arenaSize = Math.max(200, WORLD.arenaStart - shrinkSteps * WORLD.shrinkStep);

    const payload = JSON.stringify({ 
        type: "state", 
        players, 
        world: { time: elapsed, arena: arenaSize } 
    });

    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) client.send(payload);
    });
}, 50);

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => console.log(`Servidor ON na porta ${PORT}`));
