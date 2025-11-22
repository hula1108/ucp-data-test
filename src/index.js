// 插件入口文件
import { bitable } from '@lark-base-open/js-sdk';
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';

// 检测环境并提供适当的UI实现
let ui = {};

// 尝试获取飞书的bitable对象，如果不存在则提供替代实现
try {
  ui = bitable && bitable.ui ? bitable.ui : {};
} catch (e) {
  ui = {};
}

// 如果没有showMessage方法，提供替代实现
if (!ui.showMessage) {
  ui.showMessage = function(message, options = {}) {
    const type = options.type || 'info';
    let icon = '';
    switch (type) {
      case 'warning':
        icon = '⚠️ ';
        break;
      case 'error':
        icon = '❌ ';
        break;
      case 'success':
        icon = '✅ ';
        break;
      default:
        icon = 'ℹ️ ';
    }
    console.log(icon + message);
  };
}

// 根据测试类型返回对应的颜色类 - 新增函数
// 根据测试类型返回对应的颜色类 - 添加常用测试类型的颜色配置
// 修改前的getTestTypeColor函数 - 目前使用硬编码的颜色映射
function getTestTypeColor(testType) {
// 使用一个简单的映射来为不同的测试类型分配不同的颜色
const typeColors = {
'功能测试': 'bg-blue-100 text-orange-700',
'性能测试': 'bg-green-100 text-teal-700',
'安全测试': 'bg-red-100 text-red-700',
'兼容性测试': 'bg-purple-100 text-purple-700',
'单元测试': 'bg-yellow-100 text-yellow-700',
'集成测试': 'bg-indigo-100 text-indigo-700',
'系统测试': 'bg-pink-100 text-pink-700',
// 添加常用测试类型的颜色配置
'冒烟测试': 'bg-blue-100 text-blue-700',
'开发自测': 'bg-blue-100 text-blue-700',
'常规测试': 'bg-green-100 text-green-700',
'回归测试': 'bg-orange-100 text-orange-700'
};

// 如果找不到对应的颜色，则返回默认颜色
return typeColors[testType] || 'bg-slate-100 text-slate-700';
}

