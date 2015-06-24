'use strict'
	 /* Cross filter debug utility 
     	reference : http://www.codeproject.com/Articles/693841/Making-Dashboards-with-Dc-js-Part-Using-Crossfil
     */
	function print_filter(filter){
		var f=eval(filter);
		if (typeof(f.length) != "undefined") {}else{}
		if (typeof(f.top) != "undefined") {f=f.top(Infinity);}else{}
		if (typeof(f.dimension) != "undefined") {f=f.dimension(function(d) { return "";}).top(Infinity);}else{}
		console.log(filter+"("+f.length+") = "+JSON.stringify(f).replace("[","[\n\t").replace(/}\,/g,"},\n\t").replace("]","\n]"));
	}



// load the csv data
d3.csv("data/sample1-datafile.csv", function (data) {

    //Check data import
    //print_filter(data);
	
    // Melt the data to separate city registration data per year
	var newdata = melt(data,["city"],"year");
	
    //print_filter(newdata);
	var parseDate = d3.time.format("%Y").parse;
	newdata.forEach(function(d) {
		d.date = parseDate(d.year);
		d.city = d.city;
		d.value = isNaN(d.value) ? 0 : +d.value;
		d.year = d.date.getFullYear();
	});
	
	var ndx = crossfilter(newdata);
	
	var all = ndx.groupAll();
	// Create dimensions
	var dateDim = ndx.dimension(function(d) {return d.year;});
	var yearDim = ndx.dimension(function(d) {return d.year;});
	var minDate = dateDim.bottom(1)[0].year;
	var maxDate = dateDim.top(1)[0].year;
	//print_filter(minDate);
	//print_filter(maxDate);

	// Reduce data by group
	var year_total = dateDim.group().reduceSum(function(d) {return d.value;});
	var delhi=dateDim.group().reduceSum(function(d) {if (d.city==="Delhi") {return d.value;}else{return 0;}});
	var mumbai=dateDim.group().reduceSum(function(d) {if (d.city==="Mumbai") {return d.value;}else{return 0;}});
	var hyderabad=dateDim.group().reduceSum(function(d) {if (d.city==="Hyderabad") {return d.value;}else{return 0;}});
	var chennai=dateDim.group().reduceSum(function(d) {if (d.city==="Chennai") {return d.value;}else{return 0;}});
	var kolkata=dateDim.group().reduceSum(function(d) {if (d.city==="Kolkata") {return d.value;}else{return 0;}});
	var pune=dateDim.group().reduceSum(function(d) {if (d.city==="Pune") {return d.value;}else{return 0;}});
	//print_filter(year_total);
	//print_filter(delhi);
	
	// Label creation function
	function getvalues(d){
		var str=d.key+":"+d.value+"\n";
		return str;
	}
	
	// Reduce function for city wise totals and avg per year
	var flatMapGroup = dateDim.group().reduce(
	  function (p,v) {
		++p.count;
		p[v.city] = isNaN(v.value) ? 0 : +v.value;
		p["total"] += 	p[v.city];
		p["avg"] = Math.round(p["total"]/p.count);
		return p;
	  },
	  function (p,v) {
		--p.count;
		
		p["total"] -= p[v.city];
		p[v.city] = 0;
		p["avg"] = p["total"]/p.count;
		
		return p;
	  },
	  function () { return {count:0,avg:0,total:0}; }
	  ); 
	
	//print_filter(flatMapGroup);
	 
	var yearChart  = dc.lineChart("#year-time-chart");
	
	var moveChart  = dc.lineChart("#chart-line-regperyear");
	moveChart.yAxis().tickFormat(function(v) {return v/1000 + "M";});
	moveChart
        .renderArea(true)
        .width(500)
        .height(200)
        .transitionDuration(1000)
        .margins({top: 30, right: 50, bottom: 30, left: 40})
        .dimension(dateDim)
	//  .colorDomain([0, 6000])
	//	.colors(d3.scale.category20b())
	//	.colorAccessor(function (d) {
    //         return d.value;
    //   })
		.brushOn(false)
		.mouseZoomable(true)
		.elasticX(true)
		.elasticY(true)
		.group(delhi,"Delhi")
		.stack(mumbai,"Mumbai")
		.stack(chennai,"Chennai")
		.stack(kolkata,"Kolkata")
		.stack(pune,"Pune")
		.stack(hyderabad,"Hyderabad")		
		.x(d3.scale.linear().domain([minDate, maxDate]).range([0,50]))
		.legend(dc.legend().x(50).y(10).itemHeight(13).gap(5).horizontal(true))
		.yAxisLabel("Vehicles Registered")
		.xAxisLabel('Years')
		//.yAxisPadding(100)
		.title(function(d){ return getvalues(d);} )
		.xAxis().tickFormat(function (v) {
		  return v;
		});

		
	var yearRingChart   = dc.pieChart("#chart-ring-year");
		yearRingChart
		.width(500).height(250)
//		.colors(d3.scale.category20b())
		.dimension(yearDim)
		.group(year_total)
		.innerRadius(50); 
				
	yearChart.yAxis().tickFormat(function(v) {return v/1000 + "M";});
	yearChart
        .width(500)
        .height(250)
        .transitionDuration(500)
        .margins({top: 10, right: 50, bottom: 30, left: 40})
        .dimension(yearDim)
		.elasticY(true)
        .elasticX(true)
		.group(year_total,"total")
		.x(d3.scale.linear().domain([minDate, maxDate]).range([0,50]))
		.yAxisLabel("Vehicles Registered")
		.xAxisLabel('Years')
		.title(function(d){ return getvalues(d);} )
		.xAxis().tickFormat(function (v) {
		  return v;
		});
	
	
	var yearlyAvgBubbleChart = dc.bubbleChart('#year-avg-chart');
    yearlyAvgBubbleChart
        .width(500) // (optional) define chart width, :default = 200
        .height(250)  // (optional) define chart height, :default = 200
        .transitionDuration(1500) // (optional) define chart transition duration, :default = 750
        .margins({top: 10, right: 50, bottom: 30, left: 40})
        .dimension(yearDim)
		.group(flatMapGroup)
        .colors(colorbrewer.RdYlGn[9]) // (optional) define color function or array for bubbles
        .colorDomain([300, 1000])
		.colorAccessor(function (d) {
              return d.value.avg;
         })
        .keyAccessor(function (p) {
            return p.value.total;
        })
        .valueAccessor(function (p) {
            return p.value.avg;
        })
        .radiusValueAccessor(function (p) {
            return p.value.avg;
        })
		.maxBubbleRelativeSize(0.25)
        .x(d3.scale.linear().domain([2001, 2015]))
        .y(d3.scale.linear().domain([0, 1000]))
        .r(d3.scale.linear().domain([300, 6000]).range([0,50]))
		.elasticY(true)
        .elasticX(true)
        .yAxisPadding(100)
        .xAxisPadding(500)
        .renderHorizontalGridLines(true) // (optional) render horizontal grid lines, :default=false
        .renderVerticalGridLines(true) // (optional) render vertical grid lines, :default=false
        .xAxisLabel('Registration Total') // (optional) render an axis label below the x axis
        .yAxisLabel('Registration Average')
		.renderLabel(true) // (optional) whether chart should render labels, :default = true
        .label(function (p) {
            return p.key;
        })
		.yAxis().tickFormat(function (v) {return v/1000 + "M";});
 
				
	var dataCountWidget   = dc.dataCount("#dc-data-count")
	dataCountWidget
		.dimension(ndx)
		.group(all);
	

	var datatable   = dc.dataTable("#registration-table-graph");
	datatable
		.dimension(flatMapGroup)
		.group(function(d) { return "Vehical registrations in million"
		})
		//.group(function(d) {return d.key;})
		// dynamic columns creation using an array of closures
		.columns([
			function(d) { return d.key; },
			function(d) {return d.value.Delhi;},
			function(d) {return d.value.Mumbai;},
			function(d) {return d.value.Chennai;},        
			function(d) {return d.value.Kolkata;},
			function(d) {return d.value.Pune;},
			function(d) {return d.value.Hyderabad;},
			function(d) {return d.value.Delhi+d.value.Mumbai+d.value.Chennai+d.value.Kolkata+d.value.Pune+d.value.Hyderabad;}
		]).sortBy(function (d) {
        return d.key;
		}).order(d3.descending); ;
	   
	dc.renderAll();
		
});