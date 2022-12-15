const { deepClone } = require('../utils')

class Watcher {
  constructor(key, parentStore) {
    this.key = key
    this.parentStore = parentStore
    this.oldVal = null
    this.dependences = []
  }

  add(fn) {
    this.dependences.push(fn)
    Watcher.add(fn)
  }
  
  emit(val) {
    const _val = deepClone(val)
    this.dependences.forEach(fn => fn(_val, this.oldVal))
    this.oldVal = deepClone(val)
    // 触发原型向上的深度监听
    const nodes = this.key.split('.')
    const parentKeys = []
    nodes.pop()
    nodes.forEach(k => {
      parentKeys.push([...parentKeys, k].join('.'))
    })
    parentKeys.forEach(k => {
      const wactch = this.parentStore.__watcherMap__.get(k)
      wactch && wactch.deepEmit()
    })
  }

  deepEmit() {
    // 拼接 watchKey 找到数据 
    const nodes = this.key.split('.')
    let val = ''
    nodes.forEach(k => {
      val = val ? val[k] : this.parentStore.__datebase__[k]
    })
    const _val = deepClone(val)
    this.dependences.forEach(fn => fn.deep && fn(_val, this.oldVal))
    this.oldVal = deepClone(val)
  }
  
  remove(key) {
    const index = this.dependences.findIndex(fn => fn.key === key)
    if (index >= 0) {
      this.dependences.splice(index, 1)
      Watcher.remove(key)
    }
  }
  
  clear() {
    this.dependences.forEach(fn => {
      Watcher.remove(fn.key)
    })
    this.dependences = []
  }
}

Watcher.dependences = []
Watcher.add = function(fn) {
  this.dependences.push(fn)
}
Watcher.remove = function(key) {
  const index = this.dependences.findIndex(fn => fn.key === key)
  if (index >= 0) {
    this.dependences.splice(index, 1)
  }
}

module.exports = Watcher
