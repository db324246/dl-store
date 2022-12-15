const Watcher = require('./watcher')
const { deepClone, typeOf } = require('../utils')

class InitState {
  constructor({
    config, store, parentStore
  }) {
    let stateObj = config.state || {}
    stateObj = typeOf(stateObj) === 'function'
      ? stateObj()
      : stateObj
    if (typeOf(stateObj) !== 'object') {
      throw new Error('state must be a object or a funtion with return a Object')
    }
    const __stateObj__ = deepClone(stateObj)
    this.actionState = false
    this.store = store
    this.parentStore = parentStore || store
    // 将 state 数据添加到 parentStore 数据库
    this.parentStore.setDatabase(__stateObj__)
    
    this.proxer = this.recursionProxy(__stateObj__)
  }

  recursionProxy(data, parentKey = '') {
    if (typeof data !== 'object') return data

    for (const [key, val] of Object.entries(data)) {
      const _parentKey = parentKey ? `${parentKey}.${key}` : key
      data[key] = this.recursionProxy(val, _parentKey)
    }
    return this.createProxy(data, parentKey)
  }

  createProxy(data, parentKey) {
    if (typeof data !== 'object') return data
    const parentStore = this.parentStore
    const watcherMap = parentStore.__watcherMap__

    return new Proxy(data, {
      get: (target, key) => {
        const value = target[key]
        const wactchKey = parentKey ? `${parentKey}.${key}` : key
        const w = watcherMap.has(wactchKey)
          ? watcherMap.get(wactchKey) 
          : new Watcher(wactchKey, parentStore)
        // 为 getters 添加观察者
        if (parentStore.__getter__.getterState) {
          // console.log('收集依赖', parentStore.__getter__)
          const fn = parentStore.__getter__.gennerateMemoryFn(value)
          w.add(fn)
          watcherMap.set(wactchKey, w)
        } else if (this.store.modules) {
          // 子模块获取 root 依赖
          const __module__ = Object.values(this.store.modules).find(item => item.__getter__.getterState)
          if (!__module__) return value
          const rootGetters = this.store.__getter__
          const moduleGetters = __module__.__getter__

          // root 收集监听
          const watcherMap = this.store.__watcherMap__
          const w = watcherMap.has(key)
            ? watcherMap.get(key) 
            : new Watcher(key, this.store)

          // 子模块生成计算函数
          const fn = moduleGetters.gennerateMemoryFn(value)

          // 存储到 root 的监听集合
          w.add(fn)
          watcherMap.set(key, w)
        }
        return value
      },
      set: (target, key, val) => {
        if (!this.actionState) {
          throw new Error('set state data must use action')
        }
        
        const oldVal = target[key]
        // 记录时间线
        const __hTime__ = parentStore.__hTime__
        __hTime__ && __hTime__.addAction({
          target,
          key,
          val,
          oldVal,
          type: 'set'
        })

        if (val === oldVal) return true
        target[key] = this.createProxy(val)
        // 触发 watch
        const wactchKey = parentKey ? `${parentKey}.${key}` : key
        const w = watcherMap.has(wactchKey)
          ? watcherMap.get(wactchKey) 
          : new Watcher(wactchKey, parentStore)
        // console.log(watcherMap)
        w.emit(val, oldVal)
        watcherMap.set(wactchKey, w)
        return true
      },
      deleteProperty: (target, key) => {
        if (!this.actionState) {
          throw new Error('delete state data must use action')
        }
        const oldVal = target[key]
        Reflect.deleteProperty(target, key)
        // 记录时间线
        const __hTime__ = parentStore.__hTime__
        __hTime__ && __hTime__.addAction({
          target,
          key,
          oldVal,
          type: 'delete'
        })

        // 触发 watch
        const wactchKey = parentKey ? `${parentKey}.${key}` : key
        const w = watcherMap.has(wactchKey)
          ? watcherMap.get(wactchKey)
          : new Watcher(wactchKey, parentStore)

        if (typeOf(target) === 'object') {
          w.emit()
        }
        watcherMap.delete(wactchKey)
        return true
      }
    })
  }
}

module.exports = InitState
