import palettes from "./palette.js";

let clicking = false;
let context = null;
let brushColor1 = null;
let brushColor2 = null;
let rotation = 0;
let x_skew = 0;
let y_skew = 0;
let x_skew_velocity = 0.001;
let y_skew_velocity = 0.0005;
let rotation_velocity = 0.3; //.1;
let cells = {};
let saved = {};

let palette = null;
let canvas = null;
let enclosedSplort = null;
let splortInterval = null;
let regenInterval = null;
let rotated = false;

let x_step = 24;
let y_step = 28;
let x_size = 21;
let y_size = 21;
let x_offset = 1;
let y_offset = 1;
let max = null;
let min = null;
let x_count = null;
let y_count = null;

let ondown = function() {
  clicking = true;
  brushRegen();
};

let onup = function() {
  clicking = false;
};

let onmove = function(e, graphics, canvas) {
  if (clicking) onclick(e, graphics, canvas);
};

let vecmatrix = function(vec, matrix) {
  const { x, y } = vec;
  const { a, b, c, d } = matrix;
  // how I was wrong:
  //const new_x = x * a + x * c;
  //const new_y = y * b + y * d;
  const new_x = x * a + y * c;
  const new_y = x * b + y * d;
  return { x: new_x, y: new_y };
};

let determinant = function(matrix) {
  let { a, b, c, d } = matrix;
  return a * d - b * c;
};

let inversematrix = function(matrix) {
  const { a, b, c, d } = matrix;
  const inverter = 1 / determinant(matrix);
  return {
    a: inverter * d,
    b: inverter * -b,
    c: inverter * -c,
    d: inverter * a
  };
};

let onclick = function(event, graphics, canvas) {
  const { a, b, c, d, e, f } = graphics.getTransform();
  const event_x = event.clientX - max * 0.5;
  const event_y = event.clientY - max * 0.5;

  let { x, y } = vecmatrix(
    { x: event_x, y: event_y },
    inversematrix({ a, b, c, d })
  );

  x = x_count / 2 + parseInt(Math.round(x / x_step));
  y = y_count / 2 + parseInt(Math.round(y / y_step));

  cells[get_key(x - 1, y - 1)].color = brushColor1;
  cells[get_key(x - 1, y)].color = brushColor1;
  cells[get_key(x - 1, y + 1)].color = brushColor1;
  cells[get_key(x, y - 1)].color = brushColor1;
  cells[get_key(x, y)].color = brushColor1;
  cells[get_key(x, y + 1)].color = brushColor1;
  cells[get_key(x + 1, y - 1)].color = brushColor1;
  cells[get_key(x + 1, y)].color = brushColor1;
  cells[get_key(x + 1, y + 1)].color = brushColor1;
};

let randomNumber = function(max) {
  return parseInt(Math.floor(Math.random() * max));
};

let randomFillStyle = function() {
  let r = randomNumber(128) + 64,
    g = randomNumber(64) + 64,
    b = randomNumber(64) + 64;
  return "rgb(" + r + ", " + g + ", " + b + ")";
};

let randomSelection = function(array) {
  return array[randomNumber(array.length)];
};

let get_key = function(a, b) {
  return `${a},${b}`;
};

let gen = function() {
  let x_inc = 0;
  let y_inc = 0;
  let color = getPalette()[1];

  for (x_inc = 0; x_inc <= x_count; x_inc++) {
    for (y_inc = 0; y_inc <= y_count; y_inc++) {
      let key = get_key(x_inc, y_inc);
      if (!cells[key]) {
        cells[key] = { color: color, x: x_inc, y: y_inc };
      }
    }
  }
};

let brushRegen = function() {
  brushColor1 = randomSelection(getPalette());
  brushColor2 = randomSelection(getPalette());
};

let regen = function() {
  let x_inc = 0;
  let y_inc = 0;
  let color = getPalette()[1];

  for (const key in saved) {
    let x_dir_choice = randomNumber(3) - 1;
    let y_dir_choice = randomNumber(3) - 1;
    let old_x = cells[key].x;
    let old_y = cells[key].y;
    let new_cell = cells[get_key(old_x + x_dir_choice, old_y + y_dir_choice)];
    if (new_cell) {
      new_cell.color = cells[key].color;
    }
    y_dir_choice = randomNumber(2) - 1;
    let new_cell2 = cells[get_key(old_x + x_dir_choice, old_y + y_dir_choice)];
    if (new_cell2) {
      new_cell2.color = cells[key].color;
    }
  }
  for (let i = 0; i < 60; i++) {
    let x = randomNumber(x_count);
    let y = randomNumber(y_count);
    let key = get_key(x, y);
    cells[key].color = randomSelection(getPalette());
    saved[key] = cells[key];
  }
};

