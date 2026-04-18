const WebSocket = require("ws");

const PORT = process.env.PORT || 10000;

// FIX para Render (obrigatório)
const server = require("http").createServer();
const wss = new WebSocket.Server({ server });

let players = {};

wss.on("connection", (ws) => {

    let id = null;

    ws.on("message", (msg) => {
        try {
            const data = JSON.parse(msg);

            if (data.type === "join") {
                id = data.id;

                players[id] = {
                    x: 200,
                    y: 200,
                    color: data.color
                };
            }

            if (data.type === "move" && id) {
                players[id].x = data.x;
                players[id].y = data.y;
            }

        } catch {}
    });

    ws.on("close", () => {
        if (id) delete players[id];
    });
});

// broadcast estável
setInterval(() => {
    const payload = JSON.stringify({
        type: "state",
        players
    });

    wss.clients.forEach(c => {
        if (c.readyState === 1) c.send(payload);
    });

}, 50);

// obrigatório pro Render não matar
server.listen(PORT, () => {
    console.log("running", PORT);
});
