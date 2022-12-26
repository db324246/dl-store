const Watcher = require('./watcher')
const { deepClone, typeOf } = require('../utils')

class InitWatch {
  constructor({
    config, store, parentStore
  }) {
    let watchObj = config.watch || {}
    watchObj = typeOf(watchObj) === 'function'
      ? watchObj()
      : watchObj
    if (typeOf(watchObj) !== 'object') {
      throw new Error('watch must be a object or a funtion with return a Object')
    }
    this.store = store
    this.parentStore = parentStore || store
    this.watchObj = deepClone(watchObj)
    this.watchKeyDataMap = new Map()

    for (const [key, val] of Object.entries(this.watchObj)) {
      this.addWatch(key, val)
    }
  }

  addWatch(key, data) {
    const dataType = typeOf(data)
    const watcherMap = this.parentStore.__watcherMap__
    const watch = watcherMap.has(key)
      ? watcherMap.get(key) 
      : new Watcher(key, this.parentStore)
    const watchKey = Date.now()
    if (dataType === 'object') {
      this.watchKeyDataMap.set(data, watchKey)
      const handler = function(...args) {
        data.handler && data.handler.call(this, ...args)
      }
      handler.key = `${watchKey}-watch-fn`
      handler.deep = data.deep
      watch.add(handler.bind(this.parentStore))
      data.immediate && this.handleImmediate(key, handler)
    } else if (dataType === 'function') {
      this.watchKeyDataMap.set(data, watchKey)
      const handler = function(...args) {
        data && data.call(this, ...args)
      }
      handler.key = `${watchKey}-watch-fn`
      watch.add(handler.bind(this.parentStore))
    } else {
      throw new Error(`${key} of watch must be a object or a funtion`)
    }
    watcherMap.set(key, watch)
  }

  handleImmediate(key, fn) {
    const nodes = key.split('.')
    let val = ''
    nodes.forEach(k => {
      val = val ? val[k] : this.parentStore.__datebase__[k]
    })
    const _val = deepClone(val)
    fn.call(this.parentStore, _val)
  }

  removeWatch(key, data) {
    const watcherMap = this.parentStore.__watcherMap__
    const watch = watcherMap.get(key)
    if (!watch) return

    const watchKey = this.watchKeyDataMap.get(data)
    if (watchKey) {
      watch.remove(`${watchKey}-watch-fn`)
    } else {
      watch.clear()
    }
  }
}

module.exports = InitWatch
