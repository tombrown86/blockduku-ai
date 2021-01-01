/***
 * All credit for the game concept to Easybrain! (https://play.google.com/store/apps/details?id=com.easybrain.block.puzzle.games&hl=en_GB&gl=US)
 * 
 * I've simple written a basic version of the game in a browser and written a simple "ai" func to attempt to compute sensible best moves
 * with information about the upcoming shapes.
 * @author Tom Brown
 **/
class blockduku {
	selected_nextshapei = null;
	nextshape_shapekey = [null,null,null];
	
	grid = [
		[0,0,0,0,0,0,0,0,0],
		[0,0,0,0,0,0,0,0,0],
		[0,0,0,0,0,0,0,0,0],
		[0,0,0,0,0,0,0,0,0],
		[0,0,0,0,0,0,0,0,0],
		[0,0,0,0,0,0,0,0,0],
		[0,0,0,0,0,0,0,0,0],
		[0,0,0,0,0,0,0,0,0],
		[0,0,0,0,0,0,0,0,0]
	];
	
	shapes = {
		hline2: [[1,1]],
		hline3: [[1,1,1]],
		hline4: [[1,1,1,1]],
		hline5: [[1,1,1,1,1]],
		vline2: [[1],[1]],
		vline3: [[1],[1],[1]],
		vline4: [[1],[1],[1],[1]],
		vline5: [[1],[1],[1],[1],[1]],
		T: [[1,1,1],[0,1,0]],
		T90: [[0,1],[1,1],[0,1]],
		T180: [[0,1,0],[1,1,1]],
		T270: [[1,0],[1,1],[1,0]],
		L0: [[1,0,0],[1,0,0],[1,1,1]],
		L90: [[1,1,1],[1,0,0],[1,0,0]],
		L180: [[1,1,1],[0,0,1],[0,0,1]],
		L270: [[0,0,1],[0,0,1],[1,1,1]],
		S: [[0,1,1],[1,1,0]],
		S180: [[1,1,0],[0,1,1]],
		1: [[1]],
		box: [[1,1],[1,1]],
		cross: [[0,1,0][1,1,1],[0,1,0]],
		U: [[1,0,1],[1,1,1]],
		U90: [[1,1],[1,0],[1,0]],
		U180: [[1,1,1],[1,0,1]],
		U270: [[1,1],[0,1],[1,0]]
	};
	
	
	
	constructor() {
		const gamegridcont = document.getElementById('gamegrid');
		for(let i=0; i<9*9; i++) {
			let cell = document.createElement("div");
			cell.classList.add("cell");
			gamegridcont.appendChild(cell); 
			cell.addEventListener('click', e => {
				if(this.selected_nextshapei) {
					const shape = this.shapes[this.nextshape_shapekey[this.selected_nextshapei - 1]];
					if(this.can_fill_shape(shape, Math.floor(i/9), i%9, this.grid)) {
						this.fill_shape(shape, Math.floor(i/9), i%9);
					}
				}
			});
			cell.addEventListener('mouseover', e => {
				if(this.selected_nextshapei) {
					const shape = this.shapes[this.nextshape_shapekey[this.selected_nextshapei - 1]];
					this.hover_shape(shape, Math.floor(i/9), i%9);
				}
			});
		}
		
		for(let nextshapei=1; nextshapei<=3; nextshapei++) {
			let nextshapecont = document.getElementById('nextshape'+nextshapei);
			let nextshapebutscont = document.getElementById('nextshape'+nextshapei+'_buts');
			for(let i=0; i<6*2; i++) {
				let cell = document.createElement("div");
				cell.classList.add("cell");
				cell.classList.add("smallcell");
				nextshapecont.appendChild(cell);
				nextshapecont.addEventListener('click', e => {
					this.select_next_shape(nextshapei);
				});
			}
			Object.entries(this.shapes).forEach(([shapekey, shape]) => {
				const but = document.createElement('button');
				but.innerHTML = shapekey;
				but.addEventListener('click', e => {
					this.set_next_shape(nextshapei, shapekey, but);
				});
				nextshapebutscont.appendChild(but);
			});
		}
		//this.fill_shape(this.shapes.T, 1, 2);
		document.getElementById('evaluate_selected_shapes_btn').addEventListener('click', () => this.evaluate_selected_shapes());
	}
	set_next_shape(nextshapei, shapekey, button) {
		// fill next shape grid 
		Array.from(document.querySelectorAll('#nextshape'+nextshapei+'_buts button')).forEach(but => {
			but.classList.remove('selected');
		});
		button.classList.add('selected');
		this.selected_nextshapei = nextshapei;
		this.nextshape_shapekey[nextshapei - 1] = shapekey;

	}
	select_next_shape(nextshapei) {
		this.selected_next_shape = nextshapei;
		for(let i=1; i<=3; i++) {
			i == nextshapei ? document.getElementById('nextshape'+i).classList.add('selected') : document.getElementById('nextshape'+i).classList.remove('selected');
		}
	}
		
