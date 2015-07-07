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

	
	// Label creation function
	function getvalues(d){
		var str=d.key+"\nTotal:"+d.value;
		return str;
	}

//var dataTable = dc.dataTable("#eq-table");
var magnitudeChart = dc.barChart("#eq-chart");
var lineChart  = dc.lineChart("#eq-timechart");
var depthChart = dc.barChart("#eq-depthchart");
var eventtable   = dc.dataTable("#eq-eventtable");
var dataCountWidget   = dc.dataCount("#dc-data-count")

var refeshData = function () {
	// load the json data
	d3.json("http://earthquake-report.com/feeds/recent-eq?json", function (data) {
		
		var currentdate = new Date();

		//print_filter(data);
		var parseDate = d3.time.format.utc("%Y-%m-%dT%H:%M:%S+00:00").parse;
		//console.log(currentdate);
		d3.select('#refreshDate').text(currentdate).style('color','blue');
		data.forEach(function(d) {
			d.date_time = parseDate(d.date_time);
			d.radius = +d.magnitude*2;
			d.fillKey = function (d) { 
				if (+d.magnitude < 3.5) {
					return 'L3'; 
				} else if (+d.magnitude > 3.5 && +d.magnitude < 5) {
					return 'L2';
				} else return 'L1';
			};
		});
		
		//print_filter(data);
		var ndx = crossfilter(data);
		var all = ndx.groupAll();
		var magValue = ndx.dimension(function (d) {
		    return +d.magnitude;
		  });
	 
		
		var hourDim = ndx.dimension(function (d) {
		    return d3.time.hour(d.date_time);
		  });
		//print_filter(hourDim);
		var depthDim = ndx.dimension(function (d) {
			return +d.depth;
		});
		//print_filter(depthDim);
		var volumeByHourGroup = hourDim.group()
		    .reduceCount(function(d) { return d.date_time; });
		 
		var magValueGroupCount = magValue.group()
		    .reduceCount(function(d) { return d.magnitude; }) // counts 

		var depthValueGroupCount = depthDim.group()
		    .reduceCount(function(d) { return d.depth; }) // counts
		//print_filter(depthValueGroupCount);
		var minMag = magValue.bottom(1)[0].magnitude;
		var maxMag = magValue.top(1)[0].magnitude;
		
		var minDate = hourDim.bottom(1)[0].year;
		var maxDate = hourDim.top(1)[0].year;
		
		var minDepth = depthDim.bottom(1)[0].depth;
		var maxDepth = depthDim.top(1)[0].depth;
		//print_filter(magValueGroupCount.bottom);
		magnitudeChart.width(480)
		    .height(200)
		    .margins({top: 10, right: 10, bottom: 30, left: 40})
		    .dimension(magValue)
		    .group(magValueGroupCount)
		    .transitionDuration(500)
		    .centerBar(true)    
		    .gap(65)
		//  .colorDomain([minMag, maxMag])
		//	.colors(d3.scale.category20())
		//	.colorAccessor(function (d) {
	    //         return d.value;
		//	})
		   // .filter([3, 5])
		    .x(d3.scale.linear().domain([0.5, 7.5]))
		   // .y(d3.scale.linear().domain([1, 15]))
		    .renderlet(function(chart){
		    	// Thanks to http://stackoverflow.com/questions/25026010/show-values-on-top-of-bars-in-a-barchart
			    var barsData = [];
			    var bars = chart.selectAll('.bar').each(function(d) { barsData.push(d); });
			
			    //Remove old values (if found)
			    d3.select(bars[0][0].parentNode).select('#inline-labels').remove();
			    //Create group for labels 
			    var gLabels = d3.select(bars[0][0].parentNode).append('g').attr('id','inline-labels');
			
			    for (var i = bars[0].length - 1; i >= 0; i--) {
			
			        var b = bars[0][i];
			        //Only create label if bar height is tall enough
			        if (+b.getAttribute('height') < 18) continue;
			
			        gLabels
			            .append("text")
			            .text(barsData[i].data.value)
			            .attr('x', +b.getAttribute('x') + (b.getAttribute('width')/2) )
			            .attr('y', +b.getAttribute('y') - 5)
			            .attr('text-anchor', 'middle')
			            .attr('fill', 'black');
			    }
			
			})
		    .elasticY(true)
		    .title(function(d){ return getvalues(d);} )
		    .xAxis().tickFormat();

		depthChart.width(480)
		    .height(200)
		    .mouseZoomable(false)
		    .margins({top: 10, right: 10, bottom: 30, left: 40})
		    .dimension(depthDim)
		    .group(depthValueGroupCount)
		    .transitionDuration(500)
		    .centerBar(true)    
		//    .gap(65)
		//  .colorDomain([minMag, maxMag])
		//	.colors(d3.scale.category20())
		//	.colorAccessor(function (d) {
		//         return d.value;
		//	})
		   // .filter([3, 5])
		    .x(d3.scale.linear().domain([minDepth, maxDepth]))
		   // .y(d3.scale.linear().domain([1, 15]))
		    .renderlet(function(chart){
		    	// Thanks to http://stackoverflow.com/questions/25026010/show-values-on-top-of-bars-in-a-barchart
			    var barsData = [];
			    var bars = chart.selectAll('.bar').each(function(d) { barsData.push(d); });
			
			    //Remove old values (if found)
			    d3.select(bars[0][0].parentNode).select('#inline-labels').remove();
			    //Create group for labels 
			    var gLabels = d3.select(bars[0][0].parentNode).append('g').attr('id','inline-labels');
			
			    for (var i = bars[0].length - 1; i >= 0; i--) {
			
			        var b = bars[0][i];
			        //Only create label if bar height is tall enough
			        if (+b.getAttribute('height') < 18) continue;
			
			        gLabels
			            .append("text")
			            .text(barsData[i].data.value)
			            .attr('x', +b.getAttribute('x') + (b.getAttribute('width')/2) )
			            .attr('y', +b.getAttribute('y') - 5)
			            .attr('text-anchor', 'middle')
			            .attr('fill', 'black');
			    }
			
			})
		    .elasticY(true)
		    .title(function(d){ return getvalues(d);} )
		    .xAxis().tickFormat();
		
//		lineChart.yAxis().tickFormat(function(v) {return v/1000 + "M";});
		lineChart
	      	.width(960)
	        .height(200)
	        .transitionDuration(500)
		    .margins({top: 10, right: 10, bottom: 30, left: 40})
	        .dimension(hourDim)
			.brushOn(true)
			.mouseZoomable(true)
			.elasticX(true)
			.elasticY(true)
			.group(volumeByHourGroup,"Volume per Hour")		
			.x(d3.time.scale().domain([minDate, maxDate]))
			//.legend(dc.legend().x(50).y(10).itemHeight(13).gap(5).horizontal(true))
			.yAxisLabel("count")
			.xAxisLabel('hours')
			//.yAxisPadding(100)
			.title(function(d){ return getvalues(d);} )
			.xAxis().tickFormat();
		
		eventtable
			.dimension(hourDim)
			.group(function(d) { return "Earthquake data"
			})
			// dynamic columns creation using an array of closures
			.columns([
				function(d) { return d.date_time; },
				function(d) {return d.location;},
				function(d) {return d.magnitude;},
				function(d) {return d.depth;},        
				function(d) {return d.latitude;},
				function(d) {return d.longitude;}
				]).sortBy(function (d) {
		    return d.date_time;
			}).order(d3.descending); 
		
		dataCountWidget
			.dimension(ndx)
			.group(all);
		dc.renderAll();
		//print_filter(hourDim);
		   // var map = new Datamap({element: document.getElementById('container')});
		 var map = new Datamap({
		        element: document.getElementById('eq-map'),
		        scope: 'world',
		        fills: {
		        	'L1': 'red',
		        	'L2': 'green',
		        	'L3': 'yellow',
		            defaultFill: 'rgba(23,48,210,0.9)' //any hex, color name or rgb/rgba value
		        },
		        projection: 'equirectangular'
		    });
		 map.bubbles([]);
		 map.bubbles(data,{
			    popupTemplate: function (geo, data) { 
		            return ['<div class="hoverinfo">' +  data.location,
		            '<br/>Magnitude: ' +  data.magnitude,
		            '<br/>Depth: ' +  data.depth + '',
		            '<br/>Date: ' +  data.date_time + '',
		            '</div>'].join('');
		    }
		 });
});
}
refeshData();
setInterval(refeshData,600000);
