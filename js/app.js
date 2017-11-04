// +++++  N E I G H B O U R H O O D    M A P  +++++

// -----  global Vars ------
var map;           // the map
var markers = [];  // empty array to be filled with markers for locations
var errorH = "<h2>Ooops .. something went wrong!</h2>";
var url = 'https://maps.googleapis.com/maps/api/js?key=AIzaSyCltzwNrtVheO7HFu7oiV6tgZ9Nx5YBIuA&v&v=3&callback=initMap';
var infoWindow;

var locations = [
  {
   title: 'Burg Hülshoff',
   location: {lat: 51.970125, lng: 7.503833},
   place_id:	"ChIJk8v7uuuxuUcRW0Rzw_YbmlM"
  },
  {
   title: 'Haus Rüschhaus',
   location: {lat: 51.98547, lng: 7.55091},
   place_id:	"ChIJabZn3FCwuUcR3vZx741ETic"
  },
  {
   title: 'Rieselfelder',
   location: {lat: 52.02875, lng: 7.65455},
   place_id:	"ChIJl4EzT4e5uUcRJdKHjyHnnP0"
  },
  {
   title: 'Schleuse',
   location: {lat: 51.97786, lng: 7.66082},
   place_id:	"ChIJJd634di6uUcRDdmxq-hc39g"
  },
  {
   title: 'Hauptbahnhof',
   location: {lat: 51.956655, lng: 7.634636},
   place_id:	"ChIJJeZ5htm6uUcRLt84VwgQXgo"
  },
  {
   title: 'St.-Paulus-Dom',
   location: {lat: 51.962981, lng: 7.625767},
   place_id:	"ChIJsxS-ssO6uUcRJCC7ZiHI0rg"
  },
  {
   title: 'Schloss',
   location: {lat: 51.963619, lng: 7.613081},
   place_id:	"ChIJNfHPUr66uUcRkJuKn6KAJKQ"
  },
  {
   title: 'Lotharinger Kloster',
   location: {lat: 51.965484, lng: 7.632778},
   place_id:	"ChIJC3gFi-e6uUcRm_3hZYMQ1iQ"
  },
  {
   title: 'Clemenskirche Münster',
   location: {lat: 51.960874, lng: 7.631},
   place_id: "EjRBbiBkZXIgQ2xlbWVuc2tpcmNoZSAxNCwgNDgxNDMgTcO8bnN0ZXIsIERldXRzY2hsYW5k"
 },
  {
   title: 'Aasee Münster',
   location: {lat: 51.957516, lng: 7.615693},
   place_id: "ChIJzc0-jse6uUcRbI36lIzbZnM"
  }
];





// -----  get GoogleMaps via ajax -----
// GoogleMaps errors and warnings are 'hidden' in the console; to reach them,
// take over the console (readConsole()) once the script was retrieved
$.getScript( url )
  .done(function( script, textStatus ) {
    // look for GoogleMaps errors and warnings
    readConsole();
  })

  .fail(function( jqxhr, settings, exception ) {
    console.log(xhr.getAllResponseHeaders());

    $( '#errorbox' ).html( errorH + "<p>The GoogleMaps script failed to load!</p>" );
    $( '#loadingbox' ).css('display', 'none');
    $( '#errorbox' ).fadeIn("fast");
  });



// -----  initMap() --------
function initMap() {
  $( '#loadingbox' ).css('display', 'none');

  map = new google.maps.Map(document.getElementById('map'), {
    center: {lat: 51.9601537, lng: 7.6409484},
    zoom: 13
  });

  // the map will be bound to an extent covering all locations
  var bounds = new google.maps.LatLngBounds();

  // information will be put and shown in an infoWindow
  infoWindow = new google.maps.InfoWindow();


  // iterate through my list of locations and show them with a marker on the map
  for (var i = 0; i < locations.length; i++) {

    var position = locations[i].location;
    var title = locations[i].title;
    var place_id = locations[i].place_id;

    // Create one marker per location, and put into markers array.
    var marker = new google.maps.Marker({
      map: map,
      position: position,
      title: title,
      animation: google.maps.Animation.DROP,
      id: place_id
    });

    // Push the marker to our array of markers.
    markers.push(marker);

    // create an onclick event to open an infowindow
    marker.addListener('click', function() {
      populateInfoWindow(this, infoWindow);
    });

    // extend the map with the next position
    bounds.extend(markers[i].position);
  }

  // adjust the map with the new bounds
  map.fitBounds(bounds);

}

