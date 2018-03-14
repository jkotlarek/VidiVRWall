function stackedbar(filename) {
    //set up canvas
    var margin = { top: 50, bottom: 50, left: 50, right: 50 },
        width = 850 - margin.left - margin.right,
        height = 650 - margin.top - margin.bottom;

    var canvas = d3.select("body")
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    var dashboardWidth = 250,
        dashboardHeight = 200;

    // read in data
    d3.csv(filename, function(terrorism){

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
        // weapons.forEach(function(w){
        //     if (temp[w] == undefined)
        //         temp[w] = 0;
        // })
        values.push(temp);
     })
     data = values;


    // get keys other than year
    var keys = [];
    for(key in data[0]) {
        if(key != "Year"){
            keys.push(key);
        }
    }    
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

    var tooltip = d3.select("body")
                .append("div")
                .attr("class", "tooltip")
                .style("opacity", 0);

    
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
            .on("mousemove", function(d, i) {
                var mouseX = d3.mouse(this)[0];
                var invertedX = xScale.invert(mouseX);

                var mouseY = d3.mouse(this)[1];
                var invertedY = yScale.invert(mouseY);
                var currDashboardData;

                tooltip.html("Stream name: " +keys[i]+
                    "<br>Year: " +parseInt(invertedX)+
                    "<br>Value: " +(yAxisScale.invert(mouseY)))  

                    .style("left", (d3.event.pageX) + "px")
                    .style("top", (d3.event.pageY - 28) + "px")
                    .style("opacity", .9);           
                    
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
                    tooltip.style("opacity", 0);
                });

        

    canvas.append("g")
        .attr("class", "axis")
        .attr("transform", "translate(0," + (height-80) + ")")
        .call(d3.axisBottom(xScale));
    canvas.append("g")
        .attr("class", "axis")
        .attr("transform", "translate(80,0)")
        .call(d3.axisLeft(yAxisScale));
     
    });
}
stackedbar("data/terrorism_small.csv");