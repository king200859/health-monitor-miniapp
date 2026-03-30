// pages/history/history.js
const app = getApp();

Page({
  data: {
    date: '',
    weekDay: '',
    records: [],
    summary: {},
    patientId: '',
    canExport: false,
    canManage: false
  },

  onLoad(options) {
    const date = options.date || app.getTodayStr();
    this.setData({
      date,
      patientId: app.getCurrentPatient()?.id || ''
    });
    this.updateWeekDay(date);
    if (options.date) {
      wx.setNavigationBarTitle({ title: `${date} 记录` });
    }
  },

  onShow() {
    this.setData({
      patientId: app.getCurrentPatient()?.id || '',
      canExport: app.hasPermission('canExport'),
      canManage: app.hasPermission('canManage')
    });
    if (this.data.patientId) {
      this.loadDayData();
    }
  },

  // 加载当日数据
  loadDayData() {
    const { patientId, date } = this.data;
    const records = app.getDayRecords(patientId, date).sort((a, b) => b.timestamp - a.timestamp);
    const summary = app.getDaySummary(patientId, date);
    const indicators = app.globalData.indicators;

    // 转换记录显示
    const displayRecords = records.map(r => {
      const indicator = indicators[r.type];
      return {
        ...r,
        name: indicator ? indicator.name : r.type,
        icon: indicator ? indicator.icon : '📋',
        unit: indicator ? indicator.unit : '',
        color: indicator ? indicator.color : '#999'
      };
    });

    this.setData({
      records: displayRecords,
      summary
    });
  },

  // 更新星期几显示
  updateWeekDay(date) {
    const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    const day = new Date(date).getDay();
    this.setData({ weekDay: weekDays[day] });
  },

  // 日期选择
  onDateChange(e) {
    const date = e.detail.value;
    this.setData({ date: date });
    this.updateWeekDay(date);
    wx.setNavigationBarTitle({ title: date + ' 记录' });
    this.loadDayData();
  },

  // 前一天
  prevDay() {
    const d = new Date(this.data.date);
    d.setDate(d.getDate() - 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const dateStr = y + '-' + m + '-' + day;
    this.setData({ date: dateStr });
    this.updateWeekDay(dateStr);
    wx.setNavigationBarTitle({ title: dateStr + ' 记录' });
    this.loadDayData();
  },

  // 后一天
  nextDay() {
    const d = new Date(this.data.date);
    d.setDate(d.getDate() + 1);
    const today = app.getTodayStr();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const dateStr = y + '-' + m + '-' + day;
    if (dateStr > today) {
      wx.showToast({ title: '不能查看未来日期', icon: 'none' });
      return;
    }
    this.setData({ date: dateStr });
    this.updateWeekDay(dateStr);
    wx.setNavigationBarTitle({ title: dateStr + ' 记录' });
    this.loadDayData();
  },

  // 跳转到记录
  goToRecord(e) {
    const type = e.currentTarget.dataset.type;
    app.globalData._chartType = type;
    wx.switchTab({ url: '/pages/record/record' });
  },

  // 删除记录（仅护士可操作）
  deleteRecord(e) {
    if (!app.hasPermission('canManage')) {
      wx.showToast({ title: '仅护士可删除记录', icon: 'none' });
      return;
    }
    const timestamp = e.currentTarget.dataset.timestamp;
    const { patientId, date } = this.data;
    const records = wx.getStorageSync(`records_${patientId}`) || {};
    const dayRecords = records[date] || [];
    const index = dayRecords.findIndex(r => r.timestamp === timestamp);
    if (index !== -1) {
      dayRecords.splice(index, 1);
      if (dayRecords.length === 0) {
        delete records[date];
      } else {
        records[date] = dayRecords;
      }
      wx.setStorageSync(`records_${patientId}`, records);
      this.loadDayData();
      wx.showToast({ title: '已删除', icon: 'success' });
    }
  },

  // 导出数据（仅护士可操作）
  exportData() {
    if (!app.hasPermission('canExport')) {
      wx.showToast({ title: '无导出权限', icon: 'none' });
      return;
    }
    const { patientId, date, records } = this.data;
    if (records.length === 0) {
      wx.showToast({ title: '当日无数据', icon: 'none' });
      return;
    }
    let text = `健康记录 - ${date}\n`;
    text += '=========================\n\n';
    const indicators = app.globalData.indicators;
    Object.keys(indicators).forEach(key => {
      const val = this.data.summary[key];
      if (val !== undefined) {
        text += `${indicators[key].icon} ${indicators[key].name}: ${val} ${indicators[key].unit}\n`;
      }
    });
    text += `\n详细记录：\n`;
    records.forEach(r => {
      text += `${r.time} | ${r.name}: ${r.value}${r.unit}${r.note ? ' (' + r.note + ')' : ''}\n`;
    });

    wx.setClipboardData({
      data: text,
      success: () => {
        wx.showToast({ title: '已复制到剪贴板', icon: 'success' });
      }
    });
  }
});
