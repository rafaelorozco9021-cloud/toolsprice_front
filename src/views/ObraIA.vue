<template>
  <main class="bg-gray-50 min-h-screen p-3 md:p-6">
    <header class="max-w-5xl mx-auto flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
      <h1 class="text-xl md:text-2xl font-bold text-gray-800">ToolsPrice <span class="text-xs md:text-sm font-normal text-gray-500">· Analizar obra con IA</span></h1>
      <div class="flex flex-wrap items-center gap-2">
        <button @click="$router.push('/dashboard')" class="px-4 py-2 bg-white border rounded-lg text-xs md:text-sm font-semibold hover:bg-gray-50">🏗 Materiales</button>
        <button @click="$router.push('/mano-de-obra')" class="px-4 py-2 bg-white border rounded-lg text-xs md:text-sm font-semibold hover:bg-gray-50">👷 Mano de Obra</button>
        <button @click="$router.push('/presupuesto')" class="px-4 py-2 bg-purple-600 text-white rounded-lg text-xs md:text-sm font-bold hover:bg-purple-700">🛒 Presupuesto <span v-if="budgetStore.itemsCount" class="bg-white text-purple-700 text-xs px-2 py-0.5 rounded-full">{{ budgetStore.itemsCount }}</span></button>
      </div>
    </header>

    <div class="max-w-5xl mx-auto">
      <!-- Entrada -->
      <div class="bg-white p-4 md:p-6 rounded-lg shadow mb-6">
        <h3 class="font-bold text-gray-800 mb-1">Describe tu obra</h3>
        <p class="text-xs text-gray-500 mb-3">Ej: "levantar un muro de 3 metros de ancho por 2.50 de alto". La IA calcula materiales, busca precios reales en Homecenter y la mano de obra del tabulador.</p>
        <textarea v-model="descripcion" rows="3" placeholder="Describe la obra: qué hay que hacer y las medidas si las tienes..." class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm md:text-base"></textarea>
        <div class="flex flex-wrap gap-2 mt-3">
          <button v-for="ej in ejemplos" :key="ej" @click="descripcion = ej" class="px-3 py-1.5 bg-purple-50 text-purple-700 border border-purple-200 rounded-full text-xs font-semibold hover:bg-purple-100">{{ ej }}</button>
        </div>
        <button @click="analizar" :disabled="loading || !descripcion.trim()" class="w-full mt-4 bg-purple-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-purple-700 disabled:opacity-60 flex items-center justify-center gap-2 text-sm md:text-base min-h-[48px]">
          <svg v-if="loading" class="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
          {{ loading ? 'Analizando y consultando Homecenter...' : '🤖 Analizar obra' }}
        </button>
        <p v-if="error" class="text-red-600 text-sm text-center mt-3">{{ error }}</p>
      </div>

      <!-- Resultado -->
      <div v-if="resultado">
        <div class="bg-white p-4 md:p-6 rounded-lg shadow mb-4">
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-2">
            <div>
              <h3 class="text-lg font-bold text-gray-800">{{ resultado.obra.tipo }}</h3>
              <p class="text-sm text-gray-500">{{ resultado.obra.medidas_usadas }}</p>
            </div>
            <div class="text-right">
              <p v-if="resultado.obra.area_m2" class="text-sm text-gray-500">Área: <b class="text-gray-800">{{ resultado.obra.area_m2 }} m²</b></p>
              <p class="text-2xl font-extrabold text-purple-600">${{ fmt(resultado.total) }} <span class="text-xs font-normal text-gray-500">COP</span></p>
            </div>
          </div>
          <div v-if="resultado.advertencias.length" class="mt-3 space-y-1">
            <p v-for="(a, i) in resultado.advertencias" :key="i" class="text-xs bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg px-3 py-2">⚠️ {{ a }}</p>
          </div>
        </div>

        <!-- Materiales -->
        <div class="bg-white rounded-lg shadow overflow-hidden mb-4">
          <h3 class="text-sm font-bold text-white bg-gradient-to-r from-purple-600 to-orange-500 px-4 py-2">1 · Materiales <span class="ml-2 bg-white text-purple-700 text-xs px-2 py-0.5 rounded font-bold">${{ fmt(resultado.subtotal_materiales) }}</span></h3>
          <ul class="divide-y">
            <li v-for="(m, i) in resultado.materiales" :key="i" class="p-4 flex flex-col md:flex-row md:items-center gap-3">
              <img :src="m.imagen_url || 'https://via.placeholder.com/100'" class="w-16 h-16 object-contain bg-white border rounded p-1 shrink-0" @error="e => e.target.src='https://via.placeholder.com/100'" />
              <div class="flex-1 min-w-0">
                <p class="font-semibold text-gray-800 text-sm">{{ m.nombre }}</p>
                <p class="text-xs text-gray-500">{{ m.marca || '—' }} · {{ m.nota }}</p>
                <p v-if="!m.encontrado" class="text-xs text-red-500 font-semibold">Sin precio en Homecenter — revísalo</p>
                <p v-else class="text-sm font-bold text-purple-600 mt-1">${{ fmt(m.precio) }} <span class="text-xs font-normal text-gray-500">/ {{ m.unidad }}</span></p>
              </div>
              <div class="flex items-center gap-2 shrink-0">
                <button @click="m.cantidad = redondear(m.cantidad - paso(m.unidad))" class="w-9 h-9 border-2 rounded-lg font-bold">−</button>
                <input v-model.number="m.cantidad" type="number" min="0" step="any" class="w-20 px-2 py-2 border-2 rounded-lg text-center font-bold" />
                <button @click="m.cantidad = redondear(m.cantidad + paso(m.unidad))" class="w-9 h-9 border-2 rounded-lg font-bold">+</button>
              </div>
              <p class="text-sm font-bold text-gray-800 md:w-28 md:text-right shrink-0">= ${{ fmt(m.precio * m.cantidad) }}</p>
            </li>
          </ul>
        </div>

        <!-- Mano de obra -->
        <div class="bg-white rounded-lg shadow overflow-hidden mb-4">
          <h3 class="text-sm font-bold text-white bg-gradient-to-r from-orange-500 to-purple-600 px-4 py-2">2 · Mano de obra <span class="ml-2 bg-white text-orange-600 text-xs px-2 py-0.5 rounded font-bold">${{ fmt(resultado.subtotal_mano_obra) }}</span></h3>
          <ul class="divide-y">
            <li v-for="(t, i) in resultado.mano_de_obra" :key="i" class="p-4 flex flex-col md:flex-row md:items-center gap-3">
              <div class="flex-1 min-w-0">
                <p class="font-semibold text-gray-800 text-sm">{{ t.nombre }}</p>
                <p class="text-xs text-gray-500">{{ t.categoria }} · {{ t.nota }}</p>
                <p class="text-sm font-bold text-purple-600 mt-1">${{ fmt(t.precio_unitario) }} <span class="text-xs font-normal text-gray-500">/ {{ t.unidad }}</span></p>
              </div>
              <div class="flex items-center gap-2 shrink-0">
                <button @click="t.cantidad = redondear(Math.max(0, t.cantidad - paso(t.unidad)))" class="w-9 h-9 border-2 rounded-lg font-bold">−</button>
                <input v-model.number="t.cantidad" type="number" min="0" step="any" class="w-20 px-2 py-2 border-2 rounded-lg text-center font-bold" />
                <button @click="t.cantidad = redondear(t.cantidad + paso(t.unidad))" class="w-9 h-9 border-2 rounded-lg font-bold">+</button>
              </div>
              <p class="text-sm font-bold text-gray-800 md:w-28 md:text-right shrink-0">= ${{ fmt(t.precio_unitario * t.cantidad) }}</p>
            </li>
          </ul>
        </div>

        <!-- Totales + acciones -->
        <div class="bg-white p-4 md:p-6 rounded-lg shadow">
          <p class="text-sm text-gray-600">Subtotal materiales: <b>${{ fmt(totalMateriales) }}</b></p>
          <p class="text-sm text-gray-600">Subtotal mano de obra: <b>${{ fmt(totalMano) }}</b></p>
          <p class="text-sm text-gray-600">IVA (16%): <b>${{ fmt(iva) }}</b></p>
          <p class="text-xl font-extrabold text-purple-600 mt-1">Total: ${{ fmt(total) }} COP</p>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4">
            <button @click="agregar('todo')" class="bg-green-600 text-white px-4 py-3 rounded-lg font-bold hover:bg-green-700 min-h-[48px]">✅ Agregar todo al presupuesto</button>
            <button @click="agregar('materiales')" class="bg-purple-600 text-white px-4 py-3 rounded-lg font-bold hover:bg-purple-700 min-h-[48px]">Solo materiales</button>
            <button @click="agregar('mano')" class="bg-orange-500 text-white px-4 py-3 rounded-lg font-bold hover:bg-orange-600 min-h-[48px]">Solo mano de obra</button>
            <button @click="resultado = null" class="bg-gray-200 px-4 py-3 rounded-lg font-bold hover:bg-gray-300 min-h-[48px]">Cancelar</button>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useBudgetStore } from '../stores/budget.store.js'

