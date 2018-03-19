var map;
function loadMapOnLocation(location){
    var geocoder = new google.maps.Geocoder();
    geocoder.geocode( { 'address': location}, function(results, status) {
          if (status == google.maps.GeocoderStatus.OK) {
            initMap(Number(results[0].geometry.location.lat()), Number(results[0].geometry.location.lng())) 
          }
    });
}

function initMap(lat,lng) {
    map = new google.maps.Map(document.getElementById('map'), {
      zoom: 8,
      center: {lat: lat, lng: lng},
      mapTypeId: 'terrain'
    });
    mapListener = google.maps.event.addListener(map,'tilesloaded',function(){
        google.maps.event.removeListener(mapListener);
        var northBound = map.getBounds().getNorthEast().lat();   
        var southBound = map.getBounds().getSouthWest().lat();
        var eastBound = map.getBounds().getNorthEast().lng();  
        var westBound = map.getBounds().getSouthWest().lng();
        getEarthquakesFromBounds(northBound,southBound,eastBound,westBound) 

    });

    map.data.setStyle(function(earthquake) {
        var magnitude = earthquake.getProperty('magnitude');
        return {
            icon: getCircle(magnitude)
        };
    });

    map.data.addListener('click', function(event) {
        $("#magnitude").text(event.feature.getProperty('magnitude'))
        $("#date").text(event.feature.getProperty('datetime'))
        $("#coordinates").text(event.feature.getProperty('lat') + "," + event.feature.getProperty('lng'))
        $("#earthquakeDetails").css('display','block')
    });
}

function getEarthquakesFromBounds(north,south,east,west){
    $.ajax({
            type: "GET",
            url: "http://api.geonames.org/earthquakesJSON?north=" + north + "&south=" + south + "&east=" + east + "&west=" + west + "&username=eduardo&date=3999-11-28&maxRows=10",
            dataType : "json",
            ContentType : "application/json",
            success: function(earthquakes) {
                // Since the json we are getting does not conform to the GeoJSON standard,
                // we need to make the GeoJSON manually
                 var earthquakesFeatureCollection = []
                 for (i in earthquakes.earthquakes){
                    var json = {
                        type : "Feature",
                        properties: earthquakes.earthquakes[i],
                        geometry: {
                            type: "Point",
                            coordinates: [
                                Number(earthquakes.earthquakes[i].lng),
                                Number(earthquakes.earthquakes[i].lat),
                            ]
                        }
                    }
                    earthquakesFeatureCollection.push(json)
                 }
                 // Now that everything is set, let's fill the map with the data now in GeoJSON format 
                 fillMap({
                    features : earthquakesFeatureCollection,
                    type : "FeatureCollection"
                 })
               
            },
            error: function(error){
                alert(error)
            }
    });

}

function getCircle(magnitude) {
    return {
        path: google.maps.SymbolPath.CIRCLE,
        fillColor: '#00cccc',
        fillOpacity: .6,
        scale: Math.pow(2, magnitude) / 2,
        strokeColor: 'white',
        strokeWeight: .5,
        clickable : true
    };
}

function fillMap(results) {
    map.data.addGeoJson(results);
}
function getAllEarthQuakesOlderThanDate(date,elems,callback){
    var givenDate = new Date(date);
    var currentDate = new Date()
    var difference = currentDate.getMonth() - givenDate.getMonth() + (12 * (currentDate.getFullYear() - givenDate.getFullYear()));
    if (difference < 12){
        $.ajax({
            type: "GET",
            url: 'http://api.geonames.org/earthquakesJSON?north=85.125628885&south=-78.4735667668&east=178.0556429004&west=-170.7309496069&username=eduardo&date=' + moment(givenDate).format('YYYY-MM-DD')  + '&maxRows=500',
            dataType : "json",
            ContentType : "application/json",
            success: function(earthquakes) {
                var lastElementDate = earthquakes.earthquakes[earthquakes.earthquakes.length - 1].datetime                
                getAllEarthQuakesOlderThanDate(lastElementDate,elems.concat(earthquakes.earthquakes),callback)   
            }               
        });
    }
    else{
        callback(elems)
    }

    
}

function sortOnMagnitude(e1, e2) {
    return e2.magnitude - e1.magnitude ;
}



// JQuery Functions
$(document).ready(function(){
    $("#searchButton").on("click", function(){
        loadMapOnLocation($("#location").val())
    });

    $(".close").on("click", function(){
        $("#earthquakeDetails").css('display','none')
        $('html, body').animate({ scrollTop: 0 }, 500);
    });
    $(".close").on("click", function(){
        $("#earthquakeDetails").css('display','none')
        $('html, body').animate({ scrollTop: 0 }, 500);
    });
    $("#searchMenuButton").on("click", function(){
        $("#topEarthquakesContent").css('display','none')
        $("#pageContentSearch").css('display','block')
        
    });
    $("#submit").submit(function(){
        $("#topEarthquakesContent").css('display','none')
        $("#pageContentSearch").css('display','block')
        
    });
    $("#topMenuButton").on("click", function(){
        $("#pageContentSearch").css('display','none')
        $("#topEarthquakesContent").css('display','block')
        getAllEarthQuakesOlderThanDate(new Date(),[],function(earthquakes){
            var sortedEarthquakes = earthquakes.sort(sortOnMagnitude)
            var topTenEarthquakes = sortedEarthquakes.slice(0,10)
            $("#contentTable").empty()
            for (var i in topTenEarthquakes){
                insertEarthquakeToTable(topTenEarthquakes[i])
            }
        })  
    });

    function insertEarthquakeToTable(earthquake){
        $('<tr> <td>' + earthquake.magnitude + '</td> ' + 
                '<td> ' + earthquake.lat + ',' + earthquake.lng + '</td>' +
                '<td>' + earthquake.datetime + '</td>' + 
           '</tr>').appendTo('#contentTable')
    }

})


