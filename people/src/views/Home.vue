<template>
  <div id="people" class="people">
    <div v-if="show.building_menu" class="building-menu fixed top-0 bottom-0 right-0 w-1/2 z-50 bg-white border-2 p-6">
      <button @click="show.building_menu = false">Close</button>
        Building Menu
    </div>
    <div v-if="show.legend" class="overflow-y-scroll	 building-menu fixed top-0 left-0 w-1/2 h-1/4 z-50 bg-white border-2 p-6">
        <button @click="show.legend = false">Close</button>
        <div class="flex flex-col p-2">
          <div class="flex my-2">
            <p class="mr-2" ><strong>L : </strong></p>
            Toggle game legend
          </div>
          <div class="flex my-2">
            <p class="mr-2" ><strong>Q : </strong></p>
            Set to Build mode
          </div>
          <div class="flex my-2">
            <p class="mr-2" ><strong>E : </strong></p>
            Set to Shoot mode
          </div>
          <div class="flex my-2">
            <p class="mr-2" ><strong>Left mouse click : </strong></p>
            Perform action (Shoot / Build)
          </div>
          <div class="flex my-2">
            <p class="mr-2" ><strong>WASD : </strong></p>
            Movement. <strong>A - Left, D - Right, S - Down, W - Up</strong>
          </div>
          <div class="flex my-2">
            <p class="mr-2" ><strong>SHIFT : </strong></p>
            Sprint
          </div>
          <div class="flex my-2">
            <p class="mr-2" ><strong>K : </strong></p>
            Toggle game stats
          </div>
        </div>
    </div>
    <div v-if="show.kill_death" class="overflow-y-scroll	 building-menu fixed top-0 left-0 w-1/2 h-1/4 z-50 bg-white border-2 p-6">
      <!--<button @click="show.kill_death = false">Close</button>-->
        <div class="flex flex-col p-2">
          <div v-for="(stat,i) in stats" class="flex my-2 flex-col">
            <p class="mr-2" ><strong>{{stat.name}} : </strong></p>
            Kills: {{stat.kills.length}} - Deaths: {{stat.deaths.length}} - Structures Built: {{stat.structures.built}} - Structures Destroyed: {{stat.structures.destroyed}}
          </div>
        </div>
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
      stats: false,
      show: {
        building_menu: false,
        kill_death: false,
        legend: true,
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
    toggleStats() {
      this.show.kill_death = !this.show.kill_death;
    },
    toggleGameLegend() {
      this.show.legend = !this.show.legend;
    },
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
    this.websocket = new WebSocket("wss://people-engine.originalbuilders.workers.dev/?token="+store.state.token);
    let gameContainer = document.querySelector('#people');
    this.GameObject = new Game(gameContainer.offsetWidth,gameContainer.offsetHeight,store.state.user,this.websocket,this);
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
