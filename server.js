const express = require("express");
const http = require("http");
const WebSocket = require("ws");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Serve o arquivo index.html automaticamente
app.use(express.static(__dirname));

// =====================
// ESTADO GLOBAL 🌍
// =====================
let players = {};

const WORLD = {
    startTime: Date.now(),
    duration: 60000,       // Ciclo de 60 segundos
    arenaStart: 1000,
    shrinkStep: 100,
    shrinkInterval: 10000
};

// =====================
// WEBSOCKET (Conexão) 🔌
// =====================
wss.on("connection", (ws) => {
    let playerId = null;

    ws.on("message", (msg) => {
        const data = JSON.parse(msg);

        if (data.type === "join") {
            playerId = data.id;
            players[playerId] = {
                x: 500,
                y: 100,
                angle: 0,
                color: data.color || "#4CAF50"
            };
        }

        if (data.type === "move") {
            if (players[data.id]) {
                players[data.id].x = data.x;
                players[data.id].y = data.y;
                players[data.id].angle = data.angle;
                players[data.id].color = data.color;
            }
        }
    });

    ws.on("close", () => {
        if (playerId && players[playerId]) {
            delete players[playerId];
        }
    });
});

// =====================
// LOOP DE ATUALIZAÇÃO 🔄
// =====================
setInterval(() => {
    const now = Date.now();
    let elapsed = now - WORLD.startTime;

    if (elapsed >= WORLD.duration) {
        WORLD.startTime = now;
        elapsed = 0;
    }

    const shrinkSteps = Math.floor(elapsed / WORLD.shrinkInterval);
    const arenaSize = Math.max(200, WORLD.arenaStart - shrinkSteps * WORLD.shrinkStep);

    const payload = JSON.stringify({
        type: "state",
        players: players,
        world: { time: elapsed, arena: arenaSize }
    });

    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(payload);
        }
    });
}, 50);

// =====================
// START 🚀
// =====================
const PORT = process.env.PORT || 10000;
server.listen(PORT, () => {
    console.log("Servidor rodando na porta", PORT);
});
