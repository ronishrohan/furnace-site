// Furnace — WebGL normal-mapped background ("metal plate")
// Lighting is driven by the mouse; normal map applied with cover fit.

(function () {
  const canvas = document.getElementById('canvas');
  const logo = document.getElementById('logo');
  const themeToggle = document.getElementById('theme-toggle');

  // ============================================================
  // Theme toggle (day / night)
  // ============================================================

  const THEME_KEY = 'furnace-theme';
  let isNight = true;
  try { isNight = localStorage.getItem(THEME_KEY) !== 'day'; } catch {}

  function applyTheme() {
    document.documentElement.classList.toggle('theme-night', isNight);
    document.body.classList.toggle('theme-night', isNight);
    if (themeToggle) {
      const span = themeToggle.querySelector('.value');
      if (span) span.textContent = isNight ? 'DAY' : 'NIGHT';
    }
  }

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      isNight = !isNight;
      try { localStorage.setItem(THEME_KEY, isNight ? 'night' : 'day'); } catch {}
      applyTheme();
    });
  }

  applyTheme();

  // Logo visible immediately
  if (logo) logo.style.opacity = '';
  document.body.classList.add('loaded');

  // ============================================================
  // WebGL setup
  // ============================================================

  const gl = canvas.getContext('webgl', { antialias: false, alpha: false });
  if (!gl) return;

  const VERT = `
    attribute vec2 aPos;
    void main() {
      gl_Position = vec4(aPos, 0.0, 1.0);
    }
  `;

  const FRAG = `
    precision highp float;

    uniform vec2  uResolution;   // canvas size in physical px
    uniform vec2  uTexSize;      // normal map size in px
    uniform vec2  uMouse;        // mouse in physical px, y-up
    uniform float uTime;
    uniform float uNight;        // 1.0 night, 0.0 day
    uniform float uNoiseScale;   // finer grain on low-DPI displays
    uniform float uLightFade;    // 0 → 1 light intensity fade-in on load
    uniform sampler2D uNormalMap;

    // Film grain from earendil-works/waves (martins upitis's film grain)
    #define GRAIN_INTENSITY_DAY 0.5
    #define GRAIN_INTENSITY_NIGHT 0.09
    #define GRAIN_SPEED 1.5
    #define GRAIN_MEAN 0.0
    #define GRAIN_VARIANCE_DAY 0.75
    #define GRAIN_VARIANCE_NIGHT 0.6

    float gaussian(float z, float u, float o) {
      return (1.0 / (o * sqrt(2.0 * 3.1415))) * exp(-(((z - u) * (z - u)) / (2.0 * (o * o))));
    }

    void main() {
      // --- Cover-fit UV: scale the texture like background-size: cover ---
      float canvasAspect = uResolution.x / uResolution.y;
      float texAspect = uTexSize.x / uTexSize.y;
      vec2 uv = gl_FragCoord.xy / uResolution;
      uv.y = 1.0 - uv.y; // texture is y-down
      if (canvasAspect > texAspect) {
        // canvas wider: fit width, crop height
        float scale = texAspect / canvasAspect;
        uv.y = (uv.y - 0.5) * scale + 0.5;
      } else {
        // canvas taller: fit height, crop width
        float scale = canvasAspect / texAspect;
        uv.x = (uv.x - 0.5) * scale + 0.5;
      }

      // --- Decode normal (tangent space, y flipped back for screen space) ---
      vec3 n = texture2D(uNormalMap, uv).rgb * 2.0 - 1.0;
      n.y = -n.y;
      n = normalize(n);

      // --- Point light at mouse position ---
      vec3 fragPos = vec3(gl_FragCoord.xy, 0.0);
      float lightHeight = uResolution.y * 0.35;
      vec3 lightPos = vec3(uMouse, lightHeight);
      vec3 L = lightPos - fragPos;
      float dist3D = length(L);
      L = normalize(L);

      // Diffuse from normal map
      float diff = max(dot(n, L), 0.0);

      // Radial falloff: visible circle of light centered at cursor
      float screenDist = length(L.xy) / uResolution.y;
      float radius = 0.45;
      float falloff = 1.0 - smoothstep(0.0, radius, screenDist);
      falloff = falloff * falloff; // quadratic for softer edge

      // --- Matte concrete palette per theme ---
      vec3 baseNight  = vec3(0.080, 0.080, 0.083);
      vec3 lightNight = vec3(0.357, 0.553, 0.937);  // blue accent #5B8DEF
      vec3 baseDay    = vec3(0.50, 0.50, 0.47);
      vec3 lightDay   = vec3(1.0, 1.0, 1.0);         // uncolored white in day mode

      vec3 base = mix(baseDay,  baseNight,  uNight);
      vec3 lcol = mix(lightDay, lightNight, uNight);

      // Base surface + point light contribution (faded in on load)
      float lightIntensity = mix(0.15, 0.3, uNight) * uLightFade;
      vec3 color = base + lcol * diff * falloff * lightIntensity;

      // --- Animated film grain (earendil waves) ---
      float gray = dot(color, vec3(0.299, 0.587, 0.114));
      float t = uTime * GRAIN_SPEED;
      vec2 guv = gl_FragCoord.xy * uNoiseScale / uResolution;
      float seed = dot(guv, vec2(12.9898, 78.233));
      float noise = fract(sin(seed) * 43758.5453 + t);
      float variance = mix(GRAIN_VARIANCE_DAY, GRAIN_VARIANCE_NIGHT, uNight);
      noise = gaussian(noise, GRAIN_MEAN, variance * variance);

      // Addition blend, weighted toward dark areas
      float grainIntensity = mix(GRAIN_INTENSITY_DAY, GRAIN_INTENSITY_NIGHT, uNight);
      color += vec3(noise) * (1.0 - gray) * grainIntensity;
      color = clamp(color, 0.0, 1.0);

      gl_FragColor = vec4(color, 1.0);
    }
  `;

  function compile(type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.error(gl.getShaderInfoLog(s));
      return null;
    }
    return s;
  }

  const prog = gl.createProgram();
  gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
  gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    console.error(gl.getProgramInfoLog(prog));
    return;
  }
  gl.useProgram(prog);

  // Full-screen triangle strip
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const aPos = gl.getAttribLocation(prog, 'aPos');
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  const uni = {
    resolution: gl.getUniformLocation(prog, 'uResolution'),
    texSize: gl.getUniformLocation(prog, 'uTexSize'),
    mouse: gl.getUniformLocation(prog, 'uMouse'),
    time: gl.getUniformLocation(prog, 'uTime'),
    night: gl.getUniformLocation(prog, 'uNight'),
    noiseScale: gl.getUniformLocation(prog, 'uNoiseScale'),
    lightFade: gl.getUniformLocation(prog, 'uLightFade'),
    normalMap: gl.getUniformLocation(prog, 'uNormalMap'),
  };

  // ============================================================
  // Normal map texture
  // ============================================================

  let texW = 1, texH = 1;
  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  // Flat-normal placeholder until the image loads
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, 1, 1, 0, gl.RGB, gl.UNSIGNED_BYTE, new Uint8Array([128, 128, 255]));
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

  const img = new Image();
  img.onload = () => {
    texW = img.width;
    texH = img.height;
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);
  };
  img.src = '/normal-map.png';

  gl.activeTexture(gl.TEXTURE0);
  gl.uniform1i(uni.normalMap, 0);

  // ============================================================
  // Sizing, mouse, render loop
  // ============================================================

  let W = 0, H = 0, dpr = 1;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = canvas.width = Math.floor(window.innerWidth * dpr);
    H = canvas.height = Math.floor(window.innerHeight * dpr);
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
    gl.viewport(0, 0, W, H);
  }

  resize();
  window.addEventListener('resize', resize, { passive: true });

  // Mouse target + smoothed position (in physical px, y-up for GL)
  let targetX = window.innerWidth / 2, targetY = window.innerHeight / 2;
  let mouseX = targetX, mouseY = targetY;

  window.addEventListener('pointermove', (e) => {
    targetX = e.clientX;
    targetY = e.clientY;
  }, { passive: true });

  const start = performance.now();
  const FADE_DURATION = 500; // 0.5 seconds

  function draw() {
    // Ease the light toward the pointer
    mouseX += (targetX - mouseX) * 0.08;
    mouseY += (targetY - mouseY) * 0.08;

    // Light intensity fade-in: 0 → 1 over FADE_DURATION
    const elapsed = performance.now() - start;
    const lightFade = Math.min(elapsed / FADE_DURATION, 1);

    gl.uniform2f(uni.resolution, W, H);
    gl.uniform2f(uni.texSize, texW, texH);
    gl.uniform2f(uni.mouse, mouseX * dpr, H - mouseY * dpr);
    gl.uniform1f(uni.time, elapsed / 1000);
    gl.uniform1f(uni.night, isNight ? 1 : 0);
    gl.uniform1f(uni.noiseScale, dpr < 1.5 ? 3.0 : 2.0);
    gl.uniform1f(uni.lightFade, lightFade);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    requestAnimationFrame(draw);
  }

  draw();
})();
