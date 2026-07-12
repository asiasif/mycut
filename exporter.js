/* ==========================================
   Antigravity Cut - Video & Audio Compilation Exporter
   ========================================== */

const Exporter = {
  mediaRecorder: null,
  recordedChunks: [],
  exportStartTime: 0,
  isExporting: false,

  startExport() {
    if (Timeline.clips.length === 0) {
      alert("Please add some clips to the timeline before exporting!");
      return;
    }

    // Stop normal playback first
    Renderer.stop();
    Renderer.initAudio();

    this.isExporting = true;
    this.recordedChunks = [];
    
    // Set up Web Audio recording destination
    Renderer.recordingDestination = Renderer.audioCtx.createMediaStreamDestination();
    
    // Get output tracks
    const fps = 30;
    const canvasStream = Renderer.canvas.captureStream(fps);
    const audioTracks = Renderer.recordingDestination.stream.getAudioTracks();
    
    // Mix video and audio tracks
    const combinedStream = new MediaStream([
      ...canvasStream.getVideoTracks(),
      ...audioTracks
    ]);

    // Choose supported MIME type
    let options = { mimeType: 'video/webm;codecs=vp9,opus' };
    if (!MediaRecorder.isTypeSupported(options.mimeType)) {
      options = { mimeType: 'video/webm;codecs=vp8,opus' };
    }
    if (!MediaRecorder.isTypeSupported(options.mimeType)) {
      options = { mimeType: 'video/webm' };
    }
    if (!MediaRecorder.isTypeSupported(options.mimeType)) {
      options = {}; // Default
    }

    try {
      this.mediaRecorder = new MediaRecorder(combinedStream, options);
    } catch (e) {
      console.error("Failed to create MediaRecorder", e);
      alert("Could not initialize video exporter in this browser.");
      this.cleanup();
      return;
    }

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        this.recordedChunks.push(event.data);
      }
    };

    this.mediaRecorder.onstop = () => {
      this.compileVideoDownload();
      this.cleanup();
    };

    // Show Progress Modal
    const modal = document.getElementById('export-modal');
    modal.classList.remove('hidden');
    document.getElementById('export-progress-bar').style.width = '0%';
    document.getElementById('export-percentage').textContent = '0%';
    document.getElementById('export-status-text').textContent = 'Initializing stream...';

    // Start recording & position playhead
    Timeline.setPlayheadTime(0);
    this.mediaRecorder.start();
    
    // Trigger audio plays
    Renderer.startPlayingAudio();
    this.exportStartTime = performance.now();
    
    // Start Export Animation Tick Loop
    const projectDuration = Timeline.totalDuration - 2; // Exclude buffer
    
    const exportTick = () => {
      if (!this.isExporting || !this.mediaRecorder || this.mediaRecorder.state === 'inactive') return;
      
      const now = performance.now();
      const elapsed = (now - this.exportStartTime) / 1000;
      
      if (elapsed >= projectDuration) {
        // Stop recording
        document.getElementById('export-status-text').textContent = 'Compiling file and preparing download...';
        this.mediaRecorder.stop();
        return;
      }
      
      Timeline.setPlayheadTime(elapsed);
      Renderer.drawFrame();
      
      // Update UI bar
      const pct = Math.floor((elapsed / projectDuration) * 100);
      document.getElementById('export-progress-bar').style.width = `${pct}%`;
      document.getElementById('export-percentage').textContent = `${pct}%`;
      document.getElementById('export-status-text').textContent = `Rendering frame: ${Timeline.formatTimecode(elapsed)}`;
      
      requestAnimationFrame(exportTick);
    };

    requestAnimationFrame(exportTick);
  },

  cancelExport() {
    if (!this.isExporting) return;
    
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
    
    this.recordedChunks = [];
    this.cleanup();
    
    const modal = document.getElementById('export-modal');
    modal.classList.add('hidden');
  },

  cleanup() {
    this.isExporting = false;
    Renderer.recordingDestination = null;
    Renderer.stopPlayingAudio();
    Timeline.setPlayheadTime(0);
    
    const modal = document.getElementById('export-modal');
    modal.classList.add('hidden');
  },

  compileVideoDownload() {
    if (this.recordedChunks.length === 0) {
      alert("Export failed: No data recorded.");
      return;
    }

    const blob = new Blob(this.recordedChunks, { type: 'video/webm' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = `AntigravityCut_Export_${Date.now()}.webm`;
    document.body.appendChild(a);
    a.click();
    
    // Revoke URL after a small delay
    setTimeout(() => {
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }, 100);
  }
};
