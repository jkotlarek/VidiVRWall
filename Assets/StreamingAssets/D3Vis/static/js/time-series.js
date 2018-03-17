

var dimensions=['nkill','population_mil'], types=['Avg','Avg'], timeType='iyear';

var parseTime = d3.timeParse("%Y%m%d");
var timeParser = function(time,timeType){
  if (timeType == "iyear")
    return time+"0101";
  if (timeType == "imonth")
    return "1900"+time+"01";
  if (timeType == "iday")
    return "190001"+time;
}

var margin = {top: 20, right: 80, bottom: 30, left: 50},    
    width = 1100 - margin.left - margin.right,
    height = 600 - margin.top - margin.bottom;

var x = d3.scaleTime().range([0, width]),
    y = d3.scaleLinear().range([height, 0]),
    z = d3.scaleOrdinal(d3.schemeDark2);

var line = d3.line()
    .curve(d3.curveBasis)
    .x(function(d) { return x(d.date); })
    .y(function(d) { return y(d.temperature); });

var select = d3.select('#select').append('select')
    .attr("id","field_select")
    .attr("multiple",true)    

var options = select
  .selectAll('option')  
  .data(num_fields).enter()
  .append('option')
  .on('mousedown',function(e){
        event.preventDefault();
        var txt = d3.select(this).text();
        d3.select(this).property('selected', !d3.select(this).property('selected'));
        if (dimensions.includes(txt)){
          var i = dimensions.indexOf(txt);
          dimensions = dimensions.slice(0,i).concat(dimensions.slice(i+1,dimensions.length));
        }else{
          dimensions.push(txt);
        }        
        d3.select('svg').remove();
        timeType = d3.select("#timeType").node().value;
        plot_lines(dimensions,Array(dimensions.length).fill('Avg'),timeType);
    })
    .text(function (d) { return d; })
    .property('selected',function(d){
       return dimensions.includes(d);
    })

var timeTypes = ['iyear','imonth','iday'];
  var select = d3.select('#select').append('select')
      .classed("field_select",true)
      .attr("id","timeType")   
      .style("height",'25px')
      .style("width",'60px')
      .style("display","none")
      .selectAll('option')
      .data(timeTypes)
      .enter().append('option')       
      .text(d => d);

  d3.select("#select")    
    .append("button")
    .attr("type",'button')
    .style("width",'60px')
    .text("Clear")
    .on("click",function(){
      d3.selectAll('option').property('selected',false);
      dimensions = [];
    })  

plot_lines = function(cols,types,timeType) {
  
  var svg = d3.select("#svg").append('svg').style("width",1100).style("height",600),    
    g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  d3.csv("data/terrorism_small.csv", type, function(error, terrorism) {
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
          return {date: parseTime(d.date), temperature: d[id]/d3.mean(data,c => c[id])};
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

    // Plot legend
    d3.selectAll('text.legend').remove();
    d3.select('svg').append('text').attr('class','h4').text('Selected').attr('x',30).attr('y',48);
    var sz = d3.scaleLinear().range([16,5]).domain([0,terrorism.length]);
    var dy = d3.scaleLinear().range([15,2]).domain([0,terrorism.length]);
    
    for (var i=0; i < cols.length; i++){
      svg.append('text')
         .text(cols[i])
         .attr('x',30)
         .attr('y',73+dy(cols.length)*i)
         .classed('legend',true)
         .style('font-size',function(){return sz(cols.length)})
         .style('stroke',function(){return z(cols[i])});
    }


  });
}
plot_lines(dimensions,types,timeType);

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
     }).entries(data)
     .sort(function(a,b) {return d3.ascending(a.key,b.key);});
} 

