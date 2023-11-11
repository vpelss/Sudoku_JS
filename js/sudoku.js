//use potential not possible or probable

//counting, two ways:
//counting for cells solved (but HP and above do not actually solve cells)
//OR
//when we make progress with solving method. this is more accurate as it describes steps to solving.

var sudoku; // sudoku[BigX][BigY][LittleX][LittleY] = [1..9]
var path = [];
var forever = new Date("October 17, 2050 03:24:00"); // use in cookies
//var count = 0;
var blank_cells;

var LastCursorID = "cell_0_0";
var intable = 1;
var count_type = {}; // count_type["ns"] = 5
var last_good_count_type = {};
var current_active_count; //will be ns, np, etc

const regions = ["row", "col", "squ"];
const region_counts = ["00", "01", "02", "10", "11", "12", "20", "21", "22"]; //will be bxlx for col , byly for row , bxby for squ
const one_to_nine = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];

function ReturnAllThreeRegionCountsForCell(bx, by, lx, ly) {
  //returns region_count for [row,col,squ] eg: [02,12,01]
  let row = "" + by + ly;
  let col = "" + bx + lx;
  let squ = "" + bx + by;
  return [row, col, squ];
}

function ReturnRegionCountForRegionAndCell(region, bx, by, lx, ly) {
  //returns region_count for [row,col,squ] eg: [02,12,01]
  if (region == "row") {
    return "" + by + ly;
  }
  if (region == "col") {
    return "" + bx + lx;
  }
  if (region == "squ") {
    return "" + bx + by;
  }
  return false; //failed?
}

function ReturnCellsForAll3RegionsFromCell(bx, by, lx, ly) {
  let cells = [];
  regions.forEach(function (region) {
    cells.push(...ReturnCellsForRegionAndCell(region, bx, by, lx, ly));
  });
  return cells;
}

function ReturnCellsForRegionAndCell(region, bx, by, lx, ly) {
  region_count = ReturnRegionCountForRegionAndCell(region, bx, by, lx, ly);
  return ReturnCellsForRegionAndRegionCount(region, region_count);
}

function ReturnCellsForRegionAndRegionCount(region, region_count) {
  //region will be row, col, squ
  //region_count will be bxlx , byly , bxby
  let a, b;
  [a, b] = region_count.split("");
  let cells = [];

  if (region == "row") {
    bigxArray = [0, 1, 2];
    bigyArray = [a];
    littlexArray = [0, 1, 2];
    littleyArray = [b];
  }
  if (region == "col") {
    bigxArray = [a];
    bigyArray = [0, 1, 2];
    littlexArray = [b];
    littleyArray = [0, 1, 2];
  }
  if (region == "squ") {
    bigxArray = [a];
    bigyArray = [b];
    littlexArray = [0, 1, 2];
    littleyArray = [0, 1, 2];
  }
  bigxArray.forEach(function (bx) {
    bigyArray.forEach(function (by) {
      littlexArray.forEach(function (lx) {
        littleyArray.forEach(function (ly) {
          cells.push([bx, by, lx, ly]);
        });
      });
    });
  });
  return cells;
}

function RemoveValuesFromCellsInAll3Regions(
  bigx,
  bigy,
  littlex,
  littley,
  values
) {
  //remove value from all regions. return true if one was removed
  let removed = 0;
  let [row_count, col_count, squ_count] = ReturnAllThreeRegionCountsForCell(
    bigx,
    bigy,
    littlex,
    littley
  );
  removed =
    removed +
    RemoveValuesFromCellsInRegionAndRegionCount("squ", squ_count, values); //remove from squ
  removed =
    removed +
    RemoveValuesFromCellsInRegionAndRegionCount("row", row_count, values); //remove from row
  removed =
    removed +
    RemoveValuesFromCellsInRegionAndRegionCount("col", col_count, values); //remove from col
  return removed;
}

function RemoveValuesFromCellsInRegionAndRegionCount(
  region,
  region_count,
  values
) {
  //remove value from specific region. return number of values removed
  let cells = ReturnCellsForRegionAndRegionCount(region, region_count);
  let removed_cells = 0;
  cells.forEach(function (cell) {
    let [bx, by, lx, ly] = cell;
    let array_start = sudoku[bx][by][lx][ly].join("");
    sudoku[bx][by][lx][ly] = Array_Difference(sudoku[bx][by][lx][ly], values); //remove them
    let array_end = sudoku[bx][by][lx][ly].join("");
    if (array_start != array_end) {
      removed_cells++; //FIX
      if (sudoku[bx][by][lx][ly].length == 1) {
        //count_type[current_active_count]++;
      }
    }
  });
  //if(removed_cells < 0){removed_cells = 0;}
  return removed_cells; //number of cell that values were removed
}

window.onload = Main;

function Main() {
  $("#dialog-waiting").hide();

  //start dialogs and turn off
  $(function () {
    $(".dialogs").dialog({
      autoOpen: false,
      modal: true,
      buttons: {
        Ok: function () {
          $(this).dialog("close");
        }
      }
    });
  });

  //accordions uiquery
  $(function () {
    $("#accordion , #archive_area").accordion({
      collapsible: true,
      active: false
    });
  });

  path = Create_Path(); //set path to traverse Sudoku recursively
  //set event functions
  document.getElementById("how_to_play").onclick = Howtoplay;
  //document.getElementById("statistics").onclick = Statistics;
  document.getElementById("solution").onclick = SolutionsDialog;
  document.getElementById("clear_unlocked_cells").onclick = ClearUnlockedCells;
  document.getElementById("body").onkeydown = keyinput;
  document.getElementById("create_sudoku").onclick = Create_Playable_Sudoku;
  document.getElementById("save_slot").onchange = Load_Sudoku;
  document.getElementById("reset_sudoku").onclick = ResetSudoku;
  document.getElementById("Export_Archive").onclick = Export_Archive;
  document.getElementById("Import_Archive").onclick = Import_Archive;
  document.getElementById("difficulty").onchange = Difficulty;

  //remember last save_slot
  let slot = getCookie("save_slot");
  if (slot == null) {
    slot = "1_Sudoku";
  }
  document.getElementById("save_slot").value = slot;
  Load_Sudoku(); //previous save
}

function Load_Sudoku() {
  let slot = document.getElementById("save_slot").value;
  setCookie("save_slot", slot, forever, "", "", ""); //we may have changed it
  let save_text = localStorage.getItem(slot);
  let empty = false;
  if (save_text == null) {
    //nothing saved. fail
    empty = true;
  }
  let save_array = JSON.parse(save_text);
  jscalcpuzz = "";

  path_temp = JSON.parse(JSON.stringify(path)); //temp path as SetCellsRecursive() wipes it
  path_temp.forEach(function (cell) {
    [x, y] = BL_To_XY(cell);
    let cellID = "cell_" + x + "_" + y;
    let solutionID = "solution_" + x + "_" + y;
    let cell_text, solution_text;
    if (empty) {
      [cell_text, solution_text] = ["", ""];
    } else {
      [cell_text, solution_text] = save_array[cellID];
    }
    document.getElementById(cellID).innerHTML = cell_text;
    document.getElementById(solutionID).innerHTML = solution_text; //set solution table

    //set class and tester string
    let numberlist = cell_text.replace(/\D/g, ""); //remove all but numbers
    let value = "-";
    if (numberlist.length == 1) {
      value = numberlist;
    }
    if (IsCellStaticID(cellID)) {
      //static
      document.getElementById(cellID).className = "cellstaticclass";
      jscalcpuzz = jscalcpuzz + value;
    }
    if (IsCellLockedID(cellID)) {
      document.getElementById(cellID).className = "celllockedclass";
    }
    if (IsAnEditCellID(cellID)) {
      //blank
      document.getElementById(cellID).className = "cellnotselectedclass";
      jscalcpuzz = jscalcpuzz + value;
    }
    document.getElementById(cellID).onclick = chooseOnClick; //also set onclick
  });

  document.getElementById("map").innerHTML = jscalcpuzz;
  //start_cross(document.getElementById("Solution"));
  start_cross(document.getElementById("map").value);
  document.getElementById("difficulty").value = save_array.difficulty;
  document.getElementById("counts").innerHTML = save_array.counts;
  Difficulty();
  return true;
}

