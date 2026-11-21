import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './app/App'
import './styles/index.css'

const SITE_TITLE = 'artheus | 연기 전공자 · 연극영화과 입시생을 위한 연기 클래스'
const SITE_DESC = '내가 이해한 장면을 내 연기로 만들어가도록. 배준우 직접 지도 · 홍대 스튜디오 입시 연기 클래스.'
document.title = SITE_TITLE
const setMeta = (attr: 'name' | 'property', key: string, value: string) => {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', value)
}
setMeta('name', 'description', SITE_DESC)
setMeta('property', 'og:title', SITE_TITLE)
setMeta('property', 'og:description', SITE_DESC)

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
