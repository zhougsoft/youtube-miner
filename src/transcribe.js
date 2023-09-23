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

  let transcriber = await pipeline('automatic-speech-recognition')

  // load the .wav file from disk
  let buffer = fs.readFileSync(wavFilePath)

  // read .wav file and convert it to the required format
  let wav = new wavefile.WaveFile(buffer)
  wav.toBitDepth('32f') // Pipeline expects input as a Float32Array
  wav.toSampleRate(16000) // Whisper expects audio with a sampling rate of 16000
  let audioData = wav.getSamples()

  if (Array.isArray(audioData)) {
    if (audioData.length > 1) {
      const SCALING_FACTOR = Math.sqrt(2)

      // Merge channels (into the first channel to save memory)
      for (let i = 0; i < audioData[0].length; ++i) {
        audioData[0][i] =
          (SCALING_FACTOR * (audioData[0][i] + audioData[1][i])) / 2
      }
    }

    // Select the first channel
    audioData = audioData[0]
  }

  let start = performance.now()
  let output = await transcriber(audioData, {
    // Greedy
    top_k: 0,
    do_sample: false,
    // Sliding window
    chunk_length_s: 30,
    stride_length_s: 5,
    // Timestamps
    return_timestamps: false,
    force_full_sequences: false,
  })
  let end = performance.now()
  console.log(`Execution duration: ${(end - start) / 1000} seconds`)

  // Ensure output is a string
  if (typeof output !== 'string') {
    output = JSON.stringify(output, null, 2) // Convert to JSON string or use a suitable conversion
  }

  // write transcription to disk
  const outputFilename = `${OUTPUT_TITLE}.json`
  const outputPath = path.join(outputDir, outputFilename)
  fs.writeFileSync(outputPath, output)
  
  return outputPath
}
