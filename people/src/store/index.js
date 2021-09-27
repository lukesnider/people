import { createStore } from 'vuex'
import Cookies from 'js-cookie'

export default createStore({
  state: {
    jwt_secret: "eoSbgkh9Lf-uwaUKI13sz-kjt1W8R0Xv",
    token: Cookies.get('me_person_token') ? Cookies.get('me_person_token') : false,
    user: Cookies.get('me_person') ? JSON.parse(Cookies.get('me_person')) : false,
  },
  mutations: {
    setState(state,payload) {
      state[payload.key] = payload.value
      if(payload.key == 'user') {
        Cookies.set('me_person',JSON.stringify(payload.value),{expires: 365})
      }
      if(payload.key == 'token') {
        Cookies.set('me_person_token',payload.value,{expires: 365})
      }
    },
    setPosition(state,position) {
      state.user.position = position;
    },
  },
  actions: {
    Logout({state}) {
      state.user = false;
      Cookies.remove('me_person');
      Cookies.remove('me_person_token');
    },
  },
  modules: {
  }
})
