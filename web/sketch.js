let all_squares_display = { squareCoord: [], pos: [], color: [], predictSquare: [], posPredict: [], colorPredict: [] };
let all_squares_learn = { squareLearn: [], posLearn: [] };

let buttonAutoAdd;
let autoAjout = false;

const learningRate = 0.01;
const optimizer = tf.train.sgd(learningRate);

let model, xs, ys;
let history;

/*
Création d'un premier réseau neuronal
Couche d'entrée : 2 neurones (hauteur et largeur)
1 couche cachée : 3 neurones
Couche de sortie : 2 neurones ("Haut" et "Bas")
*/
function createNeuralNetwork() {
    model = tf.sequential();

    const hiddenConfig = {
        inputShape: [2],
        units: 3,
        activation: 'relu'
    };
    const outputConfig = {
        inputShape: [3],
        units: 1,
        //   activation: 'sigmoid'
    };
    let hiddenLayer = tf.layers.dense(hiddenConfig);
    let outputLayer = tf.layers.dense(outputConfig);
    model.add(hiddenLayer);
    model.add(outputLayer);

    model.compile({
        optimizer: 'sgd',
        loss: 'meanSquaredError',
        lr: 0.1
    });
}

function download(content, fileName, contentType = "application/json") {
    var a = document.createElement("a");
    var file = new Blob([content], { type: contentType });
    a.href = URL.createObjectURL(file);
    a.download = fileName;
    a.click();
}

// Retourne vrai si on a affaire à un grand rectangle
// et false sinon
function predictLH(l, h) {
    if (h * l > 30000) {
        return true;
    }
    return false;
}

function predictTheTests() {
    let cpt = 0;
    let correctTest = 0;

    // Parcourt tous les carré de la partie apprentisage et les prédict
    for (i = 0; i < all_squares_learn.squareLearn.length; i += 2) {
        let res = predictAndDisplay(all_squares_learn.squareLearn[i] * 390 + 10, all_squares_learn.squareLearn[i + 1] * 390 + 10);
        if (res[1]) {
            correctTest++;
        }
        cpt++;
    }

    // Affiche le % de réussite
    select("#percentSuccess").html(parseInt((correctTest / cpt) * 10000) / 100 + "%");
    console.warn("Correct : " + parseInt((correctTest / cpt) * 10000) / 100 + "%");
}

function predictAndDisplay(lgr, htr) {
    // Si la hauteur et la largeur n'es pas bonne, ne rien faire et alerter
    if (lgr > 400 || htr > 400 || lgr < 10 || htr < 10) {
        console.error("Largeur et hauteur doivent être entre 10 et 400");
        return;
    }

    // Predict en donnant la largeur et la hauteur normalisé
    tensorRes = model.predict(tf.variable(tf.tensor2d([
        [(lgr - 10) / 390, (htr - 10) / 390]
    ], [1, 2])));


    // The result of the prediction in an Array
    let res = Array.from(tensorRes.dataSync());
    // Say if the prediction correspond to the reality
    let isCorrect = false;

    // Rajoute le carré a prédire dans les carré à affiché
    all_squares_display.predictSquare.push({ l: lgr, h: htr });

    // Lui donne une couleur en fonction de si il est bien placé où nonS
    if (res[0] > 0.5) {
        if (predictLH(lgr, htr)) {
            all_squares_display["colorPredict"].push({ r: 0, g: 255, b: 0 });
            isCorrect = true;
        } else { all_squares_display["colorPredict"].push({ r: 255, g: 0, b: 0 }); }

        all_squares_display["posPredict"].push("Haut");
    } else {
        if (!predictLH(lgr, htr)) {
            all_squares_display["colorPredict"].push({ r: 0, g: 255, b: 0 });
            isCorrect = true;
        } else { all_squares_display["colorPredict"].push({ r: 255, g: 0, b: 0 }); }

        all_squares_display["posPredict"].push("Bas");
    }

    // Log et retourne le résultat
    tensorRes.print();
    console.log(isCorrect);
    return [res, isCorrect];
}

function predictFromUser() {
    let lgr = parseInt(select("#largeur").value());
    let htr = parseInt(select("#hauteur").value());

    predictAndDisplay(lgr, htr);
}


async function addSquare() {
    // Calcul une hauteur et une largeur random
    largeur = int(random(10, 400));
    hauteur = int(random(10, 400));

    // La met dans le tableau all_squares_display
    all_squares_display["squareCoord"].push({ l: largeur, h: hauteur });
    all_squares_learn.squareLearn.push((largeur - 10) / 390);
    all_squares_learn.squareLearn.push((hauteur - 10) / 390);

    // Si grand rectangle, va en haut, sinon va en bas
    if (predictLH(hauteur, largeur)) {
        all_squares_display["pos"].push("Haut");
        all_squares_learn["posLearn"].push(1);
    } else {
        all_squares_display["pos"].push("Bas");
        all_squares_learn["posLearn"].push(0);
    }
    // Lui choisis une couleur random (pour affichage)
    all_squares_display["color"].push({ r: random(255), g: random(255), b: random(255) });

    xs = tf.tensor2d(all_squares_learn.squareLearn, [all_squares_display.squareCoord.length, 2]);
    ys = tf.tensor1d(all_squares_learn.posLearn);

    console.warn("Tranning !");
    history = await model.fit(xs, ys);
}

function setup() {
    // 2 rectangle de 600*800 avec un gap de 100 entre les 2
    let canvas = createCanvas(1300, 800);
    canvas.parent('sketch-holder');
    // frameRate(1);  // Change les fps à 1 images par secondes

    let button = select("#Add1");
    button.mousePressed(addSquare);

    button = select("#Add100");
    button.mousePressed(function() { for (i = 0; i < 100; i++) { addSquare(); } });

    button = select("#predict");
    button.mousePressed(predictFromUser);

    button = select("#predictTests");
    button.mousePressed(predictTheTests);

    buttonAutoAdd = select("#AddFrame");
    buttonAutoAdd.mousePressed(function() { autoAjout = !autoAjout; if (autoAjout) { buttonAutoAdd.elt.innerText = "Ajout auto : activé"; } else { buttonAutoAdd.elt.innerText = "Ajout auto : désactivé"; } });

    createNeuralNetwork();
}

/*
 * Fonction appelé par p5 à chaque frame
 */
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

    // Déssine chaque rectangle d'entrainement de all_squares_display
    for (i = 0; i < all_squares_display["squareCoord"].length; i++) {
        xGap = (i % 50) * 5;
        yGap = (int(i / 50) * 20) + 20;

        if (all_squares_display.pos[i] == "Bas") {
            yGap += 400;
        }


        fill(all_squares_display.color[i].r, all_squares_display.color[i].g, all_squares_display.color[i].b);
        rect(xGap, yGap, all_squares_display.squareCoord[i].l, all_squares_display.squareCoord[i].h);
    }

    strokeWeight(1);
    // Déssine les rectangles prédits
    for (i = 0; i < all_squares_display.predictSquare.length; i++) {
        xGap = 700 + (i % 50) * 5;
        yGap = (int(i / 50) * 20) + 20;

        if (all_squares_display.posPredict[i] == "Bas") {
            yGap += 400;
        }


        fill(all_squares_display.colorPredict[i].r, all_squares_display.colorPredict[i].g, all_squares_display.colorPredict[i].b);
        rect(xGap, yGap, all_squares_display.predictSquare[i].l, all_squares_display.predictSquare[i].h);
    }

    // Si activé par le bouton, rajoute un nouveau rectangle d'entrainement
    if (autoAjout) {
        addSquare();
    }
}