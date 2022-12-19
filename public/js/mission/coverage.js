
var map;
var infoWindow;
var flightArea;
var pointUpdateTimeout = null;
var areaResetTimeout = null;
var rowEnds;
var displayLines = [];
var colors = ["#FF0000","#00FF00","#0000FF",
              "#00FFFF","#FF00FF","#FFFF00",
              "#FFFFFF","#000000"];
var rowLineColor = colors[5];

function pad(n, width, z) {
  z = z || '0';
  n = n + '';
  return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}

function toggleHelp() {
    $("#help").toggle();
}

function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        center: new google.maps.LatLng(startLat,startLng),
        mapTypeId: 'hybrid'
    });

    // Define the LatLng coordinates for the polygon's path.
    var triangleCoords = [
        {lat:startLat,  lng:startLng},
        {lat:startLat+0.001,  lng:startLng},
        {lat:startLat+0.001,  lng:startLng+0.001},
        {lat:startLat,  lng:startLng+0.001}
    ];

    // Construct the polygon.
    flightArea = new google.maps.Polygon({
        paths: triangleCoords,
        strokeColor: '#BB0000',
        strokeOpacity: 1,
        strokeWeight: 1,
        fillColor: '#4444BB',
        fillOpacity: 0.2,
        editable: true,
        draggable:true
    });
    flightArea.setMap(map);

    deleteMenu = new DeleteMenu();

    // Define an info window on the map.
    infoWindow = new google.maps.InfoWindow();
    
    setPathListeners();
    queuePointsAreaUpdate();
    google.maps.event.trigger(map, 'resize');
}
    
function setPathListeners() {
    google.maps.event.addListener(flightArea.getPath(), 'set_at', function(event) {
        queuePointsAreaUpdate();
    });
    
    google.maps.event.addListener(flightArea.getPath(), 'insert_at', function(event) {
        queuePointsAreaUpdate();
    });
    
    google.maps.event.addListener(flightArea, 'rightclick', function(e) {
        // Check if click was on a vertex control point
        if (e.vertex == undefined) {
          return;
        }
        deleteMenu.open(map, flightArea.getPath(), e.vertex);
    });
}
  
function queuePointsAreaUpdate() {
    clearTimeout(pointUpdateTimeout);
    clearTimeout(areaResetTimeout);
    clearDisplayLines();
    pointUpdateTimeout = setTimeout(function(){updatePointsTextarea();updateFlightPath()}, 500);
}

function updatePointsTextarea() {
    var str = "";
    var path = flightArea.getPath();
    //console.log(path.length);
    for (var i = 0; i < path.length; i++) {
        if (i > 0) {
            str += ",\n";
        }
        var loc = path.getAt(i);
        str += loc.lat() + ", "+loc.lng();
    }    
    $("#points").val(str);
}
  
function queueAreaReset() {
    clearTimeout(pointUpdateTimeout);
    clearTimeout(areaResetTimeout);
    areaResetTimeout = setTimeout(function(){resetAreaFromInput()}, 500);
}

function resetAreaFromInput() {
    $("#feedback").empty();
    var input = $("#points").val();
    var parts = input.split(",");
    if (parts.length % 2 != 0) {
        $("#feedback").html("Need even number of values to interpret as lat/lng points");
        return;
    }
    var pts = [];
    for (var i = 0; i < parts.length; i+=2) {
        var lat = parseFloat(parts[i]);
        var lng = parseFloat(parts[i+1]);
        if ( isNaN(lat) || isNaN(lng) ) {
            $("#feedback").html("Need numerical values to interpret as lat/lng points");
            return;
        }
        pts.push( {lat: lat, lng: lng} );
    }    
    flightArea.setMap(null);
    flightArea.setPaths(pts);
    flightArea.setMap(map);
    setPathListeners();
    updateFlightPath();
}

function recenterView() {
    var markers = flightArea.getPath();
    var bounds = new google.maps.LatLngBounds();
    for (var i = 0; i < markers.length; i++) {
        bounds.extend(markers.getAt(i));
    }    
    map.fitBounds(bounds);
}

function recenterArea() {
    var path = flightArea.getPath();
    var bounds = new google.maps.LatLngBounds();
    for (var i = 0; i < path.length; i++) {
        bounds.extend(path.getAt(i));
    }
    var areaCenter = bounds.getCenter();
    var viewCenter = map.getCenter();
    var latDelta = viewCenter.lat() - areaCenter.lat();
    var lngDelta = viewCenter.lng() - areaCenter.lng();
    var pts = [];
    for (var i = 0; i < path.length; i++) {
        var pt = path.getAt(i);
        pts.push( {lat: pt.lat()+latDelta, lng: pt.lng()+lngDelta} );
    }
    flightArea.setMap(null);
    flightArea.setPaths(pts);
    flightArea.setMap(map);
    setPathListeners();
    updatePointsTextarea();
    updateFlightPath();
}

function clearDisplayLines() {
    for (var i = 0; i < displayLines.length; i++) {
        displayLines[i].setMap(null);
    }
    displayLines = [];
}

