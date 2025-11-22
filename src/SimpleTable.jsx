import React from 'react';
import './index.css';

// 简单的测试数据
const sampleData = [
  {
    planName: '功能测试计划A',
    testType: '功能测试',
    project: '项目A',
    executors: '张三',
    totalCase: 100,
    measuredCase: 100
  },
  {
    planName: '性能测试计划B',
    testType: '性能测试',
    project: '项目B',
    executors: '李四',
    totalCase: 50,
    measuredCase: 38
  },
  {
    planName: '安全测试计划C',
    testType: '安全测试',
    project: '项目C',
    executors: '王五',
    totalCase: 75,
    measuredCase: 34
  },
  {
    planName: '兼容性测试计划D',
    testType: '兼容性测试',
    project: '项目D',
    executors: '赵六',
    totalCase: 60,
    measuredCase: 5
  }
];

function SimpleTable() {
  // 创建表格头部
  const tableHeader = (
    <thead>
      <tr className="bg-slate-50 border-b border-slate-200">
        <th className="border-r border-slate-200 px-3 py-2 text-left text-xs font-medium text-slate-600">测试计划名称</th>
        <th className="border-r border-slate-200 px-3 py-2 text-left text-xs font-medium text-slate-600">测试类型</th>
        <th className="border-r border-slate-200 px-3 py-2 text-left text-xs font-medium text-slate-600">项目</th>
        <th className="border-r border-slate-200 px-3 py-2 text-left text-xs font-medium text-slate-600">执行人</th>
        <th className="border-r border-slate-200 px-3 py-2 text-right text-xs font-medium text-slate-600">总用例数</th>
        <th className="border-r border-slate-200 px-3 py-2 text-right text-xs font-medium text-slate-600">已执行用例</th>
        <th className="px-3 py-2 text-right text-xs font-medium text-slate-600">完成进度</th>
      </tr>
    </thead>
  );

  // 创建表格行
  const tableRows = sampleData.map((item, index) => {
    // 根据进度设置颜色
    let progressColor = 'text-slate-600';
    
    if (item.totalCase > 0) {
      const progress = (item.measuredCase / item.totalCase) * 100;
      if (progress === 100) {
        progressColor = 'text-emerald-600';
      } else if (progress >= 70) {
        progressColor = 'text-indigo-600';
      } else if (progress >= 30) {
        progressColor = 'text-amber-600';
      } else {
        progressColor = 'text-rose-500';
      }
    }

    return (
      <tr 
        key={`row-${index}`} 
        className={`hover:bg-indigo-50 transition-all duration-200 ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}
      >
        <td className="border-r border-slate-200 px-3 py-2 text-sm font-medium text-slate-700">{item.planName}</td>
        <td className="border-r border-slate-200 px-3 py-2 text-sm">
          <div className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700">
            {item.testType}
          </div>
        </td>
        <td className="border-r border-slate-200 px-3 py-2 text-sm text-slate-700">{item.project}</td>
        <td className="border-r border-slate-200 px-3 py-2 text-sm">
          <div className="flex items-center">
            <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[9px] font-medium text-slate-600">
              {item.executors.charAt(0).toUpperCase()}
            </div>
            <span className="ml-2 text-slate-700">{item.executors}</span>
          </div>
        </td>
        <td className="border-r border-slate-200 px-3 py-2 text-sm text-right font-medium text-slate-700">{item.totalCase}</td>
        <td className="border-r border-slate-200 px-3 py-2 text-sm text-right text-slate-700">{item.measuredCase}</td>
        <td className="px-3 py-2 text-right">
          <div className="flex items-center justify-end space-x-2">
            <span className={`text-xs font-medium ${progressColor}`}>
              {item.totalCase > 0 ? `${Math.round((item.measuredCase / item.totalCase) * 100)}%` : '0%'}
            </span>
          </div>
        </td>
      </tr>
    );
  });

  return (
    <div className="p-8 max-w-7xl mx-auto font-sans bg-slate-50">
      <h2 className="text-xl font-bold text-slate-900 mb-6">简单表格测试</h2>
      
      {/* 数据表格 */}
      <div className="bg-white p-5 rounded-lg shadow-sm overflow-hidden border border-slate-100 test-global-style">
        <div className="overflow-x-auto rounded-lg border border-slate-100">
          <table className="min-w-full border-collapse">
            {tableHeader}
            <tbody>{tableRows}</tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default SimpleTable;