const renderMathJax = () => {
  if (!window.MathJax.typesetPromise) return
  // window.MathJax.Hub.Queue([
  //   'Typeset',
  //   window.MathJax.Hub,
  //   document.getElementsByClassName('prose')[0]
  // ])
  window.MathJax.typesetPromise()
}
export { renderMathJax }
