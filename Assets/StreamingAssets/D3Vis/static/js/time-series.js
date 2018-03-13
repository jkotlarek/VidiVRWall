
var svg = d3.select("svg"),
    margin = {top: 20, right: 80, bottom: 30, left: 50},
    width = svg.attr("width") - margin.left - margin.right,
    height = svg.attr("height") - margin.top - margin.bottom,
    g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var parseTime = d3.timeParse("%Y%m%d");
var timeParser = function(time,timeType){
  if (timeType == "iyear")
    return time+"0101";
  if (timeType == "imonth")
    return "1900"+time+"01";
  if (timeType == "iday")
    return "190001"+time;
}
typeParser = {
  "Total": d3.sum,
  "Count": function(d){return d.length},
  "Avg": d3.mean
}
nest_vars = function(data,vars,types,timeType) {
  return d3.nest()
    .key(function(d) { return timeParser(d[timeType],timeType); })
    .rollup(function(v) { 
      var temp = {};
      for (var i=0; i<vars.length; i++){
        temp[vars[i]] =  typeParser[types[i]](v, function(d) { return d[vars[i]]; })
      }
      return temp;
     }).entries(data);
} 

var x = d3.scaleTime().range([0, width]),
    y = d3.scaleLinear().range([height, 0]),
    z = d3.scaleOrdinal(d3.schemeCategory10);

var line = d3.line()
    .curve(d3.curveBasis)
    .x(function(d) { return x(d.date); })
    .y(function(d) { return y(d.temperature); });


var nums = [1,2,3,4,5];
var select = d3.select('body').append('select')
    .attr("id","num_fields")
    .on('change',function(){
        build_filters();
    });

var options = select
  .selectAll('option')
  .data(nums).enter()
  .append('option')
    .text(function (d) { return d; })
    .attr("selected", function(d){
       return d === "population";
    })

build_filters = function(){
  d3.selectAll('.field_select').remove();
  d3.select('.btn-submit').remove();

  d3.tsv("../data/terrorism_small.tsv",function(terrorism){
    var types = ['Total','Count','Avg'];
    var num = d3.select("#num_fields").node().value;
    for (var j=0; j<num; j++){

      var select = d3.select('body').append('select')
          .classed("field_select",true)
          .attr("id","select"+j)          

      var options = select
        .selectAll('option')
        .data(terrorism.columns).enter()
        .append('option')
          .text(function (d) { return d; })
          .attr("selected", function(d){
             return d === "population";
          })

      var select = d3.select('body').append('select')
          .classed("field_select",true)
          .attr("id","type"+j)          

      var options = select
        .selectAll('option')
        .data(types).enter()
        .append('option')
          .text(function (d) { return d; })
          .attr("selected", function(d){
             return d === 'Avg';
          })
    }

    var timeTypes = ['iyear','imonth','iday'];
    var select = d3.select('body').append('select')
        .classed("field_select",true)
        .attr("id","timeType")          

    var options = select
      .selectAll('option')
      .data(timeTypes).enter()
      .append('option')
        .text(function (d) { return d; })
        .attr("selected", function(d){
           return d === 'iyear';
        })

    var btn = d3.select('body').append('button')
        .classed("btn-submit",true)
        .attr('type','button')
        .attr("id","submit")
        .text('Submit')
        .on('click',function(){
            var cols=[], types=[];
            var num = d3.select("#num_fields").node().value;
            for (var j=0; j<num; j++){
              cols.push(  d3.select("#select"+j).node().value);
              types.push( d3.select("#type"+j).node().value);
            }
            timeType = d3.select("#timeType").node().value;
            plot_lines(cols,types,timeType);
        });
  });
}

plot_lines = function(cols,types,timeType) {

  d3.tsv("../data/terrorism_small.tsv", type, function(error, terrorism) {
    if (error) throw error;

    
    var nested = nest_vars(terrorism,cols,types,timeType);
    var data = [];
    nested.forEach(function(d){
      var value = d.value;
      value['date'] = d.key;
      data.push(value);
    })
    data.columns = cols.concat(['date']);

    var cities = data.columns.slice(0,cols.length).map(function(id) {
      return {
        id: id,
        values: data.map(function(d) {
          return {date: parseTime(d.date), temperature: d[id]};
        })
      };
    });

    x.domain(d3.extent(data, function(d) { return parseTime(d.date); }));

    y.domain([
      d3.min(cities, function(c) { return d3.min(c.values, function(d) { return d.temperature; }); }),
      d3.max(cities, function(c) { return d3.max(c.values, function(d) { return d.temperature; }); })
    ]);

    z.domain(cities.map(function(c) { return c.id; }));

    g.append("g")
        .attr("class", "axis axis--x")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x));

    g.append("g")
        .attr("class", "axis axis--y")
        .call(d3.axisLeft(y))
      .append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("dy", "0.71em")
        .attr("fill", "#000")
        .text("Temperature, ºF");

    var city = g.selectAll(".city")
      .data(cities)
      .enter().append("g")
        .attr("class", "city");

    city.append("path")
        .attr("class", "line")
        .attr("d", function(d) { return line(d.values); })
        .style("stroke", function(d) { return z(d.id); });

    city.append("text")
        .datum(function(d) { return {id: d.id, value: d.values[d.values.length - 1]}; })
        .attr("transform", function(d) { return "translate(" + x(d.value.date) + "," + y(d.value.temperature) + ")"; })
        .attr("x", 3)
        .attr("dy", "0.35em")
        .style("font", "10px sans-serif")
        .text(function(d) { return d.id; });
  });
}
function type(d, _, columns) {
  d.date = parseTime(d.date);
  for (var i = 1, n = columns.length, c; i < n; ++i) d[c = columns[i]] = +d[c];
  return d;
}

var cols=['nkill','population'], types=['Avg','Total'], timeType='iyear';
plot_lines(cols,types,timeType);

