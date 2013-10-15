/**
 * Tibcalc.js: Tibetan-Gregorian date converter
 * This file depends on jquery and jquery-ui
 *
 * Original Java implementation by Christian Steinert
 *
 * Ported to JavaScript from Java by David Pokorny
 */

/**
 * Cast a number to integer
 */
function tc_cast_to_int(x) {
	return x | 0;
}

/**
 * A simple data class that represents the pair of a Tibetan date together with
 * its corresponding Western date
 *
 * @param tibDate
 *            a Tibetan date
 * @param westernDate
 *            the corresponding Western date
 */
function make_date_pair(tibDate, westernDate) {
	var result = {};
	result.tibDate = tibDate;
	result.westernDate = westernDate;
	return result;
}

/**
 * Tibetan Date object
 * 
 * @param rabjung
 *            number of the Tibetan 60-year-cycle
 * @param tibYear
 *            number of the year within the rabjung (1..60)
 * @param tibMonth
 *            number of the Tibetan month (1..12)
 * @param monthFlag
 *            0: normal month, 1: first month of a double month, 2:
 *            second month of a double month
 * @param tibDay
 *            number of the day within the Tibetan month (1..30)
 * isSkippedDay
 *            if "true" then this day was skipped and therefore it
 *            has no corresponding western Date
 * doubleDayFlag
 *            type of day - 0: normal day; 1: first day of a double
 *            day; 2: second day of a double day
 * 
 */
function make_tibdate(rabjung, tibYear, tibMonth, monthFlag, tibDay) {
	var result = {};
	result.rabjung = rabjung;
	result.tibYear = tibYear;
	result.tibMonth = tibMonth;
	result.monthFlag = monthFlag;
	result.tibDay = tibDay;

	result.isSkippedDay = false;
	result.doubleDayFlag = 0;
	return result;
}

/**
 * tibdate_equal: return true if td1 is the same Tibetan date as td2
 */
function tibdate_equal(td1, td2) {
	return (
		td1.rabjung == td2.rabjung &&
		td1.tibYear == td2.tibYear &&
		td1.tibMonth == td2.tibMonth &&
		td1.monthFlag == td2.monthFlag &&
		td1.tibDay == td2.tibDay &&
		td1.isSkippedDay == td2.isSkippedDay &&
		td1.doubleDayFlag == td2.doubleDayFlag);
}

/**
 * Calculate the hash value of a Tibetan Date object
 *
 * (This function is not used in the JavaScript version, but it
 * appeared in the original Java implementation.)
 */
function tibdate_hash(x) {
	var prime = 31;
	var result = 1;
	result = prime * result + x.monthFlag;
	result = prime * result + x.rabjung;
	result = prime * result + x.tibDay;
	result = prime * result + x.tibMonth;
	result = prime * result + x.tibYear;
	return result;
}

/**
 * tibdate_string: convert a Tibetan date object to a string
 */
function tibdate_string(x) {
	return ("TibDate [rabjung=" + x.rabjung + ", tibYear=" + x.tibYear
				+ ", tibMonth=" + x.tibMonth + ", monthFlag="
				+ x.monthFlag + ", tibDay=" + x.tibDay
				+ ", isSkippedDay=" + x.isSkippedDay + ", doubleDayFlag="
				+ x.doubleDayFlag + "]");
}

/**
 * Tibetan month info object
 *
 * Prefix: tmi_
 *
 * rabjung - number of the 60-year cycle
 * tibYear - number of the year within the 60-year cycle (1..60)
 * tibMonth - number of the month (1..12)
 * monthFlag - type of Tibetan month - 0: normal month; 1: first
 *     month of a double month; 2: second month of a double month
 * zladag - total global number of this month
 * skip1 - number of the first skipped day during this month (or "0"
 *     if no day is skipped)
 * skip2 - number of the second skipped day during this month (or
 *     "0" if no 2nd day is skipped)
 * double1 - number of the first doubled day during this month (or
 *     "0" if no day is doubled)
 * double2 - number of the second doubled day during this month (or
 *     "0" if no 2nd day is doubled)
 * westernDate - the corresponding date for the first day of this
 *     Tibetan month
 */
function make_tibetan_month_info(rabjung, tibYear, tibMonth, zladag,
		monthFlag, skip1, skip2, double1, double2, westernDate) {
	var result = {};
	result.rabjung = rabjung;
	result.tibYear = tibYear;
	result.tibMonth = tibMonth;
	result.zladag = zladag;
	result.monthFlag = monthFlag;
	result.skip1 = skip1;
	result.skip2 = skip2;
	result.double1 = double1;
	result.double2 = double2;
	result.westernDate = westernDate;
	return result;
}

/**
 * tmi_to_string: convert a Tibetan month info record to a string
 */
function tmi_to_string(tmi) {
	var date;
	if (tmi.westernDate) {
		date = $.datepicker.formatDate("dd/mm/yy", tmi.westernDate);
	} else {
		date = "";
	}
	return (tmi.rabjung + "\t" + tmi.tibYear + "\t" + tmi.tibMonth +
		"\t" + tmi.monthFlag + "\t" + tmi.zladag + "\t" + tmi.skip1 +
		"\t" + tmi.skip2 + "\t" + tmi.double1 + "\t" + tmi.double2 +
		"\t" + date + "\n");
}

/**
 * make_attr_string: return attribute string for an HTML element tag
 *
 * attrs - array of objects
 *     Each object in the array should have a .name and .value
 *     that determine the attributes
 */
function make_attr_string(attrs) {
	var result = "";
	for (var i = 0; i < attrs.length; i += 1) {
		if (i > 0) {
			result += " ";
		}
		result += attrs[i].name;
		result += "=\"";
		result += attrs[i].value;
		result += "\"";
	}
	return result;
}

/**
 * make_select: return HTML for a select element
 *
 * id - string
 *     The ID of the select element
 *
 * options - array of objects
 *     Each object in the array should have a .text and .value
 *     that determine the options in the select menu
 *
 * config - dict with extra information
 *     'onchange' - set onchange handler
 */
function make_select(id, options, config) {
	var option_elts = "";
	for (var i = 0; i < options.length; i += 1) {
		var option = options[i];
		option_elts += "<option value=\"" + option.value + "\">" + option.text + "</option>";
	}
	var attrs = [{name: "id", value: id}];
	if (config) {
		if (config.onchange) {
			attrs.push({name: "onchange", value: config.onchange});
		}
	}
	var result = "<select " + make_attr_string(attrs) + ">";
	result += option_elts;
	result += "</select>";
	return result;
}

/**
 * make_div: return HTML for a div element
 *
 * id - string
 *     The ID of the div element or "" if no ID
 *
 * elts - HTML string OR array of HTML strings
 *     The child element(s) of the div
 */
function make_div(id, elts) {
	var result;
	if (id) {
		result = "<div id=\"" + id + "\">";
	} else {
		result = "<div>";
	}
	if (elts) {
		if (elts instanceof Array) {
			for (var i = 0; i < elts.length; i += 1) {
				result += elts[i];
			}
		} else {
			result += elts;
		}
	}
	result += "</div>";
	return result;
}

/**
 * make_span: return HTML for a span element
 */
function make_span(text) {
	return "<span>" + text + "</span>";
}

/**
 * rabjung_select: return HTML for rabjung select element
 */
function rabjung_select() {
	var options = [];
	var option = {};
	option.text = textpool_get_text("select_all_rabjungs");
	option.value = "ALL";
	options.push(option);
	var i = 1;
	for (i = 1; i < 21; i += 1) {
		option = {};
		option.text = i;
		option.value = i;
		options.push(option);
	}
	var config = {};
	config.onchange = "update_td_to_gd_readout()";
	return make_select("rabjung_select", options, config);
}

/**
 * tibyear_select: return HTML for Tibetan year select element
 */
function tibyear_select() {
	var options = [];
	var year_text_array = textpool_get_text("tibetan_year_names");
	for (var i = 0; i < year_text_array.length; i += 1) {
		var option = {};
		option.text = year_text_array[i];
		option.value = i + 1;
		options.push(option);
	}
	var config = {};
	config.onchange = "update_td_to_gd_readout()";
	return make_select("tibyear_select", options, config);
}

/**
 * tibmonth_select: return HTML for Tibetan month select element
 */
function tibmonth_select() {
	var options = [];
	var month_text_array = textpool_get_text("tibetan_month_names");
	for (var i = 0; i < month_text_array.length; i += 1) {
		var option = {};
		option.text = month_text_array[i];
		option.value = i + 1;
		options.push(option);
	}
	var config = {};
	config.onchange = "update_td_to_gd_readout()";
	return make_select("tibmonth_select", options, config);
}


/**
 * tibday_select: return HTML for Tibetan day select element
 */
function tibday_select() {
	var options = [];
	for (var i = 1; i <= 30; i += 1) {
		var option = {};
		option.text = "" + i;
		option.value = i;
		options.push(option);
	}
	var config = {};
	config.onchange = "update_td_to_gd_readout()";
	return make_select("tibday_select", options, config);
}

