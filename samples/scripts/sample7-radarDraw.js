/*
 * Variation of http://bl.ocks.org/chrisrzhou/2421ac6541b68c1680f8 
 * Minor updates for error handling of undefined variables
 */
function radarDraw(scope, element) {
  /**
   * Angular variables
   *
   */
   
  // watch for changes on scope.data
  scope.$watch("[csv, config]", function() {
    var csv = scope.csv;
    var config = scope.config;
    var data = csv2json(csv);
    RadarChart.draw(element[0], data, config);  // call the D3 RadarChart.draw function to draw the vis on changes to data or config
  },true);


  // helper function csv2json to return json data from csv
  function csv2json(csv) {
	if (typeof csv === 'undefined')
		  return;
    csv = csv.replace(/, /g, ","); // trim leading whitespace in csv file
    var json = d3.csv.parse(csv); // parse csv string into json
    // reshape json data
    var data = [];
    var groups = []; // track unique groups
    json.forEach(function(record) {
      var group = record.group;
      if (groups.indexOf(group) < 0) {
        groups.push(group); // push to unique groups tracking
        data.push({ // push group node in data
          group: group,
          axes: []
        });
      };
      data.forEach(function(d) {
        if (d.group === record.group) { // push record data into right group in data
          d.axes.push({
            axis: record.axis,
            value: parseInt(record.value),
            description: record.description
          });
        }
      });
    });
    return data;
  }
}