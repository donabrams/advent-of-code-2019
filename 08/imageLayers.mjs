import fs from 'fs';
import readline from 'readline';


async function forEachLineIn(file, perLine) {
	const reader = readline.createInterface({
		input: fs.createReadStream(file)
	});

	for await (const line of reader) {
		perLine(line);
	}
}

const BLACK = "0";
const WHITE = "1";
const CLEAR = "2";

let input;
forEachLineIn('input.txt', (txt) => {
	input = txt.split('');
}).then(async () => {
	let leastLayer;
	let minNumZeros = Infinity;
	let layers = [];
	while (input.length) {
		const layer = input.splice(0, 25*6);
		const numZeros = layer.filter(([s]) => s === "0").length;
		if (numZeros < minNumZeros) {
			leastLayer = layer;
			minNumZeros = numZeros;
		}
		layers.push(layer);
	}
	console.log(`least zeros (${minNumZeros})`);
	let copy = [...leastLayer];
	for (let i = 0; i < 6; i++) {
		console.log(copy.splice(0,25).join(""));
	}
	const numOnes = leastLayer.filter(([s]) => s === "1").length;
	const numTwos = leastLayer.filter(([s]) => s === "2").length;
	console.log(numOnes * numTwos);

	// pt2

	const numPixels = 25*6;
	const image = [];
	for (let i = 0; i < numPixels; i++) {
		image[i] = CLEAR;
	}

	for (let layer of layers) {
		for (let i = 0; i < numPixels; i++) {
			if (image[i] === CLEAR) {
				image[i] = layer[i];
			}
		}
	}

	console.log("image");
	copy = [...image].map((p) => p === "1" ? "*" : " ");
	for (let i = 0; i < 6; i++) {
		console.log(copy.splice(0,25).join(""));
	}

});