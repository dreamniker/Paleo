import * as PIXI from "pixi.js";
import { keyboard } from "./keyboard";
import { Howl, Howler } from "howler";
import pixiSound from "pixi-sound";

const world = {
  width: 512,
  height: 512,
};

const actResults = {
  hunting: {
    title: ["Удачная охота", "Обычная охота", "Неудачная охота"],
    text: [
      "Вам повезло, вы захуярили огромного зверя",
      "Вы захуярили зверя среднего размера",
      "Зверь дал вам пизды",
    ],
  },
  supplies: {
    title: ["Сбор припасов"],
    text: ["Вы собрали немного дров"],
  },
  sleep: {
    title: ["Бессонная ночь"],
    text: ["Вы нихуя не выспались"],
  },
  gathering: {
    title: ["Собирательство"],
    text: ["Вы собрали немного фруктов с растущих рядом деревьев"],
  },
  eating: {
    title: ["Приём пищи"],
    text: ["Вы восстановили немного энергии и здоровья"],
  },
  kindle: {
    title: ["Разжечь костёр"],
    text: ["Вы подбросили дров. Костёр приятно и успокаивающе потрескивает"],
  },
  rest: {
    title: ["Отдых"],
    text: ["Вы отдохнули и восстановили немного энергии"],
  },
};

const player = {
  satiety: 80,
  satietyMax: 120,
  health: 6,
  healthMax: 6,
  energy: 80,
  energyMax: 100,
};

const resources = {
  wood: 15,
  food: 25,
  woodMax: 30,
  foodMax: 40,
};

const vitalStates = {
  flame: 50,
  flameMax: 100,
  day: 1,
  isDay: true,
};

const app = new PIXI.Application({
  width: world.width,
  height: world.height,
  backgroundColor: 0xe83a3a,
});
document.body.appendChild(app.view);

console.log(app.stage.height, app.stage.width);
console.log(world.width, world.height);

app.loader
  .add("fon", "fon3.jpg")
  .add("food", "food3.png")
  .add("wood", "wood2.png")
  .add("soup", "soup.png")
  .add("fullHeart", "fullheart.png")
  .add("bonfire", "bonfire2.png")
  .add("energy", "energy.png")
  .add("brownButton", "brownButton.png")
  .add("redButton", "redButton2.png")
  .add("smallBonfire", "smallBonfire2.png")
  .add("click", "music/click.mp3")
  .add("day", "day.png")
  .add("night", "night.png")
  .load(setup);

let gameScene = new PIXI.Container();
gameScene.position.set(0, 0);
gameScene.width = world.width;
gameScene.height = world.height;
gameScene.backgroundColor = 0x7c030e;
app.stage.addChild(gameScene);

let textMap = new Map();
let actionMap = new Map();

let click = new Howl({
  src: ["music/click.mp3"],
});
click.volume = 1.0;

