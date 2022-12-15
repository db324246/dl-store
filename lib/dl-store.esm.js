// 深度克隆
function deepClone$6(source) {
  if (!source || typeof source !== 'object') {
    return source;
    // throw new Error('error arguments', 'shallowClone')
  }

  const targetObj = source.constructor === Array ? [] : {};
  Object.keys(source).forEach(keys => {
    if (source[keys] && typeof source[keys] === 'object') {
      targetObj[keys] = deepClone$6(source[keys]);
    } else {
      targetObj[keys] = source[keys];
    }
  });
  return targetObj;
}

// 返回变量的数据类型
function typeOf$6(data) {
  return Object.prototype.toString.call(data).slice(8, -1).toLowerCase();
}
var utils = {
  deepClone: deepClone$6,
  typeOf: typeOf$6
};

const {
  deepClone: deepClone$5
} = utils;
class Watcher$3 {
  constructor(key, parentStore) {
    this.key = key;
    this.parentStore = parentStore;
    this.oldVal = null;
    this.dependences = [];
  }
  add(fn) {
    this.dependences.push(fn);
    Watcher$3.add(fn);
  }
  emit(val) {
    const _val = deepClone$5(val);
    this.dependences.forEach(fn => fn(_val, this.oldVal));
    this.oldVal = deepClone$5(val);
    // 触发原型向上的深度监听
    const nodes = this.key.split('.');
    const parentKeys = [];
    nodes.pop();
    nodes.forEach(k => {
      parentKeys.push([...parentKeys, k].join('.'));
    });
    parentKeys.forEach(k => {
      const wactch = this.parentStore.__watcherMap__.get(k);
      wactch && wactch.deepEmit();
    });
  }
  deepEmit() {
    // 拼接 watchKey 找到数据 
    const nodes = this.key.split('.');
    let val = '';
    nodes.forEach(k => {
      val = val ? val[k] : this.parentStore.__datebase__[k];
    });
    const _val = deepClone$5(val);
    this.dependences.forEach(fn => fn.deep && fn(_val, this.oldVal));
    this.oldVal = deepClone$5(val);
  }
  remove(key) {
    const index = this.dependences.findIndex(fn => fn.key === key);
    if (index >= 0) {
      this.dependences.splice(index, 1);
      Watcher$3.remove(key);
    }
  }
  clear() {
    this.dependences.forEach(fn => {
      Watcher$3.remove(fn.key);
    });
    this.dependences = [];
  }
}
Watcher$3.dependences = [];
Watcher$3.add = function (fn) {
  this.dependences.push(fn);
};
Watcher$3.remove = function (key) {
  const index = this.dependences.findIndex(fn => fn.key === key);
  if (index >= 0) {
    this.dependences.splice(index, 1);
  }
};
var watcher = Watcher$3;

