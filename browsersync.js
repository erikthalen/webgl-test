import { create } from 'browser-sync'

const bs = create()

bs.init(null, {
  files: ['pages/**/*.*'],
  proxy: 'http://localhost:3012',
  notify: false,
})
