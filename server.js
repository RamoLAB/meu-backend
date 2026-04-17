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
    duration: 60000, // 60s
    arenaStart: 1000, // tamanho inicial
    shrinkStep: 100,  // reduz a cada 10s
    shrinkInterval: 10000 // 10s
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

    ws.on("message", (msg) => {
        const data = JSON.parse(msg);

        if (data.type === "join") {
            players[data.id] = {
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
        // limpa players desconectados
        for (let id in players) {
            // simples: remove todos sem controle fino
            // (ajustamos depois se quiser)
        }
    });
});

// =====================
// LOOP GLOBAL
// =====================

setInterval(() => {

    const now = Date.now();
    const elapsed = now - WORLD.startTime;

    // cálculo da arena
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
