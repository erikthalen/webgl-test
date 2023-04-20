import fs from 'fs'
import { dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

import { router, server } from './server/server.js'
import { render } from './server/render.js'

const foldernames = fs.readdirSync(__dirname + '/pages')
const folders = foldernames.filter(foldername => !foldername.startsWith('.'))

router.static('pages')
router.static(folders.map(folder => 'pages/' + folder))

router.route({
  '/': async ({ send }) => send(render('index', { folders })),
  '/:page': async ({ send, page }) => send(page + '/index.html'),
})

server().listen(3012, () => console.log('http://localhost:3012'))
