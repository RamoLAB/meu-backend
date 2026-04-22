const express = require("express");
const http = require("http");
const WebSocket = require("ws");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let players = {};
let bullets = [];

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
                speed: 10,
                life: 1000 // ms
            });
        }
    });

    ws.on("close", () => {
        if (playerId && players[playerId]) {
            delete players[playerId];
        }
    });
});

// loop
setInterval(() => {

    // atualizar tiros
    bullets.forEach(b => {
        b.x += b.dx * b.speed;
        b.y += b.dy * b.speed;
        b.life -= 50;
    });

    bullets = bullets.filter(b => b.life > 0);

    const payload = JSON.stringify({
        type: "state",
        players: players,
        bullets: bullets
    });

    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(payload);
        }
    });

}, 50);

const PORT = process.env.PORT || 10000;

server.listen(PORT, () => {
    console.log("Servidor rodando", PORT);
});
