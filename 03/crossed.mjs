import readline from 'readline';
import fs from 'fs';


async function forEachLineIn(file, perLine) {
	const reader = readline.createInterface({
		input: fs.createReadStream(file)
	});

	for await (const line of reader) {
		perLine(line);
	}
}

// convert code to Vector: "U45" -> { xStep: 0, yStep: 1, magitude: 45 }
function codeToVector(code) {
	const magitude = Number.parseInt(code.substr(1),10);
	return {
		xStep: code[0] === 'R' ? 1 : (code[0] === 'L' ? -1 : 0),
		yStep: code[0] === 'U' ? 1 : (code[0] === 'D' ? -1 : 0),
		magitude,
	};
}

function printGrid(grid) {
	let minX = 0;
	let minY = 0;
	let maxX = 0;
	let maxY = 0;

	for (let xS in grid) {
		let x = parseInt(xS, 10);
		if (x < minX) {
			minX = x;
		} else if (x > maxX) {
			maxX = x;
		}
		for (let yS in grid[xS]) {
			let y = parseInt(yS, 10);
			if (y < minY) {
				minY = y;
			} else if (y > maxY) {
				maxY = y;
			}
		}
	}

	console.log(`grid (${minX},${minY}) - (${maxX},${maxY}):`);
	for (let y = maxY; y >= minY; y--) {
		let line = "|";
		for (let x = minX; x <= maxX; x++) {
			if (x === 0 && y === 0) {
				line += "O";
			} else {
				line += (grid[x] && grid[x][y]) ? "+": " ";
			}
		}
		line += "|";
		console.log(line);
	}

}

const grid = {};
let minNYDistance = Infinity;
let minSigDistance = Infinity;
forEachLineIn('input.txt', (txt) => {
	const wire = txt.split(',').map(codeToVector); // [Vector]
	// current position or "cursor"
	let x = 0;
	let y = 0;
	let dist = 0;
	// check for crossings
	wire.map((segment) => {
		const { magitude, xStep, yStep } = segment;
		for (let step = 0; step < magitude; step++) {
			x += xStep;
			y += yStep;
			dist++;
			if (x === 0 && y === 0) continue; // exclude origin
			// if there's a wire crossing
			if (grid[x] && grid[x][y]) {
				const nyDist = Math.abs(x)+Math.abs(y)
				if (nyDist < minNYDistance) {
					minNYDistance = nyDist;
				}
				const sigDist = grid[x][y] + dist;
				if (sigDist < minSigDistance) {
					console.log({
						first: grid[x][y],
						second: dist,
					});
					minSigDistance = sigDist;
				}
			}
		}
	});
	// mark the grid (separate step because we don't count a wire crossing itself)
	x = 0;
	y = 0;
	dist = 0;
	wire.map((segment) => {
		const { magitude, xStep, yStep } = segment;
		for (let step = 0; step < magitude; step++) {
			dist++;
			x += xStep;
			y += yStep;
			if (x === 0 && y === 0) continue; // exclude origin
			grid[x] = grid[x] || {};
			if (!grid[x][y]) {
				grid[x][y] = dist;
			}
		}
	});
	//printGrid(grid);

	// Part 2


}).then(() => {
	console.log(`min manhattan distance: ${minNYDistance}`);
	console.log(`min signal distance: ${minSigDistance}`);
});




