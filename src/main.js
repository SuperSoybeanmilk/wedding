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
]

let activeTyped = null

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

new Swiper('.wedding-swiper', {
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
    },
    slideChange() {
      playTyping(this.activeIndex)
    },
  },
})

setupMusicPlayer()
