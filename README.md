# neighbourhoodmap

## What *neighbourhoodmap* is 
The app is a GoogleMaps application featuring a list of locations in Münster (Westphalia) in Germany. It is run by opening *index.html* in the browser. The list is shown to the left of the page, on the map the locations are shown by markers. The list can be hidden / shown by clicking the hamburger icon in the top left of the page. **Hovering** over an item in the list animates the connected marker. **Clicking** a marker or list item will open an infoWindow with the name of the location, plus will it asynchronously download flickr images showing the location. 

## How *neighbourhoodmap* works
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
Clicking a list item or marker on the map will open an info window offering more information on the location plus pictures (see __*Third party webservices used*__)

## Third party webservices used
### Flickr
[Flickr](https://www.flickr.com/) offers web services hidden in the App Garden [Api Documentation](https://www.flickr.com/services/api/) available to you when you register for an account and request an API KEY. 

The neighbourhood map uses two asynchronous webservice requests: **flickr.photos.search** to find images and **flickr.profile.getProfile** to find the user owning the copyright for the image. 

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
- [x] create to hide / show the location list in an intuitive way
- [x] create animation for markers when hovering a list item
- [x] open info window on list item click or marker click
- [x] use flickr as a 3rd party webservice to asynchronously download images for the location
- [ ] implement a filter to display only those locations and markers fitting the selection

## Questions, tipps, and hints
If you need assistance or would like to provide input, you can e-mail me at karstenDOTberlinATgmailDOTcom
