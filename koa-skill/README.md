Koa2 常用的技巧
----
#### 1. 通过 Babel 在 Node.js 上使用 import 特性
##### 1.1 CommonJS ES6 之争
- import 是在编译过程中执行， 而require是同步  
- import传的是值引用，require是值拷贝
- more ...
```js
import fs from 'fs'

let content = fs.readFileSync('./package.json').toString()

// or
content = require('fs').readFileSync('./package.json').toString()

import { Message } from 'element-ui'

// or
const { Message } = 'element-ui'
```

##### 1.2 使用 Babel 转换
 ```bash
 # 两个依赖
 "devDependencies": {
     "babel-plugin-transform-es2015-modules-commonjs": "^6.26.0",
     "babel-register": "^6.26.0",
     "nodemon": "^1.14.11"
 }
 
 
 # 使用 babel-register
 require('babel-register')
 (
   {
     plugins: ['babel-plugin-transform-es2015-modules-commonjs'],
   }
 )
 
 module.exports = require('./app.js')
 ```
 
 #### 1.3 运行
 ```js
 // app.js
 import Koa from 'koa'
 
 const app = new Koa()
 app.use(async ctx => { ctx.body = 'Hello Koa2' })
 app.listen(3000)
 
 // 运行: ./node_modules/.bin/nodemon index.js
 ```
 
#### 2. 中间件
#### 2.1 在 ctx 挂载一个方法或者属性: app.context
> app.context is the prototype from which ctx is created from. You may add additional properties to ctx by editing app.context. This is useful for adding properties or methods to ctx to be used across your entire app, which may be more performant (no middleware) and/or easier (fewer require()s) at the expense of relying more on ctx, which could be considered an anti-pattern.

- 使用这个方法可以避免在中间件中操作挂载
```js
// app.context
app.context.config = {
  db: {},
  key: {},
}
app.use((ctx, next) => {
  if (ctx.path === '/context') {
    ctx.body = ctx.config
    return
  }
  next()
})
```
#### 2.2 