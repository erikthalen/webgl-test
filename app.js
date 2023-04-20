import fs from 'fs'
import { dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

import { router, server } from './server/server.js'
import { render } from './server/render.js'

const foldernames = fs.readdirSync(__dirname + '/pages')
const folders = foldernames.filter(foldername => !foldername.startsWith('.'))

router.static(folders.map(folder => 'pages/' + folder))

router.route({
  '/': async ({ send }) => {
    send(render('index', { folders }))
  },

  ...folders.reduce((acc, cur) => {
    return {
      ...acc,
      [cur]: async ({ send }) => send('/pages/' + cur + '/index.html'),
    }
  }, {}),
})

server().listen(3012, () => console.log('http://localhost:3012'))