/**
 * update_td_to_gd_readout: update the results of converting the
 * Tibetan date the user has entered to a Gregorian date or dates
 */
function update_td_to_gd_readout() {
	var rabjung = $('#rabjung_select').val();
	if (rabjung == "ALL") {
		rabjung = -1
	} else {
		rabjung = parseInt(rabjung);
	}
	var tibyear = parseInt($('#tibyear_select').val());
	var tibmonth = parseInt($('#tibmonth_select').val());
	var tibday = parseInt($('#tibday_select').val());
	var datepairs = tc_get_gregorian_dates_for_tibetan_date(rabjung,
			tibyear, tibmonth, tibday);

	var result_html;
	if (datepairs.length == 0) {
		console.log("Internal Error");
	} else if (datepairs.length == 1) {
		var datepair = datepairs[0];
		var td_string = textpool_format_tibetan_date(
				datepair.tibDate);
		var wd_string;
		if (datepair.westernDate == null) {
			wd_string = textpool_get_text("no_greg_date");
		} else {
			wd_string = $.datepicker.formatDate(
				textpool_get_text("western_date_format"),
				datepair.westernDate);
		}
		result_html = textpool_get_text("matching_greg_date",
				td_string, wd_string);
	} else {
		result_html = textpool_get_text("matching_greg_dates");
		var dpno;
		for (dpno = 0; dpno < datepairs.length; dpno += 1) {
			var datepair = datepairs[dpno];
			var td_string = textpool_format_tibetan_date(
					datepair.tibDate);
			var wd_string;
			if (datepair.westernDate == null) {
				wd_string = textpool_get_text("no_greg_date");
			} else {
				wd_string = $.datepicker.formatDate(
					textpool_get_text("western_date_format"),
					datepair.westernDate);
			}
			result_html += textpool_get_text("matching_greg_date2",
					td_string, wd_string);
		}
	}
	$('#td2gd_readout').html(result_html);
}

/**
 * gd_changed: User has selected a new Gregorian date
 */
function gd_changed() {
	var gd = $('#greg_datepicker').datepicker("getDate");
	var result_html = "Corresponding Tibetan Day:";
	var td = tc_get_tibetan_date_for_gregorian_date(gd);
	result_html += textpool_format_tibetan_date(td);
	$('#gd2td_readout').html(result_html);
}

/****************/
/* Localization */
/****************/

tclzn_textpool_english = {};

tclzn_textpool = {};

function set_tibdate_tclzn_english() {
	var l = tclzn_textpool_english;

	l["convert_tib_greg"] = "Tibetan Date -> Western Date";
	l["convert_greg_tib"] = "Western Date -> Tibetan Date";
	l["choose_date"] = "Please choose a date:";

	l["no_greg_date"] = "(No corresponding Western date)";

	l["lbl_rabjung"] = "Rabjung (number of the 60-year cycle)";
	l["lbl_tibyear"] = "Year within the 60-year cycle";
	l["lbl_tibmonth"] = "Tibetan Month";
	l["lbl_tibday"] = "Tibetan Day";
	l["tibdate_out"] = "Corresponding Tibetan day:\n%1";

	l["select_all_rabjungs"] = "Calculate this date for every rabjung";
	l["matching_greg_dates"] = ("<p>There is more than one Western date " +
		"that corresponds to your input:</p>");

	l["matching_greg_date"] = (
			"<p>You entered the following Tibetan date: %1</p>" +
			"<p>The corresponding Western date is: %2</p>");

	l["matching_greg_date2"] = (
			"<p>The Tibetan Date (%1) corresponds " +
			"to the Western date (%2)</p>");

	l["animal.1"] = "Hare";
	l["animal.2"] = "Dragon";
	l["animal.3"] = "Snake";
	l["animal.4"] = "Horse";
	l["animal.5"] = "Sheep";
	l["animal.6"] = "Ape";
	l["animal.7"] = "Bird";
	l["animal.8"] = "Dog";
	l["animal.9"] = "Pig";
	l["animal.10"] = "Mouse";
	l["animal.11"] = "Bull";
	l["animal.12"] = "Tiger";

	l["element.1"] = "Fire";
	l["element.2"] = "Earth";
	l["element.3"] = "Iron";
	l["element.4"] = "Water";
	l["element.5"] = "Wood";

	l["sex.1"] = "male";
	l["sex.2"] = "female";

	l["month.1"] = "1 (first spring month, tiger-month)";
	l["month.2"] = "2 (second spring month, hare-month)";
	l["month.3"] = "3 (third spring month, dragon-month)";
	l["month.4"] = "4 (first summer month, snake-month)";
	l["month.5"] = "5 (second summer month, horse-month)";
	l["month.6"] = "6 (third summer month, sheep-month)";
	l["month.7"] = "7 (first autumn month, monkey-month)";
	l["month.8"] = "8 (second autumn month, bird-month)";
	l["month.9"] = "9 (third autumn month, dog-month)";
	l["month.10"] = "10 (first winter month, pig-month)";
	l["month.11"] = "11 (second winter month, mouse-month)";
	l["month.12"] = "12 (third winter month, ox-month)";

	l["tibetan_date_format_full"] = 
		"Day %1 of month %2 in year %3 of rabjung %4";

	l["double_month.1"] = "%1, first month of a doubled month,";
	l["double_month.2"] = "%1, second month of a doubled month,";
	l["double_day.1"] = "%1 (first day of a doubled day)";
	l["double_day.2"] = "%1 (second day of a doubled day)";

	// Tibetan year format, for example "29 (female Wood-Sheep)"
	l["year_pattern"] = "%1 (%2 %3-%4)";

	// Gregorian date format for $.datepicker.formatDate()
	l["western_date_format"] = "D d MM yy";
}

/**
 * textpool_get_text(id, params...) : Get a localized text from the
 * text pool and replace placeholders with parameters
 *
 * id - string
 *     id of the text
 * params
 *     the parameters to insert instead of the placeholders in the
 *     text. Parameters have the form: %1 %2 %3 ...
 *
 * This function does not always return a string. For example in the
 * case of "tibetan_year_names" an array of strings is returned.
 */
function textpool_get_text() {
	var textKey = arguments[0];
	var result = tclzn_textpool[textKey];
	for (var i =1; i < arguments.length; i += 1) {
		result = result.replace("%" + i, arguments[i]);
	}
	return result;
}

/**
 * Very simple test of textpool_get_text()
 */
function test_textpool_get_text() {
	var expected = "a (b c-d)";
	var actual = textpool_get_text("year_pattern", "a", "b", "c", "d");
	if (expected != actual) {
		alert("test_textpool_get_text: assertion failed");
	}
}

/**
 * Return a list of descriptive names for each Tibetan year of a
 * 60-year cycle for example "1 (female Fire-Hare year)"
 *
 * This value is cached in the text pool
 */
function textpool_gen_tibetan_year_names() {
	var animal = 1;
	var element = 1;
	var sex = 1;
	var result = [];
	for (var year = 1; year <= 60; year += 1) {
		var sexName = textpool_get_text("sex." + (1 + sex));
		var elementName = textpool_get_text("element." + element);
		var animalName = textpool_get_text("animal." + animal);
		var completeText = textpool_get_text("year_pattern", "" + year,
				sexName, elementName, animalName);
		result.push(completeText);

		sex = 1 - sex;
		if (animal % 2 == 1) {
			element += 1;
		}
		if (element > 5) {
			element = 1;
		}
		animal += 1;
		if (animal > 12) {
			animal = 1;
		}
	}
	return result;
}

function textpool_gen_tibetan_month_names() {
	var result = [];
	for (var month = 1; month <= 12; month += 1) {
		result.push(textpool_get_text("month." + month));
	}
	return result;
}

/**
 * textpool_format_tibetan_date: return string for Tibetan date
 */
function textpool_format_tibetan_date(td) {
	var monthName = textpool_get_text("month." + td.tibMonth);
	if (td.monthFlag == 1) {
		monthName = textpool_get_text("double_month.1", monthName);
	} else if (td.monthFlag == 2) {
		monthName = textpool_get_text("double_month.2", monthName);
	}

	var day = "" + td.tibDay;
	
	if (td.doubleDayFlag == 1) {
		day = textpool_get_text("double_day.1", day);
	} else if (td.doubleDayFlag == 2) {
		day = textpool_get_text("double_day.2", day);
	}

	var yearName = textpool_get_text("tibetan_year_names")[td.tibYear - 1];
	var result = textpool_get_text("tibetan_date_format_full",
			day, monthName, yearName, td.rabjung);
	return result;
}

//
// Set localization
//
// This function should be rewritten to support actual localization
// for languages other than English.
//
function set_tibdate_tclzn() {
	tclzn_textpool = tclzn_textpool_english;
	tclzn_textpool["tibetan_year_names"] =
		textpool_gen_tibetan_year_names();
	tclzn_textpool["tibetan_month_names"] = 
		textpool_gen_tibetan_month_names();
}


