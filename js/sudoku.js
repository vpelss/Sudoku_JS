var Diff = [];
Diff[1] = function() {
	document.getElementById('NS').checked = true;
	document.getElementById('HS').checked = false;
	document.getElementById('NP').checked = false;
	document.getElementById('HP').checked = false;
	document.getElementById('IR').checked = false;
	document.getElementById('XW').checked = false;
	document.getElementById('YW').checked = false;
};

Diff[2] = function() {
	document.getElementById('NS').checked = true;
	document.getElementById('HS').checked = true;
	document.getElementById('NP').checked = false;
	document.getElementById('HP').checked = false;
	document.getElementById('IR').checked = false;
	document.getElementById('XW').checked = false;
	document.getElementById('YW').checked = false;
};

Diff[3] = function() {
	document.getElementById('NS').checked = true;
	document.getElementById('HS').checked = true;
	document.getElementById('NP').checked = true;
	document.getElementById('HP').checked = false;
	document.getElementById('IR').checked = false;
	document.getElementById('XW').checked = false;
	document.getElementById('YW').checked = false;
};

Diff[4] = function() {
	document.getElementById('NS').checked = true;
	document.getElementById('HS').checked = true;
	document.getElementById('NP').checked = true;
	document.getElementById('HP').checked = true;
	document.getElementById('IR').checked = false;
	document.getElementById('XW').checked = false;
	document.getElementById('YW').checked = false;
};

Diff[5] = function() {
	document.getElementById('NS').checked = true;
	document.getElementById('HS').checked = true;
	document.getElementById('NP').checked = true;
	document.getElementById('HP').checked = true;
	document.getElementById('IR').checked = true;
	document.getElementById('XW').checked = false;
	document.getElementById('YW').checked = false;
};

Diff[6] = function() {
	document.getElementById('NS').checked = true;
	document.getElementById('HS').checked = true;
	document.getElementById('NP').checked = true;
	document.getElementById('HP').checked = true;
	document.getElementById('IR').checked = true;
	document.getElementById('XW').checked = true;
	document.getElementById('YW').checked = false;
};

Diff[7] = function() {
	document.getElementById('NS').checked = true;
	document.getElementById('HS').checked = true;
	document.getElementById('NP').checked = true;
	document.getElementById('HP').checked = true;
	document.getElementById('IR').checked = true;
	document.getElementById('XW').checked = true;
	document.getElementById('YW').checked = true;
};

var sudoku; // sudoku[BigX][BigY][LittleX][LittleY] = [] 1..9
var path = [];
var forever = new Date('October 17, 2050 03:24:00'); // use in cookies
var count = 0;

var LastCursorID = "cell_0_0";
var blanksquares = "%blanksquares%";
var intable = 1;
var count_type = {}; // count_type["ns"] = 5



window.onload = Main;
//document.getElementById("body").onload = Main;

function Main() {
	$("#dialog-waiting").hide();

	//start dialogs and turn off
	$(function() {
		$(".dialogs").dialog({
			autoOpen: false,
			modal: true,
			buttons: {
				Ok: function() {
					$(this).dialog("close");
				}
			}
		});
	});

	//accordions uiquery
	$(function() {
		$("#accordion , #archive_area").accordion({
			collapsible: true,
			active: false
		});
	});

	path = Create_Path(); //set path to traverse Sudoku recursively
	//set event functions  
	document.getElementById("how_to_play").onclick = Howtoplay;
	document.getElementById("statistics").onclick = Statistics;
	document.getElementById("solution").onclick = SolutionsDialog;
	document.getElementById("clear_unlocked_cells").onclick = ClearUnlockedCells;
	document.getElementById("body").onkeydown = keyinput;
	document.getElementById("create_sudoku").onclick = Create_Playable_Sudoku;
	document.getElementById("save_slot").onchange = Load_Sudoku;
	document.getElementById("reset_sudoku").onclick = ResetSudoku;
	document.getElementById("Export_Archive").onclick = Export_Archive;
	document.getElementById("Import_Archive").onclick = Import_Archive;
	document.getElementById("difficulty").onchange = Diff;

	Diff[document.getElementById("difficulty").value](); //set difficulty based on default selection

	//remember last save_slot
	let slot = getCookie("save_slot");
	if (slot == null) {
		slot = 1;
	}
	document.getElementById("save_slot").value = slot;
	Load_Sudoku(); //previous save
}

