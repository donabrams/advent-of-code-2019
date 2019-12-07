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

let children = {};
let parent = {};
let first;
forEachLineIn('input.txt', (txt) => {
	const [ p, c ] = txt.split(')');
	if (children[p]) {
		children[p].push(c)
	} else {
		children[p] = [c];
	}
	parent[c] = p;
	if (!first) {
		first = p;
	}
}).then(() => {
	// set first to topmost object
	for (;parent[first];first = parent[first]) {};
	console.log({first});

	let numOrbits = 0;
	let target = first;
	const parents = [];
	const index = [];

	while (target) {
		numOrbits += index.length;
		if (children[target]) {
			index.push(0);
			parents.push(target);
			target = children[target][0];
		} else {
			let i;
			let p;
			do {
				i = index.pop() + 1;
				p = parents.pop();
			} while (p && i === children[p].length);
			if (p) {
				index.push(i);
				parents.push(p);
				target = children[p][i];
			} else {
				target = null;
			}
		}
	}

	console.log({ numOrbits });
}).then(() => {
	let myParents = [];
	let sanParents = [];
	for (let p = "YOU"; parent[p]; p = parent[p], myParents.push(p)) {};
	for (let p = "SAN"; parent[p]; p = parent[p], sanParents.push(p)) {};
	while (myParents.pop() === sanParents.pop()) {};

	console.log({hops: myParents.length + sanParents.length + 2});
})