import { INPUT_VIDEO } from './config.js'
import { transcribe } from './transcribe.js'

const main = async () => {
  try {
    // transcribe video
    const transcriptionPath = await transcribe(INPUT_VIDEO)
    console.log('transcription saved to:', transcriptionPath)

    process.exit(0)
  } catch (error) {
    console.error(error)
    process.exit(1)
  }
}

main()