/*************/
/* Constants */
/*************/

tc_k = {};

// First supported rabjung
tc_k.RABJUNG_START = 1;

// Last supported rabjung
tc_k.RABJUNG_END = 20;

// The offset by which the global month number must be adjusted in order to
// make the month 2 of year 1 in rabjung 16 the month number "0". This is
// required because many other calculations are interpolations that are
// based on this point in time and that are projecting forwards and
// backwards from this point
tc_k.C_ZLADAG_OFFSET = 11134;

// Milliseconds per common day
tc_k.ms_per_day = 24 * 60 * 60 * 1000;

// Add constants corresponding to moments where the JavaScript Date
// object does not properly account for the 1582 Gregorian switch or
// leap days.
//
// Some of the the names of the constants, in the current state,
// make no sense at all because they correspond to non-existent leap
// days (leap days in a year which is "not a leap year").
tc_k.feb_28_1100 = (new Date(1100,1,28)).getTime();
tc_k.feb_29_1100 = (new Date(1100,1,29)).getTime();

tc_k.feb_28_1300 = (new Date(1300,1,28)).getTime();
tc_k.feb_29_1300 = (new Date(1300,1,29)).getTime();

tc_k.feb_28_1400 = (new Date(1400,1,28)).getTime();
tc_k.feb_29_1400 = (new Date(1400,1,29)).getTime();

tc_k.feb_28_1500 = (new Date(1500,1,28)).getTime();
tc_k.feb_29_1500 = (new Date(1500,1,29)).getTime();

tc_k.oct_05_1582 = (new Date(1582,9,5)).getTime();
tc_k.oct_15_1582 = (new Date(1582,9,15)).getTime();

// Array of Tibetan month info objects
tc_tibetan_month_records = [];

/**
* tc_strip_time: remove the time portion of a Gregorian date
* (JavaScript Date object), thereby setting the hours, minute,
* second and millisecond part of the date to zero
* 
* @param date
*            the Date to be modified
* @return a Date object for 0:00 at the same day
*/
function tc_strip_time(d) {
	if (d) {
		var result = new Date(d);
		result.setMilliseconds(0);
		result.setSeconds(0);
		result.setMinutes(0);
		result.setHours(0);
		return result;
	} else {
		return null;
	}
}

/**
 * tc_add_month_record: Add a month record to the set of
 * precalculated information
 */
function tc_add_month_record(rabjung, tibMonth, year, a2a, a2b, mflg) {
	if (year == 0) {
		year = 60;
		rabjung -= 1;
	}

	// adjust the month number in such a way that the 2nd month
	// of rabjung 16 will be month 0 because the original program
	// with all its interpolations starts to calculate from there.
	// Months before that will have a negative month number.

	var zladag = tc_tibetan_month_records.length -
		tc_k.C_ZLADAG_OFFSET;
	var tmi_record = make_tibetan_month_info(rabjung, year, tibMonth,
			zladag, mflg, 0, 0, 0, 0, null);
	tc_tibetan_month_records.push(tmi_record);
}

/**
 * tc_calculate_normal_system: Internal helper routine to
 * pre-calculate the position of various astronomical bodies for the
 * entire timespan in which the tool is working
 */
function tc_calculate_normal_system() {
	var F_FIRST = 1;
	var F_SECOND = 2;
	var ii;
	var jj;
	var y_start = 1;
	var y_end = 60;
	var r;
	var y, y1, y2;
	var m, m1, m2;
	var a, a1, a1r, a1z, a1a;
	var b, b1r, b1z, b1a;

	var totalYears = 0;

	var RABJUNG_START = tc_k.RABJUNG_START;
	var RABJUNG_END = tc_k.RABJUNG_END;

	for (r = RABJUNG_START; r <= RABJUNG_END; r += 1) {
		for (y = y_start; y <= y_end; y += 1) {
			totalYears += 1;
			for (m = 1; m <= 12; m += 1) {
				if (m > 2) {
					m1 = m;
					y1 = totalYears - 901;
				} else {
					m1 = m + 12;
					y1 = totalYears - 902;
				}

				// [1] For zla-dag (corrected number of passed months)
				// Calculate for y=any Tibetan year (1 to 60), m=any
				// Tibetan month (1 to 12)
				a = ((12 * y1) + m1) - 3;
				a1 = ((2 * a) + 55) / 65;
				a1r = a1;
				a1z = ((2 * a) + 55) % 65;
				a1z = (65 + a1z) % 65; // adjust for negative numbers
				a1a = a + a1r;
				a1a = (65 + a1a) % 65; // adjust for negative numbers

				if ((a1z > 1) && (a1z < 48)) {
					tc_add_month_record(r, m, y, a1a, a1z, 0);
				} else if ((a1z == 48) || (a1z == 49)) {
					tc_add_month_record(r, m, y, a1a, a1z, F_FIRST);
				} else if ((a1z == 50) || (a1z == 51)) {
					if (m > 1) {
						tc_add_month_record(r, (m - 1), y, a1a, a1z, F_SECOND);
					} else {
						tc_add_month_record(r, 12, (y - 1), a1a, a1z, F_SECOND);
					}
				} else if (a1z > 51) {
					if (m > 1) {
						tc_add_month_record(r, (m - 1), y, a1a, a1z, 0);
					} else {
						tc_add_month_record(r, 12, (y - 1), a1a, a1z, 0);
					}
				} else if ((a1z == 0) || (a1z == 1)) {
					if (m > 1) {
						tc_add_month_record(r, m - 1, y, a1a - 1, 0, 0);
						tc_add_month_record(r, m, y, a1a, a1z, 0);
					} else {
						tc_add_month_record(r, 12, (y - 1), (a1a - 1), 0, 0);
						tc_add_month_record(r, m, y, a1a, a1z, 0);
					}
				} else {
					// error in 1st case statement
					console.log("Internal Error");
				}
			}
		}
	}
}

// [2] For the gza'-dhru (root lunar weekday for the month)
// [B] Save: gza'-dhru (root lunar weekday for the month)=
// a3[0] a3[1] a3[2] a3[3] a3[4]
function tc_calculate_a_gzadhru(zladag) {
	while (zladag < 0) {
		// gzadhru calculations repeat every 39592 months
		// --> transpose the calculations for negative month numbers
		// into a positive month number at the same position of a later
		// cycle. In this way we avoid calculating with negative month
		// numbers and thereby yield the correct results
		zladag += 39592;
	}

	var a3 = [];
	var a3er = tc_cast_to_int(((480 * zladag) + 20) / 707);
	a3[4] = (((480 * zladag) + 20) % 707);
	var a3dr = tc_cast_to_int((2 + a3er) / 6);
	a3[3] = ((2 + a3er) % 6);
	var a3cr = tc_cast_to_int(((50 * zladag) + 53 + a3dr) / 60);
	a3[2] = (((50 * zladag) + 53 + a3dr) % 60);
	var a3br = tc_cast_to_int(((31 * zladag) + 57 + a3cr) / 60);
	a3[1] = (((31 * zladag) + 57 + a3cr) % 60);
	var a3ar = tc_cast_to_int((zladag + 6 + a3br) / 7);
	a3[0] = ((zladag + 6 + a3br) % 7);
	return a3;
}

// [3] For the nyi-dhru (root sun position for the month)
// [B] Save: nyi-dhru (root sun position for the month)=
// a4[0] a4[1] a4[2] a4[3] a4[4]
function tc_calculate_a_nyidhru(zladag) {
	while (zladag < 0) {
		// nyidhru calculations repeat every 804 months
		// --> transpose the calculations for negative month numbers
		// into a positive month number at the same position of a later
		// cycle. In this way we avoid calculating with negative month
		// numbers and thereby yield the correct results
		zladag += 804;
	}

	var a4 = [];
	var a4er = tc_cast_to_int(((17 * zladag) + 32) / 67);
	a4[4] = (((17 * zladag) + 32) % 67);
	var a4dr = tc_cast_to_int((zladag + 4 + a4er) / 6);
	a4[3] = ((zladag + 4 + a4er) % 6);
	var a4cr = tc_cast_to_int(((58 * zladag) + 10 + a4dr) / 60);
	a4[2] = (((58 * zladag) + 10 + a4dr) % 60);
	var a4br = tc_cast_to_int(((10 * zladag) + 9 + a4cr) / 60);
	a4[1] = (((10 * zladag) + 9 + a4cr) % 60);
	var a4ar = tc_cast_to_int(((2 * zladag) + 25 + a4br) / 27);
	a4[0] = (((2 * zladag) + 25 + a4br) % 27);

	return a4;
}