function Load_Sudoku() {
	let slot = document.getElementById("save_slot").value;
	setCookie("save_slot", slot, forever, '', '', ''); //we may have changed it
	let save_text = localStorage.getItem(slot);
	let empty = false;
	if (save_text == null) { //nothing saved. fail
		empty = true;
	}
	let save_array = JSON.parse(save_text);
	jscalcpuzz = "";

	path_temp = JSON.parse(JSON.stringify(path)); //temp path as SetNextSquare() wipes it
	path_temp.forEach(function(cell) {
		let bx, by, lx, ly, x, y;
		[bx, by, lx, ly] = cell;
		[x, y] = BL_To_XY(cell);
		let cellID = "cell_" + x + "_" + y;
		let solutionID = "solution_" + x + "_" + y;
		let cell_text, solution_text;
		if (empty) {
			[cell_text, solution_text] = ["", ""];
		} else {
			[cell_text, solution_text] = save_array.shift();
		}
		document.getElementById(cellID).innerHTML = cell_text;
		document.getElementById(solutionID).innerHTML = solution_text; //set solution table

		//set class and tester string
		let numberlist = cell_text.replace(/\D/g, ''); //remove all but numbers
		let value = "-";
		if (numberlist.length == 1) {
			value = numberlist;
		}
		if (IsCellStaticID(cellID)) { //static
			document.getElementById(cellID).className = "cellstaticclass";
			jscalcpuzz = jscalcpuzz + value;
		}
		if (IsCellLockedID(cellID)) {
			document.getElementById(cellID).className = "celllockedclass";
		}
		if (IsAnEditCellID(cellID)) { //blank
			document.getElementById(cellID).className = "cellnotselectedclass";
			jscalcpuzz = jscalcpuzz + value;
		}
		document.getElementById(cellID).onclick = chooseOnClick; //also set onclick
	});

	document.getElementById("map").innerHTML = jscalcpuzz;
	//start_cross(document.getElementById("Solution"));
	start_cross(document.getElementById("map").value);
	return true;
}

function Save_Sudoku() {
	let save_array = [];
	path_temp = JSON.parse(JSON.stringify(path)); //temp path as SetNextSquare() wipes it
	path_temp.forEach(function(cell) {
		let bx, by, lx, ly, x, y;
		[bx, by, lx, ly] = cell;
		[x, y] = BL_To_XY(cell);
		let cellID = "cell_" + x + "_" + y;
		let solutionID = "solution_" + x + "_" + y;
		let cell_text, solution_text;
		cell_text = document.getElementById(cellID).innerHTML;
		solution_text = document.getElementById(solutionID).innerHTML; //set solution table 
		save_array.push([cell_text, solution_text]);
	});
	//save created sudoku
	localStorage.setItem(document.getElementById("save_slot").value, JSON.stringify(save_array));
}


function Export_Archive() {
	document.getElementById("archive").value = JSON.stringify(localStorage);
}

function Import_Archive() { //
	let text = document.getElementById("archive").value;
	let obje = JSON.parse(text);
	Object.keys(obje).forEach(function(key) {
		localStorage.setItem(key, obje[key]);
	});
	location.reload();
}

function Create_Path() {
	//initialize path to traverse Sudoku
	let path = [];
	for (let by = 0; by < 3; by++) {
		for (let ly = 0; ly < 3; ly++) {
			for (let bx = 0; bx < 3; bx++) {
				for (let lx = 0; lx < 3; lx++) {
					path.push([bx, by, lx, ly]);
				}
			}
		}
	}
	return path;
}


function Create_Full_Sudoku() {
	sudoku = DIM([3, 3, 3, 3], [1, 2, 3, 4, 5, 6, 7, 8, 9]); //fill Sudoku board with all probabilities 1..9
	//start create full Sudoku board
	let path_temp = JSON.parse(JSON.stringify(path)); //temp path as SetNextSquare() wipes it
	SetNextSquare(path_temp); //clears path

	//place selections on board
	path_temp = JSON.parse(JSON.stringify(path)); //temp path as SetNextSquare() wipes it
	path_temp.forEach(function(cell) {
		let bx, by, lx, ly, x, y;
		[bx, by, lx, ly] = cell;
		[x, y] = BL_To_XY(cell);
		let cellID = "cell_" + x + "_" + y;
		let solutionID = "solution_" + x + "_" + y;
		let value = sudoku[bx][by][lx][ly][0];
		document.getElementById(cellID).innerHTML = value;
		document.getElementById(solutionID).innerHTML = value; //set solution table
	});
}

function Create_Playable_Sudoku() {
	$("#dialog-waiting").show();
	Create_Full_Sudoku();
	RemoveCells();

	//place static cells
	let jscalcpuzz = ""; //the sudoku tester
	let count = 1;
	path_temp = JSON.parse(JSON.stringify(path)); //temp path as SetNextSquare() wipes it
	path_temp.forEach(function(cell) {
		let bx, by, lx, ly, x, y;
		[bx, by, lx, ly] = cell;
		[x, y] = BL_To_XY(cell);
		let cellID = "cell_" + x + "_" + y;
		let value = sudoku[bx][by][lx][ly].toString();
		if (value != "") { //static
			cell_text = "<!--static-->" + value;
			document.getElementById(cellID).className = "cellstaticclass";
			jscalcpuzz = jscalcpuzz + value;
		} else { //blank
			cell_text = value;
			document.getElementById(cellID).className = "cellnotselectedclass";
			jscalcpuzz = jscalcpuzz + "-";
		}
		document.getElementById(cellID).onclick = chooseOnClick; //also set onclick
		document.getElementById(cellID).innerHTML = cell_text;
		if ((count % 9) == 0) { //every 8 count start new line
			jscalcpuzz = jscalcpuzz + "\r\n";
		}
		count++;
	});
	document.getElementById("map").innerHTML = jscalcpuzz;
	//start_cross(document.getElementById("Solution"));
 	start_cross(document.getElementById("map").value);

	Save_Sudoku(); //save created sudoku
	$("#dialog-waiting").hide();
}

