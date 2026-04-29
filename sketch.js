// ============================================================
//  Generative Mandala — A p5.js Design Tool
//  Week 13 Lab: Creating Design Tools
//
//  Controls:
//    Mouse move   -> distorts the petals (closer = more chaos)
//    Mouse drag   -> rotates the whole mandala
//    1 - 9        -> change number of symmetry arms
//    [ / ]        -> fewer / more rings
//    SPACE        -> reseed randomness (new pattern)
//    C            -> cycle color palette
//    L            -> toggle line / filled-shape mode
//    S            -> save current frame as PNG
// ============================================================

let arms = 8;            // symmetry count
let rings = 7;           // concentric rings
let rotation = 0;        // global rotation
let dragging = false;
let lastMouseAngle = 0;
let seed = 1234;
let paletteIndex = 0;
let lineMode = true;

const palettes = [
  ['#0d1b2a', '#e0e1dd', '#778da9', '#415a77', '#1b263b'],
  ['#1a1a1a', '#ff006e', '#ffbe0b', '#fb5607', '#8338ec'],
  ['#0b3954', '#bfd7ea', '#ff5a5f', '#087e8b', '#c81d25'],
  ['#fefae0', '#283618', '#606c38', '#dda15e', '#bc6c25'],
  ['#ffffff', '#000000', '#000000', '#000000', '#000000'], // pen-plotter friendly
];

function setup() {
  createCanvas(windowWidth, windowHeight);
  angleMode(RADIANS);
  strokeJoin(ROUND);
  strokeCap(ROUND);
}

function draw() {
  randomSeed(seed);
  noiseSeed(seed);

  const pal = palettes[paletteIndex];
  background(pal[0]);

  translate(width / 2, height / 2);
  rotate(rotation);

  // distance from mouse to center -> drives global "energy"
  const mx = mouseX - width / 2;
  const my = mouseY - height / 2;
  const mouseDist = sqrt(mx * mx + my * my);
  const energy = constrain(map(mouseDist, 0, min(width, height) / 2, 1.0, 0.05), 0.05, 1.0);

  const maxR = min(width, height) * 0.45;

  for (let r = 1; r <= rings; r++) {
    const radius = (r / rings) * maxR;
    const colorIdx = 1 + (r % (pal.length - 1));
    const col = color(pal[colorIdx]);

    if (lineMode) {
      noFill();
      stroke(col);
      strokeWeight(map(r, 1, rings, 2.5, 1.0));
    } else {
      fill(red(col), green(col), blue(col), 90);
      stroke(pal[1]);
      strokeWeight(0.8);
    }

    drawPetalRing(radius, r, energy);
  }

  // small center mark — handy registration point for fabrication
  noStroke();
  fill(pal[1]);
  circle(0, 0, 6);
}

// One symmetric ring composed of `arms` repeated petals
function drawPetalRing(radius, ringIndex, energy) {
  const segments = 60;
  for (let a = 0; a < arms; a++) {
    const baseAngle = (TWO_PI / arms) * a;
    beginShape();
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      // petal-shaped envelope (sin gives a lobe between 0..PI)
      const petalAngle = baseAngle + (t * TWO_PI) / arms;
      const lobe = sin(t * PI);

      // noise-driven wobble; mouse energy scales it up
      const n = noise(
        cos(petalAngle) * 1.5 + ringIndex * 0.3,
        sin(petalAngle) * 1.5 + ringIndex * 0.3,
        frameCount * 0.005
      );
      const wobble = (n - 0.5) * 60 * energy;

      const r = radius * (0.35 + 0.65 * lobe) + wobble;
      const x = cos(petalAngle) * r;
      const y = sin(petalAngle) * r;
      vertex(x, y);
    }
    if (lineMode) endShape();
    else endShape(CLOSE);
  }
}

// ---------- input ----------

function mousePressed() {
  dragging = true;
  lastMouseAngle = atan2(mouseY - height / 2, mouseX - width / 2);
}

function mouseReleased() {
  dragging = false;
}

function mouseDragged() {
  if (!dragging) return;
  const a = atan2(mouseY - height / 2, mouseX - width / 2);
  rotation += a - lastMouseAngle;
  lastMouseAngle = a;
}

function keyPressed() {
  if (key >= '1' && key <= '9') {
    arms = int(key);
  } else if (key === '[') {
    rings = max(1, rings - 1);
  } else if (key === ']') {
    rings = min(20, rings + 1);
  } else if (key === ' ') {
    seed = floor(random(100000));
  } else if (key === 'c' || key === 'C') {
    paletteIndex = (paletteIndex + 1) % palettes.length;
  } else if (key === 'l' || key === 'L') {
    lineMode = !lineMode;
  } else if (key === 's' || key === 'S') {
    saveCanvas('mandala', 'png');
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
