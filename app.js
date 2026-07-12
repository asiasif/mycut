/* ==========================================
   Antigravity Cut - Main Orchestrator & User Interface
   ========================================== */

const App = {
  uploadedAssets: [],

  init() {
    // 1. Initialise core subsystems
    Timeline.init({
      scrollContainer: document.getElementById('timeline-scroll-container'),
      workspace: document.getElementById('timeline-workspace-el'),
      ruler: document.getElementById('timeline-ruler-el'),
      tracks: document.getElementById('timeline-tracks-el'),
      playheadLine: document.getElementById('timeline-playhead-line-el'),
      selectedHint: document.getElementById('selected-clip-hint'),
      currentTimecode: document.getElementById('current-timecode'),
      totalTimecode: document.getElementById('total-timecode')
    });
    
    Renderer.init('editor-canvas');

    // 2. Load presets
    this.populateSidebarPresets();

    // 3. Set up event bindings
    this.bindUIEvents();
    this.bindKeyboardShortcuts();
    this.bindInspectorEvents();
    
    // Set aspect ratio initially
    Renderer.updateAspectRatio('16:9');
  },

  // Populate side libraries with presets defined in assets.js
  populateSidebarPresets() {
    // A. Sample Videos
    const videoGrid = document.getElementById('sample-assets-list');
    videoGrid.innerHTML = '';
    SampleAssets.videos.forEach(video => {
      const card = this.createAssetCard(video);
      videoGrid.appendChild(card);
    });

    // B. Sample Images
    // Images are listed inside the Media drawer under the same section
    const sampleImgHeader = document.createElement('h4');
    sampleImgHeader.textContent = 'Sample Images';
    sampleImgHeader.style.gridColumn = 'span 2';
    sampleImgHeader.style.marginTop = '12px';
    videoGrid.appendChild(sampleImgHeader);
    
    SampleAssets.images.forEach(img => {
      const card = this.createAssetCard(img);
      videoGrid.appendChild(card);
    });

    // C. Custom Filters
    const filtersGrid = document.getElementById('filters-list');
    filtersGrid.innerHTML = '';
    SampleAssets.filters.forEach(filter => {
      const card = document.createElement('div');
      card.className = 'filter-card';
      card.setAttribute('data-filter-id', filter.id);
      
      const thumbWrapper = document.createElement('div');
      thumbWrapper.className = 'filter-thumbnail-wrapper';
      
      const thumb = document.createElement('div');
      thumb.style.width = '100%';
      thumb.style.height = '100%';
      thumb.style.background = 'linear-gradient(45deg, #00f2fe, #ff007f)';
      thumb.style.filter = filter.filterStr;
      
      thumbWrapper.appendChild(thumb);
      
      const name = document.createElement('span');
      name.textContent = filter.name;
      
      card.appendChild(thumbWrapper);
      card.appendChild(name);
      
      card.addEventListener('click', () => {
        const selected = Timeline.getSelectedClip();
        if (selected && (selected.type === 'video' || selected.type === 'image')) {
          selected.properties.filterPresetId = filter.id;
          
          // Visual selection highlight
          document.querySelectorAll('.filter-card').forEach(c => c.classList.remove('active'));
          card.classList.add('active');
          
          Renderer.drawFrame();
        } else {
          alert("Select a video or image clip to apply this filter.");
        }
      });
      
      filtersGrid.appendChild(card);
    });

    // D. Stickers
    const stickersGrid = document.getElementById('stickers-list');
    stickersGrid.innerHTML = '';
    SampleAssets.stickers.forEach(sticker => {
      const card = document.createElement('div');
      card.className = 'sticker-item';
      card.textContent = sticker.content;
      card.addEventListener('click', () => {
        const added = Timeline.addClip({
          name: sticker.name,
          type: 'sticker',
          duration: 4,
          defaultText: sticker.content
        }, 'stickers', Timeline.playhead);
        
        // Custom sticker settings
        added.properties.text = sticker.content;
      });
      stickersGrid.appendChild(card);
    });

    // E. Transitions
    const transGrid = document.getElementById('transitions-list');
    transGrid.innerHTML = '';
    SampleAssets.transitions.forEach(trans => {
      const card = document.createElement('div');
      card.className = 'transition-card';
      card.setAttribute('data-trans-type', trans.type);
      
      const icon = document.createElement('i');
      icon.setAttribute('data-lucide', trans.icon);
      
      const label = document.createElement('span');
      label.textContent = trans.name;
      
      card.appendChild(icon);
      card.appendChild(label);
      
      card.addEventListener('click', () => {
        const selected = Timeline.getSelectedClip();
        if (selected && (selected.type === 'video' || selected.type === 'image')) {
          selected.properties.transitionType = trans.type;
          
          document.querySelectorAll('.transition-card').forEach(c => c.classList.remove('active'));
          card.classList.add('active');
          
          Renderer.drawFrame();
          Timeline.onSelectionChanged();
        } else {
          alert("Select a video or image clip in the timeline first to apply this transition.");
        }
      });
      
      transGrid.appendChild(card);
    });
    // Create icons newly created in DOM
    lucide.createIcons({ attrs: { class: 'lucide' } });

    // F. Audios
    const audioList = document.getElementById('audio-assets-list');
    audioList.innerHTML = '';
    SampleAssets.audios.forEach(aud => {
      const row = document.createElement('div');
      row.className = 'audio-item-row';
      
      const info = document.createElement('div');
      info.className = 'audio-info';
      const name = document.createElement('span');
      name.className = 'audio-name';
      name.textContent = aud.name;
      const dur = document.createElement('span');
      dur.className = 'audio-duration';
      dur.textContent = `Duration: ${aud.duration}s`;
      
      info.appendChild(name);
      info.appendChild(dur);
      
      const addBtn = document.createElement('button');
      addBtn.className = 'audio-action-btn';
      addBtn.innerHTML = '<i data-lucide="plus"></i>';
      
      row.appendChild(info);
      row.appendChild(addBtn);
      
      row.addEventListener('click', () => {
        Timeline.addClip(aud, 'audio', Timeline.playhead);
      });
      
      audioList.appendChild(row);
    });
    lucide.createIcons();
  },

  createAssetCard(asset) {
    const card = document.createElement('div');
    card.className = 'asset-card';
    card.setAttribute('data-asset-id', asset.id);

    // Procedural visual thumbnail preview generators
    const previewCanvas = document.createElement('canvas');
    previewCanvas.className = 'asset-preview';
    previewCanvas.width = 160;
    previewCanvas.height = 100;
    const pCtx = previewCanvas.getContext('2d');
    
    // Draw static thumbnail from asset generator at time=1s
    if (asset.procedural && Generators[asset.generator]) {
      Generators[asset.generator](pCtx, 1.5, 160, 100);
    } else {
      // solid gradient
      pCtx.fillStyle = '#1e1e24';
      pCtx.fillRect(0, 0, 160, 100);
    }

    const dur = document.createElement('div');
    dur.className = 'asset-duration-tag';
    dur.textContent = `${asset.duration}s`;

    const name = document.createElement('div');
    name.className = 'asset-name-tag';
    name.textContent = asset.name;

    const hover = document.createElement('div');
    hover.className = 'asset-hover-overlay';
    hover.innerHTML = '<i data-lucide="plus"></i>';

    card.appendChild(previewCanvas);
    card.appendChild(dur);
    card.appendChild(name);
    card.appendChild(hover);

    card.addEventListener('click', () => {
      Timeline.addClip(asset, 'video', Timeline.playhead);
    });

    return card;
  },

  // UI Event Bindings
  bindUIEvents() {
    // 1. Sidebar tab switcher
    const tabButtons = document.querySelectorAll('.tab-btn');
    const drawers = document.querySelectorAll('.drawer-content');
    const assetsDrawer = document.querySelector('.assets-drawer');
    
    tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        tabButtons.forEach(b => b.classList.remove('active'));
        drawers.forEach(d => d.classList.remove('active'));
        
        btn.classList.add('active');
        const activeTab = btn.getAttribute('data-tab');
        document.getElementById(`drawer-${activeTab}`).classList.add('active');
        assetsDrawer.classList.add('open'); // Slide open drawer overlay on mobile
      });
    });

    // 2. Aspect ratio selector
    document.getElementById('aspect-ratio-select').addEventListener('change', (e) => {
      Renderer.updateAspectRatio(e.target.value);
    });

    // 3. Export operations
    document.getElementById('export-btn').addEventListener('click', () => {
      Exporter.startExport();
    });
    document.getElementById('btn-cancel-export').addEventListener('click', () => {
      Exporter.cancelExport();
    });

    // 4. Zoom Slider
    const zoomSlider = document.getElementById('timeline-zoom-slider');
    zoomSlider.addEventListener('input', (e) => {
      Timeline.setZoom(parseFloat(e.target.value));
    });
    
    document.getElementById('btn-zoom-in').addEventListener('click', () => {
      const zoom = Math.min(100, Timeline.zoom + 10);
      zoomSlider.value = zoom;
      Timeline.setZoom(zoom);
    });
    
    document.getElementById('btn-zoom-out').addEventListener('click', () => {
      const zoom = Math.max(10, Timeline.zoom - 10);
      zoomSlider.value = zoom;
      Timeline.setZoom(zoom);
    });

    // 5. Player playback control elements
    document.getElementById('btn-play-pause').addEventListener('click', () => {
      if (Renderer.isPlaying) {
        Renderer.pause();
      } else {
        Renderer.play();
      }
    });

    document.getElementById('btn-stop').addEventListener('click', () => {
      Renderer.stop();
    });

    document.getElementById('btn-prev-frame').addEventListener('click', () => {
      Timeline.setPlayheadTime(Timeline.playhead - 0.0333); // step backward 1 frame
    });

    document.getElementById('btn-next-frame').addEventListener('click', () => {
      Timeline.setPlayheadTime(Timeline.playhead + 0.0333); // step forward 1 frame
    });

    // 6. Volume mixer slider
    const volSlider = document.getElementById('volume-slider');
    volSlider.addEventListener('input', (e) => {
      const muteBtn = document.getElementById('btn-mute');
      const val = parseFloat(e.target.value);
      
      if (val === 0) {
        muteBtn.querySelector('.vol-on').classList.add('hidden');
        muteBtn.querySelector('.vol-off').classList.remove('hidden');
      } else {
        muteBtn.querySelector('.vol-on').classList.remove('hidden');
        muteBtn.querySelector('.vol-off').classList.add('hidden');
      }
      
      // Sync playing audios gain
      Renderer.playingAudioSources.forEach(audio => {
        const clip = Timeline.getClip(audio.clipId);
        if (clip) {
          audio.gainNode.gain.setValueAtTime((clip.properties.volume / 100) * (val / 100), Renderer.audioCtx.currentTime);
        }
      });
    });

    document.getElementById('btn-mute').addEventListener('click', () => {
      const muteBtn = document.getElementById('btn-mute');
      const volOn = muteBtn.querySelector('.vol-on');
      const volOff = muteBtn.querySelector('.vol-off');
      
      if (volOff.classList.contains('hidden')) {
        // Mute
        volOn.classList.add('hidden');
        volOff.classList.remove('hidden');
        this.prevVolume = volSlider.value;
        volSlider.value = 0;
      } else {
        // Unmute
        volOn.classList.remove('hidden');
        volOff.classList.add('hidden');
        volSlider.value = this.prevVolume || 80;
      }
      volSlider.dispatchEvent(new Event('input'));
    });

    // 7. Timeline tools
    document.getElementById('btn-timeline-split').addEventListener('click', () => {
      Timeline.splitSelectedClip();
    });
    
    document.getElementById('btn-timeline-delete').addEventListener('click', () => {
      if (Timeline.selectedClipId) {
        Timeline.removeClip(Timeline.selectedClipId);
      }
    });

    // 8. Text templates add buttons
    document.querySelectorAll('.text-preset-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const type = btn.getAttribute('data-text-type');
        let txt = "Text Overlay";
        let fSize = 48;
        if (type === 'heading') { txt = "HEADING"; fSize = 64; }
        if (type === 'subheading') { txt = "Subheading text"; fSize = 36; }
        if (type === 'body') { txt = "Paragraph body text"; fSize = 24; }

        Timeline.addClip({
          name: txt,
          type: 'text',
          duration: 5,
          defaultText: txt,
          presetStyle: 'normal'
        }, 'text', Timeline.playhead);
      });
    });

    document.querySelectorAll('.styled-text-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const style = btn.getAttribute('data-style-preset');
        let text = "GLOWING TEXT";
        let color = '#ffffff';
        if (style === 'neon') { color = '#00f2fe'; }
        if (style === 'retro') { color = '#ff007f'; text = 'RETRO'; }
        if (style === 'cyber') { color = '#ffff00'; text = 'CYBER'; }
        
        Timeline.addClip({
          name: text,
          type: 'text',
          duration: 5,
          defaultText: text,
          presetStyle: style,
          color: color
        }, 'text', Timeline.playhead);
      });
    });

    // 9. File uploads setup (Media and Audio)
    const mediaInput = document.getElementById('media-upload-input');
    mediaInput.addEventListener('change', (e) => {
      this.handleLocalMediaUploads(e.target.files);
    });

    const audioInput = document.getElementById('audio-upload-input');
    audioInput.addEventListener('change', (e) => {
      this.handleLocalAudioUploads(e.target.files);
    });

    // 10. AI Smart Cut bindings
    const btnExecuteAi = document.getElementById('btn-execute-ai');
    const aiPromptInput = document.getElementById('ai-prompt-input');
    if (btnExecuteAi && aiPromptInput) {
      btnExecuteAi.addEventListener('click', async () => {
        const promptText = aiPromptInput.value.trim();
        if (!promptText) {
          alert("Please type an AI prompt command first.");
          return;
        }

        const parseResult = this.parseAiPrompt(promptText);

        if (parseResult.type === 'background-music') {
          const songName = parseResult.songName;
          const loader = document.getElementById('canvas-loader');
          if (loader) {
            loader.classList.remove('hidden');
            loader.querySelector('span').textContent = `Searching Archive.org for "${songName}"...`;
          }

          try {
            // 1. Search Archive.org
            const searchUrl = `https://archive.org/advancedsearch.php?q=title:(${encodeURIComponent(songName)})+AND+mediatype:audio&fl[]=identifier,title&sort[]=downloads+desc&output=json&rows=5`;
            const searchRes = await fetch(searchUrl);
            const searchData = await searchRes.json();

            if (!searchData.response || !searchData.response.docs || searchData.response.docs.length === 0) {
              throw new Error(`Could not find any songs matching "${songName}" on Archive.org.`);
            }

            const doc = searchData.response.docs[0];
            if (loader) {
              loader.querySelector('span').textContent = `Fetching tracks metadata for: ${doc.title}...`;
            }

            // 2. Fetch Metadata to find direct MP3 link
            const metaUrl = `https://archive.org/metadata/${doc.identifier}`;
            const metaRes = await fetch(metaUrl);
            const metaData = await metaRes.json();

            if (!metaData.files || metaData.files.length === 0) {
              throw new Error("No files associated with this archive audio entry.");
            }

            const mp3File = metaData.files.find(f => f.name.endsWith('.mp3'));
            if (!mp3File) {
              throw new Error("No streaming MP3 files found in this archive audio entry.");
            }

            const directUrl = `https://archive.org/download/${doc.identifier}/${encodeURIComponent(mp3File.name)}`;
            const clipId = 'audio-archive-' + Date.now();

            if (loader) {
              loader.querySelector('span').textContent = `Downloading and decoding audio: ${doc.title}...`;
            }

            // 3. Download & Decode Audio Buffer
            const buffer = await Renderer.loadAudioBuffer(directUrl, clipId);
            if (!buffer) {
              throw new Error("Failed to download or decode audio file from the archive.");
            }

            // 4. Construct asset and add to timeline
            const asset = {
              id: clipId,
              name: doc.title,
              type: 'audio',
              fileUrl: directUrl,
              duration: Math.floor(buffer.duration)
            };

            const newClip = Timeline.addClip(asset, 'audio', 0);
            // Re-cache buffer under the real timeline clip ID the renderer uses
            Renderer.audioBuffers[newClip.id] = buffer;
            delete Renderer.audioBuffers[clipId];

            // Also register as an uploaded asset for project save
            this.uploadedAssets.push({
              id: newClip.id,
              name: doc.title,
              type: 'audio',
              fileUrl: directUrl,
              duration: Math.floor(buffer.duration),
              source: 'archive.org'
            });

            Timeline.updateTotalDuration();
            Timeline.render();
            if (window.Renderer) {
              window.Renderer.drawFrame();
            }

            alert(`✅ Background music added!\n"${doc.title}"\n\nYou can now play the timeline to hear it.`);
          } catch (e) {
            console.error("Archive.org background music error:", e);
            alert("Failed to add background music: " + e.message);
          } finally {
            if (loader) {
              loader.classList.add('hidden');
            }
          }
          return;
        }

        if (parseResult.type === 'insert') {
          const { asset, trackId, startTime, duration } = parseResult;
          if (!asset) {
            alert("Could not find any video or audio asset to insert. Make sure the asset exists or upload it first.");
            return;
          }

          const clipDuration = duration || asset.duration || 5;

          // 1. Find overlapping clip on this track and split it
          const overlappingClip = Timeline.clips.find(c => 
            c.trackId === trackId && 
            startTime > c.startTime && 
            startTime < c.startTime + c.duration
          );

          if (overlappingClip) {
            Timeline.splitClip(overlappingClip, startTime);
          }

          // 2. Shift all clips starting at or after startTime to the right
          Timeline.clips.forEach(c => {
            if (c.trackId === trackId && c.startTime >= startTime) {
              c.startTime += clipDuration;
            }
          });

          // 3. Add the new clip
          const newClip = Timeline.addClip(asset, trackId, startTime);
          newClip.duration = clipDuration;

          Timeline.updateTotalDuration();
          Timeline.render();
          if (window.Renderer) {
            window.Renderer.drawFrame();
          }

          alert(`Successfully inserted "${asset.name}" on the ${trackId} track at ${startTime}s!`);
          return;
        }

        if (parseResult.type === 'auto-edit') {
          // Auto-edit: arrange all uploaded video clips sequentially
          const videoAssets = this.uploadedAssets.filter(a => a.type === 'video' || a.type === 'image');
          if (videoAssets.length === 0) {
            alert('Please upload some videos first, then run auto-edit!');
            return;
          }
          // Clear existing video/image clips
          Timeline.clips = Timeline.clips.filter(c => c.trackId !== 'video');
          let cursor = 0;
          videoAssets.forEach((asset, i) => {
            const clip = Timeline.addClip(asset, 'video', cursor);
            clip.properties.transitionType = 'fade';
            clip.properties.transitionDuration = 10;
            cursor += (asset.duration || 5) + 0.25;
          });
          Timeline.updateTotalDuration();
          Timeline.render();
          if (window.Renderer) window.Renderer.drawFrame();
          alert(`🎬 Auto-edited ${videoAssets.length} clip(s) into a video! Add background music with the AI prompt.`);
          return;
        }

        if (parseResult.type === 'overlay') {
          const overlayAsset = this.uploadedAssets.find(a => a.type === 'image' || a.type === 'video');
          if (!overlayAsset) {
            alert('Upload an image or video first to use as an overlay.');
            return;
          }
          const posMap = {
            'top-left':     { x: -38, y: -32 },
            'top-right':    { x: 38,  y: -32 },
            'bottom-left':  { x: -38, y: 32  },
            'bottom-right': { x: 38,  y: 32  },
            'center':       { x: 0,   y: 0   }
          };
          const pos = posMap[parseResult.position] || posMap['bottom-right'];
          const newClip = Timeline.addClip({ ...overlayAsset, type: 'overlay' }, 'overlay', 0);
          newClip.properties.scale = 30;
          newClip.properties.x = pos.x * (Renderer.canvas.width / 100);
          newClip.properties.y = pos.y * (Renderer.canvas.height / 100);
          newClip.properties.opacity = 85;
          Timeline.render();
          if (window.Renderer) window.Renderer.drawFrame();
          alert(`✅ Overlay added at ${parseResult.position}. Drag it on the canvas to reposition.`);
          return;
        }

        // Standard commands require an existing target clip
        let targetClip = Timeline.getSelectedClip();
        if (!targetClip) {
          targetClip = Timeline.clips.find(c => c.trackId === 'video' || c.trackId === 'audio');
        }

        if (!targetClip) {
          alert("Please add a video or audio clip to the timeline first.");
          return;
        }

        if (parseResult.type === 'interval') {
          Timeline.splitClipAtIntervals(targetClip.id, parseResult.value);
        } else if (parseResult.type === 'timestamps') {
          Timeline.splitClipAtTimes(targetClip.id, parseResult.value);
        } else {
          alert("Could not recognize command. Please try:\n- 'split into 1 minute clips'\n- 'split every 30 seconds'\n- 'cut at 5s, 10s, 15s'\n- 'insert cyber countdown at 5s'");
        }
      });
    }

    // Suggestions buttons
    document.querySelectorAll('.ai-sugg-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const prompt = btn.getAttribute('data-prompt');
        if (aiPromptInput) {
          aiPromptInput.value = prompt;
          if (btnExecuteAi) btnExecuteAi.click();
        }
      });
    });

    // 11. Mobile Drawer and Inspector Close actions
    const mobileAssetsClose = document.getElementById('mobile-assets-close');
    const mobileInspectorClose = document.getElementById('mobile-inspector-close');
    const inspectorPanel = document.querySelector('.inspector-panel');

    if (mobileAssetsClose) {
      mobileAssetsClose.addEventListener('click', () => {
        assetsDrawer.classList.remove('open');
        tabButtons.forEach(b => b.classList.remove('active'));
      });
    }

    if (mobileInspectorClose) {
      mobileInspectorClose.addEventListener('click', () => {
        inspectorPanel.classList.remove('open');
      });
    }
    // 12. Canvas overlay drag-to-reposition
    const mainCanvas = document.getElementById('main-canvas');
    if (mainCanvas) {
      let draggingOverlay = null;
      let dragStartX = 0, dragStartY = 0;
      let clipStartX = 0, clipStartY = 0;

      mainCanvas.addEventListener('mousedown', (e) => {
        const rect = mainCanvas.getBoundingClientRect();
        const scaleX = mainCanvas.width / rect.width;
        const scaleY = mainCanvas.height / rect.height;
        const mx = (e.clientX - rect.left) * scaleX;
        const my = (e.clientY - rect.top) * scaleY;
        const cx = mainCanvas.width / 2;
        const cy = mainCanvas.height / 2;

        // Find topmost overlay/sticker/text clip under cursor
        const hit = Timeline.clips.slice().reverse().find(clip => {
          if (!['overlay', 'sticker', 'text'].includes(clip.type)) return false;
          const playhead = Timeline.playhead;
          if (playhead < clip.startTime || playhead > clip.startTime + clip.duration) return false;
          const px = cx + (clip.properties.x || 0);
          const py = cy + (clip.properties.y || 0);
          const w = mainCanvas.width * (clip.properties.scale || 100) / 100 * 0.5;
          const h = mainCanvas.height * (clip.properties.scale || 100) / 100 * 0.5;
          return mx >= px - w/2 && mx <= px + w/2 && my >= py - h/2 && my <= py + h/2;
        });

        if (hit) {
          draggingOverlay = hit;
          dragStartX = mx;
          dragStartY = my;
          clipStartX = hit.properties.x || 0;
          clipStartY = hit.properties.y || 0;
          Timeline.selectedClipId = hit.id;
          Timeline.onSelectionChanged();
          e.preventDefault();
        }
      });

      mainCanvas.addEventListener('mousemove', (e) => {
        if (!draggingOverlay) return;
        const rect = mainCanvas.getBoundingClientRect();
        const scaleX = mainCanvas.width / rect.width;
        const scaleY = mainCanvas.height / rect.height;
        const mx = (e.clientX - rect.left) * scaleX;
        const my = (e.clientY - rect.top) * scaleY;
        draggingOverlay.properties.x = clipStartX + (mx - dragStartX);
        draggingOverlay.properties.y = clipStartY + (my - dragStartY);
        Renderer.drawFrame();
        // Update inspector x/y inputs if open
        const xInput = document.getElementById('prop-x');
        const yInput = document.getElementById('prop-y');
        if (xInput) xInput.value = Math.round(draggingOverlay.properties.x);
        if (yInput) yInput.value = Math.round(draggingOverlay.properties.y);
      });

      mainCanvas.addEventListener('mouseup', () => { draggingOverlay = null; });
      mainCanvas.addEventListener('mouseleave', () => { draggingOverlay = null; });
    }
  },
  parseAiPrompt(promptText) {
    const textLower = promptText.toLowerCase().trim();

    // Language name map for regional music search
    const LANGUAGES = [
      'malayalam', 'hindi', 'tamil', 'telugu', 'kannada', 'bengali', 'marathi',
      'gujarati', 'punjabi', 'arabic', 'english', 'spanish', 'french', 'korean',
      'japanese', 'chinese', 'urdu', 'odia', 'assamese', 'nepali', 'sinhala'
    ];
    const detectedLang = LANGUAGES.find(lang => textLower.includes(lang));

    // 0a. Auto-edit from uploads
    if (/(?:create|make|generate|auto.?edit|auto.?create|build).*(?:video|edit|film|movie)|auto.?edit/i.test(promptText)) {
      return { type: 'auto-edit' };
    }

    // 0b. Overlay / picture-in-picture
    if (/(?:add|insert|place).*(?:overlay|watermark|pip|picture.in.picture|logo)|(?:overlay|watermark)/i.test(promptText)) {
      let position = 'bottom-right';
      if (textLower.includes('top-left') || textLower.includes('top left')) position = 'top-left';
      else if (textLower.includes('top-right') || textLower.includes('top right')) position = 'top-right';
      else if (textLower.includes('bottom-left') || textLower.includes('bottom left')) position = 'bottom-left';
      else if (textLower.includes('center') || textLower.includes('middle')) position = 'center';
      return { type: 'overlay', position };
    }

    // 0c. Check for background music request (with language support)
    const bgMatch = textLower.match(/(?:add|insert|play)\s*(?:"([^"]+)"|'([^']+)'|([^"\r\n]+?))\s*(?:as a background|as background music|in the background|as background)/);
    const altMatch = textLower.match(/(?:add|insert|play)\s*(?:background music|bg music|song|songs|track|music)\s*(?:"([^"]+)"|'([^']+)'|([^"\r\n]+))/);
    
    if (bgMatch || altMatch || detectedLang) {
      let songName = bgMatch ? (bgMatch[1] || bgMatch[2] || bgMatch[3]) :
                    altMatch ? (altMatch[1] || altMatch[2] || altMatch[3]) :
                    textLower;
      // If language detected, build a better query
      if (detectedLang) {
        const extra = altMatch ? (altMatch[1] || altMatch[2] || altMatch[3] || '') : '';
        songName = detectedLang + (extra ? ' ' + extra : ' music');
      }
      return {
        type: 'background-music',
        songName: songName.trim(),
        language: detectedLang || null
      };
    }

    // 1. Check for splice insertion keyword: insert, add, append, put
    if (textLower.includes('insert') || textLower.includes('add') || textLower.includes('append') || textLower.includes('put')) {
      let startTime = 0;
      let duration = null;

      // Extract duration if specified: "between X and Y" or "from X to Y"
      let betweenMatch = textLower.match(/(?:between|from)\s*(\d+(?:\.\d+)?)\s*(?:s|sec|seconds)?\s*(?:and|to)\s*(\d+(?:\.\d+)?)/);
      let atMatch = textLower.match(/(?:at|start at|time|position)\s*(\d+(?:\.\d+)?)/);

      if (betweenMatch) {
        startTime = parseFloat(betweenMatch[1]);
        const endTime = parseFloat(betweenMatch[2]);
        duration = Math.max(1, endTime - startTime);
      } else if (atMatch) {
        startTime = parseFloat(atMatch[1]);
      }

      // Identify the asset (checking uploaded and sample assets)
      let chosenAsset = null;
      let trackId = 'video';

      const allAssets = [
        ...this.uploadedAssets,
        ...(typeof SampleAssets !== 'undefined' ? [
          ...SampleAssets.videos,
          ...SampleAssets.images,
          ...SampleAssets.audios
        ] : [])
      ];

      // Exact name match
      for (const asset of allAssets) {
        if (textLower.includes(asset.name.toLowerCase())) {
          chosenAsset = asset;
          break;
        }
      }

      // Keyword checks
      if (!chosenAsset) {
        if (textLower.includes('new video') || textLower.includes('uploaded video') || textLower.includes('the video')) {
          chosenAsset = this.uploadedAssets.find(a => a.type === 'video' || a.type === 'image');
        } else if (textLower.includes('new audio') || textLower.includes('uploaded audio') || textLower.includes('the audio')) {
          chosenAsset = this.uploadedAssets.find(a => a.type === 'audio');
        }
      }

      // Fallbacks
      if (!chosenAsset && this.uploadedAssets.length > 0) {
        chosenAsset = this.uploadedAssets[this.uploadedAssets.length - 1];
      }
      if (!chosenAsset && typeof SampleAssets !== 'undefined' && SampleAssets.videos.length > 0) {
        chosenAsset = SampleAssets.videos[0];
      }

      if (chosenAsset) {
        trackId = chosenAsset.type === 'audio' ? 'audio' : 'video';
      }

      return {
        type: 'insert',
        asset: chosenAsset,
        trackId: trackId,
        startTime: startTime,
        duration: duration
      };
    }

    // 2. Look for minute intervals
    let minMatch = textLower.match(/(\d+)\s*(minute|min)/);
    if (minMatch) {
      return { type: 'interval', value: parseFloat(minMatch[1]) * 60 };
    }

    // 3. Look for second intervals
    let secMatch = textLower.match(/(\d+)\s*(second|sec|s\b)/);
    if (secMatch) {
      return { type: 'interval', value: parseFloat(secMatch[1]) };
    }

    // 4. Look for "every X"
    let everyMatch = textLower.match(/(every|interval of)\s*(\d+)/);
    if (everyMatch) {
      return { type: 'interval', value: parseFloat(everyMatch[2]) };
    }

    // 5. Look for specific timestamps list
    if (textLower.includes("at") || textLower.includes(",")) {
      const numbers = textLower.match(/\d+(\.\d+)?/g);
      if (numbers && numbers.length > 0) {
        const times = numbers.map(Number).sort((a, b) => a - b);
        return { type: 'timestamps', value: times };
      }
    }

    return { type: 'unknown' };
  },

  async uploadToCloudinary(file) {
    const cloudName = 'ej9q3ihg';
    const presetName = 'unsigned_preset';
    
    let resourceType = 'auto';
    if (file.type.startsWith('image/')) {
      resourceType = 'image';
    } else if (file.type.startsWith('video/') || file.type.startsWith('audio/')) {
      resourceType = 'video';
    }
    
    const url = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`;
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', presetName);
    
    const response = await fetch(url, {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.error?.message || 'Upload failed');
    }
    
    return await response.json();
  },
  async handleLocalMediaUploads(files) {
    if (!files || files.length === 0) return;
    
    const loader = document.getElementById('canvas-loader');
    if (loader) {
      loader.classList.remove('hidden');
      loader.querySelector('span').textContent = `Uploading ${files.length} file(s) to Cloudinary...`;
    }

    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const cloudinaryData = await this.uploadToCloudinary(file);
        const url = cloudinaryData.secure_url;
        const isVideo = file.type.startsWith('video/');
        const type = isVideo ? 'video' : 'image';
        
        const asset = {
          id: 'upload-' + Date.now() + '-' + Math.floor(Math.random()*100),
          name: file.name,
          type: type,
          fileUrl: url,
          duration: isVideo ? Math.floor(cloudinaryData.duration || 0) : 5
        };

        // Create hidden background frame buffer tag to source canvas frame captures
        const bufferContainer = document.createElement('div');
        bufferContainer.style.display = 'none';
        
        if (isVideo) {
          const videoEl = document.createElement('video');
          videoEl.id = asset.id + '-element';
          videoEl.src = url;
          videoEl.preload = 'auto';
          videoEl.muted = true;
          videoEl.playsInline = true;
          videoEl.crossOrigin = 'anonymous';
          
          await new Promise((resolve) => {
            videoEl.onloadedmetadata = () => {
              if (asset.duration === 0) {
                asset.duration = Math.floor(videoEl.duration);
              }
              this.addUploadedAssetCard(asset);
              resolve();
            };
            videoEl.onerror = () => {
              console.error("Failed to load video element for thumbnail:", url);
              resolve();
            };
          });
          bufferContainer.appendChild(videoEl);
        } else {
          const imgEl = document.createElement('img');
          imgEl.id = asset.id + '-element';
          imgEl.src = url;
          imgEl.crossOrigin = 'anonymous';
          
          await new Promise((resolve) => {
            imgEl.onload = () => {
              this.addUploadedAssetCard(asset);
              resolve();
            };
            imgEl.onerror = () => {
              console.error("Failed to load image element for thumbnail:", url);
              resolve();
            };
          });
          bufferContainer.appendChild(imgEl);
        }
        
        document.body.appendChild(bufferContainer);
      });

      await Promise.all(uploadPromises);
    } catch (e) {
      console.error("Cloudinary media upload error:", e);
      alert("Failed to upload media to Cloudinary: " + e.message);
    } finally {
      if (loader) {
        loader.classList.add('hidden');
      }
    }
  },
  async handleLocalAudioUploads(files) {
    if (!files || files.length === 0) return;
    
    const loader = document.getElementById('canvas-loader');
    if (loader) {
      loader.classList.remove('hidden');
      loader.querySelector('span').textContent = `Uploading ${files.length} audio file(s) to Cloudinary...`;
    }

    try {
      for (const file of Array.from(files)) {
        const cloudinaryData = await this.uploadToCloudinary(file);
        const url = cloudinaryData.secure_url;
        const id = 'upload-audio-' + Date.now();
        
        if (loader) {
          loader.querySelector('span').textContent = `Decoding audio track: ${file.name}...`;
        }

        const buffer = await Renderer.loadAudioBuffer(url, id);
        if (!buffer) {
          alert(`Failed to load audio "${file.name}". Make sure the file format is supported.`);
          continue;
        }

        const asset = {
          id: id,
          name: file.name,
          type: 'audio',
          fileUrl: url,
          duration: Math.floor(buffer.duration)
        };

        // Add to Library list
        const audioList = document.getElementById('audio-assets-list');
        const row = document.createElement('div');
        row.className = 'audio-item-row';
        
        const info = document.createElement('div');
        info.className = 'audio-info';
        const name = document.createElement('span');
        name.className = 'audio-name';
        name.textContent = asset.name;
        const dur = document.createElement('span');
        dur.className = 'audio-duration';
        dur.textContent = `Upload - ${asset.duration}s`;
        
        info.appendChild(name);
        info.appendChild(dur);
        
        const addBtn = document.createElement('button');
        addBtn.className = 'audio-action-btn';
        addBtn.innerHTML = '<i data-lucide="plus"></i>';
        
        row.appendChild(info);
        row.appendChild(addBtn);
        
        row.addEventListener('click', () => {
          Timeline.addClip(asset, 'audio', Timeline.playhead);
        });
        
        audioList.insertBefore(row, audioList.firstChild);
      }
      
      lucide.createIcons();
    } catch (e) {
      console.error("Cloudinary audio upload error:", e);
      alert("Failed to upload audio to Cloudinary: " + e.message);
    } finally {
      if (loader) {
        loader.classList.add('hidden');
      }
    }
  },

  addUploadedAssetCard(asset) {
    this.uploadedAssets.push(asset);
    
    const container = document.getElementById('uploaded-assets-list');
    
    // Clear empty text if exists
    const emptyText = container.querySelector('.empty-assets-text');
    if (emptyText) emptyText.remove();
    
    const card = document.createElement('div');
    card.className = 'asset-card';
    card.setAttribute('data-asset-id', asset.id);

    const preview = document.createElement('canvas');
    preview.className = 'asset-preview';
    preview.width = 160;
    preview.height = 100;
    const pCtx = preview.getContext('2d');

    // Generate thumbnails
    if (asset.type === 'video') {
      const vid = document.getElementById(asset.id + '-element');
      // Seek video forward slightly to get non-black thumbnail
      vid.currentTime = 0.5;
      vid.addEventListener('seeked', function drawThumb() {
        pCtx.drawImage(vid, 0, 0, 160, 100);
        vid.removeEventListener('seeked', drawThumb);
      });
    } else {
      const img = document.getElementById(asset.id + '-element');
      pCtx.drawImage(img, 0, 0, 160, 100);
    }

    const dur = document.createElement('div');
    dur.className = 'asset-duration-tag';
    dur.textContent = `${asset.duration}s`;

    const name = document.createElement('div');
    name.className = 'asset-name-tag';
    name.textContent = asset.name;

    const hover = document.createElement('div');
    hover.className = 'asset-hover-overlay';
    hover.innerHTML = '<i data-lucide="plus"></i>';

    card.appendChild(preview);
    card.appendChild(dur);
    card.appendChild(name);
    card.appendChild(hover);

    card.addEventListener('click', () => {
      Timeline.addClip(asset, asset.type === 'video' || asset.type === 'image' ? 'video' : 'audio', Timeline.playhead);
    });

    container.insertBefore(card, container.firstChild);
    lucide.createIcons();
  },

  // Keyboards shortcuts controls
  bindKeyboardShortcuts() {
    window.addEventListener('keydown', (e) => {
      // If focused in textarea or inputs, ignore
      if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        if (Renderer.isPlaying) Renderer.pause(); else Renderer.play();
      } 
      else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        Timeline.setPlayheadTime(Timeline.playhead - 0.0333); // Shift 1 frame back
      } 
      else if (e.code === 'ArrowRight') {
        e.preventDefault();
        Timeline.setPlayheadTime(Timeline.playhead + 0.0333); // Shift 1 frame forward
      } 
      else if (e.code === 'KeyS') {
        e.preventDefault();
        Timeline.splitSelectedClip();
      } 
      else if (e.code === 'Delete' || e.code === 'Backspace') {
        if (Timeline.selectedClipId) {
          Timeline.removeClip(Timeline.selectedClipId);
        }
      }
    });
  },

  // Bi-directionally bind Properties Panel (Inspector)
  bindInspectorEvents() {
    const inputs = {
      posX: document.getElementById('prop-pos-x'),
      posY: document.getElementById('prop-pos-y'),
      scale: document.getElementById('prop-scale'),
      rotation: document.getElementById('prop-rotation'),
      opacity: document.getElementById('prop-opacity'),
      
      textVal: document.getElementById('prop-text-val'),
      fontFamily: document.getElementById('prop-font-family'),
      fontSize: document.getElementById('prop-font-size'),
      fontColor: document.getElementById('prop-font-color'),
      strokeWidth: document.getElementById('prop-text-stroke'),
      strokeColor: document.getElementById('prop-text-stroke-color'),
      
      volume: document.getElementById('prop-audio-vol'),
      
      transitionType: document.getElementById('prop-transition-type'),
      transitionDur: document.getElementById('prop-transition-dur'),
      
      deleteBtn: document.getElementById('btn-delete-clip')
    };

    // Helper bind mapping values
    const setupSliderBind = (el, propPath, displayElId, unit = '') => {
      el.addEventListener('input', (e) => {
        const val = e.target.value;
        const selected = Timeline.getSelectedClip();
        if (selected) {
          selected.properties[propPath] = val;
          document.getElementById(displayElId).textContent = val + unit;
          Renderer.drawFrame();
        }
      });
    };

    setupSliderBind(inputs.posX, 'x', 'val-pos-x', 'px');
    setupSliderBind(inputs.posY, 'y', 'val-pos-y', 'px');
    setupSliderBind(inputs.scale, 'scale', 'val-scale', '%');
    setupSliderBind(inputs.rotation, 'rotation', 'val-rotation', '°');
    setupSliderBind(inputs.opacity, 'opacity', 'val-opacity', '%');
    setupSliderBind(inputs.fontSize, 'fontSize', 'val-font-size', 'px');
    setupSliderBind(inputs.strokeWidth, 'strokeWidth', 'val-text-stroke', 'px');
    setupSliderBind(inputs.volume, 'volume', 'val-audio-vol', '%');
    
    // Transition duration slider (stores tenths, displays seconds)
    inputs.transitionDur.addEventListener('input', (e) => {
      const selected = Timeline.getSelectedClip();
      if (selected) {
        selected.properties.transitionDuration = e.target.value;
        document.getElementById('val-transition-dur').textContent = (e.target.value / 10).toFixed(1) + 's';
        Renderer.drawFrame();
      }
    });

    // Inputs/Dropdown links
    inputs.textVal.addEventListener('input', (e) => {
      const selected = Timeline.getSelectedClip();
      if (selected) {
        selected.properties.text = e.target.value;
        selected.name = e.target.value.substring(0, 15) || 'Text'; // update timeline label
        Timeline.render();
        Renderer.drawFrame();
      }
    });

    inputs.fontFamily.addEventListener('change', (e) => {
      const selected = Timeline.getSelectedClip();
      if (selected) {
        selected.properties.fontFamily = e.target.value;
        Renderer.drawFrame();
      }
    });

    inputs.fontColor.addEventListener('input', (e) => {
      const selected = Timeline.getSelectedClip();
      if (selected) {
        selected.properties.color = e.target.value;
        Renderer.drawFrame();
      }
    });

    inputs.strokeColor.addEventListener('input', (e) => {
      const selected = Timeline.getSelectedClip();
      if (selected) {
        selected.properties.strokeColor = e.target.value;
        Renderer.drawFrame();
      }
    });

    inputs.transitionType.addEventListener('change', (e) => {
      const selected = Timeline.getSelectedClip();
      if (selected) {
        selected.properties.transitionType = e.target.value;
        Renderer.drawFrame();
      }
    });

    // Text Align binds
    document.querySelectorAll('.align-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const selected = Timeline.getSelectedClip();
        if (selected) {
          selected.properties.align = btn.getAttribute('data-align');
          document.querySelectorAll('.align-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          Renderer.drawFrame();
        }
      });
    });

    inputs.deleteBtn.addEventListener('click', () => {
      if (Timeline.selectedClipId) {
        Timeline.removeClip(Timeline.selectedClipId);
      }
    });
  },

  // Updates properties panel layout display values based on active selection
  updateInspector() {
    const selected = Timeline.getSelectedClip();
    
    const panelEmpty = document.getElementById('inspector-empty');
    const panelClip = document.getElementById('inspector-clip');
    const inspectorPanel = document.querySelector('.inspector-panel');
    
    if (!selected) {
      panelEmpty.classList.add('active');
      panelClip.classList.remove('active');
      inspectorPanel.classList.remove('open'); // Slide close on mobile
      
      document.getElementById('selected-clip-hint').textContent = "No clip selected";
      return;
    }

    panelEmpty.classList.remove('active');
    panelClip.classList.add('active');
    inspectorPanel.classList.add('open'); // Slide open on mobile

    // Set header labels
    document.getElementById('inspect-clip-type').textContent = selected.type;
    document.getElementById('inspect-clip-name').textContent = selected.name;
    document.getElementById('selected-clip-hint').textContent = `Selected: "${selected.name}"`;

    const fp = selected.properties;
    
    // Set timing indicators
    document.getElementById('prop-time-start').textContent = selected.startTime.toFixed(2) + 's';
    document.getElementById('prop-time-duration').textContent = selected.duration.toFixed(2) + 's';

    // Set properties values
    document.getElementById('prop-pos-x').value = fp.x;
    document.getElementById('val-pos-x').textContent = fp.x + 'px';
    
    document.getElementById('prop-pos-y').value = fp.y;
    document.getElementById('val-pos-y').textContent = fp.y + 'px';
    
    document.getElementById('prop-scale').value = fp.scale;
    document.getElementById('val-scale').textContent = fp.scale + '%';
    
    document.getElementById('prop-rotation').value = fp.rotation;
    document.getElementById('val-rotation').textContent = fp.rotation + '°';
    
    document.getElementById('prop-opacity').value = fp.opacity;
    document.getElementById('val-opacity').textContent = fp.opacity + '%';

    // Show/Hide property subgroups based on type
    const groupTransform = document.getElementById('group-transform');
    const groupText = document.getElementById('group-text');
    const groupFilters = document.getElementById('group-filters');
    const groupAudio = document.getElementById('group-audio');
    const groupTransition = document.getElementById('group-transition');

    // Defaults
    groupTransform.classList.remove('hidden');
    groupText.classList.add('hidden');
    groupFilters.classList.remove('hidden');
    groupAudio.classList.add('hidden');
    groupTransition.classList.remove('hidden');

    if (selected.type === 'text') {
      groupText.classList.remove('hidden');
      groupFilters.classList.add('hidden');
      groupTransition.classList.add('hidden');
      
      // Populate text parameters
      document.getElementById('prop-text-val').value = fp.text;
      document.getElementById('prop-font-family').value = fp.fontFamily;
      document.getElementById('prop-font-size').value = fp.fontSize;
      document.getElementById('val-font-size').textContent = fp.fontSize + 'px';
      document.getElementById('prop-font-color').value = fp.color;
      document.getElementById('prop-text-stroke').value = fp.strokeWidth;
      document.getElementById('val-text-stroke').textContent = fp.strokeWidth + 'px';
      document.getElementById('prop-text-stroke-color').value = fp.strokeColor;
      
      document.querySelectorAll('.align-btn').forEach(btn => {
        if (btn.getAttribute('data-align') === fp.align) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      });
    } 
    else if (selected.type === 'sticker') {
      groupFilters.classList.add('hidden');
      groupTransition.classList.add('hidden');
    }
    else if (selected.type === 'audio') {
      groupTransform.classList.add('hidden');
      groupFilters.classList.add('hidden');
      groupTransition.classList.add('hidden');
      groupAudio.classList.remove('hidden');
      
      document.getElementById('prop-audio-vol').value = fp.volume;
      document.getElementById('val-audio-vol').textContent = fp.volume + '%';
    } 
    else if (selected.type === 'video') {
      // Videos have audio tracks too
      groupAudio.classList.remove('hidden');
      document.getElementById('prop-audio-vol').value = fp.volume;
      document.getElementById('val-audio-vol').textContent = fp.volume + '%';
    }

    if (selected.type === 'video' || selected.type === 'image') {
      document.getElementById('prop-transition-type').value = fp.transitionType;
      document.getElementById('prop-transition-dur').value = fp.transitionDuration;
      document.getElementById('val-transition-dur').textContent = (fp.transitionDuration / 10).toFixed(1) + 's';
      
      // Update filters active card
      document.querySelectorAll('.filter-card').forEach(card => {
        if (card.getAttribute('data-filter-id') === fp.filterPresetId) {
          card.classList.add('active');
        } else {
          card.classList.remove('active');
        }
      });

      // Update transition active card
      document.querySelectorAll('.transition-card').forEach(card => {
        if (card.getAttribute('data-trans-type') === fp.transitionType) {
          card.classList.add('active');
        } else {
          card.classList.remove('active');
        }
      });
    }
  }
};

// Start the Application
window.addEventListener('DOMContentLoaded', () => {
  App.init();
});
