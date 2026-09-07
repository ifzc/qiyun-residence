# 栖云府 · 中国古代府邸 3D 网页

使用 Three.js 构建的中国古代府邸概念模型，包含三进院落、厅堂、回廊与池畔园林，支持旋转缩放、四种视角、日夜切换、建筑标注和隐藏屋顶查看布局。

## 本地运行

需要 Node.js 22.13 或更新版本。

```sh
npm ci
npm run dev -- --port 3010
```

打开 http://localhost:3010/ 。保持终端运行，按 Control+C 停止服务。

## 构建

```sh
npm run build
npx tsc --noEmit
```

## 主要代码

- `app/components/mansion-model.ts`：府邸三维模型。
- `app/components/mansion-scene.ts`：场景、光照与相机。
- `app/components/mansion-experience.tsx`：页面与交互控制。
- `app/components/mansion-agent-tools.ts`：可选的浏览器工具接口。
- `app/globals.css`：页面样式。

模型属于建筑概念展示，并非某座真实府邸的测绘复原或施工图。
