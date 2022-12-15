const Watcher = require('./watcher')
const DefineProperty = require('./defineProperty')
const { deepClone, typeOf } = require('../utils')

class InitGetter extends DefineProperty {
  constructor({
    config, store, parentStore
  }) {
    super()
    let gettersObj = config.getters || {}
    gettersObj = typeOf(gettersObj) === 'function'
      ? gettersObj()
      : gettersObj
    if (typeOf(gettersObj) !== 'object') {
      throw new Error('getters must be a object or a funtion with return a Object')
    }
    this.store = store
    this.parentStore = parentStore || store
    this.gettersObj = deepClone(gettersObj)
    this.gettersData = {}
  }

  init() {
    const globalGetters = {}
    const parentStore = this.parentStore
    this.defineProperty.call(parentStore, 'getters', globalGetters, true)
    for (const [key, handler] of Object.entries(this.gettersObj)) {
      if (typeOf(handler) !== 'function') {
        throw new Error(`${key} of getters must be a function`)
      }
      if (Reflect.has(parentStore.state, handler)) {
        throw new Error(`state already has param named ${key}`)
      }
      this.getterState = true
      this.getterStateKey = key
      const getterResult = handler({
        state: parentStore.state,
        getters: parentStore.getters,
        rootState: this.store.state,
        rootGetters: this.store.getters
      })

      // 存储计算结果
      Watcher.dependences.filter(fn => fn.key === `${key}-getter-fn`)
        .forEach(fn => {
          fn.lastRes = getterResult
        })

      Reflect.set(this.gettersData, key, getterResult)
      // 注册 globalGetters
      Object.defineProperty(globalGetters, key, {
        configurable: false,
        enumerable: true,
        get: () => {
          const res = this.gettersData[key]
          if (parentStore.__getter__.getterState) {
            const watcherMap = parentStore.__watcherMap__
            const w = watcherMap.has(key)
              ? watcherMap.get(key) 
              : new Watcher(key, parentStore)
            const fn = parentStore.__getter__.gennerateMemoryFn(res)
            w.add(fn)
            watcherMap.set(key, w)
          } else if (this.store.modules) {
            // 子模块获取 root 依赖
            const __module__ = Object.values(this.store.modules).find(item => item.__getter__.getterState)
            if (!__module__) return res
            const rootGetters = this.store.__getter__
            const moduleGetters = __module__.__getter__

            // root 收集监听
            const watcherMap = this.store.__watcherMap__
            const w = watcherMap.has(key)
              ? watcherMap.get(key) 
              : new Watcher(key, this.store)

            // 子模块生成计算函数
            const fn = moduleGetters.gennerateMemoryFn(res)

            // 存储到 root 的监听集合
            w.add(fn)
            watcherMap.set(key, w)
          }
          return res
        },
        set(val) {
          throw new Error('getters data is readonly')
        }
      })
      this.parentStore.__watcherMap__.set(key, new Watcher(key, this.parentStore))

      this.getterStateKey = ''
      this.getterState = false
    }
    // 将 getters 数据添加到 parentStore 数据库
    this.parentStore.setDatabase(this.gettersData)
  }

  // 生成有记忆的计算函数
  gennerateMemoryFn(lastVal) {
    const _that = this
    const key = this.getterStateKey
    const handler = function(val) {
      if (lastVal === val) {
        return handler.lastRes
      }
      lastVal = val
      // 重新计算
      const fn = _that.gettersObj[key]
      const res = fn({
        state: _that.parentStore.state,
        getters: _that.parentStore.getters,
        rootState: _that.store.state,
        rootGetters: _that.store.getters
      })
      // console.log('重新计算', key, res)
      handler.lastRes = res
      Reflect.set(_that.gettersData, key, res)
      // 触发 watch
      const wactch = _that.parentStore.__watcherMap__.get(key)
      wactch && wactch.emit(res)
      return res
    }
    handler.key = `${key}-getter-fn`
    return handler
  }
}

module.exports = InitGetter