function RemoveCells() {
	let d = new Date();
	let time = d.getTime();
	let try_time = document.getElementById("TimeToTry").value;
	let finished = time + (1000 * try_time); //5 sec max
	//let one_value;
	let possible_sudoku;
	let blank_cells = 0;

	while ((d.getTime() < finished) && (blank_cells < document.getElementById("number_of_blank_squares").value)) {
		//save array status
		let backup_sudoku_array = JSON.stringify(sudoku);

		//random choose a cell that has one possible value
		let bx, by, lx, ly;
		do {
			bx = getRandomInt(3);
			by = getRandomInt(3);
			lx = getRandomInt(3);
			ly = getRandomInt(3);
			//one_value = false;
			//if (sudoku[bx][by][lx][ly].length == 1) {
				//one_value = true;
			//}
		} while ( sudoku[bx][by][lx][ly].length != 1 );

		sudoku[bx][by][lx][ly] = []; //remove value

		possible_sudoku = JSON.stringify(sudoku);
  count_type = {"ns":0 , "hs":0 , "np":0 , "hp":0 , "ir":0 , "xy":0 , "yw":0 }; //start new count. this might be final run
		//try to solve sudoku array. Solve me mangles global sudoku array so we will need to restore it
		if (Solve_Me()) { //success : save 
			sudoku = JSON.parse(possible_sudoku); //save board
			blank_cells++;
		} else { //fail : restore
			sudoku = JSON.parse(backup_sudoku_array); //restore previous board
		}
		d = new Date();
	} //end while
}

function Solve_Me() { //mangles sudoku. so calling routines must accommodate
	let progress = 0; // > 0 if we made any progress
	//start board off by calculating simple starting probabilities for blank cells in entire board
	//then try to reduce all probabilities to 1 value for each cell     
Calculate_Simple_Probabilities(); //fill probable values for all empty cells. note this will solve all easy ns at the start also
	do {
  progress = 0;
		for (let cell_count = 0; cell_count < 81; cell_count++) {
			let next_square = path[cell_count];
			let bx = next_square[0];
			let by = next_square[1];
			let lx = next_square[2];
			let ly = next_square[3];

   //likely only useful on complex levels as Calculate_Simple_Probabilities fills in all squares on easy levels
			if(document.getElementById('NS').checked == true){
    progress = progress + NS(bx, by, lx, ly); //ns
   }
   if(document.getElementById('HS').checked == true){
    progress = progress + HS(); //hs
   }
 
			//np
			//hp      
			//ir does probabilities
			//xwing
			//ywing

   //remove in production EVERYWHERE after Calculate_Simple_Probabilities. we should never have this condition....
   if(sudoku[bx][by][lx][ly].length == 0){ //if any cell has no probabilities, fail
    return false;
   }
   let solved = Solved(); //if all cells have 1 value
			if (solved) { //solved if all cells have 1 probability (ns)
				return true;
			} else { //just keep going
			}
		}
	} while (progress > 0); //true if we made any progress
	//no more progress and we never solved it
	//sudoku = JSON.parse(backup_sudoku_array); //restore board 
	return false;
}

function Calculate_Simple_Probabilities() { //calculates possible values for blank cells.
	for (let cell_count = 0; cell_count < 81; cell_count++) {
		let next_square = path[cell_count];
		let bx = next_square[0];
		let by = next_square[1];
		let lx = next_square[2];
		let ly = next_square[3];
		let solved_numbers = [];
		if (sudoku[bx][by][lx][ly].length == 0) { 	//if cell has no values, get all SINGLE (solved) values in regions. then this cell will contain the inverse of that list
			solved_numbers.push(...Solved_Values_From_Regions("row", bx, by, lx, ly)); //row
			solved_numbers.push(...Solved_Values_From_Regions("col", bx, by, lx, ly)); //col
			solved_numbers.push(...Solved_Values_From_Regions("squ", bx, by, lx, ly)); //squ
			let probable_numbers = Array_Difference([1, 2, 3, 4, 5, 6, 7, 8, 9], solved_numbers); //difference of that list
			sudoku[bx][by][lx][ly] = probable_numbers; //used by hs,mp,hp,ir,xw,yw... 
		}
	}
}

function NS(bx, by, lx, ly){
 	if (sudoku[bx][by][lx][ly].length == 1) { //NS (or static) so remove the value from all regions
    	let value = sudoku[bx][by][lx][ly];
    	let removed = Remove_A_Potential_Value_From_Regions(bx, by, lx, ly, value);
     if(removed){//progress
      //console.log("NS at " + bx + by + lx + ly);
      count_type.ns++; 
      return 1;
     }
     else{
      return 0;
     }
    }
    else{ // no progress
     return 0;
    }
}

