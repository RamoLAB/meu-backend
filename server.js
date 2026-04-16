const express = require('express');
const app = express();

app.use(express.json());

// CORS
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type");
    if (req.method === "OPTIONS") return res.sendStatus(200);
    next();
});

// início do “mundo”
const WORLD_START = Date.now();

const players = {};

app.get('/world', (req, res) => {
    res.json({
        time: Date.now() - WORLD_START
    });
});

app.get('/players', (req, res) => {
    res.json(players);
});

app.post('/posicao', (req, res) => {
    const { id, x, y } = req.body;
    if (!id) return res.send("no id");

    players[id] = {
        x,
        y,
        last: Date.now()
    };

    res.send("ok");
});

// limpeza
setInterval(() => {
    const now = Date.now();
    for (let id in players) {
        if (now - players[id].last > 5000) {
            delete players[id];
        }
    }
}, 2000);

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log("server on " + PORT);
});
