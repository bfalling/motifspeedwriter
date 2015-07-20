var jQuery = jQuery || {};

var MotifSpeedWriter = (function(myPublic, $) {
  'use strict';

  var my = {};

  // Position coordinates helper
  // NOTE: Left as a free function to keep it small, cuz it's used everywhere
  var p = function(code) {
    switch (code) {
      case 'pby':
        return my.startY - my.defs.termPadding;
      case 'pty':
        return my.startY - my.duration * my.defs.unitSize + my.defs.termPadding;
      case 'puty':
        return my.startY - my.defs.unitSize + my.defs.termPadding;
      case '-nar2':
        return my.midX - my.defs.unitSize / 5;
      case '+nar2':
        return my.midX + my.defs.unitSize / 5;
      case 'nar':
        return my.defs.unitSize / 2.5;
      case 'nar2':
        return my.defs.unitSize / 5;
      case 'plx':
        return my.midX - my.defs.unitSize / 2 + my.defs.termPadding;
      case 'prx':
        return my.midX + my.defs.unitSize / 2 - my.defs.termPadding;
      case 'cdy':
        return my.startY - my.duration * my.defs.unitSize / 2;
      case 'cuy':
        return my.startY - my.defs.unitSize / 2;
      default:
        return my.defs.termPadding;
    }
  };

  // PUBLIC: Execute the needed drawing instructions for a single term (BIG!)
  my.drawTerm = function(term, midX, startY, defs) {
    my.termCode = term.code;
    my.duration = term.duration;
    my.termParts = term.parts;
    my.midX = midX;
    my.startY = startY;
    my.defs = defs;

    // TODO: Refactor this to prepareCanvasContext
    var canvas = $('#motif-canvas')[0];
    my.context = canvas.getContext('2d');
    my.context.scale(my.defs.devicePixelRatio, my.defs.devicePixelRatio);
    my.context.lineWidth = my.defs.mainMotifThickness;
    my.context.strokeStyle = 'black';

    switch (my.termCode) {
      case 'box':
        my.drawPath([
          { cmd: 'line-close', params: [
            [p('plx'), p('pby')],
            [p('plx'), p('pty')],
            [p('prx'), p('pty')],
            [p('prx'), p('pby')]
          ] }
        ]);
        break;
      case 'act':
        my.drawPath([
          { cmd: 'line', params: [[my.midX, p('pby')], [my.midX, p('pty')]] }
        ]);
        break;
      case 'ges':
        my.drawPath([
          { cmd: 'line', params: [[my.midX, p('pby')], [my.midX, p('pty')]] },
          { cmd: 'circle-hold', params: [my.midX, p('pby') - my.defs.unitSize / 3.5] }
        ]);
        break;
      case 'hold':
        my.drawPath([
          { cmd: 'circle-hold', params: [my.midX, p('pby') - my.defs.holdCircleRadius] }
        ]);
        break;
      case 'rel':
        my.drawPath([
          { cmd: 'arc', params: [my.midX - 2, p('pty') + my.defs.holdCircleRadius, my.defs.holdCircleRadius, Math.PI, 2 * Math.PI] },
          { cmd: 'arc', params: [my.midX + 1, p('pty') + my.defs.holdCircleRadius, my.defs.holdCircleRadius, 0, Math.PI] }
        ]);
        break;
      case 'holdrel':
        my.drawPath([
          { cmd: 'circle-hold', params: [my.midX, p('pby') - my.defs.holdCircleRadius] },
          { cmd: 'arc', params: [my.midX - 2, p('pty') + my.defs.holdCircleRadius, my.defs.holdCircleRadius, Math.PI, 2 * Math.PI] },
          { cmd: 'arc', params: [my.midX + 1, p('pty') + my.defs.holdCircleRadius, my.defs.holdCircleRadius, 0, Math.PI] }
        ]);
        break;
      case 'path':
        my.context.beginPath();
        var quadraticCurveControlHeight = my.defs.unitSize / 10;
        my.context.moveTo(p('-nar2'), p('pby') + quadraticCurveControlHeight / 2);
        my.context.quadraticCurveTo(my.midX - my.defs.unitSize / 8, p('pby') - quadraticCurveControlHeight, my.midX, p('pby'));
        my.context.quadraticCurveTo(my.midX + my.defs.unitSize / 8, p('pby') + quadraticCurveControlHeight, p('+nar2'), p('pby') - quadraticCurveControlHeight / 2);
        my.context.stroke();
        my.drawPath([
          { cmd: 'line', params: [[my.midX, p('pby')], [my.midX, p('pty')]] }
        ]);
        my.context.beginPath();
        my.context.moveTo(my.midX - my.defs.unitSize / 4, p('pty') + quadraticCurveControlHeight / 2);
        my.context.quadraticCurveTo(my.midX - my.defs.unitSize / 8, p('pty') - quadraticCurveControlHeight, my.midX, p('pty'));
        my.context.quadraticCurveTo(my.midX + my.defs.unitSize / 8, p('pty') + quadraticCurveControlHeight, my.midX + my.defs.unitSize / 4, p('pty') - quadraticCurveControlHeight / 2);
        my.context.stroke();
        break;
      case 'stra':
        my.drawPath([
          { cmd: 'line', params: [[p('-nar2'), p('pby')], [p('+nar2'), p('pby')]] },
          { cmd: 'line', params: [[my.midX, p('pby')], [my.midX, p('pty')]] },
          { cmd: 'line', params: [[p('-nar2'), p('pty')], [p('+nar2'), p('pty')]] },
        ]);
        break;
      case 'curv':
        my.drawPath([
          { cmd: 'arc', params: [my.midX, p('pby'), p('nar2'), Math.PI, 2 * Math.PI] },
          { cmd: 'line', params: [[my.midX, p('pby') - p('nar2')], [my.midX, p('pty')]] },
          { cmd: 'arc', params: [my.midX, p('pty') + p('nar2'), p('nar2'), Math.PI, 2 * Math.PI] }
        ]);
        break;
      case 'turn':
        my.drawPath([
          { cmd: 'line-close', params: [
            [p('-nar2'), p('pby')],
            [my.midX, p('pby') - p('nar2')],
            [p('+nar2'), p('pby')],
            [p('+nar2'), p('pty')],
            [my.midX, p('pty') + p('nar2')],
            [p('-nar2'), p('pty')]
          ] }
        ]);
        break;
      case 'hturn':
      case 'rlturn':
      case 'lrturn':
        my.drawPath([
          { cmd: 'line-close', params: [
            [p('-nar2'), p('pby')],
            [p('+nar2'), p('pby') - p('nar')],
            [p('+nar2'), p('pty')],
            [p('-nar2'), p('pty') + p('nar')]
          ] },
          { cmd: 'line', params: [
            [my.midX, p('pby') - p('nar2')],
            [p('+nar2'), p('pby')],
            [p('+nar2'), p('pby') - p('nar')]
          ]},
          { cmd: 'line', params: [
            [my.midX, p('pty') + p('nar2')],
            [p('-nar2'), p('pty')],
            [p('-nar2'), p('pty') + p('nar')]
          ]}
        ]);
        break;
      case 'rhturn':
      case 'rturn':
        my.drawPath([
          { cmd: 'line-close', params: [
            [p('-nar2'), p('pby')],
            [p('+nar2'), p('pby') - p('nar')],
            [p('+nar2'), p('pty')],
            [p('-nar2'), p('pty') + p('nar')]
          ] }
        ]);
        break;
      case 'lhturn':
      case 'lturn':
        my.drawPath([
          { cmd: 'line-close', params: [
            [p('+nar2'), p('pby')],
            [p('-nar2'), p('pby') - p('nar')],
            [p('-nar2'), p('pty')],
            [p('+nar2'), p('pty') + p('nar')]
          ] }
        ]);
        break;
      case 'bala':
        my.drawPath([
          { cmd: 'line-close', params: [
            [p('-nar2'), p('pby') - 2 * my.defs.weightCenterRadius - my.defs.symbolPartPadding],
            [p('-nar2'), p('pty')],
            [p('+nar2'), p('pty')],
            [p('+nar2'), p('pby') - 2 * my.defs.weightCenterRadius - my.defs.symbolPartPadding]
          ] },
          { cmd: 'circle-weight', params: [my.midX, p('pby') - my.defs.weightCenterRadius] }
        ]);
        break;
      case 'fall':
        var falDirectionStartY = p('pby') - 2 * my.defs.weightCenterRadius - my.defs.symbolPartPadding;
        var falDirectionHeight = falDirectionStartY - p('pty');
        my.drawPath([
          { cmd: 'line-close', params: [
            [p('-nar2'), p('pby') - 2 * my.defs.weightCenterRadius - my.defs.symbolPartPadding],
            [p('-nar2'), p('pty')],
            [p('+nar2'), p('pty')],
            [p('+nar2'), p('pby') - 2 * my.defs.weightCenterRadius - my.defs.symbolPartPadding]
          ] },
          { cmd: 'circle-weight', params: [my.midX, p('pby') - my.defs.weightCenterRadius] },
          { cmd: 'line', params: [
            [my.midX - p('nar'), falDirectionStartY - falDirectionHeight / 4],
            [my.midX + p('nar'), p('pty') + falDirectionHeight / 4]
          ]}
        ]);
        break;
      case 'air':
        var airLaunchLandLength = (p('pby') - p('pty')) / 3;
        my.drawPath([
          { cmd: 'line', params: [[my.midX, p('pby')], [my.midX, p('pby') - airLaunchLandLength]] },
          { cmd: 'line', params: [[my.midX, p('pty') + airLaunchLandLength], [my.midX, p('pty')]] }
        ]);
        my.context.beginPath();
        my.context.moveTo(my.midX - my.defs.termPadding, p('pby') - airLaunchLandLength);
        my.context.quadraticCurveTo(my.midX - p('nar') * 0.8, p('cdy'), my.midX - my.defs.termPadding, p('pty') + airLaunchLandLength);
        my.context.moveTo(my.midX + my.defs.termPadding, p('pby') - airLaunchLandLength);
        my.context.quadraticCurveTo(my.midX + p('nar') * 0.8, p('cdy'), my.midX + my.defs.termPadding, p('pty') + airLaunchLandLength);
        my.context.stroke();
        break;
      case 'breath':
        my.drawBodyEight();
        my.drawContinuation();
        my.drawPath([
          { cmd: 'circle', params: [my.midX, p('cuy'), my.defs.unitSize / 7] }
        ]);
        break;
      case 'coredist':
        my.drawBodyEight();
        my.drawContinuation();
        my.drawPath([
          { cmd: 'line', params: [[p('plx') + my.defs.termPadding, p('pby') - my.defs.termPadding], [p('prx') - my.defs.termPadding, p('puty') + my.defs.termPadding]] },
          { cmd: 'line', params: [[p('plx') + my.defs.termPadding, p('puty') + my.defs.termPadding], [p('prx') - my.defs.termPadding, p('pby') - my.defs.termPadding]] },
          { cmd: 'line', params: [[my.midX, p('pby')], [my.midX, p('puty')]] },
          { cmd: 'circle-filled', params: [my.midX, p('cuy'), my.defs.unitSize / 9] }
        ]);
        break;
      case 'headtail':
        my.drawBodyEight();
        my.drawContinuation();
        my.drawPath([
          { cmd: 'line', params: [[my.midX, p('pby')], [my.midX, p('pby') - my.defs.termPadding]] },
          { cmd: 'line', params: [[my.midX, p('puty')], [my.midX, p('puty') + my.defs.termPadding]] }
        ]);
        break;
      case 'uplo':
        my.drawBodyEight();
        my.drawContinuation();
        my.drawPath([
          { cmd: 'line', params: [[p('plx') + my.defs.termPadding, p('cuy')], [p('prx') - my.defs.termPadding, p('cuy')]] }
        ]);
        break;
      case 'bodyhalf':
        my.drawBodyEight();
        my.drawContinuation();
        my.drawPath([
          { cmd: 'line', params: [[my.midX, p('pby')], [my.midX, p('puty')]] }
        ]);
        break;
      case 'crosslat':
        my.drawBodyEight();
        my.drawContinuation();
        my.drawPath([
          { cmd: 'line', params: [[p('plx') + my.defs.termPadding, p('pby') - my.defs.termPadding], [p('prx') - my.defs.termPadding, p('puty') + my.defs.termPadding]] },
          { cmd: 'line', params: [[p('plx') + my.defs.termPadding, p('puty') + my.defs.termPadding], [p('prx') - my.defs.termPadding, p('pby') - my.defs.termPadding]] }
        ]);
        break;
      case 'effort':
        my.drawEfforts(my.termParts);
        break;
      default:
        break;
    }
    // Restore context scale factor
    // TODO: Refactor this to finishCanvasContext
    my.context.scale(1.0 / my.defs.devicePixelRatio, 1.0 / my.defs.devicePixelRatio);
  }; // drawTerm

  // Position helpers
  // NOTE: Origin at lower left

  my.gridX = function(x) {
    var gridUnit = (p('prx') - p('plx')) / 7;
    return p('plx') + x * gridUnit;
  };
  my.gridY = function(y) {
    var gridUnit = (p('pby') - p('puty')) / 7;
    return p('pby') - y * gridUnit;
  };

  // Draw helpers

  my.drawPath = function(pathCommands) {
    $.each(pathCommands, function(i, pathCommand) {
      var params = pathCommand.params;
      var startPoint;
      switch (pathCommand.cmd) {
        case 'line':
          if (params.length > 1) {
            my.context.beginPath();
            startPoint = params.shift();
            my.context.moveTo(startPoint[0], startPoint[1]);
            $.each(params, function(i, point) {
              my.context.lineTo(point[0], point[1]);
            });
            my.context.stroke();
          }
          break;
        case 'line-close':
          if (params.length > 1) {
            my.context.beginPath();
            startPoint = params.shift();
            my.context.moveTo(startPoint[0], startPoint[1]);
            $.each(params, function(i, point) {
              my.context.lineTo(point[0], point[1]);
            });
            my.context.closePath();
            my.context.stroke();
          }
          break;
        case 'line-7x7':
          if (params.length > 1) {
            my.context.beginPath();
            startPoint = params.shift();
            my.context.moveTo(my.gridX(startPoint[0]), my.gridY(startPoint[1]));
            $.each(params, function(i, point) {
              my.context.lineTo(my.gridX(point[0]), my.gridY(point[1]));
            });
            my.context.stroke();
          }
          break;
        case 'circle':
          my.context.beginPath();
          my.context.arc(params[0], params[1], params[2], 0, 2 * Math.PI);
          my.context.stroke();
          break;
        case 'circle-filled':
          my.context.beginPath();
          my.context.arc(params[0], params[1], params[2], 0, 2 * Math.PI);
          my.context.stroke();
          my.context.fillStyle = 'black';
          my.context.fill();
          break;
        case 'circle-hold':
          my.context.beginPath();
          my.context.arc(params[0], params[1], my.defs.holdCircleRadius, 0, 2 * Math.PI);
          my.context.stroke();
          break;
        case 'circle-weight':
          my.context.beginPath();
          my.context.arc(params[0], params[1], my.defs.weightCenterRadius, 0, 2 * Math.PI);
          my.context.stroke();
          my.context.fillStyle = 'black';
          my.context.fill();
          break;
        case 'arc':
          my.context.beginPath();
          my.context.arc(params[0], params[1], params[2], params[3], params[4]);
          my.context.stroke();
          break;
        case 'eight':
          var eightCenterX = params[0];
          var eightCenterY = params[1];
          var eightWidth = params[2];
          var eightHeight = params[3];
          my.context.beginPath();
          my.context.moveTo(eightCenterX, eightCenterY - eightHeight / 2);
          my.context.bezierCurveTo(eightCenterX - eightWidth / 2, eightCenterY - eightHeight / 2,
                                eightCenterX - eightWidth / 2, eightCenterY - eightWidth / 2,
                                eightCenterX, eightCenterY);
          my.context.bezierCurveTo(eightCenterX + eightWidth / 2, eightCenterY + eightWidth / 2,
                                eightCenterX + eightWidth / 2, eightCenterY + eightHeight / 2,
                                eightCenterX, eightCenterY + eightHeight / 2);
          my.context.bezierCurveTo(eightCenterX - eightWidth / 2, eightCenterY + eightHeight / 2,
                                eightCenterX - eightWidth / 2, eightCenterY + eightWidth / 2,
                                eightCenterX, eightCenterY);
          my.context.bezierCurveTo(eightCenterX + eightWidth / 2, eightCenterY - eightWidth / 2,
                                eightCenterX + eightWidth / 2, eightCenterY - eightHeight / 2,
                                eightCenterX, eightCenterY - eightHeight / 2);
          my.context.stroke();
          break;
        default:
          break;
      }
    });
  }; // drawPath

  // Continuation symbol that can be attached to any non-stretchable term
  my.drawContinuation = function(continuationStartY, force) {
    if (continuationStartY === undefined) {
      continuationStartY = my.startY - my.defs.unitSize;
    }
    if (my.duration > 1 || force === true) {
      my.drawPath([
        { cmd: 'arc', params: [p('-nar2'), continuationStartY, my.defs.continuationBowRadius, Math.PI / 2, Math.PI * 5 / 3] },
        { cmd: 'line', params: [[my.midX, continuationStartY], [my.midX, p('pty')]] }
      ]);
    }
  };

  my.drawBodyEight = function() {
    my.drawPath([
      { cmd: 'eight', params: [my.midX, p('cuy'), my.defs.unitSize / 3, my.defs.unitSize - 4 * my.defs.termPadding] }
    ]);
  };

  my.drawEfforts = function(effortParts) {
    // Determine grid lines and also assess max dimensions needed
    var gridLines = [
      [[0, 0], [1.5, 1.5]]
    ];
    var leftMax = 0;
    var rightMax = 1.5;
    var topMax = 1.5;
    var bottomMax = 0;
    $.each(effortParts, function(i, effortPart) {
      switch (effortPart) {
        case 'flo':
          gridLines.push([[-3.5, 0], [3.5, 0]]);
          leftMax = leftMax < -3.5 ? leftMax : -3.5;
          rightMax = rightMax > 3.5 ? rightMax : 3.5;
          break;
        case 'fre':
          gridLines.push([[-3.5, 0], [0, 0]]);
          leftMax = leftMax < -3.5 ? leftMax : -3.5;
          break;
        case 'bou':
          gridLines.push([[0, 0], [3.5, 0]]);
          rightMax = rightMax > 3.5 ? rightMax : 3.5;
          break;
        case 'wei':
          gridLines.push([[0, -3.5], [0, 3.5]]);
          topMax = topMax > 3.5 ? topMax : 3.5;
          bottomMax = bottomMax < -3.5 ? bottomMax : -3.5;
          break;
        case 'lig':
          gridLines.push([[0, 0], [0, 3.5]]);
          topMax = topMax > 3.5 ? topMax : 3.5;
          break;
        case 'str':
          gridLines.push([[0, -3.5], [0, 0]]);
          bottomMax = bottomMax < -3.5 ? bottomMax : -3.5;
          break;
        case 'tim':
          gridLines.push([[-2.5, -1.5], [-1, -1.5]]);
          gridLines.push([[1, -1.5], [2.5, -1.5]]);
          leftMax = leftMax < -2.5 ? leftMax : -2.5;
          rightMax = rightMax > 2.5 ? rightMax : 2.5;
          bottomMax = bottomMax < -1 ? bottomMax : -1;
          break;
        case 'sus':
          gridLines.push([[-2.5, -1.5], [-1, -1.5]]);
          leftMax = leftMax < -2.5 ? leftMax : -2.5;
          bottomMax = bottomMax < -1 ? bottomMax : -1;
          break;
        case 'qui':
          gridLines.push([[1, -1.5], [2.5, -1.5]]);
          rightMax = rightMax > 2.5 ? rightMax : 2.5;
          bottomMax = bottomMax < -1 ? bottomMax : -1;
          break;
        case 'spa':
          gridLines.push([[1.5, 1.5], [1.5, 4]]);
          gridLines.push([[1.5, 1.5], [4, 1.5]]);
          topMax = topMax > 4 ? topMax : 4;
          rightMax = rightMax > 4 ? rightMax : 4;
          break;
        case 'ind':
          gridLines.push([[1.5, 1.5], [1.5, 4]]);
          topMax = topMax > 4 ? topMax : 4;
          break;
        case 'dir':
          gridLines.push([[1.5, 1.5], [4, 1.5]]);
          rightMax = rightMax > 4 ? rightMax : 4;
          break;
      }
    });

    var gridUnit = (my.defs.unitSize - 2 * my.defs.termPadding) / 7;
    var maxHeight = (topMax - bottomMax) * gridUnit;
    var maxWidth = (rightMax - leftMax) * gridUnit;
    var leftEdge = my.midX - maxWidth / 2;
    var effortOriginX = leftEdge - leftMax * gridUnit;
    var effortOriginY = p('pby') + bottomMax * gridUnit;
    $.each(gridLines, function(i, gridLine) {
      var startPoint = gridLine[0];
      var endPoint = gridLine[1];
      my.drawPath([
        { cmd: 'line', params: [[effortOriginX + startPoint[0] * gridUnit, effortOriginY - startPoint[1] * gridUnit],
                                [effortOriginX + endPoint[0] * gridUnit, effortOriginY - endPoint[1] * gridUnit]] }
      ]);
    });
    // Force continuation bow if symbol too short
    var force = (topMax - bottomMax < 5);
    my.drawContinuation(p('pby') - maxHeight - my.defs.termPadding, force);
  };

  // Public API
  myPublic.drawTerm = my.drawTerm;

  return myPublic;

})(MotifSpeedWriter || {}, jQuery);