function HS() {
	//for each cell, get all probabilities including current cell for each region.
	//if a a value in this cell has only one value (no doubles, etc) in a region, it is a hs. convert it to ns
	let progress = 0;
	for (let cell_count = 0; cell_count < 81; cell_count++) {
		let next_square = path[cell_count];
		let bx = next_square[0];
		let by = next_square[1];
		let lx = next_square[2];
		let ly = next_square[3];

  if (sudoku[bx][by][lx][ly].length == 0) {
			Error("Blank cell. How?");
		}
  
  progress = progress + HS_By_Region( "row" , bx, by, lx, ly);
  if(progress == 0){
   progress = progress + HS_By_Region( "col" , bx, by, lx, ly);
  }
  if(progress == 0){
  progress = progress + HS_By_Region( "squ" , bx, by, lx, ly);
  }
	}
	return progress;
}

function HS_By_Region( region , bx, by, lx, ly){
 let progress = 0;
 if(sudoku[bx][by][lx][ly].length == 0){
  return false;
  }
 if(sudoku[bx][by][lx][ly].length > 1){//hs only lloks at 2 or more possible values
 	let region_values = [...sudoku[bx][by][lx][ly]]; //start with our cell
		region_values.push(...All_Values_From_Region(region , bx, by, lx, ly));
  for(let prob of sudoku[bx][by][lx][ly]){ //see if any of current cell values occurs once in this array
   if(Array_Count_Value(region_values , prob) == 1){ //found a hs
     sudoku[bx][by][lx][ly] = [prob]; //convert to ns. must be array!
     //console.log("HS at " + bx + by + lx + ly);
     count_type.hs++; 
     progress++;
     break;
    }
  }
 }
 return progress;
}

function Solved() { //is sudoku solved?
	let solved = 1;
	for (let cell_count = 0; cell_count < 81; cell_count++) {
		let next_square = path[cell_count];
		let bx = next_square[0];
		let by = next_square[1];
		let lx = next_square[2];
		let ly = next_square[3];
  if (sudoku[bx][by][lx][ly].length != 1){//solve detector : All cells must contain only one value (NS) for solved sudoku. must be AFTER we check , and attempt to fill in, each cell
    solved = 0;
   }
	}
	return solved;
}

function Are_There_Blank_Cells() { 
	for (let cell_count = 0; cell_count < 81; cell_count++) {
		let next_square = path[cell_count];
		let bx = next_square[0];
		let by = next_square[1];
		let lx = next_square[2];
 	let ly = next_square[3];
  if (sudoku[bx][by][lx][ly].length == 0){//solve detector : All cells must contain only one value (NS) for solved sudoku. must be AFTER we check , and attempt to fill in, each cell
    return true;
   }
	}
	return false;
}

function Solved_Values_From_Regions(region, bigx, bigy, littlex, littley) { //given region and cell: find cells with one potential value (solved/known) and return all these values
	let accumulate_array = [];
	if (region == "row") {
		bigxArray = [0, 1, 2];
		bigyArray = [bigy];
		littlexArray = [0, 1, 2];
		littleyArray = [littley];
	}
	if (region == "col") {
		bigxArray = [bigx];
		bigyArray = [0, 1, 2];
		littlexArray = [littlex];
		littleyArray = [0, 1, 2];
	}
	if (region == "squ") {
		bigxArray = [bigx];
		bigyArray = [bigy];
		littlexArray = [0, 1, 2];
		littleyArray = [0, 1, 2];
	}
	//let result = true;
	bigxArray.forEach(function(bx) {
		bigyArray.forEach(function(by) {
			littlexArray.forEach(function(lx) {
				littleyArray.forEach(function(ly) {
					if (bigx == bx && bigy == by && littlex == lx && littley == ly) {
						return true; //next loop. return value irrelevant
					} //skip our cell
					if (sudoku[bx][by][lx][ly].length == 1) { //only look at set cells (1 probability)
						accumulate_array.push(sudoku[bx][by][lx][ly][0]);
					}
				});
			});
		});
	});

	//remove duplicates
	accumulate_array = Array_Remove_Duplicates(accumulate_array);
	return accumulate_array;
}

/*
function All_Values_From_Regions(region, bigx, bigy, littlex, littley) { //given region and cell: return all values
	let accumulate_array = [];
 accumulate_array.push( All_Values_From_Region('squ', bigx, bigy, littlex, littley) );
 accumulate_array.push( All_Values_From_Region('row', bigx, bigy, littlex, littley) );
 accumulate_array.push( All_Values_From_Region('col', bigx, bigy, littlex, littley) );
	return accumulate_array; 	//keep! duplicates
}
*/

