// ============================================================
//  Mandala Plotter — A p5.js CAD/CAM Design Tool
//  Activity 12: CAD/CAM Plug-ins
//
//  Target fabrication process:
//    Pen plotter (e.g. AxiDraw) and/or laser engraver.
//    Output is a single-stroke SVG with real-world mm dimensions,
//    ready to load into Inkscape / LightBurn / AxiDraw plug-in.
//
//  Controls:
//    Mouse move         distort petals (closer to center = more)
//    Mouse drag         rotate the whole pattern
//    1 - 9              symmetry arms (rotational order)
//    [ / ]              fewer / more rings
//    - / =              shrink / grow design diameter
//    SPACE              new random seed
//    G                  toggle mm grid overlay
//    P                  toggle plotter preview (black ink on white)
//    E                  export SVG (download to disk)
//    S                  save PNG snapshot
// ============================================================

// --- physical sheet (in millimeters) ---
const SHEET_W_MM = 210;   // A4 width
const SHEET_H_MM = 210;   // square plot area
let PX_PER_MM = 3;        // updated in setup based on window size

// --- design parameters ---
let arms = 8;
let rings = 7;
let designDiameterMM = 180;
let rotation = 0;
let seed = 1234;
let showGrid = true;
let plotterPreview = true;

// captured polylines for SVG export — refreshed each frame
let capturedPolylines = [];

// drag-to-rotate state
let dragging = false;
let lastMouseAngle = 0;

function setup() {
  createCanvas(windowWidth, windowHeight);
  PX_PER_MM = min(width, height) / (max(SHEET_W_MM, SHEET_H_MM) + 40);
  angleMode(RADIANS);
  strokeJoin(ROUND);
  strokeCap(ROUND);
}

function draw() {
  randomSeed(seed);
  noiseSeed(seed);
  capturedPolylines = [];

  background(plotterPreview ? 250 : 18);

  // sheet (paper) outline
  push();
  translate(width / 2, height / 2);

  if (showGrid) drawGrid();

  // sheet boundary
  noFill();
  stroke(plotterPreview ? 200 : 60);
  strokeWeight(1);
  rectMode(CENTER);
  rect(0, 0, SHEET_W_MM * PX_PER_MM, SHEET_H_MM * PX_PER_MM);

  // design
  rotate(rotation);

  const mxMM = (mouseX - width / 2) / PX_PER_MM;
  const myMM = (mouseY - height / 2) / PX_PER_MM;
  const mouseDist = sqrt(mxMM * mxMM + myMM * myMM);
  const energy = constrain(map(mouseDist, 0, designDiameterMM / 2, 1.0, 0.05), 0.05, 1.0);

  stroke(plotterPreview ? 0 : 230);
  strokeWeight(plotterPreview ? 1.0 : 1.2);
  noFill();

  const maxR = designDiameterMM / 2;
  for (let r = 1; r <= rings; r++) {
    const radius = (r / rings) * maxR;
    drawPetalRing(radius, r, energy);
  }

  // registration mark at center
  stroke(plotterPreview ? 0 : 230);
  strokeWeight(0.6);
  line(-3 * PX_PER_MM, 0, 3 * PX_PER_MM, 0);
  line(0, -3 * PX_PER_MM, 0, 3 * PX_PER_MM);

  pop();

  drawHUD();
}

// One ring of `arms` symmetric petals.
// Each petal is a polyline; we record the (mm) vertices for SVG export.
function drawPetalRing(radius, ringIndex, energy) {
  const segments = 80;
  for (let a = 0; a < arms; a++) {
    const baseAngle = (TWO_PI / arms) * a;
    const polylineMM = [];

    beginShape();
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const petalAngle = baseAngle + (t * TWO_PI) / arms;
      const lobe = sin(t * PI);

      const n = noise(
        cos(petalAngle) * 1.5 + ringIndex * 0.3,
        sin(petalAngle) * 1.5 + ringIndex * 0.3
      );
      const wobbleMM = (n - 0.5) * (designDiameterMM * 0.1) * energy;

      const rMM = radius * (0.35 + 0.65 * lobe) + wobbleMM;
      const xMM = cos(petalAngle) * rMM;
      const yMM = sin(petalAngle) * rMM;

      vertex(xMM * PX_PER_MM, yMM * PX_PER_MM);
      polylineMM.push([xMM, yMM]);
    }
    endShape();
    capturedPolylines.push(polylineMM);
  }
}