// -----  get Marker from array
function getMarker(id) {
  if (markers.length>0) {
    for (var i=0; i<markers.length; i++) {
      if (markers[i].id == id) {
        return markers[i];
      }
    }
  } else {
    console.log("no markers defined");
  }
}

// ------  toggle bouncing effect
function toggleBounce(marker) {
  if (marker.getAnimation() !== null) {
    marker.setAnimation(null);
  } else {
    marker.setAnimation(google.maps.Animation.BOUNCE);
  }
}

// ------  populate the infowindow with data from marker and 3rd party webservices
function populateInfoWindow(marker, localInfoWindow) {
  // make sure the infoWindow is not already open
  if (localInfoWindow.marker != marker) {
    var inner = "<h2>" + marker.title + "</h2><h3>Flickr Images</h3>";

    localInfoWindow.marker = marker;
    localInfoWindow.setContent(inner);
    localInfoWindow.open(map, marker);

    // get flickr pics for chosen location
    getFlickrPics(marker.title, marker.position.lat(), marker.position.lng(), localInfoWindow);

    // add listener to clear the marker from the infoWindow
    localInfoWindow.addListener('closeclick', function() {
      localInfoWindow.marker = null;
    });
  }
}


// -----  read flickr pictures for chosen location --------
// - the flickr api photo search allows many fields, see link to find out more
// - https://www.flickr.com/services/api/flickr.photos.search.html
// - answer will be provided as JSON
//   Note! Make sure you add nojsoncallback=1 to the end of the URL string as
//   flickr wraps its answer and it will fail, though filled with correct data
// - Parameters:
//   - tags -> the title of the location in most cases
//   - lat  -> latitude
//   - lng  -> longitude
//   - iw   -> infoWindow where to put the images
function getFlickrPics(tags, lat, lng, iw) {
  var loadingbox = $( '#loadingbox' );
  var errorbox = $( '#errorbox' );
  var radius = "0.2"; // 200m radius should be ok for the locations chosen
  var units = "km";   // kilometers (km) or miles (mi)
  var myapikey = "c032766f0c46ea5711f482ace878c21a";
  var url = "https://api.flickr.com/services/rest/?method=flickr.photos.search&api_key=9214cedf6fa3d013c1306f6402698e6a&per_page=2&nojsoncallback=1";
  var data = { tags: tags,
               lat: lat,
               lon: lng,
               format: "json",
               radius: "0.2",
               radius_units: "km" };

  // Fire off the request
  var req = $.ajax({
    method: "get",
    dataType: "json",
    url: url,
    data: data,
    statusCode: {
      404: function() {
        alert( "page not found" );
      }
    }
  });

  req.fail(function() {
    errorbox.html( errorH + "<p>The flickr API request failed and the pictures could not be loaded!</p>");
    errorbox.fadeIn("fast");
    window.setTimeout(function() {
      errorbox.fadeOut("fast");
    }, 5000);
  });

  req.success(function() {
    var content = iw.getContent();
    var response = $.parseJSON(req.responseText);

    // even though the request worked, the answer might not be what we were
    // looking for
    if (response.stat === "ok") {
      var photos = response.photos.photo;
      if (photos.length > 0) {
        for (var i=0; i<photos.length; i++) {
          var photo = photos[i];
          content += "<figure>";
          content += "<img src='https://farm"+photo.farm+".staticflickr.com/"+photo.server+"/"+photo.id+"_"+photo.secret+".jpg' width='320' alt='flickr img'>";
          content += "<figcaption>© <span id='copyright_"+i+"'></span> - "+photo.title+"</figcaption>";
          content += "</figure>";

          // get copyright for the displayed image
          var owner = getFlickrProfile(i, photo.owner);
        }

      } else {
        content += "<hr>" +
                   "<p><em>Awwww ... unfortunately, no images were found</em> " +
                   "<br>Go and take some pictures yourself! :-) </p>";

      }
    } else {
      content += "<hr>" +
                 "<p>Flickr images could not be retrieved " +
                 "<br><strong>System Message: "+response.message+"</strong></p>";
    }

    iw.setContent(content);

  });
}