function updateFlightPath() {
    
    clearDisplayLines();
    $("#pathlength").html("-");
    $("#efficiency").html("-");
    $("#esttime").html("-");
    
    var path = flightArea.getPath();
    if (path.length < 3) {
        $("#feedback").html("Need at least three points");
        return;
    }
    
    // find meters per degree for lat/lng at this location
    var firstPoint = path.getAt(0);
    var p0 = new google.maps.LatLng(firstPoint.lat(), firstPoint.lng());
    var p1 = new google.maps.LatLng(firstPoint.lat() + 0.001, firstPoint.lng());
    var p2 = new google.maps.LatLng(firstPoint.lat(), firstPoint.lng() + 0.001);
    var metersPerLat = 1000 * google.maps.geometry.spherical.computeDistanceBetween(p0,p1);
    var metersPerLng = 1000 * google.maps.geometry.spherical.computeDistanceBetween(p0,p2);
    
    var pts = [];
    for (var i = 0; i < path.length; i++) {
        var pt = path.getAt(i);
        pts.push( {y: pt.lat(), x: pt.lng()} );
    }
    
    var angle = parseFloat( $("#angle").val() );
    var turn = parseInt( $("#turn").val() );
    var separation = parseFloat( $("#separation").val() );
    
    while (angle > 360) {
        angle -= 360;
    }
    
    rowEnds = generateFlightPath(pts, metersPerLat, metersPerLng, angle, turn, separation);
    
    var usefulLengthMeters = 0;
    var turningLengthMeters = 0;
    
    var path = [];
    for (var i = 0; i < rowEnds.length; i++) {
        var row = rowEnds[i];
        
        var p0 = new google.maps.LatLng(row.start.y, row.start.x);
        var p1 = new google.maps.LatLng(row.end.y, row.end.x);
        usefulLengthMeters += google.maps.geometry.spherical.computeDistanceBetween(p0,p1);
        
        if ( i > 0 ) {
            var lastRow = rowEnds[i-1];
            var p2 = new google.maps.LatLng(lastRow.end.y, lastRow.end.x);
            var turnLength = google.maps.geometry.spherical.computeDistanceBetween(p2,p0);
            turningLengthMeters += turnLength;
        }
    }
    
    var pathLengthMeters = usefulLengthMeters + turningLengthMeters;
    
    $("#pathlength").html(Math.round(pathLengthMeters)+" meters");
    
    var speed = parseFloat( $("#speed").val() );
    var turntime = parseFloat( $("#turntime").val() );
    var seconds = Math.round(pathLengthMeters / speed);
    seconds += (rowEnds.length-1) * turntime * 2;
    
    var usefulSeconds = Math.round(usefulLengthMeters / speed);
    $("#efficiency").html(Math.round(100*usefulSeconds/seconds)+" %");
    
    
    var hours = Math.floor(seconds / 3600);
    seconds -= hours * 3600;
    var minutes = Math.floor(seconds / 60);
    seconds -= minutes * 60;
    $("#esttime").html(hours +":"+ pad(minutes,2) +":"+ pad(seconds,2));
    
    $("#totalwaypoints").html(rowEnds.length*2);
    
    drawFlightPath();
}

function drawFlightPath() {
    
    clearDisplayLines();
    
    var path = [];
    for (var i = 0; i < rowEnds.length; i++) {
        var row = rowEnds[i];
        var pstart = {lat:row.start.y, lng:row.start.x};
        var pend = {lat:row.end.y, lng:row.end.x};
        path.push( pstart );
        path.push( pend );
    }
    
    var line = new google.maps.Polyline({
        path: path,
        geodesic: true,
        strokeColor: rowLineColor,
        strokeOpacity: 1.0,
        strokeWeight: 3,
        zIndex: 100
      });
      line.setMap(map);
    displayLines.push(line);
      
    // draw arrows
    for (var i = 0; i < rowEnds.length; i++) {
        var row = rowEnds[i];
        var mid = midpoint(row.start,row.end);
        var n = normal( sub(row.end,row.start) );
        n = scale(n, -0.00005);
        mid = add(mid, scale(n,-0.5));
        var pn = scale(perp(n),0.5);
        var p0 = add(mid, add(n,pn));
        var p1 = add(mid, sub(n,pn));
        path = [
                {lat:p0.y, lng:p0.x},
                {lat:mid.y, lng:mid.x},
                {lat:p1.y, lng:p1.x},
                ];
            var line = new google.maps.Polyline({
            path: path,
            geodesic: true,
            strokeColor: rowLineColor,
            strokeOpacity: 1.0,
            strokeWeight: 3,
            zIndex: 100
          });
          line.setMap(map);
          displayLines.push(line);
    }
}

function downloadMission() {
    
    var altitude = parseFloat( $("#altitude").val() ).toFixed(1);
    var filename = $("#filename").val();
    
    $("#feedback2").empty();
    
    if ( filename.length < 1 ) {
        $("#feedback2").html("Enter a file name to save to");
        return;
    }
    
    var fileContent = "";
    
    fileContent += "<?xml version='1.0' encoding='UTF-8' standalone='yes' ?>\n";
    fileContent += "<MISSION>\n";
    fileContent += '<VERSION value="2.3 pre7" />\n';
    
    var wpNo = 1;
    for (var i = 0; i < rowEnds.length; i++) {
        var row = rowEnds[i];
        fileContent += '<MISSIONITEM no="'+(wpNo++)+'" action="WAYPOINT" parameter1="0" parameter2="0" parameter3="0" lat="'+row.start.y+'" lon="'+row.start.x+'" alt="'+altitude+'" />\n';
        fileContent += '<MISSIONITEM no="'+(wpNo++)+'" action="WAYPOINT" parameter1="0" parameter2="0" parameter3="0" lat="'+row.end.y+'" lon="'+row.end.x+'" alt="'+altitude+'" />\n';     
    }
    fileContent += '</MISSION>\n';
    
    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(fileContent));
    element.setAttribute('download', filename);
    
    element.style.display = 'none';
    document.body.appendChild(element);
    
    element.click();
    
    document.body.removeChild(element);
}

function initColorTable() {
    for (var i = 0; i < colors.length; i++) {
        $("#color"+i).css("background-color", colors[i]);
    }
}

function changeColor(i) {
    rowLineColor = colors[i];
    drawFlightPath();
}

initColorTable();
initMap();
recenterView();
      
      
      