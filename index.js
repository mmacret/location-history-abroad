var latlongs,map;
var trips =[];
var abroad = false;
var trip =[];
var finishTrip;
var endTrip;
var canada = ($.grep(world.features, function(e){return e.id === 'CAN';}))[0];
var datatable;
var smallTrips = [];
//GeoJSON - [Longitude, Latitude] 
function isPointInsidePolygon(point, poly) {
	var inside = false;
	var x = point[1], y = point[0];
	for (var ii=0;ii<poly.length;ii++){
		var polyPoints = poly[ii][0];
		for (var i = 0, j = polyPoints.length - 1; i < polyPoints.length; j = i++) {
			var xi = polyPoints[i][1], yi = polyPoints[i][0];
			var xj = polyPoints[j][1], yj = polyPoints[j][0];

			var intersect = ((yi > y) != (yj > y))
			&& (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
			if (intersect) inside = !inside;
		}
	}

	return inside;
};

function locate(set,it){
	for(var j=0;j<it;j++){
		var toSearch = set[Math.floor(Math.random()*set.length)].slice().reverse();
		for(var i=0;i<world.features.length;i++){
			if(isPointInsidePolygon(toSearch,world.features[i].geometry.coordinates)){
				return world.features[i].properties.name;
			}
			
		}
	}
	
	return 'Unknown';
}

( function ( $, L, prettySize ) {
	var promise = null;

	function formatDate(timestamp) {
		var date = new Date(timestamp);
		var day = date.getDate();
		var month = date.getMonth()+1;
		var year = date.getFullYear();
		return [year,
		(month>9 ? '' : '0') + month,
		(day>9 ? '' : '0') + day
		].join('/');

	}

	function processTrip(map,tripId,coordinates,startDate,finishDate,color){
		return function(resolve, reject){

			var path = L.polyline(coordinates,{color: color,snakingSpeed:200});

			path.bindPopup("Start: "+startDate+", End: "+finishDate)
			map.addLayer(path);
			map.fitBounds(path.getBounds(),{animate:true});
			path.addEventListener("snakeend",resolve);

			$( '#next' ).off('click').on('click', function () {
				path._snakeEnd();
				resolve();
				return false;
			});      

			$("#tripColor").css("background-color", color);
			$( '#tripId' ).text( tripId );
			$( '#startDate' ).text( startDate );
			$( '#finishDate' ).text( finishDate );

			if(coordinates.length < 10000){
				path.snakeIn();
			}else{
				resolve();
			}
 			//console.log("trip: "+start);
 		}
 	}

 	function queueTrip(map,tripId,coordinates,start,finish,color){
 		if(promise == null || promise.isFulfilled()){
 			promise = new Promise(processTrip(map,tripId,coordinates,start,finish,color));
 		}else{
 			promise = promise.then(function(){
 				return new Promise(processTrip(map,tripId,coordinates,start,finish,color));
 			});
 		}
 	}

 	function status( message ) {
 		$( '#currentStatus' ).text( message );
 	}
	// Start at the beginning
	stageOne();

	function stageOne () {
		var dropzone;

		// Initialize the map
		map = L.map( 'map' ).setView( [0,0], 2 );
		L.tileLayer( 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
			attribution: 'Countdown To Citizenship is open source and available <a href="https://github.com/mmacret/location-history-abroad">on GitHub</a>. Map data &copy; <a href="https://openstreetmap.org">OpenStreetMap</a> contributors.',
			maxZoom: 18,
			minZoom: 2
		} ).addTo( map );

		// Initialize the dropzone
		dropzone = new Dropzone( document.body, {
			url: '/',
			previewsContainer: document.createElement( 'div' ), // >> /dev/null
			clickable: false,
			accept: function ( file, done ) {
				stageTwo( file );
				dropzone.disable(); // Your job is done, buddy
			}
		} );

		// Initialize Canada
		country = L.geoJson(canada,{
			fillColor: "green",
			weight: 2,
			opacity: 1,
			color: 'white',
			dashArray: '3',
			fillOpacity: 0.7
		}).addTo( map );

		// For mobile browsers, allow direct file selection as well
		$( '#file' ).change( function () {
			stageTwo( this.files[0] );
			dropzone.disable();
		} );
	}

	function stageTwo ( file ) {
   		// Google Analytics event - Travels upload file
   		ga('send', 'event', 'Travels', 'upload', undefined, file.size);

   		var type;

   		try {
   			if ( /\.kml$/i.test( file.name ) ) {
   				type = 'kml';
   			} else {
   				type = 'json';
   			}
   		} catch ( ex ) {
   			status( 'Something went wrong generating your map. Ensure you\'re uploading a Google Takeout JSON file that contains location data and try again, or create an issue on GitHub if the problem persists. ( error: ' + ex.message + ' )' );
   			return;
   		}

		// First, change tabs
		$( 'body' ).addClass( 'working' );
		$( '#intro' ).addClass( 'hidden' );
		$( '#working' ).removeClass( 'hidden' );
		$( '#trip' ).removeClass( 'hidden' );
		$( '#feedback' ).removeClass( 'hidden' );
		$( '#feedback' ).click(function(){
			var table = $( '#table' );
			if(table.text() === 'Hide table'){
				table.text('Show table');
				$( '#tablecontainer' ).addClass('hidden');
			}
			$( '#feedbackform' ).removeClass('hidden');
		});
		$( '#feedbackform button[type=button]' ).click(function(){
			$( '#feedbackform' ).addClass('hidden');
		});
		$( '#table' ).click(function(){
			var table = $( '#table' );
			if(table.text() === 'Show table'){
				$( '#feedbackform' ).addClass('hidden');
				table.text('Hide table');
				$( '#tablecontainer' ).removeClass('hidden');
			}else{
				table.text('Show table');
				$( '#tablecontainer' ).addClass('hidden');
			}
			

		});
		datatable = $('#datatable').DataTable({
			"dom": 'Bfrtip',
			"order": [[ 1, "asc" ]],
			"scrollY":        "305px",
			"scrollCollapse": false,
			"paging":         false,
			"columns": [
			{"type" : "num", 
			"orderable": false, "createdCell": function (td, cellData, rowData, row, col) {

				$(td).css('background-color', cellData);
				$(td).css('color', cellData);
			}},
			{ "type": "num"},
			{ "type": "date"},
			{ "type": "date"},
			{ "type": "num"},
			{ "type": "string"}
			],
			"footerCallback": function ( row, data, start, end, display ) {
				var api = this.api(),total=0;


				for(var i=0;i<trips.length;i++){
					total+=trips[i].length;
				}

            // Update footer
            $( api.column( 4 ).footer() ).html(
            	total.toFixed(2)+" days"
            	);
        },
        "buttons": [
        'copyHtml5',
        'excelHtml5',
        'csvHtml5'
        ]
    });

		
		var processed = 0;
		var os = new oboe();

		os.node( 'locations.*', function ( location ) {
			processed++;
			var SCALAR_E7 = 0.0000001; // Since Google Takeout stores latlngs as integers
			let latlng = [ location.latitudeE7 * SCALAR_E7, location.longitudeE7 * SCALAR_E7 ];
			
			if(!isPointInsidePolygon(latlng.slice().reverse(),canada.geometry.coordinates)){
				if(!abroad){
					abroad = true;
					finishTrip = parseFloat(location.timestampMs);
				}
				
				if ( type === 'json' ) trip.push( latlng );
			}else{
				if(abroad){
					//Add trip to list of trips
					let days = (finishTrip-parseFloat(location.timestampMs))/(1000*3600*24)

					if(days > 1){
						trip.reverse();
						var color;
						var r = Math.floor(Math.random() * 255);
						var g = Math.floor(Math.random() * 255);
						var b = Math.floor(Math.random() * 255);
						color= "rgb("+r+" ,"+g+","+ b+")"; 
						trips.push({'finish': finishTrip,'start': parseFloat(location.timestampMs), 'length': days,'coordinates' : trip,'color':color});
						var startDate = formatDate(parseFloat(location.timestampMs));
						var finishDate = formatDate(finishTrip);


						datatable.row.add( [
							color,
							trips.length,
							startDate,
							finishDate,
							days.toFixed(2),
							'Unknown'
							] ).draw( false );
						$("#tripTotal").text(trips.length);
						queueTrip(map,trips.length,trip,startDate,finishDate,color);

					}

					trip = [];
					abroad = false;
					finishTrip = null;
				}
			}
			
			
			return oboe.drop;
		} ).done( function () {
			status( 'Generating map...' );

			//Reverse geocoding
			for(var i=0;i<trips.length;i++){
				status("Reverse-geocoding trip "+(i+1)+"/"+trips.length);
				var where = locate(trips[i].coordinates,10);
				trips[i].where = where;
				datatable.cell(i,5).data(where);
			}

			stageThree(  /* numberProcessed */ processed);

		} );

		var fileSize = prettySize( file.size );

		status( 'Preparing to import file ( ' + fileSize + ' )...' );

		// Now start working!
		if ( type === 'json' ) parseJSONFile( file, os );
		if ( type === 'kml' ) parseKMLFile( file );

	}

	function stageThree ( numberProcessed ) {
    	// Google Analytics event - travel analyzed
    	console.log(numberProcessed);
    	ga('send','event','Travels','processed',undefined,numberProcessed);
    	ga('send','event','Travels','found',undefined,trips.length);

		// Change tabs :D
		$( 'body' ).removeClass( 'working' );
		$( '#working' ).addClass( 'hidden' );
		$( '#beer' ).removeClass( 'hidden' );
		$( 'body' ).addClass( 'map-active' );
		
	}

	/*
	Break file into chunks and emit 'data' to oboe instance
	*/

	function parseJSONFile( file, oboeInstance ) {
		var fileSize = file.size;
		var prettyFileSize = prettySize(fileSize);
		var chunkSize = 512 * 1024; // bytes
		var offset = 0;
		var self = this; // we need a reference to the current object
		var chunkReaderBlock = null;
		var startTime = Date.now();
		var endTime = Date.now();
		var readEventHandler = function ( evt ) {
			if ( evt.target.error == null ) {
				offset += evt.target.result.length;
				var chunk = evt.target.result;
				var percentLoaded = ( 100 * offset / fileSize ).toFixed( 0 );
				status( percentLoaded + '% of ' + prettyFileSize + ' loaded...' );
				oboeInstance.emit( 'data', chunk ); // callback for handling read chunk
			} else {
				return;
			}
			if ( offset >= fileSize ) {
				oboeInstance.emit( 'done' );
				return;
			}

			// of to the next chunk
			chunkReaderBlock( offset, chunkSize, file );
		}

		chunkReaderBlock = function ( _offset, length, _file ) {
			var r = new FileReader();
			var blob = _file.slice( _offset, length + _offset );
			r.onload = readEventHandler;
			r.readAsText( blob );
		}

		// now let's start the read with the first block
		chunkReaderBlock( offset, chunkSize, file );
	}

	/*
        Default behavior for file upload (no chunking)	
        */

        function parseKMLFile( file ) {
        	var fileSize = prettySize( file.size );
        	var reader = new FileReader();
        	reader.onprogress = function ( e ) {
        		var percentLoaded = Math.round( ( e.loaded / e.total ) * 100 );
        		status( percentLoaded + '% of ' + fileSize + ' loaded...' );
        	};

        	reader.onload = function ( e ) {
        		var latlngs;
        		status( 'Generating map...' );
        		latlngs = getLocationDataFromKml( e.target.result );

        		stageThree( latlngs.length );
        	}
        	reader.onerror = function () {
        		status( 'Something went wrong reading your JSON file. Ensure you\'re uploading a "direct-from-Google" JSON file and try again, or create an issue on GitHub if the problem persists. ( error: ' + reader.error + ' )' );
        	}
        	reader.readAsText( file );
        }

        function getLocationDataFromKml( data ) {
        	var KML_DATA_REGEXP = /<when>( .*? )<\/when>\s*<gx:coord>( \S* )\s( \S* )\s( \S* )<\/gx:coord>/g,
        	locations = [],
        	match = KML_DATA_REGEXP.exec( data );

		// match
		//  [ 1 ] ISO 8601 timestamp
		//  [ 2 ] longitude
		//  [ 3 ] latitude
		//  [ 4 ] altitude ( not currently provided by Location History )
		while ( match !== null ) {
			locations.push( [ Number( match[ 3 ] ), Number( match[ 2 ] ) ] );
			match = KML_DATA_REGEXP.exec( data );
		}

		return locations;
	}

}( jQuery, L, prettySize ) );
