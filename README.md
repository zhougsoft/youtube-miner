# 📺⛏ youtube miner

> a script for mining transcriptions from youtube video streams - no API keys required 😉

## how to use

- install dependencies: run `yarn`
- set desired video URL & output title in `config.js`
- run `yarn start` to let it rip!
- transcription will write to the generated `output` directory w/ set output title

## tooling

- [ytdl-core](https://github.com/fent/node-ytdl-core)
- [ffmpeg](https://ffmpeg.org/documentation.html) via [ffmpeg-static](https://github.com/eugeneware/ffmpeg-static)
- [transformers.js](https://huggingface.co/docs/transformers.js/index)