// 数据展示组件
function DataVisualization({ data }) {
  // 解析数据
  let testData = [];
  try {
    testData = typeof data === 'string' ? JSON.parse(data) : data;
    if (!Array.isArray(testData)) {
      testData = [];
    }
  } catch (error) {
    console.error('数据解析失败:', error);
    testData = [];
  }

  // 聚合testType数据
  const testTypeStats = testData.reduce((acc, item) => {
    if (!acc[item.testType]) {
      acc[item.testType] = {
        testType: item.testType,
        totalCase: 0,
        measuredCase: 0,
        progress: 0
      };
    }
    acc[item.testType].totalCase += item.totalCase;
    acc[item.testType].measuredCase += item.measuredCase;
    acc[item.testType].progress = 
      acc[item.testType].totalCase > 0 
        ? Math.round((acc[item.testType].measuredCase / acc[item.testType].totalCase) * 100) 
        : 0;
    return acc;
  }, {});

  // 定义测试类型排序顺序
  const testTypeOrder = {
    '冒烟测试': 1,
    '开发自测': 2,
    '常规测试': 3,
    '回归测试': 4
  };

  // 排序函数 - 按照测试类型的预定义顺序排序
  function sortByTestType(a, b) {
    const orderA = testTypeOrder[a.testType] || 999;
    const orderB = testTypeOrder[b.testType] || 999;
    if (orderA !== orderB) {
      return orderA - orderB;
    }
    // 对于相同优先级的类型，按名称排序
    return a.testType.localeCompare(b.testType);
  }

  const testTypeArray = Object.values(testTypeStats).sort(sortByTestType);
  // 对表格数据也按照相同的规则排序
  const sortedTestData = [...testData].sort(sortByTestType);

  // 饼图颜色 - 使用飞书设计体系的颜色
  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#6366F1'];

  // 创建表格头部 - 使用TailwindCSS优化表头样式
  const tableHeader = React.createElement(
    'thead',
    null,
    React.createElement(
      'tr',
      { className: 'bg-slate-50 border-b border-slate-200' },
      // 修改：为所有表头添加 whitespace-nowrap 确保单行展示
      React.createElement('th', { className: 'border-r border-slate-200 px-3 py-2 text-left text-xs font-medium text-slate-600 whitespace-nowrap' }, '测试计划名称'),
      React.createElement('th', { className: 'border-r border-slate-200 px-3 py-2 text-left text-xs font-medium text-slate-600 whitespace-nowrap' }, '测试类型'),
      React.createElement('th', { className: 'border-r border-slate-200 px-3 py-2 text-left text-xs font-medium text-slate-600 whitespace-nowrap' }, '项目'),
      React.createElement('th', { className: 'border-r border-slate-200 px-3 py-2 text-left text-xs font-medium text-slate-600 whitespace-nowrap' }, '执行人'),
      React.createElement('th', { className: 'border-r border-slate-200 px-3 py-2 text-right text-xs font-medium text-slate-600 whitespace-nowrap' }, '总用例数'),
      React.createElement('th', { className: 'border-r border-slate-200 px-3 py-2 text-right text-xs font-medium text-slate-600 whitespace-nowrap' }, '已执行用例'),
      React.createElement('th', { className: 'px-3 py-2 text-right text-xs font-medium text-slate-600 whitespace-nowrap' }, '完成进度')
    )
  );

  // 创建表格行 - 使用TailwindCSS优化行样式和交互效果
  const tableRows = sortedTestData.map((item, index) => {
    // 根据进度设置颜色和状态标签
    let progressColor = 'text-slate-600';
    let statusColor = 'bg-slate-100 text-slate-700';
    
    if (item.totalCase > 0) {
      const progress = (item.measuredCase / item.totalCase) * 100;
      if (progress === 100) {
        progressColor = 'text-emerald-600';
        statusColor = 'bg-emerald-100 text-emerald-700';
      } else if (progress >= 70) {
        progressColor = 'text-indigo-600';
        statusColor = 'bg-indigo-100 text-indigo-700';
      } else if (progress >= 30) {
        progressColor = 'text-amber-600';
        statusColor = 'bg-amber-100 text-amber-700';
      } else {
        progressColor = 'text-rose-500';
        statusColor = 'bg-rose-100 text-rose-700';
      }
    }

    return React.createElement(
      'tr',
      { 
        key: `row-${index}`,
        className: `hover:bg-indigo-50 transition-all duration-200 ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}` 
      },
      // 将测试计划名称修改为超链接
      React.createElement('td', { className: 'border-r border-slate-200 px-3 py-2 text-xs font-medium text-slate-700' }, 
        React.createElement('a', { href: item.planUrl, className: 'text-blue-600 hover:underline', target: '_blank', rel: 'noopener noreferrer' }, 
          item.planName
        )
      ),
      // 测试类型列 - 保持每两个字折行并显示不同颜色
      React.createElement('td', { className: 'border-r border-slate-200 px-3 py-2 text-xs' }, 
        React.createElement('div', { className: `flex flex-col items-center justify-center px-1 py-1 rounded-md font-medium ${getTestTypeColor(item.testType)}`, style: { fontSize: '10px', width: '32px', wordBreak: 'normal', lineHeight: '1.2', whiteSpace: 'pre-line' } }, 
          item.testType.replace(/(.{2})/g, '$1\n').trim()
        )
      ),
      React.createElement('td', { className: 'border-r border-slate-200 px-3 py-2 text-xs text-slate-700' }, item.project),
      // 执行人列 - 移除头像，只显示文字（修改部分）
      React.createElement('td', { className: 'border-r border-slate-200 px-3 py-2 text-xs text-slate-700' }, 
        item.executors
      ),
      React.createElement('td', { className: 'border-r border-slate-200 px-3 py-2 text-xs text-right font-medium text-slate-700' }, item.totalCase),
      React.createElement('td', { className: 'border-r border-slate-200 px-3 py-2 text-xs text-right text-slate-700' }, item.measuredCase),
      React.createElement('td', { className: 'px-3 py-2 text-right' },
        React.createElement('div', { className: 'flex items-center justify-end space-x-2' },
          // 进度百分比
          React.createElement('span', { className: `text-xs font-medium ${progressColor}` },
            item.totalCase > 0 ? `${Math.round((item.measuredCase / item.totalCase) * 100)}%` : '0%'
          )
        )
      )
    )
  });

  // 创建饼图 - 使用TailwindCSS优化样式
  const pieCharts = testTypeArray.map((type, index) => {
    const color = colors[index % colors.length];
    const radius = 35;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (type.progress / 100) * circumference;
    
    // 创建SVG元素
    const svgElement = React.createElement(
      'svg',
      { width: '90', height: '90', viewBox: '0 0 90 90' },
      // 背景圆
      React.createElement('circle', {
        cx: '45',
        cy: '45',
        r: radius,
        fill: 'none',
        stroke: '#f0f0f0',
        strokeWidth: '5'
      }),
      // 进度圆 - 添加动画效果
      React.createElement('circle', {
        cx: '45',
        cy: '45',
        r: radius,
        fill: 'none',
        stroke: color,
        strokeWidth: '5',
        strokeDasharray: circumference,
        strokeDashoffset: strokeDashoffset,
        transform: 'rotate(-90 45 45)',
        strokeLinecap: 'round',
        className: 'transition-all duration-1000 ease-in-out'
      }),
      // 中心文字
      React.createElement('text', {
        x: '45',
        y: '45',
        textAnchor: 'middle',
        dominantBaseline: 'middle',
        fontSize: '12',
        fontWeight: 'bold'
      }, `${type.progress}%`)
    );
    
    // 根据进度设置状态标签颜色
    let statusColor = 'bg-slate-100 text-slate-700';
    if (type.progress === 100) statusColor = 'bg-emerald-100 text-emerald-700';
    else if (type.progress >= 70) statusColor = 'bg-indigo-100 text-indigo-700';
    else if (type.progress >= 30) statusColor = 'bg-amber-100 text-amber-700';
    
    return React.createElement(
      'div',
      { 
        key: index, 
        className: 'min-w-[120px] p-3 m-1.5 rounded-lg bg-white border border-slate-100 text-center transition-all duration-200 hover:shadow-md hover:-translate-y-1 group relative overflow-hidden inline-block vertical-top',
        style: {color}
      },
      // 添加彩色装饰条
      React.createElement('div', { 
        className: 'absolute top-0 left-0 right-0 h-1',
        style: {backgroundColor: color}
      }),
      // 状态标签
      React.createElement('div', { 
        className: 'absolute top-2 right-2 text-[10px] px-2 py-0.5 rounded-full font-medium ' + statusColor
      }, type.progress === 100 ? '已完成' : type.progress >= 70 ? '进度良好' : '进行中'),
      React.createElement('div', { className: 'relative w-20 h-20 mx-auto mt-1 mb-2' }, svgElement),
      React.createElement('div', { className: 'mt-1' },
        React.createElement('div', { className: 'text-xs font-medium mb-1 max-w-[100px] mx-auto text-slate-700' }, type.testType),
        React.createElement('div', { className: 'text-[9px] text-slate-500' }, `已执行 ${type.measuredCase}/${type.totalCase}`)
      )
    )
  });

  return React.createElement(
    'div',
    { className: 'p-4 max-w-7xl mx-auto font-sans bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl shadow-sm' },
    
    // 测试类型进度饼图
    React.createElement(
      'div',
      { className: 'mb-4 bg-white p-3 rounded-lg shadow-sm overflow-hidden border border-slate-100' },
      React.createElement(
        'div',
        { className: 'flex justify-between items-center mb-3' },
        React.createElement('h3', { className: 'text-base font-medium text-slate-700' }, '测试进度统计')
      ),
      // 饼图容器
      React.createElement(
        'div', 
        { className: 'flex flex-row gap-1 overflow-x-auto py-2 px-1 rounded-lg bg-slate-50 flex-nowrap scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-50' }, 
        pieCharts
      )
    ),
    
    // 数据表格
    React.createElement(
      'div',
      { className: 'bg-white p-3 rounded-lg shadow-sm overflow-hidden border border-slate-100 test-global-style' },
      React.createElement(
        'div',
        { className: 'flex justify-between items-center mb-3' },
        React.createElement('h3', { className: 'text-base font-medium text-slate-700' }, '详细测试数据'),
        React.createElement('span', { className: 'text-xs px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full font-medium' }, `${testData.length} 条记录`)
      ),
      React.createElement(
        'div',
        { className: 'overflow-x-auto rounded-lg border border-slate-100 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-50' },
        React.createElement(
          'table',
          { className: 'min-w-full border-collapse' },
          tableHeader,
          React.createElement('tbody', null, tableRows)
        )
      )
    )
  );
}

