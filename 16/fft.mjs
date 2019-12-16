import readline from 'readline';
import fs from 'fs';

let input = [];
forEachLineIn('input.txt', (txt) => {
	input = txt.split('').map((s)=>parseInt(s, 10));
})

// pt1 test
/*
.then(async () => {
	input = "12345678".split('').map((s)=>parseInt(s, 10)); // test data


	const m = getBaseMatrix(input.length);

	let r = input;
	for (let i = 0; i < 1; i++) {
		r = mul11(r, m);
	}

	console.log("test pt1", r.splice(0,8).join(""));
})
*/

// pt 1
/*
.then(async () => {

	const m = getBaseMatrix(input.length);

	let r = input;
	for (let i = 0; i < 100; i++) {
		r = mul11(r, m);
	}

	console.log("pt1", r.splice(0,8).join(""));
})*/

// pt 2 optimized matrix calc approach
// still too slow :(
/*
.then(async () => {

	const n = input.length;
	const offset = parseInt(input.slice(0,7).join(""), 10);

	console.log({ offset });

	const numReps = 10000;
	const rn = n * numReps;
	const pt2 = [];
	pt2.length = rn;
	for (let i = 0; i < numReps; i++) {
		for (let j = 0; j < n; j++) {
			pt2[j+i*n] = input[j];
		}
	}

	let r = pt2;
	for (let i = 0; i < 100; i++) {
		console.log(i);
		r = mul11(r);
	}

	console.log("pt2", r.splice(offset,8).join(""));
})*/

// pt 2 realization TEST
/*
.then(async () => {
	input = "340404383404043834040438".split('').map((s)=>parseInt(s, 10)); // test data

	const n = input.length;
	let s = input;
	let r = input.slice(2);
	for (let i = 0; i < 100; i++) {
		console.log(`${i}: ${s.slice(0).join("")} / ${r.slice(0).join("")}`);
		r = mulSubset3(r, 2, n);
		s = mul11(s);
	}

	console.log("test pt2", r.join(""), s.slice(2).join(""));
})
*/

// pt 2 realization
// matrix vals ONLY use vals to the RIGHT

/*
.then(async () => {

	const n = input.length;
	const offset = parseInt(input.slice(0,7).join(""), 10);

	console.log({ offset });

	const numReps = 10000;
	const rn = n * numReps;
	const pt2 = [];
	pt2.length = rn;
	for (let i = 0; i < numReps; i++) {
		for (let j = 0; j < n; j++) {
			pt2[j+i*n] = input[j];
		}
	}
	pt2.splice(0,offset);

	console.log(`cut down from ${rn} to ${pt2.length}`);

	let r = pt2;
	for (let i = 0; i < 100; i++) {
		console.log({iteration: i});
		r = mulSubset3(r, offset, rn);
	}

	console.log("pt2", r.splice(0,8).join(""));
})*/

// take advantage of reversal!
.then(async () => {

	const n = input.length;
	const offset = parseInt(input.slice(0,7).join(""), 10);

	console.log({ offset });

	const numReps = 10000;
	const rn = n * numReps;
	const pt2 = [];
	pt2.length = rn;
	for (let i = 0; i < numReps; i++) {
		for (let j = 0; j < n; j++) {
			pt2[j+i*n] = input[j];
		}
	}
	pt2.splice(0,offset);

	console.log(`cut down from ${rn} to ${pt2.length}`);

	let r = pt2;
	for (let i = 0; i < 100; i++) {
		console.log({iteration: i});
		r = mulSubsetCheat(r, offset, rn);
	}

	console.log("pt2", r.splice(0,8).join(""));
})

// depth-first basic test
/*
.then(async () => {
	input = "12345678".split('').map((s)=>parseInt(s, 10)); // test data

	let ary = "";
	const cache = {};
	for (let i = 0; i < 8; i++) {
		ary += getDigit2(input.length, input, i, 4, cache)
	}
	console.log("test pt2", ary);
});
*/


// depth-first getDigit:

/*
.then(async () => {
	const offset = parseInt(input.slice(0,7).join(""), 10);
	console.log({ offset });
	let ary = "";
	const cache = {};
	for (let i = 0; i < 8; i++) {
		ary += getDigit2(input.length*10000, input, offset+i, 2, cache);
		console.log(ary);
	}
	console.log(ary);
});
*/

