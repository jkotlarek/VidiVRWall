
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
       return d === "population_mil";
    })


var format = d3.format(",");

// Set tooltips
var tip = d3.tip()
            .attr('class', 'd3-tip')
            .offset([220, -100])
            .html(function(d) {
              return "<strong>Country: </strong><span class='details'>" + d.properties.name + "<br></span>" + "<strong>" + d3.select("#field_select").node().value + ": </strong><span class='details'>" + format(d.population) +"</span>";
            })

var tip_pt = d3.tip()
            .attr('class', 'd3-tip')
            .offset([220, -100])
            .html(function(d) {
              var txt = "<strong>Location: </strong><span class='details'>" + d.city +", "+d.provstate+ "<br></span>";
                  txt += (d.Location != undefined ? "<span class='details'>" + d.Location + "<br></span>" : "");
                  txt += "<strong>" + d3.select("#field_select").node().value + ": </strong><span class='details'>" + format(d[d3.select("#field_select").node().value]) +"</span>";
              return txt;
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
      .defer(d3.csv, "data/terrorism_small.csv")
      .await(ready);
}

function ready(error, geo, terrorism) {

  var field = d3.select("#field_select").node().value;
  
  var domain = d3.extent(terrorism,function(d){ return +d[field]; })
  var color = d3.scaleLinear()
    .domain([domain[0],  d3.mean(domain)])
    .range(["#6199f0", "#880d0d"]);

  var map_x = d3.scaleLinear().range([0,width]).domain([-180,180]),
      map_y = d3.scaleLinear().range([0,height]).domain([-180,180]);

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

    svg.append("g")
     .classed("points",true)
     .selectAll('circle')
     .data(terrorism)
     .enter().append("circle")
     .classed("points",true)
     .call(tip_pt)
     .attr('cx',d => projection([d.longitude,d.latitude])[0])
     .attr('cy',d => projection([d.longitude,d.latitude])[1])
     .attr('r',3)
     // .attr("fill",d => color(d[field]))
     .on("mouseover",function(d){
      tip_pt.show(d);
     }).on('mouseout',function(){
      tip_pt.hide();
     })


  var g = svg.append('g').classed('legend',true);
  g.append('rect').classed('legend',true)
   .attr('y',height-20).attr('x',30)
   .attr('width',70).attr('height',20);
  svg.append('text').classed('legend',true)
   .attr('y',height-20+13).attr('x',30+10)
   .text("Attacks")



}

plot_map('population_mil');
