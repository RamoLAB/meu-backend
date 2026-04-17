const express = require("express");
const http = require("http");
const WebSocket = require("ws");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// =====================
// ESTADO GLOBAL
// =====================

let players = {};

const WORLD = {
    startTime: Date.now(),
    duration: 60000,       // 60s
    arenaStart: 1000,
    shrinkStep: 100,
    shrinkInterval: 10000
};

// =====================
// HTTP
// =====================

app.get("/", (req, res) => {
    res.send("Servidor rodando");
});

// =====================
// WEBSOCKET
// =====================

wss.on("connection", (ws) => {

    let playerId = null;

    ws.on("message", (msg) => {
        const data = JSON.parse(msg);

        if (data.type === "join") {
            playerId = data.id;

            players[playerId] = {
                x: 50,
                y: 50
            };
        }

        if (data.type === "move") {
            if (players[data.id]) {
                players[data.id].x = data.x;
                players[data.id].y = data.y;
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
// LOOP GLOBAL
// =====================

setInterval(() => {

    const now = Date.now();
    let elapsed = now - WORLD.startTime;

    // reinicia o ciclo de 60s
    if (elapsed >= WORLD.duration) {
        WORLD.startTime = now;
        elapsed = 0;
    }

    const shrinkSteps = Math.floor(elapsed / WORLD.shrinkInterval);

    const arenaSize = Math.max(
        200,
        WORLD.arenaStart - shrinkSteps * WORLD.shrinkStep
    );

    const worldState = {
        time: elapsed,
        arena: arenaSize
    };

    const payload = JSON.stringify({
        type: "state",
        players: players,
        world: worldState
    });

    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(payload);
        }
    });

}, 50);

// =====================
// START
// =====================

const PORT = process.env.PORT || 10000;

server.listen(PORT, () => {
    console.log("Servidor rodando na porta", PORT);
});
