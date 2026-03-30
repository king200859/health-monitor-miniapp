// pages/settings/settings.js
var app = getApp();

Page({
    data: {
    version: '2.0.0',
    currentPatient: null,
    currentRole: '',
    currentUser: null,
    roleConfig: null,
    hasPerm: {},
    pendingCount: 0
  },

  onShow: function() {
    var role = app.getCurrentRole();
    var user = app.getCurrentUser();
    var config = app.getRoleConfig(role);

    this.setData({
      currentPatient: app.getCurrentPatient(),
      currentRole: role,
      currentUser: user,
      roleConfig: config,
      pendingCount: role === 'nurse' ? app.getPendingCount() : 0,
      hasPerm: config ? {
        canViewAll: config.canViewAll,
        canRecord: config.canRecord,
        canManage: config.canManage,
        canSetRange: config.canSetRange,
        canExport: config.canExport
      } : {}
    });
  },

  // 前往登录页
  goToLogin: function() {
    wx.reLaunch({ url: '/pages/login/login' });
  },

  // 切换角色 -> 跳转登录页
  switchRole: function() {
    wx.reLaunch({ url: '/pages/login/login' });
  },

  // 退出登录
  logout: function() {
    wx.showModal({
      title: '退出登录',
      content: '确定退出当前身份吗？',
      success: function(res) {
        if (res.confirm) {
          app.setRole('', null);
          wx.reLaunch({ url: '/pages/login/login' });
        }
      }
    });
  },

  // 跳转患者管理
  goToPatients: function() {
    wx.switchTab({ url: '/pages/patients/patients' });
  },

  // 跳转申请审批
  goToApply: function() {
    wx.navigateTo({ url: '/pages/apply/apply' });
  },

  // 跳转人员管理
  goToNurseManage: function() {
    wx.navigateTo({ url: '/pages/nurse-manage/nurse-manage' });
  },

  generateMockData: function() {
    var that = this;
    wx.showModal({
      title: '生成演示数据',
      content: '将清除现有数据并生成50位患者+20名护工/家属各30天的模拟数据，确定继续？',
      success: function(res) {
        if (res.confirm) {
          wx.showLoading({ title: '正在生成50人数据...', mask: true });
          setTimeout(function() {
            app.generateMockData();
            wx.hideLoading();
            wx.showToast({ title: '已生成50名患者+20名护工', icon: 'success', duration: 2000 });
            setTimeout(function() { that.onShow(); }, 500);
          }, 500);
        }
      }
    });
  },

  clearAllData: function() {
    var that = this;
    wx.showModal({
      title: '警告',
      content: '确定要清除所有数据吗？此操作不可恢复！',
      confirmColor: '#F44336',
      success: function(res) {
        if (res.confirm) {
          wx.clearStorageSync();
          app.setRole('', null);
          app.initStorage();
          wx.reLaunch({ url: '/pages/login/login' });
        }
      }
    });
  },

  exportAllData: function() {
    var patients = app.getPatients();
    if (patients.length === 0) {
      wx.showToast({ title: '暂无数据', icon: 'none' });
      return;
    }
    var text = '=== 健康监测数据导出 ===\n导出时间：' + new Date().toLocaleString() + '\n\n';
    var indicators = app.globalData.indicators;
    for (var i = 0; i < patients.length; i++) {
      var p = patients[i];
      text += '--- 患者：' + p.name + ' (' + (p.bedNo || '无床号') + ') ---\n';
      text += '性别：' + (p.gender === 1 ? '男' : '女') + ' | 年龄：' + p.age + '岁\n';
      if (p.diagnosis) text += '诊断：' + p.diagnosis + '\n';
      var records = wx.getStorageSync('records_' + p.id) || {};
      var dates = Object.keys(records).sort();
      for (var j = 0; j < dates.length; j++) {
        var summary = app.getDaySummary(p.id, dates[j]);
        if (summary.recordCount > 0) {
          text += '\n  [' + dates[j] + '] 共' + summary.recordCount + '条记录\n';
          var keys = Object.keys(indicators);
          for (var k = 0; k < keys.length; k++) {
            if (summary[keys[k]] !== undefined) {
              text += '    ' + indicators[keys[k]].icon + ' ' + indicators[keys[k]].name + ': ' + summary[keys[k]] + ' ' + indicators[keys[k]].unit + '\n';
            }
          }
        }
      }
      text += '\n';
    }
    wx.setClipboardData({
      data: text,
      success: function() { wx.showToast({ title: '已复制到剪贴板', icon: 'success' }); }
    });
  },

  showAbout: function() {
    wx.showModal({
      title: '关于',
      content: '健康监测助手 v2.0.0\n\n支持护士、护工/家属、病人三种角色。\n\n数据存储在本地，保护患者隐私。',
      showCancel: false,
      confirmText: '知道了'
    });
  }
});
