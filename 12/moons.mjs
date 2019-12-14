const moonsEx = [
	{ position: [ -1, 0, 2], velocity: [ 0, 0, 0] },
	{ position: [ 2, -10, -7], velocity: [ 0, 0, 0] },
	{ position: [ 4, -8, 8], velocity: [ 0, 0, 0] },
	{ position: [ 3, 5, -1], velocity: [ 0, 0, 0] },
];

// peroidicity
// x: 18
// y: 28
// z: 44
// LCM (18, 28, 44) = 2772

const moonsTest = [
	{ position: [ 2, 0, 0], velocity: [ 0, 0, 0] },
	{ position: [ -7, 0, 0], velocity: [ 0, 0, 0] },
	{ position: [ 8, 0, 0], velocity: [ 0, 0, 0] },
	{ position: [ -1, 0, 0], velocity: [ 0, 0, 0] },
];
// peroidicity
// x: 84032
// y: 286332
// z: 193052
// LCM (84032, 286332, 193052) = 290,314,621,566,528

// each axis is independent
// 

// 2, 4, 7, 11
// 1 -> 4
// 2
// 3
// 4 -> 6
// 5
// 6 -> 8
// ...
// 12 -> 10
// 13 -> 12
// ...
// 24 -> 14

const moonsInput = [
	{ position: [ -9, -1, -1], velocity: [ 0, 0, 0] },
	{ position: [ 2, 9, 5], velocity: [ 0, 0, 0] },
	{ position: [ 10, 18, -12], velocity: [ 0, 0, 0] },
	{ position: [ -6, 15, -7], velocity: [ 0, 0, 0] },
];

const moons = moonsTest;

function iterate(moons) {
	for (let f = 0; f < 3; f++) {
		const first = moons[f];
		for (let s = f+1; s < 4; s++) {
			const second = moons[s];
			if (first.position[0] < second.position[0]) {
				first.velocity[0]++;
				second.velocity[0]--;
			} else if (first.position[0] > second.position[0]) {
				first.velocity[0]--;
				second.velocity[0]++;
			}
			if (first.position[1] < second.position[1]) {
				first.velocity[1]++;
				second.velocity[1]--;
			} else if (first.position[1] > second.position[1]) {
				first.velocity[1]--;
				second.velocity[1]++;
			}
			if (first.position[2] < second.position[2]) {
				first.velocity[2]++;
				second.velocity[2]--;
			} else if (first.position[0] > second.position[2]) {
				first.velocity[2]--;
				second.velocity[2]++;
			}
		}
		first.position[0] += first.velocity[0];
		first.position[1] += first.velocity[1];
		first.position[2] += first.velocity[2];
	}
	moons[3].position[0] += moons[3].velocity[0];
	moons[3].position[1] += moons[3].velocity[1];
	moons[3].position[2] += moons[3].velocity[2];
}

function energy(moon) {
	const pe = moon.position.reduce((acc, a) => acc + Math.abs(a), 0);
	const ke = moon.velocity.reduce((acc, a) => acc + Math.abs(a), 0);
	return pe * ke;
}

for (let i = 0; i < moons.length; i++) {
	moons[i].pos0 = [...moons[i].position];
}
const last = moons[3];
const lastVel = moons[3].velocity;
const lastPos = moons[3].position;
for (let i = 1; true; i++) {
	let hasChange = false;
	/*
	Verify increment is indeed working!
	if (i === 1001) {
		console.log({ energyCheck: moons.reduce((e, m)=> e+energy(m), 0)});
	}*/
	if (i % 1000000 === 0) {
		console.log(i / 1000000);
	}
	for (let f = 0; f < 3; f++) {
		const first = moons[f];
		const vel = first.velocity;
		const pos = first.position;
		for (let s = f+1; s < 4; s++) {
			const second = moons[s];
			if (pos[0] < second.position[0]) {
				vel[0]++;
				second.velocity[0]--;
			} else if (pos[0] > second.position[0]) {
				vel[0]--;
				second.velocity[0]++;
			}
			if (pos[1] < second.position[1]) {
				vel[1]++;
				second.velocity[1]--;
			} else if (pos[1] > second.position[1]) {
				vel[1]--;
				second.velocity[1]++;
			}
			if (pos[2] < second.position[2]) {
				vel[2]++;
				second.velocity[2]--;
			} else if (pos[2] > second.position[2]) {
				vel[2]--;
				second.velocity[2]++;
			}
		}
		pos[0] += vel[0];
		pos[1] += vel[1];
		pos[2] += vel[2];
		if (!hasChange) {
			hasChange = vel[0] !== 0
				|| vel[1] !== 0
				|| vel[2] !== 0
				|| pos[0] !== first.pos0[0]
				|| pos[1] !== first.pos0[1]
				|| pos[2] !== first.pos0[2]
		}
	}
	lastPos[0] += lastVel[0];
	lastPos[1] += lastVel[1];
	lastPos[2] += lastVel[2];
	if (!hasChange) {
		// since velocities always have the same total per dimension,
		// no need to compare velocities here, just position!
		hasChange = lastPos[0] !== last.pos0[0]
			|| lastPos[1] !== last.pos0[1]
			|| lastPos[2] !== last.pos0[2];
	}
	if (!hasChange) {
		console.log({same: i});
		break;
	}
}

// what do we know?
// total velocity does NOT change (per axis)
// position -> delta vel -> delta pos


