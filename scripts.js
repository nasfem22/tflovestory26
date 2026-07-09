document.addEventListener('DOMContentLoaded', () => {
    // 1. Audio & Curtain State
    const bgMusic = document.getElementById('bgMusic');
    const audioToggle = document.getElementById('audioToggle');
    const curtainOverlay = document.getElementById('curtainOverlay');
    const curtainTrigger = document.getElementById('curtainTrigger');
    const curtainText = document.getElementById('curtainText');
    let isPlaying = false;
    let wasPlayingBeforeHidden = false;

    // 2. Smart Audio Control
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            if (isPlaying) { bgMusic.pause(); wasPlayingBeforeHidden = true; }
        } else {
            if (wasPlayingBeforeHidden) { bgMusic.play(); wasPlayingBeforeHidden = false; }
        }
    });

    // 3. The "First Look" Guard
    const criticalImages = ['hero.webp', 'highlight.webp'];
    let loadedCount = 0;
    let isReady = false;

    const checkReady = () => {
        if (isReady) return;
        loadedCount++;
        if (loadedCount >= criticalImages.length) {
            isReady = true;
            if(curtainTrigger) {
                curtainTrigger.style.opacity = '1';
                curtainTrigger.style.pointerEvents = 'auto';
                curtainText.innerHTML = 'Unveil the Love Story';
                curtainTrigger.classList.add('ready-glow');
            }
        }
    };

    criticalImages.forEach(src => {
        const img = new Image();
        img.src = src;
        if (img.complete) checkReady();
        else { img.onload = checkReady; img.onerror = checkReady; }
    });

    // 4. Curtain Logic
    if(curtainTrigger) {
        curtainTrigger.addEventListener('click', () => {
            document.body.classList.add('opened');
            if(bgMusic) {
                bgMusic.volume = 0.5;
                bgMusic.play().then(() => { isPlaying = true; }).catch(e => console.log('Audio blocked', e));
            }
            setTimeout(() => { document.body.style.overflowY = 'auto'; }, 1000);
        });
    }

    // 5. Audio Toggle
    if(audioToggle && bgMusic) {
        audioToggle.addEventListener('click', () => {
            if(isPlaying) {
                bgMusic.pause();
                audioToggle.innerHTML = '<i data-lucide="volume-x"></i>';
            } else {
                bgMusic.play();
                audioToggle.innerHTML = '<i data-lucide="volume-2"></i>';
            }
            isPlaying = !isPlaying;
            if(window.lucide) lucide.createIcons();
        });
    }

    // 6. GUEST VERIFICATION LOGIC (Royal Registry)
    const rsvpForm = document.getElementById('rsvpForm');
    const rsvpMessage = document.getElementById('rsvpMessage');
    const GOOGLE_SCRIPT_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbz1lY8ymC4ggdw2Qdrk49FUlOfKJXDHlW7h4I2xyJLV7OgM0dkcT2FW7FtUAvBRGCT5/exec";

    if(rsvpForm) {
        rsvpForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const btn = this.querySelector('button');
            const guestName = this.querySelector('input[name="name"]').value.trim();
            
            btn.innerHTML = 'Verifying Registry...';
            btn.disabled = true;

            // We use GET for the lookup
            fetch(`${GOOGLE_SCRIPT_WEB_APP_URL}?action=check&name=${encodeURIComponent(guestName)}`)
            .then(res => res.json())
            .then(data => {
                if(data.found) {
                    confetti({
                        particleCount: 150,
                        spread: 70,
                        origin: { y: 0.6 },
                        colors: ['#D4AF37', '#FFF2CD', '#AA7C11']
                    });
                    this.style.display = 'none';
                    rsvpMessage.style.display = 'block';
                    rsvpMessage.innerHTML = `
                        <div class="vip-card-success">
                            <h3 class="gold-glow-text">You're on the list!</h3>
                            <p class="success-subtext">Welcome, <strong>${data.name}</strong>. We can't wait to celebrate with you!</p>
                        </div>
                    `;
                } else {
                    btn.innerHTML = 'Name Not Found. Try Again?';
                    btn.disabled = false;
                    alert("We couldn't find your name on the Registry. Please double-check your spelling or contact the couple.");
                }
            }).catch(() => {
                btn.innerHTML = 'Error. Try Again';
                btn.disabled = false;
            });
        });
    }

    // 7. Scratch Cards
    const canvases = document.querySelectorAll('.scratchCanvas');
    canvases.forEach(canvas => {
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        const drawGold = () => {
            canvas.width = canvas.parentElement.offsetWidth;
            canvas.height = canvas.parentElement.offsetHeight;
            const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
            gradient.addColorStop(0, '#FFEAA7'); gradient.addColorStop(0.5, '#FFF2CD'); gradient.addColorStop(1, '#AA7C11');
            ctx.fillStyle = gradient; ctx.fillRect(0,0, canvas.width, canvas.height);
        };
        drawGold();

        let isDrawing = false;
        const scratch = (e) => {
            if(!isDrawing) return;
            const rect = canvas.getBoundingClientRect();
            const x = ( (e.clientX || e.touches[0].clientX) - rect.left) * (canvas.width / rect.width);
            const y = ( (e.clientY || e.touches[0].clientY) - rect.top) * (canvas.height / rect.height);
            ctx.globalCompositeOperation = 'destination-out';
            ctx.beginPath(); ctx.arc(x, y, 25, 0, Math.PI * 2); ctx.fill();
        };

        canvas.addEventListener('mousedown', () => isDrawing = true);
        canvas.addEventListener('touchstart', (e) => { isDrawing = true; scratch(e); }, {passive:false});
        window.addEventListener('mousemove', scratch);
        window.addEventListener('touchmove', scratch, {passive:false});
        window.addEventListener('mouseup', () => isDrawing = false);
        window.addEventListener('touchend', () => isDrawing = false);
    });

    // 8. Animations
    if(window.gsap) {
        gsap.registerPlugin(ScrollTrigger);
        gsap.utils.toArray('.highlight-image-wrapper, .arch-frame, .details-card-elegant, .finale-image-wrapper, .qr-code-box').forEach((item) => {
            gsap.fromTo(item, { opacity: 0, y: 50 }, { opacity: 1, y: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: item, start: 'top 85%' } });
        });
    }

    if(window.Lenis) {
        const lenis = new Lenis({ duration: 1.2, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)) });
        lenis.on('scroll', ScrollTrigger.update);
        gsap.ticker.add((time) => { lenis.raf(time * 1000); });
        gsap.ticker.lagSmoothing(0);
    }

    // 9. Lucide
    const checkLucide = setInterval(() => {
        if (window.lucide) { lucide.createIcons(); clearInterval(checkLucide); }
    }, 100);

    // 10. Dynamic QR Code for Camera
    const qrImage = document.querySelector('.qr-image');
    if (qrImage) {
        const baseUrl = window.location.href.split('?')[0].split('#')[0];
        // Replace index.html with camera.html or append /camera.html
        const cameraUrl = baseUrl.endsWith('index.html') ? baseUrl.replace('index.html', 'camera.html') : (baseUrl.endsWith('/') ? baseUrl + 'camera.html' : baseUrl + '/camera.html');
        qrImage.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(cameraUrl)}`;
    }
});
