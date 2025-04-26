const canvas = document.getElementById('snow');
const ctx = canvas.getContext('2d');

let width, height;
let snowflakes = [];

function resize() {
  width = canvas.width = window.innerWidth;
  height = canvas.height = window.innerHeight;
}

function createSnowflakes() {
  const count = 100;
  for (let i = 0; i < count; i++) {
    snowflakes.push({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 4 + 1,
      speed: Math.random() * 1 + 0.5,
    });
  }
}

function drawSnowflakes() {
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  for (let flake of snowflakes) {
    ctx.moveTo(flake.x, flake.y);
    ctx.arc(flake.x, flake.y, flake.radius, 0, Math.PI * 2);
  }
  ctx.fill();
  moveSnowflakes();
}

function moveSnowflakes() {
  for (let flake of snowflakes) {
    flake.y += flake.speed;
    if (flake.y > height) {
      flake.y = 0;
      flake.x = Math.random() * width;
    }
  }
}

function loop() {
  drawSnowflakes();
  requestAnimationFrame(loop);
}

window.addEventListener('resize', resize);
resize();
createSnowflakes();
loop();
