class InitHistory {
  constructor() {
    this.currentTime = 0
    this.historyList = []
  }

  addHistory(data) {
    if (this.currentTime < this.historyList.length) {
      this.historyList = this.historyList.slice(0, this.currentTime)
    }
    this.historyList.splice(this.currentTime, 1, data)
    this.currentTime++
    // 最多缓存 100 条数据
    if (this.historyList.length > 100) {
      this.historyList.shift()
      this.currentTime--
    }
  }

  removeHistory(key) {
    const index = this.historyList.findIndex(i => i.key === key)
    if (index < 0) return
    this.historyList.splice(index, 1)
    const currentIndex = this.currentTime - 1
    if (currentIndex >= index) {
      this.currentTime--
    }
  }

  // 上一次
  prevTime() {
    if (this.currentTime === 0) return
    this.currentTime -= 1
    const hTime = this.historyList[this.currentTime]
    if (!hTime) return
    hTime.actions.forEach(action => {
      switch (action.type) {
        case 'set':
          action.target[action.key] = action.oldVal
          break;
        case 'delete':
          action.target[action.key] = action.oldVal
          break;
        default:
          break;
      }
    })
  }

  // 下一次
  nextTime() {
    if (this.currentTime === this.historyList.length) return
    const hTime = this.historyList[this.currentTime]
    this.currentTime += 1
    if (!hTime) return
    hTime.actions.forEach(action => {
      switch (action.type) {
        case 'set':
          action.target[action.key] = action.val
          break;
        case 'delete':
          Reflect.deleteProperty(action.target, action.key)
          break;
        default:
          break;
      }
    })
  }
}

class HistoryTime {
  constructor(options) {
    this.key = Date.now()
    this.store = options.store
    this.dispatchName = options.dispatchName
    this.actions = []
    this.store.__history__.addHistory(this)
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
    })
  }
  selfCheck() {
    if (!this.actions.length) {
      this.store.__history__.removeHistory(this.key)
    }
  }
}

module.exports = {
  InitHistory,
  HistoryTime
}
