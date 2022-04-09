/* * * * * * * * * * * * * *
*          MapVis          *
* * * * * * * * * * * * * */


class MapVis {

    // constructor method to initialize Timeline object
    constructor(parentElement, covidData, geoData) {
        this.parentElement = parentElement;
        this.covidData = covidData;
        this.geoData = geoData;    
        
        this.displayData = [];

        // parse date method
        this.parseDate = d3.timeParse("%m/%d/%Y");

        // define colors
        this.colors = ["#b4cce0", "#a7d2dd", "#499fa4", "#499fa4", "#428A8D", "#538898", "#336b89", "#175873", "#2e3f42"];

        this.initVis();
    }

    initVis() {
        let vis = this;
    
        vis.wrangleData("absCases");
      }
    
      //Added as have to initially define the SelecedCategory to Avoid Breaking
      wrangleData(selectedCategory) {
        let vis = this

        //Definition of Basic CSS Stuff
        vis.margin = { top: 20, right: 20, bottom: 20, left: 20 };
        vis.width =
          document.getElementById(vis.parentElement).getBoundingClientRect().width -
          vis.margin.left -
          vis.margin.right;
        vis.height =
          document.getElementById(vis.parentElement).getBoundingClientRect()
            .height -
          vis.margin.top -
          vis.margin.bottom;
    
        // init drawing area
        vis.svg = d3
          .select("#" + vis.parentElement)
          .append("svg")
          .attr("width", vis.width)
          .attr("height", vis.height)
          .attr("transform", `translate (${vis.margin.left}, ${vis.margin.top})`);
    
        // creation of SVG of D3
        vis.svg
          .append("g")
          .attr("class", "title")
          .attr("id", "map-title")
          .append("text")
          .text("COVID-19 Heat Map")
          .attr("transform", `translate(${vis.width / 2}, 20)`)
          .attr("text-anchor", "middle");
    
        // TODO
        //Definition of Projection over Map
        vis.projection = d3
          .geoAlbersUsa()
          .translate([vis.width / 2, vis.height / 2])
          .scale((vis.height ) * 1.6);
    
        vis.path = d3.geoPath().projection(vis.projection);
        

        vis.usa = topojson.feature(
          vis.geoData,
          vis.geoData.objects.states
        ).features;
    
        // vis.svg
        //   .append("path")
        //   .datum(d3.geoGraticule())
        //   .attr("class", "graticule")
        //   .attr("fill", "#ADDEFF")
        //   .attr("stroke", "rgba(129,129,129,0.35)")
        //   .attr("d", vis.path);
    
        // d3.geoGraticule();

        //Passing of the data to plot the map
        vis.states = vis.svg
          .selectAll(".state")
          .data(vis.usa)
          .enter()
          .append("path")
          .attr("class", "state")
          .attr("d", vis.path);
    
        vis.tooltip = d3
          .select("body")
          .append("div")
          .attr("class", "tooltip")
          .attr("id", "pieTooltip"); //LOOK
    
        vis.x = d3
          .scaleLinear()
          .domain([0, 100])
          .range([0, vis.width / 1.68]);
    
        // vis.y = d3.scaleLinear().range([0, vis.height]).domain([4, 4]).padding(0.1);
    
        // vis.xAxis = d3.axisBottom().scale(vis.x).ticks(4);
    
        // vis.legend.call(vis.xAxis);
        //Addition of Lagend
        vis.legend = vis.svg
          .append("g")
          .attr("class", "legend")
          .attr(
            "transform",
            `translate(${(vis.width * 2.8) / 8}, ${vis.height - 20})`
          )
          .call(d3.axisBottom(vis.x).ticks(3));
        //   .call(vis.xAxis);
    
        vis.legend
          .selectAll()
          .data(vis.colors)
          .enter()
          .append("rect")
          .attr("x", function (d, i) {
            return i * 50;
          })
          .attr("y", -21.5)
          .attr("width", 50)
          .attr("height", 20)
          .attr("fill", (d) => d);
    
        let m0, o0;
    
        // vis.svg.call(
        //   d3
        //     .drag()
        //     .on("start", function (event) {
        //       let lastRotationParams = vis.projection.rotate();
        //       m0 = [event.x, event.y];
        //       o0 = [-lastRotationParams[0], -lastRotationParams[1]];
        //     })
        //     .on("drag", function (event) {
        //       if (m0) {
        //         let m1 = [event.x, event.y],
        //           o1 = [o0[0] + (m0[0] - m1[0]) / 4, o0[1] + (m1[1] - m0[1]) / 4];
        //         vis.projection.rotate([-o1[0], -o1[1]]);
        //       }
    
        //       // Update the map
        //       vis.path = d3.geoPath().projection(vis.projection);
        //       d3.selectAll(".state").attr("d", vis.path);
        //       d3.selectAll(".graticule").attr("d", vis.path);
        //     })
        // );
        

        //Converting the Passed selectedCategories to Columns in data csv
        switch(selectedCategory){
          case "absCases":
            selectedCategory = "conf_cases";
            vis.selected = "Total Confirmed Cases";
            break;
          case "absDeaths":
            selectedCategory = "conf_death";
            vis.selected = "Total Confirmed Deaths";
            break;
          case "relCases":
            selectedCategory = "pnew_case";
            vis.selected = "Relatively New Cases";
            break;
          case "relDeaths":
            selectedCategory = "pnew_death";
            vis.selected = "Relatively New Deaths";
            break;  
        }
        // check out the data
        // console.log(vis.covidData)
        // console.log(vis.usaData)

        // first, filter according to selectedTimeRange, init empty array
        let filteredData = [];

        // if there is a region selected
        if (selectedTimeRange.length !== 0) {
            //console.log('region selected', vis.selectedTimeRange, vis.selectedTimeRange[0].getTime() )

            // iterate over all rows the csv (dataFill)
            vis.covidData.forEach(row => {
                // and push rows with proper dates into filteredData
                if (selectedTimeRange[0].getTime() <= vis.parseDate(row.submission_date).getTime() && vis.parseDate(row.submission_date).getTime() <= selectedTimeRange[1].getTime()) {
                    filteredData.push(row);
                }
            });
        } else {
            filteredData = vis.covidData;
        }

        // prepare covid data by grouping all rows by state
        let covidDataByState = Array.from(d3.group(filteredData, d => d.state), ([key, value]) => ({key, value}))

        // have a look
        // console.log(covidDataByState)

        // init final data structure in which both data sets will be merged into
        vis.stateInfo = {}

        let maxCases = 0;
        covidDataByState.forEach(row => {
            let cases = 0;
            row.value.forEach(entry => {
                cases += +entry[selectedCategory];
            });
            if(cases > maxCases){
                maxCases = cases;
            }
            //console.log(row.value[0]["state"], cases)
        })

        // merge
        vis.geoData.objects.states.geometries.forEach((d) => {
            vis.stateInfo[d.properties.name] = {
              name: d.properties.name,
              color: "#ffffff"
            };
          });
        covidDataByState.forEach(state => {

            // get full state name
            let stateName = nameConverter.getFullName(state.key)

            // init counters
            let newCasesSum = 0;
            let newDeathsSum = 0;
            let population = 0;
            let totalCases = 0;

            // look up population for the state in the census data set
            vis.covidData.forEach(row => {
                if (row.state === stateName) {
                    population += +row["2020"].replaceAll(',', '');
                }
            })

            // calculate new cases by summing up all the entries for each state
            state.value.forEach(entry => {
                newCasesSum += +entry['new_case'];
                newDeathsSum += +entry['new_death'];
                totalCases += +entry[selectedCategory];
            });

            // populate the final data structure
            vis.stateInfo[stateName]=
                {
                    name: stateName,
                    population: totalCases,
                    absCases: newCasesSum,
                    absDeaths: newDeathsSum,
                    relCases: (newCasesSum / population * 100),
                    relDeaths: (newDeathsSum / population * 100),
                    color: vis.colors[Math.floor(0.01 + (vis.colors.length-1)*((totalCases)/maxCases))] 
                }
            
        })

        //console.log('final data structure for myDataTable', vis.stateInfo);

        vis.updateVis()

    }

