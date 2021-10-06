<template>
  <div id="people" class="people">
    <div v-if="show.building_menu" class="building-menu fixed top-0 bottom-0 right-0 w-1/2 z-50 bg-white border-2 border-black p-6">
      <button @click="show.building_menu = false">Close</button>
        Building Menu
    </div>
    <div v-if="show.legend" class="overflow-y-scroll	 building-menu fixed top-0 left-0 w-1/2 h-1/2 z-50 bg-white border-2 border-black p-6">
        <button @click="show.legend = false">Close</button>
        <div class="flex flex-col p-2">
          <p>
            Once the game has loaded you will be able to move. You are, however invulnerable for the first 8 seconds of gameplay and unable to shoot and build. Once your player text turns black you are no longer invulnerable.
          </p>
        </div>
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
            <p class="mr-2" ><strong>C : </strong></p>
            Toggle game chat
          </div>
          <div class="flex my-2">
            <p class="mr-2" ><strong>K : </strong></p>
            Toggle game stats
          </div>
        </div>
    </div>
    <div v-if="show.kill_death" class="overflow-y-scroll	 building-menu fixed top-0 left-0 w-1/2 h-1/4 z-50 bg-white border-2 border-black p-6">
      <!--<button @click="show.kill_death = false">Close</button>-->
        <div class="flex flex-col p-2">
          <div v-for="(stat,i) in stats" :key="i" class="flex my-2 flex-col">
            <p class="mr-2" ><strong>{{stat.name}} : </strong></p>
            Kills: {{stat.kills.length}} - Deaths: {{stat.deaths.length}} - Structures Built: {{stat.structures.built}} - Structures Destroyed: {{stat.structures.destroyed}}
          </div>
        </div>
    </div>
    <div v-show="unread_messages" class="unread_messages_text fixed bottom-12 right-8 w-max">Press "C" for chat</div>
    <div v-show="unread_messages" class="unread_messages flex justify-center items-center fixed bottom-6 right-6 h-4 w-4 z-50 rounded-full text-white text-sm">{{unread_messages}}</div>
    <div v-show="show.chat" class="building-menu fixed bottom-0 right-0 w-4/12 h-3/4 z-50 bg-white border-2 border-black">
        <div class="flex flex-col relative h-full">
          <div ref="chat-messages" class="h-5/6 messages overflow-y-scroll pb-6">
            <ul class="list-none">
              <li v-for="(message,i) in messages" :key="i" :class="[{'notme':message.author_uid != user.uid},'chat-message']">
                <div class="message-name text-xs italic">{{message.author}}</div>
                <div :class="[{'rounded-l-full':message.author_uid != user.uid,'rounded-r-full':message.author_uid == user.uid},'message shadow-lg p-2 border']">
                {{message.text}}
                </div>
              </li>
            </ul>
          </div>
          <div class="bg-white h-1/6 fixed compose w-full absolute bottom-0 left-0 right-0 flex">
            <textarea ref="chat-compose" v-on:keyup.enter="SendMessage" class="w-3/4 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 mt-1 block w-full sm:text-sm border border-gray-300 rounded-md" v-model="compose_message">
            </textarea>
            <button @click="SendMessage" class="w-1/4" >SEND</button>
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
import { v4 as uuidv4 } from 'uuid';

export default {
  name: 'Home',
  data() {
    return {
      stats: false,
      show: {
        building_menu: false,
        kill_death: false,
        legend: true,
        chat: false,
      },
      compose_message: "",
      messages: [],
      websocket:false,
      GameObject: false,
      unread_messages: 0,
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
    AddMessages(messages) {
      this.messages = messages;
    },
    AddMessage(message) {
      if(!this.show.chat) this.unread_messages += 1;
      this.messages.push(message);
    },
    SendMessage() {
      if(!this.compose_message || this.compose_message.trim() == "") {
        return;
      }
      let uid = uuidv4();
      let message = {
        uid: uid,
        author: this.user.name,
        author_uid: this.user.uid,
        text: this.compose_message,
      };
      this.messages.push(message);
      this.compose_message = "";
      this.websocket.send(JSON.stringify({chat_message:message}));
      let that = this;
      this.$nextTick(()=>{
        that.$refs["chat-messages"].scrollTop = that.$refs["chat-messages"].scrollHeight;
      })
    },
    CloseAll() {
      for(let i in this.show){
        this.show[i] = false;
      }
      this.GameObject.FocusIn()
    },
    toggleChat() {
      this.show.chat = !this.show.chat;
      let that = this;
      this.$nextTick(()=>{
        if(!that.show.chat) that.GameObject.FocusIn();
        if(that.show.chat) {
          that.unread_messages = 0;
          that.$refs["chat-compose"].focus();
        }
      })
    },
    toggleStats() {
      this.show.kill_death = !this.show.kill_death;
      if(!this.show.kill_death) this.GameObject.FocusIn();
    },
    toggleGameLegend() {
      this.show.legend = !this.show.legend;
      if(!this.show.legend) this.GameObject.FocusIn();
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
    let that = this;
    document.onkeydown = function(evt) {
        evt = evt || window.event;
        var isEscape = false;
        if ("key" in evt) {
            isEscape = (evt.key === "Escape" || evt.key === "Esc");
        } else {
            isEscape = (evt.keyCode === 27);
        }
        if (isEscape) {
            that.CloseAll()
        }
    };
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
<style>
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
.chat-message.notme .message{
  background-color: #acacff;
}
.chat-message.notme .message-name{
  text-align: right;
  width: 100%;
}
.unread_messages_text {
  color: rgba(255, 82, 82, 1);
}
.unread_messages {
  background: rgba(255, 82, 82, 1);
  box-shadow: 0 0 0 0 rgba(255, 82, 82, 1);
  animation: pulse-red 2s infinite;
}
@keyframes pulse-red {
  0% {
    transform: scale(0.95);
    box-shadow: 0 0 0 0 rgba(255, 82, 82, 0.7);
  }
  
  70% {
    transform: scale(1);
    box-shadow: 0 0 0 10px rgba(255, 82, 82, 0);
  }
  
  100% {
    transform: scale(0.95);
    box-shadow: 0 0 0 0 rgba(255, 82, 82, 0);
  }
}

</style>
