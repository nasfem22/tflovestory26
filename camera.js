document.addEventListener('DOMContentLoaded', () => {
  // CONFIGURATION
  const GOOGLE_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwkLtlfp_rE_DDYzUXP9Q6H2ODW0oPfSF5af7IxSgw2pJx5lTxaxfFjF-ZlLlMRBO4PVg/exec';
  const WEDDING_PASSCODE = 'TFLOVE2026';
  // UI Screen Nodes
  const screens = {
    passcode: document.getElementById('screen-passcode'),
    camera: document.getElementById('screen-camera'),
    uploading: document.getElementById('screen-uploading'),
    success: document.getElementById('screen-success')
  };
  // Node Bindings
  const passcodeForm = document.getElementById('passcode-form');
  const passcodeInput = document.getElementById('passcode-input');
  const passcodeError = document.getElementById('passcode-error');
  const videoElement = document.getElementById('camera-feed');
  const liveSideColumn = document.getElementById('live-side-column');
  const cameraFallback = document.getElementById('camera-fallback');
  const fallbackFileInput = document.getElementById('fallback-file-input');
  const btnShutter = document.getElementById('btn-shutter');
  const btnSwitchCamera = document.getElementById('btn-switch-camera');
  const btnTakeAnother = document.getElementById('btn-take-another');
  const progressBar = document.getElementById('upload-progress-bar');
  const captureCanvas = document.getElementById('capture-canvas');
  // Application State
  let currentToken = '';
  let localStream = null;
  let currentFacingMode = 'environment'; // Prefer rear camera on mobile
  let videoDevices = [];
  // Initialize Auth checks
  checkSecurityToken();
  async function checkSecurityToken() {
    const urlParams = new URLSearchParams(window.location.search);
    let token = urlParams.get('token') || sessionStorage.getItem('wedding_token');
    if (token && token.trim().toUpperCase() === WEDDING_PASSCODE) {
      currentToken = token.trim().toUpperCase();
      sessionStorage.setItem('wedding_token', currentToken);
      if (urlParams.has('token')) {
        window.history.replaceState({}, document.title, window.location.pathname);
      }
      initCameraStream();
    } else {
      showScreen('passcode');
    }
  }
  passcodeForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const code = passcodeInput.value.trim().toUpperCase();
    if (code === WEDDING_PASSCODE) {
      currentToken = code;
      sessionStorage.setItem('wedding_token', code);
      passcodeError.textContent = '';
      initCameraStream();
    } else {
      passcodeError.textContent = 'Invalid passcode. Please try again.';
      passcodeInput.value = '';
    }
  });
  async function initCameraStream() {
    showScreen('camera');
    try {
      await startCamera(currentFacingMode);
      // Enumerate AFTER stream starts — browser now has permission to see all cameras
      const devices = await navigator.mediaDevices.enumerateDevices();
      videoDevices = devices.filter(d => d.kind === 'videoinput');
      // Only hide switch button if there is truly only 1 camera
      if (videoDevices.length <= 1) {
        btnSwitchCamera.style.display = 'none';
      } else {
        btnSwitchCamera.style.display = 'flex';
      }
    } catch (e) {
      showFallbackUI();
    }
  }
  async function startCamera(facingMode) {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    try {
      localStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facingMode, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false
      });
      videoElement.srcObject = localStream;
      videoElement.style.display = 'block';
      liveSideColumn.style.display = 'flex';
      cameraFallback.classList.add('hidden');
    } catch (err) {
      try {
        localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        videoElement.srcObject = localStream;
        videoElement.style.display = 'block';
        liveSideColumn.style.display = 'flex';
        cameraFallback.classList.add('hidden');
      } catch (fallbackErr) {
        showFallbackUI();
      }
    }
  }
  function showFallbackUI() {
    videoElement.style.display = 'none';
    liveSideColumn.style.display = 'none';
    cameraFallback.classList.remove('hidden');
  }
  btnSwitchCamera.addEventListener('click', () => {
    currentFacingMode = currentFacingMode === 'environment' ? 'user' : 'environment';
    startCamera(currentFacingMode);
  });
  btnShutter.addEventListener('click', () => {
    if (!localStream) return;
    triggerFlash();
    capturePhotoAndStitch();
  });
  function triggerFlash() {
    const flash = document.createElement('div');
    flash.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:#FFF;z-index:9999;transition:opacity 0.2s ease;';
    document.body.appendChild(flash);
    flash.offsetHeight; // Reflow
    flash.style.opacity = '0';
    setTimeout(() => flash.remove(), 200);
  }
  function capturePhotoAndStitch() {
    const videoW = videoElement.videoWidth;
    const videoH = videoElement.videoHeight;
    if (videoW === 0 || videoH === 0) return;
    const sideColWidth = Math.floor(videoW * 0.12);
    const canvasW = videoW + sideColWidth;
    const canvasH = videoH;
    captureCanvas.width = canvasW;
    captureCanvas.height = canvasH;
    const ctx = captureCanvas.getContext('2d');
    // Draw main photo
    if (currentFacingMode === 'user') {
      ctx.save();
      ctx.translate(videoW, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(videoElement, 0, 0, videoW, videoH);
      ctx.restore();
    } else {
      ctx.drawImage(videoElement, 0, 0, videoW, videoH);
    }
    drawHashtagColumn(ctx, videoW, sideColWidth, canvasH);
    captureCanvas.toBlob((blob) => {
      if (blob) uploadPhoto(blob);
    }, 'image/jpeg', 0.90);
  }
  function drawHashtagColumn(ctx, xStart, width, height) {
    // 1. Burgundy Background
    ctx.fillStyle = '#3B0011';
    ctx.fillRect(xStart, 0, width, height);
    // 2. Gold Divider line
    const borderThickness = Math.max(2, Math.floor(height * 0.003));
    ctx.strokeStyle = '#B38728';
    ctx.lineWidth = borderThickness;
    ctx.beginPath();
    ctx.moveTo(xStart + borderThickness / 2, 0);
    ctx.lineTo(xStart + borderThickness / 2, height);
    ctx.stroke();
    // 3. Vertical text
    ctx.save();
    ctx.translate(xStart + width / 2, height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const textSpan = height * 0.35;
    const goldGrad = ctx.createLinearGradient(-textSpan, 0, textSpan, 0);
    goldGrad.addColorStop(0, '#BF953F');
    goldGrad.addColorStop(0.25, '#FCF6BA');
    goldGrad.addColorStop(0.5, '#B38728');
    goldGrad.addColorStop(0.75, '#FBF5B7');
    goldGrad.addColorStop(1, '#AA771C');
    const fontSize = Math.max(14, Math.floor(height * 0.045));
    ctx.font = `bold ${fontSize}px "Playfair Display", serif`;
    ctx.fillStyle = goldGrad;
    ctx.fillText('#TFLOVESTORY26', 0, 0);
    // Ornament stars
    ctx.fillStyle = '#FCF6BA';
    const offset = textSpan + fontSize * 1.5;
    ctx.font = `${Math.floor(fontSize * 0.8)}px sans-serif`;
    ctx.fillText('✦', -offset, 0);
    ctx.fillText('✦', offset, 0);
    ctx.restore();
  }
  // Fallback Upload Handling
  fallbackFileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const sideColWidth = Math.floor(img.width * 0.12);
        captureCanvas.width = img.width + sideColWidth;
        captureCanvas.height = img.height;
        const ctx = captureCanvas.getContext('2d');
        ctx.drawImage(img, 0, 0, img.width, img.height);
        drawHashtagColumn(ctx, img.width, sideColWidth, img.height);
        captureCanvas.toBlob((blob) => {
          if (blob) uploadPhoto(blob);
        }, 'image/jpeg', 0.90);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  });
  function uploadPhoto(blob) {
    showScreen('uploading');
    progressBar.style.width = '0%';
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onloadend = () => {
      const base64Data = reader.result.split(',')[1];
      
      const payload = {
        image: base64Data,
        filename: `TFLOVE_${Date.now()}.jpg`,
        token: currentToken
      };
      const xhr = new XMLHttpRequest();
      xhr.open('POST', GOOGLE_APPS_SCRIPT_URL, true);
      
      // CRITICAL: We use 'text/plain' to prevent browsers triggering CORS preflight OPTIONS pre-requests
      xhr.setRequestHeader('Content-Type', 'text/plain;charset=utf-8');
      // Mimic progress bar uploads
      let simulatedProgress = 0;
      const progressTimer = setInterval(() => {
        if (simulatedProgress < 90) {
          simulatedProgress += 10;
          progressBar.style.width = simulatedProgress + '%';
        }
      }, 150);
      xhr.onload = () => {
        clearInterval(progressTimer);
        progressBar.style.width = '100%';
        
        try {
          const response = JSON.parse(xhr.responseText);
          if (response.success) {
            showScreen('success');
            triggerConfetti();
          } else {
            alert('Upload failed: ' + response.error);
            showScreen('camera');
          }
        } catch (e) {
          if (xhr.status === 200) {
            showScreen('success');
            triggerConfetti();
          } else {
            alert('Upload error occurred.');
            showScreen('camera');
          }
        }
      };
      xhr.onerror = () => {
        clearInterval(progressTimer);
        alert('Connection error uploading photo.');
        showScreen('camera');
      };
      xhr.send(JSON.stringify(payload));
    };
  }
  function showScreen(screenId) {
    document.querySelectorAll('.app-screen').forEach(s => s.classList.remove('active'));
    screens[screenId].classList.add('active');
  }
  btnTakeAnother.addEventListener('click', () => {
    fallbackFileInput.value = '';
    showScreen('camera');
    if (!localStream) initCameraStream();
  });
  function triggerConfetti() {
    const container = document.createElement('div');
    container.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9999;overflow:hidden;';
    document.body.appendChild(container);
    const colors = ['#BF953F', '#FCF6BA', '#B38728', '#AA771C'];
    for (let i = 0; i < 70; i++) {
      const p = document.createElement('div');
      p.style.cssText = `position:absolute;width:${Math.random()*8+4}px;height:${Math.random()*8+4}px;background:${colors[Math.floor(Math.random()*colors.length)]};top:-10px;left:${Math.random()*100}vw;opacity:${Math.random()*0.6+0.4};`;
      container.appendChild(p);
      p.animate([
        { transform: 'translate3d(0, 0, 0) rotate(0deg)', opacity: 1 },
        { transform: `translate3d(${(Math.random()-0.5)*200}px, 100vh, 0) rotate(${Math.random()*720}deg)`, opacity: 0 }
      ], {
        duration: Math.random()*2000+1500,
        easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        fill: 'forwards'
      });
    }
    setTimeout(() => container.remove(), 3500);
  }
});
