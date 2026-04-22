const express = require("express");
const http = require("http");
const WebSocket = require("ws");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let players = {};
let bullets = [];

const WORLD = {
    startTime: Date.now(),
    duration: 60000
};

function randomColor() {
    return Math.floor(Math.random() * 16777215)
        .toString(16)
        .padStart(6, "0");
}

app.get("/", (req, res) => {
    res.send("Servidor rodando");
});

wss.on("connection", (ws) => {

    let playerId = null;

    ws.on("message", (msg) => {
        const data = JSON.parse(msg);

        if (data.type === "join") {
            playerId = data.id;

            players[playerId] = {
                x: 50,
                y: 50,
                color: randomColor()
            };
        }

        if (data.type === "move") {
            if (players[data.id]) {
                players[data.id].x = data.x;
                players[data.id].y = data.y;
            }
        }

        if (data.type === "shoot") {
            bullets.push({
                x: data.x,
                y: data.y,
                dx: data.dx,
                dy: data.dy,
                speed: 12,
                life: 3000
            });
        }
    });

    ws.on("close", () => {
        if (playerId && players[playerId]) {
            delete players[playerId];
        }
    });
});

// loop global
setInterval(() => {

    const now = Date.now();
    let elapsed = now - WORLD.startTime;

    if (elapsed >= WORLD.duration) {
        WORLD.startTime = now;
        elapsed = 0;
    }

    // atualizar tiros
    for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];

        b.x += b.dx * b.speed;
        b.y += b.dy * b.speed;
        b.life -= 50;

        if (
            b.life <= 0 ||
            b.x < -50 || b.x > 5000 ||
            b.y < -50 || b.y > 5000
        ) {
            bullets.splice(i, 1);
        }
    }

    const payload = JSON.stringify({
        type: "state",
        players: players,
        bullets: bullets,
        world: {
            time: elapsed
        }
    });

    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(payload);
        }
    });

}, 50);

const PORT = process.env.PORT || 10000;

server.listen(PORT, () => {
    console.log("Servidor rodando na porta", PORT);
});
