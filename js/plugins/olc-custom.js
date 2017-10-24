// JavaScript Document

if(window.parent.$("iframe").attr("src") !== undefined) {
	window.parent.$("iframe").attr("scrolling","no");
}

$(window).resize(function () {
    waitForFinalEvent(function(){
                var bodyheight = $("body").outerHeight();    
    window.parent.$("iframe").outerHeight(bodyheight+"px");
        
   }, 900, "some unique string");
});                             
                                  
var waitForFinalEvent = (function () {
  var timers = {};
  return function (callback, ms, uniqueId) {
    if (!uniqueId) {
      uniqueId = "Don't call this twice without a uniqueId";
    }
    if (timers[uniqueId]) {
      clearTimeout (timers[uniqueId]);
    }
    timers[uniqueId] = setTimeout(callback, ms);
  };
})();


$('.closeall').click(function(){
  $('.panel-collapse.in')
    .collapse('hide');
});

$('.openall').click(function(){
  $('.panel-collapse:not(".in")')
    .collapse('show');
});