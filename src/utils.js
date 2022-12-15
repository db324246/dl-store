// 深度克隆
function deepClone(source) {
  if (!source || typeof source !== 'object') {
    return source
    // throw new Error('error arguments', 'shallowClone')
  }
  const targetObj = source.constructor === Array ? [] : {}
  Object.keys(source).forEach(keys => {
    if (source[keys] && typeof source[keys] === 'object') {
      targetObj[keys] = deepClone(source[keys])
    } else {
      targetObj[keys] = source[keys]
    }
  })
  return targetObj
}

// 返回变量的数据类型
function typeOf(data) {
  return Object.prototype.toString
    .call(data)
    .slice(8, -1)
    .toLowerCase()
}

module.exports = {
  deepClone,
  typeOf
}