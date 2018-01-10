// +++++  N E I G H B O U R H O O D    M A P  +++++

// -----  global Vars ------
var map;           // the map
var markers = [];  // empty array to be filled with markers for locations
var errorH = "<h2>Ooops .. something went wrong!</h2>";
var url = 'https://maps.googleapis.com/maps/api/js?key=AIzaSyCltzwNrtVheO7HFu7oiV6tgZ9Nx5YBIuA&v&v=3&callback=initMap';
var infoWindow;






// ----- G O O G L E   M A P S   P A R T   -------------

// -----  get GoogleMaps via ajax -----
$.getScript( url )
  .done(function( script, textStatus ) {
    readConsole(); // look for GoogleMaps errors and warnings
  })

  .fail(function( jqxhr, settings, exception ) {
    console.log(jqxhr.getAllResponseHeaders());
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
      /* jshint loopfunc: true */
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

      // Push the marker to the array
      markers.push(marker);

      // add listeners for the marker
      // - on click open the infoWindow and load external data
      // - on mouseover / out toggle bounce and css class
      marker.addListener('click', function() {
        populateInfoWindow(this, infoWindow);
      });

      marker.addListener('mouseover', function() {
        toggleBounce(this);
        $("#loc_"+this.id+"").toggleClass("white");
      });

      marker.addListener('mouseout', function() {
        toggleBounce(this);
        $("#loc_"+this.id+"").toggleClass("white");
      });

      // extend the map with the next position
      bounds.extend(markers[i].position);
    }

    // adjust the map with the new bounds
    map.fitBounds(bounds);


    // add a listener to check on window size changes so that the map always fits
    google.maps.event.addDomListener(window, 'resize', function() {
      map.fitBounds(bounds);
    });

  }


// -----  get Marker from array  ------
// clicking an item in the list needs to connect with the correct marker
function getMarker(id) {
  if (markers.length > 0) {
    for (var i = 0; i < markers.length; i++) {
      if (markers[i].id === id) {
        return markers[i];
      }
    }
  } else {
    console.log("no markers defined");
  }
}


// Sets the map on all markers in the array.
function setMapOnAll(map) {
  for (var i = 0; i < markers.length; i++) {
    markers[i].setMap(map);
  }
}

// Removes the markers from the map, but keeps them in the array.
function clearMarkers() {
  setMapOnAll(null);
}

// Shows any markers currently in the array.
function showMarkers() {
  setMapOnAll(map);
}




// ------  toggle bouncing effect  ------
function toggleBounce(marker) {
  for (var i = 0; i < markers.length; i++) {
    if (markers[i] == marker) {
      if (marker.getAnimation() !== null) {
        marker.setAnimation(null);
      } else {
        marker.setAnimation(google.maps.Animation.BOUNCE);
      }
    } else {
      markers[i].setAnimation(null);
    }
  }
}


// ------  populate infowindow with data from marker and 3rd party webservices
function populateInfoWindow(marker, localInfoWindow) {
  // make sure the infoWindow is not already open
  if (localInfoWindow.marker !== marker) {
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
  var url = "https://api.flickr.com/services/rest/?method=flickr.photos.search&api_key=7f184bc17deeb930da0352704733534e&per_page=2&nojsoncallback=1";
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
        for (var i = 0; i < photos.length; i++) {
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
  var url = "https://api.flickr.com/services/rest/?method=flickr.profile.getProfile&api_key=7f184bc17deeb930da0352704733534e&nojsoncallback=1";

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

    if (cp.length === 0) {
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
    var original = console.error;
    console.error = function() {

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
    };

    console.warn = function() {

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
    };
  }
}


// ----- K N O C K O U T J S    P A R T   -------------


var locationListModel = function () {
    var self = this;
    self.shiftClicked = ko.observable(false);             // note if content needs to be shifted left
    self.textToScan = ko.observable("");
    self.allItems = ko.observableArray(locations);        // Initial items
    self.selectedItems = ko.observableArray(locations);   // Initial selection list
    self.allMarkers = ko.observableArray(markers);        // Initial items
    self.selectedMarkers = ko.observableArray(markers);   // Initial selection list

    // the function is called whenever self.textToScan updates
    self.scanLocationsList = ko.computed( function() {
      var filter = self.textToScan().toLowerCase();
      if (filter.length === 0) {
        return self.selectedItems(locations);
      } else {
        self.selectedItems([]);
        return ko.utils.arrayFilter(self.allItems(), function(item) {
            if (item.title.toLowerCase().indexOf(filter)>=0) {
              self.selectedItems.push(item);
            }
        });
      }
    });

    // this function works as the one before but uses the list of markers on
    // the map
    self.scanLocationsMap = ko.computed( function() {
      var filter = self.textToScan().toLowerCase();
      if (filter.length === 0) {
        markers = self.allMarkers();
        showMarkers();
        return self.allMarkers();
      } else {
        self.selectedMarkers([]);
        clearMarkers();
        return ko.utils.arrayFilter(self.allMarkers(), function(item) {
            if (item.title.toLowerCase().indexOf(filter)>=0) {
              self.selectedMarkers.push(item);
            }
            markers = self.selectedMarkers();
            showMarkers();
        });
      }
    });

    // hamburger icon click toggles the shiftClicked observable, which
    // is bound by the <aside> and <main> areas on the page and will
    // perform a shift left / right depending on the status
    hamburgerClicked = function(data, event) {
      self.shiftClicked(!self.shiftClicked());
    };

    // onclick open the infoWindow and populate it with data
    locationClicked = function(data, event) {
      populateInfoWindow(getMarker(data.place_id), infoWindow);
    };

    // on mouseover start bouncing
    locationMouseover = function(data, event) {
      toggleBounce(getMarker(data.place_id));
    };

    // on mouseout stop bouncing
    locationMouseout = function(data, event) {
      toggleBounce(getMarker(data.place_id));
    };
};


ko.applyBindings(new locationListModel());
