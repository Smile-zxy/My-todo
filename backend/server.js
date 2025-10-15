// server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();

// 中间件
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// MongoDB连接
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/todoapp', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})

//mongodb连接验证，输出连接状态
.then(() => {
  console.log('成功连接到 MongoDB');
})
.catch((error) => {
  console.error('MongoDB 连接错误:', error);
});

// 任务模型
const taskSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
  },
  completed: {
    type: Boolean,
    default: false,
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

const Task = mongoose.model('Task', taskSchema);

// API路由

// 获取所有任务
app.get('/api/tasks', async (req, res) => {
  try {
    const { filter } = req.query;
    let query = {};
    
    if (filter === 'active') {
      query.completed = false;
    } else if (filter === 'completed') {
      query.completed = true;
    }
    
    const tasks = await Task.find(query).sort({ createdAt: -1 });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: '获取任务失败', error: error.message });
  }
});

// 获取单个任务
app.get('/api/tasks/:id', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: '任务未找到' });
    }
    res.json(task);
  } catch (error) {
    res.status(500).json({ message: '获取任务失败', error: error.message });
  }
});

// 创建新任务
app.post('/api/tasks', async (req, res) => {
  try {
    const { text, priority = 'medium' } = req.body;
    
    if (!text || text.trim() === '') {
      return res.status(400).json({ message: '任务内容不能为空' });
    }
    
    const newTask = new Task({
      text: text.trim(),
      priority,
    });
    
    const savedTask = await newTask.save();
    res.status(201).json(savedTask);
  } catch (error) {
    res.status(500).json({ message: '创建任务失败', error: error.message });
  }
});

// 更新任务
app.put('/api/tasks/:id', async (req, res) => {
  try {
    const { text, completed, priority } = req.body;
    
    const updateData = { updatedAt: Date.now() };
    if (text !== undefined) updateData.text = text;
    if (completed !== undefined) updateData.completed = completed;
    if (priority !== undefined) updateData.priority = priority;
    
    const updatedTask = await Task.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!updatedTask) {
      return res.status(404).json({ message: '任务未找到' });
    }
    
    res.json(updatedTask);
  } catch (error) {
    res.status(500).json({ message: '更新任务失败', error: error.message });
  }
});

// 删除任务
app.delete('/api/tasks/:id', async (req, res) => {
  try {
    const deletedTask = await Task.findByIdAndDelete(req.params.id);
    
    if (!deletedTask) {
      return res.status(404).json({ message: '任务未找到' });
    }
    
    res.json({ message: '任务已删除', task: deletedTask });
  } catch (error) {
    res.status(500).json({ message: '删除任务失败', error: error.message });
  }
});

// 清除已完成任务
app.delete('/api/tasks', async (req, res) => {
  try {
    const result = await Task.deleteMany({ completed: true });
    res.json({ 
      message: `已清除 ${result.deletedCount} 个已完成任务`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    res.status(500).json({ message: '清除任务失败', error: error.message });
  }
});

// 获取任务统计
app.get('/api/stats', async (req, res) => {
  try {
    const total = await Task.countDocuments();
    const completed = await Task.countDocuments({ completed: true });
    const active = total - completed;
    
    res.json({
      total,
      completed,
      active
    });
  } catch (error) {
    res.status(500).json({ message: '获取统计失败', error: error.message });
  }
});

// 健康检查端点
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// 错误处理中间件
app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({ message: '服务器内部错误', error: error.message });
});

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({ message: 'API端点未找到' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`服务器运行在端口 ${PORT}`);
});