// 初始化插件
async function initPlugin() {
    // 获取当前表格实例
    const currentTable = await bitable.base.getActiveTable();
    
    // 仅显示获取成功的提示
    ui.showMessage('已成功获取表格实例', {
      type: 'success'
    });
    console.log('已获取表格实例:', currentTable);
    let clickTimeout = null;

    const offSelectionChange = bitable.base.onSelectionChange(async (event) => {
      // 清除之前的定时器
      if (clickTimeout) {
        clearTimeout(clickTimeout);
      }
      
      // 设置新的定时器（防抖 100ms）
      clickTimeout = setTimeout(async () => {
        try {
          const selection = await bitable.base.getSelection();
          
          if (selection.recordId?.length > 0) {
            await processCellClick(selection);
          }
        } catch (error) {
          console.error('处理单元格点击失败:', error);
        }
      }, 100);
    });

}

async function processCellClick(selection) {
  try {
    const table = await bitable.base.getTableById(selection.tableId);
    const recordId = selection.recordId;
    
    // 获取记录的所有字段
    const record = await table.getRecordById(recordId);
    console.log('🖱️ 记录数据:', record.fields);
    // 获取表格的所有字段信息
    const fieldList = await table.getFieldList();
    let progressStrData = null;
    let targetFieldId = null;
    // 遍历所有字段，查找名称包含"测试进度str"的字段
    for (const field of fieldList) {
      const fieldName = await field.getName();
      if (fieldName.includes('测试进度str') || fieldName === '测试进度str') {
        targetFieldId = field.id;
        progressStrData = record.fields[targetFieldId];
        break;
      }
    }
    if (progressStrData) {
      console.log('✅ 找到测试进度str字段:', progressStrData);
    } else {
      console.log('❌ 未找到测试进度str字段');
      console.log('可用字段:', fieldList.map(f => ({ id: f.id, name: f.name })));
    }
    
    // 调用业务逻辑处理函数
    onCellClick({
      record,
      progressStrData,
      tableId: selection.tableId
    });
  } catch (error) {
    console.error('处理记录数据失败:', error);
    ui.showMessage('处理记录数据失败: ' + error.message, { type: 'error' });
  }
}

function onCellClick(cellInfo) {
  if (cellInfo.progressStrData) {
    // 确保数据是字符串格式
    let progressText = cellInfo.progressStrData;
    if (typeof progressText !== 'string' && progressText?.length > 0) {
      if (Array.isArray(progressText)) {
        progressText = progressText.map(item => {
          if (item.type === 'url') {
            // 对于 URL，可以选择保留链接文本或链接地址
            return item.text; // 或者 return item.link
          } else {
            return item.text;
          }
        }).join('');
      }
    }
    
    console.log('业务处理: 测试进度str数据', progressText);
    
    // 修改：直接渲染DataVisualization组件到页面中，不再创建模态框容器
    let container = document.getElementById('test-progress-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'test-progress-container';
      container.className = 'w-full p-4';
      document.body.appendChild(container);
    }
    
    // 渲染React组件
    const root = ReactDOM.createRoot(container);
    root.render(React.createElement(DataVisualization, { data: progressText }));
  } else {
    console.warn('没有有效的测试进度str数据');
    ui.showMessage('没有有效的测试进度数据', { type: 'warning' });
  }
}

// 启动插件
initPlugin();