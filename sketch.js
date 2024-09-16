textureSize = 4096;
gridWidth = textureSize;
gridHeight = textureSize;
winsize = null;

params = {
  hex_size: 100,
  slope: 1,
  gain: 0,
  curv: 1,
  limit: 0.15,
  min_gap: 3,
  noise_size: 10,
  color_size: 10,
  invert: false,
  v2c: false,
  v2s: true,
  rnd_clr: true,
};

let cnv = null;
let prv = null;

function drawHexagon(cX, cY, r) {
  cnv.beginShape();
  for (let a = 0; a < TAU; a += TAU / 6) {
    cnv.vertex(cX + r * cos(a), cY + r * sin(a));
  }
  cnv.endShape(CLOSE);
}

function getHexSize(x, y) {
  ns = params.noise_size * 0.0001;
  noise_val = noise(x * ns, y * ns);
  return remap(noise_val);
}

min_noise = 4;
max_noise = -4;

function remap(x) {
  if (x < params.limit) {
    return 0;
  }

  let y = pow(x, params.curv) * params.slope + params.gain;

  y = constrain(y, 0, 1);
  if (params.invert) {
    y = 1 - y;
  }

  return constrain(
    y * (params.hex_size * 0.5 + 1),
    0,
    params.hex_size * 0.5 - params.min_gap + 1
  );
}

function get_rnd_clr(x, y) {
  ns = params.color_size * 0.0001;
  noise_val = noise(1 - x * ns, 1 - y * ns);
  return noise_val;
}

function makeGrid() {
  cnv.fill(255);
  count = 0;
  limit = params.limit;
  hexagonSize = params.hex_size;

  let nv;

  for (y = 0; y < gridHeight; y += hexagonSize / 2.3) {
    for (x = 0; x < gridWidth; x += hexagonSize * 1.5) {
      nv = getHexSize(x, y);
      let clr_val = 255;
      if (params.v2c) {
        clr_val = (nv / (hexagonSize * 0.5 - params.min_gap)) * 255;
        cnv.fill(clr_val);
      }
      if (params.rnd_clr) {
        cnv.fill(clr_val * get_rnd_clr(x, y));
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

function bake_slider(min_val, max_val, param, house, step = 0.01) {
  let h = createDiv();
  h.style("display", "flex");

  print(params, param, params[param]);
  let s = createSlider(min_val, max_val, params[param], step);
  s.size(160);

  let p = createP();
  let label = createP(param);
  label.style("min-width", "5em");

  function update_val() {
    print(`${param} updated!: ${s.value()}`);
    p.html(s.value());
    params[param] = s.value();
  }

  s.input(update_val);

  h.child(label);
  h.child(s);
  h.child(p);

  if (house) {
    house.child(h);
  }

  p.html(params[param]);

  return h;
}

function create_sliders() {
  housing = createDiv();
  housing.position(0, 0);
  housing.style("display", "flex");
  housing.style("flex-direction", "column");
  housing.style("background-color", "white");
  housing.style("padding", "1em");

  let hexagonSize = params.hex_size;

  h0 = bake_slider(40, 300, "hex_size", housing, 1);
  h1 = bake_slider(-6, 6, "slope", housing);
  h2 = bake_slider(-6, 6, "gain", housing);
  h3 = bake_slider(0, 1, "limit", housing, 0.01);
  h4 = bake_slider(0.01, 4, "curv", housing);
  h5 = bake_slider(0, 50, "min_gap", housing, 1);
  h6 = bake_slider(1, 80, "noise_size", housing, 1);
  h7 = bake_slider(1, 80, "color_size", housing, 1);
  // housing.child(h5)

  cb = createCheckbox("Invert", params.invert);
  cb.changed(invert_changed);
  housing.child(cb);

  val2clr = createCheckbox("Value to Color", params.v2c);
  val2clr.changed(v2c_changed);
  housing.child(val2clr);

  val2size = createCheckbox("Value to Size", params.v2s);
  val2size.changed(v2s_changed);
  housing.child(val2size);

  rnd_clr = createCheckbox("Random Color", params.rnd_clr);
  rnd_clr.changed(rnd_clr_changed);
  housing.child(rnd_clr);

  scr_btn = createButton("save");
  scr_btn.mousePressed(scr_save);
  housing.child(scr_btn);
}

function invert_changed() {
  params.invert = this.checked();
}

function v2c_changed() {
  params.v2c = this.checked();
}

function v2s_changed() {
  params.v2s = this.checked();
}

function rnd_clr_changed() {
  params.rnd_clr = this.checked();
}

function scr_save() {
  saveCanvas(cnv);
}

function setup() {
  winsize = min(windowWidth, windowHeight);
  createCanvas(winsize, winsize);
  cnv = createGraphics(4096, 4096);

  prv = createGraphics(100, 100);

  create_sliders();
}

function draw() {
  cnv.background(0);
  prv.background(0);
  prv.stroke("blue");
  prv.strokeWeight(3);

  for (let i = 0; i < 1; i += 0.01) {
    y = remap(i) / (params.hex_size * 0.5);
    prv.point(i * 100, 100 - (remap(i) / (params.hex_size * 0.5)) * 100);
  }
  prv.stroke("red");
  prv.line(params.limit * 100, 0, params.limit * 100, 100);

  cnv.noStroke();
  makeGrid(cnv);
  image(cnv, 0, 0, winsize, winsize);
  image(prv, winsize - 110, 10);
}
