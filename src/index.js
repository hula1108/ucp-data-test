// 插件入口文件
import { bitable } from '@lark-base-open/js-sdk';
import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import * as echarts from 'echarts';
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
  // 初始状态 - 显示请选择项目的提示
  if (!data) {
    return React.createElement(
      'div',
      { className: 'w-full p-8 bg-white rounded-lg shadow-sm border border-slate-100 text-center' },
      React.createElement(
        'div',
        { className: 'flex flex-col items-center justify-center py-10 text-slate-500' },
        React.createElement('span', { className: 'text-lg font-medium mb-2' }, '请在多维表格选择项目')
      )
    );
  }

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

  // 如果测试数据为空，显示暂无数据提示
  if (testData.length === 0) {
    return React.createElement(
      'div',
      { className: 'w-full p-8 bg-white rounded-lg shadow-sm border border-slate-100 text-center' },
      React.createElement(
        'div',
        { className: 'flex flex-col items-center justify-center py-10 text-slate-500' },
        React.createElement('span', { className: 'text-lg font-medium mb-2' }, '暂无数据')
      )
    );
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

  // 饼图颜色 - 使用低饱和度马卡龙色系
  const colors = ['#1d4ed8', '#80D7B6', '#FFE680', '#FF99AF', '#9B9CC9', '#FF99AF', '#80A7D8'];

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
        stroke: '#F3F3F7',
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
    // 创建初始容器并显示提示
    let container = document.getElementById('test-progress-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'test-progress-container';
      container.className = 'w-full p-4';
      document.body.appendChild(container);
    }
    
    // 初始渲染 - 显示请选择项目的提示
    const root = ReactDOM.createRoot(container);
    root.render(React.createElement(DataVisualization, { data: null }));
    
    // 获取当前表格实例
    const currentTable = await bitable.base.getActiveTable();
    
    // 仅显示获取成功的提示
    ui.showMessage('已成功获取表格实例', { type: 'success' });
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

// 在文件顶部添加全局变量来存储React根实例
let reactRoot = null;
// 全局存储当前激活的tab状态
let activeTabState = 'test';

async function processCellClick(selection) {
  let loadingMessage = null; // 初始化loadingMessage变量
  try {
    // 确保有容器元素
    let container = document.getElementById('test-progress-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'test-progress-container';
      container.className = 'w-full p-4';
      document.body.appendChild(container);
    }
    
    // 创建或获取React根实例
    if (!reactRoot) {
      reactRoot = ReactDOM.createRoot(container);
    }
    
    // 创建加载状态的TabContainer组件，保持tab显示在页面上
    function LoadingTabContainer() {
      // 使用全局状态
      const activeTab = activeTabState;
      
      // 简单的处理函数，在加载状态下可以点击但不执行实际切换
      const handleTabChange = (tab) => {
        activeTabState = tab; // 仍然更新全局状态
      };
      
      return React.createElement(
        'div',
        { className: 'w-full' },
        // Tab 导航 - 保持不变
        React.createElement(
          'div',
          { className: 'mb-4' },
          React.createElement(
            'nav',
            { className: 'flex space-x-8' },
            React.createElement(
              'button',
              {
                className: `inline-flex items-center px-1 pt-1 pb-2 text-sm font-medium rounded-t-lg focus:outline-none focus-visible:outline-none active:outline-none border-none transition-all duration-200 relative ${activeTab === 'test' ? 'text-indigo-600 font-medium' : 'text-slate-500 hover:text-slate-700'}`,
                onClick: () => handleTabChange('test')
              },
              '测试情况',
              activeTab === 'test' && React.createElement('div', { className: 'absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600' })
            ),
            React.createElement(
              'button',
              {
                className: `inline-flex items-center px-1 pt-1 pb-2 text-sm font-medium rounded-t-lg focus:outline-none focus-visible:outline-none active:outline-none border-none transition-all duration-200 relative ${activeTab === 'bug' ? 'text-indigo-600 font-medium' : 'text-slate-500 hover:text-slate-700'}`,
                onClick: () => handleTabChange('bug')
              },
              'bug情况',
              activeTab === 'bug' && React.createElement('div', { className: 'absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600' })
            )
          )
        ),
        // Tab 内容 - 显示加载状态
        React.createElement(
          'div',
          { className: 'w-full p-8 bg-white rounded-lg shadow-sm border border-slate-100 text-center' },
          React.createElement(
            'div',
            { className: 'flex flex-col items-center justify-center' },
            // 加载图标
            React.createElement(
              'div',
              { className: 'animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4' }
            ),
            // 加载文本
            React.createElement(
              'p',
              { className: 'text-slate-500' },
              '加载中，请稍候...'
            )
          )
        )
      );
    }
    
    // 渲染加载状态的TabContainer，保持tab显示在页面上
    reactRoot.render(React.createElement(LoadingTabContainer));
    
    // 同时显示顶部的loading消息
    try {
      loadingMessage = ui.showMessage('正在处理数据...', {
        type: 'loading',
        duration: 0 // 0表示不自动关闭
      });
    } catch (e) {
      console.warn('显示loading消息失败:', e);
    }
    
    // 模拟一点延迟，确保用户能看到loading状态
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const table = await bitable.base.getTableById(selection.tableId);
    const recordId = selection.recordId;
    
    // 获取记录的所有字段
    const record = await table.getRecordById(recordId);
    console.log('🖱️ 记录数据:', record.fields);
    // 获取表格的所有字段信息
    const fieldList = await table.getFieldList();
    let progressStrData = null;
    let bugStatusStrData = null; // 新增：存储bug情况str字段数据
    let targetFieldId = null;
    // 遍历所有字段，查找名称包含"测试进度str"或"bug情况str"的字段
    for (const field of fieldList) {
      const fieldName = await field.getName();
      if (fieldName.includes('测试进度str') || fieldName === '测试进度str') {
        targetFieldId = field.id;
        progressStrData = record.fields[targetFieldId];
      }
      if (fieldName.includes('bug情况str') || fieldName === 'bug情况str') {
        bugStatusStrData = record.fields[field.id];
      }
    }
    if (progressStrData) {
      console.log('✅ 找到测试进度str字段:', progressStrData);
    } else {
      console.log('❌ 未找到测试进度str字段');
      console.log('可用字段:', fieldList.map(f => ({ id: f.id, name: f.name })));
    }
    
    if (bugStatusStrData) {
      console.log('✅ 找到bug情况str字段:', bugStatusStrData);
    } else {
      console.log('❌ 未找到bug情况str字段');
    }
    
    // 调用业务逻辑处理函数
    onCellClick({
      record,
      progressStrData,
      bugStatusStrData, // 新增：传递bug情况str字段数据
      tableId: selection.tableId
    });
    
    // 数据处理完成，关闭顶部loading消息
    if (loadingMessage && typeof loadingMessage.close === 'function') {
      loadingMessage.close();
    }
  } catch (error) {
    // 发生错误时也关闭loading状态
    console.error('处理记录数据失败:', error);
    ui.showMessage('处理记录数据失败: ' + error.message, { type: 'error' });
    
    // 确保有容器并显示错误信息
    let container = document.getElementById('test-progress-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'test-progress-container';
      container.className = 'w-full p-4';
      document.body.appendChild(container);
    }
    
    // 创建或获取React根实例
    if (!reactRoot) {
      reactRoot = ReactDOM.createRoot(container);
    }
    
    reactRoot.render(
      React.createElement(
        'div',
        { className: 'w-full p-8 bg-white rounded-lg shadow-sm border border-slate-100 text-center' },
        React.createElement(
          'div',
          { className: 'flex flex-col items-center justify-center py-10 text-rose-500' },
          React.createElement('span', { className: 'text-lg font-medium mb-2' }, '处理数据失败')
        )
      )
    );
    
    // 关闭可能存在的loading消息
    if (loadingMessage && typeof loadingMessage.close === 'function') {
      loadingMessage.close();
    }
    
    // 额外确保关闭所有可能的loading消息
    try {
      const messages = ui.getMessages();
      messages.forEach(msg => {
        if (msg.type === 'loading' && typeof msg.close === 'function') {
          msg.close();
        }
      });
    } catch (e) {
      console.warn('清理loading消息失败:', e);
    }
  }
}

function onCellClick(cellInfo) {
  // 确保有容器元素
  let container = document.getElementById('test-progress-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'test-progress-container';
    container.className = 'w-full p-4';
    document.body.appendChild(container);
  }

  // 创建或获取React根实例
  if (!reactRoot) {
    reactRoot = ReactDOM.createRoot(container);
  }

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
    let bugStatusText = cellInfo.bugStatusStrData;
    if (typeof bugStatusText !== 'string' && bugStatusText?.length > 0) {
      if (Array.isArray(bugStatusText)) {
        bugStatusText = bugStatusText.map(item => {
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
    console.log('业务处理: bug情况str数据', bugStatusText);
      // 创建TabContainer组件来管理tab切换
    function TabContainer({ data }) {
      // 使用全局状态代替内部状态
      const [activeTab, setActiveTab] = useState(activeTabState);
      
      // 更新全局状态的函数
      const handleTabChange = (tab) => {
        setActiveTab(tab);
        activeTabState = tab; // 更新全局变量
      };
      
      return React.createElement(
        'div',
        { className: 'w-full' },
        // Tab 导航
        React.createElement(
          'div',
          { className: 'mb-4' },
          React.createElement(
            'nav',
            { className: 'flex space-x-8' },
            React.createElement(
              'button',
              {
                className: `inline-flex items-center px-1 pt-1 pb-2 text-sm font-medium rounded-t-lg focus:outline-none focus-visible:outline-none active:outline-none border-none transition-all duration-200 relative ${activeTab === 'test' ? 'text-indigo-600 font-medium' : 'text-slate-500 hover:text-slate-700'}`,
                onClick: () => handleTabChange('test')
              },
              '测试情况',
              activeTab === 'test' && React.createElement('div', { className: 'absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600' })
            ),
            React.createElement(
              'button',
              {
                className: `inline-flex items-center px-1 pt-1 pb-2 text-sm font-medium rounded-t-lg focus:outline-none focus-visible:outline-none active:outline-none border-none transition-all duration-200 relative ${activeTab === 'bug' ? 'text-indigo-600 font-medium' : 'text-slate-500 hover:text-slate-700'}`,
                onClick: () => handleTabChange('bug')
              },
              'bug情况',
              activeTab === 'bug' && React.createElement('div', { className: 'absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600' })
            )
          )
        ),
        // Tab 内容
        React.createElement(
          'div',
          null,
          activeTab === 'test' ? 
            React.createElement(DataVisualization, { data: data }) :
            // Bug情况Tab内容 - 实现表格和堆叠柱状图
            React.createElement(BugVisualization, { bugData: bugStatusText })
        )
      );
    }

    // Bug情况可视化组件
    function BugVisualization({ bugData }) {
      // 解析bug数据
      let parsedData = null;
      try {
        parsedData = JSON.parse(bugData || 'null');
        // 确保parsedData是对象且包含必要的字段
        if (typeof parsedData !== 'object' || parsedData === null) {
          console.error('bug数据格式不正确');
          parsedData = null;
        }
      } catch (e) {
        console.error('解析bug数据失败:', e);
      }

      // 如果数据为空或解析失败，显示暂无数据
      if (!parsedData) {
        return React.createElement(
          'div',
          { className: 'w-full p-8 bg-white rounded-lg shadow-sm border border-slate-100 text-center' },
          React.createElement(
            'div',
            { className: 'flex flex-col items-center justify-center py-10 text-slate-500' },
            React.createElement('span', { className: 'text-lg font-medium mb-2' }, '暂无数据')
          )
        );
      }

      // 优先级表格数据处理
      const priorityData = parsedData.priority || {};
      
      // 定义状态类型的排序顺序
      const statusOrder = ['处理中', '已处理', '已关闭'];
      const statusTypes = new Set();
      
      // 收集所有状态类型
      Object.values(priorityData).forEach(statuses => {
        if (typeof statuses === 'object' && statuses !== null) {
          Object.keys(statuses).forEach(status => statusTypes.add(status));
        }
      });
      
      // 按预定义顺序排序状态类型
      const statusArray = statusOrder.filter(status => statusTypes.has(status))
        .concat(Array.from(statusTypes).filter(status => !statusOrder.includes(status)));

      // 按P0、P1、P2、P3排序优先级
      const priorityEntries = Object.entries(priorityData)
        .filter(([_, statuses]) => typeof statuses === 'object' && statuses !== null) // 过滤无效数据
        .sort(([p1], [p2]) => {
          // 从优先级字符串中提取数字部分进行排序
          const num1 = parseInt(p1.match(/P(\d+)/)?.[1] || 999);
          const num2 = parseInt(p2.match(/P(\d+)/)?.[1] || 999);
          return num1 - num2;
        });

      // 计算每个优先级的总计
      const priorityTotals = {};
      priorityEntries.forEach(([priority, statuses]) => {
        priorityTotals[priority] = statusArray.reduce((sum, status) => sum + (statuses[status] || 0), 0);
      });

      // 计算每个状态的总计
      const statusTotals = {};
      statusArray.forEach(status => {
        statusTotals[status] = priorityEntries.reduce((sum, [priority, statuses]) => sum + (statuses[status] || 0), 0);
      });

      // 计算总体总计
      const grandTotal = Object.values(statusTotals).reduce((sum, count) => sum + count, 0);

      // DevLeader数据处理
      const devLeaderData = parsedData.devLeader || {};
      const leaderEntries = Object.entries(devLeaderData)
        .filter(([_, bugTypes]) => typeof bugTypes === 'object' && bugTypes !== null) // 过滤无效数据
        // 按bug总数倒序排列开发负责人
        .sort(([_, bugTypesA], [__, bugTypesB]) => {
          const totalA = Object.values(bugTypesA).reduce((sum, count) => sum + (parseInt(count) || 0), 0);
          const totalB = Object.values(bugTypesB).reduce((sum, count) => sum + (parseInt(count) || 0), 0);
          return totalB - totalA; // 倒序排列
        });

      return React.createElement(
        'div',
        { className: 'w-full p-4' },
        // 优先级表格
        React.createElement(
          'div',
          { className: 'mb-8 bg-white rounded-lg shadow-sm border border-slate-100 p-4' },
          React.createElement('h3', { className: 'text-base font-medium text-slate-700' }, 'Bug优先级分布'),
          React.createElement(
            'div',
            { className: 'overflow-x-auto' },
            React.createElement(
              'table',
              { className: 'min-w-full border-collapse' },
              // 表头
              React.createElement(
                'thead',
                null,
                React.createElement(
                  'tr',
                  { className: 'bg-slate-50 border-b border-slate-200' },
                  React.createElement('th', { className: 'border-r border-slate-200 px-4 py-2 text-left text-xs font-medium text-slate-600' }, '优先级'),
                  statusArray.map((status, index) => 
                    React.createElement(
                      'th',
                      { 
                        key: `status-header-${index}`,
                        className: 'border-r border-slate-200 px-4 py-2 text-right text-xs font-medium text-slate-600'
                      },
                      status
                    )
                  ),
                  React.createElement('th', { className: 'px-4 py-2 text-right text-xs font-medium text-slate-600 bg-slate-100' }, '总计')
                )
              ),
              // 表体
              React.createElement(
                'tbody',
                null,
                // 优先级行
                priorityEntries.map(([priority, statuses], index) => 
                  React.createElement(
                    'tr',
                    { 
                      key: `priority-row-${index}`,
                      className: `hover:bg-indigo-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`
                    },
                    React.createElement('td', { className: 'border-r border-slate-200 px-4 py-2 text-sm font-medium text-slate-700' }, priority),
                    statusArray.map((status, statusIndex) => 
                      React.createElement(
                        'td',
                        { 
                          key: `status-${statusIndex}`,
                          className: 'border-r border-slate-200 px-4 py-2 text-sm text-right text-slate-700'
                        },
                        statuses[status] || 0
                      )
                    ),
                    React.createElement(
                      'td', 
                      { className: 'px-4 py-2 text-sm text-right font-medium text-slate-700 bg-slate-50' },
                      priorityTotals[priority]
                    )
                  )
                ),
                // 总计行
                React.createElement(
                  'tr',
                  { className: 'bg-slate-100 font-medium' },
                  React.createElement('td', { className: 'border-r border-slate-200 px-4 py-2 text-sm text-slate-700' }, '总计'),
                  statusArray.map((status, index) => 
                    React.createElement(
                      'td',
                      { 
                        key: `total-status-${index}`,
                        className: 'border-r border-slate-200 px-4 py-2 text-sm text-right text-slate-700'
                      },
                      statusTotals[status]
                    )
                  ),
                  React.createElement('td', { className: 'px-4 py-2 text-sm text-right text-slate-700 bg-slate-200' }, grandTotal)
                )
              )
            )
          )
        ),
        // DevLeader堆叠柱状图 - 使用ECharts实现
        React.createElement(
          'div',
          { className: 'bg-white rounded-lg shadow-sm border border-slate-100 p-4' },
          React.createElement('h3', { className: 'text-base font-medium text-slate-700 mb-4' }, '开发负责人Bug分布'),
          React.createElement(
            'div',
            { className: 'h-[400px]' },
            leaderEntries.length > 0 ? (
              React.createElement(
                EChartsComponent,
                { 
                  leaderEntries: leaderEntries,
                  bugTypes: [...new Set(leaderEntries.flatMap(([_, types]) => Object.keys(types)))]
                }
              )
            ) : (
              React.createElement(
                'div',
                { className: 'flex items-center justify-center h-full text-slate-400' },
                '暂无开发负责人数据'
              )
            )
          )
        )
      );
    }
    
    // ECharts 组件
    function EChartsComponent({ leaderEntries, bugTypes }) {
      const chartRef = useRef(null);
      const chartInstance = useRef(null);
      
      useEffect(() => {
        // 初始化ECharts实例
        if (chartRef.current && !chartInstance.current) {
          chartInstance.current = echarts.init(chartRef.current);
          
          // 窗口大小改变时，重新调整图表大小
          const handleResize = () => {
            if (chartInstance.current) {
              chartInstance.current.resize();
            }
          };
          window.addEventListener('resize', handleResize);
          
          // 清理函数
          return () => {
            window.removeEventListener('resize', handleResize);
            if (chartInstance.current) {
              chartInstance.current.dispose();
              chartInstance.current = null;
            }
          };
        }
      }, []);
      
      useEffect(() => {
        if (chartInstance.current) {
          // 按照用户要求的顺序排列缺陷类型
          const desiredOrder = ['代码', '环境', '数据', '稳定性', '安全性', '其它', '需求', '优化建议', '非缺陷'];
          
          // 创建排序后的bug类型数组
          const orderedBugTypes = desiredOrder.filter(type => bugTypes.includes(type))
            .concat(bugTypes.filter(type => !desiredOrder.includes(type)));
          
          // 使用低饱和度马卡龙色系
          const feishuColors = [
            '#ff535b47', // 代码 - 低饱和度紫色
            '#a2aaefff', // 环境 - 低饱和度紫色
            '#80D7B6', // 数据 - 低饱和度绿色
            '#ffc480ff', // 稳定性 - 低饱和度黄色
            'rgba(255, 245, 153, 0.4)', // 安全性 - 低饱和度红色
            'rgba(176, 137, 224, 0.5)', // 其它 - 弱化
            'rgba(122, 234, 223, 0.4)', // 需求 - 更弱化
            'rgba(173, 173, 201, 0.3)', // 优化建议 - 更弱化
            'rgba(173, 173, 201, 0.2)'  // 非缺陷 - 最弱
          ];
          
          // 准备数据
          const categories = leaderEntries.map(([leaderName]) => leaderName);
          
          // 准备系列数据
          const series = orderedBugTypes.map((bugType, index) => {
            return {
              name: bugType,
              type: 'bar',
              stack: 'total',
              emphasis: {
                focus: 'series'
              },
              data: leaderEntries.map(([_, bugTypes]) => parseInt(bugTypes[bugType]) || 0),
              itemStyle: {
                color: feishuColors[index % feishuColors.length]
              },
              label: {
                show: false,
                position: 'top',
                formatter: '{c}'
              }
            };
          });
          
          // 添加总计标签
          const totalSeries = {
            name: '总计',
            type: 'bar',
            stack: 'total',
            emphasis: {
              focus: 'series'
            },
            data: leaderEntries.map(([_, bugTypes]) => {
              return Object.values(bugTypes).reduce((sum, count) => sum + (parseInt(count) || 0), 0);
            }),
            itemStyle: {
              color: 'transparent',
              borderColor: 'transparent',
              borderWidth: 0
            },
            label: {
              show: true,
              position: 'top',
              formatter: '{c}',
              color: '#9797C3',
              fontWeight: 'bold',
              fontSize: 12
            },
            tooltip: {
              show: false
            }
          };
          
          series.push(totalSeries);
          
          // 配置项
          const option = {
            tooltip: {
              trigger: 'axis',
              axisPointer: {
                type: 'shadow'
              },
              formatter: function(params) {
                const result = [`${params[0].name}`];
                let total = 0;
                
                // 计算总计
                params.forEach(param => {
                  if (param.seriesName !== '总计') {
                    total += param.value;
                  }
                });
                
                // 添加总计信息
                result.push(`总计: ${total}个`);
                
                // 添加各类型信息
                params.forEach(param => {
                  if (param.seriesName !== '总计' && param.value > 0) {
                    result.push(`${param.marker} ${param.seriesName}: ${param.value}个`);
                  }
                });
                
                return result.join('<br/>');
              }
            },
            legend: {
              data: orderedBugTypes, // 使用排序后的类型
              top: 0,
              textStyle: {
                fontSize: 12,
                color: '#9797C3'
              },
              itemWidth: 12,
              itemHeight: 12,
              itemGap: 15,
              type: 'scroll',
              pageButtonItemGap: 5,
              pageButtonGap: 10,
              pageIconColor: '#DADAE5',
              pageIconInactiveColor: '#C4C4CF',
              pageIconSize: 12
            },
            grid: {
              left: '3%',
              right: '4%',
              bottom: '3%',
              top: '15%',
              containLabel: true
            },
            xAxis: {
              type: 'category',
              data: categories,
              axisLabel: {
                color: '#9797C3',
                fontSize: 12,
                interval: 0,
                rotate: categories.length > 5 ? 30 : 0
              },
              axisTick: {
                show: false
              },
              axisLine: {
                lineStyle: {
                  color: '#E7E7ED'
                }
              }
            },
            yAxis: {
              type: 'value',
              axisLabel: {
                color: '#9797C3',
                fontSize: 12,
                formatter: '{value}'
              },
              axisTick: {
                show: false
              },
              axisLine: {
                show: false
              },
              splitLine: {
                lineStyle: {
                  color: '#F3F3F7',
                  type: 'dashed'
                }
              }
            },
            series: series,
            animationDuration: 1000,
            animationEasing: 'cubicOut'
          };
          
          chartInstance.current.setOption(option);
        }
      }, [leaderEntries, bugTypes]);
      
      return React.createElement('div', { ref: chartRef, className: 'w-full h-full' });
    }
    
    // 渲染TabContainer组件
    reactRoot.render(React.createElement(TabContainer, { data: progressText }));
  } else {
    // 在测试进度str为空的情况下，清掉之前的页面数据，显示暂无数据的提示
    console.warn('没有有效的测试进度str数据');
    ui.showMessage('没有有效的测试进度数据', { type: 'warning' });
    
    reactRoot.render(
      React.createElement(
        'div',
        { className: 'w-full p-8 bg-white rounded-lg shadow-sm border border-slate-100 text-center' },
        React.createElement(
          'div',
          { className: 'flex flex-col items-center justify-center py-10 text-slate-500' },
          React.createElement('span', { className: 'text-lg font-medium mb-2' }, '暂无数据')
        )
      )
    );
  }
}

// 启动插件
initPlugin();