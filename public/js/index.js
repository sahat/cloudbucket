define(['jquery', 'vex', 'vexDialog', 'hammer', 'animateCSS'], function($, vex, vexDialog) {
  console.log('loading index.');

  $('#browse').click(function() {
    console.log('click');
    $('input[id=userFile]').click();
  });

  $('input[id=userFile]').change(function() {
    var path = $(this).val();
    console.log(path)
    var fileName = path.split('\\') || path.split('/');
    console.log(fileName);
    if (fileName.length > 0) {
      $('#uploadField').val(fileName.slice(-1)[0]);
    } else {
      $('#uploadField').val(path);
    }

  });
});