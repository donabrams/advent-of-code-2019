import readline from 'readline';
import fs from 'fs';


const EMPTY = 0; // is an empty tile. No game object appears in this tile.
const WALL = 1; // is a wall tile. Walls are indestructible barriers.
const BLOCK = 2; // is a block tile. Blocks can be broken by the ball.
const PADDLE = 3; // is a horizontal paddle tile. The paddle is indestructible.
const BALL = 4; // is a ball tile. The ball moves diagonally and bounces off objects.


const JOY_NEUTRAL = 0; // If the joystick is in the neutral position, provide 0.
const JOY_LEFT = -1; // If the joystick is tilted to the left, provide -1.
const JOY_RIGHT = 1; // If the joystick is tilted to the right, provide 1.

let program = [];
forEachLineIn('input.txt', (txt) => {
	program = txt.split(',').map(num => parseInt(num, 10));
}).then(async () => {
	let input = channel("input  ");
	let output = channel("output ");

	const machine = getMachine(program, input, output);
	await(execute(machine));

	const allOutput = output.getBuffer();

	const tiles = [];
	for (let i = 0; i < allOutput.length; i++) {
		tiles.push(allOutput.splice(0, 3));
	}
	console.log({ numBlocks: tiles.filter(([,,type]) => type === BLOCK).length});

}).then(async () => {
	let input = channel("input  ");
	let output = channel("output ");

	const programWithQuarter = [...program];
	programWithQuarter[0] = 2;

	let game = {
		field: {},
		score: 0,
	};

	setupIO(input, output, game);

	const machine = getMachine(programWithQuarter, input, output);
	await(execute(machine));

});

async function setupIO(input, output, game) {
	let paddleX = 0;
	while (true) {
		const x = await output.consume();
		const y = await output.consume();
		const type = await output.consume();

		if (x === -1 && y === 0) {
			game.score = type;
			console.log(`SCORE: ${game.score}`);
			drawField(game.field);
		} else {
			game.field[x] = game.field[x] || {};
			game.field[x][y] = type;
			if (type === BALL) {
				if (x < paddleX) {
					input.produce(JOY_LEFT);
				} else if (x > paddleX) {
					input.produce(JOY_RIGHT);
				} else {
					input.produce(JOY_NEUTRAL);
				}
				drawField(game.field);
			}
			if (type === PADDLE) {
				paddleX = x;
			}
		}

	}
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

function drawField(field) {

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
			const type = field[i] && field[i][j] ? field[i][j] : EMPTY;
			switch(type) {
				case EMPTY:
					line.push("  ");
					break;
				case BALL:
					line.push("()");
					break;
				case WALL:
					line.push("##");
					break;
				case BLOCK:
					line.push("[]");
					break;
				case PADDLE:
					line.push("__");
					break;
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