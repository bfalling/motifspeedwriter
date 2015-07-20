var jQuery = jQuery || {};

var MotifSpeedWriter = (function(myPublic, $) {
  'use strict';

  var my = {};

  // Useful for debugging
  my.describeSequence = function(sequence) {
    var description = '';
    $.each(sequence, function(i, term) {
      description += term.code + '-' + term.duration + ' ';
      $.each(term.subsequences, function(i, subsequence) {
        description += '[' + my.describeSequence(subsequence) + '] ';
      });
    });
    return description;
  };

  my.parseSequence = function(sequenceText) {
    if (sequenceText === '') {
      return [];
    }
    // Split on top-level commas, and parse any inner groups
    var depth = 0;
    var terms = [];
    var termInProgress = '';
    for (var i = 0, len = sequenceText.length; i < len; i++) {
      var charToProcess = sequenceText.charAt(i);
      switch(charToProcess) {
        case ',':
          if (depth === 0) {
            terms.push(my.parseTerm(termInProgress));
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
    terms.push(my.parseTerm(termInProgress));
    return terms;
  }; // parseSequence

  my.parseTerm = function(termText) {
    // Separate actual term from simultaneous sequences
    var depth = 0;
    var subsequences = [];
    var subsequenceInProgress = '';
    var simpleTermInProgress = '';

    for (var i = 0, len = termText.length; i < len; i++) {
      var charToProcess = termText.charAt(i);
      switch(charToProcess) {
        case '(':
          depth++;
          if (depth === 1) {
            subsequenceInProgress = '';
          } else {
            subsequenceInProgress += charToProcess;
          }
          break;
        case ')':
          depth--;
          if (depth === 0) {
            subsequences.push(my.parseSequence(subsequenceInProgress));
          } else if (depth < 0) {
            console.log('Encountered extra right paren -- ignoring');
          } else {
            subsequenceInProgress += charToProcess;
          }
          break;
        default:
          if (depth === 0) {
            simpleTermInProgress += charToProcess;
          } else {
            subsequenceInProgress += charToProcess;
          }
          break;
      }
    }

    if (depth > 0) {
      subsequences.push(my.parseSequence(subsequenceInProgress));
    }

    var simpleTermRegexp = /(\D*)(\d.*)?/i;
    var match = simpleTermRegexp.exec(simpleTermInProgress);

    return {
      code: match[1] ? match[1].toLowerCase() : 'nop',
      duration: match[2] ? parseFloat(match[2]) : 1,
      subsequences: subsequences
    };
  }; // parseTerm

  myPublic.describeSequence = my.describeSequence;
  myPublic.parseSequence = my.parseSequence;

  return myPublic;

})(MotifSpeedWriter || {}, jQuery);
