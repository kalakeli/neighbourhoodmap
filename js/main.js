// +++++  N E I G H B O U R H O O D    M A P  +++++
// - ui part - //

// -----  toggle option list  ----- //
var hamburger = document.querySelector('.hamburger');
var sbLayer = document.querySelector('.sideboard');
var mapLayer = document.querySelector('#map');

hamburger.addEventListener('click', function(e) {
  sbLayer.classList.toggle('shift');
  mapLayer.classList.toggle('shift');
  hamburger.classList.toggle('shift');
  e.stopPropagation();
});


// -----  create the knockout application ------ //
var LocationModel = function() {
  var self = this;

  self.locations = ko.observableArray(locations);


}

ko.applyBindings(new LocationModel());



// ----- attach hover event handler to location elements ('<li>') -----
// animates the marker
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

// ----- attach click event handler to location elements ('<li>') -----
// open the infoWindow on the marker
$( "li" ).on("click",
  function() {
    var context = ko.contextFor(this);
    var theMarker = getMarker(context.$data.place_id);
    populateInfoWindow(theMarker, infoWindow);
  }
);
