import { OUTPUT_DIRNAME } from '../config.js'
import { prepareOutputDir } from '../utils.js'
import fs from 'fs'
import path from 'path'
import ytdl from 'ytdl-core'

/*

ytdl docs: https://github.com/fent/node-ytdl-core

ytdl options ref: https://github.com/fent/node-ytdl-core#ytdlchooseformatformats-options


## itag cheatsheet:

----------------------------------------------------------------------------------
| itag | container | quality | codecs                 | bitrate  | audio bitrate |
----------------------------------------------------------------------------------
| 18   | mp4       | 360p    | avc1.42001E, mp4a.40.2 | 696.66KB | 96KB          |
| 137  | mp4       | 1080p   | avc1.640028            | 4.53MB   |               |
| 248  | webm      | 1080p   | vp9                    | 2.52MB   |               |
| 136  | mp4       | 720p    | avc1.4d4016            | 2.2MB    |               |
| 247  | webm      | 720p    | vp9                    | 1.44MB   |               |
| 135  | mp4       | 480p    | avc1.4d4014            | 1.1MB    |               |
| 134  | mp4       | 360p    | avc1.4d401e            | 593.26KB |               |
| 140  | mp4       |         | mp4a.40.2              |          | 128KB         |
----------------------------------------------------------------------------------

*/

export const stream = async (
  videoSrc,
  quality = '18', // default 360p video + 96kbs audio (the only itag that has both video + audio)
  outputFilename = 'stream'
) => {
  return new Promise((resolve, reject) => {
    prepareOutputDir()

    // connect to stream
    console.log('\n🔌 connecting stream...\n')
    const stream = ytdl(videoSrc, {
      filter: format => format.container === 'mp4', // use mp4 format only
      quality,
    })

    // create target file to write stream to
    const outputPath = path.join(OUTPUT_DIRNAME, `${outputFilename}.mp4`)
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

      const logMsg = `\n✅ stream complete!\n⌚ streamed ${totalStreamed}mb in ${totalSeconds} second(s)\n`
      console.log(logMsg)
      resolve(outputPath)
    })
  })
}
