import Vue from 'vue'
import VueRouter from 'vue-router'
import GameSolver from '../views/GameSolver.vue'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'GameSolver',
    component: GameSolver
  }
]

const router = new VueRouter({
  mode: 'hash',
  base: process.env.BASE_URL,
  routes
})

export default router

