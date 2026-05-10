# Flip Jump - Threejs

中文 | [English](README_EN.md)

**在线预览： [https://dusktilldawn85.github.io/flip-threejs/](https://dusktilldawn85.github.io/flip-threejs/)**

基于`TypeScript`和`Three.js`实现的简易版跳一跳。

## 关键步骤

### 场景初始化 🧭

- 场景初始化 - `Scene`
- 光线初始化 - `Light`
- 相机初始化 - `Camera`
- 渲染器初始化 - `Renderer`

### 加载角色和方块 🧑‍🚀

### 生成随机距离、方向、颜色的格子 💭
简单的说就是基于`Math.random()`函数，将随机值映射至一个固定的区间内进行生成。

### 随分数增加难度递增 📈 - Todo


### 确定小人的跳跃方向 ⛳
经观察和实验发现游戏中小人的跳跃方向并不始终是**水平**或**垂直**的，需要根据当前的落点和下一个格子的中心点不断调整跳跃方向，示意图如下：

![跳跃方向](src/assets/img/jump.png)

```javascript
// 核心逻辑
const aPos = this.avatar.avatar.position;  // 角色当前位置
const bPos = this.block.block.position;  // 下一格位置

// 确定下一个格子的方向
this.jumpDirection =
  bPos.x === this.block.blocks[this.block.blocks.length - 2].position.x ? "left" : "right";
// 计算校正速度
this.speedOffset =
  this.jumpDirection === "right"
    ? ((bPos.z - aPos.z) / (bPos.x - aPos.x)) * this.speedX
    : ((bPos.x - aPos.x) / (bPos.z - aPos.z)) * this.speedX;

if (this.jumpDirection === "left") {
  aPos.z -= this.speedX;
  aPos.x -= this.speedOffset;  // 校正
} else {
  // right
  aPos.x += this.speedX;
  aPos.z += this.speedOffset;   // 校正
}
```

## 功能结构
![功能结构图](src/assets/img/struct.png)

### 核心代码结构

核心逻辑按“输入 / 动画 / 特效 / 编排”进行拆分，便于维护与扩展：

- `src/core/control.ts`：游戏编排层（跳跃物理、翻转、落点判定与计分、音效、重开复位等）
- `src/core/chargeInput.ts`：输入层（空格 + 鼠标/触摸长按），统一输出 `begin/end/cancel` 事件，并支持误触保护与忽略结算区域
- `src/core/squashBounce.ts`：角色蓄力形变与回弹（压缩/回弹动画，保持贴地不穿模）
- `src/core/perfectEffects.ts`：Perfect 特效（中心落点的波纹扩散 + 粒子喷射，含 update/clear 与资源释放）
- `src/core/block.ts`：方块生成与相机跟随（方块形状/颜色/难度递增、摄像机 lookAt 平滑移动）
- `src/core/avatar.ts`：角色（使用 Three.js 生成圆柱体替代外部模型，包含坠落/翻转/复位）
- `src/core/index.ts`：场景初始化（灯光/阴影/地面/渲染器/相机等）

原理示意：
![原理](src/assets/img/jump.png)

Cheers 🍻
