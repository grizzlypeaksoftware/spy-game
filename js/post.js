// Screen-space finishing: the scene is drawn to an off-screen buffer, bright areas
// are blurred into a soft glow, and the result is put on screen with a slight
// vignette and fine grain. If the browser cannot render to a float buffer the game
// draws straight to the screen as before.
import * as THREE from 'three';

const VERT = /* glsl */`
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
`;

// Keep only what is brighter than the threshold, with a soft knee.
const BRIGHT = /* glsl */`
  uniform sampler2D tMap;
  uniform float threshold;
  varying vec2 vUv;
  void main() {
    vec3 c = min(texture2D(tMap, vUv).rgb, vec3(4.0));
    float l = max(c.r, max(c.g, c.b));
    float k = smoothstep(threshold, threshold + 0.5, l);
    gl_FragColor = vec4(c * k, 1.0);
  }
`;

const BLUR = /* glsl */`
  uniform sampler2D tMap;
  uniform vec2 dir;
  varying vec2 vUv;
  void main() {
    vec3 c = texture2D(tMap, vUv).rgb * 0.227;
    c += (texture2D(tMap, vUv + dir * 1.385).rgb + texture2D(tMap, vUv - dir * 1.385).rgb) * 0.316;
    c += (texture2D(tMap, vUv + dir * 3.231).rgb + texture2D(tMap, vUv - dir * 3.231).rgb) * 0.0703;
    gl_FragColor = vec4(c, 1.0);
  }
`;

const FINAL = /* glsl */`
  uniform sampler2D tMap;
  uniform sampler2D tGlow;
  uniform float glow;
  uniform float time;
  varying vec2 vUv;
  float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
  void main() {
    vec3 c = texture2D(tMap, vUv).rgb + texture2D(tGlow, vUv).rgb * glow;
    vec2 q = vUv - 0.5;
    c *= 1.0 - dot(q, q) * 0.55;
    gl_FragColor = vec4(c, 1.0);
    #include <colorspace_fragment>
    // Grain after encoding also hides banding in the dark gradients.
    float n = hash(gl_FragCoord.xy + fract(time) * 61.0) - 0.5;
    gl_FragColor.rgb += n * 0.022;
  }
`;

export class Post {
  constructor(renderer) {
    this.renderer = renderer;
    this.ok = renderer.capabilities.isWebGL2 && renderer.extensions.has('EXT_color_buffer_float');
    if (!this.ok) return;

    const opts = { type: THREE.HalfFloatType, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, depthBuffer: false };
    this.main = new THREE.WebGLRenderTarget(4, 4, { ...opts, depthBuffer: true, samples: 4 });
    this.a = new THREE.WebGLRenderTarget(2, 2, opts);
    this.b = new THREE.WebGLRenderTarget(2, 2, opts);

    const mat = (fragmentShader, uniforms) => new THREE.ShaderMaterial({
      vertexShader: VERT, fragmentShader, uniforms, depthTest: false, depthWrite: false,
    });
    this.bright = mat(BRIGHT, { tMap: { value: this.main.texture }, threshold: { value: 0.82 } });
    this.blur = mat(BLUR, { tMap: { value: null }, dir: { value: new THREE.Vector2() } });
    this.final = mat(FINAL, {
      tMap: { value: this.main.texture }, tGlow: { value: this.a.texture }, glow: { value: 0.55 }, time: { value: 0 },
    });

    this.cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.bright);
    this.quad.frustumCulled = false;
  }

  setSize(w, h) {
    if (!this.ok) return;
    this.main.setSize(w, h);
    const gw = Math.max(2, Math.round(w / 2)), gh = Math.max(2, Math.round(h / 2));
    this.a.setSize(gw, gh);
    this.b.setSize(gw, gh);
    this.texel = [1 / gw, 1 / gh];
  }

  /** Point the renderer at the off-screen buffer. Call before drawing the scene. */
  begin() {
    this.renderer.setRenderTarget(this.ok ? this.main : null);
    this.renderer.clear();
  }

  pass(material, target) {
    this.quad.material = material;
    this.renderer.setRenderTarget(target);
    this.renderer.render(this.quad, this.cam);
  }

  /** Blur the highlights and put the finished frame on screen. */
  end(time) {
    if (!this.ok) return;
    this.pass(this.bright, this.a);
    // Two rounds, the second wider, for a glow with a tight core and a soft edge.
    for (const spread of [1, 2.2]) {
      this.blur.uniforms.tMap.value = this.a.texture;
      this.blur.uniforms.dir.value.set(this.texel[0] * spread, 0);
      this.pass(this.blur, this.b);
      this.blur.uniforms.tMap.value = this.b.texture;
      this.blur.uniforms.dir.value.set(0, this.texel[1] * spread);
      this.pass(this.blur, this.a);
    }
    this.final.uniforms.time.value = time;
    this.pass(this.final, null);
  }
}
