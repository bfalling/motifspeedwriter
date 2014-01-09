var MotifSpeedWriter = (function() {

  var appObject = {};
  var lastMotifText = '';

  appObject.handleText = function(motifText) {
    if (motifText === lastMotifText) {
      return;
    } else {
      lastMotifText = motifText;
    }

    var cleanMotifText = motifText.replace(/\s/g, '');
    var cleanMotifTextLength = cleanMotifText.length;

    var motifStaff = 0;

    console.log('Processing');

    try {
      for (var i = 0; i < cleanMotifTextLength; i++) {
        var motifChar = cleanMotifText.charAt(i);


        if (motifChar === '|') {
          i++;
          if (cleanMotifText.charAt(i) === '|') {
            switch(motifStaff) {
              case 0:
                console.log('Create beginning staff');
                motifStaff++;
                break;
              case 1:
                console.log('Create ending staff');
                motifStaff++;
                break;
              default:
                throw('Too many staves');
                break;
            }
          } else {
            throw('Incomplete Motif staff');
          }
        }


      } // looping through chars

    } catch(thrown) {
      console.log('Thrown: ' + thrown);
    }; // try

  }; // handleText

  return appObject;
})();

$(document).ready(function() {
  $('#motif-text-clear-button').click(function(event) {
    $('#motif-text').val('');
    event.preventDefault();
  });

  // keyup fires multiple events, so just catch and process first one
  $('#motif-text').keyup(function() {
    MotifSpeedWriter.handleText($(this).val());
  });

  $('#motif-text').focus();
});

/*
TODO:
- Take URL parameter
*/
