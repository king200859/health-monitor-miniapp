// pages/patients/patients.js
var app = getApp();

Page({
  data: {
    currentUser: null,
    patients: [],
    displayPatients: [],
    currentPatientId: '',
    maleCount: 0,
    femaleCount: 0,
    movedCount: 0,
    pendingCount: 0,
    emptyBedCount: 0,
    searchKey: '',
    todayStr: '',
    greeting: '',
    canRecord: true,
    activeFilter: 'all',
    currentRoleName: '',
    // 长按菜单
    showMenu: false,
    menuPatientId: '',
    menuPatientName: '',
    // 出院/转科弹窗
    showMoveModal: false,
    moveModalPatientId: '',
    moveModalPatientName: '',
    moveReason: '',
    moveNote: '',
    // 出院列表弹窗
    showMovedList: false,
    movedPatientsFull: [],
    // 恢复住院 - 空床位选择
    showBedPicker: false,
    restorePatientId: '',
    restorePatientName: '',
    restoreBedNo: '',
    emptyBeds: []
  },

  onShow: function() {
    if (!app.getCurrentRole()) {
      wx.reLaunch({ url: '/pages/login/login' });
      return;
    }
    var user = app.getCurrentUser();
    var role = app.getCurrentRole();
    var roleConfig = app.getRoleConfig(role);
    var roleName = roleConfig ? roleConfig.name : role;
    this.setData({
      currentUser: user,
      todayStr: app.getTodayStr(),
      greeting: this.getGreeting(),
      canRecord: app.hasPermission('canRecord'),
      pendingCount: app.getPendingCount(),
      currentRoleName: roleName
    });
    this.cleanupDuplicateBeds();
    this.loadPatients();
    this.loadMovedPatients();
  },

  // 清理重复床位：每张床只保留一条，优先保留真实患者而非空床位
  cleanupDuplicateBeds: function() {
    var patients = wx.getStorageSync('patients') || [];
    var bedMap = {}; // { bedNo: { real: p | null, empty: p | null } }
    for (var i = 0; i < patients.length; i++) {
      var p = patients[i];
      if (!p.bedNo) continue;
      if (!bedMap[p.bedNo]) {
        bedMap[p.bedNo] = { real: null, empty: null };
      }
      if (p._isEmpty) {
        if (!bedMap[p.bedNo].empty) bedMap[p.bedNo].empty = p;
      } else {
        if (!bedMap[p.bedNo].real) bedMap[p.bedNo].real = p;
      }
    }
    var cleaned = [];
    var bedNos = Object.keys(bedMap).sort(function(a, b) {
      return (parseInt(a) || 999) - (parseInt(b) || 999);
    });
    for (var j = 0; j < bedNos.length; j++) {
      var entry = bedMap[bedNos[j]];
      cleaned.push(entry.real || entry.empty);
    }
    wx.setStorageSync('patients', cleaned);
  },

  getGreeting: function() {
    var h = new Date().getHours();
    if (h < 6) return '夜深了';
    if (h < 9) return '早上好';
    if (h < 12) return '上午好';
    if (h < 14) return '中午好';
    if (h < 18) return '下午好';
    return '晚上好';
  },

  loadPatients: function() {
    var patients = app.getVisiblePatients();
    // 始终按床位号排序，保证床位位置固定
    patients.sort(function(a, b) {
      return (parseInt(a.bedNo) || 999) - (parseInt(b.bedNo) || 999);
    });
    var currentId = wx.getStorageSync('currentPatientId') || '';
    var maleCount = 0, femaleCount = 0, emptyBedCount = 0;
    for (var i = 0; i < patients.length; i++) {
      if (patients[i]._isEmpty) {
        emptyBedCount++;
      } else {
        if (patients[i].gender === 1) maleCount++;
        else femaleCount++;
      }
    }
    // 性别过滤：只保留对应性别的患者，不显示空床位
    var filter = this.data.activeFilter;
    var displayPatients = [];
    if (filter === 'male') {
      for (var i = 0; i < patients.length; i++) {
        if (!patients[i]._isEmpty && patients[i].gender === 1) displayPatients.push(patients[i]);
      }
    } else if (filter === 'female') {
      for (var i = 0; i < patients.length; i++) {
        if (!patients[i]._isEmpty && patients[i].gender !== 1) displayPatients.push(patients[i]);
      }
    } else if (filter === 'empty') {
      for (var i = 0; i < patients.length; i++) {
        if (patients[i]._isEmpty) displayPatients.push(patients[i]);
      }
    } else {
      displayPatients = patients;
    }
    // 搜索过滤：过滤在院患者，保留空床位
    var key = this.data.searchKey;
    if (key) {
      var searched = [];
      for (var i = 0; i < displayPatients.length; i++) {
        var p = displayPatients[i];
        if (p._isEmpty) { searched.push(p); continue; }
        if ((p.name && p.name.toLowerCase().indexOf(key) !== -1) ||
            (p.bedNo && p.bedNo.toLowerCase().indexOf(key) !== -1) ||
            (p.diagnosis && p.diagnosis.toLowerCase().indexOf(key) !== -1)) {
          searched.push(p);
        }
      }
      displayPatients = searched;
    }
    this.setData({
      patients: patients,
      displayPatients: displayPatients,
      occupiedCount: maleCount + femaleCount,
      currentPatientId: currentId,
      maleCount: maleCount,
      femaleCount: femaleCount,
      emptyBedCount: emptyBedCount,
      canManage: app.hasPermission('canManage')
    });
  },

  loadMovedPatients: function() {
    var all = app.getMovedPatients();
    this.setData({ movedCount: all.length });
  },

  // 搜索
  onSearch: function(e) {
    var key = (e.detail.value || '').trim().toLowerCase();
    this.doSearch(key);
    // 滚动到顶部，避免搜索结果被 sticky 搜索栏遮挡
    wx.pageScrollTo({ scrollTop: 0, duration: 200 });
  },

  // 按性别过滤
  filterPatients: function(e) {
    var filter = e.currentTarget.dataset.filter;
    this.setData({ activeFilter: filter });
    this.loadPatients();
  },

  clearSearch: function() {
    this.setData({ searchKey: '' });
    this.loadPatients();
    wx.pageScrollTo({ scrollTop: 0, duration: 200 });
  },

  doSearch: function(key) {
    this.setData({ searchKey: key });
    this.loadPatients();
  },

  // 点击选择患者 -> 进入首页查看详情
  selectPatient: function(e) {
    var id = e.currentTarget.dataset.id;
    app.setCurrentPatient(id);
    this.setData({ currentPatientId: id });
    wx.switchTab({ url: '/pages/index/index' });
  },

  // 跳转审批页面
  goToApply: function() {
    if (!app.hasPermission('canManage')) return;
    wx.navigateTo({ url: '/pages/apply/apply' });
  },

  // 长按 -> 弹出操作菜单
  showPatientMenu: function(e) {
    if (!app.hasPermission('canManage')) return;
    var id = e.currentTarget.dataset.id;
    var name = e.currentTarget.dataset.name;
    this.setData({ showMenu: true, menuPatientId: id, menuPatientName: name });
  },

  hideMenu: function() {
    this.setData({ showMenu: false });
  },

  viewPatientDetail: function() {
    var id = this.data.menuPatientId;
    this.setData({ showMenu: false });
    app.setCurrentPatient(id);
    wx.switchTab({ url: '/pages/index/index' });
  },

  viewPatientRecords: function() {
    var id = this.data.menuPatientId;
    this.setData({ showMenu: false });
    app.setCurrentPatient(id);
    wx.switchTab({ url: '/pages/index/index' });
  },

  editPatientFromMenu: function() {
    if (!app.hasPermission('canManage')) return;
    var id = this.data.menuPatientId;
    this.setData({ showMenu: false });
    wx.navigateTo({ url: '/pages/patient-detail/patient-detail?id=' + id });
  },

  moveOutFromMenu: function() {
    if (!app.hasPermission('canManage')) return;
    var id = this.data.menuPatientId;
    var name = this.data.menuPatientName;
    this.setData({
      showMenu: false,
      showMoveModal: true,
      moveModalPatientId: id,
      moveModalPatientName: name,
      moveReason: '',
      moveNote: ''
    });
  },

  // 添加患者
  addPatient: function() {
    if (!app.hasPermission('canManage')) return;
    wx.navigateTo({ url: '/pages/patient-detail/patient-detail' });
  },

  // 长按空床位 -> 分配患者到此床位
  assignToEmptyBed: function(e) {
    if (!app.hasPermission('canManage')) return;
    var bedNo = e.currentTarget.dataset.bed;
    wx.navigateTo({ url: '/pages/patient-detail/patient-detail?preBed=' + bedNo });
  },

  // 跳转人员管理
  goToNurseManage: function() {
    if (!app.hasPermission('canManage')) return;
    wx.navigateTo({ url: '/pages/nurse-manage/nurse-manage' });
  },

  // 跳转快速记录
  goToRecord: function() {
    wx.switchTab({ url: '/pages/record/record' });
  },

  goToHome: function() {
    wx.switchTab({ url: '/pages/index/index' });
  },

  // 出院/转科弹窗
  selectReason: function(e) {
    this.setData({ moveReason: e.currentTarget.dataset.reason });
  },

  onNoteInput: function(e) {
    this.setData({ moveNote: e.detail.value });
  },

  closeMoveModal: function() {
    this.setData({ showMoveModal: false });
  },

  confirmMoveOut: function() {
    if (!app.hasPermission('canManage')) return;
    if (!this.data.moveReason) return;
    var that = this;
    var id = this.data.moveModalPatientId;
    var name = this.data.moveModalPatientName;
    var reason = this.data.moveReason;
    var note = this.data.moveNote;
    wx.showModal({
      title: reason === 'discharge' ? '确认出院' : '确认转科',
      content: '确定将患者"' + name + '"' + (reason === 'discharge' ? '办理出院' : '办理转科') + '吗？',
      success: function(res) {
        if (res.confirm) {
          app.moveOutPatient(id, reason, note);
          that.setData({ showMoveModal: false });
          that.loadPatients();
          that.loadMovedPatients();
          wx.showToast({ title: reason === 'discharge' ? '已出院' : '已转科', icon: 'success' });
        }
      }
    });
  },

  // 出院/转科列表
  viewMovedPatients: function() {
    var all = app.getMovedPatients();
    all = all.map(function(p) {
      p.movedOutTime = p.movedOutAt ? formatDate(p.movedOutAt) : '';
      return p;
    });
    this.setData({ showMovedList: true, movedPatientsFull: all });
  },

  closeMovedList: function() {
    this.setData({ showMovedList: false });
  },

  // 点击"恢复在院" -> 弹出空床位选择弹窗
  showRestoreBedPicker: function(e) {
    if (!app.hasPermission('canManage')) return;
    var id = e.currentTarget.dataset.id;
    var name = e.currentTarget.dataset.name;
    // 获取当前所有空床位
    var allPatients = app.getVisiblePatients();
    var emptyBeds = [];
    for (var i = 0; i < allPatients.length; i++) {
      if (allPatients[i]._isEmpty) {
        emptyBeds.push({ bedNo: allPatients[i].bedNo });
      }
    }
    this.setData({
      showMovedList: false,
      showBedPicker: true,
      restorePatientId: id,
      restorePatientName: name,
      restoreBedNo: '',
      emptyBeds: emptyBeds
    });
  },

  // 选择空床位
  selectRestoreBed: function(e) {
    this.setData({ restoreBedNo: e.currentTarget.dataset.bed });
  },

  // 关闭空床位选择弹窗
  closeBedPicker: function() {
    this.setData({ showBedPicker: false });
  },

  // 确认恢复住院
  confirmRestore: function() {
    if (!app.hasPermission('canManage')) return;
    var id = this.data.restorePatientId;
    var bedNo = this.data.restoreBedNo;
    var name = this.data.restorePatientName;
    if (!id || !bedNo) return;
    var that = this;
    wx.showModal({
      title: '确认恢复住院',
      content: '将"' + name + '"安排到' + bedNo + '床？',
      success: function(res) {
        if (res.confirm) {
          app.restorePatientToBed(id, bedNo);
          that.setData({ showBedPicker: false });
          that.loadPatients();
          that.loadMovedPatients();
          wx.showToast({ title: '已安排至' + bedNo + '床', icon: 'success' });
        }
      }
    });
  },

  noop: function() {}
});

function formatDate(ts) {
  var d = new Date(ts);
  return (d.getMonth() + 1) + '月' + d.getDate() + '日 ' +
    (d.getHours() < 10 ? '0' : '') + d.getHours() + ':' +
    (d.getMinutes() < 10 ? '0' : '') + d.getMinutes();
}
