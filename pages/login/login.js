// pages/login/login.js
var app = getApp();

Page({
  data: {
    step: 1,
    inputPhone: '',
    mockAccounts: [],
    currentPhone: '',
    loginResult: null
  },

  onLoad: function() {
    var role = app.getCurrentRole();
    if (role) {
      wx.switchTab({ url: '/pages/index/index' });
      return;
    }
    this.setData({ mockAccounts: app.getMockAccounts() });
  },

  // 模拟微信 getPhoneNumber
  mockGetPhoneNumber: function() {
    this.setData({ step: 2 });
  },

  // 手动输入手机号
  onPhoneInput: function(e) {
    this.setData({ inputPhone: e.detail.value });
  },

  // 手动输入的手机号登录
  loginByPhone: function() {
    var phone = this.data.inputPhone;
    if (!phone || phone.length !== 11) return;
    this.processLogin(phone);
  },

  // 选择模拟手机号
  selectPhone: function(e) {
    var phone = e.currentTarget.dataset.phone;
    this.processLogin(phone);
  },

  // 核心登录流程
  processLogin: function(phone) {
    // 先检查是否为模拟护士账号
    var mockAccounts = app.getMockAccounts();
    var mockNurse = null;
    for (var mi = 0; mi < mockAccounts.length; mi++) {
      if (mockAccounts[mi].phone === phone && mockAccounts[mi].role === 'nurse') {
        mockNurse = mockAccounts[mi];
        break;
      }
    }
    if (mockNurse) {
      app.setRole('nurse', { id: 'nurse_default', name: mockNurse.name, role: 'nurse', phone: phone });
      var patients = app.getPatients();
      if (patients.length === 0) {
        app.generateMockData();
      }
      var savedPatientId = wx.getStorageSync('currentPatientId');
      if (!savedPatientId) {
        patients = app.getPatients();
        savedPatientId = patients.length > 0 ? patients[0].id : '';
      }
      app.setCurrentPatient(savedPatientId);
      wx.switchTab({ url: '/pages/patients/patients' });
      return;
    }

    var binding = app.getUserBinding(phone);

    if (!binding) {
      this.setData({
        step: 3,
        currentPhone: phone,
        loginResult: {
          type: 'unknown',
          icon: '❓',
          title: '未找到账号',
          desc: '手机号 ' + phone + ' 未在系统中注册，请联系护士开通账号。'
        }
      });
      return;
    }

    var role = binding.role;

    if (role === 'nurse') {
      app.setRole('nurse', { id: binding.userId, name: binding.name, role: 'nurse', phone: phone });
      // 首次登录自动生成演示数据
      var patients = app.getPatients();
      if (patients.length === 0) {
        app.generateMockData();
      }
      // 恢复上次选中的患者，如果没有则自动选第一个
      var savedPatientId = wx.getStorageSync('currentPatientId');
      if (!savedPatientId) {
        patients = app.getPatients();
        savedPatientId = patients.length > 0 ? patients[0].id : '';
      }
      app.setCurrentPatient(savedPatientId);
      wx.switchTab({ url: '/pages/patients/patients' });
    } else if (role === 'caregiver') {
      if (binding.bound && binding.patientId) {
        var approved = app.getApprovedApplication('caregiver', binding.patientId);
        if (approved) {
          var patientObj = (app.getPatients().find(function(p) { return p.id === binding.patientId; }) || {});
          app.setRole('caregiver', { id: binding.userId, name: binding.name, role: 'caregiver', phone: phone, patientId: binding.patientId });
          app.setCurrentPatient(binding.patientId);
          wx.switchTab({ url: '/pages/patients/patients' });
        } else {
          var pending = app.getUserPendingApplication('caregiver', binding.patientId);
          this.setData({
            step: 3,
            currentPhone: phone,
            loginResult: pending ? {
              type: 'pending',
              icon: '⏳',
              title: '申请审核中',
              desc: '您对患者的关联申请正在等待护士审核，请耐心等待。'
            } : {
              type: 'rejected',
              icon: '⚠️',
              title: '上次申请未通过',
              desc: '您的关联申请未通过审核，请返回重新申请。'
            }
          });
        }
      } else {
        this.setData({
          step: 3,
          currentPhone: phone,
          loginResult: {
            type: 'need_bind_caregiver',
            icon: '📝',
            title: '需要选择患者',
            desc: '您好，' + binding.name + '！请选择您要关联的患者，提交后需等待护士审核。'
          }
        });
      }
    } else if (role === 'patient') {
      if (binding.bound && binding.patientId) {
        var approved2 = app.getApprovedApplication('patient', binding.patientId);
        if (approved2) {
          app.setRole('patient', { id: binding.userId, name: binding.name, role: 'patient', phone: phone, patientId: binding.patientId });
          app.setCurrentPatient(binding.patientId);
          wx.switchTab({ url: '/pages/index/index' });
        } else {
          var pending2 = app.getUserPendingApplication('patient', binding.patientId);
          this.setData({
            step: 3,
            currentPhone: phone,
            loginResult: pending2 ? {
              type: 'pending',
              icon: '⏳',
              title: '申请审核中',
              desc: '您的患者身份登记正在等待护士审核，请耐心等待。'
            } : {
              type: 'rejected',
              icon: '⚠️',
              title: '上次申请未通过',
              desc: '您的患者身份登记未通过审核，请返回重新申请。'
            }
          });
        }
      } else {
        this.setData({
          step: 3,
          currentPhone: phone,
          loginResult: {
            type: 'need_bind_patient',
            icon: '📝',
            title: '需要登记患者信息',
            desc: '请选择您对应的患者记录，提交后需等待护士审核。'
          }
        });
      }
    }
  },

  // 护工：选择患者申请
  selectPatientForCaregiver: function() {
    var patients = app.getPatients();
    if (patients.length === 0) {
      wx.showToast({ title: '暂无患者数据，请联系护士', icon: 'none' });
      return;
    }
    var phone = this.data.currentPhone;
    var binding = app.getUserBinding(phone);
    var names = patients.map(function(p) { return p.name + '（' + (p.bedNo || '无床号') + '）'; });
    var that = this;
    wx.showActionSheet({
      itemList: names,
      success: function(res) {
        var p = patients[res.tapIndex];
        var approved = app.getApprovedApplication('caregiver', p.id);
        if (approved) {
          app.saveUserBinding({ phone: phone, role: 'caregiver', userId: binding.userId, name: binding.name, bound: true, patientId: p.id });
          app.setRole('caregiver', { id: binding.userId, name: binding.name, role: 'caregiver', phone: phone, patientId: p.id });
          app.setCurrentPatient(p.id);
          wx.showToast({ title: '欢迎，' + binding.name, icon: 'success' });
          setTimeout(function() { wx.switchTab({ url: '/pages/index/index' }); }, 500);
          return;
        }
        var pending = app.getUserPendingApplication('caregiver', p.id);
        if (pending) {
          that.setData({
            step: 3,
            loginResult: {
              type: 'pending',
              icon: '⏳',
              title: '申请审核中',
              desc: '您对"' + p.name + '"的关联申请正在等待护士审核，请耐心等待。'
            }
          });
          return;
        }
        app.submitApplication({ userRole: 'caregiver', userName: binding.name, patientId: p.id, patientName: p.name });
        app.saveUserBinding({ phone: phone, role: 'caregiver', userId: binding.userId, name: binding.name, bound: true, patientId: p.id });
        that.setData({
          step: 3,
          loginResult: {
            type: 'pending',
            icon: '⏳',
            title: '申请已提交',
            desc: '您对"' + p.name + '"的关联申请已提交，请等待护士审核通过后方可登录。'
          }
        });
      }
    });
  },

  // 病人：选择自己对应的患者记录
  selectPatientForSelf: function() {
    var patients = app.getPatients();
    if (patients.length === 0) {
      wx.showToast({ title: '暂无患者数据，请联系护士', icon: 'none' });
      return;
    }
    var phone = this.data.currentPhone;
    var binding = app.getUserBinding(phone);
    var names = patients.map(function(p) { return p.name + '（' + (p.bedNo || '无床号') + '）'; });
    var that = this;
    wx.showActionSheet({
      itemList: names,
      success: function(res) {
        var p = patients[res.tapIndex];
        var approved = app.getApprovedApplication('patient', p.id);
        if (approved) {
          app.saveUserBinding({ phone: phone, role: 'patient', userId: binding.userId, name: binding.name, bound: true, patientId: p.id });
          app.setRole('patient', { id: binding.userId, name: binding.name, role: 'patient', phone: phone, patientId: p.id });
          app.setCurrentPatient(p.id);
          wx.showToast({ title: '欢迎，' + binding.name, icon: 'success' });
          setTimeout(function() { wx.switchTab({ url: '/pages/index/index' }); }, 500);
          return;
        }
        var pending = app.getUserPendingApplication('patient', p.id);
        if (pending) {
          that.setData({
            step: 3,
            loginResult: {
              type: 'pending',
              icon: '⏳',
              title: '申请审核中',
              desc: '您绑定"' + p.name + '"的申请正在等待护士审核，请耐心等待。'
            }
          });
          return;
        }
        app.submitApplication({ userRole: 'patient', userName: binding.name, patientId: p.id, patientName: p.name });
        app.saveUserBinding({ phone: phone, role: 'patient', userId: binding.userId, name: binding.name, bound: true, patientId: p.id });
        that.setData({
          step: 3,
          loginResult: {
            type: 'pending',
            icon: '⏳',
            title: '申请已提交',
            desc: '您绑定"' + p.name + '"的申请已提交，请等待护士审核通过后方可登录。'
          }
        });
      }
    });
  },

  // 返回第一步
  backToStep1: function() {
    this.setData({ step: 1, inputPhone: '', loginResult: null });
  }
});
