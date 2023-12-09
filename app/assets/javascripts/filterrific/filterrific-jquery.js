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

if (typeof Filterrific === 'undefined') {
  var Filterrific = {};
}

Filterrific.submitFilterForm = function(event){

  var form = $(event.target).closest("form"),
      url = form.attr("action");

  $(form).trigger('loadingFilterrificResults');
  $('.filterrific_spinner').show();

  if (Filterrific.lastRequest && Filterrific.lastRequest.readyState != 4) {
    Filterrific.lastRequest.abort();
  }

  Filterrific.lastRequest = $.ajax({
    url: url,
    data: form.serialize(),
    type: 'GET',
    dataType: 'script'
  }).done(function( msg ) {
    $(form).trigger('loadedFilterrificResults');
    $('.filterrific_spinner').hide();
  }).fail(function(jqXHR, textStatus) {
  });

};

(function($) {

  $.fn.filterrific_observe_field = function(frequency, callback) {
    frequency = frequency * 1000;
    return this.each(function(){
      var $this = $(this);
      var prev = $this.val();
      var check = function() {
        if(removed()){
          if(ti) clearInterval(ti);
          return;
        }
        var val = $this.val();
        if(prev != val){
          prev = val;
          $this.map(callback);
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
      var ti = setInterval(check, frequency);
      $this.bind('keyup click mousemove', reset);
    });
  };
})(jQuery);


Filterrific.init = function() {
  var lastVal = '';

$('#filterrific_filter').on("keyup", ":input", throttle(function(event) {
  lastVal = $(this).val(); 
  Filterrific.submitFilterForm(event);
}, 500));

$('#filterrific_filter').on("change", ":input", function(event) {
  var currentVal = $(this).val();
  if (currentVal !== lastVal) {
    lastVal = currentVal;
    Filterrific.submitFilterForm(event);
  }
});
};

jQuery(document).on('turbolinks:load', function() {
  jQuery(document).off('ready page:load')
  Filterrific.init();
});

jQuery(document).on('ready page:load', function() {
  Filterrific.init();
});