	get_cell_div(rowi, coli) {
		if(rowi<0 || coli<0 || rowi>=9 || coli >=9) {
			return false;
		}
		return document.querySelector('#gamegrid > .cell:nth-child('+(1+(9*rowi)+coli)+')');
	}
	clear_hovers() {
		const hovers = Array.from(document.querySelectorAll('.cellhover_valid,.cellhover_invalid'));
		
		hovers.forEach(cell => {
			cell.classList.remove('cellhover_valid');
			cell.classList.remove('cellhover_invalid');
		});
	}
	hover_shape(shape, offset_rowi, offset_coli) {
		this.clear_hovers()
		const valid = this.can_fill_shape(shape, offset_rowi, offset_coli, this.grid);

		shape.forEach((row, rowi) => {
			row.forEach((hovered, coli) => {
				this.set_cell_hover(offset_rowi + rowi, offset_coli + coli, hovered, valid);
			});
		});
	}
	fill_shape(shape, offset_rowi, offset_coli) {
		shape.forEach((row, rowi) => {
			row.forEach((filled, coli) => {
				filled && this.set_cell(offset_rowi + rowi, offset_coli + coli, true);
			});
		});
		const rmvcells = this.find_cells_to_remove(this.grid);

		// now rmv the individual cells
		rmvcells.forEach(coords => {
			this.set_cell(coords[0], coords[1], false);
		});
	}
	set_cell(rowi, coli, filled) {
		this.grid[rowi][coli] = filled;
		const cell = this.get_cell_div(rowi, coli);
		filled ? cell.classList.add('filled') : cell.classList.remove('filled');
	}
	set_cell_hover(rowi, coli, hovered, valid) {
		const cell = this.get_cell_div(rowi, coli);
		if(cell && hovered) {
			cell.classList.add(valid ? 'cellhover_valid' : 'cellhover_invalid');
		}
	}
	can_fill_shape(shape, offset_rowi, offset_coli, grid) {
		let canfill = true;
		for (const [rowi, row] of shape.entries()) {
			for (const [coli, filled] of row.entries()) {
				const testrowi = offset_rowi + rowi;
				const testcoli = offset_coli + coli;
				if(filled
					&& (testrowi >= 9
						|| testcoli >= 9
						|| testrowi < 0
						|| testcoli < 0
						|| grid[testrowi][testcoli])) {
					return false;
				}
			}
		}
		return true;
	}
	find_cells_to_remove(grid) {
		// build list to rmv, can't remove as we go through
		const rmvcells = [];
		// vlines
		for(let rowi=0; rowi<9; rowi++) {
			let clearrow = true;
			for(let coli=0; coli<9; coli++) {
				if (!grid[rowi][coli]) {
					clearrow = false;
					break;
				}
			}

			if(clearrow) {
				for(let coli=0; coli<9; coli++) {
					rmvcells.push([rowi, coli]);
				}
			}
		}
		// hlines
		for(let coli=0; coli<9; coli++) {
			let clearcol = true;
			for(let rowi=0; rowi<9; rowi++) {
				if (!grid[rowi][coli]) {
					clearcol = false;
					break;
				}
			}

			if(clearcol) {
				for(let rowi=0; rowi<9; rowi++) {
					rmvcells.push([rowi, coli]);
				}
			}
		}
		// squares
		for(let outrowi=0; outrowi<3; outrowi++) {
			for(let outcoli=0; outcoli<3; outcoli++) {
				let clearsquare = true;
				for(let innerrowi=0; innerrowi<3; innerrowi++) {
					for(let innercoli=0; innercoli<3; innercoli++) {
						if (!grid[outrowi*3 + innerrowi][outcoli*3 + innercoli]) {
							clearsquare = false;
						}
					}
					if(!clearsquare) {
						break;
					}
				}
				if(clearsquare) {
					for(let innerrowi=0; innerrowi<3; innerrowi++) {
						for(let innercoli=0; innercoli<3; innercoli++) {
							rmvcells.push([outrowi*3 + innerrowi, outcoli*3 + innercoli]);
						}
					}
				}
			}
		}
		
		return rmvcells;
	}
	evaluate_selected_shapes() {
		const result = this.evaluate_shapes(document.querySelector('#nextshape1_buts .selected').innerHTML, document.querySelector('#nextshape2_buts .selected').innerHTML, document.querySelector('#nextshape3_buts .selected').innerHTML, this.grid);
		if(!result) {
			alert('game over');
		} else {
			setTimeout(() => {this.fill_shape(this.shapes[result.shape1i], result.s1rowi, result.s1coli)}, 0);
			setTimeout(() => {this.fill_shape(this.shapes[result.shape2i], result.s2rowi, result.s2coli)}, 300);
			setTimeout(() => {this.fill_shape(this.shapes[result.shape3i], result.s3rowi, result.s3coli)}, 600);
			
		}
	}
	evaluate_shapes(s1key, s2key, s3key, ogrid) {
		let best_moves = null;
		let best_moves_score = -1;
		const perms = [
			[s1key,s2key,s3key],
			[s1key,s3key,s2key],
			[s2key,s1key,s3key],
			[s2key,s3key,s1key],
			[s3key,s1key,s2key],
			[s3key,s2key,s1key],
		];
		let states = {};
		// todo: could precompute all permutations (combining the 9 shape perms in every possible position)
		// in advanced and read from list here, reducing this to a single for
		for (const [permi, perm] of perms.entries()) {
			for(let s1rowi=0; s1rowi<9; s1rowi++) {
				for(let s1coli=0; s1coli<9; s1coli++) {
					for(let s2rowi=0; s2rowi<9; s2rowi++) {
						for(let s2coli=0; s2coli<9; s2coli++) {
							for(let s3rowi=0; s3rowi<9; s3rowi++) {
								for(let s3coli=0; s3coli<9; s3coli++) {
									let grid = this.clone_grid(ogrid);
									// try to apply every shape
									//todo : some heurisitics to optimise choices?

									if((grid = this.attempt_fill_and_tidy(this.shapes[perm[0]], s1rowi, s1coli, grid)) !== false
										&& (grid = this.attempt_fill_and_tidy(this.shapes[perm[1]], s2rowi, s2coli, grid)) !== false
										&& (grid = this.attempt_fill_and_tidy(this.shapes[perm[2]], s3rowi, s3coli, grid)) !== false) {

										const score = this.eval_grid(grid);
										// for now, only care about highest score so far
										if(score > best_moves_score) {
											best_moves_score = score;
											best_moves = {
												grid,
												perm,
												shape1i: perm[0],
												s1rowi,
												s1coli,
												shape2i: perm[1],
												s2rowi,
												s2coli,
												shape3i: perm[2],
												s3rowi,
												s3coli,
												score
											};
										}
									}
								}
							}
						}
					}
				}
			}
		}
		
		return best_moves;
	}
	clone_grid(grid) {
		const newgrid = [];
		for (const [rowi, row] of grid.entries()) {
			newgrid[rowi] = [];
			for (const [coli, filled] of row.entries()) {
				newgrid[rowi][coli] = filled;
			}
		}
		return newgrid;
	}
	attempt_fill_and_tidy(shape, offset_rowi, offset_coli, grid) {
		for (const [rowi, row] of shape.entries()) {
			for (const [coli, filled] of row.entries()) {
				const testrowi = offset_rowi + rowi;
				const testcoli = offset_coli + coli;

				if(testrowi >= 9
						|| testcoli >= 9
						|| testrowi < 0
						|| testcoli < 0) {
					return false;
				}
				if(filled && grid[testrowi][testcoli]) {
					return false;
				} else {
					grid[testrowi][testcoli] = 1;
				}
			}
		}
		
		// was able to fill, now must tidy 
		const rmvcells = this.find_cells_to_remove(grid);

		rmvcells.forEach(coords => {
			grid[coords[0]][coords[1]] = 0;
		});
		return grid;
	}
	
	// todo: improve scoring func
	// Currently simply counts total empty cells.
	//
	// Ideas
	// 1 Compute "bumpiness" of board
	// 2 Penalise for "holes" in the board (especially those which have a lower probability of being fillable)
	eval_grid(grid) {
		let emptycount = 0;
		for(let rowi=0; rowi<9; rowi++) {
			for(let coli=0; coli<9; coli++) {
				if(!grid[rowi][coli]) {
					emptycount++;
				}
			}
		}
		
		return emptycount;
	}

}