// -----  read flickr profile  --------
// - Parameters:
//   - pos     -> where to put the name
//   - ownerID -> ID of the flickr user
function getFlickrProfile(pos, ownerID) {
  var url = "https://api.flickr.com/services/rest/?method=flickr.profile.getProfile&api_key=9214cedf6fa3d013c1306f6402698e6a&nojsoncallback=1";

  // Fire off the request
  var req = $.ajax({
    method: "get",
    dataType: "json",
    url: url,
    data: {format: "json", user_id : ownerID}
  });

  req.fail(function() {
    alert("Copyright data associated with an image could not be read!");
  });

  req.success(function() {
    var fn = "", ln = "", cp = "";
    var response = $.parseJSON(req.responseText);
    fn = response.profile.first_name;
    ln = response.profile.last_name;
    cp = "<a href='https://www.flickr.com/photos/"+response.profile.id+"' target='_blank'>";
    if ( (typeof(fn) != "undefined") ) {
      cp += fn;
    }
    if ( (typeof(ln) != "undefined") ) {
      cp += " " + ln;
    }

    if (cp.length==0) {
      cp += " " + ownerID;
    }
    cp += "</a>";

    if (response.stat === "ok") {
      $("#copyright_"+pos+"").html(cp);
    } else {
      return "The user could not be read!";
    }
  });


}


// -----  read console messages --------
// -- Note: Messages read below are just examples as they turned up
function readConsole() {
  var console = window.console;
  var loadingbox = $( '#loadingbox' );
  var errorbox = $( '#errorbox' );

  if (console)  {
    var original = console['error'];

    console['error'] = function() {

       // check message
       if(arguments[0] && arguments[0].indexOf('InvalidKeyMapError') !== -1) {
         errorbox.html( errorH + "<p>The GoogleMaps API Key seems to be wrong!</p>" +
                                 "<p>You need a working key to run this application. If this is your application, generate a key in the Google Api Console.</p>" +
                                 "<p><a href='https://developers.google.com/maps/documentation/javascript/get-api-key?hl=en' target='_blank'>Learn more</a></p>"  );
       } else if(arguments[0] && arguments[0].indexOf('ApiNotActivatedMapError') !== -1) {
         errorbox.html( errorH + "<p>Google Maps JavaScript API is not activated for this project! If this is your project, you should take a look at the Google API Console and see under APIs whether it can be enabled</p>" );
       }
       loadingbox.css('display', 'none');
       errorbox.fadeIn("fast");

       // show messages in console as well
       if (original.apply) {
         original.apply(console, arguments);
       }

    }

    console['warn'] = function() {

       // check message
       if(arguments[0] && arguments[0].indexOf(' NoApiKeys') !== -1) {
         errorbox.html( errorH + "<p>Dude, you need an API key to use this service!</p><p>If this is your application, place make sure you add a working API key for authentication.</p>" +
                                 "<p><a href='https://developers.google.com/maps/documentation/javascript/get-api-key?hl=en' target='_blank'>Learn more</a></p>"  );
       }

       loadingbox.css('display', 'none');
       errorbox.fadeIn("fast");

       // show messages in console as well
       if (original.apply) {
         original.apply(console, arguments);
       }

    }
  }
}