// even with cache, SUPER slow!
function getDigit2(n, input, index, numIter, cache) { // -> nx1 transverse
	if (cache[numIter] && cache[numIter][index]) {
		return cache[numIter][index];
	}
	const r = [];
	let i = index+1;
	const step = i * 4;
	let t = 0;
	for (let j = i-1; j < n; j += step) {
		let max = j+i;
		const cap = max > n ? n : max;
		for (let k = j; k < cap; k++) {
			t += numIter === 1
				? input[k % input.length]
				: getDigit2(n, input, k, numIter-1, cache); 
		}
	}
	for (let j = i-1 + i+i; j < n; j += step) {
		let max = j+i;
		const cap = max > n ? n : max;
		for (let k = j; k < cap; k++) {
			t -= numIter === 1
				? input[k % input.length]
				: getDigit2(n, input, k, numIter-1, cache); 
		}
	}
	const result = Math.abs(t % 10);

	if (!cache[numIter]) {
		cache[numIter] = {};
	} else {
		cache[numIter][index] = result;
	}

	return result;
}

// too slow but there are other possible optimizations around memoization?
function getDigit(n, input, index, numIter) { // -> nx1 transverse
	const r = [];
	let i = index+1;
	const step = i * 4;
	let t = 0;
	for (let j = i-1; j < n; j += step) {
		let max = j+i;
		const cap = max > n ? n : max;
		for (let k = j; k < cap; k++) {
			t += numIter === 1 
				? input[k % input.length]
				: getDigit(n, input, k, numIter-1); 
		}
	}
	for (let j = i-1 + i+i; j < n; j += step) {
		let max = j+i;
		const cap = max > n ? n : max;
		for (let k = j; k < cap; k++) {
			t -= numIter === 1 
				? input[k % input.length]
				: getDigit(n, input, k, numIter-1); 
		}
	}
	return Math.abs(t % 10);
}

function mulSubsetCheat(nx1, n0, n) {
	const r = [];
	r.length = n-n0;
	mulSubsetCheatH(r, nx1, n0, n)
	return r.map((n)=>Math.abs(n % 10));
}

function mulSubsetCheatH(r, nx1, n0, n) {
	const l = nx1.length;
	r[l-1] = nx1[l-1];
	for (let i = l-2; i >= 0; i--) {
		// Ugh, this was a simple pattern I missed (applicable only to the second half)
		r[i] = nx1[i] + r[i+1];
	}
}

// assumes nx1 is subset of [n0..n-1] of an n-length array
function mulSubset3(nx1, n0, n) {
	const r = [];
	mulSubset3H(r, nx1, n0, n)
	return r.map((n)=>Math.abs(n));
}

function mulSubset3H(r, nx1, n0, n) {
	let step = n0*4;
	let t = 0;
	let max;
	let cap;
	let subcap = n - n0;
	for (let i = n0+1; i <= n; i++) {
		step += 4;
		t = 0;
		for (let j = i-1-n0; j < n; j += step) {
			max = j+i;
			cap = max > subcap ? subcap : max;
			for (let k = j; k < cap; k++) {
				t += nx1[k];
			}
			max += i+i;
			cap = max > subcap ? subcap : max;
			for (let k2 = j+i+i; k2 < cap; k2++) {
				t -= nx1[k2];
			}
		}
		r[i-n0-1] = t % 10;
	}
}

// assumes nx1 is subset of [n0..n-1] of an n-length array
function mulSubset2(nx1, n0, n) {
	const r = [];
	let step = n0*4;
	let t = 0;
	let max;
	let cap;
	const subMax = n - n0;
	for (let i = n0+1; i <= n; i++) {
		step += 4;
		t = 0;
		for (let j = i-1; j < n; j += step) {
			max = j+i;
			cap = max > n ? subMax : max-n0;
			for (let k = j-n0; k < cap; k++) {
				t += nx1[k];
			}
			max += i+i;
			cap = max > n ? subMax : max-n0;
			for (let k2 = j-n0+i+i; k2 < cap; k2++) {
				t -= nx1[k2];
			}
		}
		r[i-1] = Math.abs(t % 10);
	}
	return r;
}

