const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const path = require("path");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Serve o index.html e arquivos da pasta atual
app.use(express.static(__dirname));

let players = {};

wss.on("connection", (ws) => {
    let playerId = null;

    ws.on("message", (msg) => {
        try {
            const data = JSON.parse(msg);

            if (data.type === "join") {
                playerId = data.id;
                players[playerId] = { x: 500, y: 100, angle: 0, color: data.color };
                console.log(`Jogador ${playerId} entrou`);
            }

            if (data.type === "move" && players[data.id]) {
                players[data.id].x = data.x;
                players[data.id].y = data.y;
                players[data.id].angle = data.angle;
            }
        } catch (e) { console.error("Erro no processamento:", e); }
    });

    ws.on("close", () => {
        if (playerId) {
            delete players[playerId];
            console.log(`Jogador ${playerId} saiu`);
        }
    });
});

// Envia o estado para todos a cada 50ms
setInterval(() => {
    const payload = JSON.stringify({ type: "state", players });
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) client.send(payload);
    });
}, 50);

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => console.log(`Rodando em: http://localhost:${PORT}`));