function setup() {
  //#region textures
  let textureStone = PIXI.Texture.from("fon");
  let textureWood = PIXI.Texture.from("wood");
  let textureFood = PIXI.Texture.from("food");
  let textureSoup = PIXI.Texture.from("soup");
  let textureFullheart = PIXI.Texture.from("fullHeart");
  let textureBonfire = PIXI.Texture.from("bonfire");
  let textureEnergy = PIXI.Texture.from("energy");
  let textureBrownButton = PIXI.Texture.from("brownButton");
  let textureRedButton = PIXI.Texture.from("redButton");
  let textureSmallBonfire = PIXI.Texture.from("smallBonfire");
  let textureDay = PIXI.Texture.from("day");
  let textureNight = PIXI.Texture.from("night");
  //#endregion

  let dayActs = [
    "Пойти на охоту",
    "Собирать ягоды",
    "Собирать припасы",
    "Отдыхать",
  ];
  let nightActs = ["Поесть", "Подбросить дров", "Лечь спать"];
  let availibleActs = dayActs;

  let resourceBar = new PIXI.Container(); // resourceContainer
  let healthBar = new PIXI.Container(); // resourceContainer
  resourceBar.position.set(0, 0);
  gameScene.addChild(resourceBar);
  gameScene.addChild(healthBar);

  actionMap.set(dayActs[0], hunting);
  actionMap.set(dayActs[1], gathering);
  actionMap.set(dayActs[2], supplies);
  actionMap.set(dayActs[3], rest);
  actionMap.set(nightActs[0], eating);
  actionMap.set(nightActs[1], kindle);
  actionMap.set(nightActs[2], sleep);

  //#region images

  let resourceBarFon = new PIXI.Sprite(textureStone);
  resourceBarFon.position.set(0, 0);
  resourceBarFon.width = 512;
  resourceBarFon.height = world.height * 0.15;
  resourceBar.addChild(resourceBarFon);

  let healthBarFon = new PIXI.Sprite(textureStone);
  healthBarFon.width = app.stage.width;
  healthBarFon.height = world.height * 0.25;
  healthBarFon.position.set(0, world.height - healthBarFon.height);
  healthBar.addChild(healthBarFon);

  let tab = (resourceBarFon.height * 2) / 3;

  let foodImage = new PIXI.Sprite(textureFood);
  foodImage.position.set(tab, tab / 4);
  foodImage.height = tab;
  foodImage.width = tab;
  resourceBar.addChild(foodImage);
  textMap.set(foodImage, "Охотьтесь или собирайте ягоды, чтобы добыть пищу");
  foodImage.interactive = true;
  foodImage.buttonMode = true;
  foodImage
    .on("pointerdown", bonfireMenu)
    .on("pointerup", bonfireMenuClose)
    .on("pointerover", hintTab)
    .on("pointerout", hintTabHide);

  let woodImage = new PIXI.Sprite(textureWood);
  woodImage.position.set(tab * 5, tab / 4);
  woodImage.height = 50;
  woodImage.width = 70;
  resourceBar.addChild(woodImage);
  textMap.set(woodImage, "Ищите припасы, чтобы добыть древесину");
  woodImage.interactive = true;
  woodImage.buttonMode = true;
  woodImage
    .on("pointerdown", bonfireMenu)
    .on("pointerup", bonfireMenuClose)
    .on("pointerover", hintTab)
    .on("pointerout", hintTabHide);

  let soupImage = new PIXI.Sprite(textureSoup);
  soupImage.height = soupImage.width = healthBarFon.height / 3;
  soupImage.position.set(
    healthBarFon.width / 20,
    healthBarFon.y + healthBarFon.height / 3
  );
  healthBar.addChild(soupImage);
  textMap.set(soupImage, "Используйте еду, чтобы заполнить шкалу сытости");
  soupImage.interactive = true;
  soupImage.buttonMode = true;
  soupImage
    .on("pointerdown", bonfireMenu)
    .on("pointerup", bonfireMenuClose)
    .on("pointerover", hintTab)
    .on("pointerout", hintTabHide);

  let energyImage = new PIXI.Sprite(textureEnergy);
  energyImage.height = energyImage.width = healthBarFon.height / 3;
  energyImage.position.set(healthBarFon.width / 20, healthBarFon.y);
  healthBar.addChild(energyImage);
  textMap.set(energyImage, "Сон и отдых восстанавливают энергию");
  energyImage.interactive = true;
  energyImage.buttonMode = true;
  energyImage
    .on("pointerdown", bonfireMenu)
    .on("pointerup", bonfireMenuClose)
    .on("pointerover", hintTab)
    .on("pointerout", hintTabHide);

  let smallBonfireImage = new PIXI.Sprite(textureSmallBonfire);
  smallBonfireImage.height = smallBonfireImage.width = healthBarFon.height / 3;
  smallBonfireImage.position.set(
    healthBarFon.width / 20,
    healthBarFon.y + (healthBarFon.height * 2) / 3
  );
  healthBar.addChild(smallBonfireImage);
  textMap.set(smallBonfireImage, "Поддерживайте огонь, бросая в костёр дрова");
  smallBonfireImage.interactive = true;
  smallBonfireImage.buttonMode = true;
  smallBonfireImage
    .on("pointerdown", bonfireMenu)
    .on("pointerup", bonfireMenuClose)
    .on("pointerover", hintTab)
    .on("pointerout", hintTabHide);

  let bonfire = new PIXI.Sprite(textureBonfire);
  bonfire.height = bonfire.width = tab * 2.5;
  bonfire.anchor.set(0.5, 0.5);
  bonfire.position.set(gameScene.width / 2, gameScene.height / 2);
  gameScene.addChild(bonfire);
  textMap.set(bonfire, "Нажмите на костёр чтобы открыть меню действий");
  bonfire.interactive = true;
  bonfire.buttonMode = true;
  bonfire
    .on("pointertap", bonfireMenu)
    .on("pointerupoutside", bonfireMenuClose)
    .on("pointerover", hintTab)
    .on("pointerout", hintTabHide);

  //#endregion

  let style = new PIXI.TextStyle({
    fontFamily: "Comic Sans MS",
    fontSize: tab,
    fill: "#fafafa",
    stroke: "#1d1b1b",
    strokeThickness: 2,
  });

  let food, wood;

  function foodRenderer() {
    food = new PIXI.Text(resources.food, style);
    food.x = foodImage.x + 1.2 * foodImage.width;
    food.y = 0.3 * foodImage.y;
    food.zIndex = 10;
    resourceBar.addChild(food);
  }

  let woodRenderer = () => {
    wood = new PIXI.Text(resources.wood, style);
    wood.x = woodImage.x + 1.2 * woodImage.width;
    wood.y = 0.3 * woodImage.y;
    resourceBar.addChild(wood);
  };

  let time = new PIXI.Container();
  time.position.set((world.width * 3) / 4, resourceBarFon.height);
  gameScene.addChild(time);
  let day = new PIXI.Sprite(textureDay);
  let night = new PIXI.Sprite(textureNight);

  const timeRender = () => {
    time.removeChildren();
    let actualTime;
    let currentData = "День " + vitalStates.day;
    if (vitalStates.isDay) {
      actualTime = day;
      currentData += '\n Утро'
    } else {
      actualTime = night;
      currentData += '\n Вечер'
    }
    actualTime.position.set(0, 0);
    actualTime.height = tab * 1.5;
    actualTime.width = world.width / 4;
    let text = new PIXI.Text(currentData, {
      fontSize: tab/2,
      fontFamily: 'Comic Sans MS',
      fill: "#fafafa",
      stroke: "#1d1b1b",
      strokeThickness: 2,
      align: 'center',
      wordWrap: true,
      wordWrapWidth: world.width/4
    })
    text.x += actualTime.width/6
    

    time.addChild(actualTime, text);

  };

  let resourceRefresher = () => {
    resourceBar.removeChildren();
    resourceBar.addChild(resourceBarFon, foodImage, woodImage);
    foodRenderer();
    woodRenderer();
    timeRender();
  };

  const healthRender = () => {
    let renderedHearts = Math.floor(player.health / 2);
    let hearts = [];
    for (let i = 0; i < renderedHearts; i++) {
      hearts[i] = new PIXI.Sprite(textureFullheart);
      hearts[i].width = hearts[i].height = tab;
      hearts[i].y = healthBarFon.y + hearts[i].height / 6;
      hearts[i].x = healthBarFon.width / 2 + (i + 1) * 1.2 * hearts[i].width;
      hearts[i].interactive = hearts[i].buttonMode = true;
      textMap.set(hearts[i], "Сон и отдых восстанавливают здоровье");
      healthBar.addChild(hearts[i]);
      hearts[i]
        .on("pointerdown", bonfireMenu)
        .on("pointerup", bonfireMenuClose)
        .on("pointerover", hintTab)
        .on("pointerout", hintTabHide);
    }
  };

  const satietyRenderer = () => {
    let satietyMax = new PIXI.Graphics();
    satietyMax.beginFill(0xff0000);
    satietyMax.drawRect(
      soupImage.x + soupImage.width * 1.2,
      soupImage.y + soupImage.height / 3,
      player.satietyMax,
      soupImage.height / 3
    );
    healthBar.addChild(satietyMax);

    let satiety = new PIXI.Graphics();
    satiety.beginFill(0x008000);
    satiety.drawRect(
      soupImage.x + soupImage.width * 1.2,
      soupImage.y + soupImage.height / 3,
      player.satiety,
      soupImage.height / 3
    );
    healthBar.addChild(satiety);
  };

  const flameRenderer = () => {
    let flameMax = new PIXI.Graphics();
    flameMax.beginFill(0xff0000);
    flameMax.drawRect(
      smallBonfireImage.x + smallBonfireImage.width * 1.2,
      smallBonfireImage.y + smallBonfireImage.height / 3,
      vitalStates.flameMax,
      smallBonfireImage.height / 3
    );
    healthBar.addChild(flameMax);

    let flame = new PIXI.Graphics();
    flame.beginFill(0x008000);
    flame.drawRect(
      smallBonfireImage.x + smallBonfireImage.width * 1.2,
      smallBonfireImage.y + smallBonfireImage.height / 3,
      vitalStates.flame,
      smallBonfireImage.height / 3
    );
    healthBar.addChild(flame);
  };

  const energyRenderer = () => {
    let energyMax = new PIXI.Graphics();
    energyMax.beginFill(0xff0000);
    energyMax.drawRect(
      energyImage.x + energyImage.width * 1.2,
      energyImage.y + energyImage.height / 3,
      player.energyMax,
      energyImage.height / 3
    );

    let energy = new PIXI.Graphics();
    energy.beginFill(0x008000);
    energy.drawRect(
      energyImage.x + energyImage.width * 1.2,
      energyImage.y + energyImage.height / 3,
      player.energy,
      energyImage.height / 3
    );
    healthBar.addChild(energyMax);
    healthBar.addChild(energy);
  };

  let healthBarRefresher = () => {
    healthBar.removeChildren();
    healthBar.addChild(healthBarFon, energyImage, soupImage, smallBonfireImage);
    energyRenderer();
    satietyRenderer();
    flameRenderer();
    healthRender();
  };

  let refresher = () => {
    resourceRefresher();
    healthBarRefresher();
  };

  function check() {
    if (resources.food > resources.foodMax) {
      resources.food = resources.foodMax;
    }
    if (resources.wood > resources.woodMax) {
      resources.wood = resources.woodMax;
    }
    if (player.satiety > player.satietyMax) {
      player.satiety = player.satietyMax;
    }
    if (player.energy > player.energyMax) {
      player.energy = player.energyMax;
    }
    if (player.health > player.healthMax) {
      player.health = player.healthMax;
    }
    if (vitalStates.flame > vitalStates.flameMax) {
      vitalStates.flame = vitalStates.flameMax;
    }
  }

  refresher();

  // console.log(tab)
  let bonfireMenuFon = new PIXI.Container();
  bonfireMenuFon.position.set(0, 0);

  function bonfireMenu() {
    hintTabHide();
    gameScene.addChild(bonfireMenuFon);
    bonfireMenuFon.removeChildren();
    click.play();
    let button = [];
    let buttonText = [];

    let menuStyle = new PIXI.TextStyle({
      fontFamily: "Comic Sans MS",
      fontSize: 18,
      fill: "#fafafa",
      stroke: "#1d1b1b",
      strokeThickness: 2,
      wordWrap: true,
      wordWrapWidth: bonfire.x - bonfire.width / 2,
    });

    for (let i = 0; i < availibleActs.length; i++) {
      button[i] = new PIXI.Sprite(textureBrownButton);
      button[i].height = tab;
      button[i].width = bonfire.x - (bonfire.width / 2) * 1.1;
      button[i].x = tab / 2;
      button[i].y =
        resourceBar.height + button[i].height / 2 + i * button[i].height;
      bonfireMenuFon.addChild(button[i]);
      button[i].buttonMode = button[i].interactive = true;
      buttonText[i] = new PIXI.Text(availibleActs[i], menuStyle);
      buttonText[i].x = button[i].x + button[i].width / 20;
      buttonText[i].y = button[i].y + button[i].height / 4;
      button[i]
        .on("pointerover", tintThis)
        .on("pointerout", DontTintThis)
        .on("pointertap", actionMap.get(availibleActs[i]));
      bonfireMenuFon.addChild(buttonText[i]);
    }
    let closeButton = new PIXI.Sprite(textureBrownButton);
    closeButton.tint = 0xff0000;
    closeButton.width = button[availibleActs.length - 1].width;
    closeButton.height = button[availibleActs.length - 1].height;
    closeButton.x = button[availibleActs.length - 1].x;
    closeButton.y =
      button[availibleActs.length - 1].height +
      button[availibleActs.length - 1].y;
    bonfireMenuFon.addChild(closeButton);
    closeButton.buttonMode = closeButton.interactive = true;
    closeButton
      .on("pointertap", bonfireMenuClose)
      .on("pointerover", tintThis)
      .on("pointerout", DontTintThis);
    let closeButtonText = new PIXI.Text("Закрыть", menuStyle);
    closeButtonText.x = closeButton.x + closeButton.width / 20;
    closeButtonText.y = closeButton.y + closeButton.height / 4;
    bonfireMenuFon.addChild(closeButtonText);
  }

  function tintThis() {
    this.tint = 0x8b3621;
  }

  function DontTintThis() {
    this.tint = 0xffffff;
  }

  function bonfireMenuClose() {
    click.play();
    gameScene.removeChild(bonfireMenuFon);
  }

  function hunting() {
    click.play();
    let huntingResults = {
      damage: 0,
    };
    let luck = Math.random();
    if (luck > 0.5) {
      huntingResults.variant = 0;
      huntingResults.food = 5;
    } else if (luck > 0.2) {
      huntingResults.variant = 1;
      huntingResults.food = 3;
    } else {
      huntingResults.variant = 2;
      huntingResults.food = 1;
      huntingResults.damage = 2;
    }
    huntingResults.text = " Eда + " + huntingResults.food + " \n Энергия -50";
    if (!huntingResults.damage == 0) {
      huntingResults.text += "\n Здоровье -" + huntingResults.damage;
    }
    resources.food += huntingResults.food;
    player.energy -= 50;
    player.health -= huntingResults.damage;
    if (resources.food > resources.foodMax) {
      resources.food = resources.foodMax;
    }
    if (player.energy < 0) {
      player.energy = 0;
    }
    console.log(resources.food);
    bonfireMenuClose();
    dayToNight();
    refresher();
    resultTab(actResults.hunting, huntingResults.text, huntingResults.variant);
  }

  function gathering() {
    click.play();
    bonfireMenuClose();
    let crop = 2;
    resources.food += crop;
    player.energy -= 30;
    let result = "Еда +" + crop + "\nЭнергия -30";
    dayToNight();
    check();
    refresher();
    resultTab(actResults.gathering, result);
  }

  function supplies() {
    click.play();
    bonfireMenuClose();
    let crop = 5;
    resources.wood += crop;
    player.energy -= 30;
    let result = "Дрова +" + crop + "\nЭнергия -30";
    dayToNight();
    check();
    refresher();
    resultTab(actResults.supplies, result);
  }

  function rest() {
    click.play();
    bonfireMenuClose();
    player.energy += 10;
    dayToNight();
    check();
    refresher();
    resultTab(actResults.rest, "Энергия +10");
  }

  function eating() {
    click.play();
    bonfireMenuClose();
    resources.food -= 5;
    player.energy += 10;
    player.satiety += 40;
    check();
    refresher();
    resultTab(actResults.eating, "Энергия +10, \nСытость +40");
    // nightToDay();
  }

  function kindle() {
    click.play();
    bonfireMenuClose();
    resources.wood -= 5;
    vitalStates.flame += 20;
    check();
    refresher();
    resultTab(actResults.kindle, "Дрова -5, \nПламя Костра +20");
    // nightToDay();
  }

  function sleep() {
    click.play();
    bonfireMenuClose();
    player.energy += 30;
    player.satiety -= 20;
    vitalStates.flame -= 10;
    nightToDay();
    check();
    refresher();
    resultTab(actResults.sleep, "Энергия +30");
  }

  let resultContainer = new PIXI.Container();
  resultContainer.position.set(
    world.width / 4,
    foodImage.y + foodImage.height / 2
  );
  gameScene.addChild(resultContainer);

  function resultTab(act, summary, variant) {
    if (!variant) {
      variant = 0;
    }

    bonfire.interactive = bonfire.buttonMode = false;
    let resultTabFon = new PIXI.Graphics();
    resultTabFon.lineStyle(10, 0xc34a17, 1);
    resultTabFon.beginFill(0xe1c13b);
    resultTabFon.drawRoundedRect(
      0,
      0,
      world.width / 1.9,
      soupImage.y - resultContainer.y,
      20
    );
    resultTabFon.endFill();
    resultContainer.addChild(resultTabFon);

    let okayButton = new PIXI.Sprite(textureBrownButton);
    okayButton.position.set(
      resultTabFon.width / 4,
      (resultTabFon.height * 8) / 10
    );
    okayButton.height = 50;
    okayButton.width = resultTabFon.width / 2;
    resultContainer.addChild(okayButton);
    okayButton.buttonMode = okayButton.interactive = true;
    okayButton.on("pointertap", closeThis);

    let title = new PIXI.Text(act.title[variant]);
    title.style = {
      fontSize: okayButton.height * 0.6,
      fontFamily: "Comic Sans MS",
      fill: "#fafafa",
      stroke: "#1d1b1b",
      strokeThickness: 2,
      align: "center",
    };
    let text = new PIXI.Text(act.text[variant]);
    text.style = {
      fontSize: okayButton.height / 3,
      fontFamily: "Comic Sans MS",
      fill: "#fafafa",
      stroke: "#1d1b1b",
      strokeThickness: 2,
      align: "left",
      wordWrap: true,
      wordWrapWidth: resultTabFon.width - title.style.strokeThickness * 10,
    };
    title.position.set(title.style.strokeThickness * 5, 0);
    text.position.set(title.style.strokeThickness * 5, resultTabFon.height / 4);

    let result = new PIXI.Text(summary);
    result.style = {
      fontSize: okayButton.height / 3,
      fontFamily: "Comic Sans MS",
      fill: "#fafafa",
      stroke: "#1d1b1b",
      strokeThickness: 2,
      align: "left",
      wordWrap: true,
      wordWrapWidth: resultTabFon.width - title.style.strokeThickness * 10,
    };
    result.position.set(
      title.style.strokeThickness * 5,
      resultTabFon.height / 2
    );
    resultContainer.addChild(title, text, result);

    let okay = new PIXI.Text("    OK    ");
    okay.x = okayButton.x;
    okay.y = okayButton.y;
    okay.style = {
      fontSize: (okayButton.height * 2) / 3,
      fontFamily: "Comic Sans MS",
      fill: "#fafafa",
      stroke: "#1d1b1b",
      strokeThickness: 2,
      align: "center",
    };

    resultContainer.addChild(okay);
  }

  function closeThis() {
    click.play();
    this.parent.removeChildren();
    bonfire.interactive = bonfire.buttonMode = true;
  }

  function dayToNight() {
    availibleActs = nightActs;
    vitalStates.isDay = false;
  }

  function nightToDay() {
    availibleActs = dayActs;
    vitalStates.isDay = true;
    vitalStates.day++;
  }

  // app.ticker.add(() => gameloop());
}

// let gameloop = () => {}

let hint, hintBackground;

function hintTab() {
  hintBackground = new PIXI.Graphics();
  hintBackground.beginFill(0x808080);
  let X = this.x + this.width / 2;
  let Y = this.y - this.height / 2;
  if (Y < world.height * 0.15) {
    Y += this.height / 2;
  }
  hintBackground.drawRoundedRect(X, Y, 150, 70, 10);
  gameScene.addChild(hintBackground);
  let currentText = textMap.get(this);

  let hintStyle = new PIXI.TextStyle({
    fontFamily: "Comic Sans MS",
    fontSize: 14,
    fill: "#fafafa",
    stroke: "#1d1b1b",
    strokeThickness: 2,
    wordWrap: true,
    wordWrapWidth: 150,
  });

  hint = new PIXI.Text(currentText, hintStyle);
  hint.x = X + 5;
  hint.y = Y + 5;
  gameScene.addChild(hint);
}

function hintTabHide() {
  gameScene.removeChild(hintBackground);
  gameScene.removeChild(hint);
}
