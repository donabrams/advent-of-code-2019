function setToNextNumber(digits) {
	// increment lowest non-9
	let lowestChangeableDigit = 0;
	for (let i = 5; i > 0; i--) {
		if (digits[i] < 9) {
			lowestChangeableDigit = i;
			break;
		}
	}
	digits[lowestChangeableDigit] = digits[lowestChangeableDigit] + 1;

	// set digits to right of i to same digit
	if (lowestChangeableDigit < 5) {
		for (let i = lowestChangeableDigit; i <= 5; i++) {
			digits[i] = digits[lowestChangeableDigit];
		}
	}

	// ensure a repeated sequence exists
	if (lowestChangeableDigit === 5) {
		let hasRepeat = false;
		for (let i = 0; i < 4; i++) {
			if (digits[i] === digits[i+1]) {
				hasRepeat = true;
				break;
			}
		}
		if (!hasRepeat) {
			digits[4] = digits[5];
		}
	}

	// ensure there is at least one pair
	let hasPair = false;
	for (let i = 0; i <=4; i++) {
		if (digits[i] === digits[i+1]
			&& (i > 3 || digits[i+1] !== digits[i+2])
			&& (i === 0 || digits[i] !== digits[i-1]))
		{
			hasPair = true;
			break;
		}
	}
	if (!hasPair) {
		console.log(`skipped ${digits.join("")}`);
		setToNextNumber(digits);
	}
}

let digits = [1, 8, 8, 8, 9, 9];
let count = 1;

let progress = 0;
let max = [6, 5, 7, 4, 7, 4];
let pastMax = false;

while (true) {
	setToNextNumber(digits);

	for (let i = 0; i < 6; i++) {
		if (digits[i] > max[i]) {
			pastMax = true;
			break;
		} else if (digits[i] < max[i]) {
			break;
		}
	}
	if (pastMax) {
		console.log({count, failure: digits.join("")});
		break;
	} else {
		count++;
		console.log({count, val: digits.join("")});
	}
}


/*

188888 
188889 +1
188899 +10
188999 +100
189999 +1000
199999 +10000
222222 
222223
...
234559
234566
234577
234588
234599
234666
...
234669
234677
234688
234699
234777

It is a six-digit number.
The value is within the range given in your puzzle input.
Two adjacent digits are the same (like 22 in 122345).
Going from left to right, the digits never decrease; they only ever increase or stay the same (like 111123 or 135679).

*/