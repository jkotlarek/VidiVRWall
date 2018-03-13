var data = [], sources = ['USA','GBR'], num_groups = 12;
var clusters;


var cluster_pt = {0: -300 , 1: -150, 2: 150 ,  3: 300}




var svg = d3.select("svg"),
    width = +svg.attr("width"),
    height = +svg.attr("height");

var color = d3.scaleOrdinal(d3.schemeCategory20);

var tip = 
  d3.tip()
    .attr('class', 'd3-tip')
    .offset([-10, 0])
    .html(function(d) {
      return "<strong>Country: </strong><span class='details'>" + d +"</span>";
    })
svg.call(tip);

var select = d3.select('#select').append('select')
    .attr("id","field_select")
    .attr("multiple",true)    

var options = select
  .selectAll('option')  
  .data(IDs).enter()
  .append('option')
  .on('mousedown',function(e){
        event.preventDefault();
        simulation = d3.forceSimulation();    
        var txt = d3.select(this).text();
        d3.select(this).property('selected', !d3.select(this).property('selected'));
        if (sources.includes(txt)){
          var i = sources.indexOf(txt);
          sources = sources.slice(0,i).concat(sources.slice(i+1,sources.length));
        }else{
          sources.push(txt);
        }        
        svg.selectAll('g').remove()
        simulation = d3.forceSimulation()    
                   .force("link", d3.forceLink().id(function(d)  { return d.id; }))
                   .force("charge", d3.forceManyBody().strength(-150))
                   .force("center", d3.forceCenter(width / 2, height / 2));
        var graph = {'nodes' : data[0].nodes.slice(0), 'links': data[0].links.slice(0)};
        graph.links = graph.links.filter(d => sources.includes(d.source));
        plot_network(graph);
    })
    .text(function (d) { return d; })
    .property('selected',function(d){
       return sources.includes(d);
    })

d3.select("#select")    
  .append("button")
  .attr("type",'button')
  .text("Clear")
  .on("click",function(){
    d3.selectAll('option').property('selected',false);
    sources = [];
  })

var simulation = d3.forceSimulation()    

// Plot legend
var start_x = 0, start_y = 60;                   
for (var i=0; i<regions.length; i++){     
  svg.append('text')
     .classed('legend',true)
     .text(regions[i].region_txt)
     .attr('x',start_x)
     .attr('y',start_y + i*20 + 10)
     .style('fill',color(regions[i].region))
}



d3.json("data/terrorism_targets.json", function(error, graph) {
  if (error) throw error;
  data.push({'nodes':graph.nodes.slice(0), 'links':graph.links.slice(0)});
  clusters = 
  graph.links = graph.links.filter(d => sources.includes(d.source));
  plot_network(graph);

})

plot_network = function(graph){
    
  simulation = simulation.force("link", d3.forceLink().id(function(d)  { return d.id; }))
                   .force("charge", d3.forceManyBody().strength(-150))
                   .force("center", d3.forceCenter(width / 2, height / 2))
                   .force("gravity", d3.forceManyBody(100))

  var link = svg.append("g")
      .attr("class", "links")
    .selectAll("line")
    .data(graph.links)
    .enter().append("line")
      .attr("stroke-width", function(d) { return Math.sqrt(d.value); });

  var nodes = svg.append("g")
      .attr("class", "nodes")
    .selectAll("circle")
    .data(graph.nodes)
    .enter().append("circle")
      .attr("r", 9)
      .attr("fill", function(d) { return color(d.group); })
      .attr('group',d => d.group)      
      .call(d3.drag()
          .on("start", dragstarted)
          .on("drag", dragged)
          .on("end", dragended));

  nodes.append("text").classed('title',true)
      .text(function(d) { return d.id; });

  simulation
      .nodes(graph.nodes)
      .on("tick", ticked);

  simulation.force("link")
      .links(graph.links);

  function ticked() {

    link
        .attr("x1", function(d) { return d.source.x; })
        .attr("y1", function(d) { return d.source.y; })
        .attr("x2", function(d) { return d.target.x; })
        .attr("y2", function(d) { return d.target.y; });

    nodes
        .attr("cx", function(d) { return d.x; })
        .attr("cy", function(d) { return d.y; });        

  }

  function dragstarted(d) {
  if (!d3.event.active) simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
  }

  function dragged(d) {
    d.fx = d3.event.x;
    d.fy = d3.event.y;
  }

  function dragended(d) {
    if (!d3.event.active) simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
  }

}




