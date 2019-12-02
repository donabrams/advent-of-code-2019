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

function setValue(input, position, newVal) {
	input[position] = newVal;
}

function getValue(input, position) {
	return input[position];
}

const ops = {
	1: function add(input, offset) {
		const a = getValue(input, getValue(input, offset+1));
		const b = getValue(input, getValue(input, offset+2));
		setValue(input, getValue(input, offset+3), a+b);
	},
	2: function mul(input, offset) {
		const a = getValue(input, getValue(input, offset+1));
		const b = getValue(input, getValue(input, offset+2));
		setValue(input, getValue(input, offset+3), a*b);
	},
}

function execute(input) {
	let offset = 0;
	while (getValue(input, offset) !== 99) {
		const op = getValue(input, offset);
		ops[op](input, offset);
		offset += 4;
	}
}

let input = [];
forEachLineIn('input.txt', (txt) => {
	input = txt.split(',').map(num => parseInt(num, 10));
}).then(() => {
	const pt1 = input.concat([]);
	// overwrite as per instructions
	setValue(pt1, 1, 12);
	setValue(pt1, 2, 2);
	console.log('before: ', pt1.join(','));
	execute(pt1);
	console.log('after:', pt1.join(','));
}).then(() => {
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
})