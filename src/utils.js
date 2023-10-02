import { OUTPUT_DIRNAME } from './config.js'
import exec from 'child_process'
import ffmpegPath from 'ffmpeg-static'
import fs from 'fs'

// make sure the output directory exists
export const prepareOutputDir = () => {
  if (!fs.existsSync(OUTPUT_DIRNAME)) {
    fs.mkdirSync(OUTPUT_DIRNAME)
  }
}

// run an ffmpeg command on the system
export const ffmpeg = args => {
  if (!ffmpegPath) throw new Error('ffmpeg binary not found')
  exec.execFileSync(ffmpegPath, ['-loglevel', 'quiet', '-y', ...args])
}
