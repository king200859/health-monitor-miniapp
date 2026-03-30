// app.js - 小程序入口文件
App({
  onLaunch() {
    // 初始化本地存储
    this.initStorage();
  },

  globalData: {
    // 当前用户角色
    currentRole: 'nurse',
    currentUser: null,
    // 当前选中的患者
    currentPatient: null,
    // 患者列表
    patients: [],
    // 健康指标配置
    indicators: {
      waterIntake: {
        name: '喝水量',
        unit: 'ml',
        icon: '💧',
        color: '#4A90D9',
        normalRange: { min: 1500, max: 2500 },
        step: 50,
        category: 'intake'
      },
      urineOutput: {
        name: '尿量',
        unit: 'ml',
        icon: '🚽',
        color: '#F5A623',
        normalRange: { min: 800, max: 2000 },
        step: 50,
        category: 'output'
      },
      weight: {
        name: '体重',
        unit: 'kg',
        icon: '⚖️',
        color: '#7ED321',
        normalRange: { min: 40, max: 120 },
        step: 0.1,
        category: 'vital'
      },
      bloodPressureSystolic: {
        name: '收缩压',
        unit: 'mmHg',
        icon: '❤️',
        color: '#5B7FFF',
        normalRange: { min: 90, max: 140 },
        step: 1,
        category: 'vital'
      },
      bloodPressureDiastolic: {
        name: '舒张压',
        unit: 'mmHg',
        icon: '🩺',
        color: '#9B6FE8',
        normalRange: { min: 60, max: 90 },
        step: 1,
        category: 'vital'
      },
      heartRate: {
        name: '心率',
        unit: '次/分',
        icon: '💓',
        color: '#E88B6E',
        normalRange: { min: 60, max: 100 },
        step: 1,
        category: 'vital'
      },
      temperature: {
        name: '体温',
        unit: '℃',
        icon: '🌡️',
        color: '#F0A030',
        normalRange: { min: 36.0, max: 37.3 },
        step: 0.1,
        category: 'vital'
      }
    }
  },

  // 初始化存储
  initStorage() {
    const patients = wx.getStorageSync('patients');
    if (!patients) {
      wx.setStorageSync('patients', []);
    }
    const currentPatientId = wx.getStorageSync('currentPatientId');
    if (!currentPatientId) {
      wx.setStorageSync('currentPatientId', '');
    }
    // 初始化角色
    if (!wx.getStorageSync('currentRole')) {
      wx.setStorageSync('currentRole', '');
    }
    if (!wx.getStorageSync('currentUser')) {
      wx.setStorageSync('currentUser', '');
    }
    // 初始化分配关系
    if (!wx.getStorageSync('assignments')) {
      wx.setStorageSync('assignments', []);
    }
    // 初始化申请记录
    if (!wx.getStorageSync('applications')) {
      wx.setStorageSync('applications', []);
    }
    // 初始化手机号-用户绑定
    if (!wx.getStorageSync('userBindings')) {
      // 预置3个模拟用户（2222护工分配P1/P2/P11，3333病人关联P1）
      var presetBindings = [
        { phone: '13800001111', role: 'nurse', userId: 'N1', name: '护士小王', bound: true, patientId: '' },
        { phone: '13800002222', role: 'caregiver', userId: 'C_TEST_2222', name: '护工张阿姨', bound: true, patientId: 'P1' },
        { phone: '13800003333', role: 'patient', userId: 'U_TEST_3333', name: '张秀英', bound: true, patientId: 'P1' }
      ];
      wx.setStorageSync('userBindings', presetBindings);
      // 预置已通过的申请记录
      var presetApps = [
        { id: 'A_PRESET_C2222', userRole: 'caregiver', userId: 'C_TEST_2222', userName: '护工张阿姨', patientId: 'P1', patientName: '张秀英', status: 'approved', createdAt: Date.now() - 86400000, reviewedAt: Date.now() - 43200000, reviewedBy: 'nurse' },
        { id: 'A_PRESET_U3333', userRole: 'patient', userId: 'U_TEST_3333', userName: '张秀英', patientId: 'P1', patientName: '张秀英', status: 'approved', createdAt: Date.now() - 86400000, reviewedAt: Date.now() - 43200000, reviewedBy: 'nurse' }
      ];
      wx.setStorageSync('applications', presetApps);
      // 预置护工2222的分配关系（3个患者）
      wx.setStorageSync('assignments', [
        { userId: 'C_TEST_2222', userRole: 'caregiver', patientId: 'P1', assignedAt: Date.now() },
        { userId: 'C_TEST_2222', userRole: 'caregiver', patientId: 'P2', assignedAt: Date.now() },
        { userId: 'C_TEST_2222', userRole: 'caregiver', patientId: 'P11', assignedAt: Date.now() }
      ]);
    }
    // 加载角色到内存
    this.globalData.currentRole = wx.getStorageSync('currentRole') || '';
    this.globalData.currentUser = wx.getStorageSync('currentUser') || '';
  },

  // 获取当前日期字符串
  getTodayStr() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  },

  // 获取当前时间字符串
  getNowTimeStr() {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  },

  // 保存健康记录
  saveHealthRecord(patientId, record) {
    const date = record.date || this.getTodayStr();
    const records = wx.getStorageSync(`records_${patientId}`) || {};
    if (!records[date]) {
      records[date] = [];
    }
    records[date].push({
      ...record,
      date: date,
      timestamp: Date.now()
    });
    wx.setStorageSync(`records_${patientId}`, records);
    return true;
  },

  // 获取某天的记录
  getDayRecords(patientId, date) {
    const records = wx.getStorageSync(`records_${patientId}`) || {};
    return records[date] || [];
  },

  // 获取日期范围内的记录
  getDateRangeRecords(patientId, startDate, endDate) {
    const records = wx.getStorageSync(`records_${patientId}`) || {};
    const result = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      if (records[dateStr]) {
        result.push(...records[dateStr]);
      }
    }
    return result.sort((a, b) => a.timestamp - b.timestamp);
  },

  // 获取某天的汇总数据
  getDaySummary(patientId, date) {
    const dayRecords = this.getDayRecords(patientId, date);
    const summary = {};

    const indicators = this.globalData.indicators;
    Object.keys(indicators).forEach(key => {
      const indicatorRecords = dayRecords.filter(r => r.type === key);
      if (indicatorRecords.length > 0) {
        if (key === 'bloodPressureSystolic' || key === 'bloodPressureDiastolic') {
          // 血压取最新值
          summary[key] = indicatorRecords[indicatorRecords.length - 1].value;
        } else if (key === 'waterIntake' || key === 'urineOutput') {
          // 水分摄入和尿量取总和
          summary[key] = indicatorRecords.reduce((sum, r) => sum + parseFloat(r.value), 0);
        } else {
          // 体重、心率、体温取最新值
          summary[key] = indicatorRecords[indicatorRecords.length - 1].value;
        }
      }
    });

    summary.date = date;
    summary.recordCount = dayRecords.length;
    return summary;
  },

  // 获取患者列表（按床位号排序）
  getPatients() {
    var patients = wx.getStorageSync('patients') || [];
    // 用 slice 创建新数组再排序，避免就地修改污染 storage 缓存
    return patients.slice().sort(function(a, b) {
      return (parseInt(a.bedNo) || 999) - (parseInt(b.bedNo) || 999);
    });
  },

  // 添加患者
  addPatient(patient) {
    var patients = wx.getStorageSync('patients') || [];
    var id = 'P' + Date.now();
    patient.id = id;
    patient.createdAt = Date.now();
    patients.push(patient);
    wx.setStorageSync('patients', patients);
    return id;
  },

  // 删除患者（已废弃，改用 moveOutPatient）
  deletePatient(patientId) {
    let patients = this.getPatients();
    patients = patients.filter(p => p.id !== patientId);
    wx.setStorageSync('patients', patients);
    wx.removeStorageSync(`records_${patientId}`);
  },

  // 将患者移至出院/转科列表（床位保留为空位）
  moveOutPatient(patientId, reason, note) {
    var patients = wx.getStorageSync('patients') || [];
    var patient = null;
    var patientIndex = -1;
    for (var i = 0; i < patients.length; i++) {
      if (patients[i].id === patientId) { patient = patients[i]; patientIndex = i; break; }
    }
    if (!patient) return false;

    // 记录出院信息到 movedPatients
    var movedList = wx.getStorageSync('movedPatients') || [];
    var movedRecord = {
      id: patient.id,
      name: patient.name,
      age: patient.age,
      gender: patient.gender,
      bedNo: patient.bedNo,
      department: patient.department,
      diagnosis: patient.diagnosis,
      phone: patient.phone,
      notes: patient.notes,
      idCard: patient.idCard,
      customRanges: patient.customRanges,
      createdAt: patient.createdAt,
      movedOutAt: Date.now(),
      moveReason: reason || '',
      moveNote: note || ''
    };
    movedList.push(movedRecord);
    wx.setStorageSync('movedPatients', movedList);

    // 清空床位上的患者信息（保留床位号）
    var emptyBed = {
      id: '', name: '', age: '', gender: 0,
      bedNo: patient.bedNo,
      department: '', diagnosis: '', phone: '', notes: '', idCard: '',
      _isEmpty: true
    };
    patients[patientIndex] = emptyBed;
    wx.setStorageSync('patients', patients);

    // 清除当前选中
    if (wx.getStorageSync('currentPatientId') === patientId) {
      wx.setStorageSync('currentPatientId', '');
    }
    // 清除相关申请
    var applications = wx.getStorageSync('applications') || [];
    applications = applications.filter(function(a) { return a.patientId !== patientId; });
    wx.setStorageSync('applications', applications);
    // 清除分配关系
    var assignments = wx.getStorageSync('assignments') || [];
    assignments = assignments.filter(function(a) { return a.patientId !== patientId; });
    wx.setStorageSync('assignments', assignments);
    return true;
  },

  // 获取出院/转科患者列表
  getMovedPatients: function() {
    var list = wx.getStorageSync('movedPatients') || [];
    list.sort(function(a, b) { return (b.movedOutAt || 0) - (a.movedOutAt || 0); });
    return list;
  },

  // 将出院/转科患者恢复到原床位
  restorePatient: function(patientId) {
    var movedList = wx.getStorageSync('movedPatients') || [];
    var movedRecord = null;
    movedList = movedList.filter(function(p) {
      if (p.id === patientId) { movedRecord = p; return false; }
      return true;
    });
    if (!movedRecord) return false;
    wx.setStorageSync('movedPatients', movedList);

    // 恢复到原床位
    var patient = {
      id: movedRecord.id,
      name: movedRecord.name,
      age: movedRecord.age,
      gender: movedRecord.gender,
      bedNo: movedRecord.bedNo,
      department: movedRecord.department || '',
      diagnosis: movedRecord.diagnosis || '',
      phone: movedRecord.phone || '',
      notes: movedRecord.notes || '',
      idCard: movedRecord.idCard || '',
      customRanges: movedRecord.customRanges || {},
      createdAt: movedRecord.createdAt
    };
    var patients = wx.getStorageSync('patients') || [];
    var bedFound = false;
    for (var i = 0; i < patients.length; i++) {
      if (patients[i].bedNo === patient.bedNo && patients[i]._isEmpty) {
        patients[i] = patient;
        bedFound = true;
        break;
      }
    }
    if (!bedFound) {
      patients.push(patient);
    }
    wx.setStorageSync('patients', patients);
    return true;
  },

  // 获取当前选中患者
  getCurrentPatient() {
    const currentId = wx.getStorageSync('currentPatientId');
    if (!currentId) return null;
    const patients = this.getPatients();
    return patients.find(p => p.id === currentId) || null;
  },

  // 设置当前患者
  setCurrentPatient(patientId) {
    wx.setStorageSync('currentPatientId', patientId);
  },

  // 获取某患者的指标正常范围（有自定义用自定义，否则用全局默认）
  getIndicatorRange(patientId, indicatorKey) {
    var defaultRange = this.globalData.indicators[indicatorKey].normalRange;
    if (!patientId) return defaultRange;
    var patients = this.getPatients();
    var patient = null;
    for (var i = 0; i < patients.length; i++) {
      if (patients[i].id === patientId) { patient = patients[i]; break; }
    }
    if (!patient || !patient.customRanges || !patient.customRanges[indicatorKey]) return defaultRange;
    return patient.customRanges[indicatorKey];
  },

  // === 角色权限体系 ===

  // 获取角色配置
  getRoleConfig: function(role) {
    var roles = {
      nurse: { name: '护士', icon: '👩‍⚕️', color: '#4A90D9', canViewAll: true, canRecord: true, canManage: true, canSetRange: true, canExport: true },
      caregiver: { name: '护工/家属', icon: '🤝', color: '#F5A623', canViewAll: false, canRecord: true, canManage: false, canSetRange: false, canExport: false },
      patient: { name: '病人', icon: '🧑', color: '#7ED321', canViewAll: false, canRecord: true, canManage: false, canSetRange: false, canExport: false }
    };
    return roles[role] || null;
  },

  // 获取当前角色
  getCurrentRole: function() {
    return this.globalData.currentRole || wx.getStorageSync('currentRole') || '';
  },

  // 获取当前用户
  getCurrentUser: function() {
    var user = this.globalData.currentUser || wx.getStorageSync('currentUser');
    return user ? JSON.parse(user) : null;
  },

  // 设置角色（登录/切换角色）
  setRole: function(role, userInfo) {
    this.globalData.currentRole = role;
    this.globalData.currentUser = userInfo ? JSON.stringify(userInfo) : '';
    wx.setStorageSync('currentRole', role);
    wx.setStorageSync('currentUser', userInfo ? JSON.stringify(userInfo) : '');
  },

  // === 模拟微信授权手机号登录 ===

  // 模拟账号（调试用，正式版替换为微信 getPhoneNumber）
  getMockAccounts: function() {
    return [
      { phone: '13800001111', label: '138****1111', name: '护士小王', role: 'nurse', icon: '👩‍⚕️', color: '#4A90D9' },
      { phone: '13800002222', label: '138****2222', name: '护工张阿姨', role: 'caregiver', icon: '🤝', color: '#F5A623' },
      { phone: '13800003333', label: '138****3333', name: '张秀英', role: 'patient', icon: '🧑', color: '#7ED321' }
    ];
  },

  // 通过手机号查找用户绑定
  getUserBinding: function(phone) {
    var bindings = wx.getStorageSync('userBindings') || [];
    for (var i = 0; i < bindings.length; i++) {
      if (bindings[i].phone === phone) return bindings[i];
    }
    return null;
  },

  // 保存/更新用户绑定
  saveUserBinding: function(binding) {
    var bindings = wx.getStorageSync('userBindings') || [];
    var found = false;
    for (var i = 0; i < bindings.length; i++) {
      if (bindings[i].phone === binding.phone) {
        bindings[i] = binding;
        found = true;
        break;
      }
    }
    if (!found) bindings.push(binding);
    wx.setStorageSync('userBindings', bindings);
  },

  // 检查权限
  hasPermission: function(perm) {
    var role = this.getCurrentRole();
    var config = this.getRoleConfig(role);
    if (!config) return false;
    return config[perm] === true;
  },

  // 获取当前角色可见的患者列表（护士可见空床位，其他角色不可见）
  getVisiblePatients: function() {
    var allPatients = wx.getStorageSync('patients') || [];
    // 返回副本，避免外部排序污染 storage
    allPatients = allPatients.slice();
    var role = this.getCurrentRole();
    if (role === 'nurse') return allPatients;
    // 护工和病人角色：过滤掉空床位
    var realPatients = allPatients.filter(function(p) { return !p._isEmpty; });
    if (role === 'patient') {
      var user = this.getCurrentUser();
      if (!user || !user.patientId) return [];
      return realPatients.filter(function(p) { return p.id === user.patientId; });
    }
    if (role === 'caregiver') {
      var caregiver = this.getCurrentUser();
      if (!caregiver) return [];
      var assignments = wx.getStorageSync('assignments') || [];
      var patientIds = [];
      for (var i = 0; i < assignments.length; i++) {
        if (assignments[i].userId === caregiver.id && assignments[i].userRole === 'caregiver') {
          patientIds.push(assignments[i].patientId);
        }
      }
      return realPatients.filter(function(p) {
        return patientIds.indexOf(p.id) !== -1;
      });
    }
    return realPatients;
  },

  // 分配护工到患者
  assignCaregiver: function(userId, patientId) {
    var assignments = wx.getStorageSync('assignments') || [];
    var exists = false;
    for (var i = 0; i < assignments.length; i++) {
      if (assignments[i].userId === userId && assignments[i].patientId === patientId) {
        exists = true;
        break;
      }
    }
    if (!exists) {
      assignments.push({ userId: userId, userRole: 'caregiver', patientId: patientId, createdAt: Date.now() });
      wx.setStorageSync('assignments', assignments);
    }
  },

  // 取消分配
  unassignCaregiver: function(userId, patientId) {
    var assignments = wx.getStorageSync('assignments') || [];
    assignments = assignments.filter(function(a) {
      return !(a.userId === userId && a.patientId === patientId);
    });
    wx.setStorageSync('assignments', assignments);
  },

  // 获取患者的护工列表
  getPatientCaregivers: function(patientId) {
    var assignments = wx.getStorageSync('assignments') || [];
    return assignments.filter(function(a) { return a.patientId === patientId; });
  },

  // 获取护工负责的患者ID列表
  getCaregiverPatientIds: function(userId) {
    var assignments = wx.getStorageSync('assignments') || [];
    var ids = [];
    for (var i = 0; i < assignments.length; i++) {
      if (assignments[i].userId === userId) {
        ids.push(assignments[i].patientId);
      }
    }
    return ids;
  },

  // === 申请审核体系 ===

  // 提交申请
  submitApplication: function(appInfo) {
    var applications = wx.getStorageSync('applications') || [];
    var id = 'A' + Date.now();
    var appData = {
      id: id,
      userRole: appInfo.userRole,       // 'caregiver' 或 'patient'
      userName: appInfo.userName,
      patientId: appInfo.patientId || '',
      patientName: appInfo.patientName || '',
      status: 'pending',                 // pending / approved / rejected
      createdAt: Date.now(),
      reviewedAt: 0,
      reviewedBy: ''
    };
    applications.push(appData);
    wx.setStorageSync('applications', applications);
    return id;
  },

  // 获取申请列表（可按状态筛选）
  getApplications: function(filter) {
    var applications = wx.getStorageSync('applications') || [];
    if (!filter || filter === 'all') return applications;
    return applications.filter(function(a) { return a.status === filter; });
  },

  // 审核申请（护士操作）
  reviewApplication: function(appId, approved) {
    var applications = wx.getStorageSync('applications') || [];
    var appItem = null;
    for (var i = 0; i < applications.length; i++) {
      if (applications[i].id === appId) {
        appItem = applications[i];
        applications[i].status = approved ? 'approved' : 'rejected';
        applications[i].reviewedAt = Date.now();
        break;
      }
    }
    wx.setStorageSync('applications', applications);

    if (approved && appItem) {
      if (appItem.userRole === 'caregiver') {
        // 护工：添加分配关系
        this.assignCaregiver(appItem.id, appItem.patientId);
      }
      // 病人：patientId 已在申请中，审核通过后病人可直接使用
    }
    return appItem;
  },

  // 获取待审批数量
  getPendingCount: function() {
    var applications = wx.getStorageSync('applications') || [];
    var count = 0;
    for (var i = 0; i < applications.length; i++) {
      if (applications[i].status === 'pending') count++;
    }
    return count;
  },

  // 检查用户是否有已通过的申请（护工/病人登录用）
  getApprovedApplication: function(userRole, patientId) {
    var applications = wx.getStorageSync('applications') || [];
    for (var i = 0; i < applications.length; i++) {
      if (applications[i].userRole === userRole && applications[i].patientId === patientId && applications[i].status === 'approved') {
        return applications[i];
      }
    }
    return null;
  },

  // 获取用户相关的待审核申请
  getUserPendingApplication: function(userRole, patientId) {
    var applications = wx.getStorageSync('applications') || [];
    for (var i = 0; i < applications.length; i++) {
      if (applications[i].userRole === userRole && applications[i].patientId === patientId && applications[i].status === 'pending') {
        return applications[i];
      }
    }
    return null;
  },

  // === 护士人员管理 ===

  // 获取护工/家属列表（通过 userBindings 筛选）
  getCaregiverList: function() {
    var bindings = wx.getStorageSync('userBindings') || [];
    var list = [];
    for (var i = 0; i < bindings.length; i++) {
      if (bindings[i].role === 'caregiver') {
        var item = Object.assign({}, bindings[i]);
        // 补充已关联的患者信息
        item.assignedPatients = this.getCaregiverPatientInfo(item.userId);
        list.push(item);
      }
    }
    return list;
  },

  // 获取护工已分配的患者详情列表
  getCaregiverPatientInfo: function(userId) {
    var assignments = wx.getStorageSync('assignments') || [];
    var patients = this.getPatients();
    var result = [];
    for (var i = 0; i < assignments.length; i++) {
      if (assignments[i].userId === userId && assignments[i].userRole === 'caregiver') {
        for (var j = 0; j < patients.length; j++) {
          if (patients[j].id === assignments[i].patientId) {
            result.push({ id: patients[j].id, name: patients[j].name, bedNo: patients[j].bedNo });
            break;
          }
        }
      }
    }
    return result;
  },

  // 护士添加护工/家属账号
  addCaregiverBinding: function(name, phone) {
    var bindings = wx.getStorageSync('userBindings') || [];
    // 检查手机号是否已存在
    for (var i = 0; i < bindings.length; i++) {
      if (bindings[i].phone === phone) return null;
    }
    var userId = 'C' + Date.now();
    var binding = { phone: phone, role: 'caregiver', userId: userId, name: name, bound: false, patientId: '' };
    bindings.push(binding);
    wx.setStorageSync('userBindings', bindings);
    return binding;
  },

  // 护士编辑护工/家属信息
  updateCaregiverBinding: function(phone, newName) {
    var bindings = wx.getStorageSync('userBindings') || [];
    for (var i = 0; i < bindings.length; i++) {
      if (bindings[i].phone === phone && bindings[i].role === 'caregiver') {
        bindings[i].name = newName;
        wx.setStorageSync('userBindings', bindings);
        return true;
      }
    }
    return false;
  },

  // 护士删除护工/家属（同时清除分配关系和申请）
  removeCaregiverBinding: function(phone) {
    var bindings = wx.getStorageSync('userBindings') || [];
    var userId = '';
    bindings = bindings.filter(function(b) {
      if (b.phone === phone && b.role === 'caregiver') { userId = b.userId; return false; }
      return true;
    });
    wx.setStorageSync('userBindings', bindings);
    // 清除分配关系
    if (userId) {
      this.unassignCaregiver(userId, ''); // 清除该用户所有分配
      var assignments = wx.getStorageSync('assignments') || [];
      assignments = assignments.filter(function(a) { return a.userId !== userId; });
      wx.setStorageSync('assignments', assignments);
    }
    // 清除相关申请
    var applications = wx.getStorageSync('applications') || [];
    applications = applications.filter(function(a) { return !(a.userRole === 'caregiver' && a.userId === userId); });
    wx.setStorageSync('applications', applications);
  },

  // 护士给护工/家属分配/取消分配患者
  toggleCaregiverPatient: function(userId, patientId, assign) {
    if (assign) {
      this.assignCaregiver(userId, patientId);
    } else {
      this.unassignCaregiver(userId, patientId);
    }
  },

  // 获取病人绑定列表
  getPatientBindingList: function() {
    var bindings = wx.getStorageSync('userBindings') || [];
    var list = [];
    for (var i = 0; i < bindings.length; i++) {
      if (bindings[i].role === 'patient') {
        var item = Object.assign({}, bindings[i]);
        // 补充关联的患者信息
        var patients = this.getPatients();
        for (var j = 0; j < patients.length; j++) {
          if (patients[j].id === item.patientId) {
            item.patientInfo = { id: patients[j].id, name: patients[j].name, bedNo: patients[j].bedNo };
            break;
          }
        }
        // 查询申请状态
        var appList = wx.getStorageSync('applications') || [];
        item.appStatus = 'none';
        for (var k = 0; k < appList.length; k++) {
          if (appList[k].userRole === 'patient' && appList[k].patientId === item.patientId) {
            item.appStatus = appList[k].status;
            break;
          }
        }
        list.push(item);
      }
    }
    return list;
  },

  // 护士添加病人账号
  addPatientBinding: function(name, phone, patientId) {
    var bindings = wx.getStorageSync('userBindings') || [];
    for (var i = 0; i < bindings.length; i++) {
      if (bindings[i].phone === phone) return null;
    }
    var userId = 'U' + Date.now();
    var binding = { phone: phone, role: 'patient', userId: userId, name: name, bound: true, patientId: patientId };
    bindings.push(binding);
    wx.setStorageSync('userBindings', bindings);
    // 自动通过申请
    var applications = wx.getStorageSync('applications') || [];
    var found = false;
    for (var j = 0; j < applications.length; j++) {
      if (applications[j].userRole === 'patient' && applications[j].patientId === patientId) {
        applications[j].status = 'approved';
        applications[j].reviewedAt = Date.now();
        found = true;
      }
    }
    if (!found) {
      applications.push({
        id: 'A' + Date.now(), userRole: 'patient', userName: name,
        patientId: patientId, patientName: name, status: 'approved',
        createdAt: Date.now(), reviewedAt: Date.now(), reviewedBy: 'nurse'
      });
    }
    wx.setStorageSync('applications', applications);
    return binding;
  },

  // 护士删除病人账号
  removePatientBinding: function(phone) {
    var bindings = wx.getStorageSync('userBindings') || [];
    var userId = '';
    bindings = bindings.filter(function(b) {
      if (b.phone === phone && b.role === 'patient') { userId = b.userId; return false; }
      return true;
    });
    wx.setStorageSync('userBindings', bindings);
    // 清除相关申请
    var applications = wx.getStorageSync('applications') || [];
    applications = applications.filter(function(a) { return !(a.userRole === 'patient' && a.userId === userId); });
    wx.setStorageSync('applications', applications);
  },

  // 护士编辑病人绑定（更换关联患者）
  updatePatientBinding: function(phone, newPatientId) {
    var bindings = wx.getStorageSync('userBindings') || [];
    for (var i = 0; i < bindings.length; i++) {
      if (bindings[i].phone === phone && bindings[i].role === 'patient') {
        bindings[i].patientId = newPatientId;
        wx.setStorageSync('userBindings', bindings);
        return true;
      }
    }
    return false;
  },

  // 生成演示数据
  generateMockData() {
    var patients = [
      // 1-10 男
      { name: '张秀英', age: 68, gender: 1, bedNo: '1', department: '心内科', diagnosis: '高血压、冠心病' },
      { name: '王建国', age: 72, gender: 1, bedNo: '2', department: '心内科', diagnosis: '慢性肾功能不全' },
      { name: '刘德华', age: 60, gender: 1, bedNo: '3', department: '心内科', diagnosis: '肺炎、高血压' },
      { name: '赵明远', age: 58, gender: 1, bedNo: '4', department: '心内科', diagnosis: '心律失常' },
      { name: '孙志强', age: 75, gender: 1, bedNo: '5', department: '心内科', diagnosis: '心力衰竭' },
      { name: '周国平', age: 63, gender: 1, bedNo: '6', department: '心内科', diagnosis: '冠心病、心绞痛' },
      { name: '吴大伟', age: 70, gender: 1, bedNo: '7', department: '心内科', diagnosis: '心房颤动' },
      { name: '郑海涛', age: 55, gender: 1, bedNo: '8', department: '心内科', diagnosis: '高血压肾病' },
      { name: '冯德明', age: 80, gender: 1, bedNo: '9', department: '心内科', diagnosis: '主动脉瓣狭窄' },
      { name: '陈伟杰', age: 48, gender: 1, bedNo: '10', department: '心内科', diagnosis: '心肌炎恢复期' },
      // 11-25 女
      { name: '李玉兰', age: 55, gender: 2, bedNo: '11', department: '心内科', diagnosis: '2型糖尿病' },
      { name: '陈淑芬', age: 45, gender: 2, bedNo: '12', department: '心内科', diagnosis: '术后恢复期' },
      { name: '杨秀兰', age: 62, gender: 2, bedNo: '13', department: '心内科', diagnosis: '高血压、糖尿病' },
      { name: '黄丽华', age: 50, gender: 2, bedNo: '14', department: '心内科', diagnosis: '冠心病' },
      { name: '何美珍', age: 73, gender: 2, bedNo: '15', department: '心内科', diagnosis: '心功能不全' },
      { name: '林淑芳', age: 67, gender: 2, bedNo: '16', department: '心内科', diagnosis: '房颤、甲亢' },
      { name: '郑桂英', age: 59, gender: 2, bedNo: '17', department: '心内科', diagnosis: '风湿性心脏病' },
      { name: '罗玉梅', age: 41, gender: 2, bedNo: '18', department: '心内科', diagnosis: '心肌病' },
      { name: '梁凤英', age: 76, gender: 2, bedNo: '19', department: '心内科', diagnosis: '高血压3级' },
      { name: '宋雪梅', age: 53, gender: 2, bedNo: '20', department: '心内科', diagnosis: '肺心病' },
      { name: '唐玉珍', age: 69, gender: 2, bedNo: '21', department: '心内科', diagnosis: '动脉硬化' },
      { name: '许丽娟', age: 46, gender: 2, bedNo: '22', department: '心内科', diagnosis: '心脏瓣膜病' },
      { name: '韩秀珍', age: 78, gender: 2, bedNo: '23', department: '心内科', diagnosis: '心梗后恢复' },
      { name: '冯桂兰', age: 56, gender: 2, bedNo: '24', department: '心内科', diagnosis: '高血压心脏病' },
      { name: '董美琴', age: 64, gender: 2, bedNo: '25', department: '心内科', diagnosis: '心律不齐' },
      // 26-35 男
      { name: '蒋文斌', age: 82, gender: 1, bedNo: '26', department: '心内科', diagnosis: '冠心病合并高血压' },
      { name: '沈国华', age: 66, gender: 1, bedNo: '27', department: '心内科', diagnosis: '心绞痛频发' },
      { name: '韦志豪', age: 52, gender: 1, bedNo: '28', department: '心内科', diagnosis: '扩张型心肌病' },
      { name: '秦建平', age: 77, gender: 1, bedNo: '29', department: '心内科', diagnosis: '房室传导阻滞' },
      { name: '阎德福', age: 85, gender: 1, bedNo: '30', department: '心内科', diagnosis: '心衰加重' },
      { name: '薛永强', age: 44, gender: 1, bedNo: '31', department: '心内科', diagnosis: '肺动脉高压' },
      { name: '尹国安', age: 61, gender: 1, bedNo: '32', department: '心内科', diagnosis: '主动脉夹层术后' },
      { name: '段学文', age: 71, gender: 1, bedNo: '33', department: '心内科', diagnosis: '房颤伴脑梗' },
      { name: '侯明辉', age: 49, gender: 1, bedNo: '34', department: '心内科', diagnosis: '室性早搏' },
      { name: '彭文涛', age: 57, gender: 1, bedNo: '35', department: '心内科', diagnosis: '高血压危象' },
      // 36-50 女
      { name: '曹月娥', age: 74, gender: 2, bedNo: '36', department: '心内科', diagnosis: '二尖瓣关闭不全' },
      { name: '邓秀芬', age: 60, gender: 2, bedNo: '37', department: '心内科', diagnosis: '感染性心内膜炎' },
      { name: '萧丽萍', age: 43, gender: 2, bedNo: '38', department: '心内科', diagnosis: '围产期心肌病' },
      { name: '田淑云', age: 81, gender: 2, bedNo: '39', department: '心内科', diagnosis: '心动过缓' },
      { name: '潘玉华', age: 65, gender: 2, bedNo: '40', department: '心内科', diagnosis: '心包积液' },
      { name: '袁美兰', age: 54, gender: 2, bedNo: '41', department: '心内科', diagnosis: '心肌梗死恢复' },
      { name: '蔡秀华', age: 79, gender: 2, bedNo: '42', department: '心内科', diagnosis: '心脏起搏器术后' },
      { name: '贾玉兰', age: 47, gender: 2, bedNo: '43', department: '心内科', diagnosis: '肥厚型心肌病' },
      { name: '夏丽芳', age: 68, gender: 2, bedNo: '44', department: '心内科', diagnosis: '高血压眼底病变' },
      { name: '钟淑珍', age: 56, gender: 2, bedNo: '45', department: '心内科', diagnosis: '心脏神经官能症' },
      { name: '汪慧敏', age: 42, gender: 2, bedNo: '46', department: '心内科', diagnosis: '室上性心动过速' },
      { name: '傅秀英', age: 70, gender: 2, bedNo: '47', department: '心内科', diagnosis: '退行性心脏瓣膜病' },
      { name: '罗美芳', age: 83, gender: 2, bedNo: '48', department: '心内科', diagnosis: '多器官功能不全' },
      { name: '毕玉珍', age: 51, gender: 2, bedNo: '49', department: '心内科', diagnosis: '高血压合并肾病' },
      { name: '郝丽华', age: 63, gender: 2, bedNo: '50', department: '心内科', diagnosis: '心房扑动' }
    ];
    // 生理参数模板：饮水量、尿量、体重、体重趋势、收缩压、舒张压、心率、体温
    var pf = [
      { w: 1800, u: 1200, wt: 65.0, wdt: -0.02, bs: 145, bd: 92, hr: 78, tp: 36.5 },
      { w: 1500, u: 900,  wt: 70.0, wdt: 0.01,  bs: 130, bd: 85, hr: 68, tp: 36.6 },
      { w: 1600, u: 1100, wt: 75.0, wdt: -0.03, bs: 138, bd: 88, hr: 82, tp: 37.0 },
      { w: 1700, u: 1000, wt: 68.0, wdt: 0.00,  bs: 125, bd: 80, hr: 72, tp: 36.4 },
      { w: 1200, u: 800,  wt: 72.0, wdt: -0.04, bs: 155, bd: 95, hr: 90, tp: 36.7 },
      { w: 1900, u: 1300, wt: 66.0, wdt: 0.01,  bs: 135, bd: 86, hr: 74, tp: 36.3 },
      { w: 1600, u: 1050, wt: 78.0, wdt: -0.01, bs: 142, bd: 90, hr: 80, tp: 36.5 },
      { w: 2100, u: 1400, wt: 62.0, wdt: 0.02,  bs: 148, bd: 95, hr: 76, tp: 36.6 },
      { w: 1300, u: 750,  wt: 58.0, wdt: -0.02, bs: 160, bd: 98, hr: 85, tp: 36.8 },
      { w: 2000, u: 1350, wt: 73.0, wdt: 0.01,  bs: 118, bd: 75, hr: 70, tp: 36.4 },
      { w: 2200, u: 1500, wt: 58.0, wdt: -0.01, bs: 118, bd: 75, hr: 72, tp: 36.4 },
      { w: 2000, u: 1300, wt: 52.0, wdt: 0.03,  bs: 112, bd: 70, hr: 75, tp: 36.8 },
      { w: 1800, u: 1150, wt: 63.0, wdt: -0.02, bs: 140, bd: 88, hr: 76, tp: 36.5 },
      { w: 1700, u: 1100, wt: 55.0, wdt: 0.00,  bs: 122, bd: 78, hr: 68, tp: 36.3 },
      { w: 1400, u: 850,  wt: 60.0, wdt: -0.03, bs: 150, bd: 92, hr: 84, tp: 36.7 },
      { w: 1900, u: 1250, wt: 56.0, wdt: 0.01,  bs: 132, bd: 84, hr: 78, tp: 36.6 },
      { w: 1600, u: 1000, wt: 67.0, wdt: -0.01, bs: 136, bd: 86, hr: 72, tp: 36.4 },
      { w: 2100, u: 1400, wt: 50.0, wdt: 0.02,  bs: 115, bd: 72, hr: 66, tp: 36.5 },
      { w: 1300, u: 800,  wt: 71.0, wdt: -0.04, bs: 158, bd: 96, hr: 88, tp: 36.9 },
      { w: 1750, u: 1150, wt: 59.0, wdt: 0.00,  bs: 126, bd: 80, hr: 70, tp: 36.3 },
      { w: 1850, u: 1200, wt: 64.0, wdt: -0.02, bs: 142, bd: 90, hr: 80, tp: 36.6 },
      { w: 1650, u: 1080, wt: 54.0, wdt: 0.01,  bs: 120, bd: 76, hr: 68, tp: 36.4 },
      { w: 1450, u: 900,  wt: 69.0, wdt: -0.03, bs: 152, bd: 94, hr: 86, tp: 36.8 },
      { w: 1950, u: 1300, wt: 57.0, wdt: 0.02,  bs: 128, bd: 82, hr: 74, tp: 36.5 },
      { w: 1700, u: 1100, wt: 61.0, wdt: -0.01, bs: 134, bd: 85, hr: 72, tp: 36.4 },
      { w: 1100, u: 650,  wt: 80.0, wdt: -0.05, bs: 162, bd: 100, hr: 92, tp: 37.1 },
      { w: 1550, u: 1000, wt: 66.0, wdt: -0.02, bs: 144, bd: 91, hr: 78, tp: 36.5 },
      { w: 1800, u: 1150, wt: 70.0, wdt: 0.00,  bs: 138, bd: 87, hr: 76, tp: 36.6 },
      { w: 1350, u: 820,  wt: 74.0, wdt: -0.03, bs: 156, bd: 97, hr: 88, tp: 36.9 },
      { w: 1050, u: 600,  wt: 76.0, wdt: -0.04, bs: 165, bd: 102, hr: 95, tp: 37.2 },
      { w: 2000, u: 1350, wt: 63.0, wdt: 0.01,  bs: 125, bd: 80, hr: 70, tp: 36.4 },
      { w: 1750, u: 1100, wt: 71.0, wdt: -0.02, bs: 148, bd: 93, hr: 82, tp: 36.7 },
      { w: 1900, u: 1250, wt: 69.0, wdt: 0.00,  bs: 136, bd: 86, hr: 74, tp: 36.5 },
      { w: 1600, u: 1000, wt: 60.0, wdt: 0.01,  bs: 118, bd: 75, hr: 66, tp: 36.3 },
      { w: 2100, u: 1400, wt: 58.0, wdt: 0.02,  bs: 140, bd: 89, hr: 76, tp: 36.5 },
      { w: 1500, u: 950,  wt: 65.0, wdt: -0.02, bs: 132, bd: 84, hr: 72, tp: 36.4 },
      { w: 1700, u: 1050, wt: 53.0, wdt: 0.01,  bs: 115, bd: 73, hr: 68, tp: 36.3 },
      { w: 1800, u: 1200, wt: 62.0, wdt: -0.01, bs: 146, bd: 92, hr: 80, tp: 36.6 },
      { w: 1400, u: 880,  wt: 72.0, wdt: -0.03, bs: 152, bd: 95, hr: 84, tp: 36.7 },
      { w: 1650, u: 1080, wt: 56.0, wdt: 0.01,  bs: 122, bd: 78, hr: 70, tp: 36.4 },
      { w: 1850, u: 1200, wt: 68.0, wdt: -0.02, bs: 138, bd: 88, hr: 78, tp: 36.5 },
      { w: 1200, u: 700,  wt: 77.0, wdt: -0.04, bs: 160, bd: 98, hr: 90, tp: 37.0 },
      { w: 1900, u: 1250, wt: 51.0, wdt: 0.02,  bs: 110, bd: 70, hr: 64, tp: 36.3 },
      { w: 1550, u: 1000, wt: 66.0, wdt: 0.00,  bs: 130, bd: 83, hr: 74, tp: 36.5 },
      { w: 1750, u: 1150, wt: 59.0, wdt: -0.01, bs: 142, bd: 90, hr: 76, tp: 36.5 },
      { w: 2000, u: 1300, wt: 54.0, wdt: 0.01,  bs: 126, bd: 80, hr: 70, tp: 36.4 },
      { w: 1500, u: 950,  wt: 73.0, wdt: -0.02, bs: 148, bd: 94, hr: 82, tp: 36.7 },
      { w: 1100, u: 650,  wt: 69.0, wdt: -0.03, bs: 155, bd: 96, hr: 86, tp: 36.8 },
      { w: 1800, u: 1180, wt: 61.0, wdt: 0.01,  bs: 128, bd: 82, hr: 72, tp: 36.4 },
      { w: 1650, u: 1050, wt: 57.0, wdt: -0.01, bs: 135, bd: 86, hr: 74, tp: 36.5 }
    ];
    // 护工/家属数据（20人）
    var caregivers = [
      { name: '马春花', phone: '13800000001', role: 'caregiver' },
      { name: '赵小红', phone: '13800000002', role: 'caregiver' },
      { name: '钱秀芳', phone: '13800000003', role: 'caregiver' },
      { name: '孙丽君', phone: '13800000004', role: 'caregiver' },
      { name: '李国庆', phone: '13800000005', role: 'caregiver' },
      { name: '周德才', phone: '13800000006', role: 'caregiver' },
      { name: '吴建设', phone: '13800000007', role: 'caregiver' },
      { name: '郑保安', phone: '13800000008', role: 'caregiver' },
      { name: '王大力', phone: '13800000009', role: 'caregiver' },
      { name: '冯志远', phone: '13800000010', role: 'caregiver' },
      { name: '张伟民', phone: '13800000011', role: 'caregiver' },
      { name: '刘建明', phone: '13800000012', role: 'caregiver' },
      { name: '陈永强', phone: '13800000013', role: 'caregiver' },
      { name: '杨国荣', phone: '13800000014', role: 'caregiver' },
      { name: '张芳芳', phone: '13900000001', role: 'patient' },
      { name: '王明辉', phone: '13900000002', role: 'patient' },
      { name: '刘文杰', phone: '13900000003', role: 'patient' },
      { name: '陈建华', phone: '13900000004', role: 'patient' },
      { name: '赵国强', phone: '13900000005', role: 'patient' },
      { name: '李建军', phone: '13900000006', role: 'patient' }
    ];
    // 清除旧数据
    wx.clearStorageSync();
    var list = [];
    for (var i = 0; i < patients.length; i++) {
      patients[i].id = 'P' + (i + 1);
      patients[i].createdAt = Date.now() - 30 * 86400000;
      list.push(patients[i]);
    }
    wx.setStorageSync('patients', list);
    wx.setStorageSync('currentPatientId', 'P1');
    // 生成护工/家属绑定和分配关系
    var bindings = [];
    var assignments = [];
    for (var ci = 0; ci < caregivers.length; ci++) {
      var cg = caregivers[ci];
      var userId = 'C' + (ci + 1);
      // 病人角色用 U 前缀
      if (cg.role === 'patient') {
        userId = 'U' + (ci + 1 - 14);
      }
      bindings.push({ phone: cg.phone, role: cg.role, userId: userId, name: cg.name, bound: true, patientId: '' });
      // 每人分配 2-3 位患者（仅护工角色）
      if (cg.role === 'caregiver') {
        var assignCount = 2 + (ci % 2);
        for (var ai = 0; ai < assignCount; ai++) {
          var pidx = (ci * 3 + ai) % list.length;
          assignments.push({ userId: userId, userRole: 'caregiver', patientId: list[pidx].id, assignedAt: Date.now() });
        }
      }
    }
    // 将2222护工和3333病人的预置绑定替换循环中的同名记录（使用独立userId）
    // 护工2222：userId='C_TEST_2222'，分配 P1、P2、P3
    bindings.push({ phone: '13800002222', role: 'caregiver', userId: 'C_TEST_2222', name: '护工张阿姨', bound: true, patientId: 'P1' });
    bindings.push({ phone: '13800003333', role: 'patient', userId: 'U_TEST_3333', name: '张秀英', bound: true, patientId: 'P1' });
    // 护工2222分配3个患者
    assignments.push({ userId: 'C_TEST_2222', userRole: 'caregiver', patientId: 'P1', assignedAt: Date.now() });
    assignments.push({ userId: 'C_TEST_2222', userRole: 'caregiver', patientId: 'P2', assignedAt: Date.now() });
    assignments.push({ userId: 'C_TEST_2222', userRole: 'caregiver', patientId: 'P11', assignedAt: Date.now() });
    wx.setStorageSync('userBindings', bindings);
    wx.setStorageSync('assignments', assignments);
    // 为护工2222和病人3333预置已通过的申请
    var testApplications = [
      {
        id: 'ATEST_C2222_P1', userRole: 'caregiver', userId: 'C_TEST_2222', userName: '护工张阿姨',
        patientId: 'P1', patientName: '张秀英', status: 'approved',
        createdAt: Date.now() - 86400000, reviewedAt: Date.now() - 43200000, reviewedBy: 'nurse'
      },
      {
        id: 'ATEST_U3333_P1', userRole: 'patient', userId: 'U_TEST_3333', userName: '张秀英',
        patientId: 'P1', patientName: '张秀英', status: 'approved',
        createdAt: Date.now() - 86400000, reviewedAt: Date.now() - 43200000, reviewedBy: 'nurse'
      }
    ];
    wx.setStorageSync('applications', testApplications);
    // 生成健康记录
    var today = new Date();
    for (var pi = 0; pi < list.length; pi++) {
      var pid = list[pi].id;
      var p = pf[pi];
      var recs = {};
      var wa = p.wt;
      for (var day = 29; day >= 0; day--) {
        var d = new Date(today);
        d.setDate(d.getDate() - day);
        var ds = d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
        var dr = [];
        var bt = d.getTime();
        var ab = Math.random() < 0.1;
        function rn(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }
        function rf(a, b) { return Math.round((a + Math.random() * (b - a)) * 10) / 10; }
        function pt(h) { return ('0' + h).slice(-2) + ':' + ('0' + rn(0, 5) * 10).slice(-2); }
        for (var j = 0; j < rn(2, 3); j++) {
          var wv = ab && j === 0 ? rn(800, 1200) : rn(Math.floor(p.w * 0.35), Math.floor(p.w * 0.55));
          dr.push({ type: 'waterIntake', value: wv, time: pt([7, 12, 18][j]), note: ['早', '中', '晚'][j] + '餐后', date: ds, timestamp: bt + 3600000 * [7, 12, 18][j] });
        }
        for (var j2 = 0; j2 < rn(2, 3); j2++) {
          dr.push({ type: 'urineOutput', value: rn(Math.floor(p.u * 0.3), Math.floor(p.u * 0.5)), time: pt([10, 15, 20][j2]), note: '', date: ds, timestamp: bt + 3600000 * [10, 15, 20][j2] });
        }
        wa += p.wdt;
        dr.push({ type: 'weight', value: rf(wa - 0.3, wa + 0.3), time: pt(6), note: '晨起空腹', date: ds, timestamp: bt + 21600000 });
        for (var j3 = 0; j3 < rn(1, 2); j3++) {
          var sys = ab ? rn(p.bs + 5, p.bs + 25) : rn(p.bs - 10, p.bs + 10);
          var dia = ab ? rn(p.bd + 5, p.bd + 15) : rn(p.bd - 8, p.bd + 8);
          dr.push({ type: 'bloodPressureSystolic', value: sys, time: pt([8, 16][j3]), note: sys + '/' + dia, date: ds, timestamp: bt + 3600000 * [8, 16][j3] });
          dr.push({ type: 'bloodPressureDiastolic', value: dia, time: pt([8, 16][j3]), note: sys + '/' + dia, date: ds, timestamp: bt + 3600000 * [8, 16][j3] + 1 });
        }
        dr.push({ type: 'heartRate', value: rn(p.hr - 8, p.hr + 12), time: pt(8), note: '', date: ds, timestamp: bt + 28800002 });
        var tv = (pi === 2 && day < 15) ? rf(37.5, 38.5) : rf(p.tp - 0.3, p.tp + 0.5);
        dr.push({ type: 'temperature', value: tv, time: pt(7), note: tv > 37.3 ? '发热' : '', date: ds, timestamp: bt + 25200003 });
        recs[ds] = dr;
      }
      wx.setStorageSync('records_' + pid, recs);
    }
    // 重新初始化存储结构
    this.initStorage();
  }
});
