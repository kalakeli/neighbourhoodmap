# neighbourhoodmap

## What *neighbourhoodmap* is
The app is a HTML5 GoogleMaps KnockoutJS application featuring a list of locations in Münster (Westphalia) in Germany. It is run by opening *index.html* in the browser.
The page is split in two parts. To the left, using an __aside__ element, the location list is available. The remaining width of the page is taken by the __main__ element with the map.
The locations are shown by markers on the map. The list can be hidden / shown by clicking the hamburger icon in the top left of the page. **Hovering** over an item in the list animates the connected marker. **Clicking** a marker or list item will open an infoWindow with the name of the location, plus will it asynchronously download flickr images showing the location.

## Live version 
See the working page [here](http://karsten-berlin.net/parked/u_neighbourhoodmap/)

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
```

Additionally to the markers, there is a listener guarding the window size. It
adjusts the map to fit the extent of the markers.
```javascript
google.maps.event.addDomListener(window, 'resize', function() {
  map.fitBounds(bounds);
});
```

### Location list
The location list is defined as an Javascript object literal and is saved as an
external file.
```javascript
var locations = [
  {
    "title": "Burg Hülshoff",
    "location": {"lat": 51.970125, "lng": 7.503833},
    "place_id":	"ChIJk8v7uuuxuUcRW0Rzw_YbmlM"
  },
  ...
];
```

## KnockoutJS
[KnockoutJS](http://knockoutjs.com/) is used for the list of locations to the left.
All the work is done in the View Model, in this case, the **locationListModel**.
It defines a few observables in the beginning, which follow changes in the UI.
For example, the text field above the location list (__input type="text" id="txtfilter" data-bind='textInput:textToScan'__) allows filtering the list.
It is bound to the variable __self.textToScan__, which is at first an empty observable.
The computed function
 __scanLocations()__ takes the input from the text field and checks it against the
 list of locations using the __arrayFilter()__ utility function KnockoutJS provides.
The list of selected locations __self.selectedItems__ is adjusted accordingly.

```javascript
var locationListModel = function () {
    var self = this;
    self.shiftClicked = ko.observable(false);             // note if content needs to be shifted left
    self.textToScan = ko.observable("");
    self.allItems = ko.observableArray(locations);        // Initial items
    self.selectedItems = ko.observableArray(locations);   // Initial selection list

    // the function is called whenever self.textToScan updates
    self.scanLocations = ko.computed( function() {
      var filter = self.textToScan().toLowerCase();
      if (filter.length==0) {
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

    // ...

  };
```
This list of selected locations is taken and, via a loop in the view, brought to the
screen.
```html
<ul data-bind="foreach: selectedItems">
  <li data-bind="text: title, attr: {id: 'loc_' + place_id }, event: { click: locationClicked, mouseover: locationMouseover, mouseout: locationMouseout }"></li>
</ul>
```

To be able to identify the correct list item when the marker is hovered in the map,
each item has a unique id. Just like the marker in the map has 3 listeners for click,
mouseover and mouseout, the list item is provided with listeners for the same events.
While the marker works within the GoogleMap, these list item listeners are working
within the locationListModel. They identify the correct marker using the respective id
and do their work, e.g. start / stop the animation and opening the infoWindow
with the external data.
A fourth listener is added here as it also works on the looks of the page. When
a user clicks the hamburger icon above the map, the __aside__ and __main__ elements
are translated left so the location list can be hidden or shown. This is achieved
by binding the html elements to the __self.shiftClicked__ observable, which is
initially set to false, i.e. show the elements. Clicking the icon negates the value
and the observing elements __data-bind="css: { 'shift': shiftClicked }"__
add or remove the css class __shift__. This nice feature is called [CSS binding](http://knockoutjs.com/documentation/css-binding.html).


```javascript
var locationListModel = function () {

    // ...

    // hamburger icon click toggles the shiftClicked observable
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
```



## 3rd party data
[Flickr](https://www.flickr.com/) is used as an example for third party data. Clicking a list item / marker
opens the __infoWindow__ for the specific location and loads 2 pictures.


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
Flickr offers web services hidden in the App Garden [Api Documentation](https://www.flickr.com/services/api/) available to you when you register for an account and request an API KEY.

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


## Questions, tipps, and hints
If you need assistance or would like to provide input, you can e-mail me at karstenDOTberlinATgmailDOTcom
