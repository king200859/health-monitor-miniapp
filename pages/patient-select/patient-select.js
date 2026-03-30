// pages/patient-select/patient-select.js
var app = getApp();

Page({
  data: {
    title: '选择患者',
    patients: [],
    assignedIds: [],
    mode: 'single', // single | multi
    selectedIds: [],
    searchKey: ''
  },

  onLoad: function(options) {
    var title = options.title || '选择患者';
    var mode = options.mode || 'single';
    this.setData({ title: title, mode: mode });

    // 解析已分配的患者ID
    var assignedStr = options.assignedIds || '';
    var assignedIds = assignedStr ? assignedStr.split(',') : [];
    // 多选模式下，用已分配列表作为初始选中状态
    var selectedIds = mode === 'multi' ? assignedIds.slice() : [];
    this.setData({ assignedIds: assignedIds, selectedIds: selectedIds });
  },

  onShow: function() {
    var patients = app.getPatients();
    var selectedIds = this.data.selectedIds;
    // 为每个患者预计算选中状态，避免 wxml 中 indexOf 不可靠
    for (var i = 0; i < patients.length; i++) {
      patients[i]._selected = selectedIds.indexOf(patients[i].id) !== -1;
    }
    this.setData({ patients: patients });
  },

  // 更新列表中的选中状态
  _updateSelectedState: function() {
    var patients = this.data.patients;
    var selectedIds = this.data.selectedIds;
    for (var i = 0; i < patients.length; i++) {
      patients[i]._selected = selectedIds.indexOf(patients[i].id) !== -1;
    }
    this.setData({ patients: patients });
  },

  onSearch: function(e) {
    var key = (e.detail.value || '').trim().toLowerCase();
    this.setData({ searchKey: key });
  },

  getDisplayPatients: function() {
    var patients = this.data.patients;
    var key = this.data.searchKey;
    if (!key) return patients;
    return patients.filter(function(p) {
      return (p.name && p.name.toLowerCase().indexOf(key) !== -1) ||
             (p.bedNo && p.bedNo.toLowerCase().indexOf(key) !== -1) ||
             (p.diagnosis && p.diagnosis.toLowerCase().indexOf(key) !== -1);
    });
  },

  toggleSelect: function(e) {
    var id = e.currentTarget.dataset.id;
    var selectedIds = this.data.selectedIds.slice();
    var idx = selectedIds.indexOf(id);

    if (this.data.mode === 'multi') {
      if (idx !== -1) {
        selectedIds.splice(idx, 1);
      } else {
        selectedIds.push(id);
      }
      this.setData({ selectedIds: selectedIds });
      this._updateSelectedState();
    } else {
      // 单选模式直接确认
      var pages = getCurrentPages();
      var prevPage = pages[pages.length - 2];
      if (prevPage && prevPage.onPatientSelected) {
        prevPage.onPatientSelected(id);
        wx.navigateBack();
      }
    }
  },

  confirmSelect: function() {
    var pages = getCurrentPages();
    var prevPage = pages[pages.length - 2];
    if (prevPage && prevPage.onPatientsSelected) {
      prevPage.onPatientsSelected(this.data.selectedIds);
    }
    wx.navigateBack();
  }
});
