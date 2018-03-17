function stackedbar(filename) {
    //set up canvas
    var margin = { top: 50, bottom: 50, left: 50, right: 50 },
        width = 850 - margin.left - margin.right,
        height = 650 - margin.top - margin.bottom;

    var canvas = d3.select("#svg")
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    var dashboardWidth = 250,
        dashboardHeight = 200;


    var tip = d3.tip()
        .attr('class', 'd3-tip')
        .offset([100, -100])
        .html(function(d) {
          // return "<strong>Country: </strong><span class='details'>" + d.properties.name + "<br></span>" + "<strong>" + d3.select("#field_select").node().value + ": </strong><span class='details'>" + format(d.population) +"</span>";
          return "<strong> Weapon </strong>: <span class='details'>" +d.weapon+"</span><br>"+
                 "<strong> Year </strong>: <span class='details'>" +d.year+"</span><br>"+
                 "<strong> # Kills </strong>: <span class='details'>" +d.nkill+"</span><br>";
        })

    canvas.call(tip);
    // read in data
    d3.csv(filename, type, function(terrorism){

    var data = d3.nest()
    .key(function(d) { return d.iyear; })
    .rollup(function(v) {       
        return d3.nest()
            .key(function(d){ return d.weaptype1_txt;})
            .rollup(function(c){
                return d3.mean(c, function(e){return e.nkill;})    
            }).entries(v);
     }).entries(terrorism);

     var values = [];
     data.forEach(function(x){
        var temp = {'Year':+x.key};
        x.value.forEach(function(w){
            temp[w.key] = w.value;
        })
        values.push(temp);
     })
     data = values;


    // get keys other than year
    var keys = [];
    for (var row in data){
        for (var key in data[row]) {
            if(key != "Year"){
                keys.push(key);
            }
        }    
    }
    keys = Array.from(new Set(keys));

    data.forEach(function(d){
        keys.forEach(function(key){
            if (d[key]==undefined)
                d[key] = 0;
        })
    })

    var stacks = d3.stack()
        .offset(d3.stackOffsetSilhouette)
        .keys(keys);
    var layers = stacks(data);

    var dashboardData = d3.stack().keys(keys)(data);

    var minX = d3.min(data, function(d){
       return d.Year; 
    });

    var maxX = d3.max(data, function(d){
        return d.Year;
    });

    var minY = d3.min(layers, function(l) {
        return d3.min(l, function(d) {
            return d[0];
        })
    });

    var maxY = d3.max(layers, function(l) {
        return d3.max(l, function(d) {
            return d[1];
        })
    });

    var xScale = d3.scaleLinear()        
        .domain([minX, maxX])
        .range([80, width-80]);

    var yScale = d3.scaleLinear()
        .domain([minY, maxY])
        .range([height-80, 80]);
    
    var yAxisScale = d3.scaleLinear()
        .domain([0, 2*maxY])
        .range([height-80, 80]);

    var dashboardMinY = d3.min(data, function(d) {
        var min = 1000000000000000000000;
        keys.forEach(function(k) {
            if(d[k] < min) {
                min = d[k];
            }
        });
        return min;
    });

    var dashboardMaxY = d3.max(data, function(d) {
        var max = 0;
        keys.forEach(function(k) {
            if(d[k] > max) {
                max = d[k];
            }
        });
        return max;
    });

    var dashboardXScale = d3.scaleLinear()
        .domain([minX, maxX])
        .range([0, dashboardWidth])

    var dashboardYScale = d3.scaleLinear()
        .domain([minY, maxY])        
        .range([dashboardHeight, 0]);

// http://stackoverflow.com/questions/40198378/d3-line-x-y-interpolate-is-not-a-function
    var area = d3.area()
        .curve(d3.curveCardinal)
        .x(function(d){
            return xScale(d.data.Year);
        })
        .y0(function(d){
            return yScale(d[0]);
        })
        .y1(function(d){
            return yScale(d[1]);
        });

    var colorScale = d3.scaleOrdinal(d3.schemeCategory10);
    var numRowScale = d3.scaleLinear()
        .domain([minX, maxX])
        .range([0, data.length]);
    
    canvas.selectAll("g")
        .data(layers)
        .enter()
        .append("g")
        .attr("fill", function(d) { 
            return colorScale(d.key);
        })
    canvas.selectAll("path") // create rect in panels.html
            .data(layers)
            .enter()
            .append("path")
            .attr("d", area)
            .attr("fill", function(d) {
                console.log(d);
                return colorScale(d.key);
            });

    canvas.selectAll("path")
            .attr("opacity", 1)
            .attr("weapon",function(d,i){return  keys[i]})
            .on("mousemove", function(d, i) {
                var mouseX = d3.mouse(this)[0];
                var invertedX = xScale.invert(mouseX);

                var mouseY = d3.mouse(this)[1];
                var invertedY = yScale.invert(mouseY);
                var currDashboardData;

                var dat = {'weapon':keys[i],'year':parseInt(invertedX),'nkill':Math.round(yAxisScale.invert(mouseY)*1000)/1000}
                tip.show(dat);          
                    
                currDashboardData = d[parseInt(numRowScale(parseInt(invertedX)))].data;
                            
                      
                canvas.selectAll("path")
                    .attr("opacity", function(d, j) {
                        if(j != i) {
                            return 0.5;
                        }
                        else {
                            return 1;
                        }
                    });
                })                  
                .on("mouseout", function(d) {
                    canvas.selectAll("path")
                        .attr("opacity", 1);  
                    tip.hide();                  
                });

    var leg = d3.select("#legend").style("height","480px")
        leg.append("text").attr("class","h4").text("Weapons");
    var ul = leg.append('ul').classed('legend',true);
    for (var i = 0; i < keys.length; i++){
        ul.append('li')
          .append('text')
          .text(keys[i])
          .classed('legend',true)
          .style("stroke","white")
          .style("color",colorScale(keys[i]))
          .on("mouseover",function(){
             var d = this.innerHTML;
             canvas.selectAll("path")
                    .attr("opacity", function(e) { return ( d!=e.key ? 0.5 : 1); });
          }).on('mouseout',function(){
             canvas.selectAll("path").attr("opacity", 1); 
          }); 
    }
      
      


    canvas.append("g")
        .attr("class", "axis")
        .attr("transform", "translate(0," + (height-80) + ")")
        .call(d3.axisBottom(xScale).tickFormat(d3.format("d")));
    canvas.append("g")
        .attr("class", "axis")
        .attr("transform", "translate(80,0)")
        .call(d3.axisLeft(yAxisScale));

    canvas.append("text")             
      .attr("transform",
            "translate(" + (width/2) + " ," + 
                           (height - 20) + ")")
      .style("text-anchor", "middle")
      .classed("title",true)
      .text("Date");

    canvas.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 20)
      .attr("x",0 - (height / 2))
      .attr("dy", "1em")
      .style("text-anchor", "middle")
      .classed("title",true)
      .text("# of Kills");   
     
    });
}
stackedbar("data/terrorism_small.csv");