function All_Values_From_Region(region, bigx, bigy, littlex, littley) { //given region and cell: return all values
	let accumulate_array = [];
	if (region == "row") {
		bigxArray = [0, 1, 2];
		bigyArray = [bigy];
		littlexArray = [0, 1, 2];
		littleyArray = [littley];
	}
	if (region == "col") {
		bigxArray = [bigx];
		bigyArray = [0, 1, 2];
		littlexArray = [littlex];
		littleyArray = [0, 1, 2];
	}
	if (region == "squ") {
		bigxArray = [bigx];
		bigyArray = [bigy];
		littlexArray = [0, 1, 2];
		littleyArray = [0, 1, 2];
	}
	//let result = true;
	bigxArray.forEach(function(bx) {
		bigyArray.forEach(function(by) {
			littlexArray.forEach(function(lx) {
				littleyArray.forEach(function(ly) { //skip our cell
					if (bigx == bx && bigy == by && littlex == lx && littley == ly) {
						return accumulate_array; //next loop. return in case we are last cell
					}
     if(sudoku[bx][by][lx][ly].length == 0){
      return false;
      }
					//if (sudoku[bx][by][lx][ly].length > 0) { //??? causes ... to fail, an empty cell will be caught at 
					//accumulate_array.push(...function(){return sudoku[bx][by][lx][ly];});
					//accumulate_array.push( ...sudoku[bx][by][lx][ly] );
     accumulate_array = [...accumulate_array , ...sudoku[bx][by][lx][ly]];
					//}
				});
			});
		});
	});
	return accumulate_array; //keep duplicates
}

function SetNextSquare(path) { //recursive routine
	if (path.length == 0) {
		return true;
	} //made it to the end. done. trigger our journey back
	let backup_for_possible_fail = JSON.stringify(sudoku);
	let next_square = path.shift();
	let bigx = next_square[0];
	let bigy = next_square[1];
	let littlex = next_square[2];
	let littley = next_square[3];
	let potential_numbers = sudoku[bigx][bigy][littlex][littley]; //convert set to array
	potential_numbers = Array_Shuffle(potential_numbers); //shuffle
	while (potential_numbers.length > 0) { //if we still have potential numbers in this square try another one 
		let chosen = potential_numbers.pop(); //pick a number
		sudoku[bigx][bigy][littlex][littley] = [chosen]; //set chosen number
		Remove_A_Potential_Value_From_Regions(bigx, bigy, littlex, littley, chosen); //remove chosen number from potential values in squ,col,row
		if (Are_There_Blank_Cells() == true) { //a square ran out of potential numbers
			sudoku = JSON.parse(backup_for_possible_fail); //restore board
			continue; //try another 
		}
		//success. lets try the next cell in the path 
		result = SetNextSquare(path);
		if (result == false) { //our recursive attempt failed. restore board and try another potential value from this cell
			sudoku = JSON.parse(backup_for_possible_fail); //restore board
		} else {
			return true; //making our way back home
		}
	}
	//all potential numbers failed on this cell. return false. recurse back
	path.unshift(next_square); //must unshift if we want to come back here. and we do.
	return false;
}

function Remove_A_Potential_Value_From_Regions(bigx, bigy, littlex, littley, value) { //remove value from all regions. return true if one was removed
 let removed = 0;
	removed = removed + Remove_A_Potential_Value_From_A_Region("squ", bigx, bigy, littlex, littley, value); //remove from squ
	result = removed + Remove_A_Potential_Value_From_A_Region("row", bigx, bigy, littlex, littley, value); //remove from row
	result = removed +  Remove_A_Potential_Value_From_A_Region("col", bigx, bigy, littlex, littley, value); //remove from col
	if(removed > 0){
  return true;
 }
 else{
  return false;
 }
}

function Remove_A_Potential_Value_From_A_Region(region, bigx, bigy, littlex, littley, value) {//remove value from specific region. if one is removed, return number of values removed
	if (region == "row") {
		bigxArray = [0, 1, 2];
		bigyArray = [bigy];
		littlexArray = [0, 1, 2];
		littleyArray = [littley];
	}
	if (region == "col") {
		bigxArray = [bigx];
		bigyArray = [0, 1, 2];
		littlexArray = [littlex];
		littleyArray = [0, 1, 2];
	}
	if (region == "squ") {
		bigxArray = [bigx];
		bigyArray = [bigy];
		littlexArray = [0, 1, 2];
		littleyArray = [0, 1, 2];
	}
	let removed = 0;
	bigxArray.forEach(function(bx) {
		bigyArray.forEach(function(by) {
			littlexArray.forEach(function(lx) {
				littleyArray.forEach(function(ly) {
					if (bigx == bx && bigy == by && littlex == lx && littley == ly) {
						return removed; //return this in case we are at last cell
					} //skip our cell
     if( sudoku[bx][by][lx][ly].includes(value) ){//will we be removing value?
      sudoku[bx][by][lx][ly] = Array_Difference(sudoku[bx][by][lx][ly], [value]);//remove it
      removed++;
     }
				});
			});
		});
	});
	return removed;
}

function getRandomInt(max) {
	return Math.floor(Math.random() * max);
}

function BL_To_XY(bl) {
	let x = bl[0] * 3 + bl[2];
	let y = bl[1] * 3 + bl[3];
	return [x, y];
}

function XY_To_BL(xy) {
	let bx = Math.floor(xy[0] / 3);
	let by = Math.floor(xy[1] / 3);
	let lx = xy[0] % 3;
	let ly = xy[1] % 3;
	return [bx, by, lx, ly];
}

function Array_Count_Value(array1, value){
 return array1.filter(function(x){ return x == value; }).length;
}

