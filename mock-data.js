// mock-data.js - 在微信开发者工具的「调试器 → Console」中粘贴运行此脚本
// 作用：生成50个患者各30天的模拟健康数据 + 20名护工/家属

function generateMockData() {
  var patients = [
    { name: '张秀英', age: 68, gender: 1, bedNo: '1', department: '心内科', diagnosis: '高血压、冠心病', phone: '13800001111', notes: '每日需监测血压3次' },
    { name: '王建国', age: 72, gender: 1, bedNo: '2', department: '心内科', diagnosis: '慢性肾功能不全', phone: '13700003333', notes: '严格记录出入量' },
    { name: '刘德华', age: 60, gender: 1, bedNo: '3', department: '心内科', diagnosis: '肺炎、高血压', phone: '13500005555', notes: '每日测量体温' },
    { name: '赵明远', age: 58, gender: 1, bedNo: '4', department: '心内科', diagnosis: '心律失常', phone: '13600000004', notes: '注意心电监护' },
    { name: '孙志强', age: 75, gender: 1, bedNo: '5', department: '心内科', diagnosis: '心力衰竭', phone: '13600000005', notes: '限制液体摄入' },
    { name: '周国平', age: 63, gender: 1, bedNo: '6', department: '心内科', diagnosis: '冠心病、心绞痛', phone: '13600000006', notes: '随身备硝酸甘油' },
    { name: '吴大伟', age: 70, gender: 1, bedNo: '7', department: '心内科', diagnosis: '心房颤动', phone: '13600000007', notes: '规律服用华法林' },
    { name: '郑海涛', age: 55, gender: 1, bedNo: '8', department: '心内科', diagnosis: '高血压肾病', phone: '13600000008', notes: '监测肾功能' },
    { name: '冯德明', age: 80, gender: 1, bedNo: '9', department: '心内科', diagnosis: '主动脉瓣狭窄', phone: '13600000009', notes: '避免剧烈活动' },
    { name: '陈伟杰', age: 48, gender: 1, bedNo: '10', department: '心内科', diagnosis: '心肌炎恢复期', phone: '13600000010', notes: '注意休息' },
    { name: '李玉兰', age: 55, gender: 2, bedNo: '11', department: '心内科', diagnosis: '2型糖尿病', phone: '13900002222', notes: '注意控制饮水量' },
    { name: '陈淑芬', age: 45, gender: 2, bedNo: '12', department: '心内科', diagnosis: '术后恢复期', phone: '13600004444', notes: '' },
    { name: '杨秀兰', age: 62, gender: 2, bedNo: '13', department: '心内科', diagnosis: '高血压、糖尿病', phone: '13600000012', notes: '血糖血压双监测' },
    { name: '黄丽华', age: 50, gender: 2, bedNo: '14', department: '心内科', diagnosis: '冠心病', phone: '13600000013', notes: '低盐低脂饮食' },
    { name: '何美珍', age: 73, gender: 2, bedNo: '15', department: '心内科', diagnosis: '心功能不全', phone: '13600000014', notes: '记录每日体重' },
    { name: '林淑芳', age: 67, gender: 2, bedNo: '16', department: '心内科', diagnosis: '房颤、甲亢', phone: '13600000015', notes: '监测甲功' },
    { name: '郑桂英', age: 59, gender: 2, bedNo: '17', department: '心内科', diagnosis: '风湿性心脏病', phone: '13600000016', notes: '预防风湿复发' },
    { name: '罗玉梅', age: 41, gender: 2, bedNo: '18', department: '心内科', diagnosis: '心肌病', phone: '13600000017', notes: '定期复查心脏超声' },
    { name: '梁凤英', age: 76, gender: 2, bedNo: '19', department: '心内科', diagnosis: '高血压3级', phone: '13600000018', notes: '联合用药降压' },
    { name: '宋雪梅', age: 53, gender: 2, bedNo: '20', department: '心内科', diagnosis: '肺心病', phone: '13600000019', notes: '低流量吸氧' },
    { name: '唐玉珍', age: 69, gender: 2, bedNo: '21', department: '心内科', diagnosis: '动脉硬化', phone: '13600000020', notes: '控制血脂' },
    { name: '许丽娟', age: 46, gender: 2, bedNo: '22', department: '心内科', diagnosis: '心脏瓣膜病', phone: '13600000021', notes: '预防感染性心内膜炎' },
    { name: '韩秀珍', age: 78, gender: 2, bedNo: '23', department: '心内科', diagnosis: '心梗后恢复', phone: '13600000022', notes: '规律服药、定期复查' },
    { name: '冯桂兰', age: 56, gender: 2, bedNo: '24', department: '心内科', diagnosis: '高血压心脏病', phone: '13600000023', notes: '限盐饮食' },
    { name: '董美琴', age: 64, gender: 2, bedNo: '25', department: '心内科', diagnosis: '心律不齐', phone: '13600000024', notes: '避免情绪激动' },
    { name: '蒋文斌', age: 82, gender: 1, bedNo: '26', department: '心内科', diagnosis: '冠心病合并高血压', phone: '13600000025', notes: '严密监测' },
    { name: '沈国华', age: 66, gender: 1, bedNo: '27', department: '心内科', diagnosis: '心绞痛频发', phone: '13600000026', notes: '必要时含服硝酸甘油' },
    { name: '韦志豪', age: 52, gender: 1, bedNo: '28', department: '心内科', diagnosis: '扩张型心肌病', phone: '13600000027', notes: '限水限盐' },
    { name: '秦建平', age: 77, gender: 1, bedNo: '29', department: '心内科', diagnosis: '房室传导阻滞', phone: '13600000028', notes: '观察心率变化' },
    { name: '阎德福', age: 85, gender: 1, bedNo: '30', department: '心内科', diagnosis: '心衰加重', phone: '13600000029', notes: '绝对卧床休息' },
    { name: '薛永强', age: 44, gender: 1, bedNo: '31', department: '心内科', diagnosis: '肺动脉高压', phone: '13600000030', notes: '避免缺氧' },
    { name: '尹国安', age: 61, gender: 1, bedNo: '32', department: '心内科', diagnosis: '主动脉夹层术后', phone: '13600000031', notes: '控制血压' },
    { name: '段学文', age: 71, gender: 1, bedNo: '33', department: '心内科', diagnosis: '房颤伴脑梗', phone: '13600000032', notes: '抗凝治疗' },
    { name: '侯明辉', age: 49, gender: 1, bedNo: '34', department: '心内科', diagnosis: '室性早搏', phone: '13600000033', notes: '心电监护' },
    { name: '彭文涛', age: 57, gender: 1, bedNo: '35', department: '心内科', diagnosis: '高血压危象', phone: '13600000034', notes: '紧急降压' },
    { name: '曹月娥', age: 74, gender: 2, bedNo: '36', department: '心内科', diagnosis: '二尖瓣关闭不全', phone: '13600000035', notes: '定期复查超声' },
    { name: '邓秀芬', age: 60, gender: 2, bedNo: '37', department: '心内科', diagnosis: '感染性心内膜炎', phone: '13600000036', notes: '长疗程抗生素' },
    { name: '萧丽萍', age: 43, gender: 2, bedNo: '38', department: '心内科', diagnosis: '围产期心肌病', phone: '13600000037', notes: '观察心功能' },
    { name: '田淑云', age: 81, gender: 2, bedNo: '39', department: '心内科', diagnosis: '心动过缓', phone: '13600000038', notes: '必要时安装起搏器' },
    { name: '潘玉华', age: 65, gender: 2, bedNo: '40', department: '心内科', diagnosis: '心包积液', phone: '13600000039', notes: '观察积液变化' },
    { name: '袁美兰', age: 54, gender: 2, bedNo: '41', department: '心内科', diagnosis: '心肌梗死恢复', phone: '13600000040', notes: '规律服药' },
    { name: '蔡秀华', age: 79, gender: 2, bedNo: '42', department: '心内科', diagnosis: '心脏起搏器术后', phone: '13600000041', notes: '定期程控随访' },
    { name: '贾玉兰', age: 47, gender: 2, bedNo: '43', department: '心内科', diagnosis: '肥厚型心肌病', phone: '13600000042', notes: '避免剧烈运动' },
    { name: '夏丽芳', age: 68, gender: 2, bedNo: '44', department: '心内科', diagnosis: '高血压眼底病变', phone: '13600000043', notes: '眼科会诊' },
    { name: '钟淑珍', age: 56, gender: 2, bedNo: '45', department: '心内科', diagnosis: '心脏神经官能症', phone: '13600000044', notes: '心理疏导' },
    { name: '汪慧敏', age: 42, gender: 2, bedNo: '46', department: '心内科', diagnosis: '室上性心动过速', phone: '13600000045', notes: '避免诱因' },
    { name: '傅秀英', age: 70, gender: 2, bedNo: '47', department: '心内科', diagnosis: '退行性心脏瓣膜病', phone: '13600000046', notes: '定期随访' },
    { name: '罗美芳', age: 83, gender: 2, bedNo: '48', department: '心内科', diagnosis: '多器官功能不全', phone: '13600000047', notes: '综合监护' },
    { name: '毕玉珍', age: 51, gender: 2, bedNo: '49', department: '心内科', diagnosis: '高血压合并肾病', phone: '13600000048', notes: '保护肾功能' },
    { name: '郝丽华', age: 63, gender: 2, bedNo: '50', department: '心内科', diagnosis: '心房扑动', phone: '13600000049', notes: '监测心律' }
  ];

  // 每个患者的基础健康参数
  var patientProfiles = [
    { waterBase: 1800, urineBase: 1200, weightBase: 65.0, weightTrend: -0.02, bpSysBase: 145, bpDiaBase: 92, hrBase: 78, tempBase: 36.5 },
    { waterBase: 1500, urineBase: 900,  weightBase: 70.0, weightTrend: 0.01,  bpSysBase: 130, bpDiaBase: 85, hrBase: 68, tempBase: 36.6 },
    { waterBase: 1600, urineBase: 1100, weightBase: 75.0, weightTrend: -0.03, bpSysBase: 138, bpDiaBase: 88, hrBase: 82, tempBase: 37.0 },
    { waterBase: 1700, urineBase: 1000, weightBase: 68.0, weightTrend: 0.00,  bpSysBase: 125, bpDiaBase: 80, hrBase: 72, tempBase: 36.4 },
    { waterBase: 1200, urineBase: 800,  weightBase: 72.0, weightTrend: -0.04, bpSysBase: 155, bpDiaBase: 95, hrBase: 90, tempBase: 36.7 },
    { waterBase: 1900, urineBase: 1300, weightBase: 66.0, weightTrend: 0.01,  bpSysBase: 135, bpDiaBase: 86, hrBase: 74, tempBase: 36.3 },
    { waterBase: 1600, urineBase: 1050, weightBase: 78.0, weightTrend: -0.01, bpSysBase: 142, bpDiaBase: 90, hrBase: 80, tempBase: 36.5 },
    { waterBase: 2100, urineBase: 1400, weightBase: 62.0, weightTrend: 0.02,  bpSysBase: 148, bpDiaBase: 95, hrBase: 76, tempBase: 36.6 },
    { waterBase: 1300, urineBase: 750,  weightBase: 58.0, weightTrend: -0.02, bpSysBase: 160, bpDiaBase: 98, hrBase: 85, tempBase: 36.8 },
    { waterBase: 2000, urineBase: 1350, weightBase: 73.0, weightTrend: 0.01,  bpSysBase: 118, bpDiaBase: 75, hrBase: 70, tempBase: 36.4 },
    { waterBase: 2200, urineBase: 1500, weightBase: 58.0, weightTrend: -0.01, bpSysBase: 118, bpDiaBase: 75, hrBase: 72, tempBase: 36.4 },
    { waterBase: 2000, urineBase: 1300, weightBase: 52.0, weightTrend: 0.03,  bpSysBase: 112, bpDiaBase: 70, hrBase: 75, tempBase: 36.8 },
    { waterBase: 1800, urineBase: 1150, weightBase: 63.0, weightTrend: -0.02, bpSysBase: 140, bpDiaBase: 88, hrBase: 76, tempBase: 36.5 },
    { waterBase: 1700, urineBase: 1100, weightBase: 55.0, weightTrend: 0.00,  bpSysBase: 122, bpDiaBase: 78, hrBase: 68, tempBase: 36.3 },
    { waterBase: 1400, urineBase: 850,  weightBase: 60.0, weightTrend: -0.03, bpSysBase: 150, bpDiaBase: 92, hrBase: 84, tempBase: 36.7 },
    { waterBase: 1900, urineBase: 1250, weightBase: 56.0, weightTrend: 0.01,  bpSysBase: 132, bpDiaBase: 84, hrBase: 78, tempBase: 36.6 },
    { waterBase: 1600, urineBase: 1000, weightBase: 67.0, weightTrend: -0.01, bpSysBase: 136, bpDiaBase: 86, hrBase: 72, tempBase: 36.4 },
    { waterBase: 2100, urineBase: 1400, weightBase: 50.0, weightTrend: 0.02,  bpSysBase: 115, bpDiaBase: 72, hrBase: 66, tempBase: 36.5 },
    { waterBase: 1300, urineBase: 800,  weightBase: 71.0, weightTrend: -0.04, bpSysBase: 158, bpDiaBase: 96, hrBase: 88, tempBase: 36.9 },
    { waterBase: 1750, urineBase: 1150, weightBase: 59.0, weightTrend: 0.00,  bpSysBase: 126, bpDiaBase: 80, hrBase: 70, tempBase: 36.3 },
    { waterBase: 1850, urineBase: 1200, weightBase: 64.0, weightTrend: -0.02, bpSysBase: 142, bpDiaBase: 90, hrBase: 80, tempBase: 36.6 },
    { waterBase: 1650, urineBase: 1080, weightBase: 54.0, weightTrend: 0.01,  bpSysBase: 120, bpDiaBase: 76, hrBase: 68, tempBase: 36.4 },
    { waterBase: 1450, urineBase: 900,  weightBase: 69.0, weightTrend: -0.03, bpSysBase: 152, bpDiaBase: 94, hrBase: 86, tempBase: 36.8 },
    { waterBase: 1950, urineBase: 1300, weightBase: 57.0, weightTrend: 0.02,  bpSysBase: 128, bpDiaBase: 82, hrBase: 74, tempBase: 36.5 },
    { waterBase: 1700, urineBase: 1100, weightBase: 61.0, weightTrend: -0.01, bpSysBase: 134, bpDiaBase: 85, hrBase: 72, tempBase: 36.4 },
    { waterBase: 1100, urineBase: 650,  weightBase: 80.0, weightTrend: -0.05, bpSysBase: 162, bpDiaBase: 100, hrBase: 92, tempBase: 37.1 },
    { waterBase: 1550, urineBase: 1000, weightBase: 66.0, weightTrend: -0.02, bpSysBase: 144, bpDiaBase: 91, hrBase: 78, tempBase: 36.5 },
    { waterBase: 1800, urineBase: 1150, weightBase: 70.0, weightTrend: 0.00,  bpSysBase: 138, bpDiaBase: 87, hrBase: 76, tempBase: 36.6 },
    { waterBase: 1350, urineBase: 820,  weightBase: 74.0, weightTrend: -0.03, bpSysBase: 156, bpDiaBase: 97, hrBase: 88, tempBase: 36.9 },
    { waterBase: 1050, urineBase: 600,  weightBase: 76.0, weightTrend: -0.04, bpSysBase: 165, bpDiaBase: 102, hrBase: 95, tempBase: 37.2 },
    { waterBase: 2000, urineBase: 1350, weightBase: 63.0, weightTrend: 0.01,  bpSysBase: 125, bpDiaBase: 80, hrBase: 70, tempBase: 36.4 },
    { waterBase: 1750, urineBase: 1100, weightBase: 71.0, weightTrend: -0.02, bpSysBase: 148, bpDiaBase: 93, hrBase: 82, tempBase: 36.7 },
    { waterBase: 1900, urineBase: 1250, weightBase: 69.0, weightTrend: 0.00,  bpSysBase: 136, bpDiaBase: 86, hrBase: 74, tempBase: 36.5 },
    { waterBase: 1600, urineBase: 1000, weightBase: 60.0, weightTrend: 0.01,  bpSysBase: 118, bpDiaBase: 75, hrBase: 66, tempBase: 36.3 },
    { waterBase: 2100, urineBase: 1400, weightBase: 58.0, weightTrend: 0.02,  bpSysBase: 140, bpDiaBase: 89, hrBase: 76, tempBase: 36.5 },
    { waterBase: 1500, urineBase: 950,  weightBase: 65.0, weightTrend: -0.02, bpSysBase: 132, bpDiaBase: 84, hrBase: 72, tempBase: 36.4 },
    { waterBase: 1700, urineBase: 1050, weightBase: 53.0, weightTrend: 0.01,  bpSysBase: 115, bpDiaBase: 73, hrBase: 68, tempBase: 36.3 },
    { waterBase: 1800, urineBase: 1200, weightBase: 62.0, weightTrend: -0.01, bpSysBase: 146, bpDiaBase: 92, hrBase: 80, tempBase: 36.6 },
    { waterBase: 1400, urineBase: 880,  weightBase: 72.0, weightTrend: -0.03, bpSysBase: 152, bpDiaBase: 95, hrBase: 84, tempBase: 36.7 },
    { waterBase: 1650, urineBase: 1080, weightBase: 56.0, weightTrend: 0.01,  bpSysBase: 122, bpDiaBase: 78, hrBase: 70, tempBase: 36.4 },
    { waterBase: 1850, urineBase: 1200, weightBase: 68.0, weightTrend: -0.02, bpSysBase: 138, bpDiaBase: 88, hrBase: 78, tempBase: 36.5 },
    { waterBase: 1200, urineBase: 700,  weightBase: 77.0, weightTrend: -0.04, bpSysBase: 160, bpDiaBase: 98, hrBase: 90, tempBase: 37.0 },
    { waterBase: 1900, urineBase: 1250, weightBase: 51.0, weightTrend: 0.02,  bpSysBase: 110, bpDiaBase: 70, hrBase: 64, tempBase: 36.3 },
    { waterBase: 1550, urineBase: 1000, weightBase: 66.0, weightTrend: 0.00,  bpSysBase: 130, bpDiaBase: 83, hrBase: 74, tempBase: 36.5 },
    { waterBase: 1750, urineBase: 1150, weightBase: 59.0, weightTrend: -0.01, bpSysBase: 142, bpDiaBase: 90, hrBase: 76, tempBase: 36.5 },
    { waterBase: 2000, urineBase: 1300, weightBase: 54.0, weightTrend: 0.01,  bpSysBase: 126, bpDiaBase: 80, hrBase: 70, tempBase: 36.4 },
    { waterBase: 1500, urineBase: 950,  weightBase: 73.0, weightTrend: -0.02, bpSysBase: 148, bpDiaBase: 94, hrBase: 82, tempBase: 36.7 },
    { waterBase: 1100, urineBase: 650,  weightBase: 69.0, weightTrend: -0.03, bpSysBase: 155, bpDiaBase: 96, hrBase: 86, tempBase: 36.8 },
    { waterBase: 1800, urineBase: 1180, weightBase: 61.0, weightTrend: 0.01,  bpSysBase: 128, bpDiaBase: 82, hrBase: 72, tempBase: 36.4 },
    { waterBase: 1650, urineBase: 1050, weightBase: 57.0, weightTrend: -0.01, bpSysBase: 135, bpDiaBase: 86, hrBase: 74, tempBase: 36.5 }
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

  // 清空旧数据
  wx.clearStorageSync();
  console.log('已清除旧数据');

  // 存储患者列表
  var patientList = [];
  for (var i = 0; i < patients.length; i++) {
    var p = patients[i];
    p.id = 'P' + (i + 1);
    p.createdAt = Date.now() - 30 * 24 * 3600 * 1000;
    patientList.push(p);
  }
  wx.setStorageSync('patients', patientList);

  // 生成护工/家属绑定和分配关系
  var bindings = [];
  var assignments = [];
  for (var ci = 0; ci < caregivers.length; ci++) {
    var cg = caregivers[ci];
    var userId = 'C' + (ci + 1);
    bindings.push({ phone: cg.phone, role: cg.role, userId: userId, name: cg.name, bound: true, patientId: '' });
    var assignCount = 2 + (ci % 2);
    for (var ai = 0; ai < assignCount; ai++) {
      var pidx = (ci * 3 + ai) % patientList.length;
      assignments.push({ userId: userId, patientId: patientList[pidx].id, assignedAt: Date.now() });
    }
  }
  wx.setStorageSync('userBindings', bindings);
  wx.setStorageSync('assignments', assignments);

  // 为每个患者生成30天数据
  var today = new Date();
  for (var pi = 0; pi < patients.length; pi++) {
    var patient = patientList[pi];
    var profile = patientProfiles[pi];
    var allRecords = {};
    var weightAccum = profile.weightBase;

    for (var dayOffset = 29; dayOffset >= 0; dayOffset--) {
      var d = new Date(today);
      d.setDate(d.getDate() - dayOffset);
      var dateStr = d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
      var dayRecords = [];
      var baseTimestamp = d.getTime();

      function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
      function randF(min, max, decimals) { return parseFloat((min + Math.random() * (max - min)).toFixed(decimals)); }
      function padTime(h) { return ('0' + h).slice(-2) + ':' + (rand(0, 5) * 10 < 10 ? '0' : '') + rand(0, 5) * 10; }

      var abnormal = Math.random() < 0.1;
      var waterTimes = rand(2, 3);
      for (var w = 0; w < waterTimes; w++) {
        var waterVal = abnormal && w === 0 ? rand(800, 1200) : rand(Math.floor(profile.waterBase * 0.4), Math.floor(profile.waterBase * 0.6));
        var waterHour = [7, 12, 18][w] || 8;
        dayRecords.push({ type: 'waterIntake', value: waterVal, time: padTime(waterHour), note: w === 0 ? '早餐后' : w === 1 ? '午餐后' : '晚餐后', date: dateStr, timestamp: baseTimestamp + 3600000 * waterHour });
      }
      var urineTimes = rand(2, 3);
      for (var u = 0; u < urineTimes; u++) {
        var urineVal = rand(Math.floor(profile.urineBase * 0.3), Math.floor(profile.urineBase * 0.5));
        var urineHour = [10, 15, 20][u] || 10;
        dayRecords.push({ type: 'urineOutput', value: urineVal, time: padTime(urineHour), note: '', date: dateStr, timestamp: baseTimestamp + 3600000 * urineHour });
      }
      weightAccum += profile.weightTrend * (abnormal ? -1 : 1);
      dayRecords.push({ type: 'weight', value: randF(weightAccum - 0.3, weightAccum + 0.3, 1), time: padTime(6), note: '晨起空腹', date: dateStr, timestamp: baseTimestamp + 3600000 * 6 });
      var bpTimes = rand(1, 2);
      for (var b = 0; b < bpTimes; b++) {
        var bpSys = abnormal ? rand(profile.bpSysBase + 5, profile.bpSysBase + 25) : rand(profile.bpSysBase - 10, profile.bpSysBase + 10);
        var bpDia = abnormal ? rand(profile.bpDiaBase + 5, profile.bpDiaBase + 15) : rand(profile.bpDiaBase - 8, profile.bpDiaBase + 8);
        var bpHour = [8, 16][b] || 8;
        var bpTime = padTime(bpHour);
        dayRecords.push({ type: 'bloodPressureSystolic', value: bpSys, time: bpTime, note: bpSys + '/' + bpDia, date: dateStr, timestamp: baseTimestamp + 3600000 * bpHour });
        dayRecords.push({ type: 'bloodPressureDiastolic', value: bpDia, time: bpTime, note: bpSys + '/' + bpDia, date: dateStr, timestamp: baseTimestamp + 3600000 * bpHour + 1 });
      }
      dayRecords.push({ type: 'heartRate', value: rand(profile.hrBase - 8, profile.hrBase + 12), time: padTime(8), note: '', date: dateStr, timestamp: baseTimestamp + 3600000 * 8 + 2 });
      var tempVal = (pi === 2 && dayOffset < 15) ? randF(37.5, 38.5, 1) : randF(profile.tempBase - 0.3, profile.tempBase + 0.5, 1);
      dayRecords.push({ type: 'temperature', value: tempVal, time: padTime(7), note: tempVal > 37.3 ? '发热' : '', date: dateStr, timestamp: baseTimestamp + 3600000 * 7 + 3 });
      allRecords[dateStr] = dayRecords;
    }
    wx.setStorageSync('records_' + patient.id, allRecords);
    console.log('患者 ' + patient.name + ' 的30天数据已生成');
  }

  // 设置第一个患者为当前选中
  wx.setStorageSync('currentPatientId', 'P1');

  console.log('========== 模拟数据生成完成 ==========');
  console.log('共50位患者，每位30天健康数据');
  console.log('共20名护工/家属，已分配患者');
  console.log('当前选中患者：张秀英');
  console.log('请点击「工具 → 编译」刷新页面查看效果');
}

// 执行
generateMockData();
