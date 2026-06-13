# 夏威夷英语口语听力练习 (PWA)

为三周后的夏威夷之行准备的离线英语练习 app。覆盖**机场、达美商务舱、餐厅、小费、购物**等真实场景，支持逐句循环、A‑B 连播、变速重听、收藏不熟句子并按遗忘曲线复习，还有给不懂英语的同行长辈准备的**应急沟通卡**。

纯静态网页（无需打包构建），可"添加到主屏幕"像 App 一样使用，**装好后飞机上离线也能用**。

## 功能

- **场景对话（15 个）**：
  - 机场：值机/托运、TSA 安检、登机口&广播听力、行李丢失/延误
  - 航班：Delta One 商务舱
  - 入境：CBP 移民问答、海关农产品申报
  - 住宿：Airbnb 自助入住
  - 交通：Uber/出租/租车、问路
  - 活动：浮潜租赁&安全
  - 应急：药店 & 紧急/911
  - 餐饮/购物：餐厅点餐/过敏、小费文化、购物付款
- **逐句播放器**：单句循环、连播全部、0.6×–1.0× 变速（不变调）、中英对照开关、提示开关
- **关键词点读**：点句中高亮词或词卡，单独听发音
- **⭐ 收藏 + 间隔重复复习**：把不熟的句子加入复习卡组，按遗忘曲线提醒
- **⚡ 救场句**：听不懂/卡壳时张口就用的万能句
- **🆘 应急沟通卡**：给长辈随身出示，含姓名、家人电话、住址、血型过敏慢病用药、911 提示
- **📋 行前清单**：ESTA、轮椅预约、保险、reef-safe 防晒、eSIM、检疫等盲点，可勾选并本机保存
- **离线可用**：Service Worker 缓存全部内容与音频

## 本地运行

```bash
python3 -m http.server 8000
# 浏览器打开 http://localhost:8000
```
（必须通过服务器打开，不要直接双击 index.html，否则浏览器无法加载内容。）

## 生成离线真人语音（推荐，飞机上必备）

默认情况下，没有音频文件时 app 会自动回退到**浏览器自带朗读**（在线/离线视设备而定）。
要获得高质量、确定离线可用的真人语音，在**有网络的电脑上**运行一次：

```bash
pip install edge-tts
python3 scripts/generate_audio.py
```

这会为每句对话、救场句和关键词生成 `audio/*.mp3`，并写入 `audio/manifest.json`
（Service Worker 用它在安装时预缓存，保证离线可听）。生成后提交并重新部署即可。

## 部署（让手机能装）

PWA 需要 HTTPS。最简单用 **GitHub Pages**：

1. 推送到 GitHub
2. 仓库 Settings → Pages → Source 选 `main`（或当前分支）根目录
3. 打开分配的 `https://<用户名>.github.io/<仓库>/` 网址
4. 手机浏览器打开 → 分享 →「添加到主屏幕」

之后即使断网/飞行模式也能打开练习。

## 自定义内容

所有文案都在 `data/content.json`：
- `scenarios[]`：场景与逐句对话（`speaker` 为 `you`/`staff`/`tip`；`vocab` 为关键词）
- `phrasebook[]`：救场句
- `emergencyCards`：应急卡模板（把【方括号】信息填成长辈的真实信息）

改完 `content.json` 后重新运行音频生成脚本即可。

## 目录结构

```
index.html              入口
css/styles.css          样式
js/app.js               路由 + 渲染 + 交互
js/player.js            音频播放（MP3 优先，回退浏览器朗读，变速/循环/连播）
js/review.js            收藏 + 间隔重复（localStorage）
data/content.json       全部学习内容（可自行编辑）
data/content-loader.js  内容加载
sw.js                   离线 Service Worker
scripts/generate_audio.py  用 edge-tts 生成离线 MP3
scripts/make_icons.py      生成 PWA 图标
audio/                  生成的 MP3（运行脚本后产生）
```
