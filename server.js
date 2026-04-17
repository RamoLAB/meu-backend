const express = require('express');
const http = require('http');
const { WebSocketServer } = require('ws');

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

app.get("/", (req, res) => {
    res.send("WebSocket server online");
});

// estado do jogo
const players = {};

// quando alguém conecta
wss.on('connection', (ws) => {

    let id = null;

    ws.on('message', (msg) => {
        const data = JSON.parse(msg);

        // registro inicial do jogador
        if (data.type === "join") {
            id = data.id;

            players[id] = {
                x: 50,
                y: 50
            };
        }

        // atualização de posição
        if (data.type === "move") {
            if (!players[id]) return;

            players[id].x = data.x;
            players[id].y = data.y;
        }

        // envia estado atualizado para todos
        broadcast();
    });

    ws.on('close', () => {
        if (id) {
            delete players[id];
            broadcast();
        }
    });
});

function broadcast() {
    const payload = JSON.stringify({
        type: "state",
        players
    });

    wss.clients.forEach(client => {
        if (client.readyState === 1) {
            client.send(payload);
        }
    });
}

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log("WebSocket rodando na porta " + PORT);
});
