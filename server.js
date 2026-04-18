const WebSocket = require("ws");

const PORT = process.env.PORT || 3000;

const wss = new WebSocket.Server({ port: PORT });

let players = {};
let connections = new Map(); // ws -> playerId

// =======================
// CONNECTION
// =======================
wss.on("connection", (ws) => {

    let playerId = null;

    ws.on("message", (msg) => {
        let data;

        try {
            data = JSON.parse(msg);
        } catch {
            return;
        }

        // ===================
        // JOIN
        // ===================
        if (data.type === "join") {

            playerId = data.id;

            connections.set(ws, playerId);

            players[playerId] = {
                x: 0,
                y: 0,
                angle: 0,
                color: data.color || "#999",
                isBoosting: false,
                lap: 1
            };
        }

        // ===================
        // MOVE
        // ===================
        if (data.type === "move") {

            if (!players[data.id]) return;

            players[data.id] = {
                x: data.x,
                y: data.y,
                angle: data.angle,
                color: data.color,
                isBoosting: data.isBoosting || false,
                lap: data.lap || 1
            };
        }
    });

    // =======================
    // DISCONNECT
    // =======================
    ws.on("close", () => {

        const id = connections.get(ws);

        if (id && players[id]) {
            delete players[id];
        }

        connections.delete(ws);
    });

});

// =======================
// BROADCAST LOOP
// =======================
setInterval(() => {

    const packet = JSON.stringify({
        type: "state",
        players: players
    });

    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(packet);
        }
    });

}, 50);

// =======================
// HEALTH LOG
// =======================
setInterval(() => {
    console.log("Players online:", Object.keys(players).length);
}, 5000);

console.log("Server running on port", PORT);
