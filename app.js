import palettes from "./palette.js";

let clicking = true;
let context = null;
let brushColor1 = null;
let brushColor2 = null;
let brushColor1Index = null;
let brushColor2Index = null;
let rotation = 0;
let rotation_velocity =
  Math.random() > 0.5 ? 0.14 * (Math.PI / 180) : -0.14 * (Math.PI / 180);
let rotation_min = Math.random() - Math.random() * 2;
let rotation_max = Math.random() * 2 + 4 - Math.random();
let x_skew = 0;
let y_skew = 0;
let x_skew_velocity = Math.random() > 0.5 ? 0.0025 : -0.0025;
let y_skew_velocity = Math.random() > 0.5 ? 0.0015 : -0.0015;
let x_skew_min = -0.18 + Math.random() * 0.15;
let x_skew_max = 0.28 - Math.random() * 0.1;
let y_skew_min = -0.3 + Math.random() * 0.15;
let y_skew_max = 0.2 - Math.random() * 0.1;
let zoom = 1;
let zoom_velocity = Math.random() > 0.5 ? 0.0015 : -0.0015;
let zoom_min = 0.75 + Math.random() * 0.2;
let zoom_max = 1.7 - Math.random() * 0.5;
let zoom_slowdown = 0.12;
let zoom_change = 0;
let new_graphics_type = undefined;
let size_spec = Math.random() * 3 + 1;
if (Math.random() > 0.94 || navigator.maxTouchPoints !== 0) {
  size_spec = Math.random() * 30 + 5;
}
let x_step = 24 * size_spec;
let y_step = 28 * size_spec;
let puke_x = Math.random() * x_step * 2 + 4;
let puke_y = Math.random() * y_step * 2 + 4;
let circle_speeds = [
  0.02 * size_spec,
  0.02 * size_spec,
  0.02 * size_spec,
  0.05 * size_spec,
  0.05 * size_spec,
  0.1 * size_spec,
  0.1 * size_spec,
  0.1 * size_spec,
  0.1 * size_spec,
  0.1 * size_spec,
  0.1 * size_spec,
  0.1 * size_spec,
  0.5 * size_spec,
  1 * size_spec
];
let graphics_type = 0;
// 0 - hex
// 1 - squares
// 2 - clouds
// 3 - circles

let cells = {};
let saved = {};
let saved_count = 0;
let saved_max = 300;

let palette = null;
let canvas = null;
let enclosedSplort = null;
let splortInterval = null;
let paletteChangeInterval = null;
let clearBoardInterval = null;
let regenInterval = null;
let rotated = false;

let max = null;
let min = null;
let x_count = null;
let y_count = null;

let ondown = function() {};

