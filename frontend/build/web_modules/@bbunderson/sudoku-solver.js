/*
 * The lookup tables can be used to map
 * from an index into the 1D grid array
 * to a row or column or sub-grid. Using
 * these tables means that I don't have
 * to do the math. For example the to
 * compute the row and column for square
 * index 28 would be...
 *   row = 28 / 9 = 3
 *   col = 28 % 9 = 1
 * The math for the sub-grid is even
 * more complicated and brain bending.
 * Tables were easier and are probably
 * faster than doing the math anyway.
 */

/*
 * Each row represents a row in the grid. Each
 * value in the row is the index of the square
 * in the grid to be used in the row. Make
 * the array const since it should never
 * change.
 */
const ROW_TABLE = [
	[0, 1, 2, 3, 4, 5, 6, 7, 8],
	[9, 10, 11, 12, 13, 14, 15, 16, 17],
	[18, 19, 20, 21, 22, 23, 24, 25, 26],
	[27, 28, 29, 30, 31, 32, 33, 34, 35],
	[36, 37, 38, 39, 40, 41, 42, 43, 44],
	[45, 46, 47, 48, 49, 50, 51, 52, 53],
	[54, 55, 56, 57, 58, 59, 60, 61, 62],
	[63, 64, 65, 66, 67, 68, 69, 70, 71],
	[72, 73, 74, 75, 76, 77, 78, 79, 80]
];

/*
 * Use this lookup table to get the row
 * that is associated with the square on
 * the grid.
 */
const ROW_LOOKUP = [
	0, 0, 0, 0, 0, 0, 0, 0, 0,
	1, 1, 1, 1, 1, 1, 1, 1, 1,
	2, 2, 2, 2, 2, 2, 2, 2, 2,
	3, 3, 3, 3, 3, 3, 3, 3, 3,
	4, 4, 4, 4, 4, 4, 4, 4, 4,
	5, 5, 5, 5, 5, 5, 5, 5, 5,
	6, 6, 6, 6, 6, 6, 6, 6, 6,
	7, 7, 7, 7, 7, 7, 7, 7, 7,
	8, 8, 8, 8, 8, 8, 8, 8, 8
];

/*
 * Each row represents a col in the grid. Each
 * value in the row is the index of the square
 * in the grid to be used in the col. Make
 * the array const since it should never
 * change.
 */
const COL_TABLE = [
	[0, 9, 18, 27, 36, 45, 54, 63, 72],
	[1, 10, 19, 28, 37, 46, 55, 64, 73],
	[2, 11, 20, 29, 38, 47, 56, 65, 74],
	[3, 12, 21, 30, 39, 48, 57, 66, 75],
	[4, 13, 22, 31, 40, 49, 58, 67, 76],
	[5, 14, 23, 32, 41, 50, 59, 68, 77],
	[6, 15, 24, 33, 42, 51, 60, 69, 78],
	[7, 16, 25, 34, 43, 52, 61, 70, 79],
	[8, 17, 26, 35, 44, 53, 62, 71, 80],
];

/*
 * Use this lookup table to get the column
 * that is associated with the square on
 * the grid.
 */
const COL_LOOKUP = [
	0, 1, 2, 3, 4, 5, 6, 7, 8,
	0, 1, 2, 3, 4, 5, 6, 7, 8,
	0, 1, 2, 3, 4, 5, 6, 7, 8,
	0, 1, 2, 3, 4, 5, 6, 7, 8,
	0, 1, 2, 3, 4, 5, 6, 7, 8,
	0, 1, 2, 3, 4, 5, 6, 7, 8,
	0, 1, 2, 3, 4, 5, 6, 7, 8,
	0, 1, 2, 3, 4, 5, 6, 7, 8,
	0, 1, 2, 3, 4, 5, 6, 7, 8
];

/*
 * Each row represents a sub-grid in the grid.
 * Each value in the row is the index of the
 * square in the grid to be used in the sub-grid.
 * Make the array const since it should never
 * change.
 */
