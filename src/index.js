import { INPUT_VIDEO, OUTPUT_TITLE } from '../config.js'
import { transcribe } from './transcribe.js'
import exec from 'child_process'
import crypto from 'crypto'
import ffmpegPath from 'ffmpeg-static'
import fs from 'fs'
import path from 'path'
import ytdl from 'ytdl-core'

// replace node globals with ESM equivalents
const __filename = new URL(import.meta.url).pathname
const __dirname = path.dirname(__filename)

const main = async () => {
  try {
    // ffmpeg binary is required
    if (!ffmpegPath) throw new Error('ffmpeg binary not found')

    console.log('\n\n🤖 starting job...\n')

    // make sure temp directory exists
    const tempDir = path.join(__dirname, '..', '.temp')
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir)
    }

    // connect to stream
    console.log('🔌 connecting stream...\n')
    const stream = ytdl(INPUT_VIDEO, { filter: 'audioonly' })

    // create target file to write stream to
    const videoFilename = `${crypto.randomUUID()}.mp4`
    const file = fs.createWriteStream(path.resolve(tempDir, videoFilename))

    // start streaming data to file
    stream.pipe(file)
    const started = Date.now()
    let bytesStreamed = 0

    // handle errors
    file.on('error', error => {
      throw new Error(error.message)
    })
    stream.on('error', error => {
      throw new Error(error.message)
    })

    // handle progress tracking
    stream.on('data', data => {
      bytesStreamed += data.length
      console.log(
        `⏬ streaming... ${Math.round(bytesStreamed / 1000).toLocaleString()}kb`
      )
    })

    // handle stream completion
    stream.on('finish', async () => {
      console.log(
        `\n✅⏬ stream complete\n⌚ finished in ${Math.round(
          (Date.now() - started) / 1000
        )} seconds\n`
      )

      // setup paths for ffmpeg audio extraction
      const audioFilename = `${OUTPUT_TITLE}.wav`
      const inputVideoPath = path.join(tempDir, videoFilename)
      const outputAudioPath = path.join(tempDir, audioFilename)

      // run ffmpeg audio extraction on downloaded video
      console.log('👂 extracting audio...\n')
      exec.execFileSync(ffmpegPath, [
        '-loglevel',
        'quiet',
        '-y',
        '-i',
        inputVideoPath,
        outputAudioPath,
      ])

      // generate transcription from audio file via transformers (whisper)
      console.log('✍ transcribing...\n')
      const start = performance.now()
      const savedTranscriptionPath = await transcribe(outputAudioPath)
      const end = performance.now()
      console.log(
        `\n✅✍ transcription complete\n⌚ finished in ${Math.round(
          (end - start) / 1000
        )} seconds\n`
      )

      // remove temp files
      console.log('🧹 cleaning up...\n')
      exec.execFileSync('rm', ['-r', tempDir])

      // done!
      console.log(
        `💾 transcription saved to:\n➡ ${savedTranscriptionPath}\n\n🎉 job complete! 🎉\n\n`
      )
      process.exit(0)
    })
  } catch (error) {
    console.error(error)
    process.exit(1)
  }
}

main()
