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

/*
machine {
	tape: [],
	register: null,
	offset: 
}
*/

function setValue(tape, position, newVal) {
	tape[position] = newVal;
}

function getValue(tape, position) {
	return tape[position];
}

function getInput() {
	// 1 for AC / pt 1
	// 5 for thermal / pt 2
	return 5;
}

function putOutput(val) {
	console.log(`> ${val}`);
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
		op: function store({tape, register, offset}) {
			const num = getInput();
			const loc = getValue(tape, offset+1);
			setValue(tape, loc, num);
		},
	},
	// Opcode 4 outputs the value of its only parameter. 
	// For example, the instruction 4,50 would output the value at address 50.
	4: {
		length: 2,
		op: function load(machine) {
			const { tape, offset } = machine;
			const loc = getValue(tape, offset+1);
			putOutput(getValue(tape, loc));
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

function execute(machine) {
	while (getValue(machine.tape, machine.offset) !== 99) {
		const opCodeWithModes = getValue(machine.tape, machine.offset);
		const op = ops[opCodeWithModes % 100];
		const modes = [
			Math.floor(opCodeWithModes / 100) % 10, 
			Math.floor(opCodeWithModes / 1000) % 10,
			Math.floor(opCodeWithModes / 10000) % 10,
		];
		op.op(machine, modes);
		machine.offset += op.length;
	}
}

let input = [];
forEachLineIn('input.txt', (txt) => {
	input = txt.split(',').map(num => parseInt(num, 10));
}).then(() => {
	const machine = {
		offset: 0,
		tape: input.concat([]),
		register: 0,
	};
	console.log('before: ', machine);
	execute(machine);
	console.log('after:', machine);
})
/*.then(() => {
	for (let i = 0; i <= 99; i++) {
		for (let j = 0; j <= 99; j++) {
			console.log(i,j);
			const pt2 = input.concat([]);
			setValue(pt2, 1, i);
			setValue(pt2, 2, j);
			execute(pt2);
			if (pt2[0] === 19690720) {
				console.log(`solution: ${i}, ${j} => ${100*i+j}`);
				return;
			}
		}
	}
})*/