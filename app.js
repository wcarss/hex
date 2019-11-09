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
  //const event_x = event.clientX + max; // - max * 0.5;
  //const event_y = event.clientY + max; // - max * 0.5;

  const radius = Math.sqrt(event_x * event_x + event_y * event_y);
  const x_sign = event_x > 0 ? 1 : -1;
  const y_sign = event_y > 0 ? 1 : -1;
  //const current_angle_x = Math.acos(x / radius);
  //const current_angle_y = Math.asin(y / radius);
  const current_angle_tan = Math.atan2(event_y, event_x);
  //console.log('x angle: ', current_angle_x*(180/Math.PI));
  //console.log("tan angle: ", current_angle_tan * (180 / Math.PI));
  //console.log('current angle: ', current_angle);
  const rot_x = radius * Math.cos(current_angle_tan - rotation); //*Math.sqrt(event_x*event_x+event_y*event_y);
  const rot_y = radius * Math.sin(current_angle_tan - rotation); //*Math.sqrt(event_x*event_x+event_y*event_y);

  let { x, y } = vecmatrix(
    { x: event_x, y: event_y },
    inversematrix({
      a,
      b, //(b * event_x) / canvas.width,
      c, //(c * event_y) / canvas.height,
      d
    })
  );
  // console.log(
  //   `transform! a: ${a}, b: ${b}, c: ${c}, d: ${d}, e: ${e}, f: ${f}`
  // );
  console.log(`transform! x: ${x}, y: ${y}`);
  //
  //x = x + e;
  //y = y + f;
  //console.log('x_count, y_count: ', x_count, ', ', y_count);
  //const event_x = e.clientX - max * 0.75; // - x_skew * (canvas.height / 2 - e.clientY); //+max/2;
  //const event_y = e.clientY - max / 2; // - y_skew * (canvas.width / 2 - e.clientX); //+max/2;

  const skew_rot_x = rot_x - ((x_skew * canvas.height) / 2 - rot_y);
  const skew_rot_y = rot_y - ((y_skew * canvas.width) / 2 - rot_x);
  //console.log('event_x, event_y: ', event_x, ', ', event_y);
  let x_denom = x_step; //(x_step*(1+x_skew));
  let y_denom = y_step; //(y_step*0.75*(1+y_skew));
  //console.log('x_denom, y_denom: ', x_denom, ', ', y_denom);
  let x_dist = x / x_denom; // + ((canvas.height - rot_y) / y_denom) * x_skew;
  let y_dist = y / y_denom;
  //console.log('x_dist, y_dist: ', x_dist, ', ', y_dist);
  x = parseInt(Math.round(x_dist));
  //let x = parseInt(
  //  Math.round(x_dist - x_skew * (y_count / 2 - Math.round(y_dist)))
  //);
  y = parseInt(Math.round(y_dist));
  //console.log('x, y: ', x, ', ', y);
  //let color1 = randomSelection(getPalette());
  //let color2 = randomSelection(getPalette());
  //cells[get_key(x - 1, y - 1)].color = brushColor1;
  console.log(
    `fully transformed: x, y: ${x_count / 2 + x},${y_count / 2 +
      y} -- of x_count,y_count ${x_count},${y_count}`
  );
  // console.log(
  //   `fully transformed: x, y: ${x},${y} -- of x_count,y_count ${x_count},${y_count}`
  // );
  cells[get_key(x_count / 2 + x - 1, y_count / 2 + y)].color = brushColor1;
  cells[get_key(x_count / 2 + x - 1, y_count / 2 + y + 1)].color = brushColor1;
  cells[get_key(x_count / 2 + x, y_count / 2 + y - 1)].color = brushColor1;
  cells[get_key(x_count / 2 + x, y_count / 2 + y)].color = brushColor1; //randomSelection([
  // //  "blue",
  // //  "green"
  // //]);
  // //cells[
  // //  get_key(
  // //    x_count / 2 + x - parseInt(Math.round(x_skew * (y_count / 2 - y))),
  // //    y_count / 2 + y
  // //  )
  // //].color = "black";
  cells[get_key(x_count / 2 + x, y_count / 2 + y + 1)].color = brushColor1;
  cells[get_key(x_count / 2 + x + 1, y_count / 2 + y - 1)].color = brushColor1;
  cells[get_key(x_count / 2 + x + 1, y_count / 2 + y)].color = brushColor1;
  cells[get_key(x_count / 2 + x, y_count / 2 + y)].color = brushColor1;
  cells[get_key(x, y)].color = brushColor1;
  //cells[get_key(x_count / 2 + x - 1, y_count / 2 + y)].color = brushColor1;
  // cells[get_key(x - 1, y + 1)].color = brushColor1;
  // cells[get_key(x, y - 1)].color = brushColor1;
  // cells[get_key(x, y)].color = brushColor1;
  // cells[get_key(x, y + 1)].color = brushColor1;
  // cells[get_key(x + 1, y - 1)].color = brushColor1;
  // cells[get_key(x + 1, y)].color = brushColor1;
  // cells[get_key(x + 1, y + 1)].color = brushColor1;
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

  //if (x_count % 2) x_count++;
  //if (y_count % 2) y_count++;
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
  //console.log(x_skew);
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

  //if (x_count % 2) x_count++;
  //if (y_count % 2) y_count++;
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
  x_count = parseInt(Math.round(max / x_step)) * 2.5;
  y_count = parseInt(Math.round(max / y_step)) * 2.5;
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