// assumes nx1 is subset of [n0..n-1] of an n-length array
function mulSubset(nx1, n0, n) {
	const r = [];
	let step = n0*4;
	let t = 0;
	let max;
	let cap;
	for (let i = n0+1; i <= n; i++) {
		step += 4;
		t = 0;
		for (let j = i-1; j < n; j += step) {
			max = j+i;
			cap = max > n ? n : max;
			for (let k = j; k < cap; k++) {
				t += nx1[k-n0];
			}
			max += i+i;
			cap = max > n ? n : max;
			for (let k2 = j+i+i; k2 < cap; k2++) {
				t -= nx1[k2-n0];
			}
		}
		r[i-1] = Math.abs(t % 10);
	}
	return r;
}

function mul11D(nx1) {
	console.log({
		nx1,
		n: nx1.length,
	})
	const n = nx1.length;
	const r = [];
	let step = 0;
	let t = 0;
	let max;
	let cap;
	for (let i = 1; i <= n; i++) {
		step += 4;
		t = 0;
		let log = `${i-1}/${step}: `;
		for (let j = i-1; j < n; j += step) {
			max = j+i;
			cap = max > n ? n : max;
			for (let k = j; k < cap; k++) {
				log += ` +${k} (${nx1[k]})`;
				t += nx1[k];
			}
			max += i+i;
			cap = max > n ? n : max;
			for (let k2 = j+i+i; k2 < cap; k2++) {
				log += ` -${k2} (${nx1[k2]})`;
				t -= nx1[k2];
			}
		}
		console.log(log);
		r[i-1] = Math.abs(t % 10);
	}
	return r;
}

function mul11(nx1) {
	const n = nx1.length;
	const r = [];
	let step = 0;
	let t = 0;
	let max;
	let cap;
	for (let i = 1; i <= n; i++) {
		step += 4;
		t = 0;
		for (let j = i-1; j < n; j += step) {
			max = j+i;
			cap = max > n ? n : max;
			for (let k = j; k < cap; k++) {
				t += nx1[k];
			}
			max += i+i;
			cap = max > n ? n : max;
			for (let k2 = j+i+i; k2 < cap; k2++) {
				t -= nx1[k2];
			}
		}
		r[i-1] = Math.abs(t % 10);
	}
	return r;
}

// Still too slow! Could I do this backwards/pull-based?
// Or does the repeating pattern simplify things (especially since 10000/4 = 2500)?

// We could further optimize max/cap by pulling out the last loop.
// Let's hope it doesn't come to that

function mul10(nx1) {
	const n = nx1.length;
	const r = [];
	let step = 0;
	for (let i = 1; i <= n; i++) {
		let log = `${i}: `;
		step += 4;
		let t = 0;
		for (let j = i-1; j < n; j += step) {
			let max = j+i;
			const cap = max > n ? n : max;
			for (let k = j; k < cap; k++) {
				log += ` +${k}`;
				t += nx1[k];
			}
		}
		for (let j = i-1 + i+i; j < n; j += step) {
			let max = j+i;
			const cap = max > n ? n : max;
			for (let k = j; k < cap; k++) {
				log += ` -${k}`;
				t -= nx1[k];
			}
		}
		console.log(log);
		r[i-1] = Math.abs(t % 10);
	}
	return r;
}

function mul9(nx1) { // -> nx1 transverse
	const n = nx1.length;
	const r = [];
	for (let i = 1; i <= n; i++) {
		const step = i*4;
		let t = 0;
		for (let j = i-1; j < n; j += step) {
			let max = j+i;
			const cap = max > n ? n : max;
			for (let k = j; k < cap; k++) {
				t += nx1[k];
			}
		}
		for (let j = i-1 + i*2; j < n; j += step) {
			let max = j+i;
			const cap = max > n ? n : max;
			for (let k = j; k < cap; k++) {
				t -= nx1[k];
			}
		}
		r[i-1] = Math.abs(t % 10);
	}
	return r;
}

function mul8(nx1) { // -> nx1 transverse
	const n = nx1.length;
	const r = [];
	for (let i = 1; i <= n; i++) {
		const step = i*4;
		let t = 0;
		for (let j = i-1; j < n; j += step) {
			for (let k = 0; k < i; k++) {
				if (j+k >= n) {
					break;
				}
				t += nx1[j+k];
			}
		}
		for (let j = i-1 + i*2; j < n; j += step) {
			for (let k = 0; k < i; k++) {
				if (j+k >= n) {
					break;
				}
				t -= nx1[j+k];
			}
		}
		r[i-1] = Math.abs(t % 10);
	}
	return r;
}

