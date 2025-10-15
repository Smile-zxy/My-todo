
// 任务数据
let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
let currentPriority = 'medium';
let currentFilter = 'all';
const API_BASE_URL = 'http://localhost:5000/api'

// 初始化应用
document.addEventListener('DOMContentLoaded', function() {
    loadTasks();
    
});

// 加载任务
async function loadTasks() {
    try {
        const response = await fetch(`${API_BASE_URL}/tasks?filter=${currentFilter}`);
        if (!response.ok) {
            throw new Error('获取任务失败');
        }
        tasks = await response.json();
        renderTasks();
        updateStats();
    } catch (error) {
        console.error('加载任务失败:', error);
        alert('加载任务失败，请检查网络连接');
    }
}

// 添加任务
async function addTask() {
    const taskInput = document.getElementById('taskInput');
    const text = taskInput.value.trim();
    
    if (text === '') {
        alert('请输入任务内容');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/tasks`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                text: text,
                priority: currentPriority
            })
        });
        
        if (!response.ok) {
            throw new Error('添加任务失败');
        }
        
        await loadTasks(); // 重新加载所有任务
        taskInput.value = '';
        taskInput.focus();
    } catch (error) {
        console.error('添加任务失败:', error);
        alert('添加任务失败，请重试');
    }
}

// 设置优先级
function setPriority(priority) {
    currentPriority = priority;
    
    // 更新UI
    document.querySelectorAll('.priority-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-priority="${priority}"]`).classList.add('active');
}

// 设置过滤器
function setFilter(filter) {
    currentFilter = filter;
    
    // 更新UI
    document.querySelectorAll('.filter-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    event.target.classList.add('active');
    
    loadTasks();
}

// 切换任务完成状态
async function toggleTask(id) {
    try {
        const task = tasks.find(task => task._id === id);
        if (!task) return;
        
        const response = await fetch(`${API_BASE_URL}/tasks/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                completed: !task.completed
            })
        });
        
        if (!response.ok) {
            throw new Error('更新任务失败');
        }
        
        await loadTasks();
    } catch (error) {
        console.error('更新任务失败:', error);
        alert('更新任务失败，请重试');
    }
}

// 删除任务
async function deleteTask(id) {
    if (confirm('确定要删除这个任务吗？')) {
        try {
            const response = await fetch(`${API_BASE_URL}/tasks/${id}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                throw new Error('删除任务失败');
            }
            
            await loadTasks();
        } catch (error) {
            console.error('删除任务失败:', error);
            alert('删除任务失败，请重试');
        }
    }
}

// 编辑任务
async function editTask(id) {
    const task = tasks.find(task => task._id === id);
    if (!task) return;
    
    const newText = prompt('编辑任务:', task.text);
    if (newText !== null && newText.trim() !== '') {
        try {
            const response = await fetch(`${API_BASE_URL}/tasks/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    text: newText.trim()
                })
            });
            
            if (!response.ok) {
                throw new Error('更新任务失败');
            }
            
            await loadTasks();
        } catch (error) {
            console.error('更新任务失败:', error);
            alert('更新任务失败，请重试');
        }
    }
}

// 清除已完成任务
async function clearCompleted() {
    if (confirm('确定要清除所有已完成的任务吗？')) {
        try {
            const response = await fetch(`${API_BASE_URL}/tasks`, {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                throw new Error('清除任务失败');
            }
            
            await loadTasks();
        } catch (error) {
            console.error('清除任务失败:', error);
            alert('清除任务失败，请重试');
        }
    }
}

// 渲染任务列表
function renderTasks() {
    const taskList = document.getElementById('taskList');
    
    // 前端过滤（可选，也可以完全依赖后端过滤）
    let filteredTasks = tasks;
    if (currentFilter === 'active') {
        filteredTasks = tasks.filter(task => !task.completed);
    } else if (currentFilter === 'completed') {
        filteredTasks = tasks.filter(task => task.completed);
    }
    
    if (filteredTasks.length === 0) {
        taskList.innerHTML = `
            <div class="empty-state">
                <div>${currentFilter === 'completed' ? '🎉' : '📋'}</div>
                <p>${currentFilter === 'completed' ? '还没有完成的任务' : (currentFilter === 'active' ? '没有待完成的任务' : '暂无任务，添加一个任务开始吧！')}</p>
            </div>
        `;
        return;
    }
    
    taskList.innerHTML = filteredTasks.map(task => `
        <li class="task-item priority-${task.priority}">
            <div class="task-checkbox ${task.completed ? 'checked' : ''}" onclick="toggleTask('${task._id}')"></div>
            <div class="task-text ${task.completed ? 'completed' : ''}">${task.text}</div>
            <div class="task-actions">
                <button onclick="editTask('${task._id}')" title="编辑">✏️</button>
                <button onclick="deleteTask('${task._id}')" title="删除">🗑️</button>
            </div>
        </li>
    `).join('');
}

// 更新统计信息
async function updateStats() {
    const totalCount = document.getElementById('totalCount');
    const completedCount = document.getElementById('completedCount');
    
    try {
        const response = await fetch(`${API_BASE_URL}/stats`);
        if (!response.ok) {
            throw new Error('获取统计失败');
        }
        const stats = await response.json();
        
        totalCount.textContent = stats.total;
        completedCount.textContent = stats.completed;
    } catch (error) {
        console.error('获取统计失败:', error);
        // 使用前端数据作为备选
        const completedTasks = tasks.filter(task => task.completed).length;
        totalCount.textContent = tasks.length;
        completedCount.textContent = completedTasks;
    }
}

// 处理键盘事件
function handleKeyPress(event) {
    if (event.key === 'Enter') {
        addTask();
    }
}
