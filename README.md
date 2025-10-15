@[TOC](## 安装部署)


# My-todo
个人待办事项清单，一个全栈学习项目，主要功能是通过清单记录和处理个人事项。
全栈学习小白，内容包含简单的前端和后端知识
结构简单，供学习使用

## 安装部署
### 安装依赖
`npm install`
### 安装mongodb(通过docker)
```
# 拉取 MongoDB 镜像
sudo docker pull mongo   
# 如果容器不存在，创建并运行 MongoDB 容器
sudo docker run -d -p 27017:27017 --name mongodb mongo:latest
#如果存在，直接启动容器
docker start mongodb
```
### 启动前端服务
进入index.html目录

#### 方案1：
```bash
#使用Node.js原生HTTP模块：（需要安装npx）
npx http-server -p 8080
```
#### 方案2：
```bash
#Python内置HTTP服务：
python3 -m http.server 8000
```
