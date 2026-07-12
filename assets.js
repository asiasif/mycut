/* ==========================================
   Antigravity Cut - Stock & Procedural Assets
   ========================================== */

const SampleAssets = {
  videos: [
    {
      id: 'v-countdown',
      name: 'Cyber Countdown',
      type: 'video',
      duration: 10,
      thumbnail: 'procedural-countdown',
      procedural: true,
      generator: 'drawCountdown'
    },
    {
      id: 'v-neonwave',
      name: 'Neon Grid Wave',
      type: 'video',
      duration: 15,
      thumbnail: 'procedural-neonwave',
      procedural: true,
      generator: 'drawNeonWave'
    },
    {
      id: 'v-matrix',
      name: 'Matrix Rain',
      type: 'video',
      duration: 12,
      thumbnail: 'procedural-matrix',
      procedural: true,
      generator: 'drawMatrix'
    },
    {
      id: 'v-particles',
      name: 'Starfield Warp',
      type: 'video',
      duration: 8,
      thumbnail: 'procedural-particles',
      procedural: true,
      generator: 'drawStarfield'
    }
  ],
  
  images: [
    {
      id: 'img-sunset',
      name: 'Vaporwave Sunset',
      type: 'image',
      duration: 5,
      thumbnail: 'procedural-sunset',
      procedural: true,
      generator: 'drawSunset'
    },
    {
      id: 'img-cyber',
      name: 'Cyber Grid',
      type: 'image',
      duration: 5,
      thumbnail: 'procedural-cybergrid',
      procedural: true,
      generator: 'drawCyberGrid'
    },
    {
      id: 'img-aurora',
      name: 'Cosmic Aurora',
      type: 'image',
      duration: 5,
      thumbnail: 'procedural-aurora',
      procedural: true,
      generator: 'drawAurora'
    }
  ],

  audios: [
    {
      id: 'aud-synthwave',
      name: 'Synthwave Bassline',
      type: 'audio',
      duration: 16,
      synthesized: true,
      notes: [
        { time: 0, note: 55, dur: 0.25 }, // G2
        { time: 0.25, note: 55, dur: 0.25 },
        { time: 0.5, note: 55, dur: 0.25 },
        { time: 0.75, note: 55, dur: 0.25 },
        { time: 1.0, note: 51, dur: 0.25 }, // Eb2
        { time: 1.25, note: 51, dur: 0.25 },
        { time: 1.5, note: 58, dur: 0.25 }, // Bb2
        { time: 1.75, note: 58, dur: 0.25 }
      ]
    },
    {
      id: 'aud-melody',
      name: 'Ambient Chill Keys',
      type: 'audio',
      duration: 20,
      synthesized: true,
      notes: [
        { time: 0, note: 60, dur: 1.5 }, // C4
        { time: 0.5, note: 64, dur: 1.5 }, // E4
        { time: 1.0, note: 67, dur: 1.5 }, // G4
        { time: 1.5, note: 71, dur: 1.5 }, // B4
        { time: 2.0, note: 57, dur: 1.5 }, // A3
        { time: 2.5, note: 60, dur: 1.5 }, // C4
        { time: 3.0, note: 64, dur: 1.5 }, // E4
        { time: 3.5, note: 69, dur: 1.5 }  // A4
      ]
    },
    {
      id: 'aud-retro',
      name: '8-Bit Arpeggio',
      type: 'audio',
      duration: 10,
      synthesized: true,
      notes: [
        { time: 0, note: 60, dur: 0.1 }, { time: 0.1, note: 64, dur: 0.1 }, { time: 0.2, note: 67, dur: 0.1 }, { time: 0.3, note: 72, dur: 0.1 },
        { time: 0.4, note: 60, dur: 0.1 }, { time: 0.5, note: 64, dur: 0.1 }, { time: 0.6, note: 67, dur: 0.1 }, { time: 0.7, note: 72, dur: 0.1 },
        { time: 0.8, note: 62, dur: 0.1 }, { time: 0.9, note: 65, dur: 0.1 }, { time: 1.0, note: 69, dur: 0.1 }, { time: 1.1, note: 74, dur: 0.1 },
        { time: 1.2, note: 62, dur: 0.1 }, { time: 1.3, note: 65, dur: 0.1 }, { time: 1.4, note: 69, dur: 0.1 }, { time: 1.5, note: 74, dur: 0.1 }
      ]
    }
  ],

  stickers: [
    { id: 'st-heart', type: 'sticker', name: 'Heart', content: '❤️' },
    { id: 'st-fire', type: 'sticker', name: 'Fire', content: '🔥' },
    { id: 'st-sparkle', type: 'sticker', name: 'Sparkles', content: '✨' },
    { id: 'st-thumbs', type: 'sticker', name: 'Thums Up', content: '👍' },
    { id: 'st-cool', type: 'sticker', name: 'Cool Face', content: '😎' },
    { id: 'st-laugh', type: 'sticker', name: 'Laughing', content: '😂' },
    { id: 'st-crown', type: 'sticker', name: 'Crown', content: '👑' },
    { id: 'st-arrow', type: 'sticker', name: 'Direct Arrow', content: '➔' },
    { id: 'st-cross', type: 'sticker', name: 'Target', content: '🎯' },
    { id: 'st-star', type: 'sticker', name: 'Star Icon', content: '⭐' },
    { id: 'st-music', type: 'sticker', name: 'Music Node', content: '🎵' },
    { id: 'st-camera', type: 'sticker', name: 'Camera', content: '📷' }
  ],

  filters: [
    { id: 'filt-normal', name: 'Normal', filterStr: 'none' },
    { id: 'filt-cyber', name: 'Cyberpunk', filterStr: 'contrast(1.4) brightness(0.9) hue-rotate(50deg) saturate(1.8)' },
    { id: 'filt-vintage', name: 'Vintage Sepia', filterStr: 'sepia(0.8) contrast(1.1) brightness(0.95)' },
    { id: 'filt-mono', name: 'Noir Grayscale', filterStr: 'grayscale(1) contrast(1.3)' },
    { id: 'filt-cold', name: 'Cold Ice', filterStr: 'hue-rotate(180deg) saturate(1.2) brightness(0.9)' },
    { id: 'filt-dreamy', name: 'Dreamy Blur', filterStr: 'blur(1px) saturate(1.3) contrast(0.95)' },
    { id: 'filt-invert', name: 'Inversion', filterStr: 'invert(1)' }
  ],

  transitions: [
    { id: 'trans-fade', name: 'Cross Fade', type: 'fade', icon: 'blend' },
    { id: 'trans-fadeblack', name: 'Fade to Black', type: 'fadeblack', icon: 'square' },
    { id: 'trans-slideleft', name: 'Slide Left', type: 'slideleft', icon: 'arrow-left' },
    { id: 'trans-slideright', name: 'Slide Right', type: 'slideright', icon: 'arrow-right' },
    { id: 'trans-zoomin', name: 'Zoom In', type: 'zoomin', icon: 'zoom-in' }
  ]
};

