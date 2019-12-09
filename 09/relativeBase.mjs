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

let program = [];
forEachLineIn('input.txt', (txt) => {
	program = txt.split(',').map(num => parseInt(num, 10));
}).then(async () => {
	let input = channel();
	input.produce(1);
	let output = channel();
	const machine = getMachine(program, input, output);
	await(execute(machine));
}).then(async () => {
	let input = channel();
	input.produce(2);
	let output = channel();
	const machine = getMachine(program, input, output);
	await(execute(machine));
});



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
		console.log(`> ${val}`);
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