// [4] For ril-cha (root position in lunation cycle for the
// month)
// [B] Save: ril-cha (root position in lunation cycle for the
// month)= a5[0] a5[1]
function tc_calculate_a_rilcha(zladag) {
	while (zladag < 0) {
		// rilcha calculations repeat every 3528 months
		// --> transpose the calculations for negative month numbers
		// into a positive month number at the same position of a later
		// cycle. In this way we avoid calculating with negative month
		// numbers and thereby yield the correct results
		zladag += 3528;
	}

	var a5 = [];
	var a5br = tc_cast_to_int((zladag + 103) / 126);
	a5[1] = ((zladag + 103) % 126);

	var a5ar = tc_cast_to_int(((2 * zladag) + 13 + a5br) / 28);
	a5[0] = (((2 * zladag) + 13 + a5br) % 28);

	return a5;
}

/**
 * tc_normal_system_add_skipped_and_doubled: calculate skipped and
 * double days to the pre-calculated information
 *
 * This function updates tc_tibetan_month_records by populating the
 * fields skip1, skip2, double1, double2
 */
function tc_normal_system_add_skipped_and_doubled() {
	var tmi_rec = tc_tibetan_month_records[0];

	var a3 = tc_calculate_a_gzadhru(tmi_rec.zladag);
	var a4 = tc_calculate_a_nyidhru(tmi_rec.zladag);
	var a5 = tc_calculate_a_rilcha(tmi_rec.zladag);

	var prev_a13 = tc_calca13a(30, a3, a4, a5);
	var recordNumber = tc_tibetan_month_records.length;
	var i;
	for (i = 1; i < recordNumber; i += 1) {
		tmi_rec = tc_tibetan_month_records[i];
		a3 = tc_calculate_a_gzadhru(tmi_rec.zladag);
		a4 = tc_calculate_a_nyidhru(tmi_rec.zladag);
		a5 = tc_calculate_a_rilcha(tmi_rec.zladag);

		var aSkip1 = 0;
		var aSkip2 = 0;
		var aDbl1 = 0;
		var aDbl2 = 0;
		var j;
		for (j = 1; j <= 30; j += 1) {
			var a13a = tc_calca13a(j, a3, a4, a5);
			if (a13a == prev_a13) {
				if (aSkip1 == 0) {
					aSkip1 = j;
				} else if (aSkip2 == 0) {
					aSkip2 = j;
				} else {
					console.log("A_SKIP field filled up for month recno "
									+ i + " (" + tmi_rec + ")");
				}
			} else if (prev_a13 < 5) {
				if (a13a == prev_a13 + 2) {
					if (aDbl1 == 0) {
						aDbl1 = j;
					} else if (aDbl2 == 0) {
						aDbl2 = j;
					} else {
						console.log("A_DBL field filled up for month recno "
										+ i + " (" + tmi_rec + ")");
					}
				}
			} else if (prev_a13 > 4) {
				if (a13a == prev_a13 - 5) {
					if (aDbl1 == 0) {
						aDbl1 = j;
					} else if (aDbl2 == 0) {
						aDbl2 = j;
					} else {
						console.log("A_DBL field filled up for month recno "
										+ i);
					}
				}
			}
			prev_a13 = a13a;
		}
		tmi_rec.skip1 = aSkip1;
		tmi_rec.skip2 = aSkip2;
		tmi_rec.double1 = aDbl1;
		tmi_rec.double2 = aDbl2;
	}
}


/**
 * Return the date n days before date d
 *
 * The JavaScript Date object does not properly handle date
 * calculations for some dates in the far past, before 1582. See
 * https://en.wikipedia.org/wiki/1582 for details.
 *
 * d - input date object
 * n - number of days to count back
 *
 * Returns date object
 */
function tc_sub_n_days(d, n) {
	var result = new Date(d);
	// no adjustments needed after 1900
	if (result.getYear() < 0) {
		var d_ms = result.getTime();
		var nd_ms = d_ms - tc_k.ms_per_day * n;
		if (tc_k.oct_15_1582 < d_ms && nd_ms < tc_k.oct_15_1582) {
			result.setDate(result.getDate() - 10);
		} else if (tc_k.feb_28_1500 < d_ms && nd_ms < tc_k.feb_28_1500) {
			result.setDate(result.getDate() + 1);
		} else if (tc_k.feb_28_1400 < d_ms && nd_ms < tc_k.feb_28_1400) {
			result.setDate(result.getDate() + 1);
		} else if (tc_k.feb_28_1300 < d_ms && nd_ms < tc_k.feb_28_1300) {
			result.setDate(result.getDate() + 1);
		} else if (tc_k.feb_28_1100 < d_ms && nd_ms < tc_k.feb_28_1100) {
			result.setDate(result.getDate() + 1);
		}
	}
	result.setDate(result.getDate() - n);
	return result;
}

/**
 * Return the date n days after d
 */
function tc_add_n_days(d, n) {
	var result = new Date(d);
	// no adjustments needed after 1900
	if (result.getYear() < 0) {
		var d_ms = result.getTime();
		var nd_ms = d_ms + tc_k.ms_per_day * n;
		if (d_ms < tc_k.oct_05_1582 && tc_k.oct_05_1582 <= nd_ms) {
			result.setDate(result.getDate() + 10);
		} else if (d_ms < tc_k.feb_29_1500 && tc_k.feb_29_1500 <= nd_ms) {
			result.setDate(result.getDate() - 1);
		} else if (d_ms < tc_k.feb_29_1400 && tc_k.feb_29_1400 <= nd_ms) {
			result.setDate(result.getDate() - 1);
		} else if (d_ms < tc_k.feb_29_1300 && tc_k.feb_29_1300 <= nd_ms) {
			result.setDate(result.getDate() - 1);
		} else if (d_ms < tc_k.feb_29_1100 && tc_k.feb_29_1100 <= nd_ms) {
			result.setDate(result.getDate() - 1);
		}
	}
	result.setDate(result.getDate() + n);
	return result;
}

/**
 * Add corresponding western date for the beginning of each Tibetan month to
 * the pre-calculated information
 */
function tc_add_western_dates() {
	var recordCount = tc_tibetan_month_records.length;
	var entryRownum = tc_locate_record(17, 2, 1, 0);
	if (entryRownum == -1) {
		console.log("Internal Error");
	}

	var calendar = new Date();
	calendar.setYear(1988);
	calendar.setMonth(1);
	calendar.setDate(18);
	var dFirst = tc_strip_time(calendar);
	var dPrev = dFirst;

	var tmi_rec = tc_tibetan_month_records[entryRownum];
	tmi_rec.westernDate = dPrev;

	var nCount = 30;
	var aSkip1 = tmi_rec.skip1;
	var aSkip2 = tmi_rec.skip2;
	var aDbl1 = tmi_rec.double1;
	var aDbl2 = tmi_rec.double2;

	if ((aSkip1 != 0) && (aDbl1 == 0)) {
		nCount -= 1;
	} else if ((aSkip2 != 0) && (aDbl2 == 0)) {
		nCount -= 1;
	} else if ((aSkip1 == 0) && (aDbl1 != 0)) {
		// error
		console.log("Internal Error");
	} else if ((aSkip2 == 0) && (aDbl2 != 0)) {
		// error
		console.log("Internal Error");
	}
	var i;
	for (i = entryRownum + 1; i < recordCount; i += 1) {
		calendar = new Date(dPrev);
		calendar.setDate(calendar.getDate() + nCount);
		dPrev = new Date(calendar);

		tmi_rec = tc_tibetan_month_records[i];
		tmi_rec.westernDate = dPrev;

		nCount = 30;
		aSkip1 = tmi_rec.skip1;
		aSkip2 = tmi_rec.skip2;
		aDbl1 = tmi_rec.double1;
		aDbl2 = tmi_rec.double2;

		if ((aSkip1 != 0) && (aDbl1 == 0)) {
			nCount -= 1;
		}
		if ((aSkip2 != 0) && (aDbl2 == 0)) {
			nCount -= 1;
		} else if ((aSkip1 == 0) && (aDbl1 != 0)) {
			// error
			console.log("Internal Error");
		} else if ((aSkip2 == 0) && (aDbl2 != 0)) {
			// error
			console.log("Internal Error");
		}
	}
	dPrev = dFirst;
	for (i = entryRownum - 1; i >= 0; i -= 1) {
		nCount = 30;

		tmi_rec = tc_tibetan_month_records[i];
		aSkip1 = tmi_rec.skip1;
		aSkip2 = tmi_rec.skip2;
		aDbl1 = tmi_rec.double1;
		aDbl2 = tmi_rec.double2;

		if ((aSkip1 != 0) && (aDbl1 == 0)) {
			nCount -= 1;
		} else if ((aSkip2 != 0) && (aDbl2 == 0)) {
			nCount -= 1;
		} else if ((aSkip1 == 0) && (aDbl1 != 0)) {
			// error
			console.log("Internal Error");
		} else if ((aSkip2 == 0) && (aDbl2 != 0)) {
			// error
			console.log("Internal Error");
		}
		dPrev = tc_sub_n_days(dPrev, nCount);

		tmi_rec.westernDate = dPrev;
	}
}


