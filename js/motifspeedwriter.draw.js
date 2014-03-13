var MotifSpeedWriter = (function(my, $) {

  my.drawTerm = function(termCode, duration, midX, startY, defs) {
    var canvas = $('#motif-canvas')[0];
    var context = canvas.getContext('2d');
    context.scale(defs.devicePixelRatio, defs.devicePixelRatio);
    context.lineWidth = defs.mainMotifThickness;
    context.strokeStyle = 'black';

    var p = function(code) {
      switch (code) {
        case 'pby':
          return startY - defs.termPadding;
        case 'pty':
          return startY - duration * defs.unitSize + defs.termPadding;
        case 'puty':
          return startY - defs.unitSize + defs.termPadding;
        case '-nar2':
          return midX - defs.unitSize / 5;
        case '+nar2':
          return midX + defs.unitSize / 5;
        case 'nar':
          return defs.unitSize / 2.5;
        case 'nar2':
          return defs.unitSize / 5;
        case 'plx':
          return midX - defs.unitSize / 2 + defs.termPadding;
        case 'prx':
          return midX + defs.unitSize / 2 - defs.termPadding;
        case 'cdy':
          return startY - duration * defs.unitSize / 2;
        case 'cuy':
          return startY - defs.unitSize / 2;
        default:
          return defs.termPadding;
      }
    };

    // Origin at lower left
    var gridX = function(x) {
      var gridUnit = (p('prx') - p('plx')) / 7;
      return p('plx') + x * gridUnit;
    };
    var gridY = function(y) {
      var gridUnit = (p('pby') - p('puty')) / 7;
      return p('pby') - y * gridUnit;
    };

    var drawPath = function(pathCommands) {
      $.each(pathCommands, function(i, pathCommand) {
        var params = pathCommand.params;
        var startPoint;
        switch (pathCommand.cmd) {
          case 'line':
            if (params.length > 1) {
              context.beginPath();
              startPoint = params.shift();
              context.moveTo(startPoint[0], startPoint[1]);
              $.each(params, function(i, point) {
                context.lineTo(point[0], point[1]);
              });
              context.stroke();
            };
            break;
          case 'line-close':
            if (params.length > 1) {
              context.beginPath();
              startPoint = params.shift();
              context.moveTo(startPoint[0], startPoint[1]);
              $.each(params, function(i, point) {
                context.lineTo(point[0], point[1]);
              });
              context.closePath();
              context.stroke();
            };
            break;
          case 'line-7x7':
            if (params.length > 1) {
              context.beginPath();
              startPoint = params.shift();
              context.moveTo(gridX(startPoint[0]), gridY(startPoint[1]));
              $.each(params, function(i, point) {
                context.lineTo(gridX(point[0]), gridY(point[1]));
              });
              context.stroke();
            };
            break;
          case 'circle':
            context.beginPath();
            context.arc(params[0], params[1], params[2], 0, 2 * Math.PI);
            context.stroke();
            break;
          case 'circle-filled':
            context.beginPath();
            context.arc(params[0], params[1], params[2], 0, 2 * Math.PI);
            context.stroke();
            context.fillStyle = 'black';
            context.fill();
            break;
          case 'circle-hold':
            context.beginPath();
            context.arc(params[0], params[1], defs.holdCircleRadius, 0, 2 * Math.PI);
            context.stroke();
            break;
          case 'circle-weight':
            context.beginPath();
            context.arc(params[0], params[1], defs.weightCenterRadius, 0, 2 * Math.PI);
            context.stroke();
            context.fillStyle = 'black';
            context.fill();
            break;
          case 'arc':
            context.beginPath();
            context.arc(params[0], params[1], params[2], params[3], params[4]);
            context.stroke();
            break;
          case 'eight':
            var eightCenterX = params[0];
            var eightCenterY = params[1];
            var eightWidth = params[2];
            var eightHeight = params[3];
            var eightLeft
            context.beginPath();
            context.moveTo(eightCenterX, eightCenterY - eightHeight / 2);
            context.bezierCurveTo(eightCenterX - eightWidth / 2, eightCenterY - eightHeight / 2,
                                  eightCenterX - eightWidth / 2, eightCenterY - eightWidth / 2,
                                  eightCenterX, eightCenterY);
            context.bezierCurveTo(eightCenterX + eightWidth / 2, eightCenterY + eightWidth / 2,
                                  eightCenterX + eightWidth / 2, eightCenterY + eightHeight / 2,
                                  eightCenterX, eightCenterY + eightHeight / 2);
            context.bezierCurveTo(eightCenterX - eightWidth / 2, eightCenterY + eightHeight / 2,
                                  eightCenterX - eightWidth / 2, eightCenterY + eightWidth / 2,
                                  eightCenterX, eightCenterY);
            context.bezierCurveTo(eightCenterX + eightWidth / 2, eightCenterY - eightWidth / 2,
                                  eightCenterX + eightWidth / 2, eightCenterY - eightHeight / 2,
                                  eightCenterX, eightCenterY - eightHeight / 2);
            context.stroke();
            break;
          default:
            break;
        }
      });
    };

    var drawContinuation = function(continuationStartY, force) {
      if (continuationStartY === undefined) {
        continuationStartY = startY - defs.unitSize;
      };
      if (duration > 1 || force === true) {
        drawPath([
          { cmd: 'arc', params: [p('-nar2'), continuationStartY, defs.continuationBowRadius, Math.PI / 2, Math.PI * 5 / 3] },
          { cmd: 'line', params: [[midX, continuationStartY], [midX, p('pty')]] }
        ]);
      }
    };

    var drawBodyEight = function() {
        drawPath([
          { cmd: 'eight', params: [midX, p('cuy'), defs.unitSize / 3, defs.unitSize - 4 * defs.termPadding] }
        ]);      
    };

    var drawEfforts = function(effortParts) {

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
          case 'wei':
            gridLines.push([[0, -3.5], [0, 3.5]]);
            topMax = topMax > 3.5 ? topMax : 3.5;
            bottomMax = bottomMax < -3.5 ? bottomMax : -3.5;
            break;
          case 'tim':
            gridLines.push([[-2.5, -1.5], [-1, -1.5]]);
            gridLines.push([[1, -1.5], [2.5, -1.5]]);
            leftMax = leftMax < -2.5 ? leftMax : -2.5;
            rightMax = rightMax > 2.5 ? rightMax : 2.5;
            bottomMax = bottomMax < -1 ? bottomMax : -1;
            break;
          case 'spa':
            gridLines.push([[1.5, 1.5], [1.5, 4]]);
            gridLines.push([[1.5, 1.5], [4, 1.5]]);
            topMax = topMax > 4 ? topMax : 4;
            rightMax = rightMax > 4 ? rightMax : 4;
            break;
        }
      });

      var gridUnit = (defs.unitSize - 2 * defs.termPadding) / 7;
      var maxHeight = (topMax - bottomMax) * gridUnit;
      var maxWidth = (rightMax - leftMax) * gridUnit;
      var leftEdge = midX - maxWidth / 2;
      var effortOriginX = leftEdge - leftMax * gridUnit;
      var effortOriginY = p('pby') + bottomMax * gridUnit;
      $.each(gridLines, function(i, gridLine) {
        var startPoint = gridLine[0];
        var endPoint = gridLine[1];
        drawPath([
          { cmd: 'line', params: [[effortOriginX + startPoint[0] * gridUnit, effortOriginY - startPoint[1] * gridUnit],
                                  [effortOriginX + endPoint[0] * gridUnit, effortOriginY - endPoint[1] * gridUnit]] }
        ]);
      });
      // Continuation
      var force = (topMax - bottomMax < 6) ? true : false;
      drawContinuation(p('pby') - maxHeight - defs.termPadding, force);

    };

    // Parse combo terms
    var termParams;
    if (termCode.indexOf('+') > -1) {
      termParams = termCode.split('+');
      termCode = termParams[0];
    } else {
      termParams = [termCode];
    }
    if ($.inArray(termCode, defs.efforts) > -1) {
      termCode = 'effort';
    };

    switch (termCode) {
      case 'box':
        drawPath([
          { cmd: 'line-close', params: [
            [p('plx'), p('pby')],
            [p('plx'), p('pty')],
            [p('prx'), p('pty')],
            [p('prx'), p('pby')]
          ] }
        ]);
        break;
      case 'act':
        drawPath([
          { cmd: 'line', params: [[midX, p('pby')], [midX, p('pty')]] }
        ]);
        break;
      case 'ges':
        drawPath([
          { cmd: 'line', params: [[midX, p('pby')], [midX, p('pty')]] },
          { cmd: 'circle-hold', params: [midX, p('pby') - defs.unitSize / 3.5] }
        ]);
        break;
      case 'hold':
      case 'hol': // DEPRECATE 2/23
        drawPath([
          { cmd: 'circle-hold', params: [midX, p('pby') - defs.holdCircleRadius] }
        ]);
        break;
      case 'rel':
        drawPath([
          { cmd: 'arc', params: [midX - 2, p('pty') + defs.holdCircleRadius, defs.holdCircleRadius, Math.PI, 2 * Math.PI] },
          { cmd: 'arc', params: [midX + 1, p('pty') + defs.holdCircleRadius, defs.holdCircleRadius, 0, Math.PI] }
        ]);
        break;
      case 'holdrel':
        drawPath([
          { cmd: 'circle-hold', params: [midX, p('pby') - defs.holdCircleRadius] },
          { cmd: 'arc', params: [midX - 2, p('pty') + defs.holdCircleRadius, defs.holdCircleRadius, Math.PI, 2 * Math.PI] },
          { cmd: 'arc', params: [midX + 1, p('pty') + defs.holdCircleRadius, defs.holdCircleRadius, 0, Math.PI] }
        ]);
        break;
      case 'path':
      case 'ap': // DEPRECATE 2/23
        context.beginPath();
        var quadraticCurveControlHeight = defs.unitSize / 10;
        context.moveTo(p('-nar2'), p('pby') + quadraticCurveControlHeight / 2);
        context.quadraticCurveTo(midX - defs.unitSize / 8, p('pby') - quadraticCurveControlHeight, midX, p('pby'));
        context.quadraticCurveTo(midX + defs.unitSize / 8, p('pby') + quadraticCurveControlHeight, p('+nar2'), p('pby') - quadraticCurveControlHeight / 2);
        context.stroke();
        drawPath([
          { cmd: 'line', params: [[midX, p('pby')], [midX, p('pty')]] }
        ]);
        context.beginPath();
        context.moveTo(midX - defs.unitSize / 4, p('pty') + quadraticCurveControlHeight / 2);
        context.quadraticCurveTo(midX - defs.unitSize / 8, p('pty') - quadraticCurveControlHeight, midX, p('pty'));
        context.quadraticCurveTo(midX + defs.unitSize / 8, p('pty') + quadraticCurveControlHeight, midX + defs.unitSize / 4, p('pty') - quadraticCurveControlHeight / 2);
        context.stroke();
        break;
      case 'stra':
      case 'sp': // DEPRECATE 2/23
        drawPath([
          { cmd: 'line', params: [[p('-nar2'), p('pby')], [p('+nar2'), p('pby')]] },
          { cmd: 'line', params: [[midX, p('pby')], [midX, p('pty')]] },
          { cmd: 'line', params: [[p('-nar2'), p('pty')], [p('+nar2'), p('pty')]] },
        ]);
        break;
      case 'curv':
      case 'cp': // DEPRECATE 2/23
        drawPath([
          { cmd: 'arc', params: [midX, p('pby'), p('nar2'), Math.PI, 2 * Math.PI] },
          { cmd: 'line', params: [[midX, p('pby') - p('nar2')], [midX, p('pty')]] },
          { cmd: 'arc', params: [midX, p('pty') + p('nar2'), p('nar2'), Math.PI, 2 * Math.PI] }
        ]);
        break;  
      case 'turn':
      case 'at': // DEPRECATE 2/23
        drawPath([
          { cmd: 'line-close', params: [
            [p('-nar2'), p('pby')],
            [midX, p('pby') - p('nar2')],
            [p('+nar2'), p('pby')],
            [p('+nar2'), p('pty')],
            [midX, p('pty') + p('nar2')],
            [p('-nar2'), p('pty')]
          ] }
        ]);
        break;
      case 'hturn':
      case 'rlturn':
      case 'lrturn':
      case 'avt': // DEPRECATE 2/23
        drawPath([
          { cmd: 'line-close', params: [
            [p('-nar2'), p('pby')],
            [p('+nar2'), p('pby') - p('nar')],
            [p('+nar2'), p('pty')],
            [p('-nar2'), p('pty') + p('nar')]
          ] },
          { cmd: 'line', params: [
            [midX, p('pby') - p('nar2')],
            [p('+nar2'), p('pby')],
            [p('+nar2'), p('pby') - p('nar')]
          ]},
          { cmd: 'line', params: [
            [midX, p('pty') + p('nar2')],
            [p('-nar2'), p('pty')],
            [p('-nar2'), p('pty') + p('nar')]
          ]}
        ]);
        break;
      case 'rhturn':
      case 'rturn':
      case 'rt': // DEPRECATE 2/23
        drawPath([
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
      case 'lt': // DEPRECATE 2/23
        drawPath([
          { cmd: 'line-close', params: [
            [p('+nar2'), p('pby')],
            [p('-nar2'), p('pby') - p('nar')],
            [p('-nar2'), p('pty')],
            [p('+nar2'), p('pty') + p('nar')]
          ] }
        ]);
        break;
      case 'bala':
      case 'bal': // DEPRECATE 2/23
        drawPath([
          { cmd: 'line-close', params: [
            [p('-nar2'), p('pby') - 2 * defs.weightCenterRadius - defs.symbolPartPadding],
            [p('-nar2'), p('pty')],
            [p('+nar2'), p('pty')],
            [p('+nar2'), p('pby') - 2 * defs.weightCenterRadius - defs.symbolPartPadding]
          ] },
          { cmd: 'circle-weight', params: [midX, p('pby') - defs.weightCenterRadius] }
        ]);
        break;
      case 'fall':
      case 'fal': // DEPRECATE 2/23
        var falDirectionStartY = p('pby') - 2 * defs.weightCenterRadius - defs.symbolPartPadding;
        var falDirectionHeight = falDirectionStartY - p('pty');
        drawPath([
          { cmd: 'line-close', params: [
            [p('-nar2'), p('pby') - 2 * defs.weightCenterRadius - defs.symbolPartPadding],
            [p('-nar2'), p('pty')],
            [p('+nar2'), p('pty')],
            [p('+nar2'), p('pby') - 2 * defs.weightCenterRadius - defs.symbolPartPadding]
          ] },
          { cmd: 'circle-weight', params: [midX, p('pby') - defs.weightCenterRadius] },
          { cmd: 'line', params: [
            [midX - p('nar'), falDirectionStartY - falDirectionHeight / 4],
            [midX + p('nar'), p('pty') + falDirectionHeight / 4]
          ]}
        ]);
        break;
      case 'air':
        var airLaunchLandLength = (p('pby') - p('pty')) / 3;
        drawPath([
          { cmd: 'line', params: [[midX, p('pby')], [midX, p('pby') - airLaunchLandLength]] },
          { cmd: 'line', params: [[midX, p('pty') + airLaunchLandLength], [midX, p('pty')]] }
        ]);
        context.beginPath();
        context.moveTo(midX - defs.termPadding, p('pby') - airLaunchLandLength);
        context.quadraticCurveTo(midX - p('nar') * .8, p('cdy'), midX - defs.termPadding, p('pty') + airLaunchLandLength);
        context.moveTo(midX + defs.termPadding, p('pby') - airLaunchLandLength);
        context.quadraticCurveTo(midX + p('nar') * .8, p('cdy'), midX + defs.termPadding, p('pty') + airLaunchLandLength);
        context.stroke();
        break;
      case 'breath':
        drawBodyEight();
        drawContinuation();
        drawPath([
          { cmd: 'circle', params: [midX, p('cuy'), defs.unitSize / 7] }
        ]);
        break;
      case 'coredist':
        drawBodyEight();
        drawContinuation();
        drawPath([
          { cmd: 'line', params: [[p('plx') + defs.termPadding, p('pby') - defs.termPadding], [p('prx') - defs.termPadding, p('puty') + defs.termPadding]] },
          { cmd: 'line', params: [[p('plx') + defs.termPadding, p('puty') + defs.termPadding], [p('prx') - defs.termPadding, p('pby') - defs.termPadding]] },
          { cmd: 'line', params: [[midX, p('pby')], [midX, p('puty')]] },
          { cmd: 'circle-filled', params: [midX, p('cuy'), defs.unitSize / 9] }
        ]);
        break;
      case 'headtail':
        drawBodyEight();
        drawContinuation();
        drawPath([
          { cmd: 'line', params: [[midX, p('pby')], [midX, p('pby') - defs.termPadding]] },
          { cmd: 'line', params: [[midX, p('puty')], [midX, p('puty') + defs.termPadding]] }
        ]);
        break;
      case 'uplo':
        drawBodyEight();
        drawContinuation();
        drawPath([
          { cmd: 'line', params: [[p('plx') + defs.termPadding, p('cuy')], [p('prx') - defs.termPadding, p('cuy')]] }
        ]);
        break;
      case 'bodyhalf':
        drawBodyEight();
        drawContinuation();
        drawPath([
          { cmd: 'line', params: [[midX, p('pby')], [midX, p('puty')]] }
        ]);
        break;
      case 'crosslat':
        drawBodyEight();
        drawContinuation();
        drawPath([
          { cmd: 'line', params: [[p('plx') + defs.termPadding, p('pby') - defs.termPadding], [p('prx') - defs.termPadding, p('puty') + defs.termPadding]] },
          { cmd: 'line', params: [[p('plx') + defs.termPadding, p('puty') + defs.termPadding], [p('prx') - defs.termPadding, p('pby') - defs.termPadding]] }
        ]);
        break;
      case 'effort':
        drawEfforts(termParams);
        break;
      default:
        break;
    }
    // Restore context scale factor
    context.scale(1.0 / defs.devicePixelRatio, 1.0 / defs.devicePixelRatio);
  }; // drawTerm

  return my;

})(MotifSpeedWriter || {}, jQuery);
