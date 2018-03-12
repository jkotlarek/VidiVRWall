
var margin = {top: 30, right: 10, bottom: 10, left: 10},
    width = 960 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

var x = d3.scaleOrdinal().range([0, width]),
    y = {};

var line = d3.line(),
    axis = d3.axisLeft(),
    background,
    foreground;

var svg = d3.select("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


var select = d3.select('body').append('select')
    .attr("id","field_select")
    .on('change',function(){
        // Add function
    });

var options = select
  .selectAll('option')
  .data(num_fields).enter()
  .append('option')
    .text(function (d) { return d; })
    .attr("selected", function(d){
       return d === "population";
    })


var cols = ['nperps','suicide','nkill','population'];
var data = [];
d3.tsv("data/terrorism.tsv", function(error, cars) {

  var temp = 10;
  data.push(cars);

  var df = [];
  cars.forEach(function(x){
    var temp = {'name':x.country_txt};
    cols.forEach(function(y){
      temp[y] = +x[y];
    });
    df.push(temp);
  })
  df.columns = ['name'].concat(cols);

  // Extract the list of dimensions and create a scale for each.
  x.domain(dimensions = d3.keys(df[0]).filter(function(d) {
    return d != "name" && (y[d] = d3.scaleLinear()
        .domain(d3.extent(df, function(p) { return +p[d]; }))
        .range([height, 0]));
  }));

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
      .attr("d", path);

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
      .style("text-anchor", "middle")
      .attr("y", -9)
      .text(function(d) { return d; });

  // Add and store a brush for each axis.
  // g.append("g")
  //     .attr("class", "brush")
  //     .each(function(d) { d3.select(this).call(y[d].brush = d3.brushY(y[d]).on("brush", brush)); })
  //   .selectAll("rect")
  //     .attr("x", -8)

    // Add and store a brush for each axis.
    var brush = d3.brush().extent([[0, 0], [6, height]]).on("end", brushended),
            idleTimeout,
            idleDelay = 350;

    g.append("g")
        .attr("transform","translate(-8,0)")
        .attr("class", "brush")
        .call(brush)
        .attr("name",function(d){return d;})
        //.each(function(d) { d3.select(this).call(y[d].brush = d3.brushY(y[d]).on("end", brushended)); })


});

// Returns the path for a given data point.
function path(d) {
  return line(dimensions.map(function(p) { return [x(p), y[p](d[p])]; }));
}


function brushended() {
// Doesn't quite work yet
      var s = d3.event.selection;      
      if (!s) {
          if (!idleTimeout) return idleTimeout = setTimeout(idled, idleDelay); 
          d3.selectAll("g.foreground path")
            .classed("inactive",false)
            .style("stroke",function(x){return col(x[cols[0]]);});
          d3.selectAll("g.dimension brush")
            .call(brush.move,null);
            set_students("",name);
            save_names=[];

      } else {          
          var d  = this.getAttribute("name"),
              y1 = y[d].invert(s[1][1]), 
              y2 = y[d].invert(s[0][1]);

          set_color(d,y1,y2);
      }
  }


function idled() {
      idleTimeout = null;
  }

  function set_color(d,y1,y2) {
    var selected_names = [];
    var idx=0;
    data[0].filter(function(c){
      if( c[d] < y2 && c[d] > y1 ){
        // selected_names.push(names[idx++]);
        return true;
      } 
      idx++;
      return false;
    });

    d3.selectAll("g.foreground path").style('stroke-width',3)
      .filter(function(x){
        return this.className.animVal != "inactive";
      })
      .classed("inactive",true)
      .style("stroke-width",1)
      .filter(function(x){
        return selected_names.includes(this.getAttribute('Student'))
      })
      .classed("inactive",false)
      .classed("active",true)
      .style("stroke",function(x){
        return col(x[cols[0]]);
      }).style("stroke-width",3)      
  }    

