import readline from 'readline';
import fs from 'fs';

// direction
const NORTH = 1;
const SOUTH = 2;
const WEST = 3;
const EAST = 4;
const EXIT = -1;

// terrain
const WALL = 0;
const OPEN = 1;
const OXYGEN = 2;
const UNKNOWN = -1;

let program = [];
forEachLineIn('input.txt', (txt) => {
	program = txt.split(',').map(num => parseInt(num, 10));
}).then(async () => {
	let input = channel("input  ");
	let output = channel("output ");

	let world = {
		robot: [0, 0],
		field: {}
	};

	setupRobot(input, output, world);

	const machine = getMachine(program, input, output);
	await(execute(machine));

});

async function setupRobot(input, output) {
	// setup initial plan
	const plan = {
		target: [0,-1],
		directions: [],
		// nextPaths: references paths directly so setup below
		paths: {
			"-1": {
				0: [null, WEST, 1, -1, 0],
			},
			0: {
				1: [null, SOUTH, 1, 0, 1],
				0: [null, null, 0, 0, 0],
				"-1": [null, NORTH, 1, 0, -1],
			},
			1: {
				0: [null, EAST, 1, 1, 0],
			},
		}
	};
	plan.nextPaths = [
		// paths[0][-1] is current directions/target
		plan.paths[1][0],
		plan.paths[0][1],
		plan.paths[-1][0],
	];
	const world = {
		robot: [0,0],
		field: {
			0: {
				0: OPEN,
			},
		},
	};

	let dir = NORTH; // go NORTH to [0][1]
	do {
		const lastResult = await move(dir, input, output, world, plan);
		dir = getNextMove(world, lastResult, plan);
	} while (dir)

	drawWorld(world);

	const [x, y] = world.oxygen;
	const hasO2 = { [x]: { [y]: 1 } };
	const queue = vacuumNeighbors([x, y, 1], world, hasO2);

	let cell;
	while (queue.length) {
		cell = queue.shift();
		vacuumNeighbors(cell, world, hasO2).forEach((p)=>queue.push(p));
	}
	console.log(`Full O2 in ${hasO2[cell[0]][cell[1]]-1} min`);
}

function vacuumNeighbors([x, y, min], world, hasO2) {
	const neighbors = [];
	const toCheck = [
		[x+1, y],
		[x-1, y],
		[x, y+1],
		[x, y-1],
	];
	for (let i = 0; i < 4; i++) {
		const [ x, y ] = toCheck[i];
		const type = world.field[x] ? world.field[x][y] : WALL;
		if (type === OPEN) {
			if (!hasO2[x] || !hasO2[x][y]) {
				hasO2[x] = hasO2[x] || {};
				hasO2[x][y] = min+1;
				neighbors.push([x, y, min+1]);
			}
		}
	}
	return neighbors;
}

// return next direction robot should take
// also updates the plan if the current target is reached
function getNextMove(world, lastResult, plan) {
	const [ terrain, x, y ] = lastResult;
	// paths[x][y] -> [prevPath, newDir, distance, x, y]
	const { target: [ tx, ty ], nextPaths, paths } = plan;
	const { robot: [ rx, ry ], field } = world;

	if (x === 0 && y === 0) {
		// At origin: setup a new path
		const nextPath = nextPaths.shift(); // take from front (FIFO)
		if (!nextPath) {
			return null;
		}
		const [,,,nx,ny] = nextPath;
		plan.target = [nx, ny];
		plan.directions = getDirs(nextPath);
	} else if (x === tx && ty === y) {
		// At target: update map and go back to origin
		if (terrain === WALL) {
			// go back to origin
			plan.directions = getReverseDirs(paths[rx][ry]);
			// special case for when at origin and a wall is "found"
			if (rx === 0 && ry === 0) {
				const nextPath = nextPaths.shift(); // take from front (FIFO)
				const [,,,nx,ny] = nextPath;
				plan.target = [nx, ny];
				plan.directions = getDirs(nextPath);
			}
		} else {
			if (terrain === OXYGEN) {
				console.log(`minInstructions to oxygen: ${paths[x][y][2]}`);
				world.oxygen = [x, y];
			}
			// go back to origin
			plan.directions = getReverseDirs(paths[x][y]);
			// add more paths to search
			const toCheck = [
				[x+1, y, EAST],
				[x-1, y, WEST],
				[x, y+1, SOUTH],
				[x, y-1, NORTH],
			];
			for (let i = 0; i < 4; i++) {
				const [xp, yp, dir] = toCheck[i];
				if (!paths[xp] || !paths[xp][yp]) {
					const [ ,, dist] = paths[x][y];
					const newPath = [paths[x][y], dir, dist+1, xp, yp];
					paths[xp] = paths[xp] || {};
					paths[xp][yp] = newPath;
					nextPaths.push(newPath); // add to end (FIFO)
				}
			}
		}
	}
	return plan.directions.shift();
}

