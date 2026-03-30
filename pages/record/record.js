// pages/record/record.js
var app = getApp();

Page({
  data: {
    // 指标列表
    indicatorKeys: [
      'waterIntake', 'urineOutput', 'weight',
      'bloodPressureSystolic', 'heartRate', 'temperature'
    ],
    indicators: {},
    // 当前选中的指标
    selectedKey: '',
    selectedIndicator: null,
    // 日期相关
    todayStr: '',
    selectedDate: '',
    selectedDateDisplay: '',
    // 输入值
    value: '',
    time: '',
    note: '',
    // 血压模式
    isBloodPressure: false,
    systolicValue: '',
    diastolicValue: '',
    // 快捷值
    quickValues: [],
    // 当天已记录列表
    dayRecords: [],
    // 提交状态
    isSubmitting: false,
    // 当前患者
    patientId: '',
    currentPatient: null
  },

  onLoad: function(options) {
    // 权限检查
    if (!app.hasPermission('canRecord')) {
      wx.showToast({ title: '当前角色无记录权限', icon: 'none' });
      setTimeout(function() { wx.navigateBack(); }, 1000);
      return;
    }

    var todayStr = app.getTodayStr();
    var nowTime = app.getNowTimeStr();
    var type = options.type || '';
    var indicators = app.globalData.indicators;
    var keys = this.data.indicatorKeys;

    var indList = [];
    for (var i = 0; i < keys.length; i++) {
      var k = keys[i];
      var c = indicators[k].color;
      indList.push({ key: k, name: indicators[k].name, icon: indicators[k].icon, color: c, bgColor: c + '12', unit: indicators[k].unit });
    }

    var initData = {
      indicators: indicators,
      indicatorList: indList,
      todayStr: todayStr,
      selectedDate: todayStr,
      selectedDateDisplay: '今天',
      time: nowTime,
      patientId: app.getCurrentPatient() ? app.getCurrentPatient().id : '',
      currentPatient: app.getCurrentPatient()
    };

    // 如果传入了 type，直接选中该指标
    if (type && indicators[type]) {
      var patientId = initData.patientId;
      var customRange = app.getIndicatorRange(patientId, type);
      initData.selectedKey = type;
      initData.selectedIndicator = {
        name: indicators[type].name, icon: indicators[type].icon,
        unit: indicators[type].unit, color: indicators[type].color,
        normalRange: customRange, category: indicators[type].category
      };
      initData.isBloodPressure = (type === 'bloodPressureSystolic');
      initData.quickValues = this.getQuickValues(type);
      initData.selectedColor = indicators[type].color;
      initData.selectedBgColor = indicators[type].color + '18';
    }

    this.setData(initData);

    if (this.data.patientId) {
      this.loadDayRecords();
    }
  },

  onShow: function() {
    // 登录检查
    if (!app.getCurrentRole()) {
      wx.reLaunch({ url: '/pages/login/login' });
      return;
    }
    this.setData({ canManage: app.hasPermission('canManage') });
    var patient = app.getCurrentPatient();
    if (patient && (!this.data.currentPatient || this.data.currentPatient.id !== patient.id)) {
      this.setData({
        patientId: patient.id,
        currentPatient: patient
      });
      this.loadDayRecords();
    }
  },

  // 获取快捷值
  getQuickValues: function(type) {
    if (type === 'waterIntake') return [100, 200, 250, 300, 500];
    if (type === 'urineOutput') return [100, 200, 300, 500, 800];
    if (type === 'heartRate') return [60, 70, 80, 90, 100];
    if (type === 'temperature') return [36.0, 36.5, 37.0, 37.5, 38.0];
    return [];
  },

  // 选择指标
  selectIndicator: function(e) {
    var key = e.currentTarget.dataset.key;
    var indicators = this.data.indicators;
    var ind = indicators[key];
    var isBloodPressure = (key === 'bloodPressureSystolic');
    var customRange = app.getIndicatorRange(this.data.patientId, key);

    var customInd = {
      name: ind.name, icon: ind.icon, unit: ind.unit,
      color: ind.color, normalRange: customRange, category: ind.category
    };

    this.setData({
      selectedKey: key,
      selectedIndicator: customInd,
      isBloodPressure: isBloodPressure,
      quickValues: this.getQuickValues(key),
      selectedColor: ind.color,
      selectedBgColor: ind.color + '18',
      value: '',
      systolicValue: '',
      diastolicValue: '',
      note: ''
    });
  },

  // 前一天
  prevDay: function() {
    var d = new Date(this.data.selectedDate);
    d.setDate(d.getDate() - 1);
    this.setDate(d);
  },

  // 后一天
  nextDay: function() {
    var d = new Date(this.data.selectedDate);
    d.setDate(d.getDate() + 1);
    if (d <= new Date(this.data.todayStr + 'T23:59:59')) {
      this.setDate(d);
    }
  },

  // 回到今天
  goToday: function() {
    this.setData({
      selectedDate: this.data.todayStr,
      selectedDateDisplay: '今天'
    });
    this.loadDayRecords();
  },

  // 设置日期
  setDate: function(d) {
    var mm = d.getMonth() + 1 < 10 ? '0' + (d.getMonth() + 1) : '' + (d.getMonth() + 1);
    var dd = d.getDate() < 10 ? '0' + d.getDate() : '' + d.getDate();
    var dateStr = d.getFullYear() + '-' + mm + '-' + dd;
    var todayStr = this.data.todayStr;

    var display = '';
    var weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    if (dateStr === todayStr) {
      display = '今天';
    } else {
      display = (d.getMonth() + 1) + '月' + d.getDate() + '日 ' + weekDays[d.getDay()];
    }

    this.setData({
      selectedDate: dateStr,
      selectedDateDisplay: display
    });
    this.loadDayRecords();
  },

  // 日期选择器
  onDatePick: function(e) {
    var val = e.detail.value;
    var d = new Date(val);
    this.setDate(d);
  },

  // 加载当天记录
  loadDayRecords: function() {
    var patientId = this.data.patientId;
    var date = this.data.selectedDate;
    var selectedKey = this.data.selectedKey;
    var isBloodPressure = this.data.isBloodPressure;

    if (!patientId || !selectedKey) {
      this.setData({ dayRecords: [] });
      return;
    }

    var records = app.getDayRecords(patientId, date);
    var filtered = [];

    for (var i = 0; i < records.length; i++) {
      var r = records[i];
      if (r.type === selectedKey) {
        filtered.push(r);
      } else if (isBloodPressure && (r.type === 'bloodPressureSystolic' || r.type === 'bloodPressureDiastolic')) {
        filtered.push(r);
      }
    }

    filtered.sort(function(a, b) { return b.timestamp - a.timestamp; });

    // 合并血压显示
    if (isBloodPressure) {
      var merged = [];
      var used = {};
      for (var j = 0; j < filtered.length; j++) {
        var item = filtered[j];
        if (item.type === 'bloodPressureSystolic' && !used[item.time]) {
          var dia = null;
          for (var k = 0; k < filtered.length; k++) {
            if (filtered[k].type === 'bloodPressureDiastolic' && filtered[k].time === item.time) {
              dia = filtered[k];
              break;
            }
          }
          merged.push({
            timestamp: item.timestamp,
            time: item.time,
            note: item.note || '',
            systolic: item.value,
            diastolic: dia ? dia.value : null,
            diastolicTimestamp: dia ? dia.timestamp : null
          });
          used[item.time] = true;
        }
      }
      this.setData({ dayRecords: merged });
    } else {
      this.setData({ dayRecords: filtered });
    }
  },

  // 输入事件
  onValueInput: function(e) {
    this.setData({ value: e.detail.value });
  },
  onSystolicInput: function(e) {
    this.setData({ systolicValue: e.detail.value });
  },
  onDiastolicInput: function(e) {
    this.setData({ diastolicValue: e.detail.value });
  },
  onTimeChange: function(e) {
    this.setData({ time: e.detail.value });
  },
  onNoteInput: function(e) {
    this.setData({ note: e.detail.value });
  },

  // 快捷值
  onQuickValue: function(e) {
    var val = e.currentTarget.dataset.value;
    if (this.data.selectedKey === 'waterIntake') {
      var current = parseFloat(this.data.value || 0);
      this.setData({ value: String(current + val) });
    } else {
      this.setData({ value: String(val) });
    }
  },

  // 提交记录
  submitRecord: function() {
    if (this.data.isSubmitting) return;

    var that = this;
    var selectedKey = this.data.selectedKey;
    var value = this.data.value;
    var time = this.data.time;
    var note = this.data.note;
    var patientId = this.data.patientId;
    var isBloodPressure = this.data.isBloodPressure;
    var systolicValue = this.data.systolicValue;
    var diastolicValue = this.data.diastolicValue;
    var selectedDate = this.data.selectedDate;

    if (!patientId) {
      wx.showToast({ title: '请先选择患者', icon: 'none' });
      return;
    }
    if (!selectedKey) {
      wx.showToast({ title: '请选择记录类型', icon: 'none' });
      return;
    }

    if (isBloodPressure) {
      if (!systolicValue || !diastolicValue) {
        wx.showToast({ title: '请输入收缩压和舒张压', icon: 'none' });
        return;
      }
      var sys = parseFloat(systolicValue);
      var dia = parseFloat(diastolicValue);
      if (sys <= 0 || dia <= 0) {
        wx.showToast({ title: '请输入有效血压值', icon: 'none' });
        return;
      }
      if (dia >= sys) {
        wx.showToast({ title: '舒张压不应大于收缩压', icon: 'none' });
        return;
      }

      this.setData({ isSubmitting: true });
      app.saveHealthRecord(patientId, {
        type: 'bloodPressureSystolic',
        value: sys,
        date: selectedDate,
        time: time,
        note: note || (sys + '/' + dia)
      });
      app.saveHealthRecord(patientId, {
        type: 'bloodPressureDiastolic',
        value: dia,
        date: selectedDate,
        time: time,
        note: note || (sys + '/' + dia)
      });

      wx.showToast({ title: '记录成功', icon: 'success' });
      that.setData({ systolicValue: '', diastolicValue: '', note: '', isSubmitting: false });
      that.loadDayRecords();
    } else {
      if (!value || parseFloat(value) <= 0) {
        wx.showToast({ title: '请输入有效数值', icon: 'none' });
        return;
      }

      this.setData({ isSubmitting: true });
      app.saveHealthRecord(patientId, {
        type: selectedKey,
        value: parseFloat(value),
        date: selectedDate,
        time: time,
        note: note
      });

      wx.showToast({ title: '记录成功', icon: 'success' });
      that.setData({ value: '', note: '', isSubmitting: false });
      that.loadDayRecords();
    }
  },

  // 删除记录（仅护士可操作）
  deleteRecord: function(e) {
    if (!app.hasPermission('canManage')) {
      wx.showToast({ title: '仅护士可删除记录', icon: 'none' });
      return;
    }
    var index = e.currentTarget.dataset.index;
    var patientId = this.data.patientId;
    var date = this.data.selectedDate;
    var record = this.data.dayRecords[index];
    var isBloodPressure = this.data.isBloodPressure;

    var allRecords = wx.getStorageSync('records_' + patientId) || {};
    var dayRecs = allRecords[date] || [];

    if (isBloodPressure) {
      // 删除收缩压和舒张压
      dayRecs = dayRecs.filter(function(r) {
        return r.timestamp !== record.timestamp && r.timestamp !== record.diastolicTimestamp;
      });
    } else {
      dayRecs = dayRecs.filter(function(r) {
        return r.timestamp !== record.timestamp;
      });
    }

    if (dayRecs.length === 0) {
      delete allRecords[date];
    } else {
      allRecords[date] = dayRecs;
    }
    wx.setStorageSync('records_' + patientId, allRecords);
    this.loadDayRecords();
    wx.showToast({ title: '已删除', icon: 'success' });
  }
});
