import { bitable } from '@lark-base-open/js-sdk';
import { getFlowFields, getFlowNodes } from './bitable-helper.js';

// 检测环境并提供适当的UI实现
let ui = {};

// 检查是否在浏览器环境中运行
const isBrowser = typeof window !== 'undefined';

// 尝试获取飞书的bitable对象，如果不存在则提供浏览器环境的替代实现
try {
  // 尝试访问全局的bitable对象
  ui = typeof bitable !== 'undefined' && bitable.ui ? bitable.ui : {};
} catch (e) {
  ui = {};
}

// 如果没有showForm方法，提供浏览器环境的替代实现
if (!ui.showForm) {
  ui.showForm = async function(formConfig) {
    return new Promise((resolve) => {
      // 查找选择框项
      const selectItem = formConfig.items.find(item => item.type === 'select');
      if (selectItem && selectItem.options && selectItem.options.length > 0) {
        // 创建一个简单的选择框
        const selectHtml = `
          <div style="padding: 10px; font-family: Arial, sans-serif;">
            <h3>${formConfig.title || '请选择'}</h3>
            <label>${selectItem.label || ''}</label><br>
            <select id="temp-select" style="margin: 10px 0; padding: 5px;">
              <option value="">${selectItem.placeholder || '请选择'}</option>
              ${selectItem.options.map(opt => `
                <option value="${opt.value}">${opt.label}</option>
              `).join('')}
            </select><br>
            <button id="confirm-btn" style="padding: 5px 10px; margin-right: 5px;">${formConfig.confirmText || '确定'}</button>
            <button id="cancel-btn" style="padding: 5px 10px;">${formConfig.cancelText || '取消'}</button>
          </div>
        `;
        
        // 创建对话框
        const dialog = document.createElement('div');
        dialog.style.position = 'fixed';
        dialog.style.top = '50%';
        dialog.style.left = '50%';
        dialog.style.transform = 'translate(-50%, -50%)';
        dialog.style.background = 'white';
        dialog.style.border = '1px solid #ccc';
        dialog.style.borderRadius = '5px';
        dialog.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
        dialog.style.zIndex = '10000';
        dialog.innerHTML = selectHtml;
        
        document.body.appendChild(dialog);
        
        // 确认按钮事件
        dialog.querySelector('#confirm-btn').addEventListener('click', function() {
          const select = dialog.querySelector('#temp-select');
          const result = {};
          result[selectItem.key] = select.value;
          document.body.removeChild(dialog);
          resolve(select.value ? result : null);
        });
        
        // 取消按钮事件
        dialog.querySelector('#cancel-btn').addEventListener('click', function() {
          document.body.removeChild(dialog);
          resolve(null);
        });
      } else {
        resolve(null);
      }
    });
  };
}

// 如果没有showMessage方法，提供浏览器环境的替代实现
if (!ui.showMessage) {
  ui.showMessage = function(message, options = {}) {
    const type = options.type || 'info';
    
    // 根据消息类型选择图标
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
    
    // 在控制台显示消息
    console.log(icon + message);
    
    // 创建一个简单的消息提示
    const messageDiv = document.createElement('div');
    messageDiv.style.position = 'fixed';
    messageDiv.style.top = '20px';
    messageDiv.style.right = '20px';
    messageDiv.style.padding = '10px 15px';
    messageDiv.style.background = type === 'error' ? '#ffebee' : type === 'warning' ? '#fff3e0' : '#e3f2fd';
    messageDiv.style.color = type === 'error' ? '#c62828' : type === 'warning' ? '#e65100' : '#1565c0';
    messageDiv.style.border = '1px solid ' + (type === 'error' ? '#ef9a9a' : type === 'warning' ? '#ffcc80' : '#90caf9');
    messageDiv.style.borderRadius = '4px';
    messageDiv.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
    messageDiv.style.zIndex = '1000';
    messageDiv.style.fontFamily = 'Arial, sans-serif';
    messageDiv.style.fontSize = '14px';
    messageDiv.innerHTML = icon + message;
    
    document.body.appendChild(messageDiv);
    
    // 3秒后自动消失
    setTimeout(() => {
      messageDiv.style.opacity = '0';
      messageDiv.style.transition = 'opacity 0.3s ease';
      setTimeout(() => {
        if (document.body.contains(messageDiv)) {
          document.body.removeChild(messageDiv);
        }
      }, 300);
    }, 3000);
  };
}

/**
 * 创建flow字段选择器
 * @param {Object} tableInstance - 表格实例
 * @param {Function} onSelect - 选择回调函数
 */
export async function createFlowFieldSelector(tableInstance, onSelect) {
  try {
    // 获取所有flow字段
    const flowFields = await getFlowFields(tableInstance);
    
    if (flowFields.length === 0) {
      ui.showMessage('当前表格中没有找到flow类型的字段', {
        type: 'warning'
      });
      return;
    }
    
    // 构建下拉列表选项
    const options = flowFields.map(field => ({
      label: field.name,
      value: field.id,
      // 存储完整的字段信息，方便回调时使用
      fieldInfo: field
    }));
    
    // 创建表单
    const formConfig = {
      title: '选择flow字段',
      size: 'small',
      items: [
        {
          type: 'select',
          label: '请选择flow字段',
          key: 'flowFieldId',
          placeholder: '请选择',
          options: options,
          required: true,
          // 添加字段类型的提示信息
          helpText: '系统将自动识别所有可能的流程类型字段'
        }
      ],
      confirmText: '确定',
      cancelText: '取消'
    };
    
    // 显示表单
    const result = await ui.showForm(formConfig);
    
    if (result) {
      const selectedFieldId = result.flowFieldId;
      const selectedField = flowFields.find(field => field.id === selectedFieldId);
      
      // 调用回调函数
      if (onSelect) {
        onSelect(selectedField);
      }
      
      return selectedField;
    }
  } catch (error) {
    console.error('创建flow字段选择器失败:', error);
    ui.showMessage('创建选择器失败: ' + error.message, {
      type: 'error'
    });
  }
}

/**
 * 创建flow节点选择器
 * @param {Object} tableInstance - 表格实例
 * @param {string} fieldId - flow字段ID
 * @param {Function} onSelect - 选择回调函数
 */
export async function createFlowNodeSelector(tableInstance, fieldId, onSelect) {
  try {
    // 获取flow字段的所有节点
    const nodes = await getFlowNodes(tableInstance, fieldId);
    
    if (nodes.length === 0) {
      ui.showMessage('该flow字段没有配置节点', {
        type: 'warning'
      });
      return;
    }
    
    // 构建下拉列表选项
    const options = nodes.map(node => ({
      label: node.name || node.value || `节点${node.id}`,
      value: node.id,
      nodeInfo: node
    }));
    
    // 创建表单
    const formConfig = {
      title: '选择flow节点',
      size: 'small',
      items: [
        {
          type: 'select',
          label: '请选择节点',
          key: 'nodeId',
          placeholder: '请选择',
          options: options,
          required: true
        }
      ],
      confirmText: '确定',
      cancelText: '取消'
    };
    
    // 显示表单
    const result = await ui.showForm(formConfig);
    
    if (result) {
      const selectedNodeId = result.nodeId;
      const selectedNode = nodes.find(node => node.id === selectedNodeId);
      
      // 调用回调函数
      if (onSelect) {
        onSelect(selectedNode);
      }
      
      return selectedNode;
    }
  } catch (error) {
    console.error('创建flow节点选择器失败:', error);
    ui.showMessage('创建节点选择器失败: ' + error.message, {
      type: 'error'
    });
  }
}