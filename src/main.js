import './style.css'
import Swiper from 'swiper'
import { EffectFade, Mousewheel, Pagination, Parallax } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/effect-fade'
import 'swiper/css/pagination'
import Typed from 'typed.js'

const typedContent = [
  {
    selector: '#typed-cover',
    strings: ['We are getting married.', '一封写给你的婚礼邀请。'],
  },
  {
    selector: '#typed-story',
    strings: ['从某个普通的夏天开始，我们把日常过成了彼此都期待的明天。'],
  },
  {
    selector: '#typed-gallery',
    strings: ['那些一起走过的路、看过的风景，都在今天变成了郑重的约定。'],
  },
  {
    selector: '#typed-knowing',
    strings: ['从熟悉彼此的喜好，到读懂每一次沉默，我们在日常里慢慢靠近。'],
  },
  {
    selector: '#typed-together',
    strings: ['四季更迭，身边始终是你。平凡的日子，也因此有了值得珍藏的光。'],
  },
  {
    selector: '#typed-moment',
    strings: ['此刻，我们把所有相遇与陪伴写进誓言，也期待与你共同见证。'],
  },
]

let activeTyped = null

function setupLoader() {
  const loader = document.querySelector('#site-loader')
  if (!loader) return

  let finished = false
  const startedAt = performance.now()

  function hideLoader() {
    if (finished) return
    finished = true

    const minimumVisibleTime = 650
    const delay = Math.max(0, minimumVisibleTime - (performance.now() - startedAt))

    window.setTimeout(() => {
      loader.classList.add('is-loaded')
      loader.setAttribute('aria-hidden', 'true')
      window.setTimeout(() => loader.remove(), 1100)
    }, delay)
  }

  if (document.readyState === 'complete') {
    hideLoader()
  } else {
    window.addEventListener('load', hideLoader, { once: true })
  }

  window.setTimeout(hideLoader, 4500)
}

function playTyping(index) {
  if (activeTyped) {
    activeTyped.destroy()
    activeTyped = null
  }

  const item = typedContent[index]
  if (!item) return

  const target = document.querySelector(item.selector)
  if (!target) return

  target.textContent = ''
  activeTyped = new Typed(item.selector, {
    strings: item.strings,
    typeSpeed: 46,
    backSpeed: 18,
    startDelay: index === 0 ? 300 : 450,
    showCursor: true,
    cursorChar: '|',
  })
}

function setupMusicPlayer() {
  const widget = document.querySelector('.music-widget')
  if (!widget) return

  const toggle = widget.querySelector('.music-toggle')
  const close = widget.querySelector('.music-close')
  const panel = widget.querySelector('.music-panel')
  const frame = widget.querySelector('.music-frame')
  const empty = widget.querySelector('.music-empty')
  const provider = widget.dataset.provider || 'netease'
  const playerType = widget.dataset.playerType || '0'
  const mediaId = widget.dataset.mediaId || widget.dataset.playlistId || '3778678'
  const playlistId = widget.dataset.playlistId || '3778678'
  const configuredSrc = widget.dataset.playerSrc || frame.dataset.src || frame.getAttribute('src') || ''
  const playerSrc =
    configuredSrc ||
    (provider === 'qq'
      ? ''
      : `https://music.163.com/outchain/player?type=${encodeURIComponent(playerType)}&id=${encodeURIComponent(mediaId || playlistId)}&auto=1&height=90`)
  let isLoaded = false

  function loadPlayer() {
    if (isLoaded) return true

    if (!playerSrc) {
      if (empty) empty.hidden = false
      frame.hidden = true
      console.warn('音乐播放器缺少可用地址，请检查 data-player-src 或 data-playlist-id。')
      return false
    }

    if (empty) empty.hidden = true
    frame.hidden = false
    frame.src = playerSrc
    isLoaded = true
    return true
  }

  function setOpen(isOpen) {
    widget.classList.toggle('is-open', isOpen)
    toggle.setAttribute('aria-expanded', String(isOpen))
    panel.hidden = !isOpen

    if (isOpen) loadPlayer()
  }

  toggle.addEventListener('click', () => {
    setOpen(!widget.classList.contains('is-open'))
  })

  close.addEventListener('click', () => setOpen(false))
  loadPlayer()
}

