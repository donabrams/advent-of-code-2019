import readline from 'readline';
import fs from 'fs';


let equations = {};
forEachLineIn('input.txt', (txt) => {
	// 39 TCLZ, 17 DKHX, 7 HVPQT, 1 DWMW, 33 THWX, 67 JVGP, 44 RDZSG, 7 JCKT, 22 TDSC, 1 QHVR => 1 FUEL
	const [ ingredientsStr, resultStr ] = txt.split('=>');
	// [ "39 TCLZ, 17 DKHX, 7 HVPQT, 1 DWMW, 33 THWX, 67 JVGP, 44 RDZSG, 7 JCKT, 22 TDSC, 1 QHVR ", " 1 FUEL" ]
	const reactants = ingredientsStr.split(',')
		// [ ..., " 17 DKHX", ...]
		.map((ingredient) => ingredient.trim().split(" "))
		// [ " 17", "DKHX" ]
		.map(([ num, reactantName ])=> [ reactantName, parseInt(num, 10) ]);
		// [ "DKHX", 17 ]
	const [ count, productName ] = resultStr.trim().split(" ");
	// [ "1", "FUEL" ]
	equations[productName] = {
		productPerReaction: parseInt(count, 10),
		reactants,
	};
}).then(async () => {
	let numOre = 1000000000000;
	const needs = [ ["FUEL", Math.ceil(numOre / 337075)] ];
	const have = {};
	const produced = {};
	const consumed = {};
	while (numOre > 0) {
		if (!needs.length) {
			console.log(numOre);
			needs.push([ "FUEL", Math.ceil(numOre / 337075)]);
		}
		let [ product, productNeeded ] = needs.pop();
		if (have[product] && have[product] > productNeeded) {
			have[product] -= productNeeded;
			continue;
		}

		// remove anything we already have on hand
		productNeeded -= have[product] || 0;
		have[product] = 0;

		// determine the number of reactions needed
		const { productPerReaction, reactants } = equations[product];
		const numReactions = Math.ceil(productNeeded / productPerReaction);

		// update product
		const productProduced = numReactions * productPerReaction;
		have[product] = productProduced - productNeeded;

		// queue up or use up reactants
		produced[product] = (produced[product] || 0) + productProduced;
		reactants.forEach(([ reactant, num ]) => {
			let requiredAmount = numReactions * num;
			consumed[reactant] = (consumed[reactant] || 0) + requiredAmount;
			if (reactant === "ORE") {
				numOre -= num * numReactions;
			} else if (have[reactant]) {
				if (requiredAmount > have[reactant]) {
					needs.push([ reactant, requiredAmount - have[reactant] ]);
					have[reactant] = 0;
				} else {
					have[reactant] -= requiredAmount;
				}
			} else {
				needs.push([ reactant, requiredAmount ]);
			}
		});
	}
	console.log({ fuelForTrillionOre: produced["FUEL"] - 1 });
});


async function forEachLineIn(file, perLine) {
	const reader = readline.createInterface({
		input: fs.createReadStream(file)
	});

	for await (const line of reader) {
		perLine(line);
	}
}
// how much ore per fuel?
