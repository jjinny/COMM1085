function initialize() {
  bindHandlers();
}

/**
 * Checks if the internet browser is Internet Explorer
 *
 */
function isIE () {
  var ua = window.navigator.userAgent;
  var ie = ua.indexOf("MSIE");
  var trident = ua.indexOf("Trident");

  if ((ie > 0) || (trident > 0)) {
    return true;
  }
  return false;
}

/**
 * Animates boxes making them gradually gain transparency and revealing text.
 * Reveals the "success" message when all boxes have been clicked on.
 */
function boxClick ($obj) {

  $obj.addClass('clicked').removeClass('clickable');
  $obj.find('.text').addClass('clicked');
  $obj.find('.desc-text').addClass('clicked');
  $obj.css('z-index', 0);
  var $boxesClicked = $('.box.clicked');
  $boxesClicked.css('background-color');
  
  if ($boxesClicked.length === 4) {
    $('.circle').addClass('clickable').addClass('front');
    $('#success').addClass('show');
    setTimeout(function() {
      $('.circle').focus();
    }, 0);
  }
}

/**
 * Moves the "success" button and fully reveals the picture in the background.
 */
function circleClick ($obj) {
 
  if ($('.box.clicked').length === 4) {
    $('.box').addClass('hide');
    
    if (isIE()) {
      $obj.css('transform', 'translate(-50%,-100%)').css('top', 'calc(100% + 40px)');
    } else {
      $obj.removeClass('centered');
      $obj.addClass('bottom-middle-circle');
    }
    $obj.removeAttr('onclick').removeClass('clickable');
  }
  
}

/**
 * Add tabindex to all elements.
 * Adding tabindexes enables outline on focus on the element.
 */
function keyboardMode () {
  
  $('.box').addClass('tabbed').attr('tabindex','0');
  
  if ($('.box.clicked').length === 4) {
    $('.circle').addClass('tabbed').attr('tabindex','0');
  }
  
}

/**
 * Remove tabindexes from all elements.
 */
function mouseMode () {
  
  $('.box').removeClass('tabbed').removeAttr('tabindex');
  
  if ($('.box.clicked').length === 4) {
    $('.circle').removeClass('tabbed').removeAttr('tabindex');
  }
    
}

/**
 * Bind keyboard and mouse handlers to detect inputs.
 * On mouse inputs go to mouse mode, on keyboard inputs go to
 * keyboard mode.
 */
function bindHandlers () {
  $(window).keyup(function (e) {
    var code = (e.keyCode ? e.keyCode : e.which);
    if (code == 9) {
      keyboardMode();
    }
  });

  $(window).click(function () {
    mouseMode();
  });

  $('.box').keyup(function(e) {
    simulateBoxClick(e)
  });
  $('.circle').keyup(function(e){
    simulateCircleClick(e)
  });

}
function simulateBoxClick(e) {
  var code = (e.keyCode ? e.keyCode : e.which);
  console.log(code);
  if (code == 192) {
    boxClick($(e.target));
  }
}

function simulateCircleClick(e) {
  var code = (e.keyCode ? e.keyCode : e.which);
  console.log(code);
  if (code == 192) {
    circleClick($(e.target));
  }
}