const router = useRouter()
const budgetStore = useBudgetStore()

const descripcion = ref('')
const loading = ref(false)
const error = ref('')
const resultado = ref(null)

const ejemplos = [
  'levantar un muro de 3 metros de ancho por 2.50 de alto',
  'instalar 20 m² de piso cerámico',
  'pintar 40 m² de pared interior a 2 manos',
  'enchape de baño de 8 m²',
]

const fmt = (n) => Number(n || 0).toLocaleString('es-CO', { maximumFractionDigits: 0 })
const paso = (u) => (u === 'unidad' || u === 'punto' ? 1 : 0.5)
const redondear = (n) => Math.round(Math.max(0, Number(n) || 0) * 100) / 100

const totalMateriales = computed(() => (resultado.value?.materiales || []).reduce((s, m) => s + (Number(m.precio) || 0) * (Number(m.cantidad) || 0), 0))
const totalMano = computed(() => (resultado.value?.mano_de_obra || []).reduce((s, t) => s + (Number(t.precio_unitario) || 0) * (Number(t.cantidad) || 0), 0))
const iva = computed(() => Math.round((totalMateriales.value + totalMano.value) * 0.16))
const total = computed(() => totalMateriales.value + totalMano.value + iva.value)

const analizar = async () => {
  error.value = ''
  resultado.value = null
  if (!descripcion.value.trim()) return
  const token = localStorage.getItem('access_token')
  if (!token) { router.push('/login'); return }
  loading.value = true
  try {
    const r = await fetch('https://toolsprice-back.onrender.com/api/ai/analizar-obra', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ descripcion: descripcion.value.trim() }),
    })
    const d = await r.json()
    if (r.status === 401) { localStorage.clear(); router.push('/login'); return }
    if (!r.ok) throw new Error(d.detail || 'No se pudo analizar la obra')
    d.materiales.forEach((m) => { m.cantidad = Number(m.cantidad) || 0 })
    d.mano_de_obra.forEach((t) => { t.cantidad = Number(t.cantidad) || 0 })
    resultado.value = d
  } catch (e) {
    error.value = e.message || 'Error de conexión'
  } finally {
    loading.value = false
  }
}