function mul7(nx1) { // -> nx1 transverse
	const n = nx1.length;
	const r = [];
	for (let i = 1; i <= n; i++) {
		let t = 0;
		for (let j = i; j <= n; j++) {
			const b = Math.floor((j / i) % 4);
			if (b === 1) {
				t += nx1[j-1];
			} else if (b === 3) {
				t -= nx1[j-1];
			}
		}
		r[i-1] = Math.abs(t % 10);
	}
	return r;
}

function mul6(nx1) { // -> nx1 transverse
	const n = nx1.length;
	const r = [];
	for (let i = 1; i <= n; i++) {
		let t = 0;
		for (let j = 1; j <= n; j++) {
			const b = Math.floor((j / i) % 4);
			if (b === 1) {
				t += nx1[j-1];
			} else if (b === 3) {
				t -= nx1[j-1];
			}
		}
		r[i-1] = Math.abs(t % 10);
	}
	return r;
}

function mul5(nx1) { // -> nx1 transverse
	const n = nx1.length;
	const r = [];
	for (let i = 1; i <= n; i++) {
		let t = 0;
		for (let j = 1; j <= n; j++) {
			switch (Math.floor((j / i) % 4)) {
				case 1:
					t += nx1[j-1];
					break;
				case 3:
					t -= nx1[j-1];
					break;
			}
		}
		r[i-1] = Math.abs(t % 10);
	}
	return r;
}

function mul4(nx1) { // -> nx1 transverse
	const n = nx1.length;
	const r = [];
	for (let i = 1; i <= n; i++) {
		let t = 0;
		for (let j = 1; j <= n; j++) {
			switch (Math.floor((j / i) % 4)) {
				case 1:
					t += nx1[j-1];
					break;
				case 3:
					t -= nx1[j-1];
					break;
			}
		}
		r[i-1] = Math.abs(t % 10);
	}
	return r;
}

function mul3(nx1) { // -> nx1 transverse
	const n = nx1.length;
	const r = [];
	for (let i = 0; i < n; i++) {
		let t = 0;
		for (let j = 0; j < n; j++) {
			switch (Math.floor(((j+1) / (i+1)) % 4)) {
				case 1:
					t += nx1[j];
					break;
				case 3:
					t -= nx1[j];
					break;
			}
		}
		r[i] = Math.abs(t % 10);
	}
	return r;
}

function mul2(nx1) { // -> nx1 transverse
	const n = nx1.length;
	const r = [];
	for (let i = 0; i < n; i++) {
		r[i] = 0;
		for (let j = 0; j < n; j++) {
			r[i] += nx1[j] * BASE[Math.floor(((j+1) / (i+1)) % 4)];
		}
		r[i] = Math.abs(r[i] % 10);
	}
	return r;
}

function mul(nx1,nxn) { // -> nx1 transverse
	const n = nx1.length;
	const r = [];
	for (let i = 0; i < n; i++) {
		r[i] = 0;
		for (let j = 0; j < n; j++) {
			r[i] += nx1[j] * nxn[i][j];
		}
		r[i] = Math.abs(r[i] % 10);
	}
	return r;
}

const BASE = [0, 1, 0, -1];
function getBaseMatrix(n) {
	const m = []
	for (let r = 0; r < n; r++) { // row
		let row = m[r] = [];
		for (let c = 0; c < n; c++) { //col
			// 0,0 -> 0 | 0,1 -> 1 | 0,2 -> 2 | 0,3 -> 3 | 0,4 -> 0
			// 1,0 -> 0 | 1,1 -> 0 | 1,2 -> 1 | 1,3 -> 1 | 1,4 -> 2
			const n = Math.floor((c+1) / (r+1));
			row[c] = BASE[n % BASE.length];
		}
	}
	return m;
}

async function forEachLineIn(file, perLine) {
	const reader = readline.createInterface({
		input: fs.createReadStream(file)
	});

	for await (const line of reader) {
		perLine(line);
	}
}