/**
 * Get all matching gregorian dates for a given Tibetan date. Not
 * all parameters need to be specified. If some parameters have
 * the value -1 then all matching entries for all permutations of
 * that value will be returned.
 *
 * Porting note: the Java date implementation thinks that 1100, 1300,
 * 1400, and 1500 are leap years and the JavaScript implementation
 * does not. It is unclear what the "truth" is because the Gregorian
 * calendar was adopted in 1582. This function will therefore differ
 * from the original Java implementation for leap dates in 1100,
 * 1300, 1400, and 1500.
 *
 * @param rabjung
 *            the rabjung to be used or -1 if any rabjung is allowed
 * @param tibYear
 *            the year within the rabjung to be used or -1 if any year of
 *            the rabjung is allowed
 * @param tibMonth
 *            the month within the Tibetan year to be used or -1 if any
 *            month is allowed
 * @param tibDay
 *            the day within the Tibetan month to be used or -1 if any month
 *            is allowed
 * @return an Array with all matching Tibetan dates and their corresponding
 *         Gregorian Dates
 */
function tc_get_gregorian_dates_for_tibetan_date(rabjung, tibYear,
		tibMonth, tibDay) {

	var startRab = rabjung > 0 ? rabjung : tc_k.RABJUNG_START;
	var endRab = rabjung > 0 ? rabjung : tc_k.RABJUNG_END;

	var startYear = tibYear > 0 ? tibYear : 1;
	var endYear = tibYear > 0 ? tibYear : 60;

	var startMonth = tibMonth > 0 ? tibMonth : 1;
	var endMonth = tibMonth > 0 ? tibMonth : 12;

	var startDay = tibDay > 0 ? tibDay : 1;
	var endDay = tibDay > 0 ? tibDay : 30;

	var result = [];
	var rab, yr, mn, monthFlag, day;

	for (rab = startRab; rab <= endRab; rab += 1) {
		for (yr = startYear; yr <= endYear; yr += 1) {
			for (mn = startMonth; mn <= endMonth; mn += 1) {
				for (monthFlag = 0; monthFlag <= 2; monthFlag += 1) {
					var tmi_rec = tc_get_record(rab, yr, mn, monthFlag);
					if (tmi_rec != null) {
						for (day = startDay; day <= endDay; day += 1) {
							var skipped = ((day == tmi_rec.skip1) ||
									(day == tmi_rec.skip2));
							var doubled = ((day == tmi_rec.double1) ||
									(day == tmi_rec.double2));

							var dayDiff = day - 1;
							if ((day > tmi_rec.skip1) && (tmi_rec.skip1 != 0)) {
								dayDiff -= 1;
							}
							if ((day > tmi_rec.skip2) && (tmi_rec.skip2 != 0)) {
								dayDiff -= 1;
							}
							if ((day > tmi_rec.double1) && (tmi_rec.double1 != 0)) {
								dayDiff += 1;
							}
							if ((day > tmi_rec.double2) && (tmi_rec.double2 != 0)) {
								dayDiff += 1;
							}

							var the_date = tc_add_n_days(tmi_rec.westernDate, dayDiff);

							var tibDate = make_tibdate(rab, yr, mn, monthFlag, day);

							if (skipped) {
								tibDate.isSkippedDay = true;
								result.push(make_date_pair(tibDate, null));
							} else if (doubled) {
								tibDate.doubleDayFlag = 1;
								result.push(make_date_pair(tibDate, the_date));

								var tibDate2 = make_tibdate(rab, yr, mn,
										monthFlag, day);
								tibDate2.doubleDayFlag = 2;

								var date2 = tc_add_n_days(the_date, 1);
								result.push(make_date_pair(tibDate2, date2));
							} else {
								result.push(make_date_pair(tibDate, the_date));
							}
						}
					}
				}
			}
		}
	}
	return result;
}

/**
 * get the number of days that two dates are apart
 * 
 * @param date1
 *            the first date
 * @param date2
 *            the second date
 * @return the days of difference between date1 and date2
 *
 * NOTE: this function differs from the original Java due to the way
 * tc_add_n_days works around certain leap days.
 */
function tc_get_difference_in_days(date1, date2) {
	var earlierDate = null;
	var laterDate = null;
	if (date1 < date2) {
		earlierDate = date1;
		laterDate = date2;
	} else if (date2 < date1) {
		earlierDate = date2;
		laterDate = date1;
	} else {
		return 0;
	}

	var difference = 0;
	while (1) {
		if (difference > 1000) {
			console.log("tc_get_difference_in_days: Internal Error");
			return;
		}
		if (tc_add_n_days(earlierDate, difference) >= laterDate) {
			return difference;
		}
		difference += 1;
	}
}


/**
 * get a Tibetan date for a Gregorian date
 */
function tc_get_tibetan_date_for_gregorian_date(d) {
	d = tc_strip_time(d);
	var i;

	for (i = tc_tibetan_month_records.length - 1; i >= 0; i -= 1) {
		var tmi_rec = tc_tibetan_month_records[i];
		if (tmi_rec.westernDate <= d) {
			var day = tc_get_difference_in_days(d, tmi_rec.westernDate) + 1;

			var result = make_tibdate(tmi_rec.rabjung, tmi_rec.tibYear,
					tmi_rec.tibMonth, tmi_rec.monthFlag, day);

			// correct for skipped days
			if ((result.tibDay >= tmi_rec.skip1) && (tmi_rec.skip1 != 0)) {
				result.tibDay += 1;
			}
			if ((result.tibDay >= tmi_rec.skip2) && (tmi_rec.skip2 != 0)) {
				result.tibDay += 1;
			}

			// correct for doubled days
			if ((result.tibDay == tmi_rec.double1)
					|| (result.tibDay == tmi_rec.double2)) {
				result.doubleDayFlag = 1;
			}

			if ((result.tibDay > tmi_rec.double1) && (tmi_rec.double1 != 0)) {
				result.tibDay -= 1;
				if (result.tibDay == tmi_rec.double1) {
					result.doubleDayFlag = 2;
				}
			}
			if ((result.tibDay > tmi_rec.double2) && (tmi_rec.double2 != 0)) {
				result.tibDay -= 1;
				if (result.tibDay == tmi_rec.double2) {
					result.doubleDayFlag = 2;
				}
			}
			return result;
		}
	}
	console.log("tc_get_tibetan_date_for_gregorian_date: Internal Error");
	return null;
}


/**
 * locate the pre-calculated month description record for a Tibetan month
 * 
 * @param rabjung
 *            rabjung to search for
 * @param tibYear
 *            year to search for
 * @param tibMonth
 *            month to search for
 * @param monthFlag
 *            0: return the record if the month is a non-doubled month and
 *            null if this month is a doubled month; 1: return the first
 *            month of a double month and return null if no this month is no
 *            double month; 2: return the second month of a double month and
 *            return null if no this month is no double month;
 * @return the record for the matching Tibetan date or null if no record
 *         matches the given information
 */
function tc_get_record(rabjung, tibYear, tibMonth, monthFlag) {
	var recPos = tc_locate_record(rabjung, tibYear, tibMonth, monthFlag);

	if (recPos != -1) {
		return tc_tibetan_month_records[recPos];
	}

	return null;
}


/**
 * locate the position of the pre-calculated record for a Tibetan month
 * 
 * @param rabjung
 *            rabjung to search for
 * @param tibYear
 *            year to search for
 * @param tibMonth
 *            month to search for
 * @param monthFlag
 *            0: return the record if the month is a non-doubled month and
 *            -1 if this month is a doubled month; 1: return the first month
 *            of a double month and return -1 if no this month is no double
 *            month; 2: return the second month of a double month and return
 *            -1 if no this month is no double month;
 * @return the record number of the matching Tibetan date or -1 if no record
 *         matches the given information
 */
function tc_locate_record(rabjung, tibYear, tibMonth, monthFlag) {
	var recordCount = tc_tibetan_month_records.length;
	var pos;
	for (pos = recordCount - 1; pos >= 0; pos -= 1) {
		var tmi_rec = tc_tibetan_month_records[pos];
		if ((tmi_rec.rabjung == rabjung) && (tmi_rec.tibYear == tibYear)
				&& (tmi_rec.tibMonth == tibMonth)
				&& (monthFlag == tmi_rec.monthFlag)) {
			return pos;
		}
	}

	return -1;
}