function Array_Values_Occur_Once(array1) {
	for (let ele of array1) {
		if (count[ele]) {
			count[ele]++;
		} else {
			count[ele] = 1;
		}
	}
	return Object.keys(ele).filter(function(key) { //filter elements with counts 1
		return ele[key] == 1;
	});
}

function Array_Remove_Duplicates(Array1) {
	let the_set = new Set(Array1);
	let the_array = Array.from(the_set);
	return the_array;
}

function Array_Difference(array1, array2) { //array with all items is array1. array2 should normally have lesser items (not less quantity, less values)
	//let difference = array1.filter((element) => !array2.includes(element));
	let difference = array1.filter(function(element){
		return !array2.includes(element);
	});
	return difference;
}

function Array_Shuffle(array) {
	for (let i = array.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		const temp = array[i];
		array[i] = array[j];
		array[j] = temp;
	}
	return array;
}

function DIM(arrayOfDimensions, theValue) { //like the BASIC DIM : var multiDimensionalArray = DIM([7,8,9],{jj:9 , kk:8})
	let localArrayOfDimensions = arrayOfDimensions.slice(); //must copy array as scope for arrayofdimensions is global 
	let returnArray = [];
	if (localArrayOfDimensions.length === 0) //no more dimensions
	{
		return JSON.parse(JSON.stringify(theValue)); //copy the value, not the pointer
	}
	let arraySize = localArrayOfDimensions.shift(); // size of current dimension
	for (let arrayPointer = 0; arrayPointer < arraySize; arrayPointer++) { //for each array pointer in this array dimension, recursively call DIM, and return and assign the value
		returnArray[arrayPointer] = DIM(localArrayOfDimensions, theValue);
	}
	return returnArray; //return here if there are still more array dimensions
}

function PositionFromID(cellID) {
	var gridID = cellID.slice(5, 9999); //strip Grid_
	var LocationOfCell = Array();
	LocationOfCell = gridID.split('_'); //split 1_2 part
	var x = LocationOfCell[0];
	var y = LocationOfCell[1];
	return new Array(x, y);
}

function IsCellLockedID(cellID) {
	var text = document.getElementById(cellID).innerHTML;
	if ((text.indexOf('locked', 0) > -1) || (text.indexOf('LOCKED', 0) > -1)) {
		return 1;
	} else {
		return 0;
	}
}

function IsCellStaticID(cellID) {
	let text = document.getElementById(cellID).innerHTML;
	if ((text.indexOf('static', 0) > -1)) {
		return 1;
	} else {
		return 0;
	}
}

function IsAnEditCellID(cellID) {
	if ((IsCellStaticID(cellID) == 1) || (IsCellLockedID(cellID) == 1)) {
		return 0;
	} else {
		return 1;
	}
}

function chooseOnClick() {
	cellID = this.id;
	choose(cellID);
}

function choose(cellID) {
	//take care of last cursor cell
	//if (LastCursorClass == '') {LastCursorClass = document.getElementById(cellID).className} //so we don't pooch the starting square
	//else {document.getElementById(LastCursorID).className = LastCursorClass;} //restore last selected square

	document.getElementById(LastCursorID).className = 'cellnotselectedclass'; //selected square back to white
	if (IsCellLockedID(LastCursorID) == 1) {
		document.getElementById(LastCursorID).className = 'celllockedclass';
	}
	if (IsCellStaticID(LastCursorID) == 1) {
		document.getElementById(LastCursorID).className = 'cellstaticclass'; //selected square back to gray
	}

	//take care of new cell
	//LastCursorClass = document.getElementById(cellID).className; //remember the last cursor color
	LastCursorID = cellID; //remember the last cursor cell

	//asumption
	document.getElementById(cellID).className = 'cellselectedclass'; //selected square back to yellow
	if (IsCellLockedID(cellID) == 1) {
		document.getElementById(cellID).className = 'cellgrayclass';
	}
	if (IsCellStaticID(cellID) == 1) {
		document.getElementById(cellID).className = 'cellgrayclass'; //selected square back to gray
	}
}

