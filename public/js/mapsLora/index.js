var color = "#FF0000";
function initMap() {
	const map = new google.maps.Map(document.getElementById("map"), {
		zoom: 15,
		center: {
			lat: 14.313451,
			lng: 108.966897
		},
		mapTypeId: "satellite",
	});
	fetch('/api/0xaa/messenger.json')
		.then(response => response.json())
		.then(dt => {
			for(i in dt.data){
				var gt = [];
				var feed = dt.data[i];
				gt.push(dt.gateWay);
				gt.push(feed.messenger);
				console.log(feed.messenger);
				if(feed.rssi >= -80) color = "#00ff11"
				else if(feed.rssi >= -90) color = "#f6ff00"
				else if(feed.rssi >= -100) color = "#ffa200"
				else color = "#ff0000"
				
				const flightPlanCoordinates = gt;
				const flightPath = new google.maps.Polyline({
					path: flightPlanCoordinates,
					geodesic: true,
					strokeColor: color,
					strokeOpacity: 1.0,
					strokeWeight: 2,
				});
				flightPath.setMap(map);
			}

		})
}