const Watcher$2 = watcher;
const {
  deepClone: deepClone$4,
  typeOf: typeOf$5
} = utils;
class InitState$2 {
  constructor({
    config,
    store,
    parentStore
  }) {
    let stateObj = config.state || {};
    stateObj = typeOf$5(stateObj) === 'function' ? stateObj() : stateObj;
    if (typeOf$5(stateObj) !== 'object') {
      throw new Error('state must be a object or a funtion with return a Object');
    }
    const __stateObj__ = deepClone$4(stateObj);
    this.actionState = false;
    this.store = store;
    this.parentStore = parentStore || store;
    // 将 state 数据添加到 parentStore 数据库
    this.parentStore.setDatabase(__stateObj__);
    this.proxer = this.recursionProxy(__stateObj__);
  }
  recursionProxy(data, parentKey = '') {
    if (typeof data !== 'object') return data;
    for (const [key, val] of Object.entries(data)) {
      const _parentKey = parentKey ? `${parentKey}.${key}` : key;
      data[key] = this.recursionProxy(val, _parentKey);
    }
    return this.createProxy(data, parentKey);
  }
  createProxy(data, parentKey) {
    if (typeof data !== 'object') return data;
    const parentStore = this.parentStore;
    const watcherMap = parentStore.__watcherMap__;
    return new Proxy(data, {
      get: (target, key) => {
        const value = target[key];
        const wactchKey = parentKey ? `${parentKey}.${key}` : key;
        const w = watcherMap.has(wactchKey) ? watcherMap.get(wactchKey) : new Watcher$2(wactchKey, parentStore);
        // 为 getters 添加观察者
        if (parentStore.__getter__.getterState) {
          // console.log('收集依赖', parentStore.__getter__)
          const fn = parentStore.__getter__.gennerateMemoryFn(value);
          w.add(fn);
          watcherMap.set(wactchKey, w);
        } else if (this.store.modules) {
          // 子模块获取 root 依赖
          const __module__ = Object.values(this.store.modules).find(item => item.__getter__.getterState);
          if (!__module__) return value;
          this.store.__getter__;
          const moduleGetters = __module__.__getter__;

          // root 收集监听
          const watcherMap = this.store.__watcherMap__;
          const w = watcherMap.has(key) ? watcherMap.get(key) : new Watcher$2(key, this.store);

          // 子模块生成计算函数
          const fn = moduleGetters.gennerateMemoryFn(value);

          // 存储到 root 的监听集合
          w.add(fn);
          watcherMap.set(key, w);
        }
        return value;
      },
      set: (target, key, val) => {
        if (!this.actionState) {
          throw new Error('set state data must use action');
        }
        const oldVal = target[key];
        // 记录时间线
        const __hTime__ = parentStore.__hTime__;
        __hTime__ && __hTime__.addAction({
          target,
          key,
          val,
          oldVal,
          type: 'set'
        });
        if (val === oldVal) return true;
        target[key] = this.createProxy(val);
        // 触发 watch
        const wactchKey = parentKey ? `${parentKey}.${key}` : key;
        const w = watcherMap.has(wactchKey) ? watcherMap.get(wactchKey) : new Watcher$2(wactchKey, parentStore);
        // console.log(watcherMap)
        w.emit(val, oldVal);
        watcherMap.set(wactchKey, w);
        return true;
      },
      deleteProperty: (target, key) => {
        if (!this.actionState) {
          throw new Error('delete state data must use action');
        }
        const oldVal = target[key];
        Reflect.deleteProperty(target, key);
        // 记录时间线
        const __hTime__ = parentStore.__hTime__;
        __hTime__ && __hTime__.addAction({
          target,
          key,
          oldVal,
          type: 'delete'
        });

        // 触发 watch
        const wactchKey = parentKey ? `${parentKey}.${key}` : key;
        const w = watcherMap.has(wactchKey) ? watcherMap.get(wactchKey) : new Watcher$2(wactchKey, parentStore);
        if (typeOf$5(target) === 'object') {
          w.emit();
        }
        watcherMap.delete(wactchKey);
        return true;
      }
    });
  }
}
var state = InitState$2;