// [10] Print from each record:
// r cycle y2 year m2 month
// rnam-dag grub-dhru (pure full tenet system's root figures
// for the month):
// zla-dag (corrected number of passed months) = a2a a2b
// gza'-dhru (root lunar weekday) = a3[1] a3[2] a3[3] a3[4] a3[5]
// nyi-dhru (root sun position) = a4[1] a4[2] a4[3] a4[4] a4[5]
// ril-cha (root position in lunation cycle) = a5[1] a5[2]
// dpal-ldan byed-dhru (glorious precis system's root figures
// for the month):
// zla-dag (corrected number of passed months)[for r cycle
// y3 year m3 month]= b2a b2b
// gza'-dhru (root lunar weekday) = b3[1] b3[2] b3[3]
// nyi-dhru (root sun position) = b4[1] b4[2] b4[3] b4[4] b4[5]
// ril-cha (root position in lunation cycle) = b5[1] b5[2]
function tc_calca13a(d, a3, a4, a5) {
	var a6er, a6ez, a6dr, a6dz, a6cr, a6cz, a6br, a6bz, a6ar, a6az;
	var a7er, a7ez, a7dr, a7dz, a7cr, a7cz, a7br, a7bz, a7ar, a7az;
	var a8er, a8ez, a8dr, a8dz, a8cr, a8cz, a8br, a8bz, a8ar, a8az;
	var a9er, a9ez, a9dr, a9dz, a9cr, a9cz, a9br, a9bz, a9ar, a9az;
	/* var a10sm; */
	var a10r, a10z, a10s, a10m;
	var a10a2r, a10a2z, a10a3r, a10a3z, a10a4r, a10a4z, a10a5r, a10a5z;
	// LOCAL a10a2,a10a3,a10a4,a10a5
	var a10b2, a10b3, a10b4, a10b5;
	var a10c1, a10c2, a10c3, a10c4, a10c5;
	var a10d1, a10d2, a10d3, a10d4, a10d5;
	var a10e1, a10e2, a10e3, a10e4, a10e5;
	var a9az1, a9az2, a9bz1;
	var a11a1, a11a2, a11a3, a11a4, a11a5;
	var a11b1 = 0, a11b2 = 0, a11b3, a11b4, a11b5;
	var a11cr, a11cz; /* var a11csm */
	var a11cs, a11cm;
	var a11d2, a11d3r, a11d3z, a11d4r, a11d4z, a11d5r, a11d5z;
	var a11e2r, a11e2z, a11e3r, a11e3z, a11e4r, a11e4z, a11e5r, a11e5z;
	var a11f2 = 0, a11f3 = 0, a11f4 = 0, a11f5 = 0;
	var a10e5ar, a10e5az;
	var a11g1, a11g2, a11g3, a11g4, a11g5;
	var a11h1, a11h2, a11h3, a11h4;
	var a11i1, a11i2, a11i3, a11i4, a11i5;
	var a11j1, a11j2, a11j3, a11j4;
	var ii, jj; /* var aUnits; */
	/* var a12; var a13; var aRetval; */
	/* var a9; */

	// a6: gza'-rtag (lunar weekday daily-motion constant)
	a6er = tc_cast_to_int((16 * d) / 707);
	a6ez = (16 * d) % 707;
	a6dr = tc_cast_to_int(((4 * d) + a6er) / 6);
	a6dz = ((4 * d) + a6er) % 6;
	a6cr = tc_cast_to_int(((3 * d) + a6dr) / 60);
	a6cz = ((3 * d) + a6dr) % 60;
	a6br = tc_cast_to_int(((59 * d) + a6cr) / 60);
	a6bz = ((59 * d) + a6cr) % 60;
	a6ar = tc_cast_to_int(a6br / 7);
	a6az = a6br % 7;

	// a7: gza'-bar (mean lunar weekday)
	a7er = tc_cast_to_int((a3[4] + a6ez) / 707);
	a7ez = (a3[4] + a6ez) % 707;
	a7dr = tc_cast_to_int((a3[3] + a6dz + a7er) / 6);
	a7dz = (a3[3] + a6dz + a7er) % 6;
	a7cr = tc_cast_to_int((a3[2] + a6cz + a7dr) / 60);
	a7cz = (a3[2] + a6cz + a7dr) % 60;
	a7br = tc_cast_to_int((a3[1] + a6bz + a7cr) / 60);
	a7bz = (a3[1] + a6bz + a7cr) % 60;
	a7ar = tc_cast_to_int((a3[0] + a6az + a7br) / 7);
	a7az = (a3[0] + a6az + a7br) % 7;

	// a8: nyi-rtag (sun's daily-motion constant)
	a8er = tc_cast_to_int((43 * d) / 67);
	a8ez = (43 * d) % 67;
	a8dr = tc_cast_to_int(((5 * d) + a8er) / 6);
	a8dz = ((5 * d) + a8er) % 6;
	a8cr = tc_cast_to_int(((21 * d) + a8dr) / 60);
	a8cz = ((21 * d) + a8dr) % 60;
	a8br = tc_cast_to_int(((4 * d) + a8cr) / 60);
	a8bz = ((4 * d) + a8cr) % 60;
	a8ar = tc_cast_to_int(a8br / 27);
	a8az = a8br % 27;

	// a9: nyi-bar (mean sun position)
	a9er = tc_cast_to_int((a4[4] + a8ez) / 67);
	a9ez = (a4[4] + a8ez) % 67;
	a9dr = tc_cast_to_int((a4[3] + a8dz + a9er) / 6);
	a9dz = (a4[3] + a8dz + a9er) % 6;
	a9cr = tc_cast_to_int((a4[2] + a8cz + a9dr) / 60);
	a9cz = (a4[2] + a8cz + a9dr) % 60;
	a9br = tc_cast_to_int((a4[1] + a8bz + a9cr) / 60);
	a9bz = (a4[1] + a8bz + a9cr) % 60;
	a9ar = tc_cast_to_int((a4[0] + a8az + a9br) / 27);
	a9az = (a4[0] + a8az + a9br) % 27;

	var a10sm = [ [ 0, 5 ], [ 5, 5 ], [ 10, 5 ], [ 15, 4 ], [ 19, 3 ],
			[ 22, 2 ], [ 24, 1 ], [ 25, 1 ], [ 24, 2 ], [ 22, 3 ],
			[ 19, 4 ], [ 15, 5 ], [ 10, 5 ], [ 5, 5 ] ];
	a10r = tc_cast_to_int((a5[0] + d) / 14);
	a10z = (a5[0] + d) % 14;
	a10s = a10sm[a10z][0];
	a10m = a10sm[a10z][1];

	a10a2r = tc_cast_to_int((a5[1] * a10m) / 126);
	a10a2z = (a5[1] * a10m) % 126;
	// a10a2 = (a5[1]*a10m)/126
	a10a3r = tc_cast_to_int((60 * a10a2z) / 126);
	a10a3z = (60 * a10a2z) % 126;
	// a10a3 = (60*a10a2z)/126
	a10a4r = tc_cast_to_int((6 * a10a3z) / 126);
	a10a4z = (6 * a10a3z) % 126;
	// a10a4 = (6*a10a3z)/126
	a10a5r = tc_cast_to_int((707 * a10a4z) / 126);
	a10a5z = (707 * a10a4z) % 126;
	// a10a5 = (707*a10a4z)/126
	// assert (a10a5z == 0);
	if (a10a5z != 0) {
		console.log("Internal Error");
	}

	if ((a10z >= 0) && (a10z <= 6)) {
		a10b2 = a10s + a10a2r;
		a10b3 = a10a3r;
		a10b4 = a10a4r;
		a10b5 = a10a5r;
	} else {
		a10b2 = a10s - a10a2r - 1;
		a10b3 = 59 - a10a3r;
		a10b4 = 5 - a10a4r;
		a10b5 = 707 - a10a5r;
	}

	// a10e: gza'-phyed dag-pa (half-corrected lunar weekday)
	if (a10r % 2 == 0) {
		a10c1 = a7az;
		a10c2 = a7bz + a10b2;
		a10c3 = a7cz + a10b3;
		a10c4 = a7dz + a10b4;
		a10c5 = a7ez + a10b5;
		if (a10c5 >= 707) {
			a10e5 = a10c5 - 707;
			a10d4 = a10c4 + 1;
		} else {
			a10e5 = a10c5;
			a10d4 = a10c4;
		}
		if (a10d4 >= 6) {
			a10e4 = a10d4 - 6;
			a10d3 = a10c3 + 1;
		} else {
			a10e4 = a10d4;
			a10d3 = a10c3;
		}
		if (a10d3 >= 60) {
			a10e3 = a10d3 - 60;
			a10d2 = a10c2 + 1;
		} else {
			a10e3 = a10d3;
			a10d2 = a10c2;
		}
		if (a10d2 >= 60) {
			a10e2 = a10d2 - 60;
			a10d1 = a10c1 + 1;
		} else {
			a10e2 = a10d2;
			a10d1 = a10c1;
		}
		if (a10d1 >= 7) {
			a10e1 = a10d1 - 7;
		} else {
			a10e1 = a10d1;
		}
	} else {
		a10c1 = a7az;
		a10c2 = a7bz - a10b2;
		a10c3 = a7cz - a10b3;
		a10c4 = a7dz - a10b4;
		a10c5 = a7ez - a10b5;
		if (a10b2 > a7bz) {
			a10e1 = a10c1 - 1;
			a10d2 = 60 + a10c2;
		} else {
			a10e1 = a10c1;
			a10d2 = a10c2;
		}
		if (a10b3 > a7cz) {
			a10e2 = a10d2 - 1;
			a10d3 = 60 + a10c3;
		} else {
			a10e2 = a10d2;
			a10d3 = a10c3;
		}
		if (a10b4 > a7dz) {
			a10e3 = a10d3 - 1;
			a10d4 = 6 + a10c4;
		} else {
			a10e3 = a10d3;
			a10d4 = a10c4;
		}
		if (a10b5 > a7ez) {
			a10e4 = a10d4 - 1;
			a10e5 = 707 + a10c5;
		} else {
			a10e4 = a10d4;
			a10e5 = a10c5;
		}
	}

	if (a9az < 6) {
		a9az1 = a9az + 27;
	} else {
		a9az1 = a9az;
	}
	if (a9bz < 45) {
		a9az2 = a9az1 - 1;
		a9bz1 = a9bz + 60;
	} else {
		a9az2 = a9az1;
		a9bz1 = a9bz;
	}
	a11a1 = a9az2 - 6;
	a11a2 = a9bz1 - 45;
	a11a3 = a9cz;
	a11a4 = a9dz;
	a11a5 = a9ez;
	if ((a11a1 >= 13) && (a11a2 >= 30)) {
		a11b1 = a11a1 - 13;
		a11b2 = a11a2 - 30;
	}
	if ((a11a1 > 13) && (a11a2 < 30)) {
		a11b1 = a11a1 - 14;
		a11b2 = a11a2 + 30;
	}
	if (((a11a1 == 13) && (a11a2 < 30)) || (a11a1 < 13)) {
		a11b1 = a11a1;
		a11b2 = a11a2;
	}
	a11b3 = a11a3;
	a11b4 = a11a4;
	a11b5 = a11a5;
	a11cr = tc_cast_to_int(((60 * a11b1) + a11b2) / 135);
	a11cz = ((60 * a11b1) + a11b2) % 135;
	var a11csm = [ [ 0, 6 ], [ 6, 4 ], [ 10, 1 ], [ 11, 1 ], [ 10, 4 ],
			[ 6, 6 ] ];
	// a11cs = a11csm[a11cr + 1,1];
	a11cs = a11csm[a11cr][0];
	// a11cm = a11csm[a11cr + 1,2];
	a11cm = a11csm[a11cr][1];
	a11d5r = tc_cast_to_int((a9ez * a11cm) / 67);
	a11d5z = (a9ez * a11cm) % 67;
	a11d4r = tc_cast_to_int(((a9dz * a11cm) + a11d5r) / 6);
	a11d4z = ((a9dz * a11cm) + a11d5r) % 6;
	a11d3r = tc_cast_to_int(((a9cz * a11cm) + a11d4r) / 60);
	a11d3z = ((a9cz * a11cm) + a11d4r) % 60;
	a11d2 = (a11cz * a11cm) + a11d3r;
	a11e2r = tc_cast_to_int(a11d2 / 135);
	a11e2z = a11d2 % 135;
	a11e3r = tc_cast_to_int(((60 * a11e2z) + a11d3z) / 135);
	a11e3z = ((60 * a11e2z) + a11d3z) % 135;
	a11e4r = tc_cast_to_int(((6 * a11e3z) + a11d4z) / 135);
	a11e4z = ((6 * a11e3z) + a11d4z) % 135;
	a11e5r = tc_cast_to_int(((67 * a11e4z) + a11d5z) / 135);
	a11e5z = ((67 * a11e4z) + a11d5z) % 135;
	// assert a11e5z == 0;
	if (a11e5z != 0) {
		console.log("Internal Error");
	}

	if ((a11cr >= 0) && (a11cr <= 2)) {
		a11f2 = a11cs + a11e2r;
		a11f3 = a11e3r;
		a11f4 = a11e4r;
		a11f5 = a11e5r;
	}
	if ((a11cr >= 3) && (a11cr <= 5)) {
		a11f2 = a11cs - a11e2r - 1;
		a11f3 = 59 - a11e3r;
		a11f4 = 5 - a11e4r;
		a11f5 = 67 - a11e5r;
	}

	// a12: nyi-dag (corrected sun position)
	// a13: gza'-dag (corrected lunar weekday)
	var a12 = [];
	var a13 = [];
	tc_cast_to_int(a10e5ar = (67 * a10e5) / 707);
	a10e5az = (67 * a10e5) % 707;

	if (((a11a1 >= 13) && (a11a2 >= 30)) || (a11a1 > 13)) {
		a11g1 = a9az;
		a11g2 = a9bz + a11f2;
		a11g3 = a9cz + a11f3;
		a11g4 = a9dz + a11f4;
		a11g5 = a9ez + a11f5;
		if (a11g5 >= 67) {
			a12[4] = a11g5 - 67;
			a11h4 = a11g4 + 1;
		} else {
			a12[4] = a11g5;
			a11h4 = a11g4;
		}
		if (a11h4 >= 6) {
			a12[3] = a11h4 - 6;
			a11h3 = a11g3 + 1;
		} else {
			a12[3] = a11h4;
			a11h3 = a11g3;
		}
		if (a11h3 >= 60) {
			a12[2] = a11h3 - 60;
			a11h2 = a11g2 + 1;
		} else {
			a12[2] = a11h3;
			a11h2 = a11g2;
		}
		if (a11h2 >= 60) {
			a12[1] = a11h2 - 60;
			a11h1 = a11g1 + 1;
		} else {
			a12[1] = a11h2;
			a11h1 = a11g1;
		}
		if (a11h1 >= 27) {
			a12[0] = a11h1 - 27;
		} else {
			a12[0] = a11h1;
		}
		a11i1 = a10e1;
		a11i2 = a10e2 + a11f2;
		a11i3 = a10e3 + a11f3;
		a11i4 = a10e4 + a11f4;
		a11i5 = a10e5ar + a11f5;
		a13[5] = a10e5az;
		if (a11i5 >= 67) {
			a13[4] = a11i5 - 67;
			a11j4 = a11i4 + 1;
		} else {
			a13[4] = a11i5;
			a11j4 = a11i4;
		}
		if (a11j4 >= 6) {
			a13[3] = a11j4 - 6;
			a11j3 = a11i3 + 1;
		} else {
			a13[3] = a11j4;
			a11j3 = a11i3;
		}
		if (a11j3 >= 60) {
			a13[2] = a11j3 - 60;
			a11j2 = a11i2 + 1;
		} else {
			a13[2] = a11j3;
			a11j2 = a11i2;
		}
		if (a11j2 >= 60) {
			a13[1] = a11j2 - 60;
			a11j1 = a11i1 + 1;
		} else {
			a13[1] = a11j2;
			a11j1 = a11i1;
		}
		if (a11j1 >= 7) {
			a13[0] = a11j1 - 7;
		} else {
			a13[0] = a11j1;
		}
	}
	if (((a11a1 == 13) && (a11a2 < 30)) || (a11a1 < 13)) {
		a11g1 = a9az;
		a11g2 = a9bz - a11f2;
		a11g3 = a9cz - a11f3;
		a11g4 = a9dz - a11f4;
		a11g5 = a9ez - a11f5;
		if (a11f2 > a9bz) {
			a12[0] = a11g1 - 1;
			a11h2 = 60 + a11g2;
		} else {
			a12[0] = a11g1;
			a11h2 = a11g2;
		}
		if (a11f3 > a9cz) {
			a12[1] = a11h2 - 1;
			a11h3 = 60 + a11g3;
		} else {
			a12[1] = a11h2;
			a11h3 = a11g3;
		}
		if (a11f4 > a9dz) {
			a12[2] = a11h3 - 1;
			a11h4 = 6 + a11g4;
		} else {
			a12[2] = a11h3;
			a11h4 = a11g4;
		}
		if (a11f5 > a9ez) {
			a12[3] = a11h4 - 1;
			a12[4] = 67 + a11g5;
		} else {
			a12[3] = a11h4;
			a12[4] = a11g5;
		}
		a11i1 = a10e1;
		a11i2 = a10e2 - a11f2;
		a11i3 = a10e3 - a11f3;
		a11i4 = a10e4 - a11f4;
		a11i5 = a10e5ar - a11f5 - 1;
		// a13[6] = 707-a10e5az;
		a13[5] = 707 - a10e5az;
		if (a11f2 > a10e2) {
			a13[0] = a11i1 - 1;
			a11j2 = 60 + a11i2;
		} else {
			a13[0] = a11i1;
			a11j2 = a11i2;
		}
		if (a11f3 > a10e3) {
			a13[1] = a11j2 - 1;
			a11j3 = 60 + a11i3;
		} else {
			a13[1] = a11j2;
			a11j3 = a11i3;
		}
		if (a11f4 > a10e4) {
			a13[2] = a11j3 - 1;
			a11j4 = 6 + a11i4;
		} else {
			a13[2] = a11j3;
			a11j4 = a11i4;
		}
		if ((a11f5 - 1) > a10e5ar) {
			a13[3] = a11j4 - 1;
			a13[4] = 67 + a11i5;
		} else {
			a13[3] = a11j4;
			a13[4] = a11i5;
		}
	}
	var a9 = [ a9az, a9bz, a9cz, a9dz, a9ez ];
	var aRetval = [ a12, a13, a9 ];
	var aUnits = [ [ 27, 60, 60, 6, 67 ], [ 7, 60, 60, 6, 67, 707 ] ];

	for (ii = 0; ii <= 1; ii += 1) {
		for (jj = aRetval[ii].length - 1; jj >= 0; jj -= 1) {
			if (aRetval[ii][jj] < 0) {
				aRetval[ii][jj] += aUnits[ii][jj];
				if (jj != 0) {
					aRetval[ii][jj - 1] -= 1;
				}
			}
		}
	}
	return a13[0];
}

