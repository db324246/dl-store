const DlStore = require('../lib/dl-store.cjs')
// 水果模块
const fruitsModule = {
  state: {
    favouriteFruits: [
      '苹果',
      '橘子'
    ]
  },
  actions: {
    addFruits({ state }, fruit) {
      state.favouriteFruits.push(fruit)
    }
  }
}
const store = new DlStore({
  // modules: {
  //   fruits: fruitsModule
  // }
})
store.registerModule('fruits', fruitsModule)
store.dispatch('fruits/addFruits', '葡萄') // -> ['苹果', '橘子', '葡萄']
console.log(store)
