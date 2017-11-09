// +++++  N E I G H B O U R H O O D    M A P  +++++
// - ui part - //

var hamburger = document.querySelector('.hamburger');
var sbLayer = document.querySelector('.sideboard');
var mapLayer = document.querySelector('#map');


// -----  toggle option list  ----- //
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
  self.markers = ko.observableArray(markers);
  // create an observable for the filter text in the text box
  self.filterText = ko.observable();
  self.filterMarkers = ko.observable();

  self.filteredLocations = ko.computed(function () {
    if (!self.filterText()) {
      // no filter text? get all locations
      return self.locations();
    } else {
      // use knockout utility function to filter location array
      return ko.utils.arrayFilter(self.locations(), function (loc) {
        return (loc.title.includes(self.filterText())); // return those locations including the filter text
      });
    }
  });

  self.filteredMarkers = ko.computed(function () {
    if (!self.filterText()) {
      // no filter text? get all markers
      return self.markers();
    } else {
      // use knockout utility function to filter markers array
      // display only those markers still applicable
      filterMarkers(ko.utils.arrayFilter(self.markers(), function (marker) {
        return (marker.title.includes(self.filterMarkers()));
      }));
    }
  });

  self.applyFilter = function (title) {
    self.filterMarkers(title);
    self.filterText(title);
  }
}

ko.applyBindings(new LocationModel());



// -----  filter area above list ----- //
var filterArea = {
  init: function() {
    var filterTxt = $('#txtfilter');
    filterTxt.val("");
  }
};

// -----  location list area  ----- //
var locationArea = {
  init: function() {
    var li = $('li');

    // toggle animation on mouseover
    li.on('mouseover', function() {
      var context = ko.contextFor(this);
      toggleBounce(getMarker(context.$data.place_id));
    });

    // toggle animation on mouseout
    li.on('mouseout', function() {
      var context = ko.contextFor(this);
      toggleBounce(getMarker(context.$data.place_id));
    });

    // open infoWindow on click
    li.on('click', function() {
      var context = ko.contextFor(this);
      var theMarker = getMarker(context.$data.place_id);
      populateInfoWindow(theMarker, infoWindow);
    });
  }
};


filterArea.init();
locationArea.init();
