var latlongs,map;
var trips =[];
var abroad = false;
var trip =[];
var finishTrip;
var endTrip;
var canada = ($.grep(world.features, function(e){return e.id === 'CAN';}))[0];
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

( function ( $, L, prettySize ) {
	var  heat, polyline, promise = null,
		heatOptions = {
			tileOpacity: 1,
			heatOpacity: 1,
			radius: 25,
			blur: 15
		};

	function processTrip(map,trip,start,finish){
		return function(resolve, reject){
			var color;
 			var r = Math.floor(Math.random() * 255);
 			var g = Math.floor(Math.random() * 255);
 			var b = Math.floor(Math.random() * 255);
 			color= "rgb("+r+" ,"+g+","+ b+")"; 
 			var path = L.polyline(trip,{color: color,snakingSpeed:200});
 			path.bindPopup("Start: "+new Date(start)+", End: "+new Date(finish))
 			map.addLayer(path);
 			map.fitBounds(path.getBounds(),{animate:true});
 			path.addEventListener("snakeend",resolve);
 			if(trip.length < 10000){
 					path.snakeIn();
 			}else{
 				resolve();
 			}
 			console.log("trip: "+start);
		}
	}

	function queueTrip(map,trip,start,finish){
		if(promise == null || promise.isFulfilled()){
			promise = new Promise(processTrip(map,trip,start,finish));
		}else{
			promise = promise.then(function(){
				return new Promise(processTrip(map,trip,start,finish));
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
			attribution: 'location-history-visualizer is open source and available <a href="https://github.com/theopolisme/location-history-visualizer">on GitHub</a>. Map data &copy; <a href="https://openstreetmap.org">OpenStreetMap</a> contributors.',
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
    // Google Analytics event - heatmap upload file
    //ga('send', 'event', 'Heatmap', 'upload', undefined, file.size);

		
		//polyline = L.polyline([],{color: 'red', interactive: false}).addTo( map );
		
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
		
		var latlngs = [];

		var os = new oboe();

		os.node( 'locations.*', function ( location ) {
			var SCALAR_E7 = 0.0000001; // Since Google Takeout stores latlngs as integers
			let latlng = [ location.latitudeE7 * SCALAR_E7, location.longitudeE7 * SCALAR_E7 ];
			
			if(!isPointInsidePolygon(latlng.slice().reverse(),canada.geometry.coordinates)){
				if(!abroad){
					abroad = true;
					finishTrip = parseFloat(location.timestampMs);
					//latlngs.push( latlng );
				}
				
				if ( type === 'json' ) trip.push( latlng );
			}else{
				if(abroad){
					//Add trip to list of trips
					let days = (finishTrip-parseFloat(location.timestampMs))/(1000*3600*24)

					if(days > 1){
						trip.reverse();
						trips.push({'finish': finishTrip,'start': parseFloat(location.timestampMs), 'length': days,'coordinates' : trip});
						if(false){
							var color;
				 			var r = Math.floor(Math.random() * 255);
				 			var g = Math.floor(Math.random() * 255);
				 			var b = Math.floor(Math.random() * 255);
				 			color= "rgb("+r+" ,"+g+","+ b+")"; 
				 			var path = L.polyline(trip,{color: color,snakingSpeed:200});
				 			path.bindPopup("Start: "+new Date(parseFloat(location.timestampMs))+", End: "+new Date(finishTrip))
				 			map.addLayer(path);
				 			map.fitBounds(path.getBounds(),{animate:true});
				 			path.addEventListener("snakeend",function(){
				 				console.log("next!");
				 			});
				 			if(trip.length < 10000){
				 					path.snakeIn();
				 			}
						}

						queueTrip(map,trip,parseFloat(location.timestampMs),finishTrip);
	
						//latlngs.push( latlng );
					}else{
						console.log();
						//latlngs.pop();
					}
					trip = [];
					abroad = false;
					finishTrip = null;
				}
			}
			
			
			return oboe.drop;
		} ).done( function () {
			status( 'Generating map...' );
			//heat._latlngs = latlngs;
			//latlongs = latlngs;

			//generate random color
			var routeIn = [];
			for(var i=0;i<trips.length;i++){
			 var color;
			 var r = Math.floor(Math.random() * 255);
			 var g = Math.floor(Math.random() * 255);
			 var b = Math.floor(Math.random() * 255);
			 color= "rgb("+r+" ,"+g+","+ b+")"; 
			 var path = L.polyline(trips[i].coordinates,{color: color});
			// map.addLayer(path);
			// path.snakeIn();
			routeIn.push(path);
			 //L.polyline(trips[i].coordinates,{color: color}).bindPopup("Start: "+new Date(trips[i].start)+", End: "+new Date(trips[i].finish)).addTo( map );
			}
			//var route = L.featureGroup(routeIn);
			//map.addLayer(route);
			//route.snakeIn();

			console.log('Avant: '+latlngs.length);
			//latlngs = simplify(latlngs,1,true);
			console.log('Apres: '+latlngs.length);
			//polyline._latlngs = latlngs;
			//heat.redraw();
			//polyline.redraw();
			stageThree(  /* numberProcessed */ latlngs.length );

		} );

		var fileSize = prettySize( file.size );

		status( 'Preparing to import file ( ' + fileSize + ' )...' );

		// Now start working!
		if ( type === 'json' ) parseJSONFile( file, os );
		if ( type === 'kml' ) parseKMLFile( file );

	}

	function stageThree ( numberProcessed ) {
    // Google Analytics event - heatmap render
    //ga('send', 'event', 'Heatmap', 'render', undefined, numberProcessed);

		//var $done = $( '#done' );

		// Change tabs :D
		$( 'body' ).removeClass( 'working' );
		$( '#working' ).addClass( 'hidden' );
		//$done.removeClass( 'hidden' );
		$( 'body' ).addClass( 'map-active' );
		 activateControls();
		// Update count
		$( '#numberProcessed' ).text( numberProcessed.toLocaleString() );

    /*$( '#launch' ).click( function () {
      var $email = $( '#email' );
      if ( $email.is( ':valid' ) ) {
        $( this ).text( 'Launching... ' );
        $.post( '/heatmap/submit-email.php', {
          email: $email.val()
        } )
        .always( function () {
          $( 'body' ).addClass( 'map-active' );
          $done.fadeOut();
          activateControls();
        } );
      } else {
        alert( 'Please enter a valid email address to proceed.' );
      }
    } );*/

		function activateControls () {
			var $tileLayer = $( '.leaflet-tile-pane' ),
				$heatmapLayer = $( '.leaflet-heatmap-layer' ),
				originalHeatOptions = $.extend( {}, heatOptions ); // for reset

			// Update values of the dom elements
			function updateInputs () {
				var option;
				for ( option in heatOptions ) {
					if ( heatOptions.hasOwnProperty( option ) ) {
						document.getElementById( option ).value = heatOptions[option];
					}
				}
			}

			updateInputs();

			$( '.control' ).change( function () {
				switch ( this.id ) {
					case 'tileOpacity':
						$tileLayer.css( 'opacity', this.value );
						break;
					case 'heatOpacity':
						$heatmapLayer.css( 'opacity', this.value );
						break;
					default:
						heatOptions[ this.id ] = Number( this.value );
						heat.setOptions( heatOptions );
						break;
				}
			} );

			$( '#reset' ).click( function () {
				$.extend( heatOptions, originalHeatOptions );
				updateInputs();
				heat.setOptions( heatOptions );
				// Reset opacity too
				$heatmapLayer.css( 'opacity', originalHeatOptions.heatOpacity );
				$tileLayer.css( 'opacity', originalHeatOptions.tileOpacity );
			} );
		}
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
