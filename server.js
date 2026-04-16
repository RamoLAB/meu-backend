const express = require('express');
const app = express();

app.use(express.json());

// libera acesso entre domínios (CORS)
app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    next();
});

app.get('/', (req, res) => {
    res.send('Servidor online funcionando');
});

app.post('/posicao', (req, res) => {
    console.log(req.body);
    res.send('ok');
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log('Servidor rodando na porta ' + PORT);
});
