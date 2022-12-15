## dl-store

`dl-store` 是一个为 js 应用程序开发的状态管理模式，兼容web浏览器和node.js。它采用集中式存储管理应用的所有数据的状态，并以相应的规则保证状态以一种可预测的方式发生变化。<br />
`dl-store` 的设计思路是参考的 vuex，使用体验上也极为相似。同时结合了 vue.js 的底层原理实现数据的响应式监听。

## 核心概念

### State
State 是模块下的所有数据的状态集合。State 可以直接使用或者从计算属性中返回某个状态：
``` javascript
const store = new DlStore({
  state: {
    apples: 6,
    oranges: 4,
    bananas: 2
  },
  getters: {
    // 计算水果总数
    fruitsCount({ state }) {
      return state.apples + state.oranges + state.bananas
    }
  }
})
store.state.apples // -> 6
store.getters.fruitsCount // -> 12
```

### Getters
`Getters` 是 `store` 的计算属性。`getter` 的返回值会根据它的依赖被缓存起来，当 `getter` 所依赖的 `state` 数据发生变化时，`getter` 才会重新计算。<br />
`getter` 接受四个参数:
  + state：当前模块下的状态集合。
  + getters：当前模块下的计算属性集合。
  + rootState：root下的状态集合。
  + rootGetters：root下的计算属性集合。
``` javascript
const store = new DlStore({
  state: {
    apples: 6,
    oranges: 4,
    bananas: 2
  },
  getters: {
    // 计算苹果 + 橘子总数
    applesAndOranges({state}) {
      const res = state.apples + state.oranges
      return res
    },
    // 计算水果总数
    fruitsCount({ state, getters }) {
      const res = getters.applesAndOranges + state.bananas
      return res
    }
  }
})
```
`Getter` 会暴露为 store.getters 对象，你可以以属性的形式访问这些值：
``` javascript
store.getters.fruitsCount // -> 12
```

### Watch
`watch` 是 `store` 中可以自定义的侦听器对象。通过监听及时响应数据的变化，当需要在数据变化时执行异步或开销较大的操作时，这个方式是最有用的。<br/>
`watch` 是一个对象，键是需要观察的表达式，值是对应回调函数。值也可以是方法名，或者包含选项的对象。 `Store` 实例将会在实例化时遍历 `watch` 对象的每一个 `property`。
``` javascript
const store = new DlStore({
  state: {
    name: '张三',
    age: 28,
    occupation: {
      name: '打工人',
      companyName: 'XXX有限公司',
      companyAddress: '繁华大道999号'
    }
  },
  watch: {
    age(val) {
      const message = `张三：我今年${val}岁了`
      console.log(message)
    },
    'occupation.companyName'(val) {
      const message = `张三：我跳槽到${val}上班了`
      console.log(message)
    }
  }
})
```
除了 `watch` 选项之外，您还可以使用命令式的 `store.addWatch()`/`store.removeWatch()` 动态的创建/移除侦听器。
``` javascript
// 添加监听
store.addWatch('occupation.name', {
  handler(val) {
    const message = `张三：我是一名光荣的${val}`
    console.log(message)
  },
  immediate: true
})
// 移除监听
store.removeWatch('occupation.name')
```

### Actions
更改 `store` 中数据的唯一方法是通过提交 `action`。每个 `action` 都有一个字符串的事件类型 (`type`)和一个回调函数 (`handler`)。这个回调函数就是我们实际进行状态更改的地方，并且它会接受 `context` 对象作为第一个参数，且 **`action` 内允许异步操作**。<br />
你不能直接调用一个 `action` 处理函数。要唤醒一个 `action` 处理函数，你需要以相应的 `type` 调用 `store.dispatch` 方法。

``` javascript
const store = new DlStore({
  state: {
    name: '张三',
    age: 28,
    favouriteFruits: [
      '苹果',
      '橘子',
      '香蕉',
      '草莓'
    ]
  },
  actions: {
    updateage({ state }, age) {
      state.age = age
    },
    addFruits({ state }, fruit) {
      state.favouriteFruits.push(fruit)
    },
    removeFruits({ state }, index) {
      return new Promise(r => {
        setTimeout(() => {
          state.favouriteFruits.splice(index, 1)
          r()
        }, 1000)
      })
    }
  }
})

store.dispatch('addFruits', '葡萄') // -> ['苹果', '橘子', '香蕉', '草莓', '葡萄']
```
如果您想要调用指定模块下的 `action` ，需要为 `type` 以 `/` 拼接上模块的名称：

``` javascript
// 水果模块
const fruitsModule = {
  state: {
    favouriteFruits: [
      '苹果',
      '橘子'
    ]
  },
  actions: {
    addFruits({ state }, fruit) {
      state.favouriteFruits.push(fruit)
    }
  }
}
const store = new DlStore({
  modules: {
    fruits: fruitsModule
  }
})

store.dispatch('fruits/addFruits', '葡萄') // -> ['苹果', '橘子', '葡萄']
```
`context` 的属性如下：
+ `state`：当前模块下的状态集合。
+ `getters`：当前模块下的计算属性集合。
+ `rootState`：root下的状态集合。
+ `rootGetters`：root下的计算属性集合。
+ `addWatch`：当前模块下动态添加监听的方法。
+ `removeWatch`：当前模块下动态移除监听的方法。
+ `dispatch`：当前模块下调用 `action` 的方法。
+ `__history__`：root下的时间线实例对象。


### Modules
由于使用单一状态树，应用的所有状态会集中到一个比较大的对象。当应用变得非常复杂时，`store` 对象就有可能变得相当臃肿。

为了解决以上问题，`dl-store` 允许我们将 `store` 分割成模块（`module`）。每个模块拥有自己的 `state`、`actions`、`getters`、`watch`：
``` javascript
const moduleA = {
  state: () => ({ ... }),
  actions: { ... },
  getters: { ... }
}

const moduleB = {
  state: () => ({ ... }),
  actions: { ... }
}

const store = createStore({
  modules: {
    a: moduleA,
    b: moduleB
  }
})

store.modules.a.state // -> moduleA 的状态
store.modules.b.state // -> moduleB 的状态
```
通过 `store.modules[moduleName]state` 可以查找到子模块的状态，但是这样获取状态的链路较长。 `store` 将模块的状态以如下规则映射到 `store` 身上：

+ `store.__[moduleName]_state__`：子模块的状态树。
+ `store.__[moduleName]_getters__`：子模块的计算集合。
+ `store.__[moduleName]_dispatch__`：子模块的 `dispatch` 方法。
+ `store.__[moduleName]_addWatch__`：子模块的 `addWatch` 方法。
+ `store.__[moduleName]_removeWatch__`：子模块的 `removeWatch` 方法。

在 store 创建之后，你可以使用 store.registerModule 方法动态的注册模块：

``` javascript
store.registerModule('fruits', fruitsModule)
```

### History
`__history__` 是记录 `store` 中操作 `state` 的时间线数据队列，最多缓存100次操作。<br />
通过 `__history__` 对象的 `prevTime()`/`nextTime()` 方法，可以轻松实现 `state` 数据的撤销/回退功能。
