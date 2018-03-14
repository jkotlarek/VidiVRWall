var data = [], sources = ['USA','GBR','RUS'], num_groups = 12;
var clusters;

var width = 900, height = 600;
var cluster_pt = {0: -300 , 1: -150, 2: 150 ,  3: 300}

var rad = 14, big_rad = 25, hover_rad = 20, hover_big_rad = 35;

var color = d3.scaleSequential(d3.interpolatePlasma).domain([0,num_groups]);

var tip = 
  d3.tip()
    .attr('class', 'd3-tip')
    .offset([-10, 0])
    .html(function(d) {
      var links = d3.selectAll('line'),
      as_source = links.filter(c => c.source.id == d.id),
      as_target = links.filter(c => c.target.id == d.id);

      return "<strong>Country: </strong><span class='details'>" + d.id +"</span><br>"+
             "<strong># as Source: </strong><span class='details'>" + as_source.nodes().length +"</span><br>"+
             "<strong># as Target: </strong><span class='details'>" + as_target.nodes().length +"</span>";
    })


var select = d3.select('#select').append('select')
    .attr("id","field_select")
    .attr("multiple",true)    

var options = select
  .selectAll('option')  
  .data(IDs).enter()
  .append('option')
  .on('mousedown',function(e){
        event.preventDefault();
        var txt = d3.select(this).text();
        d3.select(this).property('selected', !d3.select(this).property('selected'));
        if (sources.includes(txt)){
          var i = sources.indexOf(txt);
          sources = sources.slice(0,i).concat(sources.slice(i+1,sources.length));
        }else{
          sources.push(txt);
        }                
        d3.select('svg').remove();
        var graph = JSON.parse(JSON.stringify(data[0]));
        graph.nodes.forEach(function(d){
            delete d['x']; delete d['y']; delete d['vx']; delete d['vy'];
        });
        graph.links = graph.links.filter(d => sources.includes(d.source));
        plot_network(graph);
    })
    .text(function (d) { return d; })
    .property('selected',function(d){
       return sources.includes(d);
    })

d3.select("#select").append('p')  
  .append("button")
  .attr("type",'button')
  .text("Clear")
  .on("click",function(){
    d3.selectAll('option').property('selected',false);
    sources = [];
  })

// Plot legend
plot_legend = function(svg){
  var start_x = 0, start_y = 60;                   
  for (var i=0; i<regions.length; i++){     
    var this_region = regions.filter(d=>+d.region==i+1)[0];
    svg.append('text')
       .classed('legend',true)
       .text(this_region.region_txt)
       .attr('x',start_x)
       .attr('y',start_y + i*20 + 10)
       .attr('group',this_region.region)
       .style('fill',color(regions[i].region))
       .on('mouseover',function(){
        var x = +this.getAttribute('group');
        d3.selectAll('circle').filter(d => +d.group==x)
          .classed('selected',true)
          .attr('r', hover_rad)
          .filter(d => sources.includes(d.id))
          .attr('r', hover_big_rad)
       })
       .on('mouseout',function(){
        d3.selectAll('circle').attr('r',rad)
          .classed('selected',false)
          .filter(d => sources.includes(d.id))
          .attr('r', big_rad)
       })
  }
}


d3.json("data/terrorism_targets.json", function(error, graph) {
  if (error) throw error;
  data.push(JSON.parse(JSON.stringify(graph)));
  clusters = 
  graph.links = graph.links.filter(d => sources.includes(d.source));
  plot_network(graph);

})

plot_network = function(graph){

var simulation = d3.forceSimulation()    
                 .force("link", d3.forceLink().id(function(d)  { return d.id; }))
                 .force("charge", d3.forceManyBody().strength(-350).distanceMin(100))
                 .force("center", d3.forceCenter(width / 2, height / 2))
                 .force("gravity", d3.forceManyBody(100).distanceMax(100))
                 .force("y", d3.forceY(100))
                 .force("x", d3.forceX(-100))

  var svg = d3.select("#svg").append('svg').style("width","1100px").style("height","700px");      
  svg.call(tip);
  plot_legend(svg);


  var link = svg.append("g")
      .attr("class", "links")
    .selectAll("line")
    .data(graph.links)
    .enter().append("line")
      .attr("stroke-width", function(d) { return Math.sqrt(d.value); });

  var nodes = svg.append("g")
      .attr("class", "nodes")
    .selectAll("circle")
    .data(graph.nodes.slice(0))
    .enter().append("circle")
      .attr("r", function(d){ return sources.includes(d.id) ? big_rad : rad  })
      .attr("fill", function(d) { return color(d.group); })
      .attr('group',d => d.group)  
      .attr('id',d => d.id)          
      .call(d3.drag()
          .on("start", dragstarted)
          .on("drag", dragged)
          .on("end", dragended));    

    nodes.on('mouseover',function(d){
        d3.selectAll('line')
          .filter(c => c.target.id == d.id)
          .classed('selected',true);
          tip.show(d);
      }).on("mouseout",function(d){
        d3.selectAll('line').classed('selected',false);
        tip.hide();
      })

      sources.forEach(function(d){
        svg.append('text').text(d).classed('title',true);
      })
      var text = d3.selectAll('text.title');


  simulation
      .nodes(graph.nodes)
      .on("tick", ticked);

  simulation.force("link")
      .links(graph.links.slice(0));


  function ticked() {
    
    link
        .attr("x1", function(d) { return d.source.x; })
        .attr("y1", function(d) { return d.source.y; })
        .attr("x2", function(d) { return d.target.x; })
        .attr("y2", function(d) { return d.target.y; });

    nodes
        .attr("cx", function(d) { return d.x; })
        .attr("cy", function(d) { return d.y; })
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
  simulation.restart();
}




