import * as PIXI from "pixi.js";
import { keyboard } from "./keyboard";
import { Howl, Howler } from "howler";

// const {Howl, Howler} = require('howler');

const app = new PIXI.Application({
  width: 512,
  height: 712,
  backgroundColor: 0x52be80,
});
document.body.appendChild(app.view);

let settings = {
  difficulty: 6,
  rows: 5,
  columns: 5,
};

let cellCount = settings.columns * settings.rows;
let Tablo = new PIXI.Container();
Tablo.height = 200;
app.stage.addChild(Tablo);

let gameBoard = new PIXI.Container();
gameBoard.position.set(6, 206);
gameBoard.width = settings.columns * 100;
gameBoard.height = settings.rows * 100;
app.stage.addChild(gameBoard);
gameBoard.sortableChildren = true;

app.stage.width = gameBoard.width + 12;
app.stage.height = Tablo.height + gameBoard.height + 12;

app.loader
  .add("elephant", "animals/PNG/square without details/elephant.png")
  .add("giraffe", "animals/PNG/square without details/giraffe.png")
  .add("hippo", "animals/PNG/square without details/hippo.png")
  .add("monkey", "animals/PNG/square without details/monkey.png")
  .add("panda", "animals/PNG/square without details/panda.png")
  .add("parrot", "animals/PNG/square without details/parrot.png")
  .add("penguin", "animals/PNG/square without details/penguin.png")
  .add("pig", "animals/PNG/square without details/pig.png")
  .add("rabbit", "animals/PNG/square without details/rabbit.png")
  .add("snake", "animals/PNG/square without details/snake.png")
  .add("fon", "fon2.jpg")
  .add("sound", "music/country_roads.mp3")
  .add("water", "music/water.mp3")
  .add("bonus", "music/water.mp3")
  .load(setup);

let animals = [];
let type, overSound, sound, bonus;

function setup() {
  const animalTextures = [
    PIXI.Texture.from("elephant"),
    PIXI.Texture.from("giraffe"),
    PIXI.Texture.from("hippo"),
    PIXI.Texture.from("monkey"),
    PIXI.Texture.from("panda"),
    PIXI.Texture.from("parrot"),
    PIXI.Texture.from("penguin"),
    PIXI.Texture.from("pig"),
    PIXI.Texture.from("rabbit"),
    PIXI.Texture.from("snake"),
  ];

  sound = new Howl({
    src: ["music/country_roads.mp3"],
  });
  sound.loop = true;
  sound.volume = 0.1;
  // sound.once("load", function () {
  // sound.play();
  // });

  overSound = new Howl({
    src: ["music/water.mp3"],
  });
  bonus = new Howl({
    src: ["music/bonus.mp3"],
  });

  // let fon = new PIXI.Sprite(resources.fon.texture);
  let texture = PIXI.Texture.from("fon");
  let fon = new PIXI.Sprite(texture);
  fon.height = 500;
  fon.width = 500;
  gameBoard.addChild(fon);

  const prefilled = [
    1,
    2,
    3,
    4,
    5,
    1,
    2,
    3,
    4,
    5,
    0,
    0,
    0,
    1,
    2,
    ...new Array(cellCount - 15)
      .fill(0)
      .map((el, i) => i % settings.difficulty),
  ];

  for (let i = 0; i < cellCount; i++) {
    type = randomInt(0, settings.difficulty);
    // type = prefilled[i];
    const view = new PIXI.Sprite(animalTextures[type]);
    animals[i] = {
      kind: type,
      view: view,
      neighborhood: [],
      exY: 0, //expected Y
      falls: false,
    };
    animals[i].view.height = animals[i].view.width = 100;
    animals[i].view.x =
      (i % settings.columns) * 100 + animals[i].view.height / 2;
    animals[i].view.y =
      Math.floor(i / settings.columns) * 100 + animals[i].view.width / 2;
    view.anchor.set(0.5);

    animals[i].view.interactive = true;
    animals[i].view.buttonMode = true;

    animals[i].view
      .on("pointerdown", start)
      .on("pointerover", over)
      .on("pointerout", gone);

    gameBoard.addChild(animals[i].view);
  }

  console.log(animals);

  app.ticker.add(() => gameloop());
}

let getByXY = (x, y) => {
  if (x >= 0 && x < settings.columns && y >= 0 && y < settings.rows) {
    return animals[x + y * settings.columns];
  } else {
    return null;
  }
};

let iterate = (f) => {
  for (let i = 0; i < cellCount; i++) {
    let x = i % settings.columns;
    let y = Math.floor(i / settings.columns);
    let animal = getByXY(x, y);
    if (animal) {
      f(animal, x, y);
    }
  }
};

let allFalled = true;
let gameloop = () => {
  if (!allFalled) {
    falling();
  }
};

function over() {
  this.zIndex = 1;
  // this.scale = 1.25
  this.height = this.width = 125;
  overSound.play();
}

function gone() {
  // this.scale = 1
  this.height = this.width = 100;
  this.zIndex = 0;
}

function start() {
  let selectedAnimal = animals.indexOf(this)
  console.log(selectedAnimal)
};

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

let checkFall = () => {
  for (let i = 0; i < cellCount; i++) {
    if (animals[i]) {
      animals[i].exY =
        Math.floor(i / settings.columns) * 100 + animals[i].view.width / 2;
      // allFalled = true
      // if (allFalled && animals[i].view.y === animals[i].exY)
      // {allFalled = true}
      // else {allFalled = false}
    }
  }
};

let check = () => {
  iterate((animal, x, y) => {
    animal.neighborhood.splice(0, animal.neighborhood.length);
    if (getByXY(x - 1, y) && animal.kind === getByXY(x - 1, y).kind) {
      animal.neighborhood.push(getByXY(x - 1, y));
      getByXY(x - 1, y).neighborhood.push(animal);
    }
    if (getByXY(x, y - 1) && animal.kind === getByXY(x, y - 1).kind) {
      animal.neighborhood.push(getByXY(x, y - 1));
      getByXY(x, y - 1).neighborhood.push(animal);
    }
  });
};

let dawnShift = () => {
  for (let x = 0; x < settings.columns; x++)
    for (let i = cellCount - settings.columns - 1; i >= 0; i--) {
      if (!animals[i + settings.columns] && animals[i]) {
        animals[i + settings.columns] = animals[i];
        animals[i] = null;
      }
    }
};

let falling = () => {
  let someAnimalFalls = false;
  console.log(someAnimalFalls);
  for (let i = 0; i < cellCount; i++) {
    if (animals[i]) {
      if (animals[i].view.y < animals[i].exY) {
        animals[i].falls = true;
        someAnimalFalls = true;
        animals[i].view.y += 1;
      } else {
        animals[i].falls = false;
      }
    }
  }
  if (!someAnimalFalls) {
    allFalled = true;
    splicing();
  }
};

let Del = (index) => {
  if (animals[index]) {
    gameBoard.removeChild(animals[index].view);
    bonus.play();
    animals[index] = null;
  }
};



let splicing = () => {
  check();
  for (let i = 0; i < cellCount; i++) {
    if (animals[i] && animals[i].neighborhood.length >= 2) {
      console.log(animals[i].neighborhood);
      animals[i].neighborhood.forEach((el) =>
        Del(animals.findIndex((e) => e === el))
      );
      Del(i);
      console.log(123);
      allFalled = false;
    }
  }
  dawnShift();
  checkFall();
};

setTimeout(splicing, 3000);
