// pages/patient-detail/patient-detail.js
var app = getApp();

Page({
  data: {
    isEdit: false,
    patientId: '',
    canManage: true,
    canSetRange: true,
    form: {
      name: '',
      age: '',
      gender: 1,
      idCard: '',
      bedNo: '',
      department: '心内科',
      diagnosis: '',
      phone: '',
      notes: ''
    },
    // 指标范围设置（仅编辑模式）
    showRangeSettings: false,
    rangeItems: [],
    // OCR 识别
    ocrResult: null,
    ocrLoading: false
  },

  onLoad: function(options) {
    this.setData({
      canManage: app.hasPermission('canManage'),
      canSetRange: app.hasPermission('canSetRange')
    });

    // 非护士不能编辑患者信息
    if (!app.hasPermission('canManage') && options.id) {
      this.setData({ isEdit: true, patientId: options.id });
      this.loadPatient(options.id);
      return;
    }

    var indicators = app.globalData.indicators;
    var keys = ['waterIntake', 'urineOutput', 'weight', 'bloodPressureSystolic', 'bloodPressureDiastolic', 'heartRate', 'temperature'];
    var rangeItems = [];
    for (var i = 0; i < keys.length; i++) {
      var k = keys[i];
      var ind = indicators[k];
      rangeItems.push({
        key: k,
        name: ind.name,
        icon: ind.icon,
        unit: ind.unit,
        color: ind.color,
        defaultMin: ind.normalRange.min,
        defaultMax: ind.normalRange.max,
        customMin: '',
        customMax: ''
      });
    }
    this.setData({ rangeItems: rangeItems });

    if (options.id) {
      this.setData({ isEdit: true, patientId: options.id });
      this.loadPatient(options.id);
    }

    // 如果指定了预分配床位号（从空床位长按跳转）
    if (options.preBed) {
      this.setData({ 'form.bedNo': options.preBed });
    }
  },

  // 加载患者信息
  loadPatient: function(id) {
    var patients = app.getPatients();
    var patient = null;
    for (var i = 0; i < patients.length; i++) {
      if (patients[i].id === id) { patient = patients[i]; break; }
    }
    if (patient) {
      this.setData({
        form: {
          name: patient.name || '',
          age: String(patient.age || ''),
          gender: patient.gender || 1,
          idCard: patient.idCard || '',
          bedNo: patient.bedNo || '',
          department: patient.department || '',
          diagnosis: patient.diagnosis || '',
          phone: patient.phone || '',
          notes: patient.notes || ''
        }
      });

      // 加载自定义范围
      if (patient.customRanges) {
        var rangeItems = this.data.rangeItems;
        for (var j = 0; j < rangeItems.length; j++) {
          var rk = rangeItems[j].key;
          if (patient.customRanges[rk]) {
            rangeItems[j].customMin = String(patient.customRanges[rk].min);
            rangeItems[j].customMax = String(patient.customRanges[rk].max);
          }
        }
        this.setData({ rangeItems: rangeItems });
      }
    }
  },

  // 表单输入
  onInput: function(e) {
    var field = e.currentTarget.dataset.field;
    var data = {};
    data['form.' + field] = e.detail.value;
    this.setData(data);
  },

  // 性别切换
  onGenderChange: function(e) {
    this.setData({ 'form.gender': parseInt(e.detail.value) });
  },

  // 展开/收起范围设置
  toggleRangeSettings: function() {
    this.setData({ showRangeSettings: !this.data.showRangeSettings });
  },

  // 范围输入
  onRangeInput: function(e) {
    var index = e.currentTarget.dataset.index;
    var field = e.currentTarget.dataset.field;
    var rangeItems = this.data.rangeItems;
    rangeItems[index][field] = e.detail.value;
    this.setData({ rangeItems: rangeItems });
  },

  // 重置某个指标范围为默认
  resetRange: function(e) {
    var index = e.currentTarget.dataset.index;
    var rangeItems = this.data.rangeItems;
    rangeItems[index].customMin = '';
    rangeItems[index].customMax = '';
    this.setData({ rangeItems: rangeItems });
    wx.showToast({ title: '已重置为默认值', icon: 'success' });
  },

  // 表单验证
  validateForm: function() {
    var name = this.data.form.name;
    var age = this.data.form.age;
    if (!name.trim()) {
      wx.showToast({ title: '请输入患者姓名', icon: 'none' });
      return false;
    }
    if (!age || parseInt(age) <= 0 || parseInt(age) > 150) {
      wx.showToast({ title: '请输入有效年龄', icon: 'none' });
      return false;
    }
    return true;
  },

  // 收集自定义范围数据
  collectCustomRanges: function() {
    var rangeItems = this.data.rangeItems;
    var customRanges = {};
    for (var i = 0; i < rangeItems.length; i++) {
      var item = rangeItems[i];
      if (item.customMin !== '' && item.customMax !== '') {
        var minVal = parseFloat(item.customMin);
        var maxVal = parseFloat(item.customMax);
        if (!isNaN(minVal) && !isNaN(maxVal) && minVal < maxVal) {
          customRanges[item.key] = { min: minVal, max: maxVal };
        }
      }
    }
    return customRanges;
  },

  // 模拟生成患者信息
  generateRandomPatient: function() {
    var surnames = ['张', '王', '李', '赵', '陈', '杨', '黄', '周', '吴', '徐', '孙', '马', '胡', '朱', '郭', '何', '林', '罗', '高', '梁', '郑', '谢', '宋', '唐', '韩', '冯', '许', '邓', '曹', '彭', '曾', '萧', '田', '董', '潘', '袁', '蒋', '蔡', '余', '杜', '叶', '程', '苏', '魏', '吕', '丁', '任', '沈', '姚'];
    var maleNames = ['伟', '强', '磊', '军', '勇', '杰', '涛', '明', '辉', '鹏', '华', '飞', '刚', '斌', '峰', '超', '波', '平', '浩', '志'];
    var femaleNames = ['芳', '娟', '敏', '静', '丽', '秀', '英', '华', '慧', '巧', '美', '娜', '萍', '玉', '雪', '琳', '晶', '欣', '蕾', '倩'];
    var diagnoses = [
      '高血压', '2型糖尿病', '冠心病', '肺炎', '心律失常', '心力衰竭',
      '慢性肾功能不全', '心肌炎', '高血压合并糖尿病', '脑梗死后遗症',
      '肺部感染', '心房颤动', '心绞痛', '高血压心脏病', '糖尿病肾病',
      '支气管炎', '慢性阻塞性肺病', '风湿性心脏病', '心肌病', '退行性心脏瓣膜病'
    ];

    // 随机选姓+名
    var surname = surnames[Math.floor(Math.random() * surnames.length)];
    var gender = Math.random() > 0.5 ? 1 : 2;
    var givenNames = gender === 1 ? maleNames : femaleNames;
    var given = givenNames[Math.floor(Math.random() * givenNames.length)];
    var name = surname + given;
    if (Math.random() > 0.5) {
      name += givenNames[Math.floor(Math.random() * givenNames.length)];
    }

    // 随机年龄 25-90
    var age = Math.floor(Math.random() * 66) + 25;

    // 分配床位：只分配 1-99 范围内尚未占用的床位号
    var allPatients = app.getVisiblePatients();
    var usedBeds = {};
    for (var i = 0; i < allPatients.length; i++) {
      if (allPatients[i].bedNo) usedBeds[allPatients[i].bedNo] = true;
    }
    var bedNo = '';
    for (var n = 1; n <= 99; n++) {
      if (!usedBeds[String(n)]) { bedNo = String(n); break; }
    }
    if (!bedNo) {
      wx.showToast({ title: '床位已满（99床）', icon: 'none' });
      return;
    }

    // 随机诊断 1-2 个
    var diagnosis = diagnoses[Math.floor(Math.random() * diagnoses.length)];
    if (Math.random() > 0.6) {
      var diag2 = diagnoses[Math.floor(Math.random() * diagnoses.length)];
      if (diag2 !== diagnosis) diagnosis += '、' + diag2;
    }

    // 随机手机号
    var prefixes = ['138', '139', '136', '137', '135', '158', '159', '188', '189', '186'];
    var phone = prefixes[Math.floor(Math.random() * prefixes.length)];
    for (var p = 0; p < 8; p++) phone += Math.floor(Math.random() * 10);

    // 随机身份证号（18位，简单模拟）
    var year = new Date().getFullYear() - age;
    var month = String(Math.floor(Math.random() * 12) + 1);
    if (month.length < 2) month = '0' + month;
    var day = String(Math.floor(Math.random() * 28) + 1);
    if (day.length < 2) day = '0' + day;
    var area = String(Math.floor(Math.random() * 90) + 10);
    if (area.length < 6) { while (area.length < 6) area = area + String(Math.floor(Math.random() * 10)); }
    var seq = String(Math.floor(Math.random() * 900) + 100);
    var idCard = area + year + month + day + seq + (Math.random() > 0.5 ? '1' : '0');
    // 最后一位校验码（简单随机）
    var checkCodes = ['0','1','2','3','4','5','6','7','8','9','X'];
    idCard = idCard.substring(0, 17) + checkCodes[Math.floor(Math.random() * checkCodes.length)];

    var customRanges = {};
    this.setData({
      'form.name': name,
      'form.age': String(age),
      'form.gender': gender,
      'form.idCard': idCard,
      'form.bedNo': bedNo,
      'form.department': '心内科',
      'form.diagnosis': diagnosis,
      'form.phone': phone,
      'form.notes': '',
      ocrResult: null
    });

    // 自动保存到存储，立即添加到床位卡片
    var id = app.addPatient({
      name: name,
      age: age,
      gender: gender,
      idCard: idCard,
      bedNo: bedNo,
      department: '心内科',
      diagnosis: diagnosis,
      phone: phone,
      notes: '',
      customRanges: customRanges
    });
    app.setCurrentPatient(id);
    wx.showToast({ title: '已生成并添加：' + bedNo + '床 ' + name, icon: 'success' });
    setTimeout(function() { wx.navigateBack(); }, 500);
  },

  // 拍照识别身份证
  scanIdCard: function() {
    if (this.data.ocrLoading) return;
    var that = this;
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['camera', 'album'],
      sizeType: ['compressed'],
      success: function(res) {
        var tempFilePath = res.tempFiles[0].tempFilePath;
        that.setData({ ocrLoading: true, ocrResult: null });
        wx.showLoading({ title: '识别中...', mask: true });
        // 尝试调用微信 OCR 接口（需要后端配合，此处模拟演示）
        that.doOCRDemo(tempFilePath);
      },
      fail: function() {}
    });
  },

  // OCR 识别（演示模式：模拟识别结果）
  // 正式使用时替换为 wx.request 调用后端 OCR 接口
  doOCRDemo: function(filePath) {
    var that = this;
    // 模拟网络请求延迟
    setTimeout(function() {
      wx.hideLoading();
      that.setData({ ocrLoading: false });
      that.setData({
        ocrResult: {
          success: false,
          errorMsg: 'OCR 识别需要后端服务支持，请联系管理员配置后使用。\n\n正式接入步骤：\n1. 后端调用微信 cv/ocr/idcard 接口\n2. 前端通过 wx.uploadFile 上传图片到后端\n3. 后端返回识别结果后自动填充表单'
        }
      });
    }, 1500);
  },

  // 正式 OCR 调用示例（需配合后端）
  // doOCRReal: function(filePath) {
  //   var that = this;
  //   wx.uploadFile({
  //     url: 'https://your-server.com/api/ocr/idcard',
  //     filePath: filePath,
  //     name: 'img',
  //     success: function(res) {
  //       wx.hideLoading();
  //       that.setData({ ocrLoading: false });
  //       try {
  //         var data = JSON.parse(res.data);
  //         if (data.errcode === 0 && data.type === 'Front') {
  //           // 从身份证号推算年龄
  //           var age = that.calcAgeFromIdCard(data.id);
  //           var gender = data.gender === '男' ? 1 : 2;
  //           that.setData({
  //             ocrResult: { success: true, name: data.name, gender: data.gender, id: data.id },
  //             'form.name': data.name || '',
  //             'form.gender': gender,
  //             'form.idCard': data.id || '',
  //             'form.age': age ? String(age) : ''
  //           });
  //           wx.showToast({ title: '识别成功', icon: 'success' });
  //         } else {
  //           that.setData({
  //             ocrResult: { success: false, errorMsg: '请确保拍摄的是身份证人像面（正面）' }
  //           });
  //         }
  //       } catch (e) {
  //         that.setData({ ocrResult: { success: false, errorMsg: '识别结果解析失败，请重试' } });
  //       }
  //     },
  //     fail: function() {
  //       wx.hideLoading();
  //       that.setData({ ocrLoading: false });
  //       that.setData({ ocrResult: { success: false, errorMsg: '网络请求失败，请检查网络后重试' } });
  //     }
  //   });
  // },

  // 从身份证号推算年龄
  calcAgeFromIdCard: function(idCard) {
    if (!idCard || idCard.length < 15) return null;
    var birthStr;
    if (idCard.length === 18) {
      birthStr = idCard.substring(6, 14); // YYYYMMDD
    } else {
      birthStr = '19' + idCard.substring(6, 12); // 15位补19
    }
    var year = parseInt(birthStr.substring(0, 4));
    var month = parseInt(birthStr.substring(4, 6));
    var day = parseInt(birthStr.substring(6, 8));
    var birthDate = new Date(year, month - 1, day);
    var now = new Date();
    var age = now.getFullYear() - birthDate.getFullYear();
    var m = now.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < birthDate.getDate())) {
      age--;
    }
    return age > 0 && age <= 150 ? age : null;
  },

  // 保存
  savePatient: function() {
    if (!this.validateForm()) return;

    var that = this;
    var form = this.data.form;
    var isEdit = this.data.isEdit;
    var patientId = this.data.patientId;
    var customRanges = this.collectCustomRanges();

    if (isEdit) {
      // 更新
      var patients = app.getPatients();
      var index = -1;
      for (var i = 0; i < patients.length; i++) {
        if (patients[i].id === patientId) { index = i; break; }
      }
      if (index !== -1) {
        patients[index] = {
          id: patientId,
          createdAt: patients[index].createdAt,
          name: form.name.trim(),
          age: parseInt(form.age),
          gender: form.gender,
          idCard: form.idCard.trim(),
          bedNo: form.bedNo.trim(),
          department: form.department.trim(),
          diagnosis: form.diagnosis.trim(),
          phone: form.phone.trim(),
          notes: form.notes.trim(),
          customRanges: customRanges
        };
        wx.setStorageSync('patients', patients);
        wx.showToast({ title: '保存成功', icon: 'success' });
        setTimeout(function() { wx.navigateBack(); }, 500);
      }
    } else {
      // 新增
      var id = app.addPatient({
        name: form.name.trim(),
        age: parseInt(form.age),
        gender: form.gender,
        idCard: form.idCard.trim(),
        bedNo: form.bedNo.trim(),
        department: form.department.trim(),
        diagnosis: form.diagnosis.trim(),
        phone: form.phone.trim(),
        notes: form.notes.trim(),
        customRanges: customRanges
      });
      app.setCurrentPatient(id);
      wx.showToast({ title: '添加成功', icon: 'success' });
      setTimeout(function() { wx.navigateBack(); }, 500);
    }
  }
});
