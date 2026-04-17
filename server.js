const express = require("express");
const http = require("http");
const WebSocket = require("ws");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// =====================
// ESTADO GLOBAL 🌍
// =====================

let players = {};

const WORLD = {
    startTime: Date.now(),
    duration: 60000,       // Ciclo de 60s
    arenaStart: 1000,
    shrinkStep: 100,
    shrinkInterval: 10000
};

// =====================
// HTTP 🌐
// =====================

app.get("/", (req, res) => {
    res.send("Servidor rodando");
});

// =====================
// WEBSOCKET 🔌
// =====================

wss.on("connection", (ws) => {
    let playerId = null;

    ws.on("message", (msg) => {
        const data = JSON.parse(msg);

        // JOIN: Agora inclui ângulo e cor
        if (data.type === "join") {
            playerId = data.id;
            players[playerId] = {
                x: 50,
                y: 50,
                angle: 0,
                color: data.color || "#4CAF50" // Cor padrão caso não venha no pacote
            };
        }

        // MOVE: Atualiza posição, rotação e mantém a cor
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
// LOOP GLOBAL (Broadcast) 🔄
// =====================

setInterval(() => {
    const now = Date.now();
    let elapsed = now - WORLD.startTime;

    // Reinicia o ciclo do cronômetro de 60s
    if (elapsed >= WORLD.duration) {
        WORLD.startTime = now;
        elapsed = 0;
    }

    // Lógica de encolhimento da arena
    const shrinkSteps = Math.floor(elapsed / WORLD.shrinkInterval);
    const arenaSize = Math.max(
        200,
        WORLD.arenaStart - shrinkSteps * WORLD.shrinkStep
    );

    const worldState = {
        time: elapsed,
        arena: arenaSize
    };

    // Envia o estado completo para todos os clientes
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
// START 🚀
// =====================

const PORT = process.env.PORT || 10000;

server.listen(PORT, () => {
    console.log("Servidor rodando na porta", PORT);
});
