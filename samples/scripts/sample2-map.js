'use strict'
function print_filter(filter){
		var f=eval(filter);
		if (typeof(f.length) != "undefined") {}else{}
		if (typeof(f.top) != "undefined") {f=f.top(Infinity);}else{}
		if (typeof(f.dimension) != "undefined") {f=f.dimension(function(d) { return "";}).top(Infinity);}else{}
		console.log(filter+"("+f.length+") = "+JSON.stringify(f).replace("[","[\n\t").replace(/}\,/g,"},\n\t").replace("]","\n]"));
} 

// define bubble chart and get a handle
//var yearlyBubbleChart = dc.bubbleChart('#referrals-bubble-chart');
 d3.csv("data/us-state-capital-population.csv", function (data) {
 
	data.forEach(function(d) {
		d.longitude = +d.longitude;
		d.latitude = +d.latitude;
		d.gdp = +d.gdp;
		d.abbrev = d.abbrev;
	});
	var ndx = crossfilter(data);
	var usChart = dc.geoChoroplethChart("#us-chart");
	var states = ndx.dimension(function (d) {
            return d.abbrev;
        });
	

	
	var statePopulation = states.group().reduceSum(function (d) {
            return isNaN(d.population) ? 0 : +d.population;
        });
	
	var stateGDP = states.group().reduce(
		  function (p,v) {
				p["gdp"] = v.gdp;
				p["population"] += 	+v.population;
				return p;
			  },
			  function (p,v) {
				p["gdp"] = 0;
				p["population"] -= 	+v.population;
			
				return p;
			  },
			  function () { return {gdp:0,population:0}; 
		}
	); 
	
	print_filter(stateGDP);
	var gdpChart  = dc.bubbleChart("#us-gdp");
	
	var minPop = states.bottom(1)[0].population;
	var maxPop = states.top(1)[0].population;
	var minGdp = states.bottom(1)[0].gdp;
	var maxGdp = states.top(1)[0].gdp;
	d3.json("data/us-states.json", function (statesJson) {
            usChart.width(990)
                    .height(500)
                    .dimension(states)
                    .group(statePopulation)
					//.colors(d3.scale.quantize().range(["#E2F2FF", "#C4E4FF", "#9ED2FF", "#81C5FF", "#6BBAFF", "#51AEFF", "#36A2FF", "#1E96FF", "#0089FF", "#0061B5"]))
                    .colors(colorbrewer.RdYlGn[9]) 
					.colorDomain([minPop, maxPop])
					.colorCalculator(function (d) { return d ? usChart.colors()(d) : '#ccc'; })
                    .overlayGeoJson(statesJson.features, "state", function (d) {
                        return d.properties.name;
                    })
					.legend(dc.legend().x(50).y(10).itemHeight(13).gap(5))
                    .title(function (d) {
                        return "State: " + d.key + "\nTotal Population: " + d.value + "M";
                    });
        
            
            gdpChart
            .width(990) // (optional) define chart width, :default = 200
            .height(500)  // (optional) define chart height, :default = 200
            .transitionDuration(1000) // (optional) define chart transition duration, :default = 750
            .margins({top: 10, right: 50, bottom: 30, left: 40})
            .dimension(states)
    		.group(stateGDP)
            .colors(colorbrewer.RdYlGn[9]) // (optional) define color function or array for bubbles
            .colorDomain([0, maxGdp])
    		.colorAccessor(function (d) {
                  return d.value.gdp;
             })
            .keyAccessor(function (p) {
                return p.value.population;
            })
            .valueAccessor(function (p) {
                return p.value.gdp;
            })
            .radiusValueAccessor(function (p) {
                return p.value.gdp;
            })
    		.maxBubbleRelativeSize(0.02)
            .x(d3.scale.linear().domain([minPop, maxPop]).range([0,5]))
            .y(d3.scale.linear().domain([minGdp, maxGdp]).range([0,5]))
            .r(d3.scale.linear().domain([minGdp, maxGdp]).range([0,5]))
    		.elasticY(true)
            .elasticX(true)
            .yAxisPadding(100)
            .xAxisPadding(500)
            .renderHorizontalGridLines(true) // (optional) render horizontal grid lines, :default=false
            .renderVerticalGridLines(true) // (optional) render vertical grid lines, :default=false
            .xAxisLabel('Population') // (optional) render an axis label below the x axis
            .yAxisLabel('GDP')
    		.renderLabel(true) // (optional) whether chart should render labels, :default = true
            .label(function (p) {
                return p.key;
            })
           // .xAxis().tickFormat(function (v) {return v/1000 + "K";})
    		.yAxis().tickFormat(function (v) {return v/1000 + "K";});
            
		dc.renderAll();	
		var labelG = d3.select("svg")
            .append("svg:g") 
            .attr("id", "labelG") 
            .attr("class", "Title");
	   
	   var project = d3.geo.albersUsa(); 
    //   print_filter(data);
       labelG.selectAll("text") 
           .data(data) 
	     	.enter().append("svg:text") 
			 .attr("text-anchor", "middle")
             .text(function(d){return d.state;}) 
             .attr("x", function(d){ var v=new Array(d.longitude,d.latitude) ;return project(v)[0];}) 
             .attr("y", function(d){ var v=new Array(d.longitude,d.latitude) ;return project(v)[1];}) 
             .attr("dx", "-1em")
		//	 .attr("transform",  function(d) { return "translate(" + d.x + "," + d.y + ")"; });
		
	});
	
	
	
		
});
