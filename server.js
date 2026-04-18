<!DOCTYPE html>
<html>
<body style="margin:0; overflow:hidden; background:#fff">
<canvas id="g"></canvas>
<script>
const c = g; const x = c.getContext("2d");
const PLAYER_ID = Math.random().toString(36).slice(2,9);
const PLAYER_COLOR = "#" + Math.floor(Math.random()*16777215).toString(16).padStart(6,"0");

// ESTA LINHA É A CHAVE:
const protocol = location.protocol === 'https:' ? 'wss://' : 'ws://';
const WS_URL = protocol + location.host; 

let ws = new WebSocket(WS_URL);
let players = {};
let p = { x: 300, y: 200, angle: 0, speed: 0 };
let k = {};

ws.onmessage = (msg) => {
    const data = JSON.parse(msg.data);
    if(data.type === "state") players = data.players;
};

ws.onopen = () => {
    ws.send(JSON.stringify({ type: "join", id: PLAYER_ID, color: PLAYER_COLOR }));
};

// Loop de envio
setInterval(() => {
    if(ws.readyState === 1) {
        ws.send(JSON.stringify({ type: "move", id: PLAYER_ID, x: p.x, y: p.y, angle: p.angle }));
    }
}, 50);

onkeydown = e => k[e.key.toLowerCase()] = 1;
onkeyup = e => k[e.key.toLowerCase()] = 0;
onresize = () => { c.width = innerWidth; c.height = innerHeight; };
onresize();

function loop(){
    if(k["a"] || k["arrowleft"]) p.angle -= 0.05;
    if(k["d"] || k["arrowright"]) p.angle += 0.05;
    if(k["w"] || k["arrowup"]) p.speed = Math.min(p.speed + 0.2, 5);
    else p.speed *= 0.98;

    p.x += Math.cos(p.angle) * p.speed;
    p.y += Math.sin(p.angle) * p.speed;

    x.clearRect(0,0,c.width,c.height);

    // Desenha todos os jogadores vindos do servidor
    for(let id in players) {
        let o = players[id];
        x.save();
        x.translate(o.x, o.y);
        x.rotate(o.angle);
        x.fillStyle = (id === PLAYER_ID) ? "#333" : (o.color || "#ccc");
        // Sombreamento leve
        x.shadowBlur = 5; x.shadowColor = "rgba(0,0,0,0.3)";
        x.fillRect(-15,-15,30,30);
        // Se for você, desenha uma borda colorida
        if(id === PLAYER_ID) {
            x.strokeStyle = PLAYER_COLOR;
            x.lineWidth = 3;
            x.strokeRect(-15,-15,30,30);
        }
        x.restore();
    }
    requestAnimationFrame(loop);
}
loop();
</script>
</body>
</html>
