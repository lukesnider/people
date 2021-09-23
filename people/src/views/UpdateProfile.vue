<template>
<div class="container mx-auto p-10" >
  <div class="profile container mx-auto flex flex-col">
    <h1>Update Profile</h1>
    <div class="flex w-full my-4">
      <label class="mx-2" for="user_name">Your Name</label>
      <input id="user_name" class="mx-2 border-2" type="text" v-model="form.name">
    </div>
    <div class="flex w-full my-4">
      <label class="mx-2" for="email">Your Email</label>
      <input id="email" class="mx-2 border-2" type="email" v-model="form.email">
    </div>
    <button class="button" @click="Save()">Save</button>
    <button class="my-6 button" @click="Logout()">Logout</button>
  </div>
  <p>{{message}}</p>
</div>
</template>

<script>
import { useStore } from 'vuex'
import jwt from 'jsonwebtoken'
import axios from 'axios'

export default {
  name: 'UpdateProfile',
  data() {
    return {
      jwt_secret: "eoSbgkh9Lf-uwaUKI13sz-kjt1W8R0Xv",
      message: "",
    }
  },
  setup() {
    const store = useStore()
    let form = {
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
    Logout() {
        this.$store.dispatch("Logout")
        this.$router.push({name:"Profile"});
    },
    async Save() {
      this.message = "";
      let token = jwt.sign({ type: "UPDATE" }, this.jwt_secret);
      let response = await axios.post('https://people-manager.originalbuilders.workers.dev/?jwt='+token+'&token='+this.$store.state.token,JSON.stringify({
                user: this.form,
            }),
            {
                headers: {
                    'Content-Type': 'application/json;charset=UTF-8',
                }
            }
        ).catch(err => {console.log(err);})
        this.message = response.data.message;
        if(response.data && response.data.status == 'UPDATE-SUCCESS')  {
            this.user = this.form;
        }
    }
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