// Procedural visual draw methods. Renders dynamic content based on frame timestamps
const Generators = {
  drawCountdown: (ctx, time, width, height) => {
    // Cyberpunk countdown animation
    const progress = time % 10;
    const count = 10 - Math.floor(progress);
    
    // Background
    ctx.fillStyle = '#09090b';
    ctx.fillRect(0, 0, width, height);
    
    // Cyber Grid
    ctx.strokeStyle = 'rgba(0, 242, 254, 0.08)';
    ctx.lineWidth = 1;
    const gridSize = 40;
    for (let x = 0; x < width; x += gridSize) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
    }
    for (let y = 0; y < height; y += gridSize) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
    }

    // Outer loading circle
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = 120;
    const millisecondAngle = (progress % 1) * Math.PI * 2 - Math.PI / 2;
    
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, -Math.PI/2, Math.PI * 2 - Math.PI/2);
    ctx.strokeStyle = '#1e1e24';
    ctx.lineWidth = 12;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, -Math.PI/2, millisecondAngle);
    ctx.strokeStyle = '#00f2fe';
    ctx.lineWidth = 12;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Center Text
    ctx.font = '800 120px Outfit, Arial';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = '#00f2fe';
    ctx.shadowBlur = 15;
    ctx.fillText(count.toString(), centerX, centerY);
    ctx.shadowBlur = 0; // reset

    // Lower progress bar
    const barWidth = 300;
    const barHeight = 6;
    ctx.fillStyle = '#1e1e24';
    ctx.fillRect(centerX - barWidth/2, centerY + 180, barWidth, barHeight);

    ctx.fillStyle = '#4facfe';
    ctx.fillRect(centerX - barWidth/2, centerY + 180, barWidth * (progress / 10), barHeight);
  },

  drawNeonWave: (ctx, time, width, height) => {
    // Futuristic moving wave grid
    ctx.fillStyle = '#06060c';
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = 'rgba(0, 242, 254, 0.15)';
    ctx.lineWidth = 2;
    
    // Horizontal 3D perspective lines
    const horizon = height * 0.4;
    for (let y = horizon; y < height; y += 25 + (y - horizon) * 0.15) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    
    // Vertical perspective lines
    const linesCount = 18;
    for (let i = 0; i <= linesCount; i++) {
      const xRatio = i / linesCount;
      const startX = width * xRatio;
      const endX = (xRatio - 0.5) * width * 3 + width / 2;
      ctx.beginPath();
      ctx.moveTo(startX, horizon);
      ctx.lineTo(endX, height);
      ctx.stroke();
    }

    // Draw mountains on horizon
    ctx.fillStyle = '#0f091a';
    ctx.beginPath();
    ctx.moveTo(0, horizon);
    ctx.lineTo(width * 0.2, horizon - 50);
    ctx.lineTo(width * 0.4, horizon);
    ctx.lineTo(width * 0.65, horizon - 90);
    ctx.lineTo(width * 0.85, horizon - 30);
    ctx.lineTo(width, horizon);
    ctx.closePath();
    ctx.fill();

    // Draw Sunset Sun on Horizon
    const sunR = 80;
    const sunX = width / 2;
    const sunY = horizon - 20;
    const grad = ctx.createLinearGradient(sunX, sunY - sunR, sunX, sunY + sunR);
    grad.addColorStop(0, '#ff007f');
    grad.addColorStop(0.5, '#ff5e36');
    grad.addColorStop(1, '#ffeb3b');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(sunX, sunY, sunR, Math.PI, 0);
    ctx.closePath();
    ctx.fill();

    // Horizontal bars cutting into sun (Retro Style)
    ctx.fillStyle = '#06060c';
    for (let y = sunY - sunR; y < sunY; y += 12) {
      const thick = (y - (sunY - sunR)) / 8;
      ctx.fillRect(sunX - sunR - 10, y, sunR * 2 + 20, Math.max(1, thick));
    }

    // Moving Laser Line
    const laserY = horizon + ((time * 80) % (height - horizon));
    ctx.strokeStyle = '#ff007f';
    ctx.shadowColor = '#ff007f';
    ctx.shadowBlur = 10;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, laserY);
    ctx.lineTo(width, laserY);
    ctx.stroke();
    ctx.shadowBlur = 0;
  },

  drawMatrix: (ctx, time, width, height) => {
    // Classic Matrix digital rain
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, width, height);

    ctx.font = '16px monospace';
    ctx.textAlign = 'left';

    const columns = Math.ceil(width / 20);
    const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ$#@&";
    
    for (let i = 0; i < columns; i++) {
      // Procedural speed and positions based on column index and elapsed time
      const speed = 15 + (i * 3) % 25;
      const initialOffset = (i * 123) % 500;
      const totalY = initialOffset + time * speed * 25;
      const currentY = totalY % (height + 150) - 50;
      
      const streamLength = 10 + (i * 7) % 15;
      for (let j = 0; j < streamLength; j++) {
        const charY = currentY - (j * 20);
        if (charY < -20 || charY > height + 20) continue;

        const charIndex = Math.floor(Math.abs(Math.sin(i * 10 + Math.floor(time * 5) + j)) * chars.length) % chars.length;
        const char = chars[charIndex];

        // Fade brightness as we go up the tail
        const alpha = 1 - (j / streamLength);
        
        if (j === 0) {
          ctx.fillStyle = 'rgba(255, 255, 255, ' + alpha + ')'; // Head character is bright white
          ctx.shadowColor = '#00ff00';
          ctx.shadowBlur = 5;
        } else {
          ctx.fillStyle = 'rgba(0, 255, 70, ' + alpha + ')';
          ctx.shadowBlur = 0;
        }
        ctx.fillText(char, i * 20 + 2, charY);
      }
      ctx.shadowBlur = 0;
    }
  },

  drawStarfield: (ctx, time, width, height) => {
    // Flying stars warping through space
    ctx.fillStyle = '#020204';
    ctx.fillRect(0, 0, width, height);

    const centerX = width / 2;
    const centerY = height / 2;
    const starCount = 150;
    const speed = 1.0 + (time * 0.1) % 4; // speeds up slightly
    
    for (let i = 0; i < starCount; i++) {
      // Seed positions procedurally based on index
      const angle = (i * 17) % 360 * (Math.PI / 180);
      const startDist = (i * 31) % 600;
      
      // Calculate active distance
      const distance = (startDist + time * 120 * speed) % 700;
      
      // Map polar coordinates to Cartesian
      const x = centerX + Math.cos(angle) * distance;
      const y = centerY + Math.sin(angle) * distance;

      // Draw star lines pointing outward
      if (distance > 10) {
        const lineLen = distance * 0.08;
        const prevX = centerX + Math.cos(angle) * (distance - lineLen);
        const prevY = centerY + Math.sin(angle) * (distance - lineLen);
        
        const brightness = Math.min(255, Math.floor((distance / 700) * 255));
        ctx.strokeStyle = `rgba(${brightness}, ${Math.floor(brightness*0.95)}, 255, ${distance / 700})`;
        ctx.lineWidth = 1 + distance * 0.005;
        ctx.beginPath();
        ctx.moveTo(prevX, prevY);
        ctx.lineTo(x, y);
        ctx.stroke();
      }
    }
  },

  drawSunset: (ctx, time, width, height) => {
    // Static / slow moving Sunset Image
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, '#1a0b2e'); // Deep Purple
    grad.addColorStop(0.4, '#ff007f'); // Hot pink
    grad.addColorStop(0.7, '#ff5e36'); // Orange
    grad.addColorStop(1, '#ffeb3b'); // Yellow
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Grid lines on bottom half
    ctx.strokeStyle = 'rgba(0, 242, 254, 0.12)';
    ctx.lineWidth = 1;
    for (let y = height / 2; y < height; y += 20) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
    }
    
    // Draw neon pink vector grid sun
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.beginPath();
    ctx.arc(width/2, height/2 - 20, 60, 0, Math.PI * 2);
    ctx.fill();
  },

  drawCyberGrid: (ctx, time, width, height) => {
    // Premium dark cybertech background pattern
    ctx.fillStyle = '#0f111a';
    ctx.fillRect(0, 0, width, height);

    // Large glowing circular orbits
    ctx.strokeStyle = 'rgba(0, 242, 254, 0.05)';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(width/2, height/2, 200, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(width/2, height/2, 400, 0, Math.PI * 2); ctx.stroke();

    // Crossing cyber diagonal lines
    ctx.strokeStyle = 'rgba(255, 0, 127, 0.06)';
    ctx.lineWidth = 1;
    for (let i = -width; i < width * 2; i += 80) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i + height, height);
      ctx.stroke();
    }

    // Small neon markers
    ctx.fillStyle = '#00f2fe';
    ctx.fillRect(width * 0.2, height * 0.3, 4, 4);
    ctx.fillRect(width * 0.8, height * 0.3, 4, 4);
    ctx.fillRect(width * 0.5, height * 0.7, 4, 4);
  },

  drawAurora: (ctx, time, width, height) => {
    // Greenish blue cosmic northern lights
    ctx.fillStyle = '#05040a';
    ctx.fillRect(0, 0, width, height);

    // Render multiple layered color blobs with sin waves
    for (let k = 0; k < 3; k++) {
      const hue = 120 + k * 60; // Green to Cyan/Blue
      const baseOpacity = 0.06 - k * 0.01;
      
      ctx.beginPath();
      ctx.moveTo(0, height);
      
      for (let x = 0; x <= width; x += 10) {
        const offset = x * 0.005 + time * 0.15;
        const wave = Math.sin(offset) * 80 + Math.cos(offset * 2) * 40;
        const y = height * 0.4 + wave + k * 60;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(width, height);
      ctx.closePath();
      
      const aurGrad = ctx.createLinearGradient(0, height*0.2, 0, height);
      aurGrad.addColorStop(0, `hsla(${hue}, 80%, 50%, ${baseOpacity})`);
      aurGrad.addColorStop(0.5, `hsla(${hue + 30}, 80%, 40%, ${baseOpacity * 0.5})`);
      aurGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = aurGrad;
      ctx.fill();
    }
  }
};
