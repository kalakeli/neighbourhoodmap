# neighbourhoodmap

## What *neighbourhoodmap* is
The app is a GoogleMaps KnockoutJS application featuring a list of locations in Münster (Westphalia) in Germany. It is run by opening *index.html* in the browser. The location list is shown to the left of the page, on the map the locations are shown by markers. The list can be hidden / shown by clicking the hamburger icon in the top left of the page. **Hovering** over an item in the list animates the connected marker. **Clicking** a marker or list item will open an infoWindow with the name of the location, plus will it asynchronously download flickr images showing the location.

## How *neighbourhoodmap* works
Some simple CSS is used to show / hide loading status and error messages that might occur.

### GoogleMaps
The map is loaded via a Ajax **_$.getScript()_** request, hence it is possible to read the console messages (errors and warnings) possibly sent by GoogleMaps.
Successfully loaded, the callback function at the end of the GoogleMaps URL is run, i.e. **_initMap()_**
```javascript
var url = 'https://maps.googleapis.com/maps/api/js?key=XXXXXXXX&v&v=3&callback=initMap';
```

**_initMap()_** hides the loading message, creates a map instance, centers the new map, sets the zoom. It then creates an infoWindow where to put the information on a location plus 3rd party info and a boundary object so we can keep all markers in the visible map.
It then iterates through the location list, creates a marker for each location and adds the marker to an array defined outside initMap(). The array is global so we can reach it also from methods outside. The infoWindow is also stored globally. To make things more interesting, listeners are added to the markers.
The first **click** listener takes the infoWindow and has it populated with the 3rd party info, i.e. flickr images.
The other listeners are **mouseover** and **mouseout** and animate a marker when it is hovered.
```javascript
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
    // create an mouseover event to bounce marker and highlight the list item
    marker.addListener('mouseover', function() {
      toggleBounce(this);
      $("#loc_"+this.id+"").css("color", "white");
    });
    // create an mouseover event to stop the marker and de-highlight the list item
    marker.addListener('mouseout', function() {
      toggleBounce(this);
      $("#loc_"+this.id+"").css("color", "#aaaaaa");
    });

    // extend the map with the next position
    bounds.extend(markers[i].position);
  }

  // adjust the map with the new bounds
  map.fitBounds(bounds);
}
```


