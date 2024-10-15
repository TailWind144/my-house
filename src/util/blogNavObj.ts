const BlogList = () => import('../views/Blog/components/BlogList.vue')

const blogNavObj = [
  {
    path: 'frontend',
    name: 'frontend',
    text: '前端',
    component: BlogList,
    meta: { transition: 'slide-right', title: '博客' }
  },
  {
    path: 'deep_learning',
    name: 'deep_learning',
    text: '深度学习',
    component: BlogList,
    meta: { transition: 'slide-left', title: '博客' }
  }
]

export default blogNavObj
