MathJax = {
  loader: {
    load: [
      'input/tex-base', // 必备基础库
      'output/chtml',
      '[tex]/ams' // 必备基础库，用来将tex转换成html
    ]
  },
  tex: {
    inlineMath: [
      ['$', '$'],
      ['\\(', '\\)']
    ],

    displayMath: [
      ['$$', '$$'],
      ['\\[', '\\]']
    ],
    packages: ['base', 'ams']
  },
  options: {
    skipHtmlTags: [
      'script',
      'noscript',
      'style',
      'textarea',
      'pre',
      'code'
    ],
    renderActions: {
      addMenu: [0, '', '']
    }
  },
  processHtmlClass: 'prose',
  startup: {
    ready() {
      MathJax.startup.defaultReady()
    }
  }
}
