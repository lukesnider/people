import { createStore } from 'vuex'
import Cookies from 'js-cookie'

export default createStore({
  state: {
    user: Cookies.get('me_person') ? JSON.parse(Cookies.get('me_person')) : false,
  },
  mutations: {
    setState(state,payload) {
      state[payload.key] = payload.value
      if(payload.key == 'user') {
        Cookies.set('me_person',JSON.stringify(payload.value),{expires: 365})
      }
    },
    setPosition(state,position) {
      state.user.position = position;
    },
  },
  actions: {
  },
  modules: {
  }
})
