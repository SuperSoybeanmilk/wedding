import './maintenance.css'

document.title = '吴建成个人网站 - 建设中'

document.body.className = 'maintenance-body'
document.body.innerHTML = `
  <main class="maintenance-page" aria-labelledby="maintenance-title">
    <header class="maintenance-header">
      <span>WJC</span>
      <span>Personal Website</span>
    </header>

    <section class="maintenance-hero">
      <p class="maintenance-kicker">Site Building</p>
      <h1 id="maintenance-title">吴建成个人网站</h1>
      <p class="maintenance-subtitle">网站正在建设中</p>
      <p class="maintenance-desc">内容整理与功能完善中，页面将于近期开放。</p>
    </section>

    <footer class="maintenance-footer">
      <span>2026</span>
      <span>Under Construction</span>
    </footer>
  </main>
`
document.body.style.visibility = 'visible'