const Watcher$1 = watcher;
const {
  deepClone: deepClone$3,
  typeOf: typeOf$4
} = utils;
class InitWatch$2 {
  constructor({
    config,
    store,
    parentStore
  }) {
    let watchObj = config.watch || {};
    watchObj = typeOf$4(watchObj) === 'function' ? watchObj() : watchObj;
    if (typeOf$4(watchObj) !== 'object') {
      throw new Error('watch must be a object or a funtion with return a Object');
    }
    this.store = store;
    this.parentStore = parentStore || store;
    this.watchObj = deepClone$3(watchObj);
    this.watchKeyDataMap = new Map();
    for (const [key, val] of Object.entries(this.watchObj)) {
      this.addWatch(key, val);
    }
  }
  addWatch(key, data) {
    const dataType = typeOf$4(data);
    const watcherMap = this.parentStore.__watcherMap__;
    const watch = watcherMap.has(key) ? watcherMap.get(key) : new Watcher$1(key, this.parentStore);
    const watchKey = Date.now();
    if (dataType === 'object') {
      this.watchKeyDataMap.set(data, watchKey);
      const handler = function (...args) {
        data.handler && data.handler.call(this, ...args);
      };
      handler.key = `${watchKey}-watch-fn`;
      handler.deep = data.deep;
      watch.add(handler.bind(this.parentStore));
      data.immediate && this.handleImmediate(key, handler);
    } else if (dataType === 'function') {
      this.watchKeyDataMap.set(data, watchKey);
      const handler = function (...args) {
        data && data.call(this, ...args);
      };
      handler.key = `${watchKey}-watch-fn`;
      watch.add(handler.bind(this.parentStore));
    } else {
      throw new Error(`${key} of watch must be a object or a funtion`);
    }
    watcherMap.set(key, watch);
  }
  handleImmediate(key, fn) {
    const nodes = key.split('.');
    let val = '';
    nodes.forEach(k => {
      val = val ? val[k] : this.parentStore.__datebase__[k];
    });
    const _val = deepClone$3(val);
    fn(_val);
  }
  removeWatch(key, data) {
    const watcherMap = this.parentStore.__watcherMap__;
    const watch = watcherMap.get(key);
    if (!watch) return;
    const watchKey = this.watchKeyDataMap.get(data);
    if (watchKey) {
      watch.remove(`${watchKey}-watch-fn`);
    } else {
      watch.clear();
    }
  }
}
var watch = InitWatch$2;

class Base {
  defineProperty(key, value, enumerable) {
    Object.defineProperty(this, key, {
      value,
      enumerable,
      // 是否可枚举
      writable: false,
      // 是否可写
      configurable: false // 是否可配置
    });
  }
}

var defineProperty = Base;

class InitHistory$1 {
  constructor() {
    this.currentTime = 0;
    this.historyList = [];
  }
  addHistory(data) {
    if (this.currentTime < this.historyList.length) {
      this.historyList = this.historyList.slice(0, this.currentTime);
    }
    this.historyList.splice(this.currentTime, 1, data);
    this.currentTime++;
    // 最多缓存 100 条数据
    if (this.historyList.length > 100) {
      this.historyList.shift();
      this.currentTime--;
    }
  }
  removeHistory(key) {
    const index = this.historyList.findIndex(i => i.key === key);
    if (index < 0) return;
    this.historyList.splice(index, 1);
    const currentIndex = this.currentTime - 1;
    if (currentIndex >= index) {
      this.currentTime--;
    }
  }

  // 上一次
  prevTime() {
    if (this.currentTime === 0) return;
    this.currentTime -= 1;
    const hTime = this.historyList[this.currentTime];
    if (!hTime) return;
    hTime.actions.forEach(action => {
      switch (action.type) {
        case 'set':
          action.target[action.key] = action.oldVal;
          break;
        case 'delete':
          action.target[action.key] = action.oldVal;
          break;
      }
    });
  }

  // 下一次
  nextTime() {
    if (this.currentTime === this.historyList.length) return;
    const hTime = this.historyList[this.currentTime];
    this.currentTime += 1;
    if (!hTime) return;
    hTime.actions.forEach(action => {
      switch (action.type) {
        case 'set':
          action.target[action.key] = action.val;
          break;
        case 'delete':
          Reflect.deleteProperty(action.target, action.key);
          break;
      }
    });
  }
}
class HistoryTime$1 {
  constructor(options) {
    this.key = Date.now();
    this.store = options.store;
    this.dispatchName = options.dispatchName;
    this.actions = [];
    this.store.__history__.addHistory(this);
  }
  addAction({
    target,
    key,
    val,
    oldVal,
    type
  }) {
    this.actions.push({
      target,
      key,
      val,
      oldVal,
      type
    });
  }
  selfCheck() {
    if (!this.actions.length) {
      this.store.__history__.removeHistory(this.key);
    }
  }
}
var history = {
  InitHistory: InitHistory$1,
  HistoryTime: HistoryTime$1
};