function keyinput() {
	var keyCode = event.key;
	let cellID = LastCursorID;

	var xy = Array();
	xy = PositionFromID(cellID);
	var x = xy[0];
	var y = xy[1];

	if (intable == 0) {
		return 0;
	} //we are not typing in the table. ignore

	if (keyCode == "ArrowLeft") {
		if (x <= 0) {
			x = 8;
		} else {
			x--;
		}
		choose('cell_' + x + '_' + y);
	} //left
	if (keyCode == "ArrowUp") {
		if (y <= 0) {
			y = 8;
		} else {
			y--;
		}
		choose('cell_' + x + '_' + y);
	} //up
	if (keyCode == "ArrowRight") {
		if (x >= 8) {
			x = 0;
		} else {
			x++;
		}
		choose('cell_' + x + '_' + y);
	} //right
	if (keyCode == "ArrowDown") {
		if (y >= 8) {
			y = 0;
		} else {
			y++;
		}
		choose('cell_' + x + '_' + y);
	} //down

	if (keyCode == "c") { //c - clear - clear current cell, if not locked
		if (IsAnEditCellID(cellID) == 1) {
			document.getElementById(cellID).innerHTML = "";
			send_cell_update(document.getElementById(cellID).innerHTML);
		}
	}

	if (keyCode == "h") { //h - how - check how we are doing status and send to chat box

		var textmsg = 'Numbers selected:' + CountLocked() + ' Correct:' + CountCorrectLocked('how') + '\n\r\n\rNote: this only counts locked numbers.';
		//send_chat(textmsg);
		alert(textmsg);
		//send_chat('Numbers selected:' + CountLocked() + '    Correct:' + CountCorrectLocked('how'));
	}

	if (keyCode == "r") { //r - reveal - check how we are doing status and send to chat box
		let textmsg = 'Numbers selected:' + CountLocked() + 'Correct:' + CountCorrectLocked('reveal') + '\n\r\n\rNote: this only counts locked numbers.';
		//send_chat(textmsg);
		alert(textmsg);
	}

	if (IsCellStaticID(cellID) == 1) {
		return 0;
	} //static cells can't be modified

	//lock - unlock function
	if (keyCode == "s") { //s - save
		var numberlist = document.getElementById(cellID).innerHTML;
		numberlist = numberlist.replace(/\D/g, ''); //remove all but numbers
		if (IsCellLockedID(cellID) == 1) { //unlock this square
			document.getElementById(cellID).innerHTML = numberlist;
			document.getElementById(cellID).className = 'cellnotselectedclass';
			LastCursorClass = document.getElementById(cellID).className;
			document.getElementById(cellID).className = 'cellselectedclass';
			send_cell_update(document.getElementById(cellID).innerHTML);
		} else { //lock the square
			if (numberlist.length == 1) { //lock this square
				document.getElementById(cellID).innerHTML = numberlist + '<!--locked-->';
				document.getElementById(cellID).className = 'celllockedclass';
				LastCursorClass = document.getElementById(cellID).className;
				document.getElementById(cellID).className = 'cellgrayclass';
				send_cell_update(document.getElementById(cellID).innerHTML);
				//if (blanksquares == CountCorrectLocked(count)) { //did we win?
     if( Did_We_Win() ){ //did we win?
					IWin();
				}
			} else {
				window.alert("You can only lock squares with one number");
			}
		}
	}

	if ((keyCode >= 1 && keyCode <= 9) && (IsCellLockedID(cellID) != 1)) { //number keys pressed 1 - 9
		let numberlist = document.getElementById(cellID).innerHTML;
		numberlist = numberlist.replace(/\D/g, ''); //remove all but numbers
		let keychar = keyCode;
		let founditindex = numberlist.indexOf(keychar, 0);
		if (founditindex > -1) { //remove number from string
			let re = new RegExp(keychar, 'g');
			numberlist = numberlist.replace(re, '');
		} else {
			numberlist = numberlist + keychar;
		}
		//sort our number list for display
		let t = numberlist.split('');
		t = t.sort();
		let t1 = t.slice(0, 3);
		let t2 = t.slice(3, 6);
		let t3 = t.slice(6, 9);
		numberlist = t1.join('') + '<br>' + t2.join('') + '<br>' + t3.join('');
		document.getElementById(cellID).innerHTML = numberlist; //put numbers back on board
		send_cell_update(document.getElementById(cellID).innerHTML);
	}
	Save_Sudoku(); //after each keystroke
}

function CountCorrectLocked(mode) {
	let CorrectCount = 0;
	for (let x = 0; x <= 8; x++) {
		for (let y = 0; y <= 8; y++) {
			let CellID = 'cell_' + x + '_' + y;
			let SolutionID = 'solution_' + x + '_' + y;
			if (IsCellLockedID(CellID) == 1) {
				let cellresult = document.getElementById(CellID).innerHTML;
				cellresult = cellresult.replace(/\D/g, '');
				let solutionresult = document.getElementById(SolutionID).innerHTML;
				solutionresult = solutionresult.replace(/\D/g, '');
				if (cellresult == solutionresult) {
					CorrectCount++;
				} else {
					if (mode == 'reveal') {
						document.getElementById(CellID).className = 'cellredclass';
					}
				}
			}
		}
	}
	return (CorrectCount);
}

function CountLocked() {
	let LockedCount = 0;
	for (let x = 0; x <= 8; x++) {
		for (let y = 0; y <= 8; y++) {
			let CellID = 'cell_' + x + '_' + y;
			if (IsCellLockedID(CellID) == 1) {
				LockedCount++;
			}
		}
	}
	return (LockedCount);
}

function send_cell_update(k) {
	let letter = k;
	setCookie(LastCursorID, letter, forever, '', '', ''); //LastCursorID = cell_x_y
}

function Did_We_Win(){
  for (let x = 0; x <= 8; x++) {
		for (let y = 0; y <= 8; y++) {
			let CellID = 'cell_' + x + '_' + y;
   let solutionID = "solution_" + x + "_" + y; 
   let cell = document.getElementById(CellID).innerHTML;
 	cell = cell.replace(/\D/g, ''); //remove all but numbers
  let solution = document.getElementById(solutionID).innerHTML;
   if( ! (IsCellStaticID(CellID) || IsCellLockedID(CellID)) ){ //check if we claim we are done
    	return false;
   }
			if (cell != solution) { //if one is wrong
    return false;
			}
		}
	}
	return true;
}

