
// Load Data permanently
var select = d3.select('body').append('select')
    .attr("id","field_select")
    .on('change',function(){
        plot_map();
    });

var options = select
  .selectAll('option')
  .data(num_fields).enter()
  .append('option')
    .text(function (d) { return d; })
    .attr("selected", function(d){
       return d === "population";
    })


var format = d3.format(",");

// Set tooltips
var tip = d3.tip()
            .attr('class', 'd3-tip')
            .offset([220, -100])
            .html(function(d) {
              return "<strong>Country: </strong><span class='details'>" + d.properties.name + "<br></span>" + "<strong>" + d3.select("#field_select").node().value + ": </strong><span class='details'>" + format(d.population) +"</span>";
            })

var margin = {top: 0, right: 0, bottom: 0, left: 0},
            width = 960 - margin.left - margin.right,
            height = 500 - margin.top - margin.bottom;

var path = d3.geoPath();

var svg = d3.select("body")
            .append("svg")
            .attr("width", width)
            .attr("height", height)
            .append('g')
            .attr('class', 'map');

var projection = d3.geoMercator()
                   .scale(130)
                  .translate( [width / 2, height / 1.5]);

var path = d3.geoPath().projection(projection);

svg.call(tip);

plot_map = function(){
  queue()
      .defer(d3.json, "data/world_countries.json")
      .defer(d3.tsv, "data/terrorism_small.tsv")
      .await(ready);
}

function ready(error, geo, terrorism) {

  var field = d3.select("#field_select").node().value;
  
  var domain = d3.extent(terrorism,function(d){ return +d[field]; })
  var color = d3.scaleLinear()
    .domain([domain[0],  d3.mean(domain)])
    .range(["#6199f0", "#880d0d"]);

  populationById = {};
  terrorism.forEach(d => populationById[d.id] = +d[field]);
  geo.features.forEach(d => d.population = populationById[d.id]);

  svg.append("g")
      .attr("class", "countries")
    .selectAll("path")
      .data(geo.features)
    .enter().append("path")
      .attr("d", path)
      .style("fill", function(d) { return color(populationById[d.id]); })
      .style('stroke', 'white')
      .style('stroke-width', 1.5)
      .style("opacity",0.8)
      // tooltips
        .style("stroke","white")
        .style('stroke-width', 0.3)
        .on('mouseover',function(d){
          tip.show(d);

          d3.select(this)
            .style("opacity", 1)
            .style("stroke","white")
            .style("stroke-width",3);
        })
        .on('mouseout', function(d){
          tip.hide(d);

          d3.select(this)
            .style("opacity", 0.8)
            .style("stroke","white")
            .style("stroke-width",0.3);
        });

  svg.append("path")
      .datum(topojson.mesh(geo.features, function(a, b) { return a.id !== b.id; }))
      .attr("class", "names")
      .attr("d", path);
}

plot_map('population');
