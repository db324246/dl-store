const DefineProperty = require('./defineProperty')
const { HistoryTime } = require('./history')
const { deepClone, typeOf } = require('../utils')

class InitAction extends DefineProperty {
  constructor({
    config, store, parentStore
  }) {
    super()
    let actionsObj = config.actions || {}
    actionsObj = typeOf(actionsObj) === 'function'
      ? actionsObj()
      : actionsObj
    if (typeOf(actionsObj) !== 'object') {
      throw new Error('actions must be a object or a funtion with return a Object')
    }
    this.store = store
    this.parentStore = parentStore || store
    this.actionsObj = deepClone(actionsObj)
    this.defineProperty.call(this.parentStore, 'dispatch', this.dispatch.bind(this), true)
  }
  dispatch(key, ...args) {
    if (key.includes('/')) {
      const [moduleKey, actionKey] = key.split('/')
      const __module__ = this.store.modules[moduleKey]
      return __module__.dispatch(actionKey, ...args)
    }

    const parentStore = this.parentStore
    parentStore.__state__.actionState = true
    this.createHistory(key)
    let res = null
    try {
      const fn = this.actionsObj[key]
      if (!fn) throw new Error(`actions has not function named ${key}`)
      res = fn(this.actionContext(), ...args)
    } catch (err) {
      console.error('dispatch error: ', err)
    }
    this.destroyHistory()
    if (res instanceof Promise) {
      return res.then(() => {
        parentStore.__state__.actionState = false
      })
    } else {
      parentStore.__state__.actionState = false
      return res
    }
  }

  actionContext() {
    const parentStore = this.parentStore
    const _that = this
    return {
      state: parentStore.state,
      getters: parentStore.getters,
      rootState: this.store.state,
      rootGetters: this.store.getters,
      __history__: this.store.__history__,
      addWatch: parentStore.addWatch.bind(parentStore),
      removeWatch: parentStore.removeWatch.bind(parentStore),
      dispatch(...argus) {
        const res = _that.dispatch(...argus)
        if (res instanceof Promise) {
          return res.then(() => {
            _that.__state__.actionState = true
          })
        } else {
          _that.__state__.actionState = true
          return res
        }
      }
    }
  }

  createHistory(key) {
    const __hTime__ = new HistoryTime({
      store: this.store,
      dispatchName: key
    })
    Reflect.set(this.store, '__hTime__', __hTime__)
  }

  destroyHistory() {
    this.store.__hTime__.selfCheck()
    Reflect.deleteProperty(this.store, '__hTime__')
  }
}

module.exports = InitAction
