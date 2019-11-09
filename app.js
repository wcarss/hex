import palettes from "./palette.js";

let clicking = false;
let context = null;
let brushColor1 = null;
let brushColor2 = null;
let brushColor1Index = null;
let brushColor2Index = null;
let rotation = 0;
let x_skew = 0;
let y_skew = 0;
let x_skew_velocity = 0.001;
let y_skew_velocity = 0.001;
let rotation_velocity = 0.3 * (Math.PI / 180); //.1;
let cells = {};
let saved = {};

let palette = null;
let canvas = null;
let enclosedSplort = null;
let splortInterval = null;
let paletteChangeInterval = null;
let clearBoardInterval = null;
let regenInterval = null;
let rotated = false;

let x_step = 24;
let y_step = 28;
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

  cells[get_key(x - 3, y - 1)].color = brushColor1;
  cells[get_key(x - 4, y)].color = brushColor1;
  cells[get_key(x - 2, y + 1)].color = brushColor1;
  cells[get_key(x, y - 1)].color = brushColor1;
  cells[get_key(x, y)].color = brushColor1;
  cells[get_key(x, y + 1)].color = brushColor1;
  cells[get_key(x + 3, y - 1)].color = brushColor1;
  cells[get_key(x + 2, y)].color = brushColor1;
  cells[get_key(x + 4, y + 1)].color = brushColor1;
  cells[get_key(x - 3, y - 1)].color_index = brushColor1Index;
  cells[get_key(x - 4, y)].color_index = brushColor1Index;
  cells[get_key(x - 2, y + 1)].color_index = brushColor1Index;
  cells[get_key(x, y - 1)].color_index = brushColor1Index;
  cells[get_key(x, y)].color_index = brushColor1Index;
  cells[get_key(x, y + 1)].color_index = brushColor1Index;
  cells[get_key(x + 3, y - 1)].color_index = brushColor1Index;
  cells[get_key(x + 2, y)].color_index = brushColor1Index;
  cells[get_key(x + 4, y + 1)].color_index = brushColor1Index;

  cells[get_key(x - 1, y - 1)].color = brushColor1;
  cells[get_key(x - 1, y)].color = brushColor1;
  cells[get_key(x - 1, y + 1)].color = brushColor1;
  cells[get_key(x, y - 1)].color = brushColor1;
  cells[get_key(x, y)].color = brushColor1;
  cells[get_key(x, y + 1)].color = brushColor1;
  cells[get_key(x + 1, y - 1)].color = brushColor1;
  cells[get_key(x + 1, y)].color = brushColor1;
  cells[get_key(x + 1, y + 1)].color = brushColor1;
  cells[get_key(x - 1, y - 1)].color_index = brushColor1Index;
  cells[get_key(x - 1, y)].color_index = brushColor1Index;
  cells[get_key(x - 1, y + 1)].color_index = brushColor1Index;
  cells[get_key(x, y - 1)].color_index = brushColor1Index;
  cells[get_key(x, y)].color_index = brushColor1Index;
  cells[get_key(x, y + 1)].color_index = brushColor1Index;
  cells[get_key(x + 1, y - 1)].color_index = brushColor1Index;
  cells[get_key(x + 1, y)].color_index = brushColor1Index;
  cells[get_key(x + 1, y + 1)].color_index = brushColor1Index;
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

let gen = function(refresh = false) {
  let x_inc = 0;
  let y_inc = 0;
  let palette = getPalette();
  let default_color = palette[1];
  let color = default_color;
  let color_index = 1;

  for (x_inc = 0; x_inc <= x_count; x_inc++) {
    for (y_inc = 0; y_inc <= y_count; y_inc++) {
      let key = get_key(x_inc, y_inc);
      if (Math.random() > 0.28) {
        color_index = randomNumber(palette.length);
        color = palette[color_index];
      }
      if (!cells[key]) {
        cells[key] = {
          color: default_color,
          color_index: 1,
          x: x_inc,
          y: y_inc
        };
      }
      if (refresh) {
        //cells[key].new_color = color;
        //celld[key].new_color_index = color_index % palette.length;
        cells[key].color_index = cells[key].color_index % palette.length;
        cells[key].new_color = palette[cells[key].color_index];
      }
    }
  }
};

