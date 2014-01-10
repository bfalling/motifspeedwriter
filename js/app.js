var MotifSpeedWriter = (function() {

  var appObject = {};
  var lastMotifText = '';

  appObject.parseMotifTerms = function(motifText) {
    var motifData = {};
    return motifText;

  }; // parseMotifTerms

  appObject.generateMotif = function(motifText) {
    if (motifText === lastMotifText) {
      return;
    } else {
      lastMotifText = motifText;
    }

    var cleanMotifText = motifText.replace(/\s/g, '');

    var motifPreTerms = [];
    var motifTerms = [];
    var motifWithStaffRegexp = /([^\|]*)\|\|([^\|]*)\|\|/;
    var match = motifWithStaffRegexp.exec(cleanMotifText);
    if (match !== null) {
      motifPreTerms = this.parseMotifTerms(match[1]);
      motifTerms = this.parseMotifTerms(match[2]);
    } else {
      motifTerms = this.parseMotifTerms(cleanMotifText);
    }

    console.log('PreTerms: ' + motifPreTerms);
    console.log('Terms: ' + motifTerms);

/*
    var motifData = this.parseMotifText(cleanMotifText);

    var cleanMotifTextLength = cleanMotifText.length;

    var motifStaff = 0;
    var currentPosition = 0;
    var numColumns = 1; // TODO

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
*/
  }; // generateMotif

  return appObject;
})();

$(document).ready(function() {
  $('#motif-text-clear-button').click(function(event) {
    $('#motif-text').val('');
    event.preventDefault();
  });

  // keyup fires multiple events, so just catch and process first one
  $('#motif-text').keyup(function() {
    MotifSpeedWriter.generateMotif($(this).val());
  });

  $('#motif-text').focus();
});

/*
TODO:
- Take URL parameter
*/
