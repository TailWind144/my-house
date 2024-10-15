const renderMathJax = () => {
  if (!window.MathJax.typesetPromise) return
  window.MathJax.typesetPromise()
}
export default renderMathJax
