import { createRouter, createWebHashHistory } from 'vue-router'
import LandingPage from '../views/LandingPage.vue'
import Register from '../views/Register.vue'
import Login from '../views/Login.vue'
import Dashboard from '../views/Dashboard.vue'
import MisFacturas from '../views/MisFacturas.vue'
import ManoDeObra from '../views/ManoDeObra.vue'
import Presupuesto from '../views/Presupuesto.vue'

const routes = [
  { path: '/', name: 'Landing', component: LandingPage },
  { path: '/register', name: 'Register', component: Register },
  { path: '/login', name: 'Login', component: Login },
  { path: '/dashboard', name: 'Dashboard', component: Dashboard, meta: { requiresAuth: true } },
  { path: '/presupuesto', name: 'Presupuesto', component: Presupuesto, meta: { requiresAuth: true } },
  { path: '/carrito', redirect: '/presupuesto' },
  { path: '/mis-facturas', name: 'MisFacturas', component: MisFacturas, meta: { requiresAuth: true } },
  { path: '/mano-de-obra', name: 'ManoDeObra', component: ManoDeObra, meta: { requiresAuth: true } },
  { path: '/:pathMatch(.*)*', redirect: '/' },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const auth = localStorage.getItem('access_token')
  if (to.meta.requiresAuth && !auth) {
    next('/login')
  } else {
    next()
  }
})

export default router
