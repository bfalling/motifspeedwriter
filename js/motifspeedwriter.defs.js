var jQuery = jQuery || {};

var MotifSpeedWriter = (function(my, $) {
  'use strict';

  my.defs = {
    devicePixelRatio: window.devicePixelRatio,
    edgePadding: 30,
    unitSize: 28,
    termPadding: 3,
    symbolPartPadding: 4,
    mainMotifThickness: 2,
    efforts: ['eff', 'flo', 'fre', 'bou', 'wei', 'lig', 'str', 'lmp', 'hvy', 'wse', 'lws', 'sws', 'tim', 'sus', 'qui', 'spa', 'ind', 'dir']
  };
  my.defs.staffLineHeight = 3 * my.defs.termPadding;
  my.defs.weightCenterRadius = my.defs.unitSize / 7;
  my.defs.holdCircleRadius = my.defs.unitSize / 9;
  my.defs.continuationBowRadius = my.defs.unitSize / 9;

  return my;

})(MotifSpeedWriter || {}, jQuery);
