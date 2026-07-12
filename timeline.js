/* ==========================================
   Antigravity Cut - Timeline State & Layout Controller
   ========================================== */

const Timeline = {
  clips: [],
  selectedClipId: null,
  zoom: 30, // Pixels per second
  totalDuration: 10, // Default duration in seconds (increases dynamically)
  playhead: 0, // Current scrubber time in seconds
  
  // Element references (set in app.js init)
  elements: {
    scrollContainer: null,
    workspace: null,
    ruler: null,
    tracks: null,
    playheadLine: null,
    selectedHint: null,
    currentTimecode: null,
    totalTimecode: null
  },

  init(elements) {
    this.elements = elements;
    this.renderRuler();
    this.updatePlayheadPosition();
    this.setupTimelineInteractions();
  },

  // Conversions
  secondsToPixels(seconds) {
    return seconds * this.zoom;
  },

  pixelsToSeconds(pixels) {
    return Math.max(0, pixels / this.zoom);
  },

  // State Management
  addClip(asset, trackId, dropTime = 0) {
    const duration = asset.duration || 5;
    
    // Set default properties
    const newClip = {
      id: asset.type + '-' + Date.now() + '-' + Math.floor(Math.random()*1000),
      name: asset.name,
      type: asset.type,
      fileUrl: asset.fileUrl || null,
      procedural: asset.procedural || false,
      generator: asset.generator || null,
      synthesized: asset.synthesized || false,
      notes: asset.notes || null,
      
      // Timing
      startTime: dropTime,
      duration: duration,
      trimStart: 0,
      trimEnd: 0, // amount trimmed from end
      originalDuration: duration,
      trackId: trackId,

      // Transform Properties
      properties: {
        x: 0,
        y: 0,
        scale: 100,
        rotation: 0,
        opacity: 100,
        // Text properties
        text: asset.type === 'text' ? (asset.defaultText || 'Double Click to Edit') : '',
        fontFamily: 'Inter',
        fontSize: asset.presetStyle === 'neon' ? 64 : 48,
        color: asset.color || '#ffffff',
        strokeWidth: asset.presetStyle === 'outline' ? 2 : 0,
        strokeColor: '#000000',
        align: 'center',
        presetStyle: asset.presetStyle || 'normal',
        // Audio properties
        volume: 100,
        // Filters
        brightness: 100,
        contrast: 100,
        saturation: 100,
        sepia: 0,
        blur: 0,
        // Transitions
        transitionType: 'none',
        transitionDuration: 10 // 1.0s (stored as tenths of a second)
      }
    };

    this.clips.push(newClip);
    this.selectedClipId = newClip.id;
    this.updateTotalDuration();
    this.render();
    
    // Auto trigger renderer redraw
    if (window.Renderer) {
      window.Renderer.drawFrame();
    }
    
    // Fire event to update Inspector properties panel
    this.onSelectionChanged();
    return newClip;
  },

  removeClip(clipId) {
    this.clips = this.clips.filter(c => c.id !== clipId);
    if (this.selectedClipId === clipId) {
      this.selectedClipId = null;
      this.onSelectionChanged();
    }
    this.updateTotalDuration();
    this.render();
    if (window.Renderer) {
      window.Renderer.drawFrame();
    }
  },

  getClip(clipId) {
    return this.clips.find(c => c.id === clipId);
  },

  getSelectedClip() {
    return this.getClip(this.selectedClipId);
  },

  // Timeline Cut / Split action
  splitSelectedClip() {
    const selected = this.getSelectedClip();
    if (!selected) return;

    const playheadTime = this.playhead;
    
    // Check if playhead cuts through the clip
    if (playheadTime > selected.startTime && playheadTime < selected.startTime + selected.duration) {
      const cutTimeInClip = playheadTime - selected.startTime;
      
      // Duplicate clip structure
      const secondHalf = JSON.parse(JSON.stringify(selected));
      secondHalf.id = selected.type + '-' + Date.now() + '-' + Math.floor(Math.random()*1000);
      
      // Update first half timing
      selected.duration = cutTimeInClip;
      selected.trimEnd = selected.trimStart + cutTimeInClip;
      
      // Update second half timing
      secondHalf.startTime = playheadTime;
      secondHalf.duration = secondHalf.duration - cutTimeInClip;
      secondHalf.trimStart = secondHalf.trimStart + cutTimeInClip;
      
      // Add second half to database
      this.clips.push(secondHalf);
      this.selectedClipId = secondHalf.id;
      
      this.render();
      this.onSelectionChanged();
      if (window.Renderer) {
        window.Renderer.drawFrame();
      }
    }
  },

  splitClip(clip, playheadTime) {
    if (playheadTime > clip.startTime && playheadTime < clip.startTime + clip.duration) {
      const cutTimeInClip = playheadTime - clip.startTime;
      
      const secondHalf = JSON.parse(JSON.stringify(clip));
      secondHalf.id = clip.type + '-' + Date.now() + '-' + Math.floor(Math.random()*1000) + '-' + Math.floor(Math.random()*100);
      
      // Update first half timing
      clip.duration = cutTimeInClip;
      clip.trimEnd = clip.trimStart + cutTimeInClip;
      
      // Update second half timing
      secondHalf.startTime = playheadTime;
      secondHalf.duration = secondHalf.duration - cutTimeInClip;
      secondHalf.trimStart = secondHalf.trimStart + cutTimeInClip;
      
      this.clips.push(secondHalf);
      return secondHalf;
    }
    return null;
  },

  splitClipAtIntervals(clipId, interval) {
    let mainClip = this.getClip(clipId);
    if (!mainClip) return;
    
    const trackId = mainClip.trackId;
    const clipStart = mainClip.startTime;
    const clipEnd = mainClip.startTime + mainClip.duration;
    
    const timepoints = [];
    for (let t = clipStart + interval; t < clipEnd; t += interval) {
      timepoints.push(t);
    }
    
    timepoints.forEach(tp => {
      const targetClip = this.clips.find(c => c.trackId === trackId && tp > c.startTime && tp < c.startTime + c.duration);
      if (targetClip) {
        this.splitClip(targetClip, tp);
      }
    });
    
    this.updateTotalDuration();
    this.render();
    if (window.Renderer) window.Renderer.drawFrame();
  },

  splitClipAtTimes(clipId, timepoints) {
    let mainClip = this.getClip(clipId);
    if (!mainClip) return;
    
    const trackId = mainClip.trackId;
    
    timepoints.forEach(tp => {
      const targetClip = this.clips.find(c => c.trackId === trackId && tp > c.startTime && tp < c.startTime + c.duration);
      if (targetClip) {
        this.splitClip(targetClip, tp);
      }
    });
    
    this.updateTotalDuration();
    this.render();
    if (window.Renderer) window.Renderer.drawFrame();
  },

  updateTotalDuration() {
    let maxEnd = 5; // Min 5 seconds timeline
    this.clips.forEach(clip => {
      const end = clip.startTime + clip.duration;
      if (end > maxEnd) {
        maxEnd = end;
      }
    });
    this.totalDuration = maxEnd + 2; // Extra buffer
    this.renderRuler();
  },

  // Zoom control
  setZoom(val) {
    this.zoom = val;
    this.renderRuler();
    this.render();
    this.updatePlayheadPosition();
  },

  // Scrub playhead time
  setPlayheadTime(seconds) {
    this.playhead = Math.max(0, Math.min(seconds, this.totalDuration));
    this.updatePlayheadPosition();
    
    // Update labels
    if (this.elements.currentTimecode) {
      this.elements.currentTimecode.textContent = this.formatTimecode(this.playhead);
    }
    
    // Trigger canvas render to playhead position
    if (window.Renderer) {
      window.Renderer.drawFrame();
      
      // If sound is playing, synchronize playing offset
      if (window.Renderer.isPlaying) {
        window.Renderer.syncPlayingAudio();
      }
    }
  },

  formatTimecode(sec) {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    const ms = Math.floor((sec % 1) * 100);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  },

  updatePlayheadPosition() {
    if (this.elements.playheadLine) {
      const px = this.secondsToPixels(this.playhead);
      this.elements.playheadLine.style.transform = `translateX(${px}px)`;
    }
  },

  // Rendering
  renderRuler() {
    const ruler = this.elements.ruler;
    if (!ruler) return;
    
    ruler.innerHTML = '';
    
    const workspaceWidth = this.secondsToPixels(this.totalDuration);
    this.elements.workspace.style.width = `${workspaceWidth + 200}px`; // Extra buffer
    
    // Decide interval based on zoom factor
    let step = 1; // 1s ticks
    if (this.zoom < 15) step = 5;
    if (this.zoom < 5) step = 10;
    
    for (let time = 0; time <= this.totalDuration; time += step) {
      const px = this.secondsToPixels(time);
      
      const tick = document.createElement('div');
      tick.className = 'ruler-tick major';
      tick.style.left = `${px}px`;
      
      const label = document.createElement('div');
      label.className = 'ruler-label';
      label.textContent = `${time}s`;
      label.style.left = `${px}px`;
      
      ruler.appendChild(tick);
      ruler.appendChild(label);
      
      // Add sub-ticks (0.1s increments) for high zoom
      if (this.zoom > 25 && step === 1) {
        for (let sub = 0.2; sub < 1; sub += 0.2) {
          const subPx = this.secondsToPixels(time + sub);
          const subTick = document.createElement('div');
          subTick.className = 'ruler-tick';
          subTick.style.left = `${subPx}px`;
          ruler.appendChild(subTick);
        }
      }
    }

    if (this.elements.totalTimecode) {
      this.elements.totalTimecode.textContent = this.formatTimecode(this.totalDuration - 2);
    }
  },

  render() {
    const lanes = {
      text: document.querySelector('.track-timeline-lane[data-track-id="text"]'),
      stickers: document.querySelector('.track-timeline-lane[data-track-id="stickers"]'),
      video: document.querySelector('.track-timeline-lane[data-track-id="video"]'),
      audio: document.querySelector('.track-timeline-lane[data-track-id="audio"]')
    };

    // Clear lanes
    for (let key in lanes) {
      if (lanes[key]) lanes[key].innerHTML = '';
    }

    // Populate clips
    this.clips.forEach(clip => {
      const lane = lanes[clip.trackId];
      if (!lane) return;

      const clipEl = document.createElement('div');
      clipEl.className = `timeline-clip clip-${clip.type}`;
      clipEl.setAttribute('data-clip-id', clip.id);
      
      const left = this.secondsToPixels(clip.startTime);
      const width = this.secondsToPixels(clip.duration);
      clipEl.style.left = `${left}px`;
      clipEl.style.width = `${width}px`;

      if (clip.id === this.selectedClipId) {
        clipEl.classList.add('selected');
      }

      // Title
      const titleSpan = document.createElement('span');
      titleSpan.className = 'clip-title-text';
      titleSpan.textContent = clip.name;
      clipEl.appendChild(titleSpan);

      // Resizing handles
      const handleLeft = document.createElement('div');
      handleLeft.className = 'clip-handle clip-handle-left';
      const handleRight = document.createElement('div');
      handleRight.className = 'clip-handle clip-handle-right';
      
      clipEl.appendChild(handleLeft);
      clipEl.appendChild(handleRight);

      lane.appendChild(clipEl);
    });

    // Update split/delete buttons state
    const hasSelection = this.selectedClipId !== null;
    const btnSplit = document.getElementById('btn-timeline-split');
    const btnDelete = document.getElementById('btn-timeline-delete');
    
    if (btnSplit) btnSplit.disabled = !hasSelection;
    if (btnDelete) btnDelete.disabled = !hasSelection;
  },

  // Timeline click and drag event handlers
  setupTimelineInteractions() {
    const workspace = this.elements.workspace;
    const ruler = this.elements.ruler;
    
    let isDraggingPlayhead = false;
    let isMovingClip = false;
    let isTrimmingLeft = false;
    let isTrimmingRight = false;
    
    let dragStartOffset = 0;
    let dragStartClipTime = 0;
    let dragStartClipDuration = 0;
    let dragClipObj = null;

    // A. Ruler click/scrub
    const handleRulerScrub = (e) => {
      const rect = ruler.getBoundingClientRect();
      const clickX = e.clientX - rect.left + this.elements.scrollContainer.scrollLeft;
      const sec = this.pixelsToSeconds(clickX);
      this.setPlayheadTime(sec);
    };

    ruler.addEventListener('mousedown', (e) => {
      isDraggingPlayhead = true;
      handleRulerScrub(e);
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    });

    // B. Clip manipulation mousedown routing
    workspace.addEventListener('mousedown', (e) => {
      const target = e.target;
      
      // 1. Check if clicking on playhead handle
      if (target.classList.contains('playhead-handle')) {
        isDraggingPlayhead = true;
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
        return;
      }

      // 2. Check if clicked a clip or resize handle
      const clipEl = target.closest('.timeline-clip');
      if (clipEl) {
        e.stopPropagation();
        const clipId = clipEl.getAttribute('data-clip-id');
        this.selectedClipId = clipId;
        this.render();
        this.onSelectionChanged();

        dragClipObj = this.getClip(clipId);
        
        // Check if handle click
        if (target.classList.contains('clip-handle-left')) {
          isTrimmingLeft = true;
          dragStartOffset = e.clientX;
          dragStartClipTime = dragClipObj.startTime;
          dragStartClipDuration = dragClipObj.duration;
        } else if (target.classList.contains('clip-handle-right')) {
          isTrimmingRight = true;
          dragStartOffset = e.clientX;
          dragStartClipDuration = dragClipObj.duration;
        } else {
          // Regular clip movement dragging
          isMovingClip = true;
          const rect = clipEl.getBoundingClientRect();
          dragStartOffset = e.clientX - rect.left; // click offset within clip
        }
        
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
      } else {
        // Clicked blank space, select none
        if (target.closest('.timeline-track-row') || target === workspace) {
          this.selectedClipId = null;
          this.render();
          this.onSelectionChanged();
        }
      }
    });

    // Global drag movement logic
    const onMouseMove = (e) => {
      if (isDraggingPlayhead) {
        const rect = ruler.getBoundingClientRect();
        const mouseX = e.clientX - rect.left + this.elements.scrollContainer.scrollLeft;
        this.setPlayheadTime(this.pixelsToSeconds(mouseX));
      } 
      else if (isMovingClip && dragClipObj) {
        const rect = this.elements.tracks.getBoundingClientRect();
        const mouseX = e.clientX - rect.left + this.elements.scrollContainer.scrollLeft;
        const newStart = this.pixelsToSeconds(mouseX - dragStartOffset);
        
        // Simple snapping to other clips or 0
        let snappedStart = Math.max(0, newStart);
        
        // Snaps to 0s if within 0.1s
        if (snappedStart < 0.1) snappedStart = 0;
        
        // Snap to other clips borders on same track
        this.clips.forEach(c => {
          if (c.id === dragClipObj.id || c.trackId !== dragClipObj.trackId) return;
          const cEnd = c.startTime + c.duration;
          if (Math.abs(snappedStart - cEnd) < 0.15) {
            snappedStart = cEnd; // Snap start to other end
          }
          if (Math.abs((snappedStart + dragClipObj.duration) - c.startTime) < 0.15) {
            snappedStart = c.startTime - dragClipObj.duration; // Snap end to other start
          }
        });

        dragClipObj.startTime = Math.max(0, snappedStart);
        this.updateTotalDuration();
        this.render();
        if (window.Renderer) window.Renderer.drawFrame();
        
        // Update timing panel immediately
        this.onSelectionChanged();
      }
      else if (isTrimmingLeft && dragClipObj) {
        const dx = e.clientX - dragStartOffset;
        const dt = this.pixelsToSeconds(dx);
        
        let newStart = dragStartClipTime + dt;
        let newDuration = dragStartClipDuration - dt;
        
        // Enforce min duration of 0.25 seconds
        if (newDuration < 0.25) {
          newDuration = 0.25;
          newStart = dragStartClipTime + dragStartClipDuration - 0.25;
        }

        // Adjust trim calculations
        const trimDelta = newStart - dragClipObj.startTime;
        dragClipObj.trimStart += trimDelta;
        
        dragClipObj.startTime = newStart;
        dragClipObj.duration = newDuration;
        
        this.updateTotalDuration();
        this.render();
        if (window.Renderer) window.Renderer.drawFrame();
        this.onSelectionChanged();
      }
      else if (isTrimmingRight && dragClipObj) {
        const dx = e.clientX - dragStartOffset;
        const dt = this.pixelsToSeconds(dx);
        
        let newDuration = dragStartClipDuration + dt;
        if (newDuration < 0.25) newDuration = 0.25;

        // Adjust trim calculations
        dragClipObj.trimEnd = dragClipObj.originalDuration - newDuration - dragClipObj.trimStart;

        dragClipObj.duration = newDuration;
        
        this.updateTotalDuration();
        this.render();
        if (window.Renderer) window.Renderer.drawFrame();
        this.onSelectionChanged();
      }
    };

    const onMouseUp = () => {
      isDraggingPlayhead = false;
      isMovingClip = false;
      isTrimmingLeft = false;
      isTrimmingRight = false;
      dragClipObj = null;
      
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
  },

  // Selection callback to bind into app.js UI
  onSelectionChanged() {
    if (window.App) {
      window.App.updateInspector();
    }
  }
};
