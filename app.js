import fs from 'fs'
import { dirname } from 'path'
import { fileURLToPath } from 'url'

import { router, server } from './server/server.js'
import { render } from './server/render.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

const folders = fs
  .readdirSync(__dirname + '/pages')
  .filter(folder => !folder.startsWith('.'))

router.static('pages')
router.static(folders.map(folder => 'pages/' + folder))

router.route({
  '/': async ({ send }) => send(render('index', { folders })),
  '/:page': async ({ send, page }) => send(render(page + '/index')),
})

server().listen(3012, () => console.log('http://localhost:3012'))