function drawGrid() {
  const stepMM = 10;
  stroke(plotterPreview ? 230 : 40);
  strokeWeight(0.5);
  const halfW = (SHEET_W_MM / 2) * PX_PER_MM;
  const halfH = (SHEET_H_MM / 2) * PX_PER_MM;
  for (let x = -SHEET_W_MM / 2; x <= SHEET_W_MM / 2; x += stepMM) {
    line(x * PX_PER_MM, -halfH, x * PX_PER_MM, halfH);
  }
  for (let y = -SHEET_H_MM / 2; y <= SHEET_H_MM / 2; y += stepMM) {
    line(-halfW, y * PX_PER_MM, halfW, y * PX_PER_MM);
  }
}

function drawHUD() {
  const pad = 14;
  const lineH = 16;
  noStroke();
  fill(plotterPreview ? 0 : 230);
  textFont('monospace');
  textSize(12);
  textAlign(LEFT, TOP);
  const lines = [
    `Mandala Plotter — CAD/CAM tool for AxiDraw / laser engraver`,
    `sheet: ${SHEET_W_MM} x ${SHEET_H_MM} mm   |   design Ø: ${designDiameterMM} mm`,
    `arms: ${arms}   rings: ${rings}   seed: ${seed}`,
    `[1-9] arms  [/] rings  -/= size  SPACE seed  G grid  P preview  E export SVG  S png`,
  ];
  lines.forEach((s, i) => text(s, pad, pad + i * lineH));
}

// ---------- input ----------

function mousePressed() {
  dragging = true;
  lastMouseAngle = atan2(mouseY - height / 2, mouseX - width / 2);
}
function mouseReleased() { dragging = false; }
function mouseDragged() {
  if (!dragging) return;
  const a = atan2(mouseY - height / 2, mouseX - width / 2);
  rotation += a - lastMouseAngle;
  lastMouseAngle = a;
}

function keyPressed() {
  if (key >= '1' && key <= '9') arms = int(key);
  else if (key === '[') rings = max(1, rings - 1);
  else if (key === ']') rings = min(20, rings + 1);
  else if (key === '-' || key === '_') designDiameterMM = max(20, designDiameterMM - 5);
  else if (key === '=' || key === '+') designDiameterMM = min(min(SHEET_W_MM, SHEET_H_MM), designDiameterMM + 5);
  else if (key === ' ') seed = floor(random(100000));
  else if (key === 'g' || key === 'G') showGrid = !showGrid;
  else if (key === 'p' || key === 'P') plotterPreview = !plotterPreview;
  else if (key === 's' || key === 'S') saveCanvas('mandala', 'png');
  else if (key === 'e' || key === 'E') exportSVG();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  PX_PER_MM = min(width, height) / (max(SHEET_W_MM, SHEET_H_MM) + 40);
}

// ---------- SVG export (real-world mm units) ----------
//
// Output is single-stroke (no fill), units in mm. AxiDraw and most laser
// software (LightBurn, Inkscape) read these directly and treat each polyline
// as one tool path.
function exportSVG() {
  var w = SHEET_W_MM;
  var h = SHEET_H_MM;
  var cx = w / 2;
  var cy = h / 2;

  var cosR = Math.cos(rotation);
  var sinR = Math.sin(rotation);

  var body = '';
  for (var i = 0; i < capturedPolylines.length; i++) {
    var poly = capturedPolylines[i];
    var pts = '';
    for (var j = 0; j < poly.length; j++) {
      var x = poly[j][0];
      var y = poly[j][1];
      var xr = x * cosR - y * sinR + cx;
      var yr = x * sinR + y * cosR + cy;
      if (j > 0) pts += ' ';
      pts += xr.toFixed(3) + ',' + yr.toFixed(3);
    }
    body += '  <polyline points="' + pts + '" fill="none" stroke="black" stroke-width="0.3"/>\n';
  }

  body += '  <line x1="' + (cx - 3) + '" y1="' + cy + '" x2="' + (cx + 3) + '" y2="' + cy + '" stroke="black" stroke-width="0.3"/>\n';
  body += '  <line x1="' + cx + '" y1="' + (cy - 3) + '" x2="' + cx + '" y2="' + (cy + 3) + '" stroke="black" stroke-width="0.3"/>\n';

  var svg = '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<svg xmlns="http://www.w3.org/2000/svg" width="' + w + 'mm" height="' + h + 'mm" viewBox="0 0 ' + w + ' ' + h + '">\n' +
    body +
    '</svg>';

  var blob = new Blob([svg], { type: 'image/svg+xml' });
  var url = URL.createObjectURL(blob);
  var anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'mandala_' + arms + 'arms_' + rings + 'rings_seed' + seed + '.svg';
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
