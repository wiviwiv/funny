import Koa from 'koa'
import KoaBody from 'koa-body'

const app = new Koa()

// koa-body
app.use(KoaBody({ multipart: true }))

// app.context
app.context.config = {
  db: {},
  key: {},
}
app.context.log = (user = {}) => {
  user.activeAt = Date.now()
  console.log(user)
}
app.use((ctx, next) => {
  if (ctx.path === '/context') {
    ctx.log({ username: 'wivwiv', token: 'dwegsdkjnfw3ikjbrguwerhjfewr4t', })
    ctx.body = ctx.config
    return
  }
  if (ctx.path === '/error') {
    ctx.body = ctx.state
  }
  // headers
  if (ctx.path === '/header') {
    ctx.body = ctx.headers
  }
  next()
})
// file upload
app.use((ctx, next) => {
  if (ctx.path === '/upload') {
    return ctx.body = {
      file: ctx.request.body.files.file,
    }
  }
  next()
})
// OAuth2
app.use((ctx, next) => {
  if (ctx.path === '/oauth') {
    // 获取信息
    const data = {
      path: '/oauth',
      client: ctx.query.client_id,
      token: Math.random().toString(16).slice(2,14),
      response: ctx.query.response_type,
      expireAt: Date.now() + 36000,
      redirect: ctx.query.redirect_url,
    }
    if (data.redirect) {
      return ctx.redirect(`${data.redirect}?${data.response}=${data.token}`)
    }
    return ctx.body = data
  }
  next()
})
// Error Handing
app.use((ctx, next) => {
  ctx.body = {
    message: 'not found'
  }
  next().catch(err => { console.log(err.toString()) })
})
app.on('error', (err, ctx) => {
  console.log('error')
})

app.listen(4000)