const DefineProperty$3 = defineProperty;
const {
  HistoryTime
} = history;
const {
  deepClone: deepClone$2,
  typeOf: typeOf$3
} = utils;
class InitAction$2 extends DefineProperty$3 {
  constructor({
    config,
    store,
    parentStore
  }) {
    super();
    let actionsObj = config.actions || {};
    actionsObj = typeOf$3(actionsObj) === 'function' ? actionsObj() : actionsObj;
    if (typeOf$3(actionsObj) !== 'object') {
      throw new Error('actions must be a object or a funtion with return a Object');
    }
    this.store = store;
    this.parentStore = parentStore || store;
    this.actionsObj = deepClone$2(actionsObj);
    this.defineProperty.call(this.parentStore, 'dispatch', this.dispatch.bind(this), true);
  }
  dispatch(key, ...args) {
    if (key.includes('/')) {
      const [moduleKey, actionKey] = key.split('/');
      const __module__ = this.store.modules[moduleKey];
      return __module__.dispatch(actionKey, ...args);
    }
    const parentStore = this.parentStore;
    parentStore.__state__.actionState = true;
    this.createHistory(key);
    let res = null;
    try {
      const fn = this.actionsObj[key];
      if (!fn) throw new Error(`actions has not function named ${key}`);
      res = fn(this.actionContext(), ...args);
    } catch (err) {
      console.error('dispatch error: ', err);
    }
    this.destroyHistory();
    if (res instanceof Promise) {
      return res.then(() => {
        parentStore.__state__.actionState = false;
      });
    } else {
      parentStore.__state__.actionState = false;
      return res;
    }
  }
  actionContext() {
    const parentStore = this.parentStore;
    const _that = this;
    return {
      state: parentStore.state,
      getters: parentStore.getters,
      rootState: this.store.state,
      rootGetters: this.store.getters,
      __history__: this.store.__history__,
      addWatch: parentStore.addWatch.bind(parentStore),
      removeWatch: parentStore.removeWatch.bind(parentStore),
      dispatch(...argus) {
        const res = _that.dispatch(...argus);
        if (res instanceof Promise) {
          return res.then(() => {
            _that.__state__.actionState = true;
          });
        } else {
          _that.__state__.actionState = true;
          return res;
        }
      }
    };
  }
  createHistory(key) {
    const __hTime__ = new HistoryTime({
      store: this.store,
      dispatchName: key
    });
    Reflect.set(this.store, '__hTime__', __hTime__);
  }
  destroyHistory() {
    this.store.__hTime__.selfCheck();
    Reflect.deleteProperty(this.store, '__hTime__');
  }
}
var action = InitAction$2;

