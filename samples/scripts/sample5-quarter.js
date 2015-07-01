'use strict'
/*
 * Cross filter debug utility reference :
 * http://www.codeproject.com/Articles/693841/Making-Dashboards-with-Dc-js-Part-Using-Crossfil
 */
function print_filter(filter) {
	var f = eval(filter);
	if (typeof (f.length) != "undefined") {
	} else {
	}
	if (typeof (f.top) != "undefined") {
		f = f.top(Infinity);
	} else {
	}
	if (typeof (f.dimension) != "undefined") {
		f = f.dimension(function(d) {
			return "";
		}).top(Infinity);
	} else {
	}
	console.log(filter
			+ "("
			+ f.length
			+ ") = "
			+ JSON.stringify(f).replace("[", "[\n\t").replace(/}\,/g, "},\n\t")
					.replace("]", "\n]"));
}

// Label creation function
function getvalues(d) {
	var str = d.key + "\nTotal:" + d.value;
	return str;
}

//Label creation function
function getStatusCode(d) {
	
	//var str = d.key + "\nTotal:" + d.value;
	//return str;
	return d.key;
}

// var dataTable = dc.dataTable("#eq-table");
var yearlyPieChart = dc.pieChart("#year-pie");
var quarterlyPieChart = dc.pieChart("#quarter-pie");
var statusPieChart   = dc.pieChart("#status-pie")
var dayOfWeekChart = dc.rowChart('#day-of-week-chart');
var dataCountWidget = dc.dataCount("#dc-data-count");
var dailyHitsLineChart = dc.lineChart("#hits-per-day");
var dailyHitsTable = dc.dataTable("#hits-table");
var trDuration=500;
var url = "data/monitoring-log.csv";
var date_format = "%d-%m-%Y";