/**
 * check_td_to_gd: test Tibetan -> Gregorian conversion for dates
 * surrounding the special cases listed in tc_add_n_days() and
 * tc_sub_n_days()
 */
function check_td_to_gd() {
	// testcases: a list of testcase structures. Each testcase
	// structure is composed of a Tibetan date and the corresponding
	// list of western date strings.
	//
	// testcase[0]: [rabjung, year, month, day]
	// testcase[1]: list of western date strings
	var testcases = [
		[[2,14,2,16],["1100-02-28"]],
		[[2,14,2,17],[null]],
		[[2,14,2,18],["1100-02-28"]],
		[[2,14,2,19],["1100-03-01"]],

		[[5,34,2,8],["1300-02-28"]],
		[[5,34,2,9],["1300-02-28"]],
		[[5,34,2,10],["1300-03-01"]],

		[[7,14,2,3],["1400-02-28"]],
		[[7,14,2,4],["1400-02-28"]],
		[[7,14,2,5],["1400-03-01"]],

		[[8,54,1,29],["1500-02-28"]],
		[[8,54,1,30],["1500-02-28"]],
		[[8,54,2,1],["1500-03-01"]],

		[[10,16,9,17],["1582-10-03"]],
		[[10,16,9,18],["1582-10-04"]],
		[[10,16,9,19],["1582-10-15"]],
		[[10,16,9,20],["1582-10-16"]]
	];
	
	var tno; // testcase number
	for (tno = 0; tno < testcases.length; tno += 1) {
		var td_info = testcases[tno][0];
		var expected_wds = testcases[tno][1];
		var actual_wd_list = tc_get_gregorian_dates_for_tibetan_date(
			td_info[0], td_info[1], td_info[2], td_info[3]);
		
		var wdno; // western date number
		for (wdno = 0; wdno < expected_wds.length; wdno += 1) {
			var expected_wd = expected_wds[wdno];
			var actual_wd;
			if (actual_wd_list[wdno].westernDate == null) {
				actual_wd = null;
			} else {
				actual_wd = $.datepicker.formatDate('yy-mm-dd',
						actual_wd_list[wdno].westernDate);
			}
			if (actual_wd != expected_wd) {
				console.log("check_td_to_gd: dates do not match");
				console.log(testcases[tno]);
			}
		}
	}
}

