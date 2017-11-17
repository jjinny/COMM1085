jQuery(document).ready(function($) {
  
  var nowdragging = -1;
	
  var drag_items = $('.drop-effect .drag');
  var drop_items = $('.drop-effect').find('.drop');

  //sets up the drag and drop event listeners
  function setUpEventListeners() {

    drag_items.each(function() {
      var thisDrag = $(this);
      thisDrag[0].addEventListener('dragstart', dragStart);
      thisDrag[0].addEventListener('drag', drag);
      thisDrag[0].addEventListener('dragend', dragEnd);
    });

    drop_items.each(function() {
      var thisDrop = $(this);

      thisDrop[0].addEventListener('dragenter', dragEnter);
      thisDrop[0].addEventListener('dragover', dragOver);
      thisDrop[0].addEventListener('dragleave', dragLeave);
      thisDrop[0].addEventListener('drop', drop);

    });

  }
  setUpEventListeners();

  var dragItem;

  //called as soon as the draggable starts being dragged
  //used to set up data and options
  function dragStart(event) {

	nowdragging = parseInt($(this)[0].id.slice(2));
    drag = event.target;
    dragItem = event.target;

    //set the effectAllowed for the drag item
    event.dataTransfer.effectAllowed = $(this).attr('data-effect-allowed');

    var imageSrc = $(dragItem).prop('src');
    var imageHTML = $(dragItem).prop('outerHTML');

    //check for IE (it supports only 'text' or 'URL')
    try {
      event.dataTransfer.setData('text/uri-list', imageSrc);
      event.dataTransfer.setData('text/html', imageHTML);
    } catch (e) {
      event.dataTransfer.setData('text', imageSrc);
    }

    $(drag).addClass('drag-active');

  }

  //called as the draggable enters a droppable 
  //needs to return false to make droppable area valid
  function dragEnter(event) {

    var drop = this;

    //set the drop effect for this zone
     event.dataTransfer.dropEffect = $(drop).attr('data-drop-effect');
    $(drop).addClass('drop-active');

    event.preventDefault();
    event.stopPropagation();

  }

  //called continually while the draggable is over a droppable 
  //needs to return false to make droppable area valid
  function dragOver(event) {
    var drop = this;

    //set the drop effect for this zone
    event.dataTransfer.dropEffect = $(drop).attr('data-drop-effect');
    $(drop).addClass('drop-active');

    event.preventDefault();
    event.stopPropagation();
  }

  //called when the draggable was inside a droppable but then left
  function dragLeave(event) {
    var drop = this;
    $(drop).removeClass('drop-active');
  }

  //called continually as the draggable is dragged
  function drag(event) {}

  //called when the draggable has been released (either on droppable or not)
  //may be called on invalid or valid drop
  function dragEnd(event) {

    var drag = this;
    $(drag).removeClass('drag-active');

  }

  //called when draggable is dropped on droppable 
  //final process, used to copy data or update UI on successful drop
  function drop(event) {
	  
	event.preventDefault();
	event.stopPropagation();
	  
	var droppedin = parseInt($(this)[0].id.slice(2));
	  
	  drop = this;
	  
	  if(nowdragging == droppedin) {

		$("#di"+nowdragging).css("visibility","hidden");
		  
		$(drop).removeClass('drop-active');
		$(drop).addClass('correct');

		event.dataTransfer.dropEffect = $(drop).attr('data-drop-effect');

		var dataList, dataHTML, dataText;

		//collect our data (based on what browser support we have)
		try {
		  dataList = event.dataTransfer.getData('text/uri-list');
		  dataHTML = event.dataTransfer.getData('text/html');
		} catch (e) {;
		  dataText = event.dataTransfer.getData('text');
		}
		//we have access to the HTML
		if (dataHTML) {
		  $(drop).empty();
		  $(drop).prepend(dataHTML);
		}
		//only have access to text (old browsers + IE)
		else {
		  $(drop).empty();
		  $(drop).prepend($(dragItem).clone());
		}
		  

	  }
	  else {
		  $(drop).removeClass('drop-active');
		  $(".feedbackzone").html("<p>Incorrect</p>");
		  
	  }
  }

  //Reset the drop containers
  $('.reset-button').on('click', function() {
    $('.drop').contents().remove();
	$('.drag-item').contents().css('visibility','visible');
    $('.drop').removeClass('correct');
  });
  
  var userAgent = window.navigator.userAgent;
  if(userAgent.indexOf('MSIE') != -1){
    $('.ie-message').show();
  }

});