const SUB_TABLE = [
	[0, 1, 2, 9, 10, 11, 18, 19, 20],
	[3, 4, 5, 12, 13, 14, 21, 22, 23],
	[6, 7, 8, 15, 16, 17, 24, 25, 26],
	[27, 28, 29, 36, 37, 38, 45, 46, 47],
	[30, 31, 32, 39, 40, 41, 48, 49, 50],
	[33, 34, 35, 42, 43, 44, 51, 52, 53],
	[54, 55, 56, 63, 64, 65, 72, 73, 74],
	[57, 58, 59, 66, 67, 68, 75, 76, 77],
	[60, 61, 62, 69, 70, 71, 78, 79, 80]
];

/*
 * Use this lookup table to get the sub-grid
 * that is associated with the square on
 * the grid.
 */
const SUB_LOOKUP = [
	0, 0, 0, 1, 1, 1, 2, 2, 2,
	0, 0, 0, 1, 1, 1, 2, 2, 2,
	0, 0, 0, 1, 1, 1, 2, 2, 2,
	3, 3, 3, 4, 4, 4, 5, 5, 5,
	3, 3, 3, 4, 4, 4, 5, 5, 5,
	3, 3, 3, 4, 4, 4, 5, 5, 5,
	6, 6, 6, 7, 7, 7, 8, 8, 8,
	6, 6, 6, 7, 7, 7, 8, 8, 8,
	6, 6, 6, 7, 7, 7, 8, 8, 8
];

var tables = {
    ROW_TABLE,
    ROW_LOOKUP,
    COL_TABLE,
    COL_LOOKUP,
    SUB_TABLE,
    SUB_LOOKUP
};

