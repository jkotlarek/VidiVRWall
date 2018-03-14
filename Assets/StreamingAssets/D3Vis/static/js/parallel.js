var data = [], names = [], name_field = 'country_txt';
var dimensions = ['nperps','suicide','nkill','population_mil'];

var margin = {top: 30, right: 10, bottom: 10, left: 50},
    width = d3.select("svg").attr("width") - margin.left - margin.right,
    height = d3.select("svg").attr("height") - margin.top - margin.bottom;

var scale = d3.scaleLinear().range([0, width]);
var x = d3.scaleOrdinal(),
    y = {};

var idleTimeout, idleDelay = 350;

// Set tooltips
var tip = 
  d3.tip()
    .attr('class', 'd3-tip')
    .offset([-10, 0])
    .html(function(d) {
      return "<strong>Country: </strong><span class='details'>" + d + "</span>" });

var line = d3.line(),
    axis = d3.axisLeft(),
    background,
    foreground;

var svg = d3.select("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

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
        svg.selectAll('g').remove()
        draw_parallel(data[0],dimensions);
    })
    .text(function (d) { return d; })
    .property('selected',function(d){
       return dimensions.includes(d);
    })

  d3.select("#select")    
    .append("button")
    .attr("type",'button')
    .text("Clear")
    .on("click",function(){
      d3.selectAll('option').property('selected',false);
      dimensions = [];
    })

// On Load
d3.csv("data/terrorism_small.csv", type, function(error, cars) {
  data.push(cars); 
  cars.forEach(d => names.push(d[name_field]));
  draw_parallel(cars,dimensions); 
});



draw_parallel = function(cars,dimensions) {
  var temp = 10;  

  var df = [];
  cars.forEach(function(x){
    var temp = {'name':x[name_field]};
    dimensions.forEach(function(y){
      temp[y] = +x[y];      
    });
    df.push(temp);
  })
  df.columns = ['name'].concat(dimensions);

  // Extract the list of dimensions and create a scale for each.  
  dimensions.forEach(d => y[d] = d3.scaleLinear()
        .domain(d3.extent(df, function(p) { return +p[d]; }))
        .range([height, 0]))

  scale.domain([0,dimensions.length]);
  x.range(Array.apply(scale, {length: dimensions.length}).map(Number.call, scale)).domain(dimensions);

  // Add grey background lines for context.
  background = svg.append("g")
      .attr("class", "background")
    .selectAll("path")
      .data(df)
    .enter().append("path")
      .attr("d", path);

  // Add blue foreground lines for focus.
  foreground = svg.append("g")
      .attr("class", "foreground")
    .selectAll("path")
      .data(df)
    .enter().append("path")
      .attr("d", path)
      .attr("Name",d => d[name_field])

  // Add a group element for each dimension.
  var g = svg.selectAll(".dimension")
      .data(dimensions)
    .enter().append("g")
      .attr("class", "dimension")
      .attr("transform", function(d) { return "translate(" + x(d) + ")"; });

  // Add an axis and title.
  g.append("g")
      .attr("class", "axis")
      .each(function(d) { d3.select(this).call(axis.scale(y[d])); })
    .append("text")
      .classed("title",true)
      .attr("y", -9)
      .text(function(d) { return d; });

    // Add and store a brush for each axis.
    var brush = d3.brush().extent([[0, 0], [6, height]]).on("end", brushended);
            
    g.append("g")
        .attr("transform","translate(-8,0)")
        .attr("class", "brush")
        .call(brush)
        .attr("name",function(d){return d;})
        //.each(function(d) { d3.select(this).call(y[d].brush = d3.brushY(y[d]).on("end", brushended)); })


}

// Returns the path for a given data point.
function path(d) {
  return line(dimensions.map(function(p) { return [x(p), y[p](d[p])]; }));
}


function brushended() {
// Doesn't quite work yet
      var s = d3.event.selection;      
      if (!s) {
          // if (!idleTimeout) return idleTimeout = setTimeout(idled, idleDelay); 
          chg_color(d,-1,-1);

      } else {          
          var d  = this.getAttribute("name"),
              y1 = y[d].invert(s[1][1]), 
              y2 = y[d].invert(s[0][1]);
          chg_color(d,y1,y2);
      }
  }


function idled() {
      idleTimeout = null;
  }

  function chg_color(d,y1,y2) {
    var selected_names = [];
    var idx=0;
    data[0].filter(function(c){
      if( +c[d] <= y2 && +c[d] >= y1 ){
        selected_names.push(names[idx++]);
        return true;
      } 
      idx++;
      return false;
    });

    d3.selectAll("g.foreground path")
      .classed('active',false)
      .filter(function(x){
        return selected_names.includes(x['name']);
      }).classed('active',true);
      
  }    

