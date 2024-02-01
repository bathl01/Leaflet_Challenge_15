// API key
const api_key = "pk.eyJ1IjoidGFsbGFudGo5NSIsImEiOiJjbGQwYmlicW0ydnZmM3BrNjhzcGxoMHVqIn0.NFVBr7AMOYS5BC5OwcXerA";
// Store our API endpoint as queryUrl.
const urlEQ = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_month.geojson";
const urlTP = "https://raw.githubusercontent.com/fraxen/tectonicplates/master/GeoJSON/PB2002_boundaries.json"

// Create Base(title) layergroups
var mapOutdoors = L.tileLayer('https://api.mapbox.com/styles/v1/mapbox/{id}/tiles/{z}/{x}/{y}?access_token={access_token}', {
  attribution: "Map data & copy; <a href=\"https://www.openstreetmap.org/\">OpenStreetMap</a> contributors, <a href=\"https://creativecommons.org/licenses/by-sa/2.0/\">CC-BY-SA</a>, Imagery © <a href=\"https://www.mapbox.com/\">Mapbox</a>",
  maxZoom: 20,
  id: 'outdoors-v10',
  access_token: api_key
});
var mapGray = L.tileLayer('https://api.mapbox.com/styles/v1/mapbox/{id}/tiles/{z}/{x}/{y}?access_token={access_token}', {
  attribution: "Map data & copy; <a href=\"https://www.openstreetmap.org/\">OpenStreetMap</a> contributors, <a href=\"https://creativecommons.org/licenses/by-sa/2.0/\">CC-BY-SA</a>, Imagery © <a href=\"https://www.mapbox.com/\">Mapbox</a>",
  maxZoom: 20,
  id: 'light-v10',
  access_token: api_key
});  

var mapDarkGray = L.tileLayer('https://api.mapbox.com/styles/v1/mapbox/{id}/tiles/{z}/{x}/{y}?access_token={access_token}', {
  attribution: "Map data & copy; <a href=\"https://www.openstreetmap.org/\">OpenStreetMap</a> contributors, <a href=\"https://creativecommons.org/licenses/by-sa/2.0/\">CC-BY-SA</a>, Imagery © <a href=\"https://www.mapbox.com/\">Mapbox</a>",
  maxZoom: 20,
  id: 'dark-v11',
  access_token: api_key
});  

var mapStreet = L.tileLayer('https://api.mapbox.com/styles/v1/mapbox/{id}/tiles/{z}/{x}/{y}?access_token={access_token}', {
  attribution: "Map data & copy; <a href=\"https://www.openstreetmap.org/\">OpenStreetMap</a> contributors, <a href=\"https://creativecommons.org/licenses/by-sa/2.0/\">CC-BY-SA</a>, Imagery © <a href=\"https://www.mapbox.com/\">Mapbox</a>",
  maxZoom: 20,
  id: 'streets-v12',
  access_token: api_key
});  

var mapSatellite = L.tileLayer('https://api.mapbox.com/styles/v1/mapbox/{id}/tiles/{z}/{x}/{y}?access_token={access_token}', {
  attribution: "Map data & copy; <a href=\"https://www.openstreetmap.org/\">OpenStreetMap</a> contributors, <a href=\"https://creativecommons.org/licenses/by-sa/2.0/\">CC-BY-SA</a>, Imagery © <a href=\"https://www.mapbox.com/\">Mapbox</a>",
  maxZoom: 20,
  id: 'satellite-streets-v12',
  access_token: api_key
});  

// Create layerGroups
var earthquakes = L.layerGroup();
var tectonicPlates = L.layerGroup();

// Create base map to hold base Layers
var mapBase = {
  "Outdoor Map" : mapOutdoors,
  "Street Map" : mapStreet,
  "Gray Map" : mapGray,
  "Dark Gray Map" : mapDarkGray,
  "Satellite Map" : mapSatellite
}

// Create overlay object to hold our overlay layers
var mapOverlay = {
  "Earthquakes": earthquakes,
  "Tectonic Plates": tectonicPlates 
};

// Create our map, giving it the mapColor map and earthquakes layers to display on load.
var myMap = L.map("map", {
  center: [
    39.09, -98.71
  ],
  zoom: 4,
  layers: [mapOutdoors, earthquakes]
});

 // Add the layer control to the map
 L.control.layers(mapBase, mapOverlay, {
  collapsed: false
}).addTo(myMap);

// Function to determine marker size
function markerSize(magnitude) {
  return magnitude * 3;
};

// Function to add color based on depth
function colorCode(depth) {
  if (depth <= 10) return "lightgreen";     
  else if (depth <= 30) return "yellow";    
  else if (depth <= 50) return "orange";    
  else if (depth <= 70) return "orangered"; 
  else if (depth <= 90) return "darkred"; 
  else return "darkviolet";                        
}
function createFeatures(earthquakeData) {
  
  // Create a GeoJSON layer that contains the features array on the earthquakeData object.
  var earthquakeLayer = L.geoJSON(earthquakeData, {
    onEachFeature: function(feature, layer) {
      layer.bindPopup(`<h3>Location: ${feature.properties.place}</h3>
      <hr><p>Date: ${new Date(feature.properties.time)}</p>
      <p>Magnitude: ${feature.properties.mag}</p>
      <p>Depth: ${feature.geometry.coordinates[2]}</p>`);
    },
  
    // Point to layer used to alter markers
    pointToLayer: function(feature, latlng) {

      // Determine the style of markers based on properties
      var markers = {
        radius: markerSize(feature.properties.mag),
        fillColor: colorCode(feature.geometry.coordinates[2]),
        color: colorCode(feature.geometry.coordinates[2]),
        weight: 1,
        opacity: .9,
        fillOpacity: 0.5
      };
      return L.circleMarker(latlng, markers);
    },
  });
  // Use Promise.all to wait for both requests to complete
  Promise.all([d3.json(urlEQ), d3.json(urlTP)])
    .then(function (results) {
      var earthquakeData = results[0];
      var tectonicPlateData = results[1];
      
      // Add earthquake layer to the map
      earthquakeLayer.addData(earthquakeData.features);
      earthquakeLayer.addTo(myMap);

      // Add tectonic plates layer to the map
      tectonicPlateLayer = L.geoJSON(tectonicPlateData, {
        color: "magenta",
        weight: 2
      });
      tectonicPlateLayer.addTo(tectonicPlates);
      tectonicPlates.addTo(myMap);

      // Add legend
      var legend = L.control({position: "bottomright"});

      legend.onAdd = function(map) {
        var div = L.DomUtil.create("div", "info legend"),
        depth = [-10, 10, 30, 50, 70, 90]
        labels = [];

        div.innerHTML += "<h3 style='text-align: center'>Depth</h3>"

        for (var i = 0; i < depth.length; i++) {
          div.innerHTML +=
            '<i style="background:' + colorCode(depth[i] + 1) + ' "> color </i> ' +
            depth[i] + (depth[i + 1] ? '&ndash;' + depth[i + 1] + '<br>' : '+');
        }
        return div;
      };
      legend.addTo(myMap);

      // Add layers to the map
      earthquakes.addLayer(earthquakeLayer);
      tectonicPlates.addTo(myMap);
      earthquakes.addTo(myMap);

      })
      .catch(function (error) {
        console.log("Error fetching data:", error);
  });
}
// Call the function to create features
createFeatures();
