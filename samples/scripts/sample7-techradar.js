(function() {
  angular.module("RadarChart", [])
    .directive("radar", radar)
    .directive("onReadFile", onReadFile)
    .controller("MainCtrl", MainCtrl);

  // controller function MainCtrl
  function MainCtrl($http,$scope) {
    var radar = this;
    $scope.radar = radar;
    init();


    // function init
    function init() {
      // initialize controller variables
      radar.examples = [
        "data_the_avengers",
        "data_plant_seasons",
        "data_car_ratings"
      ];
      radar.exampleSelected = radar.examples[0];
      radar.getData = getData;
      radar.selectExample = selectExample;

      // initialize controller functions
      radar.selectExample(radar.exampleSelected);
      radar.config = {
        w: 250,
        h: 250,
        facet: false,
        levels: 5,
        levelScale: 0.85,
        labelScale: 0.9,
        facetPaddingScale: 2.1,
        showLevels: true,
        showLevelsLabels: false,
        showAxesLabels: true,
        colors: d3.scale.category10(),
        showAxes: true,
        showLegend: true,
        showVertices: true,
        showPolygons: true
      };
    }

    // function getData
    function getData($fileContent) {
      radar.csv = $fileContent;
    }

    // function selectExample
    function selectExample(item) {
      var file = "data/"+item + ".csv";
      console.log(file);
      $http.get(file).success(function(data) {
        radar.csv = data;
      });
    }
  }

  // directive function sunburst
  function radar() {
    return {
      restrict: "E",
      scope: {
        csv: "=",
        config: "="
      },
      link: radarDraw
    };
  }


  // directive function onReadFile
  function onReadFile($parse) {
    return {
      restrict: "A",
      scope: false,
      link: function(scope, element, attrs) {
        var fn = $parse(attrs.onReadFile);
        element.on("change", function(onChangeEvent) {
          var reader = new FileReader();
          reader.onload = function(onLoadEvent) {
            scope.$apply(function() {
              fn(scope, {
                $fileContent: onLoadEvent.target.result
              });
            });
          };
          reader.readAsText((onChangeEvent.srcElement || onChangeEvent.target).files[0]);
        });
      }
    };
  }
})();