    //  wrangleData() {
    //     let vis = this;
        
    //     // create random data structure with information for each land
    //     vis.stateInfo = {};
    //     vis.geoData.objects.states.geometries.forEach((d) => {
    //       let randomstateValue = Math.random() * 4;
    //       vis.stateInfo[d.properties.name] = {
    //         name: d.properties.name,
    //         category: "category_" + Math.floor(randomstateValue),
    //         color: vis.colors[Math.floor(randomstateValue)],
            
    //       };
    //     });
    
    //     vis.updateVis();
    //   }
    
      updateVis() {
        let vis = this;
    
        // vis.states = vis.svg
        //   .selectAll(".state")
        //   .data(vis.usa)
        //   .enter()
        //   .merge(vis.states)
        //   .append("path")
        //   .attr("class", "state")
        //   .attr("d", vis.path)
        //   .attr("fill", function (d) {
        //     console.log(vis.stateInfo[d.properties.name].color);
        //     return vis.stateInfo[d.properties.name].color;
        //   });
    
        vis.svg
          .selectAll(".state")
          .style("fill", function (d) {
            return vis.stateInfo[d.properties.name].color;
          })
          .on("mouseover", function (event, d) {
            d3.select(this)
              .attr("stroke-width", "2px")
              .attr("stroke", "black")
              .attr("fill", vis.stateInfo[d.properties.name].color);
            
            vis.tooltip
              .style("opacity", 1)
              .style("left", event.pageX + 20 + "px")
              .style("top", event.pageY + "px").html(`
                <div style="border: thin solid grey; border-radius: 5px; background: lightgrey; padding: 20px">
                <h2>${vis.stateInfo[d.properties.name].name}</h2>  
                    <h4> ${(vis.selected)}: ${(vis.stateInfo[d.properties.name].population)}</h4>
                </div>`);
          })
          .on("mouseout", function (event, d) {
            d3.select(this)
              .attr("stroke-width", "0px")
              .attr("fill", (d) => vis.stateInfo[d.properties.name].color);
    
            vis.tooltip
              .style("opacity", 0)
              .style("left", 0)
              .style("top", 0)
              .html(``);
          });
    
        // TODO
      }

}