// pages/nurse-manage/nurse-manage.js
var app = getApp();

Page({
  data: {
    activeTab: 'caregiver',
    caregiverList: [],
    patientList: []
  },

  onShow: function() {
    // 权限守卫：仅护士可进入此页面
    if (app.getCurrentRole() !== 'nurse') {
      wx.showToast({ title: '无权限访问', icon: 'none' });
      wx.navigateBack();
      return;
    }
    this.loadData();
  },

  switchTab: function(e) {
    var tab = e.currentTarget.dataset.tab;
    this.setData({ activeTab: tab });
    this.loadData();
  },

  loadData: function() {
    this.setData({
      caregiverList: app.getCaregiverList(),
      patientList: app.getPatientBindingList()
    });
  },

  // === 护工/家属管理 ===

  addCaregiver: function() {
    var that = this;
    wx.showModal({
      title: '添加护工/家属',
      editable: true,
      placeholderText: '请输入姓名',
      confirmText: '下一步',
      success: function(res) {
        if (res.confirm && res.content && res.content.trim()) {
          var name = res.content.trim();
          wx.showModal({
            title: '输入手机号',
            editable: true,
            placeholderText: '请输入11位手机号',
            confirmText: '添加',
            success: function(res2) {
              if (res2.confirm && res2.content && res2.content.trim().length === 11) {
                var phone = res2.content.trim();
                var result = app.addCaregiverBinding(name, phone);
                if (!result) {
                  wx.showToast({ title: '该手机号已存在', icon: 'none' });
                  return;
                }
                wx.showToast({ title: '添加成功', icon: 'success' });
                that.loadData();
              } else {
                wx.showToast({ title: '请输入有效手机号', icon: 'none' });
              }
            }
          });
        }
      }
    });
  },

  editCaregiver: function(e) {
    var phone = e.currentTarget.dataset.phone;
    var oldName = e.currentTarget.dataset.name;
    var that = this;
    wx.showModal({
      title: '编辑护工/家属',
      editable: true,
      placeholderText: oldName,
      defaultValue: oldName,
      confirmText: '保存',
      success: function(res) {
        if (res.confirm && res.content && res.content.trim()) {
          app.updateCaregiverBinding(phone, res.content.trim());
          wx.showToast({ title: '已更新', icon: 'success' });
          that.loadData();
        }
      }
    });
  },

  removeCaregiver: function(e) {
    var phone = e.currentTarget.dataset.phone;
    var name = e.currentTarget.dataset.name;
    var that = this;
    wx.showModal({
      title: '确认删除',
      content: '确定删除护工"' + name + '"？删除后该账号将无法登录，关联关系也将清除。',
      confirmColor: '#F44336',
      success: function(res) {
        if (res.confirm) {
          app.removeCaregiverBinding(phone);
          wx.showToast({ title: '已删除', icon: 'success' });
          that.loadData();
        }
      }
    });
  },

  manageCaregiverPatients: function(e) {
    var userId = e.currentTarget.dataset.userid;
    var name = e.currentTarget.dataset.name;
    var patients = app.getPatients();
    if (patients.length === 0) {
      wx.showToast({ title: '暂无患者数据', icon: 'none' });
      return;
    }
    var assigned = app.getCaregiverPatientInfo(userId);
    var assignedIds = assigned.map(function(p) { return p.id; });
    // 存储当前操作的护工信息，供选择页面回调使用
    this.setData({
      _assigningUserId: userId,
      _assigningName: name
    });
    wx.navigateTo({
      url: '/pages/patient-select/patient-select?title=分配患者给' + name + '&mode=multi&assignedIds=' + assignedIds.join(',')
    });
  },

  // 患者选择页面多选确认回调
  onPatientsSelected: function(selectedIds) {
    var userId = this.data._assigningUserId;
    var name = this.data._assigningName;
    var patients = app.getPatients();
    var oldAssigned = app.getCaregiverPatientInfo(userId);
    var oldAssignedIds = oldAssigned.map(function(p) { return p.id; });
    var assignments = wx.getStorageSync('assignments') || [];

    // 计算新增的和取消的
    var toAdd = [];
    var toRemove = [];
    for (var i = 0; i < selectedIds.length; i++) {
      if (oldAssignedIds.indexOf(selectedIds[i]) === -1) {
        toAdd.push(selectedIds[i]);
      }
    }
    for (var j = 0; j < oldAssignedIds.length; j++) {
      if (selectedIds.indexOf(oldAssignedIds[j]) === -1) {
        toRemove.push(oldAssignedIds[j]);
      }
    }

    // 移除旧的分配关系
    for (var r = 0; r < toRemove.length; r++) {
      assignments = assignments.filter(function(a) {
        return !(a.userId === userId && a.patientId === toRemove[r]);
      });
    }

    // 添加新的分配关系
    for (var a = 0; a < toAdd.length; a++) {
      assignments.push({ userId: userId, userRole: 'caregiver', patientId: toAdd[a], assignedAt: Date.now() });
    }
    wx.setStorageSync('assignments', assignments);

    // 更新绑定状态
    var bindings = wx.getStorageSync('userBindings') || [];
    for (var b = 0; b < bindings.length; b++) {
      if (bindings[b].userId === userId) {
        bindings[b].bound = selectedIds.length > 0;
        if (selectedIds.length > 0) {
          bindings[b].patientId = selectedIds[0];
        } else {
          bindings[b].patientId = '';
        }
        break;
      }
    }
    wx.setStorageSync('userBindings', bindings);

    // 自动为新增的患者通过申请
    var applications = wx.getStorageSync('applications') || [];
    var cgBinding = null;
    for (var n = 0; n < bindings.length; n++) {
      if (bindings[n].userId === userId) { cgBinding = bindings[n]; break; }
    }
    for (var ai = 0; ai < toAdd.length; ai++) {
      var patient = null;
      for (var pi = 0; pi < patients.length; pi++) {
        if (patients[pi].id === toAdd[ai]) { patient = patients[pi]; break; }
      }
      var found = false;
      for (var mi = 0; mi < applications.length; mi++) {
        if (applications[mi].userRole === 'caregiver' && applications[mi].patientId === toAdd[ai] && (applications[mi].userId === userId || applications[mi].userName === (cgBinding ? cgBinding.name : name))) {
          applications[mi].status = 'approved';
          applications[mi].reviewedAt = Date.now();
          found = true;
        }
      }
      if (!found && patient) {
        applications.push({
          id: 'A' + Date.now() + '_' + ai, userRole: 'caregiver', userId: userId,
          userName: cgBinding ? cgBinding.name : name,
          patientId: toAdd[ai], patientName: patient.name, status: 'approved',
          createdAt: Date.now(), reviewedAt: Date.now(), reviewedBy: 'nurse'
        });
      }
    }
    wx.setStorageSync('applications', applications);

    var msg = '';
    if (toAdd.length > 0 && toRemove.length > 0) {
      msg = '已分配' + toAdd.length + '人，取消' + toRemove.length + '人';
    } else if (toAdd.length > 0) {
      msg = '已分配' + toAdd.length + '位患者';
    } else if (toRemove.length > 0) {
      msg = '已取消' + toRemove.length + '位患者';
    } else {
      msg = '未做更改';
    }
    wx.showToast({ title: msg, icon: 'success' });
    this.loadData();
  },

  // 单选回调（保留兼容）
  onPatientSelected: function(patientId) {
    // 单选模式下，直接用多选逻辑（选1个）
    this.onPatientsSelected([patientId]);
  },

  // === 病人账号管理 ===

  addPatient: function() {
    var patients = app.getPatients();
    if (patients.length === 0) {
      wx.showToast({ title: '请先添加患者', icon: 'none' });
      return;
    }
    var that = this;
    wx.showModal({
      title: '添加病人账号',
      editable: true,
      placeholderText: '请输入病人姓名',
      confirmText: '下一步',
      success: function(res) {
        if (res.confirm && res.content && res.content.trim()) {
          var name = res.content.trim();
          wx.showModal({
            title: '输入手机号',
            editable: true,
            placeholderText: '请输入11位手机号',
            confirmText: '下一步',
            success: function(res2) {
              if (res2.confirm && res2.content && res2.content.trim().length === 11) {
                var phone = res2.content.trim();
                // 选择关联患者
                var pNames = patients.map(function(p) { return p.name + '（' + (p.bedNo || '无床号') + '）'; });
                wx.showActionSheet({
                  itemList: pNames,
                  success: function(res3) {
                    var p = patients[res3.tapIndex];
                    var result = app.addPatientBinding(name, phone, p.id);
                    if (!result) {
                      wx.showToast({ title: '该手机号已存在', icon: 'none' });
                      return;
                    }
                    wx.showToast({ title: '添加成功', icon: 'success' });
                    that.loadData();
                  }
                });
              } else {
                wx.showToast({ title: '请输入有效手机号', icon: 'none' });
              }
            }
          });
        }
      }
    });
  },

  editPatientBinding: function(e) {
    var phone = e.currentTarget.dataset.phone;
    var oldName = e.currentTarget.dataset.name;
    var oldPatientId = e.currentTarget.dataset.patientid;
    var patients = app.getPatients();
    var that = this;

    // 先输入新姓名
    wx.showModal({
      title: '编辑病人信息',
      editable: true,
      placeholderText: oldName,
      defaultValue: oldName,
      confirmText: '下一步',
      success: function(res) {
        if (res.confirm && res.content && res.content.trim()) {
          var newName = res.content.trim();
          // 更新绑定中的姓名
          var bindings = wx.getStorageSync('userBindings') || [];
          for (var i = 0; i < bindings.length; i++) {
            if (bindings[i].phone === phone && bindings[i].role === 'patient') {
              bindings[i].name = newName;
              break;
            }
          }
          wx.setStorageSync('userBindings', bindings);
          // 选择新的关联患者
          var pNames = patients.map(function(p) {
            return (p.id === oldPatientId ? '✓ ' : '  ') + p.name + '（' + (p.bedNo || '无床号') + '）';
          });
          wx.showActionSheet({
            itemList: pNames,
            success: function(res2) {
              var p = patients[res2.tapIndex];
              app.updatePatientBinding(phone, p.id);
              wx.showToast({ title: '已更新', icon: 'success' });
              that.loadData();
            }
          });
        }
      }
    });
  },

  removePatient: function(e) {
    var phone = e.currentTarget.dataset.phone;
    var name = e.currentTarget.dataset.name;
    var that = this;
    wx.showModal({
      title: '确认删除',
      content: '确定删除病人"' + name + '"的账号？删除后该账号将无法登录。',
      confirmColor: '#F44336',
      success: function(res) {
        if (res.confirm) {
          app.removePatientBinding(phone);
          wx.showToast({ title: '已删除', icon: 'success' });
          that.loadData();
        }
      }
    });
  }
});
