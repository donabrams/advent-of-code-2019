import readline from 'readline';
import fs from 'fs';

function getFuel(mass) {
	return Math.max(0, Math.floor(mass / 3) - 2);
}

function getFuelWithFuelForFuel(mass) {
	let total = getFuel(mass);
	let lastFuel = total;
	do {
		lastFuel = getFuel(lastFuel);
		total += lastFuel;
	} while (lastFuel > 0)
	return total;
}

async function forEachLineIn(file, perLine) {
	const reader = readline.createInterface({
		input: fs.createReadStream(file)
	});

	for await (const line of reader) {
		perLine(line);
	}
}


let total = 0;
let totalWithFuelForFuel = 0;
forEachLineIn('input.txt', (txt) => {
	const mass = parseInt(txt, 10);
	total += getFuel(mass);
}).then(() => {
	console.log('pt1: ', total);
}).then(() => forEachLineIn('input.txt', (txt) => {
	const mass = parseInt(txt, 10);
	totalWithFuelForFuel += getFuelWithFuelForFuel(mass);
})).then(() => {
	console.log('pt2: ', totalWithFuelForFuel);
});
