const InitState = require('./state')
const InitWatch = require('./watch')
const InitAction = require('./action')
const InitGetter = require('./getters')
const DefineProperty = require('./defineProperty')
const { deepClone, typeOf } = require('../utils')

class InitModule extends DefineProperty {
  constructor(config, store) {
    if (typeOf(config) !== 'object') {
      throw new Error('module config must be a object')
    }
    super(config)
    this.defineProperty('__config__', deepClone(config))
    this.defineProperty('__store__', store)
    this.defineProperty('__watcherMap__', new Map())
    this.defineProperty('__datebase__', {})

    // state
    this.defineProperty('__state__', new InitState({
      config,
      store,
      parentStore: this
    }))
    this.defineProperty('state', this.__state__.proxer, true)

    // getters
    this.defineProperty('__getter__', new InitGetter({
      config,
      store,
      parentStore: this
    }))
  }

  init() {
    const store = this.__store__
    const config = this.__config__
    this.__getter__.init()

    // actions
    this.defineProperty('__actions__', new InitAction({
      config,
      store,
      parentStore: this
    }))

    // watch
    this.defineProperty('__watch__', new InitWatch({
      config,
      store,
      parentStore: this
    }))
    this.defineProperty('watch', this.__watch__.watchObj, true)
    this.defineProperty('addWatch', this.__watch__.addWatch.bind(this.__watch__), true)
    this.defineProperty('removeWatch', this.__watch__.removeWatch.bind(this.__watch__), true)
  }

  setDatabase(data = {}) {
    for (const [key, value] of Object.entries(data)) {
      this.defineProperty.call(
        this.__datebase__, key, value, true
      )
    }
  }

  registerGlobleActions(moduleKey) {
    const storeActionsObj = this.__store__.__actions__.actionsObj
    const actionsObj = this.__actions__.actionsObj
    for (const [key, val] of Object.entries(actionsObj)) {
      Reflect.set(storeActionsObj, `${moduleKey}/${key}`, val)
    }
  }
}


function initModuleFn(config, store) {
  let modulesObj = config.modules || {}
  modulesObj = typeOf(modulesObj) === 'function'
    ? modulesObj()
    : modulesObj
  if (typeOf(modulesObj) !== 'object') {
    throw new Error('modules must be a object or a funtion with return a Object')
  }
  store.defineProperty('modules', {})
  for (const [key, val] of Object.entries(modulesObj)) {
    registerModule.call(store, key, val)
  }
}

function registerModule(key, config) {
  const store = this
  const moduleInit = new InitModule(config, store)
  Reflect.set(store.modules, key, moduleInit)
  moduleInit.init()
  moduleInit.registerGlobleActions(key)
  store.defineProperty(`__${key}_state__`, moduleInit.state, true)
  store.defineProperty(`__${key}_getters__`, moduleInit.getters, true)
  store.defineProperty(`__${key}_dispatch__`, moduleInit.dispatch.bind(moduleInit), true)
  store.defineProperty(`__${key}_addWatch__`, moduleInit.addWatch.bind(moduleInit), true)
  store.defineProperty(`__${key}_removeWatch__`, moduleInit.removeWatch.bind(moduleInit), true)
}

module.exports = {
  initModuleFn,
  registerModule
}
