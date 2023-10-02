import { OUTPUT_DIRNAME } from '../config.js'
import { prepareOutputDir } from '../utils.js'
import fs from 'fs'
import path from 'path'
import { YoutubeTranscript } from 'youtube-transcript'

const OUTPUT_FILENAME = 'transcription.json'

// youtube-transcript docs:
// https://github.com/Kakulukian/youtube-transcript

export const transcribe = async videoSrc => {
  prepareOutputDir()
  const outputPath = path.join(OUTPUT_DIRNAME, OUTPUT_FILENAME)

  console.log('\n✍ transcribing...\n')
  const start = performance.now()

  const transcriptResult = await YoutubeTranscript.fetchTranscript(videoSrc, {
    lang: 'en',
    country: 'US'
  })

  const end = performance.now()
  const totalSeconds = Math.round((end - start) / 1000).toLocaleString()
  const logMsg = `\n✅ transcription complete!\n⌚ finished in ${totalSeconds} second(s)\n`
  console.log(logMsg)

  fs.writeFileSync(outputPath, JSON.stringify(transcriptResult))
  return outputPath
}