function setupRsvpForm() {
  const form = document.querySelector('.rsvp-form')
  if (!form) return

  const message = form.querySelector('.rsvp-message')
  const submitButton = form.querySelector('button[type="submit"]')
  const apiUrl = form.dataset.apiUrl?.trim()

  function setMessage(text) {
    if (message) message.textContent = text
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault()

    const formData = new FormData(form)
    const name = String(formData.get('name') || '').trim()
    const phone = String(formData.get('phone') || '').trim()
    const guestCount = Number(formData.get('guestCount'))

    if (!name || !phone || !Number.isInteger(guestCount) || guestCount < 1 || guestCount > 20) {
      setMessage('请填写姓名、电话和正确的出席人数。')
      return
    }

    if (!apiUrl) {
      setMessage('请先配置 CloudBase 云函数 HTTP 地址。')
      return
    }

    submitButton.disabled = true
    setMessage('正在提交...')

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, phone, guestCount }),
      })

      if (!response.ok) throw new Error(`HTTP ${response.status}`)

      form.reset()
      form.elements.guestCount.value = '1'
      setMessage('已收到您的回执，谢谢。')
    } catch (error) {
      console.error(error)
      setMessage('提交失败，请稍后再试。')
    } finally {
      submitButton.disabled = false
    }
  })
}

function setupPetals() {
  const layer = document.querySelector('.petal-layer')
  if (!layer || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

  const petalCount = window.matchMedia('(max-width: 760px)').matches ? 12 : 20
  const fragment = document.createDocumentFragment()

  for (let index = 0; index < petalCount; index += 1) {
    const petal = document.createElement('span')
    const size = 8 + Math.random() * 8
    const drift = -80 + Math.random() * 160

    petal.className = 'petal'
    petal.style.setProperty('--petal-left', `${Math.random() * 100}%`)
    petal.style.setProperty('--petal-size', `${size}px`)
    petal.style.setProperty('--petal-drift', `${drift}px`)
    petal.style.setProperty('--petal-drift-end', `${drift * -0.35}px`)
    const spin = 240 + Math.random() * 480
    petal.style.setProperty('--petal-spin-mid', `${spin * 0.56}deg`)
    petal.style.setProperty('--petal-spin', `${spin}deg`)
    petal.style.setProperty('--petal-duration', `${10 + Math.random() * 9}s`)
    petal.style.setProperty('--petal-delay', `${-Math.random() * 18}s`)
    petal.style.setProperty('--petal-opacity', `${0.28 + Math.random() * 0.34}`)
    petal.classList.add(index % 3 === 0 ? 'petal-white' : 'petal-blush')
    fragment.appendChild(petal)
  }

  layer.appendChild(fragment)
  setPetalVisibility(weddingSwiper.activeIndex)
}

function setPetalVisibility(slideIndex) {
  document.querySelector('.petal-layer')?.classList.toggle('is-visible', slideIndex > 0)
}

const weddingSwiper = new Swiper('.wedding-swiper', {
  direction: 'vertical',
  modules: [EffectFade, Mousewheel, Pagination, Parallax],
  effect: 'fade',
  fadeEffect: {
    crossFade: true,
  },
  mousewheel: {
    forceToAxis: true,
    sensitivity: 0.85,
    releaseOnEdges: true,
  },
  pagination: {
    el: '.swiper-pagination',
    clickable: true,
  },
  parallax: true,
  speed: 1250,
  on: {
    init() {
      playTyping(0)
      setPetalVisibility(0)
    },
    slideChange() {
      playTyping(this.activeIndex)
      setPetalVisibility(this.activeIndex)
    },
  },
})

document.querySelector('.scroll-hint')?.addEventListener('click', () => {
  weddingSwiper.slideNext()
})

setupMusicPlayer()
setupRsvpForm()
setupPetals()
setupLoader()