let splort = function(graphics, palette) {
  let x_inc = 0;
  let y_inc = 0;

  const currentTransform = graphics.getTransform();
  graphics.setTransform(1, 0, 0, 1, 0, 0);
  graphics.clearRect(0, 0, canvas.width, canvas.height);

  graphics.setTransform(
    currentTransform.a,
    currentTransform.b - y_skew,
    currentTransform.c - x_skew,
    currentTransform.d,
    currentTransform.e,
    currentTransform.f
  );
  graphics.translate(max, max);
  graphics.rotate(-rotation);

  rotation += (Math.PI / 180) * rotation_velocity;
  if (rotation > 6 || rotation < 0) rotation_velocity *= -1;
  x_skew += x_skew_velocity;
  y_skew += y_skew_velocity;
  if (x_skew > 0.1 || x_skew < -0.1) x_skew_velocity *= -1;
  if (y_skew > 0.1 || y_skew < -0.05) y_skew_velocity *= -1;

  graphics.rotate(rotation);
  graphics.translate(-max, -max);

  const laterTransform = graphics.getTransform();
  graphics.setTransform(
    laterTransform.a,
    laterTransform.b + y_skew,
    laterTransform.c + x_skew,
    laterTransform.d,
    laterTransform.e,
    laterTransform.f
  );

  for (x_inc = 0; x_inc <= x_count; x_inc++) {
    for (y_inc = 0; y_inc <= y_count; y_inc++) {
      graphics.fillStyle = cells[get_key(x_inc, y_inc)].color;
      let x = x_inc * x_step;
      let y = y_inc * y_step;
      if (x_inc % 2) {
        y -= 14;
      }
      graphics.beginPath();
      graphics.moveTo(x - 16, y);
      graphics.lineTo(x - 8, y + 14);
      graphics.lineTo(x + 8, y + 14);
      graphics.lineTo(x + 16, y);
      graphics.lineTo(x + 8, y - 14);
      graphics.lineTo(x - 8, y - 14);
      graphics.closePath();
      graphics.fill();
    }
  }
};

let encloseSplort = function(fn, context, palette) {
  return function() {
    return fn(context, palette);
  };
};

let enclosedClick = function(fn, context, canvas) {
  return function(event) {
    return fn(event, context, canvas);
  };
};

let generatePalette = function(size) {
  let palette = [];
  size = size || randomNumber(2) + 2;
  for (let i = 0; i < size; i++) {
    palette.push(randomFillStyle());
  }
  return palette;
};

let clearAllIntervals = function() {
  for (let i = 0; i < 60000; i++) {
    clearInterval(i);
    clearTimeout(i);
  }
};

let newGlobalPalette = function(size) {
  return function() {
    //setPalette(generatePalette(size));
    setPalette(randomSelection(palettes));
  };
};

let setPalette = function(_palette) {
  palette = _palette;
  console.log(_palette);
};

let getPalette = function() {
  return palette;
};

window.onload = () => {
  canvas = document.getElementById("canvas");
  canvas.addEventListener("pointerdown", ondown);
  canvas.addEventListener("pointerup", onup);
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  max = Math.max(canvas.width, canvas.height);
  min = Math.min(canvas.width, canvas.height);
  x_count = parseInt(Math.round(max / x_step)) * 2;
  y_count = parseInt(Math.round(max / y_step)) * 2;
  if (x_count % 2) x_count++;
  if (y_count % 2) y_count++;
  context = canvas.getContext("2d");
  context.translate(-max / 2, -max / 2);
  canvas.addEventListener("click", enclosedClick(onclick, context, canvas));
  canvas.addEventListener(
    "pointermove",
    enclosedClick(onmove, context, canvas)
  );
  enclosedSplort = encloseSplort(splort, context);
  splortInterval = setInterval(enclosedSplort, 30);
  regenInterval = setInterval(regen, 400);
  setPalette(randomSelection(palettes));
  gen();
  regen();
  //clearAllIntervals();
};

window.addEventListener("resize", function() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  max = Math.max(canvas.width, canvas.height);
  min = Math.min(canvas.width, canvas.height);
  x_count = parseInt(Math.round(max / x_step)) * 2;
  y_count = parseInt(Math.round(max / y_step)) * 2;
  context.translate(-max / 2, -max / 2);
  if (x_count % 2) x_count++;
  if (y_count % 2) y_count++;
  clearAllIntervals();
  gen();
  enclosedSplort = encloseSplort(splort, context);
  splortInterval = setInterval(enclosedSplort, 30);
  regenInterval = setInterval(regen, 400);
  //regenBrushInterval = setInterval(brushRegen, 1000);
  setPalette(randomSelection(palettes));
});
