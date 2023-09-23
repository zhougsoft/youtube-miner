import { INPUT_VIDEO, OUTPUT_TITLE } from '../config.js'
import { transcribe } from './transcribe.js'
import exec from 'child_process'
import crypto from 'crypto'
import ffmpegPath from 'ffmpeg-static'
import fs from 'fs'
import path from 'path'
import { videoInfo, getFormats, getReadableStream } from 'youtube-ext'

// replace node globals with ESM equivalents
const __filename = new URL(import.meta.url).pathname
const __dirname = path.dirname(__filename)

const main = async () => {
  try {
    if (!ffmpegPath) throw new Error('ffmpeg binary not found')

    console.log('\n🤖 starting job...\n')

    // make sure temp directory exists
    const tempDir = path.join(__dirname, '..', '.temp')
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir)
    }

    console.log('\n🔌 connecting stream...\n')
    const info = await videoInfo(INPUT_VIDEO)
    const formats = await getFormats(info.stream)

    const format = formats.find(x => x.fps && x.audioChannels)
    if (!format) throw new Error('no valid format found')

    const stream = await getReadableStream(format)
    const videoFilename = `${crypto.randomUUID()}.mp4`

    const file = fs.createWriteStream(path.resolve(tempDir, videoFilename))
    const started = Date.now()
    let downloaded = 0

    file.on('error', error => {
      throw new Error(error.message)
    })
    stream.on('error', error => {
      throw new Error(error.message)
    })

    stream.pipe(file)
    stream.on('data', data => {
      downloaded += data.length
      console.log(
        `⏬ streaming... ${Math.round(downloaded / 1000).toLocaleString()}kb`
      )
    })
    stream.on('close', async () => {
      console.log(
        `\n✅ stream complete\n⌚ finished in ${Math.round(
          (Date.now() - started) / 1000
        )} seconds\n`
      )

      const audioFilename = `${OUTPUT_TITLE}.wav`
      const inputVideoPath = path.join(tempDir, videoFilename)
      const outputAudioPath = path.join(tempDir, audioFilename)

      // run ffmpeg to extract audio from downloaded video
      console.log('\n👂 extracting audio...\n')
      exec.execFileSync(ffmpegPath, [
        '-loglevel',
        'quiet',
        '-y',
        '-i',
        inputVideoPath,
        outputAudioPath,
      ])

      // generate transcription from audio file
      console.log('✍ transcribing...\n')
      const savedTranscriptionPath = await transcribe(outputAudioPath)

      console.log('\n🧹 cleaning up...\n')
      exec.execFileSync('rm', ['-r', tempDir])

      console.log(
        `🎉 job complete! 🎉\n\n💾 transcription saved to:\n${savedTranscriptionPath}\n\n`
      )
      process.exit(0)
    })
  } catch (error) {
    console.error(error)
    process.exit(1)
  }
}

main()
