<template>
<div class="container mx-auto p-10" >
  <div v-if="type == 'register'" class="profile container mx-auto flex flex-col">
    <h1>Who Are You?</h1>
    <p>All fields are required. <span class="text-red"> Don't forget your password!!!</span></p>
    <div class="flex w-full my-4">
      <label class="mx-2" for="user_name">Your Name</label>
      <input id="user_name" class="mx-2 border-2" type="text" v-model="form.name">
    </div>
    <div class="flex w-full my-4">
      <label class="mx-2" for="email">Your Email</label>
      <input id="email" class="mx-2 border-2" type="email" v-model="form.email">
    </div>
    <div class="flex w-full my-4">
      <label class="mx-2" for="password">Your Password</label>
      <input id="password" class="mx-2 border-2" type="password" v-model="form.password">
    </div>
    <button class="button" @click="Register()">Register</button>
    <button class="my-4" @click="type = 'login'" >Log into an existing account</button>
  </div>
  <div v-if="type == 'login'" class="profile container mx-auto flex flex-col">
    <h1>Login</h1>
    <div class="flex w-full my-4">
      <label class="mx-2" for="email">Your Email</label>
      <input id="email" class="mx-2 border-2" type="email" v-model="form.email">
    </div>
    <div class="flex w-full my-4">
      <label class="mx-2" for="password">Your Password</label>
      <input id="password" class="mx-2 border-2" type="password" v-model="form.password">
    </div>
    <button class="button" @click="Login()">Login</button>
    <button class="my-4" @click="type = 'register'" >Register a new account</button>
  </div>
  <p>{{message}}</p>
</div>
</template>

<script>
import { useStore } from 'vuex'
import jwt from 'jsonwebtoken'
import axios from 'axios'
import md5 from 'md5'
import { useRouter } from 'vue-router'

export default {
  name: 'Profile',
  data() {
    return {
      type: "login",
      jwt_secret: "eoSbgkh9Lf-uwaUKI13sz-kjt1W8R0Xv",
      message: "",
      form:  {
        name: "",
        email: "",
        password: "",
      },
    }
  },
  setup() {
    const store = useStore()
    const router = useRouter()
    if(store.state.user) {
      router.push({name:"Update Profile"});
    }
  },
  methods: {
    async Login() {
      this.message = "";
      let token = jwt.sign({ type: "LOGIN",email: this.form.email,password: md5(this.form.password) }, this.jwt_secret);
      let response = await axios.get('https://people-manager.originalbuilders.workers.dev/?jwt='+token).catch(err => {console.log(err);})
      this.message = response.data.message;
      if(response.data.status == 'LOGGED-IN') {
        this.user = JSON.parse(response.data.person);
        this.$store.commit('setState',{key:'token',value:response.data.token})
        this.$router.push({name:"Home"})
      }
    },
    async Register() {
      this.message = "";
      let password = md5(this.form.password);
      let token = jwt.sign({ type: "REGISTER",email: this.form.email,password: password,name:this.form.name }, this.jwt_secret);
      let response = await axios.get('https://people-manager.originalbuilders.workers.dev/?jwt='+token).catch(err => {console.log(err);})
      this.message = response.data.message;
      if(response.data.status == 'LOGGED-IN') {
        this.user = response.data.user;
        this.$store.commit('setState',{key:'token',value:response.data.token})
        this.$router.push({name:"Home"})
      }
    },
  },
  computed: {
    user: {
      set(val) {
        this.$store.commit('setState',{key:'user',value:val})
      },
      get(){
        return this.$store.state.user
      },
    },
  },
  components: {
  }
}
</script>
