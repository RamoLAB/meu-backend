const express = require('express');
const app = express();

app.use(express.json());

// CORS robusto
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
        return res.sendStatus(200);
    }

    next();
});

app.get('/', (req, res) => {
    res.send('Servidor online funcionando');
});

app.post('/posicao', (req, res) => {
    console.log("RECEBIDO:", req.body);
    res.send('ok');
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log('Servidor rodando na porta ' + PORT);
});
