var jQuery = jQuery || {};

var MotifSpeedWriter = (function(my, $) {
  'use strict';

  // Parse a series of terms from a text string
  my.parseSequence = function(sequenceText) {
    if (sequenceText === '') {
      return [];
    }
    var depth = 0;
    var terms = [];
    var termInProgress = '';
    var processChar = function(aChar) {
      switch(aChar) {
        case ',':
          if (depth === 0) {
            terms.push(parseTerm(termInProgress));
            termInProgress = '';
          } else {
            termInProgress += aChar;
          }
          break;
        case '(':
          depth++;
          termInProgress += aChar;
          break;
        case ')':
          depth--;
          termInProgress += aChar;
          break;
        default:
          termInProgress += aChar;
          break;
      }
    };
    for (var i = 0, len = sequenceText.length; i < len; i++) {
      processChar(sequenceText.charAt(i));
    }
    terms.push(parseTerm(termInProgress)); // Handle any remaining
    return terms;
  };

  // Parse one term, handling any attached, simultaneous subsequences
  var parseTerm = function(termText) {
    var depth = 0;
    var subsequences = [];
    var subsequenceInProgress = '';
    var simpleTermInProgress = '';
    var processTermChar = function(aChar) {
      switch(aChar) {
        case '(':
          depth++;
          if (depth === 1) {
            subsequenceInProgress = '';
          } else {
            subsequenceInProgress += aChar;
          }
          break;
        case ')':
          depth--;
          if (depth === 0) {
            subsequences.push(my.parseSequence(subsequenceInProgress));
          } else if (depth < 0) {
            console.log('Encountered extra right paren -- ignoring');
          } else {
            subsequenceInProgress += aChar;
          }
          break;
        default:
          if (depth === 0) {
            simpleTermInProgress += aChar;
          } else {
            subsequenceInProgress += aChar;
          }
          break;
      }
    };
    for (var i = 0, len = termText.length; i < len; i++) {
      processTermChar(termText.charAt(i));
    }
    // Handle any remaining, unclosed subsequence
    if (depth > 0) {
      subsequences.push(my.parseSequence(subsequenceInProgress));
    }

    var canonicalTerm = parseCanonicalTerm(simpleTermInProgress);

    return {
      code: canonicalTerm.code,
      parts: canonicalTerm.parts,
      duration: canonicalTerm.duration,
      subsequences: subsequences
    };
  }; // parseTerm

  var parseCanonicalTerm = function(termText) {
    var simpleTermRegexp = /(\D*)(\d.*)?/i; // Non-numbers followed by numbers
    var match = simpleTermRegexp.exec(termText);
    var termCode = match[1] ? match[1].toLowerCase() : 'nop';
    var termDuration = match[2] ? parseFloat(match[2]) : 1;
    var termCodeAndParts = parseComboTermParts(termCode);
    return {
      code: termCodeAndParts.code,
      parts: termCodeAndParts.parts,
      duration: termDuration
    };
  };

  // Parse any combo terms (for now, just Efforts)
  var parseComboTermParts = function(termCode) {
    var termParts;
    if (termCode.indexOf('+') > -1) {
      termParts = termCode.split('+');
      termCode = termParts[0];
    } else {
      termParts = [termCode];
    }
    if ($.inArray(termCode, my.defs.efforts) > -1) {
      termCode = 'effort';
    }
    return { code: termCode, parts: termParts };
  };

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

  return my;

})(MotifSpeedWriter || {}, jQuery);