var wincount = 0;
function IWin() {
	let maxwincount = 200;
	let x = Math.floor(Math.random() * 9);
	let y = Math.floor(Math.random() * 9);
	let CellID = 'cell_' + x + '_' + y;
	let red = Math.floor(Math.random() * 255);
	let green = Math.floor(Math.random() * 255);
	let blue = Math.floor(Math.random() * 255);
	if (wincount < 100 / 2) {
		document.getElementById(CellID).style.backgroundColor = 'rgb(' + red + ',' + green + ',' + blue + ')';
	} else {
		document.getElementById(CellID).style.backgroundColor = '';
	}
 wincount++;
	if (wincount < maxwincount / 2) {
		window.requestAnimationFrame(IWin);
	} else {
		wincount = 0;
		Win_Done();
	}
}

function Win_Done(){
 		for (let x = 0; x <= 8; x++) {
			for (let y = 0; y <= 8; y++) {
				let CellID = 'cell_' + x + '_' + y;
				document.getElementById(CellID).style.backgroundColor = '';
			}
		}
  alert("You Win!");
}

function SimulateKey(key_pushed) {
	const kbEvent = new KeyboardEvent('keydown', {
		bubbles: true,
		cancelable: true,
		key: key_pushed,
	});
	document.body.dispatchEvent(kbEvent);
}
//SimulateKey(); //just to get rid of false not used error

function Howtoplay() {
	$('#dialog-message').dialog("open");
	$("#dialog-message").dialog("option", "width", 800);
}

function Statistics() {
	$('#Statistics').dialog("open");
	$("#Statistics").dialog("option", "width", 800);
}

function SolutionsDialog() {
	$('#SolutionDialog').dialog("open");
	$("#SolutionDialog").dialog("option", "width", 800);
}

function ClearUnlockedCells() {
	if (!confirm('Clear Unlocked. Are you sure? This will clear the board of all numbers that are not locked.')) {
		return false;
	}

	for (var x = 0; x <= 8; x++) {
		for (var y = 0; y <= 8; y++) {
			var cellID = 'cell_' + x + '_' + y;
			//document.getElementById(CellID).style.backgroundColor = '';
			if (IsAnEditCellID(cellID) == 1) {
				document.getElementById(cellID).innerHTML = "";
			}
		}
	}
	Save_Sudoku();
}

function ResetSudoku() {
	if (!confirm('Restart Puzzle? Are you sure? This will clear the board of ALL numbers.')) {
		return false;
	}

	for (var x = 0; x <= 8; x++) {
		for (var y = 0; y <= 8; y++) {
			var cellID = 'cell_' + x + '_' + y;
			if (IsCellStaticID(cellID) != 1) {
				document.getElementById(cellID).innerHTML = "";
			}
		}
	}
	Save_Sudoku();
}
 
//COOKIE CODE starts

var Cookie   = new Object();

Cookie.day   = 86400000;
Cookie.week  = Cookie.day * 7;
Cookie.month = Cookie.day * 31;
Cookie.year  = Cookie.day * 365;

function getCookie(name) {
  var cookies = document.cookie;
  var start = cookies.indexOf(name + '=');
  if (start == -1) return null;
  var len = start + name.length + 1;
  var end = cookies.indexOf(';',len);
  if (end == -1) end = cookies.length;
  //return unescape(cookies.substring(len,end));
  return  decodeURIComponent(cookies.substring(len,end));
}

function setCookie(name, value, expires, path, domain, secure) {
    value = encodeURIComponent(value);
  //value = escape(value);
  expires = (expires) ? ';expires=' + expires.toGMTString() :'';
  path    = (path)    ? ';path='    + path                  :'';
  domain  = (domain)  ? ';domain='  + domain                :'';
  secure  = (secure)  ? ';secure'                           :'';

  document.cookie =
    name + '=' + value + expires + path + domain + secure;
}

function deleteCookie(name, path, domain) {
  var expires = ';expires=Thu, 01-Jan-70 00:00:01 GMT';
  (path)    ? ';path='    + path                  : '';
  (domain)  ? ';domain='  + domain                : '';

  if (getCookie(name))
    document.cookie = name + '=' + expires + path + domain;
}

function listCookies() {
    var theCookies = document.cookie.split(';');
    var anArray = [];
    for (var i = 0 ; i < theCookies.length; i++) {
        theCookie = theCookies[i].split('=');
        anArray[i] =  theCookie[0].trim();
    }
return anArray;
}

function DeleteCookies() {
    var theCookies = document.cookie.split(';');
    for (var i = 0 ; i < theCookies.length; i++) {
        var mycookie = theCookies[i].split('=');
        var cookiename = mycookie[0];
        cookiename = cookiename.trim();
        deleteCookie(cookiename);
    }
}

//COOKIE CODE ends