let brushRegen = function() {
  let palette = getPalette();
  brushColor1Index = randomNumber(palette.length);
  brushColor2Index = randomNumber(palette.length);
  brushColor1 = palette[brushColor1Index];
  brushColor2 = palette[brushColor2Index];
};

let regen = function() {
  let x_inc = 0;
  let y_inc = 0;
  let palette = getPalette();
  let default_color = palette[1];
  let color = default_color;

  for (const key in saved) {
    let x_dir_choice = randomNumber(3) - 1;
    let y_dir_choice = randomNumber(3) - 1;
    let old_x = cells[key].x;
    let old_y = cells[key].y;
    let new_cell = cells[get_key(old_x + x_dir_choice, old_y + y_dir_choice)];
    if (new_cell) {
      new_cell.color_index = cells[key].color_index % palette.length;
      new_cell.color = cells[key].color;
    }
    y_dir_choice = randomNumber(2) - 1;
    //let new_cell2 = cells[get_key(old_x + x_dir_choice, old_y + y_dir_choice)];
    //if (new_cell2) {
    //  new_cell2.color = cells[key].color;
    //  new_cell2.color_index = cells[key].color_index % palette.length;
    // }
  }
  for (let i = 0; i < 40; i++) {
    let x = randomNumber(x_count);
    let y = randomNumber(y_count);
    let key = get_key(x, y);
    cells[key].color_index = randomNumber(palette.length);
    cells[key].color = palette[cells[key].color_index];
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

  rotation += rotation_velocity;
  if (rotation > 6 || rotation < 0) rotation_velocity *= -1;
  x_skew += x_skew_velocity;
  y_skew += y_skew_velocity;
  if (x_skew > 0.25 || x_skew < -0.1) x_skew_velocity *= -1;
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
      if (cells[get_key(x_inc, y_inc)].new_color) {
        let cell = cells[get_key(x_inc, y_inc)];
        let new_color = cell.new_color;
        let new_x = x_inc;
        let new_y = y_inc;
        delete cells[get_key(new_x, new_y)].new_color;
        setTimeout(() => {
          graphics.fillStyle = new_color;
          graphics.beginPath();
          graphics.moveTo(x - 16, y);
          graphics.lineTo(x - 8, y + 14);
          graphics.lineTo(x + 8, y + 14);
          graphics.lineTo(x + 16, y);
          graphics.lineTo(x + 8, y - 14);
          graphics.lineTo(x - 8, y - 14);
          graphics.closePath();
          graphics.fill();
          cells[get_key(new_x, new_y)].color = new_color;
        }, randomNumber(2000) + 50);
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

let changePalettes = function() {
  setPalette(randomSelection(palettes));
};

let clearBoard = function() {
  gen(true);
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
  context = canvas.getContext("2d");
  context.translate(-max / 2, -max / 2);
  canvas.addEventListener("click", enclosedClick(onclick, context, canvas));
  canvas.addEventListener(
    "pointermove",
    enclosedClick(onmove, context, canvas)
  );
  enclosedSplort = encloseSplort(splort, context);
  splortInterval = setInterval(enclosedSplort, 30);
  regenInterval = setInterval(regen, 700);
  paletteChangeInterval = setInterval(changePalettes, 29500);
  clearBoardInterval = setInterval(clearBoard, 30000);
  setPalette(randomSelection(palettes));
  gen();
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
  clearInterval(splortInterval);
  //clearAllIntervals();
  gen();
  enclosedSplort = encloseSplort(splort, context);
  splortInterval = setInterval(enclosedSplort, 30);
  //regenInterval = setInterval(regen, 1000);
  //paletteChangeInterval = setInterval(changePalettes, 30000);
  //clearBoardInterval = setInterval(clearBoard, 60000);
  //setInterval(changePalettes, 30000);
  //regenBrushInterval = setInterval(brushRegen, 1000);
  //setPalette(randomSelection(palettes));
});
