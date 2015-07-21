var jQuery = jQuery || {};

var MotifSpeedWriter = (function(my, $) {
  'use strict';

  var numColumns;
  var columnAvailableUnits;

  my.prepareCanvasContext = function() {
    var canvas = $('#motif-canvas')[0];
    my.context = canvas.getContext('2d');
    my.context.scale(my.defs.devicePixelRatio, my.defs.devicePixelRatio);
  }

  my.finishCanvasContext = function() {
    my.context.scale(1.0 / my.defs.devicePixelRatio, 1.0 / my.defs.devicePixelRatio);
  }

  my.layoutSequence = function(sequence, startUnit) {
    sequence.startUnit = startUnit;

    // Compute sequence duration
    sequence.duration = 0;
    $.each(sequence, function(i, term) {
      sequence.duration += term.duration;
    });

    // Determine first available free column, or create new one
    for (var i = 0; i < numColumns; i++) {
      if (columnAvailableUnits[i] <= startUnit) {
        sequence.column = i;
        columnAvailableUnits[i] = startUnit + sequence.duration;
        break;
      }
    }
    if (sequence.column === undefined) {
      sequence.column = numColumns;
      columnAvailableUnits[numColumns] = startUnit + sequence.duration;
      numColumns++;
    }

    // Recurse through each term's subsequences, if present
    var currentUnit = 0;
    $.each(sequence, function(i, term) {
      $.each(term.subsequences, function(i, subsequence) {
        this.layoutSequence(subsequence, startUnit + currentUnit);
      }.bind(this));
      currentUnit += term.duration;
    }.bind(this));
  };

  my.drawInitial = function() {
    var canvas = $('#motif-canvas');
    var context = canvas[0].getContext('2d');
    context.scale(this.defs.devicePixelRatio, this.defs.devicePixelRatio);

    context.fillStyle = 'white';
    context.fillRect(0, 0, canvas.width(), canvas.height());

    context.font = '0.1rem arial,sans-serif';
    context.textAlign = 'center';
    context.textBaseline = 'bottom';
    context.fillStyle = '#aaa';
    context.fillText('Motif SpeedWriter', canvas.width() / 2, canvas.height());

    // Restore context scale factor
    context.scale(1.0 / this.defs.devicePixelRatio, 1.0 / this.defs.devicePixelRatio);
  };

  my.drawSequence = function(sequence, midX, startY) {
    var totalCanvasHeight = $('#motif-canvas').height();
    var column = sequence.column;
    var columnUnitShift = column % 2 === 1 ? (column + 1) / 2 : -(column / 2);
    var columnX = midX + columnUnitShift * this.defs.unitSize;
    var currentY = startY + sequence.startUnit * this.defs.unitSize;
    $.each(sequence, function(i, term) {
      this.drawTerm(term, columnX, totalCanvasHeight - currentY);
      currentY += term.duration * this.defs.unitSize;
      $.each(term.subsequences, function(i, subsequence) {
        this.drawSequence(subsequence, midX, startY);
      }.bind(this));
    }.bind(this));
  };

  my.drawStaff = function(columnWidth, midX, startY) {
    var canvas = $('#motif-canvas')[0];
    var context = canvas.getContext('2d');
    context.scale(this.defs.devicePixelRatio, this.defs.devicePixelRatio);
    context.lineWidth = this.defs.mainMotifThickness;
    context.strokeStyle = 'black';
    context.beginPath();
    var staffWidth = columnWidth * this.defs.unitSize;
    context.moveTo(midX - staffWidth / 2, startY - this.defs.termPadding);
    context.lineTo(midX + staffWidth / 2, startY - this.defs.termPadding);
    context.moveTo(midX - staffWidth / 2, startY - 2 * this.defs.termPadding);
    context.lineTo(midX + staffWidth / 2, startY - 2 * this.defs.termPadding);
    context.stroke();
    context.scale(1.0 / this.defs.devicePixelRatio, 1.0 / this.defs.devicePixelRatio);
  };

  my.loadPage = function() {
    var match = location.search.match(/motif=([^&]*)/);
    if (match) {
      var motifText = decodeURIComponent(match[1] + '');
      $('#motif-text').val(motifText);
      this.generateMotif(motifText);
      $('#motif-text').focus();
    } else {
      $('#motif-text-clear-button').click();
    }
  }; // loadPage

  var lastMotifText; // Leave undefined
  my.generateMotif = function(motifText) {
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
    var showMotifStaff;
    if (match !== null) {
      showMotifStaff = true;
      preSequence = this.parseSequence(match[1]);
      mainSequence = this.parseSequence(match[2]);
    } else {
      showMotifStaff = false;
      mainSequence = this.parseSequence(cleanMotifText);
    }

    // DBG
    //console.log('PreSequence: ' + this.describeSequence(preSequence));
    //console.log('MainSequence: ' + this.describeSequence(mainSequence));

    // NOTE: Removing old canvas and creating a new one elminates border artifacts left when resizing on Safari
    $('#motif-canvas').remove();
    $('#motif-canvas-container').append('<canvas id="motif-canvas"></canvas>');

    // Determine canvas dimensions

    numColumns = 0;
    columnAvailableUnits = [];
    this.layoutSequence(preSequence, 0);
    var preSequenceNumColumns = numColumns;
    var maxPreSequenceDuration = 0;
    $.each(columnAvailableUnits, function(i, unit) {
      if (maxPreSequenceDuration < unit) {
        maxPreSequenceDuration = unit;
      }
    });

    numColumns = 0;
    columnAvailableUnits = [];
    this.layoutSequence(mainSequence, 0);
    var mainSequenceNumColumns = numColumns;
    var maxMainSequenceDuration = 0;
    $.each(columnAvailableUnits, function(i, unit) {
      if (maxMainSequenceDuration < unit) {
        maxMainSequenceDuration = unit;
      }
    });

    var maxNumColumns = Math.max(preSequenceNumColumns, mainSequenceNumColumns);
    var totalCanvasWidth = maxNumColumns * this.defs.unitSize + 2 * this.defs.edgePadding;
    var totalCanvasHeight = (maxPreSequenceDuration + maxMainSequenceDuration) * this.defs.unitSize +
                            (showMotifStaff ? 2 * this.defs.staffLineHeight : 0) + 2 * this.defs.edgePadding;

    $('#motif-canvas').attr('width', totalCanvasWidth * this.defs.devicePixelRatio).attr('height', totalCanvasHeight * this.defs.devicePixelRatio)
                      .width(totalCanvasWidth).height(totalCanvasHeight);

    // Draw the motif

    this.drawInitial();

    var midX = totalCanvasWidth / 2;
    var currentY = this.defs.edgePadding;

    if (showMotifStaff) {
      this.drawSequence(preSequence, midX - (preSequenceNumColumns % 2 === 0 ? this.defs.unitSize / 2 : 0), currentY);
      currentY += maxPreSequenceDuration * this.defs.unitSize;
      this.drawStaff(maxNumColumns, midX, totalCanvasHeight - currentY);
      currentY += this.defs.staffLineHeight;
    }

    this.drawSequence(mainSequence, midX - (mainSequenceNumColumns % 2 === 0 ? this.defs.unitSize / 2 : 0), currentY);
    currentY += maxMainSequenceDuration * this.defs.unitSize;

    if (showMotifStaff) {
      this.drawStaff(maxNumColumns, midX, totalCanvasHeight - currentY);
      currentY += this.defs.staffLineHeight;
    }

    // Generate image
    var canvasDataURL = $('#motif-canvas')[0].toDataURL('image/png');
    $('#motif-image-container').html('<img id="motif-image" src="' + canvasDataURL + '">');

  }; // generateMotif

  return my;

})(MotifSpeedWriter || {}, jQuery);
