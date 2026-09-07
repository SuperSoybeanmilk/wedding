import './editor.css'

const SAVE_URL = '/__layout-config'
const MOBILE_MEDIA_QUERY = '(max-width: 760px)'

const LABELS = {
  cover: '封面 · 背景',
  'story-01': '初见 · 主图',
  'gallery-02-main': '同行 · 主图',
  'gallery-02-side': '同行 · 侧图',
  'story-03': '相知 · 主图',
  'gallery-04-main': '相伴 · 主图',
  'gallery-04-side': '相伴 · 侧图',
  'story-05': '此刻 · 主图',
}

const VARIANT_LABELS = { mobile: '手机端', desktop: '电脑端' }
const DEFAULTS = { scale: 1, x: 50, y: 50 }

export function initPhotoEditor({ getSavedConfig, applyPhoto, clearPhoto }) {
  // 生产构建时 import.meta.env.DEV 为 false，整个编辑器不会创建任何 UI。
  if (!import.meta.env.DEV) return

  const photoEls = Array.from(document.querySelectorAll('[data-photo-id]'))
  if (!photoEls.length) return

  const media = window.matchMedia(MOBILE_MEDIA_QUERY)

  const saved = getSavedConfig() || {}
  const draft = {}
  for (const [id, variants] of Object.entries(saved)) {
    draft[id] = {}
    for (const v of ['mobile', 'desktop']) {
      if (variants && variants[v]) draft[id][v] = { ...DEFAULTS, ...variants[v] }
    }
  }

  let activeId = null
  let isActive = false
  let forcedVariant = null

  function variant() {
    return forcedVariant || (media.matches ? 'mobile' : 'desktop')
  }

  function parseObjectPosition(value) {
    const match = String(value || '').match(/(-?\d+(?:\.\d+)?)%\s+(-?\d+(?:\.\d+)?)%/)
    if (!match) return { x: DEFAULTS.x, y: DEFAULTS.y }
    return { x: Number(match[1]), y: Number(match[2]) }
  }

  function defaultsFor(id) {
    const el = photoEls.find((photo) => photo.dataset.photoId === id)
    if (!el) return { ...DEFAULTS }

    if (el.matches('.cover-bg')) {
      const pos = parseObjectPosition(window.getComputedStyle(el).backgroundPosition)
      return { scale: 1, x: pos.x, y: pos.y }
    }

    return { ...DEFAULTS }
  }

  function currentState(id) {
    if (!draft[id]) draft[id] = {}
    if (!draft[id][variant()]) draft[id][variant()] = defaultsFor(id)
    return draft[id][variant()]
  }

  function applyId(id) {
    const el = photoEls.find((photo) => photo.dataset.photoId === id)
    if (!el) return
    const state = draft[id] && draft[id][variant()]
    if (state) applyPhoto(el, state)
    else clearPhoto(el)
  }

  function applyAll() {
    for (const el of photoEls) {
      const id = el.dataset.photoId
      const state = draft[id] && draft[id][variant()]
      if (state) applyPhoto(el, state)
      else clearPhoto(el)
    }
  }

  // ---------- UI ----------
  const toggle = document.createElement('button')
  toggle.type = 'button'
  toggle.className = 'photo-editor-toggle'
  toggle.textContent = '调整图片'
  document.body.append(toggle)

  const panel = document.createElement('div')
  panel.className = 'photo-editor-panel'
  panel.hidden = true
  panel.innerHTML = `
    <div class="photo-editor-panel-head">
      <strong id="photo-editor-title">选择一张图片</strong>
      <button type="button" class="photo-editor-close" aria-label="退出调整">&times;</button>
    </div>
    <div class="photo-editor-variant-switch">
      <button type="button" class="pe-variant-btn" data-variant="auto">自动</button>
      <button type="button" class="pe-variant-btn" data-variant="mobile">手机端</button>
      <button type="button" class="pe-variant-btn" data-variant="desktop">电脑端</button>
    </div>
    <p class="photo-editor-variant" id="photo-editor-variant"></p>
    <p class="photo-editor-hint" id="photo-editor-hint"></p>
    <div class="photo-editor-controls">
      <label class="photo-editor-row">
        <span>缩放</span>
        <input type="range" id="pe-scale" min="0.5" max="3" step="0.01">
        <output id="pe-scale-val">1.00</output>
      </label>
      <label class="photo-editor-row">
        <span>水平位置</span>
        <input type="range" id="pe-x" min="0" max="100" step="1">
        <output id="pe-x-val">50%</output>
      </label>
      <label class="photo-editor-row">
        <span>垂直位置</span>
        <input type="range" id="pe-y" min="0" max="100" step="1">
        <output id="pe-y-val">50%</output>
      </label>
    </div>
    <p class="photo-editor-hint photo-editor-zoom-hint">提示：图片默认完整显示（不裁剪）；「缩放」调大小，「位置」移动图片，超出画框的部分会被裁掉。</p>
    <div class="photo-editor-actions">
      <button type="button" id="pe-reset">重置本张</button>
      <button type="button" id="pe-save">保存全部</button>
    </div>
    <p class="photo-editor-status" aria-live="polite"></p>
  `
  document.body.append(panel)

  const scaleInput = panel.querySelector('#pe-scale')
  const xInput = panel.querySelector('#pe-x')
  const yInput = panel.querySelector('#pe-y')
  const scaleVal = panel.querySelector('#pe-scale-val')
  const xVal = panel.querySelector('#pe-x-val')
  const yVal = panel.querySelector('#pe-y-val')
  const titleEl = panel.querySelector('#photo-editor-title')
  const variantEl = panel.querySelector('#photo-editor-variant')
  const hintEl = panel.querySelector('#photo-editor-hint')
  const statusEl = panel.querySelector('.photo-editor-status')
  const resetBtn = panel.querySelector('#pe-reset')
  const saveBtn = panel.querySelector('#pe-save')
  const variantBtns = panel.querySelectorAll('.pe-variant-btn')

  // 让面板可通过标题栏拖动，避免挡住图片无法选中
  const panelHead = panel.querySelector('.photo-editor-panel-head')
  let dragState = null

  panelHead.addEventListener('pointerdown', (event) => {
    if (event.target.closest('.photo-editor-close')) return
    const rect = panel.getBoundingClientRect()
    panel.style.left = `${rect.left}px`
    panel.style.top = `${rect.top}px`
    panel.style.right = 'auto'
    panel.style.bottom = 'auto'
    dragState = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startLeft: rect.left,
      startTop: rect.top,
    }
    panelHead.setPointerCapture(event.pointerId)
    panelHead.classList.add('is-dragging')
  })

  panelHead.addEventListener('pointermove', (event) => {
    if (!dragState || event.pointerId !== dragState.pointerId) return
    const dx = event.clientX - dragState.startX
    const dy = event.clientY - dragState.startY
    panel.style.left = `${dragState.startLeft + dx}px`
    panel.style.top = `${dragState.startTop + dy}px`
  })

  function endDrag(event) {
    if (!dragState || event.pointerId !== dragState.pointerId) return
    dragState = null
    panelHead.classList.remove('is-dragging')
  }

  panelHead.addEventListener('pointerup', endDrag)
  panelHead.addEventListener('pointercancel', endDrag)

  function syncOutputs() {
    scaleVal.textContent = Number(scaleInput.value).toFixed(2)
    xVal.textContent = `${Math.round(Number(xInput.value))}%`
    yVal.textContent = `${Math.round(Number(yInput.value))}%`
  }

  function syncVariantLabel() {
    const v = variant()
    const viewportVariant = media.matches ? 'mobile' : 'desktop'

    variantEl.textContent = `当前编辑：${VARIANT_LABELS[v]}`

    if (forcedVariant && forcedVariant !== viewportVariant) {
      hintEl.textContent = `当前屏幕显示的是${VARIANT_LABELS[viewportVariant]}图片，你正在编辑${VARIANT_LABELS[v]}，最终效果请以${VARIANT_LABELS[v]}预览为准。`
    } else if (!forcedVariant) {
      hintEl.textContent = '手机端与电脑端各自独立保存。想调手机端：点上方「手机端」，或把窗口缩到 760px 以下。'
    } else {
      hintEl.textContent = ''
    }
  }

  function syncVariantButtons() {
    const active = forcedVariant || 'auto'
    variantBtns.forEach((btn) => {
      btn.classList.toggle('is-active', btn.dataset.variant === active)
    })
  }

  function setSelection(id) {
    activeId = id
    photoEls.forEach((el) => {
      el.classList.toggle('is-editing-target', el.dataset.photoId === id)
    })
    document.querySelector('.cover-slide')?.classList.toggle('is-editing-cover', id === 'cover')
    syncVariantLabel()
    syncVariantButtons()

    if (!id) {
      titleEl.textContent = '选择一张图片'
      resetBtn.disabled = true
      for (const input of [scaleInput, xInput, yInput]) input.disabled = true
      return
    }

    titleEl.textContent = LABELS[id] || id
    resetBtn.disabled = false
    for (const input of [scaleInput, xInput, yInput]) input.disabled = false
    scaleInput.min = '0.5'

    const state = currentState(id)
    scaleInput.value = String(state.scale)
    xInput.value = String(state.x)
    yInput.value = String(state.y)
    syncOutputs()
  }

  function commitActive() {
    if (!activeId) return
    if (!draft[activeId]) draft[activeId] = {}
    draft[activeId][variant()] = {
      scale: Number(scaleInput.value),
      x: Number(xInput.value),
      y: Number(yInput.value),
    }
    applyId(activeId)
  }

  function setActive(nextActive) {
    isActive = nextActive
    document.body.classList.toggle('photo-editing', isActive)
    panel.hidden = !isActive
    toggle.classList.toggle('is-active', isActive)
    toggle.textContent = isActive ? '退出调整' : '调整图片'

    if (!isActive) {
      setSelection(null)
    }
  }

  toggle.addEventListener('click', () => setActive(!isActive))
  panel.querySelector('.photo-editor-close').addEventListener('click', () => setActive(false))

  for (const input of [scaleInput, xInput, yInput]) {
    input.addEventListener('input', () => {
      syncOutputs()
      commitActive()
    })
  }

  photoEls.forEach((el) => {
    el.addEventListener('click', (event) => {
      if (!isActive) return
      event.stopPropagation()
      event.preventDefault()
      setSelection(el.dataset.photoId)
    })
  })

  variantBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      forcedVariant = btn.dataset.variant === 'auto' ? null : btn.dataset.variant
      applyAll()
      setSelection(activeId)
    })
  })

  resetBtn.addEventListener('click', () => {
    if (!activeId) return
    if (draft[activeId]) delete draft[activeId][variant()]
    applyId(activeId)
    setSelection(activeId)
  })

  saveBtn.addEventListener('click', async () => {
    commitActive()

    const payload = {}
    for (const [id, variants] of Object.entries(draft)) {
      if (!variants || !Object.keys(variants).length) continue
      payload[id] = {}
      for (const [v, state] of Object.entries(variants)) {
        payload[id][v] = { ...state }
      }
    }

    saveBtn.disabled = true
    statusEl.textContent = '正在保存...'
    try {
      const response = await fetch(SAVE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const result = await response.json().catch(() => ({}))
      if (result.ok === false) throw new Error(result.error || '写入失败')
      statusEl.textContent = '已保存，页面即将刷新。'
    } catch (error) {
      console.error(error)
      statusEl.textContent = `保存失败：${error.message}`
    } finally {
      saveBtn.disabled = false
    }
  })

  media.addEventListener('change', () => {
    if (!isActive || forcedVariant) return
    applyAll()
    setSelection(activeId)
  })

  applyAll()
}