const aItemMaterial = (m, idx) => ({
  nombre: m.nombre || m.nombre_busqueda,
  categoria: m.categoria || 'Materiales',
  marca: m.marca || '',
  precio: Number(m.precio) || 0,
  moneda: m.moneda || 'COP',
  unidad_medida: m.unidad || 'unidad',
  imagen_url: m.imagen_url || 'https://via.placeholder.com/300x200?text=Sin+imagen',
  url_producto: m.url_producto || `ai-mat-${idx}-${Date.now()}`,
  disponibilidad: m.encontrado,
  seccion: 'materiales',
})

const aItemMano = (t, idx) => ({
  nombre: `${t.nombre} (${t.categoria || 'Mano de obra'} - ${t.unidad})`,
  categoria: t.categoria || 'Mano de obra',
  marca: 'Mano de Obra',
  precio: Number(t.precio_unitario) || 0,
  moneda: 'COP',
  unidad_medida: t.unidad || 'm²',
  imagen_url: 'https://via.placeholder.com/300x200?text=Mano+de+Obra',
  url_producto: `ai-mano-${idx}-${Date.now()}`,
  disponibilidad: t.encontrado,
  seccion: 'mano_obra',
})

const agregar = (modo) => {
  if (!resultado.value) return
  if (modo === 'todo' || modo === 'materiales') {
    resultado.value.materiales.forEach((m, i) => {
      if ((Number(m.cantidad) || 0) > 0) budgetStore.addItem(aItemMaterial(m, i), m.cantidad)
    })
  }
  if (modo === 'todo' || modo === 'mano') {
    resultado.value.mano_de_obra.forEach((t, i) => {
      if ((Number(t.cantidad) || 0) > 0) budgetStore.addItem(aItemMano(t, i), t.cantidad)
    })
  }
  router.push('/presupuesto')
}
</script>
