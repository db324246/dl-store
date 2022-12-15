const InitState = require('./modules/state')
const InitWatch = require('./modules/watch')
const InitAction = require('./modules/action')
const InitGetter = require('./modules/getters')
const { InitHistory } = require('./modules/history')
const { initModuleFn, registerModule } = require('./modules/module')
const DefineProperty = require('./modules/defineProperty')
const { typeOf } = require('./utils')

class DlStore extends DefineProperty {
  constructor(config = {}) {
    if (typeOf(config) !== 'object') {
      throw new Error('config must be a object')
    }
    super(config)
    this.defineProperty('__watcherMap__', new Map())
    this.defineProperty('__datebase__', {})

    // state
    this.defineProperty('__state__', new InitState({
      config,
      store: this
    }))
    this.defineProperty('state', this.__state__.proxer, true)

    // getters
    this.defineProperty('__getter__', new InitGetter({
      config,
      store: this
    }))
    this.__getter__.init()

    // actions
    this.defineProperty('__actions__', new InitAction({
      config,
      store: this
    }))

    // modules
    initModuleFn(config, this)

    // watch
    this.defineProperty('__watch__', new InitWatch({
      config,
      store: this
    }))
    this.defineProperty('watch', this.__watch__.watchObj, true)
    this.defineProperty('addWatch', this.__watch__.addWatch.bind(this.__watch__), true)
    this.defineProperty('removeWatch', this.__watch__.removeWatch.bind(this.__watch__), true)

    // history
    this.defineProperty('__history__', new InitHistory(), true)
  }

  registerModule = registerModule

  setDatabase(data = {}) {
    for (const [key, value] of Object.entries(data)) {
      this.defineProperty.call(
        this.__datebase__, key, value, true
      )
    }
  }
}

module.exports = DlStore
