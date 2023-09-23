import { OUTPUT_TITLE } from '../config.js'
import { pipeline } from '@xenova/transformers'
import fs from 'fs'
import wavefile from 'wavefile'
import path from 'path'

// replace node globals with ESM equivalents
const __filename = new URL(import.meta.url).pathname
const __dirname = path.dirname(__filename)

export const transcribe = async wavFilePath => {
  // make sure output directory exists
  const outputDir = path.join(__dirname, '..', 'output')
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir)
  }

  // load the wav file from disk
  const buffer = fs.readFileSync(wavFilePath)

  // read wav file & convert it to the required format
  const wav = new wavefile.WaveFile(buffer)
  wav.toBitDepth('32f') // pipeline expects: Float32Array
  wav.toSampleRate(16000) // whisper expects sampling rate: 16000

  // parse wav audio data & aggregate channels
  let audioData = wav.getSamples()
  if (Array.isArray(audioData)) {
    if (audioData.length > 1) {
      const SCALING_FACTOR = Math.sqrt(2)

      // merge both channels into channel #1 to save memory
      for (let i = 0; i < audioData[0].length; ++i) {
        audioData[0][i] =
          (SCALING_FACTOR * (audioData[0][i] + audioData[1][i])) / 2
      }
    }

    // select channel #1
    audioData = audioData[0]
  }

  let tokensTranscribed = 0

  // transcription inference options
  // docs: https://huggingface.co/docs/transformers.js/api/pipelines#automaticspeechrecognitionpipelinecallaudio-kwargs-codepromiseampltobjectampgtcode
  const transcriberOpts = {
    // assuming english for performance
    language: 'en',
    // "greedy" decoding
    top_k: 0,
    do_sample: false,
    // chunking required for transcribing audio longer than 30 seconds
    chunk_length_s: 30,
    stride_length_s: 5,
    // output formatting
    return_timestamps: false,
    force_full_sequences: false,
    // called with each chunk processed
    chunk_callback: data => {
      tokensTranscribed += data.tokens.length
      console.log(
        `📝 chunk completed...`,
        `${tokensTranscribed.toLocaleString()} tokens transcribed`
      )
    },
  }

  // run the transcription inference
  const transcriber = await pipeline(
    'automatic-speech-recognition',
    'Xenova/whisper-small.en'
  )
  let output = await transcriber(audioData, transcriberOpts)

  // ensure output is a string
  if (typeof output !== 'string') {
    output = JSON.stringify(output)
  }

  // write transcription result to disk
  const outputFilename = `${OUTPUT_TITLE}.json`
  const outputPath = path.join(outputDir, outputFilename)
  fs.writeFileSync(outputPath, output)
  return outputPath
}