function Save_Sudoku() {
  let save_array = {};
  path_temp = JSON.parse(JSON.stringify(path)); //temp path as SetCellsRecursive() wipes it
  path_temp.forEach(function (cell) {
    [x, y] = BL_To_XY(cell);
    let cellID = "cell_" + x + "_" + y;
    let solutionID = "solution_" + x + "_" + y;
    let cell_text, solution_text;
    cell_text = document.getElementById(cellID).innerHTML;
    solution_text = document.getElementById(solutionID).innerHTML; //set solution table
    //save_array.push([cell_text, solution_text]);
    save_array[cellID] = [cell_text, solution_text];
  });
  save_array.difficulty = document.getElementById("difficulty").value;
  save_array.counts = document.getElementById("counts").innerHTML;
  //save created sudoku
  localStorage.setItem(
    document.getElementById("save_slot").value,
    JSON.stringify(save_array)
  );
}

function Export_Archive() {
  document.getElementById("archive").value = JSON.stringify(localStorage);
}

function Import_Archive() {
  //
  let text = document.getElementById("archive").value;
  let obje = JSON.parse(text);
  Object.keys(obje).forEach(function (key) {
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
  sudoku = DIM([3, 3, 3, 3], one_to_nine); //fill Sudoku board with all possibilities "1".."9" : string values so array_diff routine does not fail
  //start create full Sudoku board
  let path_temp = JSON.parse(JSON.stringify(path)); //temp path as SetCellsRecursive() wipes it
  SetCellsRecursive(path_temp); //clears path

  //place selections on board
  path_temp = JSON.parse(JSON.stringify(path)); //temp path as SetCellsRecursive() wipes it
  path_temp.forEach(function (cell) {
    let [bx, by, lx, ly] = cell;
    let [x, y] = BL_To_XY(cell);
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
  path_temp = JSON.parse(JSON.stringify(path)); //temp path as SetCellsRecursive() wipes it
  path_temp.forEach(function (cell) {
    let bx, by, lx, ly, x, y;
    [bx, by, lx, ly] = cell;
    [x, y] = BL_To_XY(cell);
    let cellID = "cell_" + x + "_" + y;
    let value = sudoku[bx][by][lx][ly].toString();
    if (value != "") {
      //static
      cell_text = "<!--static-->" + value;
      document.getElementById(cellID).className = "cellstaticclass";
      jscalcpuzz = jscalcpuzz + value;
    } else {
      //blank
      cell_text = value;
      document.getElementById(cellID).className = "cellnotselectedclass";
      jscalcpuzz = jscalcpuzz + "-";
    }
    document.getElementById(cellID).onclick = chooseOnClick; //also set onclick
    document.getElementById(cellID).innerHTML = cell_text;
    if (count % 9 == 0) {
      //every 8 count start new line
      jscalcpuzz = jscalcpuzz + "\r\n";
    }
    count++;
  });
  document.getElementById("map").innerHTML = jscalcpuzz;
  //start_cross(document.getElementById("Solution"));
  start_cross(document.getElementById("map").value);

  document.getElementById("counts").innerHTML =
    "NSF:" +
    last_good_count_type.nsf +
    " NS:" +
    last_good_count_type.ns +
    " HS:" +
    last_good_count_type.hs +
    " NP:" +
    last_good_count_type.np +
    " HP:" +
    last_good_count_type.hp +
    " IR:" +
    last_good_count_type.ir +
    " XW:" +
    last_good_count_type.xw +
    " YW:" +
    last_good_count_type.yw +
    " Blank Cells: " +
    blank_cells;

  Save_Sudoku(); //save created sudoku
  $("#dialog-waiting").hide();
}

function RemoveCells() {
  let d = new Date();
  let time = d.getTime();
  let try_time = document.getElementById("TimeToTry").value;
  let finished = time + 1000 * try_time; //5 sec max
  //let one_value;
  let potential_sudoku;
  blank_cells = 0;

  while (
    d.getTime() < finished &&
    blank_cells < document.getElementById("number_of_blank_squares").value
  ) {
    //save array status
    let backup_sudoku_array = JSON.stringify(sudoku);

    //random choose a cell that has one potential value
    let bx, by, lx, ly;
    do {
      bx = getRandomInt(3);
      by = getRandomInt(3);
      lx = getRandomInt(3);
      ly = getRandomInt(3);
    } while (sudoku[bx][by][lx][ly].length != 1);

    sudoku[bx][by][lx][ly] = []; //remove value

    potential_sudoku = JSON.stringify(sudoku);
    //count_type = {"nsf":0 , "ns":0 , "hs":0 , "np":0 , "hp":0 , "ir":0 , "xw":0 , "yw":0 }; //start new count. this might be final run
    //try to solve sudoku array. Solve me mangles global sudoku array so we will need to restore it
    let result;
    try {
      result = SolveSudoku();
      if (result) {
        //success : save
        sudoku = JSON.parse(potential_sudoku); //save board
        last_good_count_type = JSON.parse(JSON.stringify(count_type));
        blank_cells++;
      } else {
        //fail : restore
        sudoku = JSON.parse(backup_sudoku_array); //restore previous board
      }
    } catch (err) {
      console.error(err);
      sudoku = JSON.parse(backup_sudoku_array); //restore previous board
    }

    d = new Date();
  } //end while
}

function SolveSudoku() {
  // changes/mangles sudoku. so calling routines must accommodate
  let progress = 0; // > 0 if we made any progress
  //start board off by calculating simple starting possibilities for blank cells in entire board
  //then try to reduce all possibilities to 1 value for each cell using ns,hs,np...

  count_type = { nsf: 0, ns: 0, hs: 0, np: 0, hp: 0, ir: 0, xw: 0, yw: 0 }; //start new count. this might be final run

  //THIS WILL BE NS COUNT ALSO
  FillBlankCellsWithpotentialValues(); //fill potential values for all empty cells. note this will solve all easy ns at the start also
  //HOW IS THIS SOLVING FOR MORE COMPLEX SUDOKU WHERE THERE ARE MORE THAN ONE POTENTIAL VALUE?

  do {
    progress = 0;
    //only useful on complex levels as FillBlankCellsWithpotentialValues fills in all squares on easy levels
    if (document.getElementById("NS").checked == true) {
      //progress = progress + NS(bx, by, lx, ly);
      progress = progress + NS();
    } //ns

    if (document.getElementById("HS").checked == true) {
      progress = progress + HS();
    } //hs
    if (document.getElementById("NP").checked == true) {
      progress = progress + NP();
    } //np
    if (document.getElementById("HP").checked == true) {
      progress = progress + HP();
    } //hp
    if (document.getElementById("IR").checked == true) {
      progress = progress + IR();
    } //ir
    //xwing
    //ywing
    let solved = Solved(); //if all cells have 1 value
    if (solved) {
      //solved if all cells have 1 possibility (ns)
      return true;
    } else {
    } //just keep going
  } while (progress > 0); //true if we made any progress
  return false; //we made no progress and we never solved it
}

function FillBlankCellsWithpotentialValues() {
  //calculates potential values for blank cells by getting all single values (ie: solved values) in all three regions and setting the cell values to those not in those single values
  current_active_count = "nsf";
  path.forEach(function (cell_path) {
    let [bx, by, lx, ly] = cell_path;
    let solved_numbers = [];
    if (sudoku[bx][by][lx][ly].length == 0) {
      let cells = ReturnCellsForAll3RegionsFromCell(bx, by, lx, ly);
      cells.forEach(function (cell) {
        let [bx, by, lx, ly] = cell;
        if (sudoku[bx][by][lx][ly].length == 1) {
          // is this cell a solved cell (single value)?
          solved_numbers.push(sudoku[bx][by][lx][ly][0]);
        }
      });
      let potential_numbers = Array_Difference(one_to_nine, solved_numbers); //difference of that list
      sudoku[bx][by][lx][ly] = potential_numbers; //used by hs,mp,hp,ir,xw,yw...
      if (potential_numbers.length == 1) {
        count_type[current_active_count]++;
      } else {
        //this means we need to use other methods to solve sudoku, NS, NP, etc
        //console.error("multiple values found in blank cells");
      }
    }
  });
}

//ns
//hs?
//np
//hp?
//ip?
//xw?
//yw?
//maybe not worth it
function ValuesOfCellsForRegionAndRegionCount(region, region_count) {
  let values_of_cells_as_keys_and_locations_as_arrays = {};
  regions.forEach(function (region) {
    let cells = ReturnCellsForRegionAndRegionCount(region, region_count);
    cells.forEach(function (cell) {
      //count values
      let [bx, by, lx, ly] = cell;
      let values_string = sudoku[bx][by][lx][ly].join("");
      //sudoku[bx][by][lx][ly].forEach(function(value){
      values_of_cells_as_keys_and_locations_as_arrays[values_string] = cell;
    });
  });
  return values_of_cells_as_keys_and_locations_as_arrays; //return values["45"] = [cell1,cell2]
}

//currently using for troubleshooting. ie: cell val = []
function ReturnRegionRegionCountValues(region, region_count) {
  let region_values = [];
  let cells = ReturnCellsForRegionAndRegionCount(region, region_count);
  cells.forEach(function (cell) {
    let [bx, by, lx, ly] = cell;
    if (sudoku[bx][by][lx][ly].length == 0) {
      //indicates something is wrong
      console.error("No value at " + cell);
      //throw "No value at " + cell;
    }
    region_values.push(sudoku[bx][by][lx][ly]);
  });
  return region_values;
}

function NS() {
  let progress = 0;
  current_active_count = "ns";
  let region = "row";
  region_counts.forEach(function (region_count) {
    let cells = ReturnCellsForRegionAndRegionCount(region, region_count);
    cells.forEach(function ([bx, by, lx, ly]) {
      //count values
      if (sudoku[bx][by][lx][ly].length == 1) {
        //NS (or static) so remove the value from all regions
        let values = sudoku[bx][by][lx][ly];
        let removed = RemoveValuesFromCellsInAll3Regions(
          bx,
          by,
          lx,
          ly,
          values
        );
        sudoku[bx][by][lx][ly] = values; //restore
        removed--; //as we just restored
        if (removed) {
          //progress account for removing in our cell
          count_type[current_active_count]++;
          progress++;
        }
      }
    });
  });
  return progress;
}

function HS() {
  //if a value occurs only once in a region, it is a hs if found among other values. convert it to ns
  let progress = 0;
  current_active_count = "hs";
  regions.forEach(function (region) {
    region_counts.forEach(function (region_count) {
      let cells = ReturnCellsForRegionAndRegionCount(region, region_count);
      let single_values_associative = {};
      cells.forEach(function ([bx, by, lx, ly]) {
        //count values
        sudoku[bx][by][lx][ly].forEach(function (value) {
          if (typeof single_values_associative[value] == "undefined") {
            single_values_associative[value] = [];
          }
          single_values_associative[value].push([bx, by, lx, ly]);
        }); //count single values
      }); //cells
      //search for HS
      let single_values = Object.keys(single_values_associative);
      single_values.forEach(function (single_value) {
        if (single_values_associative[single_value].length == 1) {
          let [bx, by, lx, ly] = single_values_associative[single_value][0];
          if (sudoku[bx][by][lx][ly].length > 1) {
            //it is only a HS if it is hidden : found HS
            sudoku[bx][by][lx][ly] = [single_value];
            count_type[current_active_count]++;
            progress++;
          }
        }
      });
    }); //regoin_counts
  }); //regions
  return progress;
}

function NP() {
  let progress = 0;
  current_active_count = "np";
  regions.forEach(function (region) {
    region_counts.forEach(function (region_count) {
      let two_values_cells = {}; // two_values_cells[value_pair] = [ [cell1] , [cell2] ]
      let cells = ReturnCellsForRegionAndRegionCount(region, region_count);
      cells.forEach(function (cell) {
        let [bx, by, lx, ly] = cell;
        if (sudoku[bx][by][lx][ly].length == 2) {
          //store cells with two values
          let value_string = sudoku[bx][by][lx][ly].sort().join(""); //sort is important to compare
          if (typeof two_values_cells[value_string] == "undefined") {
            two_values_cells[value_string] = [];
          }
          two_values_cells[value_string].push(cell);
        }
      });

      let potential_pairs = Object.keys(two_values_cells);
      potential_pairs.forEach(function (potential_pair) {
        if (two_values_cells[potential_pair].length == 2) {
          //found NP
          let values = potential_pair.split(""); //get both values
          let cells_removed = RemoveValuesFromCellsInRegionAndRegionCount(
            region,
            region_count,
            values
          ); //remove from region
          two_values_cells[potential_pair].forEach(function (cell) {
            //restore pairs to np cells
            let [bx, by, lx, ly] = cell;
            sudoku[bx][by][lx][ly] = values;
            progress--;
          });
          cells_removed = cells_removed - 2; //-2 as we removed and added back NP
          progress = progress + cells_removed;
          if (cells_removed) {
            //not only did we find NP, we removed values
            count_type[current_active_count]++;
          }
        }
      });
    });
  });
  return progress;
}

function HP() {
  //if two values in a region are found together among other values twice, that is a HP. convert to NP
  let progress = 0;
  current_active_count = "hp";
  regions.forEach(function (region) {
    region_counts.forEach(function (region_count) {
      let two_values_cells = {}; // two_values_cells[value_pair] = [ [cell1] , [cell2] ]
      let cells = ReturnCellsForRegionAndRegionCount(region, region_count);
      cells.forEach(function (cell) {
        let [bx, by, lx, ly] = cell;
        if (sudoku[bx][by][lx][ly].length > 2) {
          // cells with 3 or more values to be hidden
          let value_array = sudoku[bx][by][lx][ly].sort().slice(); //sort is important for comparing, slice so we create a NEW array!
          while (value_array.length > 1) {
            //get all possible pairs
            let first_value = value_array.shift();
            value_array.forEach(function (next_value) {
              let pair = "" + first_value + next_value;
              if (typeof two_values_cells[pair] == "undefined") {
                two_values_cells[pair] = [];
              }
              two_values_cells[pair].push(cell);
            });
          }
        }
      });
      //look for HP in region,region_count
      let potential_pairs = Object.keys(two_values_cells);
      potential_pairs.forEach(function (potential_pair) {
        if (two_values_cells[potential_pair].length == 2) {
          //found HP
          let values = potential_pair.split(""); //get both values
          two_values_cells[potential_pair].forEach(function (cell) {
            //convert found HP pairs to np cells
            let [bx, by, lx, ly] = cell;
            sudoku[bx][by][lx][ly] = values;
            progress++;
            count_type[current_active_count]++;
          });
        }
      });
    });
  });
  return progress;
}

function IR() {
	//If a region (row, column and 3 x 3 square) has only two or three cells that contain the same possible value,
	//and these two or three cells intersect with another region,
	//you can remove this value from the intersecting region.
	//values_in_reginon_region_count_cells[value][subregion] = [c1,c2,...]
	//subregions_with_value[value]=[s1,s2,...]
	//get crossing regions for subregion?
	let progress = 0;
	let removed;
	current_active_count = "ir";
	regions.forEach(function(region) {
		region_counts.forEach(function(region_count) {
			let cells_with_value = {}; // cells_with_value[value] = [ [cell1] , [cell2] ]
			let subregions_with_value = {};
			let cells = ReturnCellsForRegionAndRegionCount(region, region_count);
			cells.forEach(function(cell) {
				let[bx, by, lx, ly] = cell;
				let values_array = sudoku[bx][by][lx][ly].sort().slice(); //sort is important for comparing, slice so we create a NEW array!
				values_array.forEach(function(value) {
					if (typeof cells_with_value[value] == "undefined") {
						cells_with_value[value] = [];
					}
					cells_with_value[value].push(cell);
					let subregions = GetSubRegions(region, cell); //one if row and col, two if squ (horz , vert)
					subregions.forEach(function(subregion) {
						if (typeof subregions_with_value[value] == "undefined") {
							subregions_with_value[value] = [];
						}
						subregions_with_value[value].push(subregion);
					});
				});
			});
			//look for IR in this region and region_count
			let values = Object.keys(cells_with_value);
			values.forEach(function(value) {
				if (cells_with_value[value].length >= 2) {
					//possible ir
          
          let result = IfIrFoundReturnRegionAndRegionCount(region , cells);
          if(result != false){//ir found
            let [intersecting_region , intersecting_region_count] = result;
            removed = RemoveValuesFromCellsInRegionAndRegionCount(intersecting_region , intersecting_region_count , [value]);
            cells_with_value[value].forEach(function(cell) {//re-add value to triggering cells in subregion
							let[bx, by, lx, ly] = cell;
							sudoku[bx][by][lx][ly].push(value);
							removed++;
						});  
          }
					//}
					if (removed > 0) {
						progress++;
					}
				}
			});
		});
	});
	return progress;
}

function IfIrFoundReturnRegionAndRegionCount(region , cells){ //are all cells in same (row OR col) AND in same SQU
  //if no, return false
  //if yes, IR : return [intersecting_region , intersecting_region_count] to remove value from
  //note: if region == "cell" return intersecting region will be "row" or "col"
  //note: if region == "row" or "col" return intersecting region will be "cell"
  let xCount = {"0":0,"1":0,"2":0};
  let yCount = {"0":0,"1":0,"2":0};
  let last_region_count = "none";
  cells.forEach(function (cell) {
    let [bx, by, lx, ly] = cell;
    //test to see if all cells are in same squ
    let region_count = ReturnRegionCountForRegionAndCell("squ", bx, by, lx, ly);
    if ( (last_region_count != "none") && (region_count != last_region_count) ) { //fail if a cell is not in same squ
      return false;
    }
    last_region_count = region_count;
    //count rows and columns to see if all cells are in same row or col
    xCount[lx]++;
    yCount[ly]++;
  });
  //test to see if all cells are in same row or col
  let all_x_count_equal_one = Object.values(xCount).filter(function(count){return count == 1;});
  let all_y_count_equal_one = Object.values(yCount).filter(function(count){return count == 1;});
  let intersecting_region = "";
  if(all_x_count_equal_one.length == cells.length){ //all cells in same row
    intersecting_region = "row";
  }if(all_y_count_equal_one.length == cells.length){ //all cells in same col
    intersecting_region = "col";
  }
  if(intersecting_region != ""){ //IR found
     if(region != "cell"){
      intersecting_region = "cell";
     }
    let[bx, by, lx, ly] = cell;
    let intersecting_region_count = ReturnRegionCountForRegionAndCell(intersecting_region, bx, by, lx, ly);
    return [intersecting_region , intersecting_region_count];
  }
  return false;
}

function AreCellsInHorizOrVertSubregion(cells) {
  //IfIrFoundReturnRegionAndRegionCount
  //bx and by must be same : must be in the same squ
  //if all x counts == 1 return row
  //if all y counts == 1 return col
  //return row or col??? or false
  let xCount = {"0":0,"1":0,"2":0};
  let yCount = {"0":0,"1":0,"2":0};
  let last_region_count = "none";
  cells.forEach(function (cell) {
    let [bx, by, lx, ly] = cell;
    let region_count = ReturnRegionCountForRegionAndCell("squ", bx, by, lx, ly);
    if ( (last_region_count != "none") && (region_count != last_region_count) ) { //fail if a cell is not in same squ
      return false;
    }
    last_region_count = region_count;
    //count rows and columns
    xCount[lx]++;
    yCount[ly]++;
  });
  let all_x_count_equal_one = Object.values(xCount).filter(function(count){return count == 1;});
  let all_y_count_equal_one = Object.values(yCount).filter(function(count){return count == 1;});
  if(all_x_count_equal_one.length == cells.length){ //all cells in same row
    return "row";
  }if(all_y_count_equal_one.length == cells.length){ //all cells in same col
    return "col";
  }
  return "false";
}

function GetSubRegions(region, cell) {
  let [bx, by, lx, ly] = cell;
  if (region == "row") {
    return ["h_" + bx];
  }
  if (region == "col") {
    return ["v_" + by];
  }
  if (region == "squ") {
    //?????
    return ["h_" + bx, "v_" + by]; //horiz , vert
    //return ["" + bx  + "_" + by]; //horiz , vert
    //return ["" + bx + by];
  }
}

function Solved() {
  //is sudoku solved?
  let solved = 1;
  for (let cell_count = 0; cell_count < 81; cell_count++) {
    let next_square = path[cell_count];
    let bx = next_square[0];
    let by = next_square[1];
    let lx = next_square[2];
    let ly = next_square[3];
    if (sudoku[bx][by][lx][ly].length != 1) {
      //solve detector : All cells must contain only one value (NS) for solved sudoku. must be AFTER we check , and attempt to fill in, each cell
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
    if (sudoku[bx][by][lx][ly].length == 0) {
      //solve detector : All cells must contain only one value (NS) for solved sudoku. must be AFTER we check , and attempt to fill in, each cell
      return true;
    }
  }
  return false;
}

function SetCellsRecursive(path) {
  //recursive routine
  if (path.length == 0) {
    return true;
  } //made it to the end. done. trigger our journey back
  let backup_for_potential_fail = JSON.stringify(sudoku);
  let next_square = path.shift();
  let bigx = next_square[0];
  let bigy = next_square[1];
  let littlex = next_square[2];
  let littley = next_square[3];
  let potential_numbers = sudoku[bigx][bigy][littlex][littley]; //convert set to array
  potential_numbers = Array_Shuffle(potential_numbers); //shuffle
  while (potential_numbers.length > 0) {
    //if we still have potential numbers in this square try another one
    let chosen = potential_numbers.pop(); //pick a number
    RemoveValuesFromCellsInAll3Regions(bigx, bigy, littlex, littley, [chosen]); //remove chosen number from potential values in squ,col,row
    sudoku[bigx][bigy][littlex][littley] = [chosen]; //set chosen number
    if (Are_There_Blank_Cells() == true) {
      //a square ran out of potential numbers
      sudoku = JSON.parse(backup_for_potential_fail); //restore board
      continue; //try another
    }
    //success. lets try the next cell in the path
    result = SetCellsRecursive(path);
    if (result == false) {
      //our recursive attempt failed. restore board and try another potential value from this cell
      sudoku = JSON.parse(backup_for_potential_fail); //restore board
    } else {
      return true; //making our way back home
    }
  }
  //all potential numbers failed on this cell. return false. recurse back
  path.unshift(next_square); //must unshift if we want to come back here. and we do.
  return false;
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

function Array_Remove_Duplicates(Array1) {
  let the_set = new Set(Array1);
  let the_array = Array.from(the_set);
  return the_array;
}

function Array_Difference(array1, array2) {
  //array with all items is array1. array2 should normally have lesser items (not less quantity, less values)
  //let difference = array1.filter((element) => !array2.includes(element));
  let difference = array1.filter(function (element) {
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

function DIM(arrayOfDimensions, theValue) {
  //like the BASIC DIM : var multiDimensionalArray = DIM([7,8,9],{jj:9 , kk:8})
  let localArrayOfDimensions = arrayOfDimensions.slice(); //must copy array as scope for arrayofdimensions is global
  let returnArray = [];
  if (localArrayOfDimensions.length === 0) {
    //no more dimensions
    return JSON.parse(JSON.stringify(theValue)); //copy the value, not the pointer
  }
  let arraySize = localArrayOfDimensions.shift(); // size of current dimension
  for (let arrayPointer = 0; arrayPointer < arraySize; arrayPointer++) {
    //for each array pointer in this array dimension, recursively call DIM, and return and assign the value
    returnArray[arrayPointer] = DIM(localArrayOfDimensions, theValue);
  }
  return returnArray; //return here if there are still more array dimensions
}

function PositionFromID(cellID) {
  var gridID = cellID.slice(5, 9999); //strip Grid_
  var LocationOfCell = Array();
  LocationOfCell = gridID.split("_"); //split 1_2 part
  var x = LocationOfCell[0];
  var y = LocationOfCell[1];
  return new Array(x, y);
}

function IsCellLockedID(cellID) {
  var text = document.getElementById(cellID).innerHTML;
  if (text.indexOf("locked", 0) > -1 || text.indexOf("LOCKED", 0) > -1) {
    return 1;
  } else {
    return 0;
  }
}

function IsCellStaticID(cellID) {
  let text = document.getElementById(cellID).innerHTML;
  if (text.indexOf("static", 0) > -1) {
    return 1;
  } else {
    return 0;
  }
}

function IsAnEditCellID(cellID) {
  if (IsCellStaticID(cellID) == 1 || IsCellLockedID(cellID) == 1) {
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

  document.getElementById(LastCursorID).className = "cellnotselectedclass"; //selected square back to white
  if (IsCellLockedID(LastCursorID) == 1) {
    document.getElementById(LastCursorID).className = "celllockedclass";
  }
  if (IsCellStaticID(LastCursorID) == 1) {
    document.getElementById(LastCursorID).className = "cellstaticclass"; //selected square back to gray
  }

  //take care of new cell
  //LastCursorClass = document.getElementById(cellID).className; //remember the last cursor color
  LastCursorID = cellID; //remember the last cursor cell

  //asumption
  document.getElementById(cellID).className = "cellselectedclass"; //selected square back to yellow
  if (IsCellLockedID(cellID) == 1) {
    document.getElementById(cellID).className = "cellgrayclass";
  }
  if (IsCellStaticID(cellID) == 1) {
    document.getElementById(cellID).className = "cellgrayclass"; //selected square back to gray
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
    choose("cell_" + x + "_" + y);
  } //left
  if (keyCode == "ArrowUp") {
    if (y <= 0) {
      y = 8;
    } else {
      y--;
    }
    choose("cell_" + x + "_" + y);
  } //up
  if (keyCode == "ArrowRight") {
    if (x >= 8) {
      x = 0;
    } else {
      x++;
    }
    choose("cell_" + x + "_" + y);
  } //right
  if (keyCode == "ArrowDown") {
    if (y >= 8) {
      y = 0;
    } else {
      y++;
    }
    choose("cell_" + x + "_" + y);
  } //down

  if (keyCode == "c") {
    //c - clear - clear current cell, if not locked
    if (IsAnEditCellID(cellID) == 1) {
      document.getElementById(cellID).innerHTML = "";
      send_cell_update(document.getElementById(cellID).innerHTML);
    }
  }

  if (keyCode == "h") {
    //h - how - check how we are doing status and send to chat box

    var textmsg =
      "Numbers selected:" +
      CountLocked() +
      " Correct:" +
      CountCorrectLocked("how") +
      "\n\r\n\rNote: this only counts locked numbers.";
    //send_chat(textmsg);
    alert(textmsg);
    //send_chat('Numbers selected:' + CountLocked() + '    Correct:' + CountCorrectLocked('how'));
  }

  if (keyCode == "r") {
    //r - reveal - check how we are doing status and send to chat box
    let textmsg =
      "Numbers selected:" +
      CountLocked() +
      "Correct:" +
      CountCorrectLocked("reveal") +
      "\n\r\n\rNote: this only counts locked numbers.";
    //send_chat(textmsg);
    alert(textmsg);
  }

  if (IsCellStaticID(cellID) == 1) {
    return 0;
  } //static cells can't be modified

  //lock - unlock function
  if (keyCode == "s") {
    //s - save
    var numberlist = document.getElementById(cellID).innerHTML;
    numberlist = numberlist.replace(/\D/g, ""); //remove all but numbers
    if (IsCellLockedID(cellID) == 1) {
      //unlock this square
      document.getElementById(cellID).innerHTML = numberlist;
      document.getElementById(cellID).className = "cellnotselectedclass";
      LastCursorClass = document.getElementById(cellID).className;
      document.getElementById(cellID).className = "cellselectedclass";
      send_cell_update(document.getElementById(cellID).innerHTML);
    } else {
      //lock the square
      if (numberlist.length == 1) {
        //lock this square
        document.getElementById(cellID).innerHTML =
          numberlist + "<!--locked-->";
        document.getElementById(cellID).className = "celllockedclass";
        LastCursorClass = document.getElementById(cellID).className;
        document.getElementById(cellID).className = "cellgrayclass";
        send_cell_update(document.getElementById(cellID).innerHTML);
        //if (blanksquares == CountCorrectLocked(count)) { //did we win?
        if (Did_We_Win()) {
          //did we win?
          IWin();
        }
      } else {
        window.alert("You can only lock squares with one number");
      }
    }
  }

  if (keyCode >= 1 && keyCode <= 9 && IsCellLockedID(cellID) != 1) {
    //number keys pressed 1 - 9
    let numberlist = document.getElementById(cellID).innerHTML;
    numberlist = numberlist.replace(/\D/g, ""); //remove all but numbers
    let keychar = keyCode;
    let founditindex = numberlist.indexOf(keychar, 0);
    if (founditindex > -1) {
      //remove number from string
      let re = new RegExp(keychar, "g");
      numberlist = numberlist.replace(re, "");
    } else {
      numberlist = numberlist + keychar;
    }
    //sort our number list for display
    let t = numberlist.split("");
    t = t.sort();
    let t1 = t.slice(0, 3);
    let t2 = t.slice(3, 6);
    let t3 = t.slice(6, 9);
    numberlist = t1.join("") + "<br>" + t2.join("") + "<br>" + t3.join("");
    document.getElementById(cellID).innerHTML = numberlist; //put numbers back on board
    send_cell_update(document.getElementById(cellID).innerHTML);
  }
  Save_Sudoku(); //after each keystroke
}

function CountCorrectLocked(mode) {
  let CorrectCount = 0;
  for (let x = 0; x <= 8; x++) {
    for (let y = 0; y <= 8; y++) {
      let CellID = "cell_" + x + "_" + y;
      let SolutionID = "solution_" + x + "_" + y;
      if (IsCellLockedID(CellID) == 1) {
        let cellresult = document.getElementById(CellID).innerHTML;
        cellresult = cellresult.replace(/\D/g, "");
        let solutionresult = document.getElementById(SolutionID).innerHTML;
        solutionresult = solutionresult.replace(/\D/g, "");
        if (cellresult == solutionresult) {
          CorrectCount++;
        } else {
          if (mode == "reveal") {
            document.getElementById(CellID).className = "cellredclass";
          }
        }
      }
    }
  }
  return CorrectCount;
}

function CountLocked() {
  let LockedCount = 0;
  for (let x = 0; x <= 8; x++) {
    for (let y = 0; y <= 8; y++) {
      let CellID = "cell_" + x + "_" + y;
      if (IsCellLockedID(CellID) == 1) {
        LockedCount++;
      }
    }
  }
  return LockedCount;
}

function send_cell_update(k) {
  let letter = k;
  setCookie(LastCursorID, letter, forever, "", "", ""); //LastCursorID = cell_x_y
}

function Did_We_Win() {
  for (let x = 0; x <= 8; x++) {
    for (let y = 0; y <= 8; y++) {
      let CellID = "cell_" + x + "_" + y;
      let solutionID = "solution_" + x + "_" + y;
      let cell = document.getElementById(CellID).innerHTML;
      cell = cell.replace(/\D/g, ""); //remove all but numbers
      let solution = document.getElementById(solutionID).innerHTML;
      if (!(IsCellStaticID(CellID) || IsCellLockedID(CellID))) {
        //check if we claim we are done
        return false;
      }
      if (cell != solution) {
        //if one is wrong
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
  let CellID = "cell_" + x + "_" + y;
  let red = Math.floor(Math.random() * 255);
  let green = Math.floor(Math.random() * 255);
  let blue = Math.floor(Math.random() * 255);
  if (wincount < 100 / 2) {
    document.getElementById(CellID).style.backgroundColor =
      "rgb(" + red + "," + green + "," + blue + ")";
  } else {
    document.getElementById(CellID).style.backgroundColor = "";
  }
  wincount++;
  if (wincount < maxwincount / 2) {
    window.requestAnimationFrame(IWin);
  } else {
    wincount = 0;
    Win_Done();
  }
}

function Win_Done() {
  for (let x = 0; x <= 8; x++) {
    for (let y = 0; y <= 8; y++) {
      let CellID = "cell_" + x + "_" + y;
      document.getElementById(CellID).style.backgroundColor = "";
    }
  }
  alert("You Win!");
}

function SimulateKey(key_pushed) {
  const kbEvent = new KeyboardEvent("keydown", {
    bubbles: true,
    cancelable: true,
    key: key_pushed
  });
  document.body.dispatchEvent(kbEvent);
}
//SimulateKey(); //just to get rid of false not used error

function Howtoplay() {
  $("#dialog-message").dialog("open");
  $("#dialog-message").dialog("option", "width", 800);
}

function Statistics() {
  $("#Statistics").dialog("open");
  $("#Statistics").dialog("option", "width", 800);
}

function SolutionsDialog() {
  $("#SolutionDialog").dialog("open");
  $("#SolutionDialog").dialog("option", "width", 800);
}

function ClearUnlockedCells() {
  if (
    !confirm(
      "Clear Unlocked. Are you sure? This will clear the board of all numbers that are not locked."
    )
  ) {
    return false;
  }

  for (var x = 0; x <= 8; x++) {
    for (var y = 0; y <= 8; y++) {
      var cellID = "cell_" + x + "_" + y;
      //document.getElementById(CellID).style.backgroundColor = '';
      if (IsAnEditCellID(cellID) == 1) {
        document.getElementById(cellID).innerHTML = "";
      }
    }
  }
  Save_Sudoku();
}

function ResetSudoku() {
  if (
    !confirm(
      "Restart Puzzle? Are you sure? This will clear the board of ALL numbers."
    )
  ) {
    return false;
  }

  for (var x = 0; x <= 8; x++) {
    for (var y = 0; y <= 8; y++) {
      var cellID = "cell_" + x + "_" + y;
      if (IsCellStaticID(cellID) != 1) {
        document.getElementById(cellID).innerHTML = "";
      }
    }
  }
  Save_Sudoku();
}

//COOKIE CODE starts

var Cookie = {};
Cookie.day = 86400000;
Cookie.week = Cookie.day * 7;
Cookie.month = Cookie.day * 31;
Cookie.year = Cookie.day * 365;

function getCookie(name) {
  var cookies = document.cookie;
  var start = cookies.indexOf(name + "=");
  if (start == -1) return null;
  var len = start + name.length + 1;
  var end = cookies.indexOf(";", len);
  if (end == -1) end = cookies.length;
  //return unescape(cookies.substring(len,end));
  return decodeURIComponent(cookies.substring(len, end));
}

function setCookie(name, value, expires, path, domain, secure) {
  value = encodeURIComponent(value);
  //value = escape(value);
  expires = expires ? ";expires=" + expires.toGMTString() : "";
  path = path ? ";path=" + path : "";
  domain = domain ? ";domain=" + domain : "";
  secure = secure ? ";secure" : "";

  document.cookie = name + "=" + value + expires + path + domain + secure;
}

function deleteCookie(name, path, domain) {
  var expires = ";expires=Thu, 01-Jan-70 00:00:01 GMT";
  if (path) {
    path = ";path=" + path;
  } else {
    path = "";
  }
  if (domain) {
    domain = ";domain=" + domain;
  } else {
    domain = "";
  }
  //(path)    ? ';path='    + path                  : '';
  //(domain)  ? ';domain='  + domain                : '';
  if (getCookie(name)) document.cookie = name + "=" + expires + path + domain;
}

function listCookies() {
  var theCookies = document.cookie.split(";");
  var anArray = [];
  for (var i = 0; i < theCookies.length; i++) {
    theCookie = theCookies[i].split("=");
    anArray[i] = theCookie[0].trim();
  }
  return anArray;
}

function DeleteCookies() {
  var theCookies = document.cookie.split(";");
  for (var i = 0; i < theCookies.length; i++) {
    var mycookie = theCookies[i].split("=");
    var cookiename = mycookie[0];
    cookiename = cookiename.trim();
    deleteCookie(cookiename);
  }
}

//COOKIE CODE ends

//code found author unknown
//called ncross.js

var dec2bit = [];
var bit2dec = [];
for (let d = 1, b = 1; d <= 9; d++, b <<= 1) {
  dec2bit[d] = b;
  bit2dec[b] = d;
}

var mainmap = [];
var nonflag = [];
var prevmap = "";
var cnt1, cnt2, cnt3, cnt4, cnt6, cnt7, cnt8;

function start_cross(f) {
  read_table(f);

  var curmap = "";
  for (var y = 1; y <= 9; y++) {
    for (var x = 1; x <= 9; x++) {
      curmap += mainmap[y][x] || "-";
    }
  }
  prevmap = curmap;

  var qq = init_flag();
  for (var i = 0; i < 10 && qq < 81; i++) {
    cnt1 = rule_shoukyo_hou();
    cnt2 = rule_line_kakutei();
    cnt3 = rule_box_kakutei();
    qq += cnt1 + cnt2 + cnt3;
    if (cnt1 + cnt2 + cnt3) continue;
    if (qq == 81) break;
    cnt4 = rule_lineX_alter() + rule_lineY_alter();
    cnt6 = rule_box_alter();
    cnt7 = rule_box_3ren() + rule_3renY_line() + rule_3renX_line();
    cnt8 = rule_lineY_resv() + rule_lineX_resv();
    if (cnt4 + cnt6 + cnt7 + cnt8) continue;
    break;
  }
  display("result_here");
}

function rule_3renY_line() {
  let cnt = 0;
  for (var y3 = 1; y3 <= 9; y3 += 3) {
    for (var yy = y3; yy < y3 + 3; yy++) {
      var dd = 0;
      var chkx = [];
      for (var x3 = 1; x3 <= 9; x3 += 3) {
        var bx = dec2bit[x3];
        for (var xx = x3; xx < x3 + 3; xx++) {
          if (mainmap[yy][xx]) continue;
          var bit = nonflag[yy][xx];
          for (var nn = 1; nn <= 9; nn++) {
            if ((bit & 1) == 0) {
              if (!chkx[nn]) {
                chkx[nn] = bx;
              } else {
                chkx[nn] |= bx;
              }
            }
            bit >>= 1;
          }
          dd++;
        }
      }
      if (dd < 1) continue;
      for (let nn = 1; nn < 9; nn++) {
        if (!chkx[nn]) continue;
        let x3 = bit2dec[chkx[nn]];
        if (!x3) continue;
        let bit = dec2bit[nn];
        for (var y2 = y3; y2 < y3 + 3; y2++) {
          if (y2 == yy) continue;
          for (let xx = x3; xx < x3 + 3; xx++) {
            var oo = nonflag[y2][xx];
            nonflag[y2][xx] |= bit;
            if (oo != nonflag[y2][xx]) cnt++;
          }
        }
      }
    }
  }
  return cnt;
}

function rule_3renX_line() {
  var cnt = 0;
  for (var x3 = 1; x3 <= 9; x3 += 3) {
    for (var xx = x3; xx < x3 + 3; xx++) {
      var dd = 0;
      var chky = [];
      for (var y3 = 1; y3 <= 9; y3 += 3) {
        var by = dec2bit[y3];
        for (var yy = y3; yy < y3 + 3; yy++) {
          if (mainmap[yy][xx]) continue;
          var bit = nonflag[yy][xx];
          for (var nn = 1; nn <= 9; nn++) {
            if ((bit & 1) == 0) {
              if (!chky[nn]) {
                chky[nn] = by;
              } else {
                chky[nn] |= by;
              }
            }
            bit >>= 1;
          }
          dd++;
        }
      }
      if (dd < 1) continue;
      for (let nn = 1; nn < 9; nn++) {
        if (!chky[nn]) continue;
        let y3 = bit2dec[chky[nn]];
        if (!y3) continue;
        let bit = dec2bit[nn];
        for (let x2 = x3; x2 < x3 + 3; x2++) {
          if (x2 == xx) continue;
          for (let yy = y3; yy < y3 + 3; yy++) {
            var oo = nonflag[yy][x2];
            nonflag[yy][x2] |= bit;
            if (oo != nonflag[yy][x2]) cnt++;
          }
        }
      }
    }
  }
  return cnt;
}

function rule_lineX_resv() {
  var cnt = 0;
  for (var xx = 1; xx <= 9; xx++) {
    for (var yy = 1; yy < 9; yy++) {
      if (mainmap[yy][xx]) continue;
      var bit = nonflag[yy][xx];
      var xorb = 511 ^ bit;
      var nob = numofbits(xorb);
      if (nob != 2) continue;
      for (var y1 = yy + 1; y1 <= 9; y1++) {
        if (bit != nonflag[y1][xx]) continue;
        for (var y2 = 1; y2 <= 9; y2++) {
          if (yy == y2 || y1 == y2) continue;
          var oo = nonflag[y2][xx];
          nonflag[y2][xx] |= xorb;
          if (oo != nonflag[y2][xx]) cnt++;
        }
      }
    }
  }
  return cnt;
}

function rule_lineY_resv() {
  var cnt = 0;
  for (var yy = 1; yy <= 9; yy++) {
    for (var xx = 1; xx < 9; xx++) {
      if (mainmap[yy][xx]) continue;
      var bit = nonflag[yy][xx];
      var xorb = 511 ^ bit;
      var nob = numofbits(xorb);
      if (nob != 2) continue;
      for (var x1 = xx + 1; x1 <= 9; x1++) {
        if (bit != nonflag[yy][x1]) continue;
        for (var x2 = 1; x2 <= 9; x2++) {
          if (xx == x2 || x1 == x2) continue;
          var oo = nonflag[yy][x2];
          nonflag[yy][x2] |= xorb;
          if (oo != nonflag[yy][x2]) cnt++;
        }
      }
    }
  }
  return cnt;
}

function check_array(array, bit, zz) {
  for (var nn = 1; nn <= 9; nn++) {
    if ((bit & 1) == 0) {
      if (array[nn]) {
        array[nn].push(zz);
      } else {
        array[nn] = [zz];
      }
    }
    bit >>= 1;
  }
}

function rule_box_3ren() {
  var cnt = 0;
  for (var y3 = 1; y3 <= 9; y3 += 3) {
    for (var x3 = 1; x3 <= 9; x3 += 3) {
      var dd = 0;
      var chkx = [];
      var chky = [];
      for (var yy = y3; yy < y3 + 3; yy++) {
        var by = dec2bit[yy];
        for (var xx = x3; xx < x3 + 3; xx++) {
          if (mainmap[yy][xx]) continue;
          var bx = dec2bit[xx];
          var bit = nonflag[yy][xx];
          for (var nn = 1; nn <= 9; nn++) {
            if ((bit & 1) == 0) {
              if (!chkx[nn]) {
                chkx[nn] = bx;
              } else {
                chkx[nn] |= bx;
              }
              if (!chky[nn]) {
                chky[nn] = by;
              } else {
                chky[nn] |= by;
              }
            }
            bit >>= 1;
          }
          dd++;
        }
      }
      if (dd < 1) continue;
      for (let nn = 1; nn < 9; nn++) {
        if (!chkx[nn]) continue;
        let xx = bit2dec[chkx[nn]];
        if (!xx) continue;
        let bit = dec2bit[nn];
        for (let yy = 1; yy <= 9; yy++) {
          if (y3 <= yy && yy < y3 + 3) continue;
          var oo = nonflag[yy][xx];
          nonflag[yy][xx] |= bit;
          if (oo != nonflag[yy][xx]) cnt++;
        }
      }
      for (let nn = 1; nn < 9; nn++) {
        if (!chky[nn]) continue;
        let yy = bit2dec[chky[nn]];
        if (!yy) continue;
        let bit = dec2bit[nn];
        for (let xx = 1; xx <= 9; xx++) {
          if (x3 <= xx && xx < x3 + 3) continue;
          let oo = nonflag[yy][xx];
          nonflag[yy][xx] |= bit;
          if (oo != nonflag[yy][xx]) cnt++;
        }
      }
    }
  }
  return cnt;
}

function rule_box_alter() {
  var cnt = 0;
  for (var y3 = 1; y3 <= 9; y3 += 3) {
    for (var x3 = 1; x3 <= 9; x3 += 3) {
      var chk = [];
      var dd = 0;
      var zz = 0;
      for (var yy = y3; yy < y3 + 3; yy++) {
        for (var xx = x3; xx < x3 + 3; xx++, zz++) {
          if (mainmap[yy][xx]) continue;
          check_array(chk, nonflag[yy][xx], zz);
          dd++;
        }
      }
      if (dd < 1) continue;
      for (var n1 = 1; n1 < 9; n1++) {
        if (!chk[n1]) continue;
        if (chk[n1].length != 2) continue;
        for (var n2 = n1 + 1; n2 <= 9; n2++) {
          if (!chk[n2]) continue;
          if (chk[n2].length != 2) continue;
          if (chk[n1][0] == chk[n2][0] && chk[n1][1] == chk[n2][1]) {
            var z1 = chk[n1][0];
            var z2 = chk[n1][1];
            var bit = dec2bit[n1] | dec2bit[n2];

            let zz = 0;
            for (let yy = y3; yy < y3 + 3; yy++) {
              for (let xx = x3; xx < x3 + 3; xx++, zz++) {
                var oo = nonflag[yy][xx];
                if (zz == z1 || zz == z2) {
                  nonflag[yy][xx] = bit ^ 511;
                } else {
                  nonflag[yy][xx] |= bit;
                }
                if (oo != nonflag[yy][xx]) cnt++;
              }
            }
          }
        }
      }
    }
  }
  return cnt;
}

function rule_lineY_alter() {
  var cnt = 0;

  for (var yy = 1; yy <= 9; yy++) {
    var chk = [];
    var dd = 0;
    for (var xx = 1; xx <= 9; xx++) {
      if (mainmap[yy][xx]) continue;
      check_array(chk, nonflag[yy][xx], xx);
      dd++;
    }
    if (dd < 1) continue;
    for (var n1 = 1; n1 < 9; n1++) {
      if (!chk[n1]) continue;
      if (chk[n1].length != 2) continue;
      for (var n2 = n1 + 1; n2 <= 9; n2++) {
        if (!chk[n2]) continue;
        if (chk[n2].length != 2) continue;
        if (chk[n1][0] == chk[n2][0] && chk[n1][1] == chk[n2][1]) {
          var x1 = chk[n1][0];
          var x2 = chk[n1][1];
          var bit = dec2bit[n1] | dec2bit[n2];
          for (let xx = 1; xx <= 9; xx++) {
            var oo = nonflag[yy][xx];
            if (xx == x1 || xx == x2) {
              nonflag[yy][xx] = bit ^ 511;
            } else {
              nonflag[yy][xx] |= bit;
            }
            if (oo != nonflag[yy][xx]) cnt++;
          }

          var z1 = x1 - ((x1 - 1) % 3);
          var z2 = x2 - ((x2 - 1) % 3);
          if (z1 == z2) {
            var z3 = yy - ((yy - 1) % 3);
            for (var zy = z3; zy < z3 + 3; zy++) {
              if (zy == yy) continue;
              for (var zx = z1; zx < z1 + 3; zx++) {
                let oo = nonflag[zy][zx];
                nonflag[zy][zx] |= bit;
                if (oo != nonflag[zy][zx]) cnt++;
              }
            }
          }
        }
      }
    }
  }
  return cnt;
}

function rule_lineX_alter() {
  var cnt = 0;

  for (var xx = 1; xx <= 9; xx++) {
    var chk = [];
    var dd = 0;
    for (var yy = 1; yy <= 9; yy++) {
      if (mainmap[yy][xx]) continue;
      check_array(chk, nonflag[yy][xx], yy);
      dd++;
    }
    if (dd < 1) continue;
    for (var n1 = 1; n1 < 9; n1++) {
      if (!chk[n1]) continue;
      if (chk[n1].length != 2) continue;
      for (var n2 = n1 + 1; n2 <= 9; n2++) {
        if (!chk[n2]) continue;
        if (chk[n2].length != 2) continue;
        if (chk[n1][0] == chk[n2][0] && chk[n1][1] == chk[n2][1]) {
          var y1 = chk[n1][0];
          var y2 = chk[n1][1];
          var bit = dec2bit[n1] | dec2bit[n2];
          for (let yy = 1; yy <= 9; yy++) {
            var oo = nonflag[yy][xx];
            if (yy == y1 || yy == y2) {
              nonflag[yy][xx] = bit ^ 511;
            } else {
              nonflag[yy][xx] |= bit;
            }
            if (oo != nonflag[yy][xx]) cnt++;
          }

          var z1 = y1 - ((y1 - 1) % 3);
          var z2 = y2 - ((y2 - 1) % 3);
          if (z1 == z2) {
            var z3 = xx - ((xx - 1) % 3);
            for (var zx = z3; zx < z3 + 3; zx++) {
              if (zx == xx) continue;
              for (var zy = z1; zy < z1 + 3; zy++) {
                let oo = nonflag[zy][zx];
                nonflag[zy][zx] |= bit;
                if (oo != nonflag[zy][zx]) cnt++;
              }
            }
          }
        }
      }
    }
  }
  return cnt;
}

function put_flag(yy, xx, dec) {
  var bit = dec2bit[dec];
  nonflag[yy][xx] = 511;
  for (var y1 = 1; y1 <= 9; y1++) {
    nonflag[y1][xx] |= bit;
  }
  for (var x1 = 1; x1 <= 9; x1++) {
    nonflag[yy][x1] |= bit;
  }
  var x2 = xx - 1;
  x2 -= x2 % 3;
  var y2 = yy - 1;
  y2 -= y2 % 3;
  for (var y3 = 1; y3 <= 3; y3++) {
    for (var x3 = 1; x3 <= 3; x3++) {
      nonflag[y2 + y3][x2 + x3] |= bit;
    }
  }
}

function read_table(mmaapp) {
  mainmap = [];
  for (var i = 1; i <= 9; i++) {
    mainmap[i] = [];
  }
  for (let i = 0, xy = 0; i < mmaapp.length && xy < 81; i++) {
    var chr = mmaapp.charAt(i);
    if (chr == "-" || chr == "0" || (0 < chr - 0 && (chr - 0) << 9)) {
      //ignore everything but 0-9 and -
      var xx = (xy % 9) + 1;
      var yy = Math.floor(xy / 9) + 1;
      mainmap[yy][xx] = chr == "-" ? null : chr - 0; //map of 1-9 or null
      xy++;
    }
  }
  //display("result_here");
}

function init_flag() {
  nonflag = [];
  var cnt = 0;
  for (var i = 1; i <= 9; i++) {
    nonflag[i] = [, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  }
  for (var yy = 1; yy <= 9; yy++) {
    for (var xx = 1; xx <= 9; xx++) {
      var dec = mainmap[yy][xx];
      if (!dec) continue;
      put_flag(yy, xx, dec);
      cnt++;
    }
  }
  return cnt;
}

function rule_shoukyo_hou() {
  var cnt = 0;
  for (var yy = 1; yy <= 9; yy++) {
    for (var xx = 1; xx <= 9; xx++) {
      if (mainmap[yy][xx]) continue;
      var nonbit = nonflag[yy][xx];
      for (var nn = 1; nn <= 9; nn++) {
        if ((nonbit ^ dec2bit[nn]) == 511) {
          mainmap[yy][xx] = nn;
          put_flag(yy, xx, nn);
          cnt++;
          break;
        }
      }
    }
  }
  return cnt;
}

function rule_line_kakutei() {
  var cnt = 0;

  for (var yy = 1; yy <= 9; yy++) {
    for (var xx = 1; xx <= 9; xx++) {
      if (mainmap[yy][xx]) continue;
      var yandbit = 511;
      for (var y1 = 1; y1 <= 9; y1++) {
        var nonbit = nonflag[y1][xx];
        if (y1 == yy) nonbit ^= 511;
        yandbit &= nonbit;
      }
      var xandbit = 511;
      for (var x1 = 1; x1 <= 9; x1++) {
        let nonbit = nonflag[yy][x1];
        if (x1 == xx) nonbit ^= 511;
        xandbit &= nonbit;
      }
      var xybit = xandbit | yandbit;
      if (!xybit) continue;
      //              mess( "["+yy+"]["+xx+"] xandbit="+ xandbit+" yandbit="+ yandbit );
      for (var nn = 1; nn <= 9; nn++) {
        if (xybit & dec2bit[nn]) {
          mainmap[yy][xx] = nn;
          put_flag(yy, xx, nn);
          cnt++;
          break;
        }
      }
    }
  }
  return cnt;
}

function rule_box_kakutei() {
  var cnt = 0;
  for (var y3 = 1; y3 <= 9; y3 += 3) {
    for (var x3 = 1; x3 <= 9; x3 += 3) {
      for (var y1 = y3; y1 < y3 + 3; y1++) {
        for (var x1 = x3; x1 < x3 + 3; x1++) {
          if (mainmap[y1][x1]) continue;
          var boxbit = 511;
          for (var y2 = y3; y2 < y3 + 3; y2++) {
            for (var x2 = x3; x2 < x3 + 3; x2++) {
              var nonbit = nonflag[y2][x2];
              if (y1 == y2 && x1 == x2) nonbit ^= 511;
              boxbit &= nonbit;
            }
          }
          if (!boxbit) continue;
          //                      mess( "["+y1+"]["+x1+"] boxbit="+ boxbit );
          for (var nn = 1; nn <= 9; nn++) {
            if (boxbit & dec2bit[nn]) {
              mainmap[y1][x1] = nn;
              put_flag(y1, x1, nn);
              cnt++;
              break;
            }
          }
        }
      }
    }
  }
  return cnt;
}

function numofbits(bits) {
  // http://www.nminoru.jp/~nminoru/programming/bitcount.html
  bits = (bits & 0x5555) + ((bits >> 1) & 0x5555); // 0101010101010101
  bits = (bits & 0x3333) + ((bits >> 2) & 0x3333); // 0011001100110011
  bits = (bits & 0x0f0f) + ((bits >> 4) & 0x0f0f); // 0000111100001111
  return (bits & 0x00ff) + ((bits >> 8) & 0x00ff); // 0000000011111111
}

function display(id) {
  var tabletag = document.createElement("table");
  var tbodytag = document.createElement("tbody");
  for (let y = 1; y <= 9; y++) {
    let trtag = document.createElement("tr");
    for (let x = 1; x <= 9; x++) {
      let tdtag = document.createElement("td");
      let val = mainmap[y][x];
      if (!val) {
        if (nonflag && nonflag[y]) {
          val = "";
          for (let nn = 1; nn <= 9; nn++) {
            if (nonflag[y][x] & dec2bit[nn]) continue;
            val += nn;
            if (val.length == 3 || val.length == 7) val += " ";
          }
          if (val == "") {
            val = " "; // error
            tdtag.className += " error";
          }
        } else {
          val = "-"; // at first
        }
        tdtag.className += " null";
      }
      let tnode = document.createTextNode(val);
      tdtag.appendChild(tnode);
      if (x == 3 || x == 6) tdtag.className += " right";
      if (y == 3 || y == 6) tdtag.className += " bottom";
      trtag.appendChild(tdtag);
    }
    tbodytag.appendChild(trtag);
  }
  tabletag.appendChild(tbodytag);

  //vinman start
  let ptag = document.createElement("div");
  ptag.innerHTML =
    cnt1 +
    " " +
    cnt2 +
    " " +
    cnt3 +
    " " +
    cnt4 +
    " " +
    cnt6 +
    " " +
    cnt7 +
    " " +
    cnt8;

  tabletag.appendChild(ptag);

  var divtag = document.getElementById(id);
  if (divtag.firstChild) {
    divtag.replaceChild(tabletag, divtag.firstChild);
  } else {
    divtag.appendChild(tabletag);
  }
  //vinman end
}

function Difficulty() {
  let value = document.getElementById("difficulty").value;
  if (value == 1) {
    document.getElementById("NS").checked = true;
    document.getElementById("HS").checked = false;
    document.getElementById("NP").checked = false;
    document.getElementById("HP").checked = false;
    document.getElementById("IR").checked = false;
    document.getElementById("XW").checked = false;
    document.getElementById("YW").checked = false;
  }
  if (value == 2) {
    document.getElementById("NS").checked = true;
    document.getElementById("HS").checked = true;
    document.getElementById("NP").checked = false;
    document.getElementById("HP").checked = false;
    document.getElementById("IR").checked = false;
    document.getElementById("XW").checked = false;
    document.getElementById("YW").checked = false;
  }
  if (value == 3) {
    document.getElementById("NS").checked = true;
    document.getElementById("HS").checked = true;
    document.getElementById("NP").checked = true;
    document.getElementById("HP").checked = false;
    document.getElementById("IR").checked = false;
    document.getElementById("XW").checked = false;
    document.getElementById("YW").checked = false;
  }
  if (value == 4) {
    document.getElementById("NS").checked = true;
    document.getElementById("HS").checked = true;
    document.getElementById("NP").checked = true;
    document.getElementById("HP").checked = true;
    document.getElementById("IR").checked = false;
    document.getElementById("XW").checked = false;
    document.getElementById("YW").checked = false;
  }
  if (value == 5) {
    document.getElementById("NS").checked = true;
    document.getElementById("HS").checked = true;
    document.getElementById("NP").checked = true;
    document.getElementById("HP").checked = true;
    document.getElementById("IR").checked = true;
    document.getElementById("XW").checked = false;
    document.getElementById("YW").checked = false;
  }
  if (value == 6) {
    document.getElementById("NS").checked = true;
    document.getElementById("HS").checked = true;
    document.getElementById("NP").checked = true;
    document.getElementById("HP").checked = true;
    document.getElementById("IR").checked = true;
    document.getElementById("XW").checked = true;
    document.getElementById("YW").checked = false;
  }
  if (value == 7) {
    document.getElementById("NS").checked = true;
    document.getElementById("HS").checked = true;
    document.getElementById("NP").checked = true;
    document.getElementById("HP").checked = true;
    document.getElementById("IR").checked = true;
    document.getElementById("XW").checked = true;
    document.getElementById("YW").checked = true;
  }
}
