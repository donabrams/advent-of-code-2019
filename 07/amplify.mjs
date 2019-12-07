import readline from 'readline';
import fs from 'fs';


// chain of amplifiers running IntCode
// amplifies block/wait for input
// find the largest output signal that can be sent to the thrusters given different phase configurations

// 5 phases used once 0-4
// 5 x 4 x 3 x 2 phase configs like [ 1, 2, 3, 4, 5]
const phaseConfigs = [];
// pt1:
// loadPhaseConfigs(phaseConfigs, [], [ 0, 1, 2, 3, 4]);
// pt2:
loadPhaseConfigs(phaseConfigs, [], [ 5, 6, 7, 8, 9 ]);
function loadPhaseConfigs(out, config, left) {
	if (config.length === 5) {
		out.push(config);
	}
	else {
		for (let i = 0; i < left.length; i++) {
			let newLeft = [...left];
			let next = newLeft.splice(i, 1)[0];
			loadPhaseConfigs(out, [...config, next], newLeft);
		}
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
let program = [];
forEachLineIn('input.txt', (txt) => {
	program = txt.split(',').map(num => parseInt(num, 10));
}).then(async () => {
	let maxOutput = 0;
	let maxConfig = null;
	for (let config of phaseConfigs) {
		// setup io channels
		const ioChannels = [ channel(), channel(), channel(), channel(), channel() ];
		for (let i = 0; i <= 4; i++) {
			ioChannels[i].produce(config[i]);
		}
		ioChannels[0].produce(0);
		const machines = []
		for (let i = 0; i <= 4; i++) {
			const machine = getMachine(program, ioChannels[i], ioChannels[i === 4 ? 0 : i+1]);
			machines.push(execute(machine));
		}
		await Promise.all(machines)
		const lastOutput = ioChannels[0].getLastSignal();
		if (lastOutput > maxOutput) {
			maxOutput = lastOutput;
			maxConfig = config;
		}
		console.log({config, lastOutput});
	}
	console.log({setting: maxConfig.join(""), maxOutput})
});

function getMachine(program, input, output) {
	return {
		offset: 0,
		tape: program.concat([]),
		register: 0,
		input,
		output,
	};
}

function channel() {
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
		console.log(val);
		lastSignal = val;
		buffer.push(val);
		signal();
	};
	return {
		produce,
		consume,
		getLastSignal: () => lastSignal,
	};
}

function setValue(tape, position, newVal) {
	tape[position] = newVal;
}

function getValue(tape, position) {
	return tape[position];
}

async function getInput(input) {
	return await input.consume();
}

function putOutput(output, val) {
	output.produce(val);
}

const POSITION_MODE = 0;
const IMMEDIATE_MODE = 1;

const ops = {
	1: {
		length: 4,
		op: function add({ tape, offset }, modes) {
			const a = modes[0] === IMMEDIATE_MODE
				? getValue(tape, offset+1)
				: getValue(tape, getValue(tape, offset+1));
			const b = modes[1] === IMMEDIATE_MODE
				? getValue(tape, offset+2)
				: getValue(tape, getValue(tape, offset+2));
			const loc = getValue(tape, offset+3);
			setValue(tape, loc, a+b);
		},
	},
	2: {
		length: 4,
		op: function mul({ tape, offset }, modes) {
			const a = modes[0] === IMMEDIATE_MODE
				? getValue(tape, offset+1)
				: getValue(tape, getValue(tape, offset+1));
			const b = modes[1] === IMMEDIATE_MODE
				? getValue(tape, offset+2)
				: getValue(tape, getValue(tape, offset+2));
			const loc = getValue(tape, offset+3);
			setValue(tape, loc, a*b);
		},
	},
	// Opcode 3 takes a single integer as input and saves it to the address given by its only parameter. 
	// For example, the instruction 3,50 would take an input value and store it at address 50.
	3: {
		length: 2,
		op: async function store({tape, register, offset, input}) {
			const num = await getInput(input);
			const loc = getValue(tape, offset+1);
			setValue(tape, loc, num);
		},
	},
	// Opcode 4 outputs the value of its only parameter. 
	// For example, the instruction 4,50 would output the value at address 50.
	4: {
		length: 2,
		op: function load(machine) {
			const { tape, offset, output } = machine;
			const loc = getValue(tape, offset+1);
			putOutput(output, getValue(tape, loc));
		},
	},
	// Opcode 5 is jump-if-true: if the first parameter is non-zero, it sets the instruction pointer to 
	// the value from the second parameter. Otherwise, it does nothing.
	5: {
		length: 0,
		op: function jmp1(machine, modes) {
			const { tape, offset } = machine;
			const a = modes[0] === IMMEDIATE_MODE
				? getValue(tape, offset+1)
				: getValue(tape, getValue(tape, offset+1));
			if (a !== 0) {
				const b = modes[1] === IMMEDIATE_MODE
					? getValue(tape, offset+2)
					: getValue(tape, getValue(tape, offset+2));
				machine.offset = b;
			} else {
				machine.offset += 3;
			}
		}
	},
	// Opcode 6 is jump-if-false: if the first parameter is zero, it sets the instruction pointer to the 
	// value from the second parameter. Otherwise, it does nothing.
	6: {
		length: 0,
		op: function jmp0(machine, modes) {
			const { tape, offset } = machine;
			const a = modes[0] === IMMEDIATE_MODE
				? getValue(tape, offset+1)
				: getValue(tape, getValue(tape, offset+1));
			if (a === 0) {
				const b = modes[1] === IMMEDIATE_MODE
					? getValue(tape, offset+2)
					: getValue(tape, getValue(tape, offset+2));
				machine.offset = b;
			} else {
				machine.offset += 3;
			}
		}
	},
	// Opcode 7 is less than: if the first parameter is less than the second parameter, it stores 1 in 
	// the position given by the third parameter. Otherwise, it stores 0.
	7: {
		length: 4,
		op: function lt(machine, modes) {
			const { tape, offset } = machine;
			const a = modes[0] === IMMEDIATE_MODE
				? getValue(tape, offset+1)
				: getValue(tape, getValue(tape, offset+1));
			const b = modes[1] === IMMEDIATE_MODE
				? getValue(tape, offset+2)
				: getValue(tape, getValue(tape, offset+2));
			const loc = getValue(tape, offset+3);
			setValue(tape, loc, a < b ? 1 : 0);
		}
	},
	// Opcode 8 is equals: if the first parameter is equal to the second parameter, it stores 1 in the 
	// position given by the third parameter. Otherwise, it stores 0.
	8: {
		length: 4,
		op: function eq(machine, modes) {
			const { tape, offset } = machine;
			const a = modes[0] === IMMEDIATE_MODE
				? getValue(tape, offset+1)
				: getValue(tape, getValue(tape, offset+1));
			const b = modes[1] === IMMEDIATE_MODE
				? getValue(tape, offset+2)
				: getValue(tape, getValue(tape, offset+2));
			const loc = getValue(tape, offset+3);
			setValue(tape, loc, a === b ? 1 : 0);
		}
	},
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