import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import SimpleTable from './SimpleTable';

// 创建根元素并渲染简单表格组件
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <SimpleTable />
  </React.StrictMode>
);