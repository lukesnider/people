<template>
  <div class="profile container mx-auto flex flex-col">
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
    <button class="button" @click="Save()">Save</button>
  </div>
</template>

<script>
import { useStore } from 'vuex'
import { v4 as uuidv4 } from 'uuid';
export default {
  name: 'Profile',
  data() {
    return {
    }
  },
  setup() {
    const store = useStore()
    let form = {
      position: {x: 50,y:50},
      uid: "",
      name: "",
      email: "",
      password: "",
    }
    if(store.state.user) {
      form = store.state.user
    }
    return {
      form
    }
  },
  methods: {
    Save() {
      this.form.uid = uuidv4();
      this.user = this.form
      this.$router.push({name:"Home"})
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
