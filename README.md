# RoadwiseLab 前端交付包

交付日期：2026-08-12

## 目录说明

- `frontend-source/`：React + TypeScript + Vite 前端源码。
- `production-build/`：已执行 `npm run build` 生成的生产文件。
- `standalone-html/`：可直接用浏览器打开的单文件原型。
- `docs/`：产品说明文档。

## 本地开发

环境要求：Node.js 18 或更高版本，npm 9 或更高版本。

```bash
cd frontend-source
npm install
npm run dev
```

启动后访问：

- 主工作台：`http://localhost:3000/`
- 独立工作台：`http://localhost:3000/workbench.html`

## 检查与构建

```bash
npm run lint
npm run build
```

构建结果位于 `frontend-source/dist/`。交付包内也提供了相同版本的 `production-build/`。

## 生产预览

生产文件需要通过 HTTP 服务访问，不建议直接双击 `production-build/index.html`：

```bash
cd production-build
python3 -m http.server 8080
```

然后访问：

- `http://localhost:8080/`
- `http://localhost:8080/workbench.html`

## 当前实现说明

- 当前交付内容为前端交互原型，业务数据主要为本地模拟数据。
- 尚未连接正式后端接口、数据库、权限系统和文件上传服务。
- 后端接入时，应保持项目、标签、负责人、底稿及后续审计步骤之间的数据 ID 和状态一致。
- 负责人审核工作台中，补充资料后应重新运行检查；不再缺少资料的事项从“等待补充资料”中消失，新识别的问题可能进入“待人工复核”。当两类任务均完成后，方可确认全部结论并移交后续审计。

## 交付校验

- `npm run lint`：通过。
- `npm run build`：通过。
