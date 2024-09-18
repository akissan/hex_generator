const textureSize = 4096;
const gridWidth = textureSize;
const gridHeight = textureSize;
let winsize = null;
let cnv = null;
let prv = null;

function setup() {
  winsize = min(windowWidth, windowHeight);
  createCanvas(winsize, winsize);
  cnv = createGraphics(4096, 4096);
  prv = createGraphics(100, 100);
  setNewSeed();
  createSliders();
}

params = {
  hex_size: 100,
  slope: 1,
  gain: 0,
  curv: 1,
  limit: 0.15,
  min_gap: 3,
  noise_size: 30,
  color_size: 30,
  invert: false,
  v2c: true,
  v2s: true,
  rnd_clr: true,
  limit_is_min: false,
};

function drawHexagon(cX, cY, r) {
  cnv.beginShape();
  for (let a = 0; a < TAU; a += TAU / 6) {
    cnv.vertex(cX + r * cos(a), cY + r * sin(a));
  }
  cnv.endShape(CLOSE);
}

function getHexSize(x, y) {
  const ns = params.noise_size * 0.0001;
  const noiseVal = noise(x * ns, y * ns);
  return remap(noiseVal);
}

function remap(x) {
  if (!params.limit_is_min && x < params.limit) {
    return 0;
  }

  let y = pow(x, params.curv) * params.slope + params.gain;

  y = constrain(y, 0, 1);
  if (params.invert) {
    y = 1 - y;
  }

  return constrain(
    y * (params.hex_size * 0.5 + 1),
    params.limit_is_min ? params.hex_size * 0.5 * params.limit : 0,
    params.hex_size * 0.5 - params.min_gap + 1
  );
}

function getRandomColor(x, y) {
  const ns = params.color_size * 0.0001;
  const noiseVal = noise(1 - x * ns, 1 - y * ns);
  return noiseVal;
}

function makeGrid() {
  cnv.noStroke();
  cnv.background(0);
  cnv.fill(255);
  let count = 0;
  const hexagonSize = params.hex_size;

  let nv;
  let clrVal;
  for (y = 0; y < gridHeight + hexagonSize * 2; y += hexagonSize / 2.3) {
    for (x = 0; x < gridWidth + hexagonSize * 2; x += hexagonSize * 1.5) {
      nv = getHexSize(x, y);
      clrVal = 255;
      if (params.v2c) {
        clrVal = (nv / (hexagonSize * 0.5 - params.min_gap)) * 255;
        cnv.fill(clrVal);
      }
      if (params.rnd_clr) {
        cnv.fill(clrVal * getRandomColor(x, y));
      }
      if (nv > 0) {
        drawHexagon(
          x + hexagonSize * (count % 2 == 0) * 0.75,
          y,
          params.v2s ? nv : hexagonSize * 0.5 - params.min_gap + 1
        );
      }
    }
    count++;
  }
}

function houseFunction(func, house) {
  return function housedFunction(...args) {
    return func(house, ...args);
  };
}

function bakeCheckbox(house, name, param) {
  function cb_changed() {
    params[param] = this.checked();
  }

  const cb = createCheckbox(name, params[param]);
  cb.addClass("checkbox");
  cb.changed(cb_changed);
  if (house) {
    house.child(cb);
  }

  return cb;
}

function bakeSlider(house, min_val, max_val, param, step = 0.01) {
  const h = createDiv();
  h.addClass("sliderContainer");

  const s = createSlider(min_val, max_val, params[param], step);
  // s.size(160);
  s.addClass("slider");

  const p = createP();
  p.addClass("sliderValue");
  const label = createP(param);
  label.addClass("sliderLabel");

  function updateVal() {
    print(`${param} updated!: ${s.value()}`);
    p.html(s.value());
    params[param] = s.value();
  }

  function plus() {
    s.value(s.value() + step);
    updateVal();
  }

  function minus() {
    s.value(s.value() - step);
    updateVal();
  }

  s.input(updateVal);

  step_left = createButton("-");
  step_left.mousePressed(minus);
  step_right = createButton("+");
  step_right.mousePressed(plus);
  step_left.addClass("sliderButton");
  step_right.addClass("sliderButton");

  h.child(label);
  h.child(s);
  h.child(p);
  h.child(step_left);
  h.child(step_right);

  if (house) {
    house.child(h);
  }

  p.html(params[param]);

  return h;
}

function createSliders() {
  const housing = createDiv();
  housing.addClass("house");
  housing.position(0, 0);

  bakeSlider = houseFunction(bakeSlider, housing);
  bakeSlider(40, 300, "hex_size", 1);
  bakeSlider(-6, 6, "slope");
  bakeSlider(-6, 6, "gain");
  bakeSlider(0, 1, "limit");
  bakeSlider(0.01, 4, "curv");
  bakeSlider(0, 50, "min_gap", 1);
  bakeSlider(1, 100, "noise_size", 1);
  bakeSlider(1, 100, "color_size", 1);

  bakeCheckbox = houseFunction(bakeCheckbox, housing);
  bakeCheckbox("Invert", "invert");
  bakeCheckbox("Hexagons smaller than limit are painted", "limit_is_min");
  bakeCheckbox("Random size", "v2s");
  bakeCheckbox("Random color", "rnd_clr");
  bakeCheckbox("Color depends on size", "v2c");

  const seedRnd = createButton("randomize noise");
  seedRnd.addClass("ctrlButton");
  seedRnd.mousePressed(setNewSeed);
  housing.child(seedRnd);

  const resultSave = createButton("save");
  resultSave.addClass("importantButton");
  resultSave.mousePressed(textureSave);
  housing.child(resultSave);
}

function textureSave() {
  saveCanvas(cnv);
}

function setNewSeed() {
  const newNoiseSeed = random(1, 64 << 16);
  cnv.noiseSeed(newNoiseSeed);
  prv.noiseSeed(newNoiseSeed);
  noiseSeed(newNoiseSeed);
}

function makePreview() {
  prv.background(0);
  prv.stroke("blue");
  prv.strokeWeight(3);
  for (let i = 0; i < 1; i += 0.01) {
    const y = remap(i) / (params.hex_size * 0.5);
    prv.point(i * 100, 100 - y * 100);
  }
  prv.stroke("red");
  prv.line(params.limit * 100, 0, params.limit * 100, 100);
}

function draw() {
  makeGrid();
  makePreview();
  image(cnv, 0, 0, winsize, winsize);
  image(prv, winsize - 110, 10);
}
