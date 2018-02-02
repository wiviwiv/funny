function log() {
  Object.values(arguments).forEach((data) => {
    console.log(data)
  })
}

module.exports = {
  log,
}
