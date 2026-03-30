// pages/apply/apply.js
var app = getApp();

Page({
  data: {
    activeTab: 'pending',
    applications: [],
    pendingCount: 0
  },

  onLoad: function() {
    // 权限守卫：仅护士可进入此页面
    if (app.getCurrentRole() !== 'nurse') {
      wx.showToast({ title: '无权限访问', icon: 'none' });
      wx.navigateBack();
      return;
    }
    this.loadApplications();
  },

  onShow: function() {
    if (app.getCurrentRole() !== 'nurse') return;
    this.loadApplications();
  },

  switchTab: function(e) {
    var tab = e.currentTarget.dataset.tab;
    this.setData({ activeTab: tab });
    this.loadApplications();
  },

  loadApplications: function() {
    var filter = this.data.activeTab;
    var allApps = app.getApplications(filter);
    var patients = app.getPatients();
    var pendingCount = app.getPendingCount();

    // 补充患者床号和格式化时间
    for (var i = 0; i < allApps.length; i++) {
      var a = allApps[i];
      var patient = null;
      for (var j = 0; j < patients.length; j++) {
        if (patients[j].id === a.patientId) { patient = patients[j]; break; }
      }
      a.patientBedNo = patient ? (patient.bedNo || '') : '';
      a.createdAtText = formatTime(a.createdAt);
      a.reviewedAtText = a.reviewedAt ? formatTime(a.reviewedAt) : '';
    }

    this.setData({
      applications: allApps,
      pendingCount: pendingCount
    });
  },

  approveApp: function(e) {
    var id = e.currentTarget.dataset.id;
    var that = this;
    wx.showModal({
      title: '确认通过',
      content: '确定通过该申请吗？通过后对方将可以访问对应患者的数据。',
      confirmColor: '#4A90D9',
      success: function(res) {
        if (res.confirm) {
          app.reviewApplication(id, true);
          wx.showToast({ title: '已通过', icon: 'success' });
          that.loadApplications();
        }
      }
    });
  },

  rejectApp: function(e) {
    var id = e.currentTarget.dataset.id;
    var that = this;
    wx.showModal({
      title: '确认拒绝',
      content: '确定拒绝该申请吗？',
      confirmColor: '#F44336',
      success: function(res) {
        if (res.confirm) {
          app.reviewApplication(id, false);
          wx.showToast({ title: '已拒绝', icon: 'success' });
          that.loadApplications();
        }
      }
    });
  }
});

function formatTime(ts) {
  var d = new Date(ts);
  var m = (d.getMonth() + 1 < 10 ? '0' : '') + (d.getMonth() + 1);
  var day = (d.getDate() < 10 ? '0' : '') + d.getDate();
  var h = (d.getHours() < 10 ? '0' : '') + d.getHours();
  var min = (d.getMinutes() < 10 ? '0' : '') + d.getMinutes();
  return d.getFullYear() + '-' + m + '-' + day + ' ' + h + ':' + min;
}
