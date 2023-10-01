import { OUTPUT_DIRNAME, TEMP_DIRNAME } from './config.js'
import ffmpegPath from 'ffmpeg-static'
import fs from 'fs'
import wavefile from 'wavefile'

// make sure the output directory exists
export const prepareOutputDir = () => {
  if (!fs.existsSync(OUTPUT_DIRNAME)) {
    fs.mkdirSync(OUTPUT_DIRNAME)
  }
}

// deletes the temp file cache
export const clearTempDir = () => {
  exec.execFileSync('rm', ['-rf', TEMP_DIRNAME])
}

// run an ffmpeg conversion on a given input file, ex: `ffmpeg('input.mp4', 'output.mp3')`
export const ffmpeg = (inputPath, outputPath) => {
  if (!ffmpegPath) throw new Error('ffmpeg binary not found')
  exec.execFileSync(ffmpegPath, [
    '-loglevel',
    'quiet',
    '-y',
    '-i',
    inputPath,
    outputPath,
  ])
}

// read a wav file data from a given file path
export const readWavFile = async (
  filePath,
  targetBitDepth = '32f',
  targetSampleRate = 44100,
  shouldCombineAudioChannels = false
) => {
  const buffer = fs.readFileSync(filePath)
  const wav = new wavefile.WaveFile(buffer)

  wav.toBitDepth(targetBitDepth)
  wav.toSampleRate(targetSampleRate)

  let audioData = wav.getSamples()
  const hasMultipleAudioChannels =
    Array.isArray(audioData) && audioData.length > 1

  // aggregate channels if necessary
  if (hasMultipleAudioChannels && shouldCombineAudioChannels) {
    if (audioData.length > 1) {
      const SCALING_FACTOR = Math.sqrt(2)

      // merge channels into channel #1
      for (let i = 0; i < audioData[0].length; ++i) {
        audioData[0][i] =
          (SCALING_FACTOR * (audioData[0][i] + audioData[1][i])) / 2
      }
    }

    // select channel #1 only
    audioData = audioData[0]
  }

  return audioData
}
