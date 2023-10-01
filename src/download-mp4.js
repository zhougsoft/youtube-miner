import { OUTPUT_DIRNAME } from './config.js'
import { prepareOutputDir } from './utils.js'
import fs from 'fs'
import path from 'path'
import ytdl from 'ytdl-core'

const OUTPUT_FILENAME = 'video.mp4'

// ytdl docs:
// https://github.com/fent/node-ytdl-core

export const downloadMp4 = async videoId => {
  return new Promise((resolve, reject) => {
    prepareOutputDir()

    // connect to stream
    console.log('\n\n🔌 connecting stream...\n')
    const stream = ytdl(videoId)

    // create target file to write stream to
    const outputPath = path.join(OUTPUT_DIRNAME, OUTPUT_FILENAME)
    const file = fs.createWriteStream(outputPath)

    // start streaming data to file
    stream.pipe(file)
    const start = performance.now()
    let bytesStreamed = 0

    // handle errors
    file.on('error', reject)
    stream.on('error', reject)

    // handle data received
    stream.on('data', data => {
      bytesStreamed += data.length
      console.log(
        `⏬ streaming... ${Math.round(bytesStreamed / 1000).toLocaleString()}kb`
      )
    })

    // handle complete
    stream.on('finish', async () => {
      const end = performance.now()
      const totalStreamed = (bytesStreamed / 1000000).toFixed(2) // in megabytes
      const totalSeconds = Math.round((end - start) / 1000).toLocaleString()
      const logMsg = `\n✅ download complete!\n⌚ streamed ${totalStreamed}mb in ${totalSeconds} second(s)\n`

      console.log(logMsg)
      resolve(outputPath)
    })
  })
}
