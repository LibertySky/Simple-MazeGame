// destructuring of MatterJS library
const { Engine, Render, Runner, World, Bodies, Body, Events } = Matter;

// maze canvas dimension
const width = window.innerWidth;
const height = window.innerHeight;

// configuration variable for maze grid
const cellsHorizontal = 35;
const cellsVertical = 27;

// cell size
const unitLengthX = width / cellsHorizontal;
const unitLengthY = height / cellsVertical;

// for MatterJS variables
const engine = Engine.create();
// gravity control
engine.world.gravity.y = 0.3;

const { world } = engine;
const render = Render.create({
	element: document.body,
	engine: engine,
	options: {
		width,
		height,
		wireframes: false,
	},
});
Render.run(render);
Runner.run(Runner.create(), engine);

// Outer Walls(canvas border)
const walls = [
	// top wall/top edge canvas
	Bodies.rectangle(width / 2, 0, width, 4, { isStatic: true }),
	//bottom edge of canvas
	Bodies.rectangle(width / 2, height, width, 4, { isStatic: true }),
	// left edge
	Bodies.rectangle(0, height / 2, 4, height, { isStatic: true }),
	// right edge
	Bodies.rectangle(width, height / 2, 4, height, { isStatic: true }),
];
World.add(world, walls);

// Maze generation

// Generate randomness inside the maze (randomly reorder elements inside array)
const shuffle = (arr) => {
	let counter = arr.length;

	while (counter > 0) {
		const index = Math.floor(Math.random() * counter);
		counter--;

		// swap elements between index and counter
		const temp = arr[counter];
		arr[counter] = arr[index];
		arr[index] = temp;
	}
	return arr;
};

// create an array with capacity for 3 elements and initialize it with default values, then map over it and replace each default value with another array, that has value of walls
const grid = Array(cellsVertical)
	.fill(null)
	.map(() => Array(cellsHorizontal).fill(false));

// vertical rows
const verticals = Array(cellsVertical)
	.fill(null)
	.map(() => Array(cellsHorizontal - 1).fill(false));

// horizontal rows
const horizontals = Array(cellsVertical - 1)
	.fill(null)
	.map(() => Array(cellsHorizontal).fill(false));

// generating random position in a maze
const startRow = Math.floor(Math.random() * cellsVertical);
const startColumn = Math.floor(Math.random() * cellsHorizontal);

// recursion function for moving through maze
const stepThroughCell = (row, column) => {
	// If i have visited(true) the cell at [row,column],-then return
	if (grid[row][column]) {
		return;
	}

	// Mark this cell as being visited
	grid[row][column] = true;

	// Assemble randomly-ordered list of neighbors and shuffle them
	const neighbors = shuffle([
		[row - 1, column, 'up'],
		[row, column + 1, 'right'],
		[row + 1, column, 'down'],
		[row, column - 1, 'left'],
	]);

	// For each neighbor...
	for (let neighbor of neighbors) {
		// get vars [nextRow & nextColumn] is a cell we are thinking to visit next by destructuring 'neighbor'
		const [nextRow, nextColumn, direction] = neighbor;

		// Check if that neighbor is out of bounds
		if (
			nextRow < 0 ||
			nextRow >= cellsVertical ||
			nextColumn < 0 ||
			nextColumn >= cellsHorizontal
		) {
			continue;
		}

		// If we have visited that neighbor, continue to the next neighbor
		if (grid[nextRow][nextColumn]) {
			continue;
		}

		// Remove a wall from either horizontals or verticals array
		if (direction === 'left') {
			verticals[row][column - 1] = true;
		} else if (direction === 'right') {
			verticals[row][column] = true;
		} else if (direction === 'up') {
			horizontals[row - 1][column] = true;
		} else if (direction === 'down') {
			horizontals[row][column] = true;
		}
		stepThroughCell(nextRow, nextColumn);
	}

	// Visit that next cell (recursion)
};
stepThroughCell(startRow, startColumn);

// iterate through horizontal array and draw a rectangle on a canvas for every false value
horizontals.forEach((row, rowIndex) => {
	row.forEach((open, columnIndex) => {
		if (open) {
			return;
		}
		const wall = Bodies.rectangle(
			columnIndex * unitLengthX + unitLengthX / 2,
			rowIndex * unitLengthY + unitLengthY,
			unitLengthX,
			3,
			{
				isStatic: true,
				label: 'wall',
				render: {
					fillStyle: '#703F8F',
				},
			}
		);
		World.add(world, wall);
	});
});

verticals.forEach((row, rowIndex) => {
	row.forEach((open, columnIndex) => {
		if (open) {
			return;
		}
		const wall = Bodies.rectangle(
			columnIndex * unitLengthX + unitLengthX,
			rowIndex * unitLengthY + unitLengthY / 2,
			3,
			unitLengthY,
			{
				isStatic: true,
				label: 'wall',
				render: {
					fillStyle: '#703F8F',
				},
			}
		);
		World.add(world, wall);
	});
});

// Creating destination point
const goal = Bodies.rectangle(
	width - unitLengthX / 2,
	height - unitLengthY / 2,
	unitLengthX * 0.5,
	unitLengthY * 0.5,
	{
		isStatic: true,
		label: 'myGoal',
		render: {
			fillStyle: '#FA238D',
		},
	}
);
World.add(world, goal);

// Ball
const ballRadius = Math.min(unitLengthX, unitLengthY) / 4;
const ball = Bodies.circle(unitLengthX / 2, unitLengthY / 2, ballRadius, {
	label: 'myBall',
});
World.add(world, ball);

// Keyboard controls
document.addEventListener('keydown', (e) => {
	// getting ball velocity
	const { x, y } = ball.velocity;

	// move up
	if (e.keyCode === 38) {
		Body.setVelocity(ball, { x, y: y - 3 });
	}

	// move down
	if (e.keyCode === 40) {
		Body.setVelocity(ball, { x, y: y + 3 });
	}

	// move right
	if (e.keyCode === 39) {
		Body.setVelocity(ball, { x: x + 3, y });
	}

	// move left
	if (e.keyCode === 37) {
		Body.setVelocity(ball, { x: x - 3, y });
	}

	// jump
	if (e.keyCode === 32) {
		Body.setVelocity(ball, { x, y: y - 10 });
	}
});

// Win condition
Events.on(engine, 'collisionStart', (e) => {
	e.pairs.forEach((collision) => {
		const labels = ['myBall', 'myGoal'];

		if (
			labels.includes(collision.bodyA.label) &&
			labels.includes(collision.bodyB.label)
		) {
			world.bodies.forEach((body) => {
				if (body.label === 'wall') {
					Body.setStatic(body, false);
				}
			});
			document.querySelector('.winner').classList.remove('hidden');
		}
	});
});
