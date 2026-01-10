export function ThemeScript() {
  const code = `(function(){try{var k='check-cx-admin:theme';var t=localStorage.getItem(k);var m=window.matchMedia('(prefers-color-scheme: dark)');var d=t==='dark'||(t!=='light'&&m.matches);var r=document.documentElement;r.classList.toggle('dark',d);r.style.colorScheme=d?'dark':'light';r.dataset.theme=t||'system';}catch(e){}})();`

  return <script dangerouslySetInnerHTML={{ __html: code }} />
}

