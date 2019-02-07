let dimensions = [];
let positions = [];

let all_learn_squares = { squareCoord: [], pos: [], color: [] };
let all_predict_squares = { squareCoord: [], pos: [], color: [] };

const learningRate = 0.5;
const optimizer = 'sgd';
let model;

//Là où on stocke les positions obtenues en résultat
let res;

//les tensors utilisés pour l'apprentissage
let x_train;
let y_train;

function randomInt(max){
  return Math.floor(Math.random() * Math.floor(max));
}


function generateDataSet(){
  for (var i = 0; i<100; i++){
    largeur = randomInt(400);
    hauteur = randomInt(400);
    dimensions.push([hauteur, largeur]);
    if (hauteur*largeur>30000)
      positions[i] = [1];
    else
      positions[i] = [0];
  }
}

function createNeuralNetwork(){
  model = tf.sequential();

  const hiddenConfig = {
      inputShape : [2],
      units: 4,
      activation: 'relu'
  };
  const outputConfig = {
    units: 1,
    activation: 'sigmoid'
  };
  let hiddenLayer = tf.layers.dense(hiddenConfig);
  let outputLayer = tf.layers.dense(outputConfig);
  model.add(hiddenLayer);
  model.add(outputLayer);

  model.compile({
    optimizer: optimizer,
    loss: 'binaryCrossentropy',
    lr: learningRate
  });
}


async function predictOutput(){
  createNeuralNetwork();
  console.log("Neural network created");

  const xs = tf.tensor2d(dimensions);
  xs.print();

  await model.fit(x_train,y_train, {batchsize:1, epochs:1});
  ys = model.predict(xs);
  console.log("Résultat :");
  ys.print();
  res = Array.from(ys.dataSync());
  setPredictSquares();
  console.log("Pourcentage de réussite : "+calcSuccessPercent()+" %" );
}

function setLearnSquares(){
  for (var i=0; i<dimensions.length; i++){
    all_learn_squares["squareCoord"].push({ l: dimensions[i][1], h: dimensions[i][0] });
    all_learn_squares["pos"].push(positions[i]);
    all_learn_squares["color"].push({ r: random(255), g: random(255), b: random(255) });
  }
}

function setPredictSquares(){
    for (var i=0; i<res.length; i++){
      all_predict_squares["squareCoord"].push({ l: dimensions[i][1], h: dimensions[i][0] });
      all_predict_squares["pos"].push(res[i]);

      if (isCorrect(positions[i], res[i])){
        all_predict_squares["color"].push({ r: 0, g: 255, b: 0 });
      }
      else{
        all_predict_squares["color"].push({ r: 255, g: 0, b: 0 });
      }
    }
}


function isCorrect(pos, predict_pos){
  return (pos==0 && predict_pos<0.5) || (pos==1 && predict_pos>0.5);
}

function calcSuccessPercent(){
  var correctPosCount = 0;
  for (var i=0; i<positions.length; i++){
    if (isCorrect(positions[i], res[i])) correctPosCount++;
  }
  return correctPosCount*100/positions.length;
}

function setup(){
  createCanvas(1300, 800);
  frameRate(1);
  generateDataSet();
  setLearnSquares();
  x_train = tf.tensor2d(dimensions);
  console.log("x_train");
  x_train.print();
  y_train = tf.tensor2d(positions);
  console.log("y_train");
  y_train.print();
  predictOutput();

}


function draw() {
    // Arrière plan
    background(255);

    // Draw le contours des 2 rectangles
    noFill();
    strokeWeight(4);
    stroke('#222222');
    rect(0, 0, 1300, 800);

    // Draw le gap entre les deux
    fill(0);
    strokeWeight(2);
    stroke('#222222');
    rect(600, 0, 100, 800);

    // Draw all learning rectangles
    for (i = 0; i < all_learn_squares["squareCoord"].length; i++) {
        xGap = (i % 50) * 5;
        yGap = (int(i / 50) * 20) + 20;

        if (all_learn_squares.pos[i] == "0") {
            yGap += 400;
        }
      fill(all_learn_squares.color[i].r, all_learn_squares.color[i].g, all_learn_squares.color[i].b);
      rect(xGap, yGap, all_learn_squares.squareCoord[i].l, all_learn_squares.squareCoord[i].h);
    }

    // Draw all the predicted rectangles
    for (i = 0; i < res.length; i++) {
        xGap = 700 + (i % 50) * 5;
        yGap = (int(i / 50) * 20) + 20;

        if (all_predict_squares.pos[i]<0.5) {
            yGap += 400;
        }

        fill(all_predict_squares.color[i].r, all_predict_squares.color[i].g, all_predict_squares.color[i].b);
        rect(xGap, yGap, all_predict_squares.squareCoord[i].l, all_predict_squares.squareCoord[i].h);
    }




}
