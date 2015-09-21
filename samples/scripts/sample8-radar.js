Radar = (function (){
  function draw(element, svg_path, json_path){
    d3.xml(svg_path, 'image/svg+xml', function (xml) {
      element.appendChild(xml.documentElement);

      var svg = d3.select('#radar');

      _doRadar(svg);
      _defineBlips(svg);
      _drawBlips(svg, json_path);
  //    _drawBlipsCSV(svg, json_path);
    });
  }
  
  function reDraw(json_path) {
	  var svg = d3.select('#radar');
	  // Clear earlier blips
	  svg.selectAll('.blip-container').remove();
	  d3.select("#radar-table").selectAll('.blip-table').remove();
	  _drawBlips(svg, json_path);
  }

  function zoomIn(quadrantName) {
    var quadrant = d3.select("g#" + quadrantName).select(".largest-arc");
    
    quadrant.on("click").call(quadrant[0][0]);
  }

  function zoomOut() {
    d3.select("g#radar").transition()
      .attr('transform', '');

    d3.selectAll('text').transition()
      .duration(800)
      .style('opacity', '0')
      .style('display', 'none');
  }

  function _doRadar(svg) {
    var quadrants = svg.selectAll('g.quadrant')

    quadrants.select('.largest-arc')
             .on('click', function () {
               var d3_element = d3.select(this),
                   id = d3_element.attr('id'),
                   size = 800,
                   offX = 0,
                   offY = 0;

               switch (id) {
                 case 'techniques-arc':
                   break;
                 case 'tools-arc':
                   offX = -size;
                   break;
                 case 'languages-arc':
                   offX = -size;
                   offY = -size;
                   break;
                 case 'platforms-arc':
                   offY = -size;
                   break;
               }

               d3.selectAll('g#radar').transition()
                 .attr('transform', 'translate(' + offX + ',' + offY + ') scale(2)');

               d3.selectAll('text').style('display', 'block')
                 .transition()
           //      .call(wrap, 50)
                 .duration(800)
                 .style('opacity', '1')
             })
  }

  function _defineBlips(svg) {
    var definitions = svg.append('defs');

    definitions.append('circle')
               .attr('r', 4)
               .attr('class', 'unchanged blip')
               .attr('id', 'circular-blip');
  			
   definitions.append('polygon')
              .attr('points', '-2,-2 8,-2 3,-10')
              .attr('class', 'changed blip')
              .attr('id', 'triangular-blip');

    return svg;
  }

  function _drawBlips(svg, json_path) {
    d3.json(json_path, function (blipData) {
    	var i=1;
    	blipData.forEach(function(d) {
    		d.id = i;
    		i++;
    	});
    	
      _drawBlipsUpon(svg, blipData);
      tabulate(blipData, ["id","name", "quadrant","description"]);
    });
  }

  function _drawBlipsCSV(svg, csv_path) {
	    d3.csv(csv_path, function (blipData) {
	      _drawBlipsUpon(svg, blipData);
	    });
  }
  
  function _drawBlipsUpon(svg, blipData) {
	
	var tip = d3.tip()
    	.attr('class', 'd3-tip')
    	.offset([-10, 0])
    	.html(function(d) {
    	return "<strong>Name:</strong> <span>" + d.name + " ("+d.id+")"+"</span><br>"+
    			d.description;
    })
    
    
	    
    var center = _centerOf(svg),
        blips = svg.selectAll('.blip-container')
                   .data(blipData);
		
        blip = blips.enter()
                    .append('g')
                    .attr('class', 'blip-container')
                    .on('click', _showBlipDescription);


    blip.append('use')
        .attr('xlink:href', function (blip) {
          return blip.movement == 'c' ? '#circular-blip' : '#triangular-blip';
        })
        .attr('x', function (blip){
          return center.x + _toRect(blip.pc).x;
        })
        .attr('y', function (blip){
          return center.y + _toRect(blip.pc).y;
        })
        .attr('title', function (blip) { return blip.id })
        .style('fill', function (blip) {
        	if (blip.pc.t <=90) {	//Languages
        		return "#d9534f";
        	} else if (blip.pc.t >90 && blip.pc.t <=180 ) { //Platforms
        		return "#f0ad4e";
        	} else if (blip.pc.t >180 && blip.pc.t <=270 ) { //Techniques
        		return "#5cb85c";
        	} else { //Tools
        		return "#5bc0de";//"#000033";//"#5bc0de";
        	}
       }
        );
    
  	
 

    blip.append('text')
        .text(function (blip) { return blip.name; })
        .style('opacity', '0')
        .style('display', 'none')
        .attr('class', 'label')
        .attr('transform', function (blip) {
          var blipCenter = _toRect(blip.pc);
          var xOffset = blip.movement == 'c' ? 4: 8;
          var yOffset = blip.movement == 'c' ? 9: 6;
          return 'translate(' + (center.x+blipCenter.x-xOffset) + ', ' + (center.y+blipCenter.y+yOffset) + ')';
        })
        .on('mouseover', tip.show)
        .on('mouseout', tip.hide);
    
    blip.append('text')
    .text(function (blip) { return blip.id; })
    .style('opacity', '0')
    .style('display', 'none')
    .attr('class', 'blip-id')
    .attr("text-anchor", "middle")
    .attr('transform', function (blip) {
          var blipCenter = _toRect(blip.pc);
          var xOffset = blip.movement == 'c' ? 0: 2;
          var yOffset = blip.movement == 'c' ? -2: 2;
          return 'translate(' + (center.x+blipCenter.x+xOffset) + ', ' + (center.y+blipCenter.y-yOffset) + ')';
        });


    
    svg.call(tip);
    
    return svg;
  }

  function _showBlipDescription(blip) {
    d3.selectAll('.blip-container').attr('class', 'blip-container');
    d3.select(this).attr('class', 'blip-container active');

    _zoomInBlip(blip);

    $('#blip-name').text(blip.name);
    $('#blip-description').text(blip.description);
  };

  function _zoomInBlip(blip) {
    var theta = blip.pc.t % 360,
        quadrants = ['languages', 'platforms', 'techniques', 'tools'],
        quadrant = quadrants[Math.floor(theta / 90)];

    zoomIn(quadrant);
  }

  function _centerOf(d3_element) {
    var element = document.getElementById(d3_element.attr('id')),
        bbox = element.getBBox();

    return _point(bbox.width / 2, bbox.height / 2);
  }

  function _point(x, y) {
    return {
      'x': x,
      'y': y
    };
  }

  function _toRect(polarCoords) {
    var angleInRadians = (polarCoords.t * Math.PI) / 180;
    function xProjection(r,a) { return r * Math.cos(a); }
    function yProjection(r,a) { return r * Math.sin(a); }
    return _point(xProjection(polarCoords.r, angleInRadians), yProjection(polarCoords.r, angleInRadians));
  }

  
//The table generation function
  function tabulate(data, columns) {
      var table = d3.select("#radar-table").append("table")
              .attr("style", "margin-left: 150px")
              .attr("class","blip-table table table-bordered table-striped table-condensed"),
          thead = table.append("thead"),
          tbody = table.append("tbody");

      // append the header row
      thead.append("tr")
          .selectAll("th")
          .data(columns)
          .enter()
          .append("th")
              .text(function(column) { return column.capitalize(); });

      // create a row for each object in the data
      var rows = tbody.selectAll("tr")
          .data(data)
          .enter()
          .append("tr");

      // create a cell in each row for each column
      var cells = rows.selectAll("td")
          .data(function(row) {
              return columns.map(function(column) {
                  return {column: column, value: row[column]};
              });
          })
          .enter()
          .append("td")
          .attr("style", "font-family: Josefin+Sans") // sets the font style
              .html(function(d) { return d.value; });
      
      return table;
  }
  
  String.prototype.capitalize = function() {
	    return this.charAt(0).toUpperCase() + this.slice(1);
	}
  
  function wrap(text, width) {
	  text.each(function() {
	    var text = d3.select(this),
	        words = text.text().split(/\s+/).reverse(),
	        word,
	        line = [],
	        lineNumber = 0,
	        lineHeight = 1.1, // ems
	        y = text.attr("y"),
	        dy = parseFloat(text.attr("dy")),
	        tspan = text.text(null).append("tspan").attr("x", 0).attr("y", y).attr("dy", dy + "em");
	    while (word = words.pop()) {
	      line.push(word);
	      tspan.text(line.join(" "));
	      if (tspan.node().getComputedTextLength() > width) {
	        line.pop();
	        tspan.text(line.join(" "));
	        line = [word];
	        tspan = text.append("tspan").attr("x", 0).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
	      }
	    }
	  });
	}
  
  return {
    draw: draw,
    reDraw: reDraw,
    zoomIn: zoomIn,
    zoomOut: zoomOut
  };
  
})();