let onup = function() {
  clicking = !clicking;
  brushRegen();
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

  cells[get_key(x, y)].color = brushColor1;
  cells[get_key(x, y - 1)].color = brushColor1;
  cells[get_key(x, y)].color_index = brushColor1Index;
  cells[get_key(x, y - 1)].color_index = brushColor1Index;
  // if (graphics_type !== 2) {
  //
  //   cells[get_key(x + 1, y)].color = brushColor1;
  //   cells[get_key(x + 1, y + 1)].color = brushColor1;
  //
  //
  //   cells[get_key(x + 1, y)].color_index = brushColor1Index;
  //   cells[get_key(x + 1, y + 1)].color_index = brushColor1Index;
  // }
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

let gen = function(refresh = false, first = false) {
  let x_inc = 0;
  let y_inc = 0;
  if (refresh) {
    changePalettes();
    brushRegen();
    let choice = Math.random();
    if (
      (graphics_type === 0 && choice > 0.15) ||
      (graphics_type === 1 && choice > 0.15) ||
      (graphics_type === 2 && choice > 0.15) ||
      (graphics_type === 3 && choice > 0.15)
    ) {
      new_graphics_type = randomSelection([0, 1, 2, 3]);
      console.log("switching to type ", new_graphics_type);
      setTimeout(
        () => {
          graphics_type = new_graphics_type;
          new_graphics_type = undefined;
        },
        new_graphics_type === 1 ? 250 : 2000
      );
    }
  }
  let palette = getPalette();
  let default_color = palette[1];
  let color = default_color;
  let color_index = 1;

  for (x_inc = 0; x_inc <= x_count; x_inc++) {
    for (y_inc = 0; y_inc <= y_count; y_inc++) {
      let key = get_key(x_inc, y_inc);
      if (
        (graphics_type === 2 || graphics_type === 3) &&
        Math.random() > 0.28
      ) {
        color_index = randomNumber(palette.length);
        color = palette[color_index];
      }
      if (!cells[key]) {
        cells[key] = {
          color,
          color_index,
          x: x_inc,
          y: y_inc,
          graphics_type,
          circle_size: Math.random() * 8 * size_spec + 6,
          max_circle_size: randomSelection([
            8 * size_spec,
            10 * size_spec,
            10 * size_spec,
            12 * size_spec,
            12 * size_spec,
            14 * size_spec,
            14 * size_spec,
            14 * size_spec,
            14 * size_spec,
            14 * size_spec,
            20 * size_spec
          ]),
          circle_speed: randomSelection(circle_speeds)
        };
      }
      if (refresh) {
        cells[key].color_index = cells[key].color_index % palette.length;
        cells[key].new_color = palette[cells[key].color_index];
        if (new_graphics_type !== undefined) {
          cells[key].new_graphics_type = new_graphics_type;
        }
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
    if (new_cell && !new_cell.new_color) {
      new_cell.color_index = cells[key].color_index % palette.length;
      new_cell.color = palette[new_cell.color_index];
    }
    if (saved_count > saved_max) {
      delete saved[key];
      saved_count -= 1;
    }
  }
  for (let i = 0; i < randomNumber(100) + 15; i++) {
    let x = randomNumber(x_count);
    let y = randomNumber(y_count);
    let key = get_key(x, y);
    if (cells[key] && !cells[key].new_color) {
      cells[key].color_index = randomNumber(palette.length);
      cells[key].color = palette[cells[key].color_index];
      saved[key] = cells[key];
      saved_count += 1;
    }
  }
};

let splort = function(graphics) {
  let x_inc = 0;
  let y_inc = 0;

  if (graphics_type !== 2) {
    let transform = graphics.getTransform();
    graphics.setTransform(1, 0, 0, 1, 0, 0);
    graphics.clearRect(0, 0, max, max);
    graphics.setTransform(transform);
  }
  graphics.translate(max, max);

  if (rotation > rotation_max || rotation < rotation_min) {
    rotation_velocity *= -1;
    rotation_max = Math.max(rotation, randomNumber(2) + 4 - Math.random());
    rotation_min = Math.min(rotation, Math.random() - randomNumber(2));
  }
  rotation += rotation_velocity;
  if (x_skew > x_skew_max || x_skew < x_skew_min) {
    x_skew_velocity *= -1;
    x_skew_max = Math.max(x_skew, 0.28 - Math.random() * 0.1);
    x_skew_min = Math.min(x_skew, -0.13 + Math.random() * 0.15);
  }
  x_skew += x_skew_velocity;
  if (y_skew > y_skew_max || y_skew < y_skew_min) {
    y_skew_velocity *= -1;
    y_skew_min = Math.min(y_skew, -0.2 + Math.random() * 0.15);
    y_skew_max = Math.max(y_skew, 0.17 - Math.random() * 0.1);
  }
  y_skew += y_skew_velocity;
  if (zoom > zoom_max || zoom < zoom_min) {
    zoom_velocity *= -1;
    zoom_max = Math.max(zoom, 1.7 - Math.random() * 0.5);
    zoom_min = Math.min(zoom, 0.75 + Math.random() * 0.2);
  }
  if (zoom > zoom_max - zoom_slowdown || zoom < zoom_min + zoom_slowdown) {
    zoom_change = zoom_velocity * 0.5;
  } else {
    zoom_change = zoom_velocity;
  }
  zoom += zoom_change;

  graphics.rotate(rotation_velocity);
  graphics.transform(
    1 + zoom_change,
    y_skew_velocity,
    x_skew_velocity,
    1 + zoom_change,
    0,
    0
  );
  graphics.translate(-max, -max);

  for (x_inc = 0; x_inc <= x_count; x_inc++) {
    for (y_inc = 0; y_inc <= y_count; y_inc++) {
      let x = x_inc * x_step;
      let y = y_inc * y_step;
      if (graphics_type === 0 && x_inc % 2) {
        y -= 14 * size_spec;
      }
      if (cells[get_key(x_inc, y_inc)].new_color) {
        let new_x = x_inc;
        let new_y = y_inc;
        let new_color = cells[get_key(new_x, new_y)].new_color;
        setTimeout(() => {
          graphics.fillStyle = new_color;
          let tcell = cells[get_key(new_x, new_y)];
          tcell.graphics_type =
            tcell.new_graphics_type !== undefined
              ? tcell.new_graphics_type
              : tcell.graphics_type;
          delete tcell.new_graphics_type;
          if (tcell.graphics_type === 1) {
            graphics.fillRect(x, y, x_step, y_step);
          } else if (tcell.graphics_type === 3) {
            if (!tcell.circle_size) {
              tcell.circle_size = Math.random() * 8 + 6;
            }
            graphics.beginPath();
            graphics.arc(
              x,
              y,
              tcell.circle_size /*Math.random()*8+6*/,
              0,
              Math.PI * 2
            );
            graphics.fill();
          } else if (tcell.graphics_type === 2) {
            graphics.save();
            if (size_spec > 8) {
              graphics.globalAlpha = 0.6;
            } else {
              graphics.globalAlpha = 0.9;
            }
            graphics.fillRect(
              x + Math.random() * x_step + 4,
              y + Math.random() * y_step + 4,
              x_step - Math.random() * x_step + 4,
              y_step - Math.random() * y_step + 4
            );
            graphics.restore();
          } else if (tcell.graphics_type === 0) {
            if (tcell.graphics_type !== graphics_type) {
              y -= 14;
            }
            graphics.beginPath();
            graphics.moveTo(x - 16 * size_spec, y);
            graphics.lineTo(x - 8 * size_spec, y + 14 * size_spec);
            graphics.lineTo(x + 8 * size_spec, y + 14 * size_spec);
            graphics.lineTo(x + 16 * size_spec, y);
            graphics.lineTo(x + 8 * size_spec, y - 14 * size_spec);
            graphics.lineTo(x - 8 * size_spec, y - 14 * size_spec);
            graphics.closePath();
            graphics.fill();
          } else {
            console.log(
              "tcell graphics type strangeness: ",
              tcell.graphics_type
            );
          }
          tcell.color = new_color;
        }, randomNumber(2000) + 50);
        cells[get_key(new_x, new_y)].new_color = null;
      }
      //graphics.strokeStyle = loop_cell.color;
      graphics.fillStyle = cells[get_key(x_inc, y_inc)].color;
      if (cells[get_key(x_inc, y_inc)].graphics_type === 1) {
        graphics.fillRect(x, y, x_step, y_step);
      } else if (cells[get_key(x_inc, y_inc)].graphics_type === 3) {
        let circle_size = cells[get_key(x_inc, y_inc)].circle_size;
        circle_size += cells[get_key(x_inc, y_inc)].circle_speed;
        if (circle_size > cells[get_key(x_inc, y_inc)].max_circle_size)
          circle_size = 6;
        cells[get_key(x_inc, y_inc)].circle_size = circle_size;
        graphics.beginPath();
        graphics.arc(x, y, circle_size /*Math.random()*8+6*/, 0, Math.PI * 2);
        graphics.fill();
      } else if (cells[get_key(x_inc, y_inc)].graphics_type === 2) {
        graphics.save();
        //graphics.globalCompositeOperation = "destination-out";
        if (size_spec > 8) {
          graphics.globalAlpha = 0.6;
        } else {
          graphics.globalAlpha = 0.9;
        }
        graphics.fillRect(
          x + Math.random() * x_step + 4,
          y + Math.random() * y_step + 4,
          x_step - Math.random() * x_step + 4,
          y_step - Math.random() * y_step + 4
        );
        graphics.restore();
      } else if (cells[get_key(x_inc, y_inc)].graphics_type === 0) {
        graphics.beginPath();
        graphics.moveTo(x - 16 * size_spec, y);
        graphics.lineTo(x - 8 * size_spec, y + 14 * size_spec);
        graphics.lineTo(x + 8 * size_spec, y + 14 * size_spec);
        graphics.lineTo(x + 16 * size_spec, y);
        graphics.lineTo(x + 8 * size_spec, y - 14 * size_spec);
        graphics.lineTo(x - 8 * size_spec, y - 14 * size_spec);
        graphics.closePath();
        graphics.fill();
      } else {
        console.log("tcell graphics type strangeness: ", tcell.graphics_type);
      }
    }
  }
};

let encloseSplort = function(fn, context) {
  return function() {
    return fn(context);
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
  regenInterval = setInterval(
    regen,
    randomNumber(1000) + 200 + randomNumber(500)
  );
  clearBoardInterval = setInterval(clearBoard, randomNumber(15000) + 15000);
  setPalette(randomSelection(palettes));
  gen();
  brushRegen();
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
  gen();
  enclosedSplort = encloseSplort(splort, context);
  splortInterval = setInterval(enclosedSplort, 30);
});