function getDirs(path) {
	const next = [];
	while (path) {
		const [rest, last] = path;
		next.unshift(last);
		path = rest;
	}
	return next;
}

function getReverseDirs(path) {
	const reverse = [];
	while (path) {
		const [rest, next] = path; 
		switch(next) {
			case NORTH:
				reverse.push(SOUTH);
				break;
			case SOUTH:
				reverse.push(NORTH);
				break;
			case EAST:
				reverse.push(WEST);
				break;
			case WEST: 
				reverse.push(EAST);
				break;
		}
		path = rest;
	}
	return reverse;
}

// returns Promise[[terrain, x, y]]
function move(dir, input, output, world, plan) {
	const [ x0, y0 ] = world.robot;
	let probe;
	switch (dir) {
		case NORTH:
			probe = [ x0, y0-1];
			break;
		case SOUTH:
			probe = [ x0, y0+1];
			break;
		case EAST:
			probe = [ x0+1, y0];
			break;
		case WEST: 
			probe = [ x0-1, y0];
			break;
	}
	if (!probe) {
		console.log({ world, dir, plan });
	}
	const [ x, y ] = probe;
	input.produce(dir);
	return output.consume()
		.then((terrain) => {
			switch(terrain) {
				case WALL: {
					world.field[x] = world.field[x] || {};
					world.field[x][y] = WALL;
				} break;
				case OPEN: {
					world.robot[0] = x;
					world.robot[1] = y;
					world.field[x] = world.field[x] || {};
					world.field[x][y] = OPEN;
				} break;
				case OXYGEN: {
					world.robot[0] = x;
					world.robot[1] = y;
					world.field[x] = world.field[x] || {};
					world.field[x][y] = OXYGEN;
				} break;
			}
			return [terrain, x, y];
		});
}

function getMinMax(obj) {
	let keys = Object.keys(obj).map((s)=>parseInt(s, 10));
	let min = Infinity;
	let max = -Infinity;
	for (let i of keys) {
		if (i < min) {
			min = i;
		}
		if (i > max) {
			max = i;
		}
	}
	return [ min, max ];
}

function drawWorld(world) {
	const { robot, field } = world;

	const [ rx, ry ] = robot;

	const [ xMin, xMax ] = getMinMax(field);

	let [ yMin, yMax ] = getMinMax(field[xMax]);
	for (let i = xMin; i < xMax; i++) {
		const [ min, max ] = getMinMax(field[i]);
		if (min < yMin) {
			yMin = min;
		}
		if (max > yMax) {
			yMax = max;
		}
	}

	for (let j = yMin-1; j <= yMax+1; j++) {
		const line = [];
		for (let i = xMin-1; i <= xMax+1; i++) {
			if (i === rx && j === ry) {
				line.push("D");
			} else {
				const type = field[i] 
					? field[i][j] || field[i][j] === 0 
						? field[i][j] 
						: UNKNOWN
					: UNKNOWN;
				switch(type) {
					case UNKNOWN:
						line.push(" ");
						break;
					case WALL:
						line.push("#");
						break;
					case OPEN:
						line.push(".");
						break;
					case OXYGEN:
						line.push("$");
						break;
				}
			}
		}
		console.log(line.join(""));
	}
}

async function forEachLineIn(file, perLine) {
	const reader = readline.createInterface({
		input: fs.createReadStream(file)
	});

	for await (const line of reader) {
		perLine(line);
	}
}

function getMachine(program, input, output) {
	return {
		offset: 0,
		tape: program.concat([]),
		register: 0,
		input,
		output,
		relativeBase: 0,
	};
}

function channel(name) {
	const buffer = [];
	const wait = [];
	let lastSignal;
	const consume = function() {
		return buffer.length > 0
			? Promise.resolve(buffer.shift())
			: new Promise((resolve) => {
				wait.push((val) => resolve(val));
			});
	};
	const signal = function() {
		if (wait.length && buffer.length) {
			const next = buffer.shift();
			const waiter = wait.shift();
			waiter(next);
		}
	};
	const produce = function(val) {
		//console.log(`${name}> ${val}`);
		lastSignal = val;
		buffer.push(val);
		signal();
	};
	return {
		produce,
		consume,
		getLastSignal: () => lastSignal,
		getBuffer: () => buffer,
	};
}

function setValue(tape, position, newVal) {
	tape[position] = newVal;
}

function getValue(tape, position) {
	return tape[position] ? tape[position] : 0;
}

