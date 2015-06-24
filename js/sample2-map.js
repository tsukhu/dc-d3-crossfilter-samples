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
 d3.csv("../data/us-state-capital-population.csv", function (data) {
 
	data.forEach(function(d) {
		d.longitude = +d.longitude;
		d.latitude = +d.latitude;
	});
	var ndx = crossfilter(data);
	var usChart = dc.geoChoroplethChart("#us-chart");
	var states = ndx.dimension(function (d) {
            return d.abbrev;
        });
	

	
	var statePopulation = states.group().reduceSum(function (d) {
            return isNaN(d.population) ? 0 : +d.population;
        });
	var minPop = states.bottom(1)[0].population;
	var maxPop = states.top(1)[0].population;
	d3.json("../data/us-states.json", function (statesJson) {
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
		dc.renderAll();	
		var labelG = d3.select("svg")
            .append("svg:g") 
            .attr("id", "labelG") 
            .attr("class", "Title");
	   
	   var project = d3.geo.albersUsa(); 
       print_filter(data);
       labelG.selectAll("text") 
           .data(data) 
	     	.enter().append("svg:text") 
			 .attr("text-anchor", "middle")
             .text(function(d){return d.state;}) 
             .attr("x", function(d){ var v=new Array(d.longitude,d.latitude) ;return project(v)[0];}) 
             .attr("y", function(d){ var v=new Array(d.longitude,d.latitude) ;return project(v)[1];}) 
             .attr("dx", "-1em")
			 .attr("transform",  function(d) { return "translate(" + d.x + "," + d.y + ")"; });
		
	});
	
		
});
