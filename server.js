const WebSocket = require("ws");

const PORT = process.env.PORT || 10000;
const wss = new WebSocket.Server({ port: PORT });

let players = {};

wss.on("connection", (ws) => {

    let playerId = null;

    ws.on("message", (msg) => {
        try {
            const data = JSON.parse(msg);

            // jogador entra
            if (data.type === "join") {
                playerId = data.id;

                players[playerId] = {
                    x: 100,
                    y: 100,
                    color: `hsl(${Math.random() * 360},70%,50%)`
                };
            }

            // movimento
            if (data.type === "move" && playerId) {
                players[playerId] = {
                    x: data.x,
                    y: data.y,
                    color: data.color || players[playerId]?.color
                };
            }

        } catch (e) {}
    });

    ws.on("close", () => {
        if (playerId) delete players[playerId];
    });
});

// broadcast (20x por segundo)
setInterval(() => {

    const payload = JSON.stringify({
        type: "state",
        players: players
    });

    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(payload);
        }
    });

}, 50);

console.log("Servidor rodando na porta", PORT);
