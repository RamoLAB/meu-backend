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

// armazenamento simples de jogadores
const players = {};

app.get('/players', (req, res) => {
    res.json(players);
});

app.post('/posicao', (req, res) => {
    const { id, x, y } = req.body;

    if (!id) return res.send("sem id");

    players[id] = { x, y };

    console.log("PLAYERS:", players);

    res.send("ok");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
    console.log('Servidor rodando na porta ' + PORT);
});
