function byteLength (string) {
  // UTF-8 編碼，中文字為 3 位元
  return string.replace(/[^\x00-\xff]/g, 'xxx').length
}

module.exports = {
  byteLength
}
