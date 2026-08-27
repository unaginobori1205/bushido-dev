/**
 * AudioWorkletProcessor that converts the mic's Float32 samples into
 * PCM16 frames and posts them to the main thread. Runs in the audio
 * rendering thread — must stay allocation-light per `process()` call.
 *
 * The AudioContext this is registered on is created with
 * `{ sampleRate: 24000 }` (see main.js) so no manual resampling is done
 * here — the browser/OS resamples from the hardware's native rate before
 * this callback ever sees the samples. This keeps the worklet itself
 * trivial and correctness-obvious instead of hand-rolling a resampler.
 */
const FRAME_SAMPLES = 480; // 20ms @ 24kHz — matches the chunk size assumed by core/orchestrator's logging/latency expectations

class PCMCaptureProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.buffer = new Int16Array(FRAME_SAMPLES);
    this.offset = 0;
  }

  process(inputs) {
    const channel = inputs[0]?.[0];
    if (!channel) return true;

    for (let i = 0; i < channel.length; i++) {
      const sample = Math.max(-1, Math.min(1, channel[i]));
      this.buffer[this.offset++] = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
      if (this.offset === FRAME_SAMPLES) {
        // Transfer the underlying buffer to avoid a copy; allocate a fresh one to keep filling.
        this.port.postMessage(this.buffer.buffer, [this.buffer.buffer]);
        this.buffer = new Int16Array(FRAME_SAMPLES);
        this.offset = 0;
      }
    }
    return true; // keep the processor alive
  }
}

registerProcessor("pcm-capture-processor", PCMCaptureProcessor);
