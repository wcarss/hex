import palettes from "./palette.js";

let clicking = false;
let context = null;
let brushColor1 = null;
let brushColor2 = null;
let rotation = 0.0;
let x_skew = 0.0;
let y_skew = 0;
let x_skew_velocity = 0;
let y_skew_velocity = 0;
let rotation_velocity = 0.05;
let cells = {};
let saved = {};

let palette = null;
let canvas = null;
let enclosedSplort = null;
let splortInterval = null;
let regenInterval = null;
let rotated = false;

let ondown = function() {
  clicking = true;
  brushRegen();
};

let onup = function() {
  clicking = false;
};

let onmove = function(e) {
  if (clicking) onclick(e);
};

let onclick = function(e) {
  let x_step = 24,
    y_step = 28,
    x_size = 21,
    y_size = 21,
    max = Math.max(canvas.width, canvas.height),
    x_count = parseInt(Math.round(canvas.width / x_step)),
    y_count = parseInt(Math.round(canvas.height / y_step));
  if (x_count % 2) x_count++;
  if (y_count % 2) y_count++;
  //console.log('x_count, y_count: ', x_count, ', ', y_count);
  const event_x = e.clientX - canvas.width / 2; //+max/2;
  const event_y = e.clientY - canvas.height / 2; //+max/2;
  const radius = Math.sqrt(event_x * event_x + event_y * event_y);
  const x_sign = event_x > 0 ? 1 : -1;
  const y_sign = event_y > 0 ? 1 : -1;
  const current_angle_x = Math.acos(event_x / radius);
  const current_angle_y = Math.asin(event_y / radius);
  const current_angle_tan = Math.atan2(event_y, event_x);
  //console.log('x angle: ', current_angle_x*(180/Math.PI));
  //console.log("tan angle: ", current_angle_tan * (180 / Math.PI));
  //console.log('current angle: ', current_angle);
  const rot_x = radius * Math.cos(current_angle_tan - rotation); //*Math.sqrt(event_x*event_x+event_y*event_y);
  const rot_y = radius * Math.sin(current_angle_tan - rotation); //*Math.sqrt(event_x*event_x+event_y*event_y);
  //console.log('event_x, event_y: ', event_x, ', ', event_y);
  let x_denom = x_step; //(x_step*(1+x_skew));
  let y_denom = y_step; //(y_step*0.75*(1+y_skew));
  //console.log('x_denom, y_denom: ', x_denom, ', ', y_denom);
  let x_dist = rot_x / x_denom;
  let y_dist = rot_y / y_denom;
  //console.log('x_dist, y_dist: ', x_dist, ', ', y_dist);
  let x = parseInt(Math.round(x_dist));
  let y = parseInt(Math.round(y_dist));
  //console.log('x, y: ', x, ', ', y);
  //let color1 = randomSelection(getPalette());
  //let color2 = randomSelection(getPalette());
  //cells[get_key(x-1, y-1)].color = brushColor1;
  cells[get_key(x_count / 2 + x - 1, y_count / 2 + y)].color = brushColor1;
  cells[get_key(x_count / 2 + x - 1, y_count / 2 + y + 1)].color = brushColor1;
  cells[get_key(x_count / 2 + x, y_count / 2 + y - 1)].color = brushColor1;
  cells[get_key(x_count / 2 + x, y_count / 2 + y)].color = brushColor1;
  cells[get_key(x_count / 2 + x, y_count / 2 + y + 1)].color = brushColor1;
  cells[get_key(x_count / 2 + x + 1, y_count / 2 + y - 1)].color = brushColor1;
  cells[get_key(x_count / 2 + x + 1, y_count / 2 + y)].color = brushColor1;
  //cells[get_key(x+1, y+1)].color = brushColor1;
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
  let x_step = 24,
    y_step = 28,
    x_size = 21,
    y_size = 21,
    max = Math.max(canvas.width, canvas.height),
    x_count = parseInt(Math.round(canvas.width / x_step)),
    y_count = parseInt(Math.round(canvas.height / y_step)),
    x_offset = 1,
    y_offset = 1,
    x_inc = 0,
    y_inc = 0;

  let color = getPalette()[1];
  if (x_count % 2) x_count++;
  if (y_count % 2) y_count++;
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
  //console.log('regening');
  let x_step = 24,
    y_step = 28,
    x_size = 21,
    y_size = 21,
    max = Math.max(canvas.width, canvas.height),
    x_count = parseInt(Math.round(canvas.width / x_step)),
    y_count = parseInt(Math.round(canvas.height / y_step)),
    x_offset = 1,
    y_offset = 1,
    x_inc = 0,
    y_inc = 0;

  let color = getPalette()[1];
  if (x_count % 2) x_count++;
  if (y_count % 2) y_count++;
  for (const key in saved) {
    //console.log(key);
    //let x = randomNumber(x_count*2)-x_count;
    //let y = randomNumber(y_count*2)-y_count;
    //let key = get_key(x, y);
    let x_dir_choice = randomNumber(3) - 1;
    let y_dir_choice = randomNumber(3) - 1;
    let old_x = cells[key].x;
    let old_y = cells[key].y;
    let new_cell = cells[get_key(old_x + x_dir_choice, old_y + y_dir_choice)];
    if (new_cell) {
      //console.log('color: ', cells[key].color);
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
  let x_step = 24,
    y_step = 28,
    x_size = 21,
    y_size = 21,
    max = Math.max(canvas.width, canvas.height),
    min = Math.min(canvas.width, canvas.height),
    x_count = parseInt(Math.round(canvas.width / x_step)),
    y_count = parseInt(Math.round(canvas.height / y_step)),
    x_offset = 1,
    y_offset = 1,
    x_inc = 0,
    y_inc = 0;
  if (rotation > 4 || rotation < 0) rotation_velocity *= -1;
  x_skew += x_skew_velocity;
  y_skew += y_skew_velocity;
  if (x_skew > 0.1 || x_skew < -0.1) x_skew_velocity *= -1;
  if (y_skew > 0.1 || y_skew < -0.1) y_skew_velocity *= -1;
  //graphics.setTransform(0.8,x_skew,y_skew,0.8,canvas.width/2,canvas.height/2);
  graphics.translate(canvas.width / 2, canvas.height / 2);
  graphics.rotate(-rotation); //graphics.setTransform(1,x_skew,y_skew,1,0,0);
  rotation += (Math.PI / 180) * rotation_velocity;
  graphics.rotate(rotation);
  //if(!rotated) {
  //graphics.rotate(rotation);
  //  rotated = true;
  // }
  graphics.translate(-canvas.width / 2, -canvas.height / 2);
  //graphics.setTransform(1,x_skew,y_skew,1,0,0);
  if (x_count % 2) x_count++;
  if (y_count % 2) y_count++;
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
    fn(context, palette);
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
  canvas.addEventListener("pointermove", onmove);
  canvas.addEventListener("click", onclick);
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  context = canvas.getContext("2d");
  enclosedSplort = encloseSplort(splort, context);
  splortInterval = setInterval(enclosedSplort, 30);
  regenInterval = setInterval(regen, 400);
  setPalette(randomSelection(palettes));
  gen();
  regen();
  //console.log(cells);
  //clearAllIntervals();
};

window.addEventListener("resize", function() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  clearAllIntervals();
  gen();
  //      saved = {};
  enclosedSplort = encloseSplort(splort, context);
  splortInterval = setInterval(enclosedSplort, 30);
  regenInterval = setInterval(regen, 400);
  //regenBrushInterval = setInterval(brushRegen, 1000);
  setPalette(randomSelection(palettes));
});
