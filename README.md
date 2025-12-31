# 项目基线版本
[liujuntao123/ai-draw-nexus](https://github.com/liujuntao123/ai-draw-nexus)


# 修改内容
- 新增 Docker 部署方式；
- 数据存储由本地浏览器，改为docker服务器云端存储，适合私有部署用户；
- 增加用户注册登录，所有数据by用户隔离管理；
- 模型设置改为系统页面配置，无需在系统环境变量进行控制；
- 增加用户自定义模型能力；
- 增加管理员为每个用户设置全局模型访问密码能力；

## screenshot
<img width="774" height="416" alt="image" src="https://github.com/user-attachments/assets/3f3ed9ca-9c4a-4782-888a-391c5ac8a17d" />
<img width="774" height="416" alt="image" src="https://github.com/user-attachments/assets/51f3ac22-ac35-4031-8b65-740c99164238" />
<img width="774" height="416" alt="image" src="https://github.com/user-attachments/assets/d21aa025-1785-47c8-b6b3-9e9a2f2b7a21" />


## 使用 Docker Compose (推荐)

1.docker部署并启动项目
```bash
version: '3.8'

services:
  ai-draw-nexus:
    build: .
    image: crpi-t6gbnskydokpa6fx.cn-beijing.personal.cr.aliyuncs.com/crendy_yu/ai-draw-nexus:latest
    container_name: ai-draw-nexus
    restart: unless-stopped
    ports:
      - "3000:3000"
    volumes:
      # Map local data directory to container data directory
      # On NAS, change ./data to your actual path, e.g., /volume1/docker/aidraw/data
      - /tmp/zfsv3/sata1/15801173305/data/docker/aiDraw:/app/data
    environment:
      - PORT=3000
      - DATA_DIR=/app/data
```
2.访问http://<NAS_IP>:3000即可使用，数据将保存在项目目录下的/app/data文件夹中；
3.登录默认管理员账号：admin/admin123，登录后及时更改密码；
4.设置全局LLM模型：左侧系统设置-全局LLM模型，填写信息；
5.在用户管理-为用户设置全局模型访问密码，并在用户LLM模型设置访问密码；

## 本地开发验证
```bash
git clone https://github.com/crendy/ai-draw-nexus
cd ai-draw-nexus
pnpm install
pnpm run dev
```
