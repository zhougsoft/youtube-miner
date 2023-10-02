import { OUTPUT_DIRNAME } from './config.js'
import { stream } from './lib/stream.js'
import { transcribe } from './lib/transcribe.js'
import { ffmpeg } from './utils.js'
import exec from 'child_process'

// === ⚙️ SETTINGS ⚙️ ============================================

// link or id for the video to download, saves to `output/output.mp4`
const INPUT_VIDEO = 'https://www.youtube.com/watch?v=vaNpcgmj5qI'

// want the transcription too? saves to `output/transcription.json`
const GET_TRANSCRIPTION = true

// ===============================================================

const main = async () => {
  try {
    console.log('\n\n📥 starting job\n')
    const startTimer = performance.now()

    // fetch the video transcription if requested
    if (GET_TRANSCRIPTION) {
      const transcriptionPath = await transcribe(INPUT_VIDEO)
      console.log(`\ntranscription saved to: ${transcriptionPath}\n`)
    }

    // get highest quality video & audio streams
    const videoPath = await stream(INPUT_VIDEO, 'highestvideo', 'video')
    const audioPath = await stream(INPUT_VIDEO, 'highestaudio', 'audio')
    const outputPath = `${OUTPUT_DIRNAME}/output.mp4`

    // combine video & audio results into single mp4 file
    console.log('🔀 merging tracks...\n')
    ffmpeg([
      '-i',
      videoPath,
      '-i',
      audioPath,
      '-c:v',
      'copy',
      '-c:a',
      'aac',
      outputPath,
    ])

    // clean up temp files
    exec.execFileSync('rm', [videoPath, audioPath])

    const endTimer = performance.now()
    const totalSeconds = Math.round(
      (endTimer - startTimer) / 1000
    ).toLocaleString()

    const msg = `\n🎉 job complete!\n⌚ finished in ${totalSeconds} second(s)\n\n💾 file saved to: ${outputPath}\n`
    console.log(msg)

    process.exit(0)
  } catch (error) {
    console.error(error)
    process.exit(1)
  }
}

main()
