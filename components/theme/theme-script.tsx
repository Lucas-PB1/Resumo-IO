/**
 * Aplica o tema antes da primeira pintura para evitar "flash" de cor.
 * Preferência salva em localStorage ("theme": "light" | "dark" | "system").
 */
const script = `(function(){try{var t=localStorage.getItem("theme");var d=t==="dark"||((!t||t==="system")&&window.matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",d);}catch(e){}})();`

export function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: script }} />
}