var render = function() {
	// load the json data
	d3.csv(url, function(data) {

		// print_filter(data);
		var newdata = melt(data, [ "date" ], "status");

		var parseDate = d3.time.format(date_format).parse;
		//print_filter(newdata);
		newdata.forEach(function(d) {
			d.fulldate = parseDate(d.date);
			d.month = d.fulldate.getMonth();
			d.day = d.fulldate.getDay();
			d.year = d.fulldate.getFullYear();
			d.http_404 = +d.http_404;
			d.http_200 = +d.http_200;
			d.http_302 = +d.http_302;
			d.http_500 = +d.http_500;
			d.http_503 = +d.http_503;
			d.http_403 = +d.http_403;
			d.http_401 = +d.http_401;
		});

		var ndx = crossfilter(newdata);

		// print_filter(newdata);
		// dc.renderAll();

		
		// Date dimension
		var dateDim = ndx.dimension(function(d) {
			return d.fulldate;
		});
		print_filter(dateDim);
		var minDate = dateDim.bottom(1)[0].date;
		var maxDate = dateDim.top(1)[0].date;
		
		// Year dimension
		var yearDim = ndx.dimension(function(d) {
			return d.year;
		});

		// Yearly total of status responses
		var yearGroup = yearDim.group().reduceSum(function(d) {
			return d.value;
		});

		//print_filter(yearGroup);

		// Quarter dimension
		var quarterDim = ndx.dimension(function(d) {
			var month = d.month;
			if (month <= 2) {
				return 'Q1';
			} else if (month > 2 && month <= 5) {
				return 'Q2';
			} else if (month > 5 && month <= 8) {
				return 'Q3';
			} else {
				return 'Q4';
			}
		});

		// Quarter summary
		var quarterGroup = quarterDim.group().reduceSum(function(d) {
			return d.value;
		});

		//print_filter(quarterGroup);
		// Day of Week
		var dayOfWeek = ndx.dimension(function(d) {
			var day = d.day;
			var name = [ 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat' ];
			return day + '.' + name[day];
		});
		//print_filter(dayOfWeek);
		var dayOfWeekGroup = dayOfWeek.group();
		//print_filter(dayOfWeekGroup);

		
		var statusDim  = ndx.dimension(function(d) {return d.status;});
		var statusGroup = statusDim.group().reduceSum(function(d) {return +d.value;});
		var status_200=dateDim.group().reduceSum(function(d) 
				{if (d.status==='http_200') {return +d.value;}else{return 0;}});
		var status_302=dateDim.group().reduceSum(function(d) 
				{if (d.status==='http_302') {return +d.value;}else{return 0;}});
		var status_404=dateDim.group().reduceSum(function(d) 
				{if (d.status==='http_404') {return +d.value;}else{return 0;}}); 
		var status_500=dateDim.group().reduceSum(function(d) 
				{if (d.status==='http_500') {return +d.value;}else{return 0;}}); 
		var status_503=dateDim.group().reduceSum(function(d) 
				{if (d.status==='http_503') {return +d.value;}else{return 0;}}); 
		var status_403=dateDim.group().reduceSum(function(d) 
				{if (d.status==='http_403') {return +d.value;}else{return 0;}}); 
		var status_401=dateDim.group().reduceSum(function(d) 
				{if (d.status==='http_401') {return +d.value;}else{return 0;}}); 
		
		var tableGroup = dateDim.group().reduce(
				  function (p,v) {
					p[v.status] = +v.value;
					p["year"]= v.year;
					return p;
				  },
				  function (p,v) {
					p[v.status] = 0;
					p["year"]=v.year;
					return p;
				  },
				  function () { return {}; }
				  ); 
		print_filter(tableGroup);
		
		yearlyPieChart
			.width(180)
			.height(180)
			.transitionDuration(trDuration)
			.radius(80)
			.innerRadius(30)
	        .colors(d3.scale.category20()) 
			.dimension(yearDim)
			.group(yearGroup);

		quarterlyPieChart
			.width(180)
			.transitionDuration(trDuration)
			.height(180)
			.radius(80)
			.innerRadius(30)
	        .colors(d3.scale.category20()) 
			.dimension(quarterDim)
			.group(quarterGroup);

		statusPieChart
			.width(180)
			.transitionDuration(trDuration)
			.height(180)
			.radius(80)
			.innerRadius(30)
			.dimension(statusDim)
			.colors(d3.scale.category20()) 
			.group(statusGroup)
			.label(function (d) {
				 return d.key.split('_')[1];
			 })
			.title(function (d) {
	        	return d.key.split('_')[1]+":"+d.value;
	        });
		
		 dayOfWeekChart.width(180)
	        .height(180)
	        .transitionDuration(trDuration)
	        .margins({top: 20, left: 10, right: 10, bottom: 20})
	        .group(dayOfWeekGroup)
	        .dimension(dayOfWeek)
	        .colors(d3.scale.category20()) 
	        .label(function (d) {
	        	return d.key.split('.')[1];
	        })
	        .title(function (d) {
	        	return d.value;
	        })
	        .elasticX(true)
	        .xAxis().ticks(4);
		
		//print_filter(status_200);
		dailyHitsLineChart
		   .width(960).height(300)
		   .transitionDuration(trDuration)
		   .dimension(dateDim)
		   .group(status_500,"500")
		   .stack(status_503,"503")
		   .stack(status_401,"401")
		   .stack(status_403,"403")
		   .stack(status_404,"404")
		   .stack(status_302,"302")
		   .stack(status_200,"200")
		   .renderArea(true)
		   .x(d3.time.scale().domain([minDate,maxDate]))
		   .colors(d3.scale.category20())       
		   .brushOn(false)
		   .elasticX(true)
		   .elasticY(true)
		   .yAxisLabel("Hits per day")
		   .margins({ top: 10, left: 70, right: 10, bottom: 50 })    
		   .renderlet(function (chart) {chart.selectAll("g.x text").attr('dx', '-30').attr(
			  'dy', '-7').attr('transform', "rotate(-90)");})
			.legend(dc.legend().x(80).y(10).itemHeight(10).gap(3).horizontal(true))
		   .title(function(d){ return getvalues(d);} ) ;


		dailyHitsTable
			.dimension(tableGroup)
			.group(function(d) { return d.value.year;}) // dynamic columns creation using an array of closures
			.columns([
				function(d) { return d.key.getDate() + "/" + 
					 (d.key.getMonth() + 1) + "/" + d.key.getFullYear(); },
				function(d) {return d.value.http_200;},
				function(d)  {return d.value.http_302;},
				function(d) {return d.value.http_401;}, 
				function(d)  {return d.value.http_403;},
				function(d)  {return d.value.http_404;},
				function(d)  {return d.value.http_500;},
				function(d)  {return d.value.http_503;},
				function(d) {return d.value.http_200 + d.value.http_302 + d.value.http_401 + d.value.http_403 +	d.value.http_404 +	d.value.http_500 +	d.value.http_503;}
				])
			.sortBy(function (d) {
		    return d.key;
			}).order(d3.descending); 
		var all = ndx.groupAll();
		dataCountWidget.dimension(ndx).group(all);
		dc.renderAll();
	});
}
render();
