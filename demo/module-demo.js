// const DlStore = require('../lib/dl-store.cjs')
const DlStore = require('../src/index')

const familyModule = {
  state: {
    fatherName: '李四',
    age: 50
  },
  getters: {
    fNextYear({state}) {
      return state.age + 1
    },
    familyNextYear({state, rootState, getters, rootGetters}) {
      return rootGetters.nextYear + rootState.age
    }
  },
  // watch: {
  //   age(val) {
  //     console.log(this.state.fatherName, val)
  //   }
  // },
  actions: {
    addYear(context) {
      // console.log(context)
      context.state.age += 1
    }
  }
}

const store = new DlStore({
  modules: {
    family: familyModule
  },
  state: {
    name: '张三',
    age: 20
  },
  getters: {
    nextYear({state}) {
      return state.age + 1
    }
  },
  // watch: {
  //   age(val) {
  //     // console.log(this.state.name, val)
  //   }
  // },
  actions: {
    addYear({ state }) {
      state.age += 1
    }
  }
})

// console.log(store)
const _family = store.modules.family
// console.log(_family)

console.log('familyNextYear', _family.getters.familyNextYear)
store.dispatch('addYear')
// _family.dispatch('addYear')
// store.dispatch('family/addYear')
// _family.dispatch('family/addYear')

// getters
// console.log(_family.getters.age)
// console.log(store.getters.nextYear)
console.log('familyNextYear', _family.getters.familyNextYear)
// _family.dispatch('addYear')
// console.log('familyNextYear', _family.getters.familyNextYear)
