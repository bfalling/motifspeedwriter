var MotifSpeedWriter = (function() {

  var appObject = {};
  var lastMotifText = '';

  appObject.parseSequence = function(sequenceText) {
    // Split on top-level commas, and parse any inner groups
    var depth = 0;
    var terms = [];
    var termInProgress = '';
    var createNewTerm = function(termText) {
      return { type: termText };
      // TODO: Create new term using factory
      // TODO: Parse new terms subterms and add to term
    };
    for (var i = 0, len = sequenceText.length; i < len; i++) {
      var charToProcess = sequenceText.charAt(i);
      switch(charToProcess) {
        case ',':
          if (depth === 0) {
            terms.push(createNewTerm(termInProgress));
            termInProgress = '';
          } else {
            termInProgress += charToProcess;
          }
          break;
        case '(':
          depth++;
          termInProgress += charToProcess;
          break;
        case ')':
          depth--;
          termInProgress += charToProcess;
          break;
        default:
          termInProgress += charToProcess;
          break;
      }
    }
    terms.push(createNewTerm(termInProgress));
    return terms;
  }; // parseSequence

  appObject.generateMotif = function(motifText) {
    if (motifText === lastMotifText) {
      return;
    } else {
      lastMotifText = motifText;
    }

    var cleanMotifText = motifText.replace(/\s/g, '');

    var preSequence = [];
    var mainSequence = [];
    var motifWithStaffRegexp = /([^\|]*)\|\|([^\|]*)\|\|/;
    var match = motifWithStaffRegexp.exec(cleanMotifText);
    if (match !== null) {
      preSequence = this.parseSequence(match[1]);
      mainSequence = this.parseSequence(match[2]);
    } else {
      mainSequence = this.parseSequence(cleanMotifText);
    }

    // DBG
    preSequenceOut = $.map(preSequence, function(val) {
      return val.type;
    });
    console.log('PreSequence: ' + preSequenceOut.join(':'));
    mainSequenceOut = $.map(mainSequence, function(val) {
      return val.type;
    });
    console.log('MainSequence: ' + mainSequenceOut.join(':'));

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
