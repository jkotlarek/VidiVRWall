var data = [], names = [], name_field = 'country_txt';
var dimensions = ['nperps','suicide','nkill','population_mil'];
var filters = {};
var selected_names = [];

var margin = {top: 30, right: 100, bottom: 10, left: 50},
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
    // .attr("x",width/2)
    // .attr("y",height)
    .offset([-20, 5])
    .html(function(d) {
      return "<strong>Country: </strong><span class='details'>" + d.name + "</span>" });

var line = d3.line(),
    axis = d3.axisLeft(),
    background,
    foreground;

var svg = d3.select("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .classed("parallel-coords",true)
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
svg.call(tip);

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
          delete filters[txt];
        }else{
          dimensions.push(txt);
        }        
        svg.selectAll('g').remove();             
        draw_parallel(data[0],dimensions);
        chg_color();        
    })
    .text(function (d) { return d; })
    .property('selected',function(d){
       return dimensions.includes(d);
    })

  d3.select("#select")    
    .append("button")
    .attr("id","Clear")
    .attr("type",'button')
    .text("Clear")
    .on("click",function(){
      d3.selectAll('option').property('selected',false);
      dimensions = []; filters = {};
      svg.selectAll('g').remove();             
      draw_parallel(data[0],dimensions);
    })

// On Load
d3.csv("data/terrorism_small.csv", type, function(error, cars) {
  var cars = 
  d3.nest()
    .key(d => d[name_field] )
    .rollup(function(v) { 
      var temp = {};
      for (var i=0; i<num_fields.length; i++){
        temp[num_fields[i]] =  d3.mean(v,c => c[num_fields[i]])
      }
      return temp;
     }).entries(cars);


  data.push(cars); 
  cars.forEach(d => names.push(d[name_field]));
  draw_parallel(cars,dimensions); 
});



draw_parallel = function(cars,dimensions) {
  var temp = 10;  

  var df = [];
  cars.forEach(function(x){
    var temp = {'name':x.key};
    dimensions.forEach(function(y){
      temp[y] = +x.value[y];      
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
      .attr("Name",d => d['name'])      
      .on('mouseover',function(d){ 
        tip.show( d, document.getElementById("Clear") ) 
        d3.select(this).classed('active',true);
      })
      .on('mouseout',function(d){
        tip.hide();
        d3.select(this).classed('active',false);
      });

  // Add a group element for each dimension.
  var g = svg.selectAll(".dimension")
      .data(dimensions)
    .enter().append("g")
      .attr("class", "dimension")
      .attr("transform", function(d) { return "translate(" + x(d) + ")"; });

    // Add and store a brush for each axis.
    var brush = d3.brushY().extent([[-10, -4], [10, height+10]]).on("end", brushended);

    g.append("g")
        .attr("transform","translate(-8,0)")
        .attr("class", "brush")
        .attr("name",function(d){return d;})
        .call(brush)

     // Add an axis and title.
    g.append("g")
        .attr("class", "axis")
        .each(function(d) { d3.select(this).call(axis.scale(y[d])); })
        .style('transform','translate(-10px,0)')      
      .append("text")
        .classed("title",true)
        .attr("y", -9)      
        .text(function(d) { return d; });
        

}

// Returns the path for a given data point.
function path(d) {
  return line(dimensions.map(function(p) { return [x(p), y[p](d[p])]; }));
}


function brushended() {

      var d  = this.getAttribute("name");
      var s = d3.event.selection;      
      if (!s) {
          delete filters[d];
          chg_color();

      } else {                    
          var y1 = y[d].invert(s[1]), 
              y2 = y[d].invert(s[0]);
          filters[d] = [y1,y2];
          chg_color();
      }
  }


function idled() {
      idleTimeout = null;
  }

function chg_color() {
  get_selected();

  d3.selectAll("g.foreground path")
    .classed('active',false)
    .filter(function(x){
      return selected_names.includes(x['name']);
    }).classed('active',true);

  draw_legend();
}    

function get_selected() {
  selected_names = [];
  var idx=0;    
  data[0].filter(function(c){
    var bools = [];
    for (b in filters){
      bools.push(+c.value[b] <= filters[b][1] && +c.value[b] >= filters[b][0])
    }
    if (bools.some(x => x)){
      selected_names.push(c.key);
    }
  });
}

function draw_legend(){

  var new_width = d3.select(".parallel-coords").node().getBoundingClientRect().width;   

  d3.select('.h4').remove();
  d3.selectAll('text.legend').remove();
  d3.select('svg').append('text')
    .attr('class','h4')
    .text('Selected')
    .attr('x',new_width).attr('y',75);

  var sz = d3.scaleLinear().range([16,5]).domain([0,data[0].length]);
  var dy = d3.scaleLinear().range([15,2]).domain([0,data[0].length])  
  for (idx=0; idx<selected_names.length; idx++){
    d3.select('svg')
      .append('text').classed('legend',true)
      .text(selected_names[idx])
      .attr('x',new_width)
      .attr('y',function(){return 100 + dy(selected_names.length)*idx})
      .style('font-size',function(){return sz(selected_names.length);})
  }
}

