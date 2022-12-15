class Base {
  defineProperty(key, value, enumerable) {
    Object.defineProperty(this, key, {
      value,
      enumerable, // 是否可枚举
      writable: false, // 是否可写
      configurable: false // 是否可配置
    })
  }
}

module.exports = Base