/**
 * check_gd_to_td: test Gregorian -> Tibetan conversion
 */
function check_gd_to_td() {
	// testcases: a list of testcase structures. Each testcase
	// structure is composed of a Gregorian date and the
	// corresponding Tibetan date.
	//
	// testcase[0]: [Year, Month, Day]
	// testcase[1]: [Rabjung, Year, Month, monthFlag, Day]
	var testcases = [
		[[1582,9,25], [10,16,9,0,29]],
		[[1900,0,1], [15,33,11,1,30]],
		[[1900,0,2], [15,33,11,2,1]],
		[[1500,1,28], [8,54,1,0,29]],
		[[1500,2,1], [8,54,2,0,1]],
	];
	var tno;
	for (tno = 0; tno < testcases.length; tno += 1) {
		var gd_info = testcases[tno][0];
		var td_info = testcases[tno][1];
		var actual_td = tc_get_tibetan_date_for_gregorian_date(
				new Date(gd_info[0], gd_info[1], gd_info[2]));
		var expected_td = make_tibdate(td_info[0], td_info[1],
				td_info[2], td_info[3], td_info[4]);
		if (! tibdate_equal(expected_td, actual_td)) {
			console.log("check_gd_to_td: dates do not match");
			console.log(testcases[tno]);
		}
	}
}

/**
 * check_tmi_records: verify that the Tibetan Month Info records are
 * correct for certain dates
 */
function check_tmi_records() {
	// testcases: a list of testcase structures. Each testcase
	// structure is composed of a Tibetan month info record locator
	// and the corresponding western date string
	//
	// testcase[0]: [rabjung, year, month, monthFlag]
	// testcase[1]: western date string
	var testcases = [
		[[1,1,1,0],"1027-01-11"],

		[[2,14,2,0], "1100-02-12"],
		[[2,14,3,0], "1100-03-13"],

		[[5,34,2,0], "1300-02-22"],
		[[5,34,3,0], "1300-03-22"],

		[[7,14,2,0], "1400-02-26"],
		[[7,14,3,0], "1400-03-26"],

		[[8,54,1,0], "1500-01-31"],
		[[8,54,2,0], "1500-03-01"],

		[[10,16,9,0], "1582-09-17"],
		[[10,16,10,0], "1582-10-27"],

		[[15,33,12,0], "1900-01-31"],
	];
	
	var tno;

	for (tno = 0; tno < testcases.length; tno += 1) {
		var rec_loc = testcases[tno][0];
		var expected_wd = testcases[tno][1];
		var tmi_rec = tc_get_record(rec_loc[0], rec_loc[1],
				rec_loc[2], rec_loc[3]);
		var actual_wd = $.datepicker.formatDate('yy-mm-dd',
				tmi_rec.westernDate);
		if (actual_wd != expected_wd) {
			console.log("check_tmi_records: dates do not match");
			console.log(testcases[tno]);
		}
	}
}

function getURLParameter(name) {
    return decodeURI(
        (RegExp(name + '=' + '(.+?)(&|$)').exec(location.search)||[,""])[1]
    );
}


function tibdate_loaded() {
	set_tibdate_tclzn_english();
	set_tibdate_tclzn();

	var rabjung_label = textpool_get_text("lbl_rabjung");
	var rabjung_div = make_div("",
			rabjung_label + " " + rabjung_select());

	var tibyear_label = textpool_get_text("lbl_tibyear");
	var tibyear_div = make_div("",
			tibyear_label + " " + tibyear_select());

	var tibmonth_label = textpool_get_text("lbl_tibmonth");
	var tibmonth_div = make_div("",
			tibmonth_label + " " + tibmonth_select());

	var tibday_label = textpool_get_text("lbl_tibday");
	var tibday_div = make_div("",
			tibday_label + " " + tibday_select());

	var td2gd_readout_div = make_div("td2gd_readout");

	var td2gd_control_list = [rabjung_div, tibyear_div,
		tibmonth_div, tibday_div, td2gd_readout_div];

	// Add debug console
	if (getURLParameter('debug')) {
		var debug_div = make_div("tibdate_debug");
		td2gd_control_list.push(debug_div);
	}

	var gd2td_readout_div = make_div("gd2td_readout");

	var gregdate_label = textpool_get_text("choose_date");
	var gregdate_div = ("<p>" + gregdate_label +
			'<input type="text" ' +
			'id="greg_datepicker" /></p>');

	var gd2td_control_list = [gregdate_div, gd2td_readout_div];

	var td2gd_controls = make_div("", td2gd_control_list);
	var gd2td_controls = make_div("", gd2td_control_list);
	var td2gd_label = textpool_get_text("convert_tib_greg");
	var gd2td_label = textpool_get_text("convert_greg_tib");
	var td_tabs_html = (
		'<ul><li><a href="#td2gd">' + 
		td2gd_label +
		'</a></li><li><a href="#gd2td">' +
		gd2td_label +
		'</a></li></ul>' +
		make_div("td2gd", td2gd_controls) +
		make_div("gd2td", gd2td_controls));

	$("#tibdate_container").html(td_tabs_html);

	// do all pre-calcuations
	tc_calculate_normal_system();
	tc_normal_system_add_skipped_and_doubled();
	tc_add_western_dates();

	// Set up UI elements
	$('#tibdate_container').tabs();
	$('#greg_datepicker').datepicker({onSelect: gd_changed});

	if (getURLParameter('debug')) {
		check_tmi_records();
		check_td_to_gd();
		check_gd_to_td();
	}
}