var DIGITS = [' ', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

/**
 * Convert a string of 81 digits to a grid
 * which is a slice of 81 uint8 values
 **/
function string_to_grid(board) {
    var grid = new Array(81).fill(0);

    for (var i = 0; i < board.length; i++) {
        grid[i] = parseInt(board.charAt(i));
    }

	return grid;
}
/**
 * Convert a grid which is a slice
 * of 81 uint8 values to a string
 **/
function grid_to_string(grid) {
	var board = '';

    grid.forEach((i) => {
        board += DIGITS[i];
    });

	return board;
}
/**
 * Every square should have 9 hint values from 1 to 9 that
 * are removed as square values change for squares in the
 * same row, column, and sub-grid that the square is in
 **/
function init_hints() {
    var hints = new Array(81).fill(0).map(() => new Array(9).fill(0));

	for (var square = 0; square < 81; square++) {
		for (var hint = 0; hint < 9; hint++) {
			hints[square][hint] = (hint + 1);
		}
    }
    
    return hints;
}

/**
 * Update the hints based on the values in the
 * grid and using the lookup table to tell us
 * which grid squares to use and which hints.
 **/
function update_hints(hints, grid, lookup) {
	for (var i = 0; i < 9; i++) {
		for (var j = 0; j < 9; j++) {
			var sidx = lookup[i][j];
			var sval = grid[sidx];
			if (sval > 0) {
				for (var m = 0; m < 9; m++) {
					// Set this squares hints to zero
					hints[sidx][m] = 0;
					// Remove the value from other squares
					// in this row, col, or sub-grid
					var hidx = lookup[i][m];
					hints[hidx][sval-1] = 0;
				}
			}
		}
	}
}

/**
 * Return the count of squares
 * with the value of zero
 **/
function empty_squares_in_grid(grid) {
	grid.every((value, index) => { });
	var count = 0;
	for (var n = 0; n < 81; n++) {
		if (grid[n] == 0) {
			count = count + 1;
		}
	}
	return count;
}

/**
 * Set the value of unset grid integers
 * that have only one hint value.
 **/
function update_grid_from_hints(grid, hints) {
	for (var n = 0; n < 81; n++) {
		if (grid[n] == 0) {
			var hint = 0;
			for (var i = 0; i < 9; i++) {
				if (hints[n][i] > 0) {
					if (hint > 0) {
						hint = -1;
						break
					} else {
						hint = hints[n][i];
					}
				}
			}

			if (hint > 0) {
				grid[n] = hint;
			}
		}
	}
}

// Return true if the value can legally be
// placed in the grid at the square location
function is_allowed(grid, square, value) {
	var row = tables.ROW_LOOKUP[square];
	var col = tables.COL_LOOKUP[square];
	var sub = tables.SUB_LOOKUP[square];

	for (var i = 0; i < 9; i++) {
		if (grid[tables.ROW_TABLE[row][i]] == value) {
			return false;
		}
		if (grid[tables.COL_TABLE[col][i]] == value) {
			return false;
		}
		if (grid[tables.SUB_TABLE[sub][i]] == value) {
			return false;
		}
	}

	return true;
}

// Comprehensive test to make sure the each row, column,
// and sub grid has only digits one through nine in it.
function is_solved(grid) {
	for (var sub = 0; sub < 9; sub++) {
		var row_values = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
		var col_values = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
		var sub_values = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

		for (var i = 0; i < 9; i++) {
			row_values[grid[tables.ROW_TABLE[sub][i]]]++;
			col_values[grid[tables.COL_TABLE[sub][i]]]++;
			sub_values[grid[tables.SUB_TABLE[sub][i]]]++;
		}

		// Return false if there are any zeros or not exactly one of each digit
		if (!row_values.every((value, index) => ((index == 0 && value == 0) || value == 1))) {
			return false;
		}
		if (!col_values.every((value, index) => ((index == 0 && value == 0) || value == 1))) {
			return false;
		}
		if (!sub_values.every((value, index) => ((index == 0 && value == 0) || value == 1))) {
			return false;
		}
	}

	return true;
}

/**
 * Use a backtracking algorithm to test a
 * value in each empty square until the
 * entire grid has been checked.
 **/
function backtrack_grid(grid, square) {
	// We must have found a solution if we
	// made it all the way to the last square.
	if (square >= 81) {
		return true;
	}

	// If the square is empty
	if (grid[square] == 0) {
		// Try each possible value
		for (var v = 1; v < 10; v++) {
			// If that value is allowed
			if (is_allowed(grid, square, v)) {
				grid[square] = v;
				// Set the grid value and try to solve the
				// grid again starting from the next square.
				if (backtrack_grid(grid, square+1)) {
					return true;
				}

				// The value didn't work so replace
				// the zero and try the next value
				grid[square] = 0;
			}
		}
	} else {
		// The square was not empty
		// so try the next one
		if (backtrack_grid(grid, square+1)) {
			return true;
		}
	}

	return false;
}

function solve_grid(grid) {
	// The actual values in the grid aren't arranged as a
	// grid. We use the lookup tables to know which grid
	// square is in what sub-grid, row, and column.
	var solved = false;

	if (grid.length != 81) {
		return {solution: grid, solved};
	}

    // There are 9 hints for each grid square. The 
    // hints should be initialized to all possible 
    // values for each square in the grid
	var hints = init_hints();
	var empty_count = empty_squares_in_grid(grid);

	while (empty_count > 0) {
		// Update the hints based on the values
		// in each row, column, and sub-grid
		update_hints(hints, grid, tables.ROW_TABLE);
		update_hints(hints, grid, tables.COL_TABLE);
		update_hints(hints, grid, tables.SUB_TABLE);

		// Update the values based on the hints
		update_grid_from_hints(grid, hints);

		// Stop trying if the count didn't change
		var new_empty_count = empty_squares_in_grid(grid);
		if (new_empty_count == empty_count) {
			break
		}

		// Update the count and keep trying
		empty_count = new_empty_count;
	}

	if (is_solved(grid)) {
		solved = true;
	} else {
		// If there are still empty squares 
		// then try to solve the rest of the
		// puzzle using recursive backtracking
		if (empty_count > 0) {
			if (backtrack_grid(grid, 0) && is_solved(grid)) {
				solved = true;
			}
		}
	}

	return {solution: grid, solved};
}

function solve_string(board) {
	// The actual values in the grid aren't arranged as a
	// grid. We use the lookup tables to know which grid
	// square is in what sub-grid, row, and column.
	var solved = false;

	if (board.length != 81 || !/^\d+$/.test(board)) {
		return {solution: board, solved};
	}

	var grid = string_to_grid(board);
    
    // Get the results from solve_grid
    const results = solve_grid(grid);

	// Return a string version of the solution or the original string
	results.solution = (results.solved) ? grid_to_string(results.solution) : board;
	return results;
}

var sudoku = {
    solve_grid,
	solve_string
};

var sudokuSolver = sudoku;

export default sudokuSolver;
