// const DlStore = require('../lib/dl-store.cjs')
const DlStore = require('../src/index')

const store = new DlStore({
  state: {
    name: '张三',
    age: 18,
    num: 20,
    hobbies: [
      '打游戏',
      '看电影'
    ],
    parentAge: {
      father: 50,
      mother: 48
    }
  },
  getters: {
    addAge({state}) {
      return state.age + state.num
    },
    addAge2({state, getters}) {
      return getters.addAge
    }
  },
  watch: {
    num: {
      handler(val) {
        console.log('num watch', val)
      },
      immediate: true
    },
    hobbies: {
      handler(val) {
        console.log('数组深度监听', val)
      },
      deep: true
    },
    parentAge: {
      handler(val, oldVal) {
        console.log('对象深度监听', val, oldVal)
      },
      deep: true
    }
  },
  actions: {
    addHobbies({ state }, data) {
      state.hobbies.push(data)
      console.log('push', state.hobbies)
    },
    shiftHobbies({ state }) {
      state.hobbies.shift()
      // console.log('shift', state.hobbies)
    },
    addFatherAge({ state }, data) {
      state.parentAge.father += data
      // console.log('update', state.parentAge.father)
    },
    deleteMotherAge({ state }) {
      Reflect.deleteProperty(state.parentAge, 'mother')
      // console.log('delete', state.parentAge)
    },
    updateAge({ state }, num) {
      state.age = num
    },
    updateNum({ state }, num) {
      state.num = num
    },
    addSex({ state }) {
      state.sex = '男'
    },
    removeSex({ state }) {
      // delete state.sex
      Reflect.deleteProperty(state, 'sex')
      // delete state.sex
    },
    updateNumAndAge({ dispatch }, num) {
      dispatch('updateAge', num)
      dispatch('updateNum', num)
    }
  }
})

// 修改数据
// store.dispatch('updateAge', 10)

// 新增字段
// store.dispatch('addSex')

// 删除字段
// store.dispatch('removeSex')

// 修改实例属性
// store.state = 3

// 计算属性
// console.log(store.getters.addAge)
store.dispatch('updateAge', 10)
console.log(store.getters.addAge2)
// store.dispatch('updateNum', 1)
// console.log(store.getters.addAge)

// ------- 监听属性 -----
// 动态创建监听
// store.addWatch('addAge', {
//   handler(val) {
//     console.log('监听计算属性', val)
//   },
//   immediate: true
// })
// store.dispatch('updateNum', 20)
// store.dispatch('updateNumAndAge', 40)
// store.removeWatch('addAge')
// store.dispatch('updateNum', 30)
// 监听数组
// store.dispatch('addHobbies', 30)
// store.dispatch('shiftHobbies')
// 数组的操作方法是通过多次的set, 所以监听会触发多次
// console.log(store.__history__.historyList[0].actions)
// 监听对象
// store.dispatch('addFatherAge', 30)
// store.dispatch('deleteMotherAge')

// 时间线 set
// store.dispatch('addFatherAge', 30)
// console.log(store.state.parentAge.father)
// store.__history__.prevTime()
// console.log(store.state.parentAge.father)
// store.__history__.nextTime()
// console.log(store.state.parentAge.father)
// 时间线 delete
// store.dispatch('deleteMotherAge')
// console.log(store.state.parentAge.mother)
// store.__history__.prevTime()
// console.log(store.state.parentAge.mother)
// store.__history__.nextTime()
// console.log(store.state.parentAge.mother)

// console.log(store)
