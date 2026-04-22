const express = require("express");
const http = require("http");
const WebSocket = require("ws");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let players = {};
let inputs = {};

const WORLD = {
    startTime: Date.now(),
    duration: 60000,
    arenaStart: 1000,
    shrinkStep: 100,
    shrinkInterval: 10000,
    winner: null
};

function randomColor() {
    return Math.floor(Math.random() * 16777215)
        .toString(16)
        .padStart(6, "0");
}

wss.on("connection", (ws) => {

    let id = null;

    ws.on("message", msg => {
        const data = JSON.parse(msg);

        if (data.type === "join") {
            id = data.id;

            players[id] = {
                x: 50,
                y: 50,
                vx: 0,
                vy: 0,
                color: randomColor(),
                hp: 100,
                alive: true,
                size: 30,
                shield: false
            };
        }

        if (data.type === "input") {
            inputs[data.id] = data;
        }

        if (data.type === "dash") {
            const p = players[data.id];
            if (!p) return;

            p.x += p.vx * 100;
            p.y += p.vy * 100;
        }
    });

    ws.on("close", () => {
        delete players[id];
        delete inputs[id];
    });
});

// colisão
function collide(a, b) {
    return (
        a.x < b.x + b.size &&
        a.x + a.size > b.x &&
        a.y < b.y + b.size &&
        a.y + a.size > b.y
    );
}

// loop
setInterval(() => {

    const now = Date.now();
    let elapsed = now - WORLD.startTime;

    if (elapsed >= WORLD.duration) {
        WORLD.startTime = now;
        WORLD.winner = null;
        players = {};
        inputs = {};
        return;
    }

    const shrinkSteps = Math.floor(elapsed / WORLD.shrinkInterval);

    const arena = Math.max(
        200,
        WORLD.arenaStart - shrinkSteps * WORLD.shrinkStep
    );

    const mx = 500 - arena / 2;
    const my = 500 - arena / 2;

    // movimento
    for (let id in players) {

        const p = players[id];
        if (!p.alive) continue;

        const inp = inputs[id] || {};

        const speed = 4;

        p.vx = (inp.right ? 1 : 0) - (inp.left ? 1 : 0);
        p.vy = (inp.down ? 1 : 0) - (inp.up ? 1 : 0);

        p.x += p.vx * speed;
        p.y += p.vy * speed;

        // zona de dano
        if (
            p.x < mx || p.x > mx + arena ||
            p.y < my || p.y > my + arena
        ) {
            p.hp -= 2;
            if (p.hp <= 0) p.alive = false;
        }
    }

    // colisão + knockback
    const ids = Object.keys(players);

    for (let i = 0; i < ids.length; i++) {
        for (let j = i + 1; j < ids.length; j++) {

            const a = players[ids[i]];
            const b = players[ids[j]];

            if (!a.alive || !b.alive) continue;

            if (collide(a, b)) {

                const dx = a.x - b.x;
                const dy = a.y - b.y;
                const len = Math.hypot(dx, dy) || 1;

                const kx = dx / len * 20;
                const ky = dy / len * 20;

                a.x += kx;
                a.y += ky;

                b.x -= kx;
                b.y -= ky;
            }
        }
    }

    // vitória
    const alive = Object.entries(players).filter(([_, p]) => p.alive);

    if (alive.length === 1) {
        WORLD.winner = alive[0][0];
    }

    const payload = JSON.stringify({
        type: "state",
        players,
        world: {
            time: elapsed,
            arena,
            winner: WORLD.winner
        }
    });

    wss.clients.forEach(c => {
        if (c.readyState === WebSocket.OPEN) {
            c.send(payload);
        }
    });

}, 50);

server.listen(process.env.PORT || 10000);
