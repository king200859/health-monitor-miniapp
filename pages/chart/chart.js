// pages/chart/chart.js
var app = getApp();

// 绘制圆角矩形辅助函数
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

Page({
  data: {
    type: 'waterIntake',
    indicator: null,
    dateRange: 7,
    dateRangeText: '近7天',
    chartData: [],
    patientId: '',
    avgValue: 0,
    maxValue: 0,
    minValue: 0,
    normalCount: 0,
    abnormalCount: 0,
    canvasWidth: 0,
    canvasHeight: 0,
    indicatorTabs: [],
    // 患者自定义范围（用于图表绘制）
    effectiveRange: null,
    // 血压双线数据
    isBloodPressure: false,
    chartData2: [],
    avgValue2: 0,
    effectiveRange2: null,
    canRecord: true
  },

  onLoad: function(options) {
    var type = app.globalData._chartType || options.type || 'waterIntake';
    app.globalData._chartType = null;
    var dateRange = options.dateRange ? parseInt(options.dateRange) : 7;
    var rangeTexts = { 7: '近7天', 14: '近14天', 30: '近30天' };
    var indicators = app.globalData.indicators;
    var tabs = [
      { key: 'waterIntake', name: '饮水', icon: '💧', color: indicators.waterIntake.color },
      { key: 'urineOutput', name: '尿量', icon: '🚽', color: indicators.urineOutput.color },
      { key: 'weight', name: '体重', icon: '⚖️', color: indicators.weight.color },
      { key: 'bloodPressureSystolic', name: '血压', icon: '❤️', color: indicators.bloodPressureSystolic.color },
      { key: 'heartRate', name: '心率', icon: '💓', color: indicators.heartRate.color },
      { key: 'temperature', name: '体温', icon: '🌡️', color: indicators.temperature.color }
    ];

    var patientId = '';
    var cp = app.getCurrentPatient();
    if (cp) patientId = cp.id;

    this.setData({
      type: type,
      indicator: indicators[type],
      indicatorTabs: tabs,
      patientId: patientId,
      dateRange: dateRange,
      dateRangeText: rangeTexts[dateRange] || '近7天'
    });

    var isBP = type === 'bloodPressureSystolic';
    this.setData({
      isBloodPressure: isBP,
      indicator: isBP ? { name: '血压', unit: 'mmHg', color: indicators.bloodPressureSystolic.color, icon: '❤️' } : indicators[type]
    });
    wx.setNavigationBarTitle({ title: (isBP ? '血压' : (indicators[type] ? indicators[type].name : '')) + '趋势' });
  },

  onShow: function() {
    // 登录检查
    if (!app.getCurrentRole()) {
      wx.reLaunch({ url: '/pages/login/login' });
      return;
    }
    var cp = app.getCurrentPatient();
    var patientId = cp ? cp.id : '';
    this.setData({ canRecord: app.hasPermission('canRecord') });

    // 处理从外部传入的指标类型
    if (app.globalData._chartType) {
      var type = app.globalData._chartType;
      app.globalData._chartType = null;
      var indicators = app.globalData.indicators;
      var isBP = type === 'bloodPressureSystolic';
      this.setData({
        type: type,
        isBloodPressure: isBP,
        indicator: isBP ? { name: '血压', unit: 'mmHg', color: indicators.bloodPressureSystolic.color, icon: '❤️' } : indicators[type],
        dateRange: 7,
        dateRangeText: '近7天'
      });
      wx.setNavigationBarTitle({ title: (isBP ? '血压' : indicators[type].name) + '趋势' });
    }

    this.setData({ patientId: patientId, patientInfo: cp ? {
      name: cp.name, bedNo: cp.bedNo, age: cp.age, gender: cp.gender, department: cp.department
    } : null });

    if (patientId) {
      this.loadChartData();
    }
  },

  switchIndicator: function(e) {
    var type = e.currentTarget.dataset.type;
    var indicators = app.globalData.indicators;
    var isBP = type === 'bloodPressureSystolic';
    this.setData({
      type: type,
      isBloodPressure: isBP,
      indicator: isBP ? { name: '血压', unit: 'mmHg', color: indicators.bloodPressureSystolic.color, icon: '❤️' } : indicators[type]
    });
    wx.setNavigationBarTitle({ title: (isBP ? '血压' : indicators[type].name) + '趋势' });
    if (this.data.patientId) {
      this.loadChartData();
    }
  },

  switchDateRange: function(e) {
    var range = parseInt(e.currentTarget.dataset.range);
    var rangeTexts = { 7: '近7天', 14: '近14天', 30: '近30天' };
    this.setData({ dateRange: range, dateRangeText: rangeTexts[range] });
    if (this.data.patientId) {
      this.loadChartData();
    }
  },

  loadChartData: function() {
    var that = this;
    var patientId = this.data.patientId;
    var type = this.data.type;
    var dateRange = this.data.dateRange;
    var today = new Date();
    var isBP = this.data.isBloodPressure;
    var chartData = [];
    var chartData2 = [];
    var totalValue = 0;
    var totalValue2 = 0;
    var maxValue = -Infinity;
    var minValue = Infinity;
    var normalCount = 0;
    var abnormalCount = 0;
    var validCount = 0;

    var effectiveRange = app.getIndicatorRange(patientId, type);
    var effectiveRange2 = isBP ? app.getIndicatorRange(patientId, 'bloodPressureDiastolic') : null;

    for (var i = dateRange - 1; i >= 0; i--) {
      var d = new Date(today);
      d.setDate(d.getDate() - i);
      var mm = d.getMonth() + 1 < 10 ? '0' + (d.getMonth() + 1) : '' + (d.getMonth() + 1);
      var dd = d.getDate() < 10 ? '0' + d.getDate() : '' + d.getDate();
      var dateStr = d.getFullYear() + '-' + mm + '-' + dd;
      var summary = app.getDaySummary(patientId, dateStr);
      var value = summary[type];
      var value2 = isBP ? summary.bloodPressureDiastolic : null;

      var label = (d.getMonth() + 1) + '/' + d.getDate();
      var status = 'empty';

      if (value !== undefined && value !== null) {
        validCount++;
        totalValue += value;
        if (value > maxValue) maxValue = value;
        if (value < minValue) minValue = value;

        if (isBP && value2 !== undefined && value2 !== null) {
          var sysNormal = value >= effectiveRange.min && value <= effectiveRange.max;
          var diasNormal = value2 >= effectiveRange2.min && value2 <= effectiveRange2.max;
          var isNormal = sysNormal && diasNormal;
          status = isNormal ? 'normal' : 'abnormal';
        } else {
          var isNormal = value >= effectiveRange.min && value <= effectiveRange.max;
          status = isNormal ? 'normal' : 'abnormal';
        }

        if (isNormal) normalCount++;
        else abnormalCount++;
      }

      // 舒张压也需要参与 min/max 计算
      if (isBP && value2 !== undefined && value2 !== null) {
        totalValue2 += value2;
        if (value2 < minValue) minValue = value2;
      }

      chartData.push({
        date: dateStr,
        label: label,
        value: value !== undefined ? (Number.isInteger(value) ? value : parseFloat(value.toFixed(1))) : null,
        status: status
      });

      if (isBP) {
        chartData2.push({
          date: dateStr,
          label: label,
          value: value2 !== undefined ? (Number.isInteger(value2) ? value2 : parseFloat(value2.toFixed(1))) : null,
          status: status
        });
      }
    }

    if (maxValue === -Infinity) maxValue = 0;
    if (minValue === Infinity) minValue = 0;

    var avgValue = validCount > 0 ? (totalValue / validCount) : 0;
    if (!Number.isInteger(avgValue)) avgValue = parseFloat(avgValue.toFixed(1));

    var avgValue2 = 0;
    if (isBP) {
      var diasCount = 0;
      for (var j = 0; j < chartData2.length; j++) {
        if (chartData2[j].value !== null) { totalValue2 += chartData2[j].value; diasCount++; }
      }
      // totalValue2 已在上面累加过，这里用 diasCount 直接算
      diasCount = 0;
      totalValue2 = 0;
      for (var k = 0; k < chartData2.length; k++) {
        if (chartData2[k].value !== null) { totalValue2 += chartData2[k].value; diasCount++; }
      }
      avgValue2 = diasCount > 0 ? (totalValue2 / diasCount) : 0;
      if (!Number.isInteger(avgValue2)) avgValue2 = parseFloat(avgValue2.toFixed(1));
    }

    this.setData({
      chartData: chartData,
      chartData2: chartData2,
      avgValue: avgValue,
      avgValue2: avgValue2,
      maxValue: maxValue,
      minValue: minValue,
      normalCount: normalCount,
      abnormalCount: abnormalCount,
      effectiveRange: effectiveRange,
      effectiveRange2: effectiveRange2
    });

    setTimeout(function() { that.drawChart(); }, 100);
  },

  drawChart: function() {
    var that = this;
    var chartData = this.data.chartData;
    var chartData2 = this.data.chartData2;
    var indicator = this.data.indicator;
    var type = this.data.type;
    var isBP = this.data.isBloodPressure;
    var effectiveRange = this.data.effectiveRange;
    var effectiveRange2 = this.data.effectiveRange2;
    var validData = [];

    for (var i = 0; i < chartData.length; i++) {
      if (chartData[i].value !== null) validData.push(chartData[i]);
    }

    if (validData.length < 2) {
      this.drawEmptyChart();
      return;
    }

    var indicators = app.globalData.indicators;
    var diasColor = isBP ? indicators.bloodPressureDiastolic.color : '';

    var query = wx.createSelectorQuery();
    query.select('#trendChart')
      .fields({ node: true, size: true })
      .exec(function(res) {
        var canvas = res[0].node;
        var ctx = canvas.getContext('2d');
        var dpr = wx.getWindowInfo().pixelRatio || 2;
        var width = res[0].width;
        var height = res[0].height;

        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);
        ctx.clearRect(0, 0, width, height);

        var paddingLeft = 60;
        var paddingRight = 30;
        var paddingTop = 30;
        var paddingBottom = 50;
        var chartWidth = width - paddingLeft - paddingRight;
        var chartHeight = height - paddingTop - paddingBottom;

        var values = [];
        for (var i = 0; i < chartData.length; i++) values.push(chartData[i].value || 0);
        if (isBP) {
          for (var i2 = 0; i2 < chartData2.length; i2++) values.push(chartData2[i2].value || 0);
        }
        var maxVal = Math.max.apply(null, values) * 1.1 || 100;
        var minDataVals = [];
        for (var j = 0; j < validData.length; j++) minDataVals.push(validData[j].value);
        if (isBP) {
          for (var j2 = 0; j2 < chartData2.length; j2++) {
            if (chartData2[j2].value !== null) minDataVals.push(chartData2[j2].value);
          }
        }
        var minVal = Math.min.apply(null, minDataVals) * 0.9 || 0;
        var range = maxVal - minVal || 1;

        // 网格线
        ctx.strokeStyle = '#F0F0F0';
        ctx.lineWidth = 1;
        var gridLines = 5;
        for (var g = 0; g <= gridLines; g++) {
          var y = paddingTop + (chartHeight / gridLines) * g;
          ctx.beginPath();
          ctx.moveTo(paddingLeft, y);
          ctx.lineTo(width - paddingRight, y);
          ctx.stroke();

          var val = maxVal - (range / gridLines) * g;
          ctx.fillStyle = '#BBB';
          ctx.font = '11px sans-serif';
          ctx.textAlign = 'right';
          ctx.fillText(type === 'temperature' ? val.toFixed(1) : String(Math.round(val)), paddingLeft - 8, y + 4);
        }

        // 正常范围区域 + 参考线
        if (effectiveRange) {
          // 收缩压范围
          var normalTopY = paddingTop + chartHeight * (1 - (effectiveRange.max - minVal) / range);
          var normalBottomY = paddingTop + chartHeight * (1 - (effectiveRange.min - minVal) / range);
          normalTopY = Math.max(paddingTop, normalTopY);
          normalBottomY = Math.min(paddingTop + chartHeight, normalBottomY);

          // 舒张压范围
          var diasTopY = 0, diasBottomY = 0;
          if (isBP && effectiveRange2) {
            diasTopY = paddingTop + chartHeight * (1 - (effectiveRange2.max - minVal) / range);
            diasBottomY = paddingTop + chartHeight * (1 - (effectiveRange2.min - minVal) / range);
            diasTopY = Math.max(paddingTop, diasTopY);
            diasBottomY = Math.min(paddingTop + chartHeight, diasBottomY);
          }

          // 收缩压淡色带
          ctx.fillStyle = isBP ? 'rgba(91, 127, 255, 0.06)' : 'rgba(76, 175, 80, 0.06)';
          ctx.fillRect(paddingLeft, normalTopY, chartWidth, normalBottomY - normalTopY);

          // 舒张压淡色带
          if (isBP) {
            ctx.fillStyle = 'rgba(155, 111, 232, 0.06)';
            ctx.fillRect(paddingLeft, diasTopY, chartWidth, diasBottomY - diasTopY);
          }

          // 收缩压虚线
          ctx.setLineDash([8, 4]);
          ctx.strokeStyle = isBP ? 'rgba(91, 127, 255, 0.6)' : 'rgba(76, 175, 80, 0.7)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(paddingLeft, normalTopY);
          ctx.lineTo(width - paddingRight, normalTopY);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(paddingLeft, normalBottomY);
          ctx.lineTo(width - paddingRight, normalBottomY);
          ctx.stroke();

          // 舒张压虚线
          if (isBP && effectiveRange2) {
            ctx.strokeStyle = 'rgba(155, 111, 232, 0.6)';
            ctx.beginPath();
            ctx.moveTo(paddingLeft, diasTopY);
            ctx.lineTo(width - paddingRight, diasTopY);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(paddingLeft, diasBottomY);
            ctx.lineTo(width - paddingRight, diasBottomY);
            ctx.stroke();
          }
          ctx.setLineDash([]);

          // 标签绘制辅助函数
          function drawTag(tagCtx, line1, line2, tagX, tagY, bgColor) {
            tagCtx.font = '9px sans-serif';
            var w1 = tagCtx.measureText(line1).width;
            var w2 = tagCtx.measureText(line2).width;
            var tW = Math.max(w1, w2) + 10;
            var tH = 28;
            tagCtx.fillStyle = bgColor;
            roundRect(tagCtx, tagX, tagY, tW, tH, 4);
            tagCtx.fill();
            tagCtx.fillStyle = '#FFFFFF';
            tagCtx.font = '9px sans-serif';
            tagCtx.textAlign = 'center';
            tagCtx.fillText(line1, tagX + tW / 2, tagY + 11);
            tagCtx.fillText(line2, tagX + tW / 2, tagY + 22);
            return { w: tW, h: tH };
          }

          if (isBP) {
            // 收缩压标签
            var sysTag = drawTag(ctx, '收缩上限', String(effectiveRange.max) + indicator.unit, width - paddingRight - 60, normalTopY - 18, 'rgba(91,127,255,0.85)');
            if (sysTag.y < paddingTop) sysTag.y = normalTopY + 2;
            drawTag(ctx, '收缩下限', String(effectiveRange.min) + indicator.unit, width - paddingRight - 60, normalBottomY + 2, 'rgba(91,127,255,0.85)');
            // 舒张压标签
            var diasTagY = diasTopY - 18;
            if (diasTagY < paddingTop) diasTagY = diasTopY + 2;
            drawTag(ctx, '舒张上限', String(effectiveRange2.max) + indicator.unit, width - paddingRight - 120, diasTagY, 'rgba(155,111,232,0.85)');
            drawTag(ctx, '舒张下限', String(effectiveRange2.min) + indicator.unit, width - paddingRight - 120, diasBottomY + 2, 'rgba(155,111,232,0.85)');
          } else {
            // 普通指标标签
            var maxTag = drawTag(ctx, '上限', String(effectiveRange.max) + indicator.unit, width - paddingRight - 60, normalTopY - 30, 'rgba(76,175,80,0.9)');
            if (maxTag.y < paddingTop) maxTag.y = normalTopY + 2;
            drawTag(ctx, '下限', String(effectiveRange.min) + indicator.unit, width - paddingRight - 60, normalBottomY + 2, 'rgba(76,175,80,0.9)');
          }
        }

        // === 绘制数据线辅助函数 ===
        function drawLine(dataArr, lineColor, showLabels) {
          var pts = [];
          for (var p = 0; p < dataArr.length; p++) {
            if (dataArr[p].value !== null) {
              var x = paddingLeft + (chartWidth / (dataArr.length - 1)) * p;
              var py = paddingTop + chartHeight * (1 - (dataArr[p].value - minVal) / range);
              pts.push({ x: x, y: py, value: dataArr[p].value, status: dataArr[p].status });
            }
          }

          if (pts.length > 1) {
            ctx.strokeStyle = lineColor;
            ctx.lineWidth = 2.5;
            ctx.lineJoin = 'round';
            ctx.beginPath();
            ctx.moveTo(pts[0].x, pts[0].y);
            for (var li = 1; li < pts.length; li++) {
              ctx.lineTo(pts[li].x, pts[li].y);
            }
            ctx.stroke();

            // 渐变填充
            var gradient = ctx.createLinearGradient(0, paddingTop, 0, paddingTop + chartHeight);
            gradient.addColorStop(0, lineColor + '30');
            gradient.addColorStop(1, lineColor + '05');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.moveTo(pts[0].x, paddingTop + chartHeight);
            for (var fi = 0; fi < pts.length; fi++) {
              ctx.lineTo(pts[fi].x, pts[fi].y);
            }
            ctx.lineTo(pts[pts.length - 1].x, paddingTop + chartHeight);
            ctx.closePath();
            ctx.fill();
          }

          // 数据点圆圈
          var showValueLabels = showLabels && dataArr.length <= 10;
          for (var pi = 0; pi < pts.length; pi++) {
            var pt = pts[pi];
            var dotR = dataArr.length <= 14 ? 5 : 3;
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, dotR, 0, Math.PI * 2);
            ctx.fillStyle = '#fff';
            ctx.fill();
            ctx.strokeStyle = pt.status === 'normal' ? '#4CAF50' : pt.status === 'abnormal' ? '#F44336' : lineColor;
            ctx.lineWidth = dataArr.length <= 14 ? 2.5 : 1.5;
            ctx.stroke();

            if (showValueLabels) {
              ctx.fillStyle = '#333';
              ctx.font = 'bold 11px sans-serif';
              ctx.textAlign = 'center';
              ctx.fillText(String(pt.value), pt.x, pt.y - 12);
            }
          }
        }

        // 先画舒张压（在下方），再画收缩压（在上方）
        if (isBP) {
          drawLine(chartData2, diasColor, false);
        }
        drawLine(chartData, indicator.color, true);

        // X轴标签
        var xLabelStep = 1;
        if (chartData.length > 21) xLabelStep = 5;
        else if (chartData.length > 14) xLabelStep = 3;
        else if (chartData.length > 10) xLabelStep = 2;
        for (var xi = 0; xi < chartData.length; xi++) {
          var showLabel = (xi % xLabelStep === 0) || (xi === chartData.length - 1);
          if (!showLabel) continue;
          var xx = paddingLeft + (chartWidth / (chartData.length - 1)) * xi;
          ctx.fillStyle = '#999';
          ctx.font = '11px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(chartData[xi].label, xx, height - paddingBottom + 20);
        }
      });
  },

  drawEmptyChart: function() {
    var query = wx.createSelectorQuery();
    query.select('#trendChart')
      .fields({ node: true, size: true })
      .exec(function(res) {
        if (!res[0]) return;
        var canvas = res[0].node;
        var ctx = canvas.getContext('2d');
        var dpr = wx.getWindowInfo().pixelRatio || 2;
        var width = res[0].width;
        var height = res[0].height;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);
        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = '#CCC';
        ctx.font = '14px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('暂无足够数据，请先记录', width / 2, height / 2);
      });
  },

  goToRecord: function() {
    var type = this.data.isBloodPressure ? 'bloodPressureSystolic' : this.data.type;
    app.globalData._chartType = type;
    wx.switchTab({ url: '/pages/record/record' });
  },

  onShareAppMessage: function() {
    var name = this.data.isBloodPressure ? '血压' : this.data.indicator.name;
    return {
      title: name + '趋势 - 健康监测',
      path: '/pages/chart/chart?type=bloodPressureSystolic'
    };
  }
});
