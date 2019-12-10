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

function gcd(a,b) { return b ? gcd(b, a % b) : a; }

function vector([x0, y0], [x1, y1]) {
	return [x1-x0, y1-y0];
}

function simplify([x,y]) {
	const xNeg = x < 0;
	const yNeg = y < 0;
	if (x === 0) {
		return [0,yNeg ? -1 : 1];
	}
	if (y === 0) {
		return [xNeg ? -1 : 1, 0];
	}
	const xyGcd = gcd(xNeg ? -x : x, yNeg ? -y : y);
	return [ x/xyGcd, y/xyGcd ];
}

const EMPTY = "."
const ASTEROID = "#";

function blockField([w, h], station, asteroid, field) {
	const [ x0, y0 ] = asteroid;
	const [ vx, vy ] = simplify(vector(station, asteroid));
	// blocked unseeable location
	let bx = x0 + vx;
	let by = y0 + vy;
	while (bx >= 0 && bx < w && by >= 0 && by < h) {
		if (field[by*w + bx] === ASTEROID) {
			field[by*w + bx] = EMPTY; // "delete" any asteroid that's not seeable
		}
		bx += vx;
		by += vy;
	}
}

function displayField([w], field) {
	const s = [...field];
	let i = 0;
	while (s.length) {
		console.log((i < 10 ? "0" : "") + (i++) + " " + s.splice(0,w).join(""));
	}
}

function displayKills([w], field, killList) {
	const s = [...field];
	let i = 0;
	for (let coords of killList) {
		const [ x, y ] = coords;
		s[y*w+x] = i++ + "";
	}
	i = 0;
	while (s.length) {
		console.log((i < 10 ? "0" : "") + (i++) + " " + 
			s.splice(0,w).map((c) => {
				if (c === EMPTY) {
					return "     ";
				}
				if (c === ASTEROID) {
					return " [-] ";
				}
				return c > 99
					? " " + c + " "
					: c > 9
						? "  " + c + " "
						: "  " + c + "  ";
			}).join("")
		);
	}
}

/*
function displayAngles([w, h], field, station) {
	const [ sx, sy ] = station;
	for (let i = 0; i < w; i++) {
		for (let j = 0; j < h; j++) {
			const n = j*w + i;
			if (j === sx && j === sy) {
				field[n] = " [++] ";
			}
			else if (field[n] === ASTEROID) { 
				field[n] = " " + getAngle(station, [i, j]).toString().substr(0,4) + " ";
			} else {
				field[n] = "      ";
			}
		}
	}
	const s = [...field];
	let i = 0;
	while (s.length) {
		console.log((i < 10 ? "0" : "") + (i++) + " " +  s.splice(0,w).join(""));
	}
}*/
/*
function displayDist([w, h], field, station) {
	const [ sx, sy ] = station;
	for (let i = 0; i < w; i++) {
		for (let j = 0; j < h; j++) {
			const n = j*w + i;
			if (j === sx && j === sy) {
				field[n] = " [] ";
			}
			else if (field[n] === ASTEROID) { 
				const dist = Math.sqrt((i - sx)*(i - sx) + (j - sy)*(j - sy)).toString().substr(0,3);
				field[n] = " " + dist + (dist < 10 ? " " : "  ");
			} else {
				field[n] = "    ";
			}
		}
	}
	const s = [...field];
	let i = 0;
	while (s.length) {
		console.log((i < 10 ? "0" : "") + (i++) + " " +  s.splice(0,w).join(""));
	}
}*/

function countAsteroids(dimensions, field, station, print) {
	const f = [...field];
	const [w, h] = dimensions;
	const [ x0, y0 ] = station;
	f[y0*w + x0] = EMPTY; // clear the station
	// slight optimization: start at the same row as the station
	for (let j = y0; j < h; j++) {
		const yBase = j*w;
		for (let i = 0; i < w; i++) {
			if (f[yBase + i] === ASTEROID) {
				blockField(dimensions, station, [i, j], f);
			}
		}
	}
	for (let j = y0-1; j >= 0; j--) {
		const yBase = j*w;
		for (let i = 0; i < w; i++) {
			if (f[yBase + i] === ASTEROID) {
				blockField(dimensions, station, [i, j], f);
			}
		}
	}
	let count = 0;
	for (let i = 0; i < w*h; i++) {
		if (f[i] === ASTEROID) {
			count++;
		}
	}
	if (print) {
		console.log({ station, count });
		displayField(dimensions, f);
	}
	return count;
}

