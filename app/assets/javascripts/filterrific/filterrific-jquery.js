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
Filterrific.submitFilterForm = function(){
  console.log("Form submission triggered");
  var form = $(this).parents("form"),
      url = form.attr("action");
  // send before event
  $(form).trigger('loadingFilterrificResults');
  // turn on spinner
  $('.filterrific_spinner').show();

  // Abort previous ajax request
  if (Filterrific.lastRequest && Filterrific.lastRequest.readyState != 4) {
    Filterrific.lastRequest.abort();
  }

  // Submit ajax request
  Filterrific.lastRequest = $.ajax({
    url: url,
    data: form.serialize(),
    type: 'GET',
    dataType: 'script'
  }).done(function( msg ) {
    // send after event
    $(form).trigger('loadedFilterrificResults');
    $('.filterrific_spinner').hide();
  });
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
    lastVal = $(this).val(); // Update lastVal on keyup
    console.log("Form submission triggered by keyup. Value:", lastVal);
    Filterrific.submitFilterForm();
  }, 500));

  $('#filterrific_filter').on("change", ":input", function(event) {
    var currentVal = $(this).val();
    if (currentVal !== lastVal) { // Check if the current value is different from the last value
      lastVal = currentVal; // Update lastVal on change
      console.log("Form submission triggered by change. New Value:", currentVal);
      Filterrific.submitFilterForm();
    } else {
      console.log("Change event detected, but value is the same. No submission.");
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
