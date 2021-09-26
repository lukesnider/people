<template>
  <div id="people" class="people">
  </div>
</template>

<script>
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'
import {Game} from '../game/main.js'

export default {
  name: 'Home',
  data() {
    return {
    }
  },
  setup() {
    const router = useRouter()
    const store = useStore()
    if(!store.state.user || !store.state.user.version || store.state.user.version != "0.1.0") {
      store.dispatch("Logout");
      router.push({
        name: "Profile"
      });
    }
    let vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0)
    let vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0)
    const websocket = new WebSocket("wss://people-engine.originalbuilders.workers.dev/?token="+store.state.token)
    let GameObject = new Game(vw,vh,store.state.user,websocket);
    return {
      GameObject,
      websocket
    }
  },
  methods: {
  },
  mounted() {
  },
  computed: {
    user() {
      return this.$store.state.user
    },
  },
  components: {
  }
}
</script>
<style scoped>
.people {
  height:100vh;
  width: 100%;
}
.board {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
}
.board .person {
  position: absolute;
  height: 50px;
  width: 50px;
}
</style>
