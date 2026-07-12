/* ==========================================
   Antigravity Cut - Canvas Compositor & Audio Engine
   ========================================== */

const Renderer = {
  canvas: null,
  ctx: null,
  offscreenCanvas: null,
  offscreenCtx: null,
  
  // Audio Context State
  audioCtx: null,
  audioBuffers: {}, // Loaded/decoded AudioBuffers { clipId / fileUrl: AudioBuffer }
  playingAudioSources: [], // Active AudioBufferSourceNodes or Oscillators
  
  // Playback Loop State
  isPlaying: false,
  lastFrameTime: 0,
  animationFrameId: null,

  init(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    
    // Create offscreen canvas for procedural buffers
    this.offscreenCanvas = document.createElement('canvas');
    this.offscreenCanvas.width = 1280;
    this.offscreenCanvas.height = 720;
    this.offscreenCtx = this.offscreenCanvas.getContext('2d');
    
    this.drawFrame();
  },

  // Setup/Resume Web Audio Context
  initAudio() {
    if (!this.audioCtx) {
      this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  },

  // Adjust display sizes based on selected project ratio
  updateAspectRatio(ratioString) {
    const wrapper = document.getElementById('canvas-wrapper');
    if (!wrapper) return;

    wrapper.className = 'player-canvas-wrapper'; // Reset
    
    if (ratioString === '16:9') {
      wrapper.classList.add('ratio-16-9');
      this.canvas.width = 1280;
      this.canvas.height = 720;
      this.offscreenCanvas.width = 1280;
      this.offscreenCanvas.height = 720;
    } else if (ratioString === '9:16') {
      wrapper.classList.add('ratio-9-16');
      this.canvas.width = 720;
      this.canvas.height = 1280;
      this.offscreenCanvas.width = 720;
      this.offscreenCanvas.height = 1280;
    } else if (ratioString === '1:1') {
      wrapper.classList.add('ratio-1-1');
      this.canvas.width = 720;
      this.canvas.height = 720;
      this.offscreenCanvas.width = 720;
      this.offscreenCanvas.height = 720;
    }

    this.drawFrame();
  },

  // Decodes files into AudioBuffers for synchronized high-fidelity playback/exports
  async loadAudioBuffer(url, id) {
    this.initAudio();
    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.audioCtx.decodeAudioData(arrayBuffer);
      this.audioBuffers[id] = audioBuffer;
      return audioBuffer;
    } catch (e) {
      console.warn("Failed to load audio buffer: " + url, e);
      return null;
    }
  },

  // Playback control functions
  play() {
    if (this.isPlaying) return;
    this.initAudio();
    this.isPlaying = true;
    this.lastFrameTime = performance.now();
    
    // Play synthesis & audio elements
    this.startPlayingAudio();
    
    // Start animation loop
    const loop = (now) => {
      if (!this.isPlaying) return;
      
      const elapsed = (now - this.lastFrameTime) / 1000;
      this.lastFrameTime = now;
      
      // Advance playhead
      let newTime = Timeline.playhead + elapsed;
      
      // Stop loop if reached end
      if (newTime >= Timeline.totalDuration - 2) {
        newTime = 0;
        this.stop();
        return;
      }
      
      Timeline.setPlayheadTime(newTime);
      this.animationFrameId = requestAnimationFrame(loop);
    };
    
    this.animationFrameId = requestAnimationFrame(loop);
    
    // Toggle play UI state
    document.querySelector('.play-icon').classList.add('hidden');
    document.querySelector('.pause-icon').classList.remove('hidden');
  },

  pause() {
    this.isPlaying = false;
    cancelAnimationFrame(this.animationFrameId);
    this.stopPlayingAudio();
    
    document.querySelector('.play-icon').classList.remove('hidden');
    document.querySelector('.pause-icon').classList.add('hidden');
  },

  stop() {
    this.pause();
    Timeline.setPlayheadTime(0);
    this.drawFrame();
  },

  // Core Drawing function
  drawFrame() {
    const width = this.canvas.width;
    const height = this.canvas.height;
    const playhead = Timeline.playhead;

    // 1. Reset Main Canvas
    this.ctx.fillStyle = '#000000';
    this.ctx.fillRect(0, 0, width, height);

    // 2. Fetch all clips overlapping with current playhead time
    const activeClips = Timeline.clips.filter(clip => {
      return playhead >= clip.startTime && playhead <= clip.startTime + clip.duration;
    });

    // 3. Sort active clips by rendering order: Video/Image -> Overlay -> Stickers -> Text
    const sortOrder = { video: 1, image: 1, overlay: 2, sticker: 3, text: 4 };
    activeClips.sort((a, b) => (sortOrder[a.type] || 0) - (sortOrder[b.type] || 0));

    // 4. Render active elements
    activeClips.forEach(clip => {
      this.ctx.save();
      
      // Setup filters (brightness, contrast, blur, etc.)
      const fp = clip.properties;
      let filterStr = `brightness(${fp.brightness}%) contrast(${fp.contrast}%) saturate(${fp.saturation}%) sepia(${fp.sepia}%) blur(${fp.blur}px)`;
      
      // Combine with filter preset if selected
      const selectedFilter = SampleAssets.filters.find(f => f.id === fp.filterPresetId);
      if (selectedFilter && selectedFilter.filterStr !== 'none') {
        filterStr += ' ' + selectedFilter.filterStr;
      }
      
      this.ctx.filter = filterStr;

      // Position, scale, opacity configurations
      const cx = width / 2 + parseFloat(fp.x);
      const cy = height / 2 + parseFloat(fp.y);
      this.ctx.translate(cx, cy);
      this.ctx.rotate((parseFloat(fp.rotation) * Math.PI) / 180);
      
      let scaleX = parseFloat(fp.scale) / 100;
      let scaleY = parseFloat(fp.scale) / 100;
      
      // Apply transitions modifiers
      let opacity = parseFloat(fp.opacity) / 100;
      
      if (fp.transitionType !== 'none') {
        const transDur = parseFloat(fp.transitionDuration) / 10; // e.g. 1.0s
        const relativeTime = playhead - clip.startTime;
        
        if (relativeTime < transDur) {
          const t = relativeTime / transDur; // progress 0 to 1
          
          if (fp.transitionType === 'fade') {
            opacity *= t;
          } 
          else if (fp.transitionType === 'fadeblack') {
            // Fades from pure black
            opacity *= t;
            this.ctx.fillStyle = `rgba(0, 0, 0, ${1 - t})`;
            // Draws black fill layer below
          }
          else if (fp.transitionType === 'slideleft') {
            // Slide in from right boundary
            const slideOffset = width * (1 - t);
            this.ctx.translate(slideOffset, 0);
          }
          else if (fp.transitionType === 'slideright') {
            // Slide in from left boundary
            const slideOffset = -width * (1 - t);
            this.ctx.translate(slideOffset, 0);
          }
          else if (fp.transitionType === 'zoomin') {
            // Interpolate scale from 0.1 to target
            scaleX *= (0.1 + 0.9 * t);
            scaleY *= (0.1 + 0.9 * t);
          }
        }
      }

      this.ctx.scale(scaleX, scaleY);
      this.ctx.globalAlpha = opacity;

      // Draw specific assets
      if (clip.type === 'video' || clip.type === 'image') {
        if (clip.procedural && Generators[clip.generator]) {
          // Draw using our offscreen procedural buffer
          this.offscreenCtx.save();
          const relTime = playhead - clip.startTime + clip.trimStart;
          Generators[clip.generator](this.offscreenCtx, relTime, this.offscreenCanvas.width, this.offscreenCanvas.height);
          this.offscreenCtx.restore();
          
          // Project the offscreen composition to centered location
          this.ctx.drawImage(this.offscreenCanvas, -width/2, -height/2, width, height);
        } else if (clip.fileUrl) {
          // Uploaded video or image file
          const mediaElement = document.getElementById(clip.id + '-element');
          if (mediaElement) {
            if (clip.type === 'video') {
              // Ensure video time matches timeline playhead time exactly
              const targetTime = playhead - clip.startTime + clip.trimStart;
              if (Math.abs(mediaElement.currentTime - targetTime) > 0.15 && !this.isPlaying) {
                mediaElement.currentTime = targetTime;
              }
            }
            this.ctx.drawImage(mediaElement, -width/2, -height/2, width, height);
          }
        }
      } 
      else if (clip.type === 'overlay') {
        // Picture-in-Picture: draw as a scaled inset box at clip's x/y offset from center
        const mediaElement = document.getElementById(clip.id + '-element') ||
                             document.getElementById(clip.fileUrl ? clip.id + '-element' : null);
        const pipScale = parseFloat(fp.scale) / 100;
        const pipW = width * pipScale;
        const pipH = height * pipScale;
        // Draw drop shadow
        this.ctx.shadowColor = 'rgba(0,0,0,0.6)';
        this.ctx.shadowBlur = 18;
        this.ctx.shadowOffsetX = 4;
        this.ctx.shadowOffsetY = 4;
        // Border frame
        this.ctx.strokeStyle = 'rgba(255,255,255,0.7)';
        this.ctx.lineWidth = 3 / (pipScale || 1);
        this.ctx.strokeRect(-pipW / 2, -pipH / 2, pipW, pipH);
        this.ctx.shadowColor = 'transparent';
        // Draw media content
        if (mediaElement) {
          this.ctx.drawImage(mediaElement, -pipW / 2, -pipH / 2, pipW, pipH);
        } else {
          // Fallback: colored placeholder box
          this.ctx.fillStyle = 'rgba(0, 242, 254, 0.35)';
          this.ctx.fillRect(-pipW / 2, -pipH / 2, pipW, pipH);
          this.ctx.fillStyle = 'white';
          this.ctx.font = `bold ${Math.floor(pipH * 0.12)}px Inter`;
          this.ctx.textAlign = 'center';
          this.ctx.textBaseline = 'middle';
          this.ctx.fillText('Overlay', 0, 0);
        }
      }
      else if (clip.type === 'text') {
        this.ctx.font = `800 ${fp.fontSize}px "${fp.fontFamily}"`;
        this.ctx.textAlign = fp.align;
        this.ctx.textBaseline = 'middle';
        
        // Custom stylization text presets
        if (fp.presetStyle === 'neon') {
          this.ctx.shadowColor = fp.color;
          this.ctx.shadowBlur = 15;
          this.ctx.fillStyle = '#ffffff';
        } else if (fp.presetStyle === 'retro') {
          // Double shadow
          this.ctx.shadowColor = '#00f2fe';
          this.ctx.shadowBlur = 0;
          this.ctx.shadowOffsetX = 3;
          this.ctx.shadowOffsetY = 3;
          this.ctx.fillStyle = '#ff007f';
        } else if (fp.presetStyle === 'cyber') {
          this.ctx.shadowBlur = 0;
          this.ctx.fillStyle = '#ffff00';
        } else {
          this.ctx.shadowBlur = 0;
          this.ctx.fillStyle = fp.color;
        }

        // Draw fill text
        this.ctx.fillText(fp.text, 0, 0);

        // Draw stroke text
        if (parseFloat(fp.strokeWidth) > 0) {
          this.ctx.shadowBlur = 0; // Disable shadow for stroke
          this.ctx.strokeStyle = fp.strokeColor;
          this.ctx.lineWidth = parseFloat(fp.strokeWidth);
          this.ctx.strokeText(fp.text, 0, 0);
        }
      } 
      else if (clip.type === 'sticker') {
        this.ctx.font = '80px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(fp.text || clip.name, 0, 0);
      }

      this.ctx.restore();
    });
  },

  // Scheduled Audio mixing and synthesis
  startPlayingAudio() {
    this.stopPlayingAudio(); // Reset
    if (!this.audioCtx) return;
    
    const playhead = Timeline.playhead;
    
    Timeline.clips.forEach(clip => {
      // Find audio sources or video tracks with audios
      if (clip.type === 'audio' || (clip.type === 'video' && clip.fileUrl)) {
        // Check if overlaps with playhead
        if (playhead >= clip.startTime && playhead < clip.startTime + clip.duration) {
          const relativeStart = playhead - clip.startTime + clip.trimStart;
          
          if (clip.synthesized && clip.notes) {
            // Play procedural synth notes
            this.playSynthSequence(clip, relativeStart);
          } else {
            // Play loaded buffers (custom uploads/presaved soundtrack files)
            const buffer = this.audioBuffers[clip.id];
            if (buffer) {
              const source = this.audioCtx.createBufferSource();
              source.buffer = buffer;
              
              const gainNode = this.audioCtx.createGain();
              gainNode.gain.value = (clip.properties.volume / 100) * (document.getElementById('volume-slider').value / 100);
              
              source.connect(gainNode);
              gainNode.connect(this.audioCtx.destination);
              if (this.recordingDestination) {
                gainNode.connect(this.recordingDestination);
              }
              
              const scheduledDelay = 0;
              const sourceOffset = relativeStart;
              const durationRemaining = clip.duration - (playhead - clip.startTime);
              
              source.start(this.audioCtx.currentTime + scheduledDelay, sourceOffset, durationRemaining);
              this.playingAudioSources.push({ source, gainNode, clipId: clip.id });
            }
          }
        }
      }
    });
  },

  // Sync playback offsets when user drags playhead during active playback
  syncPlayingAudio() {
    this.startPlayingAudio();
  },

  stopPlayingAudio() {
    this.playingAudioSources.forEach(item => {
      try {
        item.source.stop();
      } catch (e) {}
    });
    this.playingAudioSources = [];
  },

  // Generates sound waves in real-time based on midi notes
  playSynthSequence(clip, startOffset) {
    if (!this.audioCtx) return;
    
    const notes = clip.notes;
    const gainNode = this.audioCtx.createGain();
    const globalVolume = document.getElementById('volume-slider').value / 100;
    gainNode.gain.value = (clip.properties.volume / 100) * 0.15 * globalVolume; // Lower synth default slightly
    gainNode.connect(this.audioCtx.destination);
    if (this.recordingDestination) {
      gainNode.connect(this.recordingDestination);
    }

    notes.forEach(note => {
      // Calculate global time for this note
      const noteTime = note.time;
      if (noteTime >= startOffset) {
        const scheduledTime = this.audioCtx.currentTime + (noteTime - startOffset);
        
        const osc = this.audioCtx.createOscillator();
        const noteGain = this.audioCtx.createGain();
        
        // Synth type
        osc.type = clip.id === 'aud-synthwave' ? 'sawtooth' : 'triangle';
        
        // Convert midi note to frequency
        const freq = 440 * Math.pow(2, (note.note - 69) / 12);
        osc.frequency.setValueAtTime(freq, scheduledTime);
        
        // Envelope
        noteGain.gain.setValueAtTime(0, scheduledTime);
        noteGain.gain.linearRampToValueAtTime(1.0, scheduledTime + 0.05);
        noteGain.gain.exponentialRampToValueAtTime(0.001, scheduledTime + note.dur);
        
        osc.connect(noteGain);
        noteGain.connect(gainNode);
        
        osc.start(scheduledTime);
        osc.stop(scheduledTime + note.dur);
        
        this.playingAudioSources.push({ source: osc, gainNode: noteGain, clipId: clip.id });
      }
    });
  }
};