const Watcher = watcher;
const DefineProperty$2 = defineProperty;
const {
  deepClone: deepClone$1,
  typeOf: typeOf$2
} = utils;
class InitGetter$2 extends DefineProperty$2 {
  constructor({
    config,
    store,
    parentStore
  }) {
    super();
    let gettersObj = config.getters || {};
    gettersObj = typeOf$2(gettersObj) === 'function' ? gettersObj() : gettersObj;
    if (typeOf$2(gettersObj) !== 'object') {
      throw new Error('getters must be a object or a funtion with return a Object');
    }
    this.store = store;
    this.parentStore = parentStore || store;
    this.gettersObj = deepClone$1(gettersObj);
    this.gettersData = {};
  }
  init() {
    const globalGetters = {};
    const parentStore = this.parentStore;
    this.defineProperty.call(parentStore, 'getters', globalGetters, true);
    for (const [key, handler] of Object.entries(this.gettersObj)) {
      if (typeOf$2(handler) !== 'function') {
        throw new Error(`${key} of getters must be a function`);
      }
      if (Reflect.has(parentStore.state, handler)) {
        throw new Error(`state already has param named ${key}`);
      }
      this.getterState = true;
      this.getterStateKey = key;
      const getterResult = handler({
        state: parentStore.state,
        getters: parentStore.getters,
        rootState: this.store.state,
        rootGetters: this.store.getters
      });

      // 存储计算结果
      Watcher.dependences.filter(fn => fn.key === `${key}-getter-fn`).forEach(fn => {
        fn.lastRes = getterResult;
      });
      Reflect.set(this.gettersData, key, getterResult);
      // 注册 globalGetters
      Object.defineProperty(globalGetters, key, {
        configurable: false,
        enumerable: true,
        get: () => {
          const res = this.gettersData[key];
          if (parentStore.__getter__.getterState) {
            const watcherMap = parentStore.__watcherMap__;
            const w = watcherMap.has(key) ? watcherMap.get(key) : new Watcher(key, parentStore);
            const fn = parentStore.__getter__.gennerateMemoryFn(res);
            w.add(fn);
            watcherMap.set(key, w);
          } else if (this.store.modules) {
            // 子模块获取 root 依赖
            const __module__ = Object.values(this.store.modules).find(item => item.__getter__.getterState);
            if (!__module__) return res;
            this.store.__getter__;
            const moduleGetters = __module__.__getter__;

            // root 收集监听
            const watcherMap = this.store.__watcherMap__;
            const w = watcherMap.has(key) ? watcherMap.get(key) : new Watcher(key, this.store);

            // 子模块生成计算函数
            const fn = moduleGetters.gennerateMemoryFn(res);

            // 存储到 root 的监听集合
            w.add(fn);
            watcherMap.set(key, w);
          }
          return res;
        },
        set(val) {
          throw new Error('getters data is readonly');
        }
      });
      this.parentStore.__watcherMap__.set(key, new Watcher(key, this.parentStore));
      this.getterStateKey = '';
      this.getterState = false;
    }
    // 将 getters 数据添加到 parentStore 数据库
    this.parentStore.setDatabase(this.gettersData);
  }

  // 生成有记忆的计算函数
  gennerateMemoryFn(lastVal) {
    const _that = this;
    const key = this.getterStateKey;
    const handler = function (val) {
      if (lastVal === val) {
        return handler.lastRes;
      }
      lastVal = val;
      // 重新计算
      const fn = _that.gettersObj[key];
      const res = fn({
        state: _that.parentStore.state,
        getters: _that.parentStore.getters,
        rootState: _that.store.state,
        rootGetters: _that.store.getters
      });
      // console.log('重新计算', key, res)
      handler.lastRes = res;
      Reflect.set(_that.gettersData, key, res);
      // 触发 watch
      const wactch = _that.parentStore.__watcherMap__.get(key);
      wactch && wactch.emit(res);
      return res;
    };
    handler.key = `${key}-getter-fn`;
    return handler;
  }
}
var getters = InitGetter$2;

