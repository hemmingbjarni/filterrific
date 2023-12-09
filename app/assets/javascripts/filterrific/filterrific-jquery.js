/**
 * Javascript behaviors for Filterrific.
 * http://filterrific.clearcove.ca
 *
 * Requires jQuery 1.7.0 or later.
 *
 * Released under the MIT license
 *
 */

function throttle(f, delay){
    var timer = null;
    return function(){
        var context = this, args = arguments;
        clearTimeout(timer);
        timer = window.setTimeout(function(){
            f.apply(context, args);
        },
        delay || 500);
    };
}

// Create global Filterrific namespace
if (typeof Filterrific === 'undefined') {
  var Filterrific = {};
}



// Define function to submit Filterrific filter form
Filterrific.submitFilterForm = function(event){
  console.log("Inside submitFilterForm function");

  var form = $(event.target).closest("form"),
      url = form.attr("action");

  console.log("Form action URL:", url);
  console.log("Form data:", form.serialize());

  // send before event
  $(form).trigger('loadingFilterrificResults');
  // turn on spinner
  $('.filterrific_spinner').show();

  // Abort previous ajax request
  if (Filterrific.lastRequest && Filterrific.lastRequest.readyState != 4) {
    console.log("Aborting previous AJAX request");
    Filterrific.lastRequest.abort();
  }

  // Submit ajax request
  Filterrific.lastRequest = $.ajax({
    url: url,
    data: form.serialize(),
    type: 'GET',
    dataType: 'script'
  }).done(function( msg ) {
    console.log("AJAX request completed");
    // send after event
    $(form).trigger('loadedFilterrificResults');
    $('.filterrific_spinner').hide();
  }).fail(function(jqXHR, textStatus) {
    console.log("AJAX request failed:", textStatus);
  });

  console.log("AJAX request sent");
};



//
// Embed jquery.observe_field.js to observe Filterrific filter inputs
//
// Copied from https://github.com/splendeo/jquery.observe_field
// Wrap in immediately invoked function for compatibility with other js libraries
//
(function($) {

  $.fn.filterrific_observe_field = function(frequency, callback) {
    frequency = frequency * 1000; // translate to milliseconds
    return this.each(function(){
      var $this = $(this);
      var prev = $this.val();
      var check = function() {
        if(removed()){ // if removed clear the interval and don't fire the callback
          if(ti) clearInterval(ti);
          return;
        }
        var val = $this.val();
        if(prev != val){
        console.log("Observed field change");
          prev = val;
          $this.map(callback); // invokes the callback on $this
        }
      };
      var removed = function() {
        return $this.closest('html').length == 0
      };
      var reset = function() {
        if(ti){
          clearInterval(ti);
          ti = setInterval(check, frequency);
        }
      };
      check();
      var ti = setInterval(check, frequency); // invoke check periodically
      // reset counter after user interaction
      $this.bind('keyup click mousemove', reset); //mousemove is for selects
    });
  };
})(jQuery);


Filterrific.init = function() {
  var lastVal = ''; // Variable to store the last value

$('#filterrific_filter').on("keyup", ":input", throttle(function(event) {
  lastVal = $(this).val(); 
  console.log("Form submission triggered by keyup. Value:", lastVal);
  Filterrific.submitFilterForm(event);
}, 500));

$('#filterrific_filter').on("change", ":input", function(event) {
  var currentVal = $(this).val();
  if (currentVal !== lastVal) {
    lastVal = currentVal;
    console.log("Form submission triggered by change. New Value:", currentVal);
    Filterrific.submitFilterForm(event);
  }
});
};


// Initialize event observers on document ready and turbolinks page:load
jQuery(document).on('turbolinks:load', function() {
  // Prevent double initilisation. With turbolinks 5 this function
  // will be called twice: on 'ready' and 'turbolinks:load'
  jQuery(document).off('ready page:load')
  Filterrific.init();
});

jQuery(document).on('ready page:load', function() {
  Filterrific.init();
});
