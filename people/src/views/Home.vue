<template>
  <div id="people" class="people">
    <!--<button class="absolute top-0 left-0 z-50 bg-black text-white" @click="Clean()">Clean</button>-->
    <!--<div v-if="user" class="board">
      <div class="person my-4 w-full" v-for="(person,i) in people" :key="i" :style="'transform:translate('+person.position.x+'px,'+person.position.y+'px);'">
        <div class="text-sm">{{person.name}}</div>
      </div>
    </div>-->
  </div>
</template>

<script>
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'
import { ref } from 'vue' 
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
    const people = ref({})
    const websocket = new WebSocket("wss://people-engine.originalbuilders.workers.dev/?token="+store.state.token)
    websocket.addEventListener("message", (event) => {
      let data = JSON.parse(event.data);
      if(data.joined) {
        people.value[data.joined.uid] = data.joined;
      }
      if(data.people) {
        for(let uid in data.people) {
          if(!people[uid]) people.value[uid] = data.people[uid];
        }
      }
      if(data.quit) {
        if(people.value[data.quit.uid]) delete people.value[data.quit.uid];
      }
      if(data.update_position) {
        people.value[data.update_position.uid].position = data.update_position.position;
      }
    })
    websocket.addEventListener("open", () => {
        websocket.send(JSON.stringify(store.state.user))
    })
    // document.onkeypress = function (e) {
    //     e = e || window.event;
    //     let position;
    //     if(e.keyCode == 119){
    //       //up
    //       position = {x: store.state.user.position.x,y:store.state.user.position.y - 15}
    //       store.commit('setPosition',position)
    //       websocket.send(JSON.stringify({update_position:{uid:store.state.user.uid,position:store.state.user.position}}))
    //     }
    //     if(e.keyCode == 115){
    //       //down
    //       position = {x: store.state.user.position.x,y:store.state.user.position.y + 15}
    //       store.commit('setPosition',position)
    //       websocket.send(JSON.stringify({update_position:{uid:store.state.user.uid,position:store.state.user.position}}))
    //     }
    //     if(e.keyCode == 97){
    //       //left
    //       position = {x: store.state.user.position.x - 15,y:store.state.user.position.y}
    //       store.commit('setPosition',position)
    //       websocket.send(JSON.stringify({update_position:{uid:store.state.user.uid,position:store.state.user.position}}))
    //     }
    //     if(e.keyCode == 100){
    //       //right
    //       position = {x: store.state.user.position.x + 15,y:store.state.user.position.y}
    //       store.commit('setPosition',position)
    //       websocket.send(JSON.stringify({update_position:{uid:store.state.user.uid,position:store.state.user.position}}))
    //     }
    // };
    return {
      people,
      websocket
    }
  },
  methods: {
    BroadcastPosition() {
      this.websocket.send(JSON.stringify({update_position:{uid:this.user.uid,position:this.user.position}}))
    },
    Clean() {
      this.websocket.send(JSON.stringify({clean_house:true}))
    },
  },
  mounted() {
    let vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0)
    let vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0)
    new Game(vw,vh);
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
/* .board .person::after {
  content: "   ";
  position: absolute;
  top: 25px;
  height: 25px;
  width: 25px;
  background-color: black;
} */
</style>
