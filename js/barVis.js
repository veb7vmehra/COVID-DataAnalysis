/* * * * * * * * * * * * * *
*      class BarVis        *
* * * * * * * * * * * * * */


class BarVis {

    constructor(parentElement, covidData, usaData, decending) {
        this.parentElement = parentElement;
        this.covidData = covidData;
        this.usaData = usaData;
        this.displayData = [];
        this.decending = decending;

        // parse date method
        this.parseDate = d3.timeParse("%m/%d/%Y");

        this.initVis()
    }

    initVis(){
        let vis = this;
        this.wrangleData();

    }

    wrangleData(){
        let vis = this
        // Pulling this straight from dataTable.js
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
        
        // init final data structure in which both data sets will be merged into
        vis.stateInfo = []

        // merge
        covidDataByState.forEach(state => {

            // get full state name
            let stateName = nameConverter.getFullName(state.key)

            // init counters
            let newCasesSum = 0;
            let newDeathsSum = 0;
            let population = 0;

            // look up population for the state in the census data set
            vis.usaData.forEach(row => {
                if (row.state === stateName) {
                    population += +row["2020"].replaceAll(',', '');
                }
            })

            // calculate new cases by summing up all the entries for each state
            state.value.forEach(entry => {
                newCasesSum += +entry['new_case'];
                newDeathsSum += +entry['new_death'];
            });

            // populate the final data structure
            vis.stateInfo.push(
                {
                    state: stateName,
                    population: population,
                    absCases: newCasesSum,
                    absDeaths: newDeathsSum,
                    relCases: (newCasesSum / population * 100),
                    relDeaths: (newDeathsSum / population * 100)
                }
            )
        })
        // TODO: Sort and then filter by top 10
        // maybe a boolean in the constructor could come in handy ?

        if (vis.decending){
            console.log(vis.decending)
            vis.stateInfo.sort((a,b) => {return b.absCases - a.absCases})
        } else {
            console.log(vis.decending)
            vis.stateInfo.sort((a,b) => {return a.absCases - b.absCases})
        }

        //console.log('final data structure', vis.stateInfo);

        vis.topTenData = vis.stateInfo.slice(0, 10)
        console.log('final data structure', vis.topTenData);


        vis.updateVis()

    }

    updateVis(){
        let vis = this;
        let maxVal = 0;
        
        vis.topTenData.forEach(val => {
            if(val.absCases > maxVal) maxVal = val.absCases;
        });
        vis.margin = {top: 40, right: 20, bottom: 20, left: 40};
        vis.width = document.getElementById(vis.parentElement).getBoundingClientRect().width - vis.margin.left - vis.margin.right;
        vis.height = (document.getElementById(vis.parentElement).getBoundingClientRect().height - vis.margin.top - vis.margin.bottom)*0.4;
        vis.xScale = d3.scaleBand()
        .range([0, vis.width])
        .domain(vis.topTenData.map((s) => s.state))
        .padding(0.2)
        vis.yScale = d3.scaleLinear().range ([vis.height, 0]).domain([0, maxVal * 1.1 / 1000000]);

        // init drawing area
        vis.svg = d3.select("#" + vis.parentElement).append("svg")
            .attr("width", vis.width + vis.margin.left + vis.margin.right)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
            .append('g')
            .attr('transform', `translate (${vis.margin.left}, ${vis.margin.top})`);

        // add title
        let text = "";
        if(vis.decending) text = "Regions with Most Covid-19 Cases (in Millions)";
        else text = "Regions with Least Covid-19 Cases (in Millions)";
        vis.svg.append('g')
            .attr('class', 'title bar-title')
            .append('text')
            .text(text)
            .attr('transform', `translate(${vis.width / 2}, -20)`)
            .attr('text-anchor', 'middle');

        vis.svg.append('g')
            .call(d3.axisLeft(vis.yScale));

        vis.svg.append('g')
            .style("font", "8px times")
            .attr('transform', `translate(0, ${vis.height})`)
            .call(d3.axisBottom(vis.xScale));


        // tooltip
        vis.tooltip = d3.select("body").append('div')
            .attr('class', "tooltip")
            .attr('id', 'barTooltip')
        
        vis.svg.selectAll()
            .data(vis.topTenData)
            .enter()
            .append('rect')
            .attr('fill', "#175873")
            .attr('x', (s) => vis.xScale(s.state))
            .attr('y', (s) => vis.yScale(s.absCases/1000000))
            .attr('height', (s) => vis.height - vis.yScale(s.absCases/1000000))
            .attr('width', vis.xScale.bandwidth())
            
    }



}