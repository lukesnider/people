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
import axios from 'axios'
import jwt from 'jsonwebtoken'

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
    async LoadPlayer() {
      this.message = "";
      let token = jwt.sign({ type: "CHECK" }, this.$store.state.jwt_secret);
      let response = await axios.get('https://people-manager.originalbuilders.workers.dev/?jwt='+token+'&token='+this.$store.state.token).catch(err => {console.log(err);})
      if(response.data.status == 'CHECK-SUCCESS') {
        this.$store.commit('setState',{key:'user',value:JSON.parse(response.data.person)});
        this.$store.commit('setState',{key:'token',value:response.data.token})
      }
    },
  },
  mounted() {
    this.LoadPlayer();
    const store = useStore()
    this.websocket = new WebSocket("wss://people-engine.originalbuilders.workers.dev/?token="+store.state.token)
    let gameContainer = document.querySelector('#people');
    this.GameObject = new Game(gameContainer.offsetWidth,gameContainer.offsetHeight,store.state.user,this.websocket);
    // window.onbeforeunload = async function(){
    //   let user = this.store.$state.user;
    //   user.position = this.GameObject.GetPlayerPosition();
    //   await this.websocket.send(JSON.stringify({save_position:{user:user}}))
    //   return 'Are you sure you want to leave?';
    // };
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
