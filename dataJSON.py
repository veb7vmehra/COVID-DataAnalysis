 wrangleData() {
        let vis = this;
        
        // create random data structure with information for each land
        vis.stateInfo = {};
        vis.geoData.objects.states.geometries.forEach((d) => {
          let randomstateValue = Math.random() * 4;
          vis.stateInfo[d.properties.name] = {
            name: d.properties.name,
            category: "category_" + Math.floor(randomstateValue),
            color: vis.colors[Math.floor(randomstateValue)],
            
          };
        });
    
        vis.updateVis();
      }