function getMax(dimensions, field) {
	const [w, h] = dimensions;
	let maxAsteroids = 0;
	let maxCoords;
	for (let j = 0; j < h; j++) {
		const yBase = j*w;
		for (let i = 0; i < w; i++) {
			if (field[yBase + i] === ASTEROID) {
				const numAsteroidsSeen = countAsteroids(dimensions, field, [i, j]);
				if (numAsteroidsSeen > maxAsteroids) {
					maxAsteroids = numAsteroidsSeen;
					maxCoords = [i, j];
				}
			}
		}
	}
	displayField(dimensions, field);
	countAsteroids(dimensions, field, maxCoords, true);
	return maxCoords;
}

function getAngle([ sx, sy ], [x, y]) {
	const dx = x - sx;
	const dy = y - sy;
	// angle is based from vertical access going clockwise
	if (dx === 0|| dy === 0 ) {
		return dx === 0
			? dy > 0
				? 180
				: 0
			: dx > 0
				? 90
				: 270;
	}
	const angle = Math.atan2(dx, -dy) * 180 / Math.PI;
	// negative angles need to be revolved again
	return angle < 0
		? angle + 360
		: angle;
}

function killOrder(dimensions, field, station) {
	const [ w, h ] = dimensions;
	const [ sx, sy ] = station;
	const asteroids = {};
	let asteroidId = 0;
	let ids = [];
	for (let i = 0; i < w; i++) {
		for (let j = 0; j < h; j++) {
			if (field[j*w+i] === ASTEROID && (i !== sx || j !== sy) ) {
				asteroids[asteroidId] =  { coords: [i, j] };
				ids.push(asteroidId);
				asteroidId++;
			}
		}
	}
	for (let id in asteroids) {
		const asteroid = asteroids[id];
		const { coords: [ x, y ] } = asteroid;
		asteroid.dist = (x - sx)*(x - sx) + (y - sy)*(y - sy);
		asteroid.angle = getAngle(station, asteroid.coords);
	}
	// sort by angle then distance
	ids.sort((a, b) => {
		const aa = asteroids[a];
		const bb = asteroids[b];
		const deltaAngle = aa.angle - bb.angle;
		if (deltaAngle < 0.0001 && deltaAngle > -0.0001) {
			return aa.dist - bb.dist;
		} else if (bb.angle < aa.angle) {
			return 1;
		}
		return -1;
	});
	// map the sorted asteroid id list into orbitals
	const orbitals = ids.reduce((acc, id) => {
			const { dist, angle, coords } = asteroids[id];
			const { lastAngle, orbitals, lastOrbital } = acc;
			if (lastAngle !== angle) {
				orbitals[0].push(coords);
				acc.lastAngle = angle;
				acc.lastOrbital = 0;
			} else {
				orbitals[lastOrbital+1] = orbitals[lastOrbital+1] || [];
				orbitals[lastOrbital+1].push(coords);
				acc.lastOrbital = lastOrbital+1;
			}
			return acc;
		}, { lastAngle: -1, lastOrbital: 0, orbitals: [[]] })
		.orbitals;
	const killList = orbitals.flat();
	displayKills(dimensions, field, killList);
	return killList;
}

let field = [];
let dimensions;
forEachLineIn('input.txt', (txt) => {
	const chars = txt.split("");
	if (!dimensions) {
		dimensions = [chars.length, 0];
	}
	dimensions[1]++;
	field.splice(Infinity, 0, ...chars);
}).then(async () => {
	console.log({ dimensions });
	const station = getMax(dimensions, field);
	const killList = killOrder(dimensions, field, station);
	console.log(`200th: ${killList[199]}`);
});



