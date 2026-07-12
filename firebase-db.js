/* ==========================================
   Antigravity Cut - Firebase Firestore Synchronization
   ========================================== */

const FirebaseDB = {
  db: null,

  init() {
    // 1. Firebase configuration extracted from configuration files
    const firebaseConfig = {
      apiKey: "AIzaSyDWTqXbUsrTEyRab3PwjNFqwmfPVtw8-a0",
      authDomain: "ppetti-2dffd.firebaseapp.com",
      projectId: "ppetti-2dffd",
      storageBucket: "ppetti-2dffd.firebasestorage.app",
      messagingSenderId: "865276458846",
      appId: "1:865276458846:web:bbb57849d84dac8f2dc1cf",
      measurementId: "G-HP9XF92CZ1"
    };

    // 2. Initialize App
    try {
      if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
      }
      this.db = firebase.firestore();
      console.log("Firebase initialized successfully!");
      
      // Auto refresh list
      this.refreshProjectsList();
      this.bindDatabaseEvents();
    } catch (e) {
      console.error("Firebase connection error: ", e);
      const listEl = document.getElementById('firebase-projects-list');
      if (listEl) {
        listEl.innerHTML = '<div class="empty-assets-text" style="color:#ef4444;">Offline mode. Could not connect to Firebase database.</div>';
      }
    }
  },

  bindDatabaseEvents() {
    const btnSave = document.getElementById('btn-save-project');
    const inputName = document.getElementById('project-name-input');

    if (btnSave) {
      btnSave.addEventListener('click', async () => {
        const name = inputName.value.trim();
        if (!name) {
          alert("Please enter a name for your project before saving.");
          return;
        }

        btnSave.disabled = true;
        const prevText = btnSave.querySelector('span').textContent;
        btnSave.querySelector('span').textContent = 'Saving...';

        try {
          await this.saveProject(name);
          inputName.value = '';
          alert(`Project "${name}" saved to Cloud Firestore successfully!`);
          this.refreshProjectsList();
        } catch (e) {
          console.error(e);
          alert("Failed to save project. Ensure Firestore rules permit operations.");
        } finally {
          btnSave.disabled = false;
          btnSave.querySelector('span').textContent = prevText;
        }
      });
    }
  },

  async saveProject(name) {
    if (!this.db) throw new Error("Firebase Firestore not initialized");

    const projectData = {
      name: name,
      clips: Timeline.clips,
      totalDuration: Timeline.totalDuration,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    // Write to projects collection
    return this.db.collection("mycut_projects").add(projectData);
  },
  async loadProject(projectId) {
    if (!this.db) return;
    
    const loader = document.getElementById('canvas-loader');
    loader.classList.remove('hidden');
    loader.querySelector('span').textContent = 'Fetching project from Firestore...';

    try {
      const doc = await this.db.collection("mycut_projects").doc(projectId).get();
      if (!doc.exists) {
        alert("Project not found in Cloud Database.");
        return;
      }

      const data = doc.data();
      
      // Stop playback
      Renderer.stop();

      // Load clips array
      Timeline.clips = data.clips || [];

      // Dynamically recreate background element buffers and decode audio buffers
      if (Timeline.clips.length > 0) {
        loader.querySelector('span').textContent = 'Loading and buffering cloud assets...';
        
        for (const clip of Timeline.clips) {
          if (clip.fileUrl) {
            const elemId = clip.id + '-element';
            if (!document.getElementById(elemId)) {
              const bufferContainer = document.createElement('div');
              bufferContainer.style.display = 'none';
              
              if (clip.type === 'video') {
                const videoEl = document.createElement('video');
                videoEl.id = elemId;
                videoEl.src = clip.fileUrl;
                videoEl.preload = 'auto';
                videoEl.muted = true;
                videoEl.playsInline = true;
                videoEl.crossOrigin = 'anonymous';
                bufferContainer.appendChild(videoEl);
              } else if (clip.type === 'image') {
                const imgEl = document.createElement('img');
                imgEl.id = elemId;
                imgEl.src = clip.fileUrl;
                imgEl.crossOrigin = 'anonymous';
                bufferContainer.appendChild(imgEl);
              }
              document.body.appendChild(bufferContainer);
            }
            
            // Decode audio track if it's an audio clip or a video with sound
            if (clip.type === 'audio' || clip.type === 'video') {
              if (!Renderer.audioBuffers[clip.id]) {
                loader.querySelector('span').textContent = `Loading audio for: ${clip.name || 'clip'}...`;
                await Renderer.loadAudioBuffer(clip.fileUrl, clip.id);
              }
            }
          }
        }
      }

      Timeline.selectedClipId = null;
      Timeline.updateTotalDuration();
      Timeline.render();
      Timeline.onSelectionChanged();
      
      // Redraw frame
      Renderer.drawFrame();
      
      alert(`Project "${data.name}" loaded successfully!`);
    } catch (e) {
      console.error(e);
      alert("Failed to load project from Firestore.");
    } finally {
      loader.classList.add('hidden');
    }
  },

  async deleteProject(projectId, name) {
    if (!this.db) return;
    if (!confirm(`Are you sure you want to delete project "${name}" from Cloud Database?`)) return;

    try {
      await this.db.collection("mycut_projects").doc(projectId).delete();
      alert("Project deleted.");
      this.refreshProjectsList();
    } catch (e) {
      console.error(e);
      alert("Could not delete project.");
    }
  },

  async refreshProjectsList() {
    const listEl = document.getElementById('firebase-projects-list');
    if (!listEl || !this.db) return;

    listEl.innerHTML = '<div class="empty-assets-text">Loading cloud projects...</div>';

    try {
      const querySnapshot = await this.db.collection("mycut_projects")
        .orderBy("updatedAt", "desc")
        .limit(15)
        .get();

      listEl.innerHTML = '';

      if (querySnapshot.empty) {
        listEl.innerHTML = '<div class="empty-assets-text">No cloud projects saved yet. Save current work above!</div>';
        return;
      }

      querySnapshot.forEach(doc => {
        const data = doc.data();
        const docId = doc.id;
        
        const row = document.createElement('div');
        row.className = 'audio-item-row';
        row.style.borderLeft = '3px solid var(--accent-color)';
        
        const info = document.createElement('div');
        info.className = 'audio-info';
        
        const name = document.createElement('span');
        name.className = 'audio-name';
        name.textContent = data.name;
        
        const dateSpan = document.createElement('span');
        dateSpan.className = 'audio-duration';
        
        const dateVal = data.updatedAt ? data.updatedAt.toDate() : new Date();
        dateSpan.textContent = dateVal.toLocaleDateString("en-IN", {
          month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
        });
        
        info.appendChild(name);
        info.appendChild(dateSpan);
        
        // Load & Delete controls
        const controls = document.createElement('div');
        controls.style.display = 'flex';
        controls.style.gap = '4px';
        
        const btnLoad = document.createElement('button');
        btnLoad.className = 'audio-action-btn';
        btnLoad.title = "Load Project";
        btnLoad.innerHTML = '<i data-lucide="folder-open" style="color:var(--accent-color);"></i>';
        btnLoad.addEventListener('click', (e) => {
          e.stopPropagation();
          this.loadProject(docId);
        });

        const btnDel = document.createElement('button');
        btnDel.className = 'audio-action-btn';
        btnDel.title = "Delete Project";
        btnDel.innerHTML = '<i data-lucide="trash-2" style="color:#ef4444;"></i>';
        btnDel.addEventListener('click', (e) => {
          e.stopPropagation();
          this.deleteProject(docId, data.name);
        });

        controls.appendChild(btnLoad);
        controls.appendChild(btnDel);
        
        row.appendChild(info);
        row.appendChild(controls);
        listEl.appendChild(row);
      });

      // Render icons
      lucide.createIcons();
    } catch (e) {
      console.error(e);
      listEl.innerHTML = '<div class="empty-assets-text" style="color:#ef4444;">Could not load projects from Firestore database.</div>';
    }
  }
};

// Auto init when document scripts are parsed
window.addEventListener('DOMContentLoaded', () => {
  FirebaseDB.init();
});
