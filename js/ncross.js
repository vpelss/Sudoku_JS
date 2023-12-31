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
var cnt1 , cnt2 , cnt3 , cnt4 , cnt6 , cnt7 , cnt8;

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
		if (chr == "-" || chr == "0" || (0 < (chr - 0) && (chr - 0) << 9)) { //ignore everything but 0-9 and -
			var xx = (xy % 9) + 1;
			var yy = Math.floor(xy / 9) + 1;
			mainmap[yy][xx] = (chr == "-") ? null : chr - 0; //map of 1-9 or null
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
	bits = (bits & 0x5555) + (bits >> 1 & 0x5555); // 0101010101010101
	bits = (bits & 0x3333) + (bits >> 2 & 0x3333); // 0011001100110011
	bits = (bits & 0x0f0f) + (bits >> 4 & 0x0f0f); // 0000111100001111
	return (bits & 0x00ff) + (bits >> 8 & 0x00ff); // 0000000011111111
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
	ptag.innerHTML = cnt1 + " " + cnt2 + " " + cnt3 + " " + cnt4 + " " + cnt6 + " " + cnt7 + " " + cnt8;

	tabletag.appendChild(ptag);

	var divtag = document.getElementById(id);
	if (divtag.firstChild) {
		divtag.replaceChild(tabletag, divtag.firstChild);
	} else {
		divtag.appendChild(tabletag);
	}
	//vinman end
}