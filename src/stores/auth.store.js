import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '../services/api.js'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const token = ref(localStorage.getItem('access_token'))

  async function login(email, password) {
    const params = new URLSearchParams()
    params.append('username', email)
    params.append('password', password)

    const { data } = await api.post('/auth/login', params, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    })

    token.value = data.access_token
    user.value = { email: data.email || email, name: data.name || null }

    localStorage.setItem('access_token', data.access_token)
    localStorage.setItem('refresh_token', data.refresh_token)
    localStorage.setItem('user_email', data.email || email)
    // Nombre para la firma de presupuestos en PDF (igual que Android)
    if (data.name) {
      localStorage.setItem('user_name', data.name)
    } else {
      // Usuarios antiguos: pedirlo al backend
      api.get('/auth/me').then(({ data: me }) => {
        if (me && me.name) localStorage.setItem('user_name', me.name)
      }).catch(() => {})
    }
    localStorage.setItem('access_token_exp', Date.now() + 60 * 60 * 1000)
    localStorage.setItem('refresh_token_exp', Date.now() + 30 * 24 * 60 * 60 * 1000)

    return data
  }

  function logout() {
    token.value = null
    user.value = null
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('user_email')
    localStorage.removeItem('user_name')
    localStorage.removeItem('access_token_exp')
    localStorage.removeItem('refresh_token_exp')
  }

  return { user, token, login, logout }
})