const InitState$1 = state;
const InitWatch$1 = watch;
const InitAction$1 = action;
const InitGetter$1 = getters;
const DefineProperty$1 = defineProperty;
const {
  deepClone,
  typeOf: typeOf$1
} = utils;
class InitModule extends DefineProperty$1 {
  constructor(config, store) {
    if (typeOf$1(config) !== 'object') {
      throw new Error('module config must be a object');
    }
    super(config);
    this.defineProperty('__config__', deepClone(config));
    this.defineProperty('__store__', store);
    this.defineProperty('__watcherMap__', new Map());
    this.defineProperty('__datebase__', {});

    // state
    this.defineProperty('__state__', new InitState$1({
      config,
      store,
      parentStore: this
    }));
    this.defineProperty('state', this.__state__.proxer, true);

    // getters
    this.defineProperty('__getter__', new InitGetter$1({
      config,
      store,
      parentStore: this
    }));
  }
  init() {
    const store = this.__store__;
    const config = this.__config__;
    this.__getter__.init();

    // actions
    this.defineProperty('__actions__', new InitAction$1({
      config,
      store,
      parentStore: this
    }));

    // watch
    this.defineProperty('__watch__', new InitWatch$1({
      config,
      store,
      parentStore: this
    }));
    this.defineProperty('watch', this.__watch__.watchObj, true);
    this.defineProperty('addWatch', this.__watch__.addWatch.bind(this.__watch__), true);
    this.defineProperty('removeWatch', this.__watch__.removeWatch.bind(this.__watch__), true);
  }
  setDatabase(data = {}) {
    for (const [key, value] of Object.entries(data)) {
      this.defineProperty.call(this.__datebase__, key, value, true);
    }
  }
  registerGlobleActions(moduleKey) {
    const storeActionsObj = this.__store__.__actions__.actionsObj;
    const actionsObj = this.__actions__.actionsObj;
    for (const [key, val] of Object.entries(actionsObj)) {
      Reflect.set(storeActionsObj, `${moduleKey}/${key}`, val);
    }
  }
}
function initModuleFn$1(config, store) {
  let modulesObj = config.modules || {};
  modulesObj = typeOf$1(modulesObj) === 'function' ? modulesObj() : modulesObj;
  if (typeOf$1(modulesObj) !== 'object') {
    throw new Error('modules must be a object or a funtion with return a Object');
  }
  store.defineProperty('modules', {});
  for (const [key, val] of Object.entries(modulesObj)) {
    registerModule$1.call(store, key, val);
  }
}
function registerModule$1(key, config) {
  const store = this;
  const moduleInit = new InitModule(config, store);
  Reflect.set(store.modules, key, moduleInit);
  moduleInit.init();
  moduleInit.registerGlobleActions(key);
  store.defineProperty(`__${key}_state__`, moduleInit.state, true);
  store.defineProperty(`__${key}_getters__`, moduleInit.getters, true);
  store.defineProperty(`__${key}_dispatch__`, moduleInit.dispatch.bind(moduleInit), true);
  store.defineProperty(`__${key}_addWatch__`, moduleInit.addWatch.bind(moduleInit), true);
  store.defineProperty(`__${key}_removeWatch__`, moduleInit.removeWatch.bind(moduleInit), true);
}
var module = {
  initModuleFn: initModuleFn$1,
  registerModule: registerModule$1
};

const InitState = state;
const InitWatch = watch;
const InitAction = action;
const InitGetter = getters;
const {
  InitHistory
} = history;
const {
  initModuleFn,
  registerModule
} = module;
const DefineProperty = defineProperty;
const {
  typeOf
} = utils;
class DlStore extends DefineProperty {
  constructor(config = {}) {
    if (typeOf(config) !== 'object') {
      throw new Error('config must be a object');
    }
    super(config);
    this.defineProperty('__watcherMap__', new Map());
    this.defineProperty('__datebase__', {});

    // state
    this.defineProperty('__state__', new InitState({
      config,
      store: this
    }));
    this.defineProperty('state', this.__state__.proxer, true);

    // getters
    this.defineProperty('__getter__', new InitGetter({
      config,
      store: this
    }));
    this.__getter__.init();

    // actions
    this.defineProperty('__actions__', new InitAction({
      config,
      store: this
    }));

    // modules
    initModuleFn(config, this);

    // watch
    this.defineProperty('__watch__', new InitWatch({
      config,
      store: this
    }));
    this.defineProperty('watch', this.__watch__.watchObj, true);
    this.defineProperty('addWatch', this.__watch__.addWatch.bind(this.__watch__), true);
    this.defineProperty('removeWatch', this.__watch__.removeWatch.bind(this.__watch__), true);

    // history
    this.defineProperty('__history__', new InitHistory(), true);
  }
  registerModule = registerModule;
  setDatabase(data = {}) {
    for (const [key, value] of Object.entries(data)) {
      this.defineProperty.call(this.__datebase__, key, value, true);
    }
  }
}
var src = DlStore;

export { src as default };
