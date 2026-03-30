// pages/index/index.js
var app = getApp();

Page({
  data: {
    currentPatient: null,
    todaySummary: {},
    todayRecords: [],
    todayStr: '',
    weekSummaries: [],
    canRecord: true,
    currentRole: '',
    pendingCount: 0,
    // 日期翻页
    currentDate: '',
    dateStr: '',
    dateWeekDay: '',
    isToday: true
  },

  onLoad: function() {
    this.setDateToToday();
  },

  onShow: function() {
    // 登录检查：未登录跳转登录页
    var role = app.getCurrentRole();
    if (!role) {
      wx.reLaunch({ url: '/pages/login/login' });
      return;
    }
    // 护士未选患者时引导回患者列表
    if (role === 'nurse') {
      var patientId = wx.getStorageSync('currentPatientId');
      var patients = app.getPatients();
      if (!patientId && patients.length > 0) {
        wx.switchTab({ url: '/pages/patients/patients' });
        return;
      }
      if (patients.length === 0) {
        wx.switchTab({ url: '/pages/patients/patients' });
        return;
      }
    }
    // 如果没有设置日期，初始化为今天
    if (!this.data.currentDate) {
      this.setDateToToday();
    }
    this.loadCurrentPatient();
    this.setData({
      canRecord: app.hasPermission('canRecord'),
      currentRole: role,
      pendingCount: role === 'nurse' ? app.getPendingCount() : 0
    });
  },

  setDateToToday: function() {
    var d = new Date();
    var str = this.formatDateStr(d);
    this.setData({
      currentDate: str,
      dateStr: str,
      dateWeekDay: this.getWeekDay(d),
      isToday: true
    });
  },

  formatDateStr: function(d) {
    var y = d.getFullYear();
    var m = d.getMonth() + 1;
    var day = d.getDate();
    return y + '-' + (m < 10 ? '0' : '') + m + '-' + (day < 10 ? '0' : '') + day;
  },

  getWeekDay: function(d) {
    var days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return days[d.getDay()];
  },

  prevDay: function() {
    var d = new Date(this.data.currentDate);
    d.setDate(d.getDate() - 1);
    var str = this.formatDateStr(d);
    var todayStr = this.formatDateStr(new Date());
    this.setData({
      currentDate: str,
      dateStr: str,
      dateWeekDay: this.getWeekDay(d),
      isToday: str === todayStr
    });
    this.loadCurrentPatient();
  },

  nextDay: function() {
    var todayStr = this.formatDateStr(new Date());
    if (this.data.currentDate >= todayStr) return;
    var d = new Date(this.data.currentDate);
    d.setDate(d.getDate() + 1);
    var str = this.formatDateStr(d);
    this.setData({
      currentDate: str,
      dateStr: str,
      dateWeekDay: this.getWeekDay(d),
      isToday: str === todayStr
    });
    this.loadCurrentPatient();
  },

  goToday: function() {
    if (this.data.isToday) return;
    this.setDateToToday();
    this.loadCurrentPatient();
  },

  loadCurrentPatient: function() {
    var patient = app.getCurrentPatient();
    this.setData({ currentPatient: patient });
    if (patient) {
      this.loadDayData(patient.id, this.data.currentDate);
      this.loadWeekData(patient.id, this.data.currentDate);
    }
  },

  loadDayData: function(patientId, dateStr) {
    var summary = app.getDaySummary(patientId, dateStr);
    var records = app.getDayRecords(patientId, dateStr);
    var indicators = app.globalData.indicators;
    var keys = ['waterIntake', 'urineOutput', 'weight', 'bloodPressureSystolic', 'heartRate', 'temperature'];
    var cardList = [];
    var patient = app.getCurrentPatient();
    var completedCount = 0;

    for (var i = 0; i < keys.length; i++) {
      var key = keys[i];
      var ind = indicators[key];
      var val = summary[key];
      var status = 'empty';
      var normalRange = app.getIndicatorRange(patientId, key);

      if (val !== undefined) {
        completedCount++;
        var minR = normalRange.min;
        var maxR = normalRange.max;
        status = (val >= minR && val <= maxR) ? 'normal' : (val < minR * 0.9 || val > maxR * 1.1) ? 'danger' : 'warning';
      }

      // 血压特殊处理：合并收缩压和舒张压
      if (key === 'bloodPressureSystolic') {
        var diasVal = summary.bloodPressureDiastolic;
        var diasRange = app.getIndicatorRange(patientId, 'bloodPressureDiastolic');
        if (diasVal !== undefined) completedCount++;
        // 血压状态：两个都正常才算正常，任一异常则异常
        if (val !== undefined && diasVal !== undefined) {
          var sysNormal = val >= normalRange.min && val <= normalRange.max;
          var diasNormal = diasVal >= diasRange.min && diasVal <= diasRange.max;
          status = sysNormal && diasNormal ? 'normal' : (!sysNormal || !diasNormal) ? 'danger' : 'warning';
        } else if (val !== undefined) {
          status = (val >= normalRange.min && val <= normalRange.max) ? 'normal' : 'danger';
        }

        cardList.push({
          key: 'bloodPressure',
          name: '血压',
          icon: '❤️',
          unit: 'mmHg',
          color: ind.color,
          systolicValue: val !== undefined ? (Number.isInteger(val) ? val : parseFloat(val.toFixed(1))) : null,
          diastolicValue: diasVal !== undefined ? (Number.isInteger(diasVal) ? diasVal : parseFloat(diasVal.toFixed(1))) : null,
          displayValue: val !== undefined && diasVal !== undefined ? val + '/' + diasVal : (val !== undefined ? String(val) : '--'),
          status: status,
          normalRange: { min: normalRange.min, max: normalRange.max, diasMin: diasRange.min, diasMax: diasRange.max },
          category: ind.category,
          isBloodPressure: true
        });
        continue;
      }

      cardList.push({
        key: key, name: ind.name, icon: ind.icon, unit: ind.unit,
        color: ind.color, value: val,
        displayValue: val !== undefined ? (Number.isInteger(val) ? val : parseFloat(val.toFixed(1))) : '--',
        status: status, normalRange: normalRange, category: ind.category
      });
    }

    this.setData({ todaySummary: summary, todayRecords: records, cardList: cardList, completedCount: completedCount });
  },

  loadWeekData: function(patientId, baseDate) {
    var summaries = [];
    var base = baseDate ? new Date(baseDate) : new Date();
    var weekDays = ['日', '一', '二', '三', '四', '五', '六'];

    for (var i = 6; i >= 0; i--) {
      var d = new Date(base);
      d.setDate(d.getDate() - i);
      var mm = d.getMonth() + 1 < 10 ? '0' + (d.getMonth() + 1) : '' + (d.getMonth() + 1);
      var dd = d.getDate() < 10 ? '0' + d.getDate() : '' + d.getDate();
      var dateStr = d.getFullYear() + '-' + mm + '-' + dd;
      var summary = app.getDaySummary(patientId, dateStr);

      summaries.push({
        waterIntake: summary.waterIntake,
        date: dateStr,
        weekDay: weekDays[d.getDay()],
        monthDay: (d.getMonth() + 1) + '/' + d.getDate()
      });
    }
    this.setData({ weekSummaries: summaries });
  },

  goToRecord: function(e) {
    var type = e.currentTarget.dataset.type || '';
    // 跳转到 tabBar 页面需要使用 switchTab
    wx.switchTab({ url: '/pages/record/record' });
  },

  goToChart: function(e) {
    var type = e.currentTarget.dataset.type;
    app.globalData._chartType = type;
    wx.switchTab({ url: '/pages/chart/chart' });
  },

  goToHistory: function() {
    wx.navigateTo({ url: '/pages/history/history' });
  },

  goToPatients: function() {
    wx.switchTab({ url: '/pages/patients/patients' });
  },

  goToApply: function() {
    wx.navigateTo({ url: '/pages/apply/apply' });
  },

  goToSettings: function() {
    wx.switchTab({ url: '/pages/settings/settings' });
  },

  generateMockData: function() {
    var that = this;
    wx.showModal({
      title: '生成演示数据',
      content: '将生成50位患者各30天的模拟健康数据，确定继续？',
      success: function(res) {
        if (res.confirm) {
          wx.showLoading({ title: '正在生成...', mask: true });
          setTimeout(function() {
            app.generateMockData();
            wx.hideLoading();
            wx.showToast({ title: '生成成功！', icon: 'success' });
            setTimeout(function() { that.onShow(); }, 300);
          }, 500);
        }
      }
    });
  },

  onPullDownRefresh: function() {
    this.onShow();
    wx.stopPullDownRefresh();
  },

  onShareAppMessage: function() {
    return { title: '健康指标监测助手', path: '/pages/index/index' };
  }
});
