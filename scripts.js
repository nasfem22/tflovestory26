document.addEventListener('DOMContentLoaded', () => {
    // 1. Audio & Curtain State
    const bgMusic = document.getElementById('bgMusic');
    const audioToggle = document.getElementById('audioToggle');
    const curtainOverlay = document.getElementById('curtainOverlay');
    const curtainTrigger = document.getElementById('curtainTrigger');
    const curtainText = document.getElementById('curtainText');
    let isPlaying = false;

    // 2. The "First Look" Guard (1MB Cap for <2s Wait)
    // We only wait for the Hero and the Main Highlight. 
    // This ensures the first 2 sections are perfect instantly.
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
                curtainText.innerHTML = 'View Timi & Femi';
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

    // 3. Curtain Logic (Instant Reveal)
    if(curtainTrigger) {
        curtainTrigger.addEventListener('click', () => {
            document.body.classList.add('opened');
            if(bgMusic) {
                bgMusic.volume = 0.4;
                setTimeout(() => {
                    bgMusic.play().then(() => { isPlaying = true; }).catch(e => console.log('Audio blocked', e));
                }, 3000); 
            }
            setTimeout(() => { document.body.style.overflowY = 'auto'; }, 1000);
        });
    }

    // 4. Audio Control
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

    // 5. RSVP Logic
    const rsvpForm = document.getElementById('rsvpForm');
    const GOOGLE_SCRIPT_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbz1lY8ymC4ggdw2Qdrk49FUlOfKJXDHlW7h4I2xyJLV7OgM0dkcT2FW7FtUAvBRGCT5/exec";

    if(rsvpForm) {
        rsvpForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const btn = this.querySelector('button');
            btn.innerHTML = 'Sending...';
            btn.disabled = true;

            const params = new URLSearchParams(new FormData(this));
            fetch(GOOGLE_SCRIPT_WEB_APP_URL, { method: 'POST', mode: 'no-cors', body: params })
            .then(() => {
                confetti({
                    particleCount: 150,
                    spread: 70,
                    origin: { y: 0.6 },
                    colors: ['#D4AF37', '#FFF2CD', '#AA7C11']
                });
                this.innerHTML = '<div class="success-message" style="color: var(--gold); padding: 20px; font-family: var(--font-serif); text-align:center;"><h3>Thank You!</h3><p>Your RSVP has been received.</p></div>';
            }).catch(() => {
                btn.innerHTML = 'Error. Try Again';
                btn.disabled = false;
            });
        });
    }

    // 6. Scratch Cards
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

    // 7. Animations & Smooth Scroll
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

    // 8. Lucide Icons
    const checkLucide = setInterval(() => {
        if (window.lucide) { lucide.createIcons(); clearInterval(checkLucide); }
    }, 100);
});