### Location list
The location list is defined as an Javascript object literal
```javascript
var locations = [
  {
   title: 'Burg Hülshoff',
   location: {lat: 51.970125, lng: 7.503833},
   place_id: "ChIJk8v7uuuxuUcRW0Rzw_YbmlM"
  },
  ...
];
```
The location list to the left is built using [KnockoutJS](http://knockoutjs.com/) and its declarative binding.
```html
<ul data-bind="foreach: locations">
  <li data-bind="text: title"></li>
</ul>
```

The KnockoutJS application is split into three sections on the Javascript side.
There is the model (**LocationModel**) which creates and works with the list and there are two views(**filterArea** and **locationArea**) which initialize the respective parts of the UI. While this is of course not needed, if more work would be added to the interface, it will simplify structuring the work.

Clicking a list item or marker on the map will open an info window offering more information on the location plus pictures (see __*Third party webservices used*__)

## Events inside the app
### list item hover / marker hover
The list and the markers are attached to one another. To show this, the markers start bouncing when a location or marker is hovered, just as vice versa the location colour changes when a marker or the list item is hovered.
Identifying the marker to be animated is done via an event handler attached to the list items.
```javascript
$( "li" ).hover(
  // mouseover-action -> start marker bounce
  function() {
    var context = ko.contextFor(this);
    toggleBounce(getMarker(context.$data.place_id));
  },
  // mouseout -> stop marker bounce
  function() {
    var context = ko.contextFor(this);
    toggleBounce(getMarker(context.$data.place_id));
  }
);
```
getMarker() finds the correct marker in the list via its **place_id**

Likewise, the marker has event listeners for mouseover and mouseout
```javascript
marker.addListener('mouseover', function() {
  toggleBounce(this);
  $("#loc_"+this.id+"").css("color", "white");
});
marker.addListener('mouseout', function() {
  toggleBounce(this);
  $("#loc_"+this.id+"").css("color", "#aaaaaa");
});
```    

The bounce function is as follows
```javascript
function toggleBounce(marker) {
  for (var i=0; i<markers.length; i++) {
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
```
The specific marker is sent as a parameter. It starts bouncing when the animation is null or stops. Because moving the mouse quickly over the list items started the animation for several markers, there is a loop  which takes the list of all markers and iterates through it. It sets all marker animations to null but of the one sent as a parameter.

### list item click / marker click
Clicking a list item or marker opens a popup window above the marker showing more information and eventually inserting the flickr images.
The event handler attached to the list item where you also need to identify the correct marker.
```javascript
$( "li" ).on("click",
  function() {
    var context = ko.contextFor(this);
    var theMarker = getMarker(context.$data.place_id);
    populateInfoWindow(theMarker, infoWindow);
  }
);
```

The simpler event handler attached to the marker:
```javascript
marker.addListener('click', function() {
  populateInfoWindow(this, infoWindow);
});
```

The function to populate the information window with data and 3rd party information, i.e. the flickr images:
```javascript
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
```

### filter button click
The location list and the list of shown markers can be influenced via a text field above the list. Only the items containing the filter text are shown when the button is clicked.
To get this running as part of KnockoutJS, we are using two [observable arrays](http://knockoutjs.com/documentation/observableArrays.html), one for the locations, one for the markers. The filter function is a [computed function](http://knockoutjs.com/documentation/computedObservables.html) that uses a knockout filter function for arrays. It checks the filter text against the location titles and returns only those applicable. The list of locations itself stays unaltered, instead the result is returned to a new observable. Thus, in the beginning, without any input text, the complete list is shown.
```javascript
var LocationModel = function() {
  var self = this;
  self.locations = ko.observableArray(locations);
  self.markers = ko.observableArray(markers);
  // create an observable for the filter text in the text box
  self.filterText = ko.observable();
  self.filterMarkers = ko.observable();

  self.filteredLocations = ko.computed(function () {
    if (!self.filterText()) {    
      return self.locations(); // no filter text? get all locations
    } else {
      return ko.utils.arrayFilter(self.locations(), function (loc) {
        return (loc.title.includes(self.filterText())); // return those locations including the filter text
      });
    }
  });
// ...
}
```
Likewise, the markers are checked.


## Third party webservices used
### Flickr
[Flickr](https://www.flickr.com/) offers web services hidden in the App Garden [Api Documentation](https://www.flickr.com/services/api/) available to you when you register for an account and request an API KEY.

The neighbourhood map uses two asynchronous webservice requests:
* **flickr.photos.search** to find images and
* **flickr.profile.getProfile** to find the user owning the copyright for the image.

```javascript
  var url = "https://api.flickr.com/services/rest/?method=flickr.photos.search&api_key=XXXXXXXX&per_page=2&nojsoncallback=1";
  var data = { tags: tags, lat: lat, lon: lng,
               format: "json", radius: "0.2", radius_units: "km" };

  // Fire off the request
  var req = $.ajax({
    method: "get",
    dataType: "json",
    url: url,
    data: data
    }
  });
```

**NOTE:** The 'normal' JSON answer sent by flickr is wrapped, thus, even with a correct response, the request will fail. You **must** add _**nojsoncallback=1**_ to retrieve a working JSON response.
Flickr requires you to define the response format. The ajax request thus would not need the dataType defined as well, but usually you define it down here, so I leave it in.

## Potential errors
Errors can be thrown in several places and are caught and presented in a more amiable way to the user.

### No JavaScript
The neighbourhoodmap needs JavaScript to run. A _**noscript**_ tag indicates this to the user.

### GoogleMaps Errors - find a list [here](https://developers.google.com/maps/documentation/javascript/error-messages?hl=en)
Google hides its errors within the console. Still, there might be issues also interesting to the client, therefore the function _**readConsole()**_ hacks into the console to read warnings and error messages that might be helpful.
* **InvalidKeyMapError** indicates that the api key used by the programmer was not correct. Not helpful for the client in an immediate way, it still shows that the client has no means to get this app running
* **NoApiKeys** indicates that no key was provided at all.

### Flickr Errors
* **request fails** indicates that something within the Ajax call did not work. Most probably, this is due to the fact that flickr wraps its response before it is sent. But, as this is no longer valid JSON, the request fails. With a _**nojsoncallback=1**_ in the URL, this can be tackled.
* **no photos** indicates that the request worked fine but there were no photos available for the location
* **status=fail** indicates that most probably something with the api key did not work. The system message is provided as feedback.

## ToDo
- [x] create location list
- [x] create map with markers for locations
- [x] create a means to hide / show the location list in an intuitive way
- [x] create animation for markers / list item when hovering a list item
- [x] create animation for markers / list item when hovering a marker
- [x] open info window on list item click or marker click
- [x] use flickr as a 3rd party webservice to asynchronously download images for the location
- [x] implement a filter to display only those locations and markers fitting the selection

## Questions, tipps, and hints
If you need assistance or would like to provide input, you can e-mail me at karstenDOTberlinATgmailDOTcom
