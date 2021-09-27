<template>
  <div id="people" class="people">
    <div v-if="show.building_menu" class="building-menu fixed top-0 bottom-0 right-0 w-1/2 z-50 bg-white border-2 p-6">
      <button @click="show.building_menu = false">Close</button>
        Building Menu
    </div>
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
      show: {
        building_menu: false,
      },
      websocket:false,
      GameObject: false,
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
    return {
    }
  },
  methods: {
  },
  mounted() {
    const store = useStore()
    this.websocket = new WebSocket("wss://people-engine.originalbuilders.workers.dev/?token="+store.state.token)
    let gameContainer = document.querySelector('#people');
    this.GameObject = new Game(gameContainer.offsetWidth,gameContainer.offsetHeight,store.state.user,this.websocket);
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
