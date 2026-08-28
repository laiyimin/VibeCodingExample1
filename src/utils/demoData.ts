import { Participant, Prize } from '../types';

export const DEMO_PARTICIPANTS: Participant[] = [
  { id: 'p-1', name: '陳冠宇', department: '工程部', employeeId: 'RD001' },
  { id: 'p-2', name: '林佳蓉', department: '工程部', employeeId: 'RD002' },
  { id: 'p-3', name: '黃俊傑', department: '工程部', employeeId: 'RD003' },
  { id: 'p-4', name: '張雅雯', department: '產品設計部', employeeId: 'PD001' },
  { id: 'p-5', name: '李宗翰', department: '產品設計部', employeeId: 'PD002' },
  { id: 'p-6', name: '王品涵', department: '人力資源部', employeeId: 'HR001' },
  { id: 'p-7', name: '劉建宏', department: '人力資源部', employeeId: 'HR002' },
  { id: 'p-8', name: '蔡育廷', department: '行銷企劃部', employeeId: 'MK001' },
  { id: 'p-9', name: '吳美玲', department: '行銷企劃部', employeeId: 'MK002' },
  { id: 'p-10', name: '許承佑', department: '行銷企劃部', employeeId: 'MK003' },
  { id: 'p-11', name: '鄭宇晴', department: '業務拓展部', employeeId: 'BD001' },
  { id: 'p-12', name: '謝政達', department: '業務拓展部', employeeId: 'BD002' },
  { id: 'p-13', name: '楊佩芬', department: '業務拓展部', employeeId: 'BD003' },
  { id: 'p-14', name: '葉柏凱', department: '客戶成功部', employeeId: 'CS001' },
  { id: 'p-15', name: '周怡君', department: '客戶成功部', employeeId: 'CS002' },
  { id: 'p-16', name: '蘇致遠', department: '財務會計部', employeeId: 'FN001' },
  { id: 'p-17', name: '潘詩婷', department: '財務會計部', employeeId: 'FN002' },
  { id: 'p-18', name: '莊凱文', department: '營運管理部', employeeId: 'OP001' },
  { id: 'p-19', name: '何宛真', department: '營運管理部', employeeId: 'OP002' },
  { id: 'p-20', name: '郭廷浩', department: '工程部', employeeId: 'RD004' },
  { id: 'p-21', name: '曾詠涵', department: '工程部', employeeId: 'RD005' },
  { id: 'p-22', name: '邱柏宇', department: '產品設計部', employeeId: 'PD003' },
  { id: 'p-23', name: '彭家豪', department: '業務拓展部', employeeId: 'BD004' },
  { id: 'p-24', name: '梁雅筑', department: '行銷企劃部', employeeId: 'MK004' },
];

export const DEFAULT_PRIZES: Prize[] = [
  { id: 'prize-1', name: '特獎・iPhone 16 Pro', count: 1, remainingCount: 1, icon: '📱', category: '頭獎' },
  { id: 'prize-2', name: '一等獎・Dyson 吸塵器', count: 2, remainingCount: 2, icon: '✨', category: '一等獎' },
  { id: 'prize-3', name: '二等獎・Switch OLED 遊戲主機', count: 3, remainingCount: 3, icon: '🎮', category: '二等獎' },
  { id: 'prize-4', name: '三等獎・AirPods 4 主動降噪版', count: 5, remainingCount: 5, icon: '🎧', category: '三等獎' },
  { id: 'prize-5', name: '幸運獎・全聯千元禮券', count: 10, remainingCount: 10, icon: '🎁', category: '普獎' },
];
