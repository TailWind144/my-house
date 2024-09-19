export type Post = {
  title: string
  date: string
  type: string
  path?: string
}

export type YearListObj = {
  year: string
  list: Array<any>
}

export type AllBlogs<T> = {
  [key: string]: T
  frontend: T
  deep_learning: T
}