async function getInput(input) {
	return await input.consume();
}

function putOutput(output, val) {
	output.produce(val);
}

const POSITION_MODE = 0;
const IMMEDIATE_MODE = 1;
const RELATIVE_MODE = 2;

function getVal(mode, instrOffset, machine) {
	return getValue(machine.tape, getAddr(mode, instrOffset, machine));
}

function getAddr(mode, instrOffset, machine) {
	const { tape, offset, relativeBase } = machine;
	switch(mode) {
		case POSITION_MODE:
			return getValue(tape, instrOffset + offset);
		case IMMEDIATE_MODE:
			return instrOffset + offset;
		case RELATIVE_MODE:
			return relativeBase + getValue(tape, instrOffset + offset);
	}
}

const ops = {
	1: {
		length: 4,
		op: function add(machine, [ma, mb, mc]) {
			const { tape } = machine;
			const a = getVal(ma, 1, machine);
			const b = getVal(mb, 2, machine);
			const loc = getAddr(mc, 3, machine);
			setValue(tape, loc, a+b);
		},
	},
	2: {
		length: 4,
		op: function mul(machine, [ma, mb, mc]) {
			const { tape } = machine;
			const a = getVal(ma, 1, machine);
			const b = getVal(mb, 2, machine);
			const loc = getAddr(mc, 3, machine);
			setValue(tape, loc, a*b);
		},
	},
	// Opcode 3 takes a single integer as input and saves it to the address given by its only parameter. 
	// For example, the instruction 3,50 would take an input value and store it at address 50.
	3: {
		length: 2,
		op: async function input(machine, [ma]) {
			const { tape, input } = machine;
			const num = await getInput(input);
			const loc = getAddr(ma, 1, machine);
			setValue(tape, loc, num);
		},
	},
	// Opcode 4 outputs the value of its only parameter. 
	// For example, the instruction 4,50 would output the value at address 50.
	4: {
		length: 2,
		op: function output(machine, [ma]) {
			const { output } = machine;
			putOutput(output, getVal(ma, 1, machine));
		},
	},
	// Opcode 5 is jump-if-true: if the first parameter is non-zero, it sets the instruction pointer to 
	// the value from the second parameter. Otherwise, it does nothing.
	5: {
		length: 0,
		op: function jmp1(machine, [ma, mb]) {
			const a = getVal(ma, 1, machine);
			machine.offset = a !== 0
				? getVal(mb, 2, machine)
				: machine.offset + 3;
		}
	},
	// Opcode 6 is jump-if-false: if the first parameter is zero, it sets the instruction pointer to the 
	// value from the second parameter. Otherwise, it does nothing.
	6: {
		length: 0,
		op: function jmp0(machine, [ma, mb]) {
			const a = getVal(ma, 1, machine);
			machine.offset = a === 0
				? getVal(mb, 2, machine)
				: machine.offset + 3;
		}
	},
	// Opcode 7 is less than: if the first parameter is less than the second parameter, it stores 1 in 
	// the position given by the third parameter. Otherwise, it stores 0.
	7: {
		length: 4,
		op: function lt(machine, [ma, mb, mc]) {
			const { tape } = machine;
			const a = getVal(ma, 1, machine);
			const b = getVal(mb, 2, machine);
			const loc = getAddr(mc, 3, machine);
			setValue(tape, loc, a < b ? 1 : 0);
		}
	},
	// Opcode 8 is equals: if the first parameter is equal to the second parameter, it stores 1 in the 
	// position given by the third parameter. Otherwise, it stores 0.
	8: {
		length: 4,
		op: function eq(machine, [ma, mb, mc]) {
			const { tape } = machine;
			const a = getVal(ma, 1, machine);
			const b = getVal(mb, 2, machine);
			const loc = getAddr(mc, 3, machine);
			setValue(tape, loc, a === b ? 1 : 0);
		}
	},
	// Opcode 9 adjusts the relative base by the value of its only parameter. 
	// The relative base increases (or decreases, if the value is negative) by the value of the parameter.
	9: {
		length: 2,
		op: function movl(machine, [ma]) {
			const { relativeBase } = machine;
			machine.relativeBase += getVal(ma, 1, machine);
		}

	}
}

async function execute(machine) {
	while (getValue(machine.tape, machine.offset) !== 99) {
		const opCodeWithModes = getValue(machine.tape, machine.offset);
		const op = ops[opCodeWithModes % 100];
		const modes = [
			Math.floor(opCodeWithModes / 100) % 10, 
			Math.floor(opCodeWithModes / 1000) % 10,
			Math.floor(opCodeWithModes / 10000) % 10,
		];
		await op.op(machine, modes);
		machine.offset += op.length;
	}
}