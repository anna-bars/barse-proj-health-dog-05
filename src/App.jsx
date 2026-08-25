import { useState, useEffect, useRef } from 'react'
import { useRive, useStateMachineInput, Layout, Fit, Alignment } from '@rive-app/react-webgl2'
import dogRiv from './assets/health-dog.riv'

// Verified byte-for-byte in the .riv — Delivery #3. Mood States (Gentle
// Concern, Sleep, Sad) are now Booleans with ENTER → LOOP → RETURN
// animation, not one-shot triggers. 10 inputs total: 3 booleans + 7 triggers.
const STATE_MACHINE = 'Dog Controller'

const MOOD_STATES = [
  { name: 'isGentleConcern', label: 'Gentle Concern', icon: 'heart' },
  { name: 'isSleep', label: 'Sleep', icon: 'moon' },
  { name: 'isSad', label: 'Sad', icon: 'droplet' },
]
const MAIN_TRIGGERS = [
  { name: 'trg_happy', label: 'Happy', icon: 'sparkle' },
  { name: 'trg_celebrate', label: 'Celebrate', icon: 'star' },
  { name: 'trg_onboarding', label: 'Onboarding', icon: 'wave' },
]
const IDLE_VARIATIONS = [
  { name: 'trg_idle_b', label: 'Idle B', icon: 'shuffle' },
  { name: 'trg_idle_c', label: 'Idle C', icon: 'shuffle' },
]
const BLINK = [
  { name: 'trg_blink', label: 'Blink', icon: 'eye' },
  { name: 'trg_slow_blink', label: 'Slow Blink', icon: 'eyeHalf' },
]

export default function App() {
  const [currentState, setCurrentState] = useState('—')
  const [lastFired, setLastFired] = useState(null)
  const [blinkFeed, setBlinkFeed] = useState({ count: 0, lastAt: null })
  const currentStateRef = useRef('—')

  const { rive, RiveComponent } = useRive({
    src: dogRiv,
    stateMachines: STATE_MACHINE,
    autoplay: true,
    layout: new Layout({ fit: Fit.Contain, alignment: Alignment.Center }),
    onStateChange: (event) => {
      if (!event?.data?.length) return
      const name = event.data.join(', ')
      setCurrentState(name)
      currentStateRef.current = name
    },
  })

  const trg_happy = useStateMachineInput(rive, STATE_MACHINE, 'trg_happy')
  const trg_celebrate = useStateMachineInput(rive, STATE_MACHINE, 'trg_celebrate')
  const trg_onboarding = useStateMachineInput(rive, STATE_MACHINE, 'trg_onboarding')
  const isGentleConcern = useStateMachineInput(rive, STATE_MACHINE, 'isGentleConcern')
  const isSleep = useStateMachineInput(rive, STATE_MACHINE, 'isSleep')
  const isSad = useStateMachineInput(rive, STATE_MACHINE, 'isSad')
  const trg_idle_b = useStateMachineInput(rive, STATE_MACHINE, 'trg_idle_b')
  const trg_idle_c = useStateMachineInput(rive, STATE_MACHINE, 'trg_idle_c')
  const trg_blink = useStateMachineInput(rive, STATE_MACHINE, 'trg_blink')
  const trg_slow_blink = useStateMachineInput(rive, STATE_MACHINE, 'trg_slow_blink')

  const triggers = {
    trg_happy, trg_celebrate, trg_onboarding,
    trg_idle_b, trg_idle_c, trg_blink, trg_slow_blink,
  }
  const moodInputs = { isGentleConcern, isSleep, isSad }
  const [moodState, setMoodState] = useState({ isGentleConcern: false, isSleep: false, isSad: false })

  const fire = (name, label, icon) => {
    triggers[name]?.fire()
    setLastFired({ label, icon })
    if (name === 'trg_blink' || name === 'trg_slow_blink') {
      setBlinkFeed((f) => ({ count: f.count + 1, lastAt: Date.now() }))
    }
  }

  const toggleMood = (name, label, icon) => {
    const next = !moodState[name]
    setMoodState((m) => ({ ...m, [name]: next }))
    if (moodInputs[name]) moodInputs[name].value = next
    if (next) setLastFired({ label, icon })
  }

  useEffect(() => {
    if (!rive) return
    const resize = () => rive.resizeDrawingSurfaceToCanvas()
    resize()
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [rive])

  // Auto Blink — client's Animation Brief: "randomized blinks (3–6s)".
  // Suppressed while asleep (Sleepy / any state containing "Sleep").
  const blinkTimeout = useRef(null)
  useEffect(() => {
    if (!trg_blink) return
    const schedule = () => {
      const delay = 3000 + Math.random() * 3000
      blinkTimeout.current = setTimeout(() => {
        const asleep = currentStateRef.current.includes('Sleep')
        if (!asleep) {
          trg_blink.fire()
          setBlinkFeed((f) => ({ count: f.count + 1, lastAt: Date.now() }))
        }
        schedule()
      }, delay)
    }
    schedule()
    return () => clearTimeout(blinkTimeout.current)
  }, [trg_blink])

  return (
    <>
      <div className="bg-glow">
        <div className="glow-terracotta" />
        <div className="glow-sage" />
        <div className="glow-rose" />
      </div>

      {/* ================= HERO — LIVE DEMO ================= */}
      <div className="layout-wrap">
        <div className="layout">
          <div className="stage">
            <div className="canvas-wrap">
              <RiveComponent />
            </div>
          </div>

          <div className="panel">
            <div className="top-tag">
              <span className="pulse" />
              Live State Machine
              <span className="rebuild-pill">Rebuilt · single sitting pose</span>
            </div>
            <h1>Health Dog</h1>
            <p className="sub">
              The dog now lives entirely in one sitting pose — emotion comes
              through eyes, ears, head, tail and breathing, not a change of
              pose. Tap anything below to try it live.
            </p>

            <div className="mood-card">
              <div className={`mood-icon${lastFired ? '' : ' idle'}`}>
                <Icon name={lastFired?.icon ?? 'paw'} />
              </div>
              <div className="mood-text">
                <div className="mood-label">{lastFired ? lastFired.label : 'Idle A'}</div>
                <div className="mood-sub">now playing · {currentState}</div>
              </div>
            </div>

            <div className="group-label">
              Mood States <span className="mood-tag">boolean — stays on until set false</span>
            </div>
            <div className="mood-toggle-grid">
              {MOOD_STATES.map((m) => (
                <button
                  key={m.name}
                  className={`mood-toggle${moodState[m.name] ? ' active' : ''}`}
                  onClick={() => toggleMood(m.name, m.label, m.icon)}
                >
                  <span className="chip-icon"><Icon name={m.icon} /></span>
                  {m.label}
                  <span className="mood-toggle-switch" />
                </button>
              ))}
            </div>

            <TriggerGroup title="Main Triggers" colorVar="--terracotta" items={MAIN_TRIGGERS} onFire={fire} />
            <TriggerGroup title="Idle Variations" colorVar="--sage" items={IDLE_VARIATIONS} onFire={fire} />
            <TriggerGroup title="Blink" colorVar="--rose" items={BLINK} onFire={fire} />

            <a className="scroll-cue" href="#docs">
              <span>Integration docs</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
          </div>
        </div>
      </div>

      {/* ================= DOCUMENTATION ================= */}
      <div id="docs" className="docs">
        <DocsNav />

        <div className="docs-body">

          <DocSection id="overview" eyebrow="Overview" title="One pose, emotion through detail">
            <p>
              Health Dog runs on a single Rive <b>State Machine</b> — named{' '}
              <code>Dog Controller</code>. The rig lives entirely in one
              sitting pose. As of Delivery #3, the 3 mood states (Gentle
              Concern, Sleep, Sad) are <b>Booleans</b> your app turns on and
              off — everything else (Happy, Celebrate, Onboarding, the idle
              variations, and both blinks) is still a one-shot{' '}
              <b>Trigger</b>. 10 inputs total.
            </p>
            <div className="badge-row">
              <span className="badge">JavaScript</span>
              <span className="badge">React Native</span>
              <span className="badge">Rive Runtime</span>
            </div>
          </DocSection>

          <DocSection id="rebuild" eyebrow="Rebuild" title="Why the structure changed">
            <p>
              The previous version had three independent full-body poses —
              sit, stand, sleep — connected by hand-keyed transitions.
              That's gone. Emotion in this rig was never meant to change the
              dog's pose, only its eyes, ears, head, tail, and breathing —
              so the rebuild reflects that directly: one root pose, with
              emotion layered on top instead of swapped between separate
              states.
            </p>
            <div className="rebuild-diagram">
              <div className="rb-root">Sit Base<span>single root, always active</span></div>
              <div className="rb-branches">
                <div className="rb-branch"><Icon name="shuffle" />Idle Layer<span>A (default) / B / C, triggered variation</span></div>
                <div className="rb-branch"><Icon name="sparkle" />Mood States<span>Boolean, ENTER → LOOP → RETURN — Gentle Concern, Sleep, Sad</span></div>
                <div className="rb-branch"><Icon name="star" />Main Triggers<span>One-shot, auto-return — Happy, Celebrate, Onboarding</span></div>
              </div>
            </div>
            <p style={{ marginTop: 16 }}>
              As of Delivery #3, Gentle Concern, Sleep, and Sad are{' '}
              <b>Booleans</b>, not triggers — the app sets the condition{' '}
              <code>true</code>, the dog plays an ENTER transition into a
              looping state, and stays there until the app sets it back to{' '}
              <code>false</code>, which plays a RETURN transition back to
              Idle. The animation never exits on its own.
            </p>
          </DocSection>

          <DocSection id="polish" eyebrow="Latest Delivery" title="Happy animation reworked">
            <div className="update-grid">
              <div className="update-card added">
                <div className="update-card-title">In this delivery</div>
                <ul>
                  <li>Removed head size scaling entirely — no more grow/shrink pulsing.</li>
                  <li>Head now moves in a smooth up/down bounce (5 bounces per loop) instead of side to side.</li>
                  <li>Ears now have a subtle floppy side-to-side reaction that follows the head bounce, kept light so the head stays the main movement.</li>
                  <li>Tongue movement is clearly visible to show the excitement.</li>
                  <li>Added darker shading above the tongue / below the top of the mouth when it's fully open, so the open mouth reads clearly.</li>
                </ul>
              </div>
              <div className="update-card unchanged">
                <div className="update-card-title">Confirmed before delivery</div>
                <ul>
                  <li>Full preview done with everything together (head + ears + tongue) — the loop is seamless.</li>
                  <li>No trigger or state machine names changed — same 10 inputs, same <code>Dog Controller</code>.</li>
                </ul>
              </div>
            </div>
          </DocSection>

          <DocSection id="tongue" eyebrow="Tongue" title="Mood-dependent, not a state machine input">
            <p>
              The tongue isn't exposed as an input your app controls — it's
              handled inside the rig, tied to which mood/animation is
              currently playing. There's nothing to bind here; this section
              exists so it's clear the behavior is intentional, not missing.
            </p>
            <div className="tongue-grid">
              <div className="tongue-card hidden-card">
                <div className="tongue-card-title">Tongue hidden</div>
                <p>Gentle Concern · Sad · Sleep</p>
              </div>
              <div className="tongue-card visible-card">
                <div className="tongue-card-title">Tongue visible, pulsing</div>
                <p>Happy · Celebrate · Onboarding (happy portion) · Idle A / B / C</p>
              </div>
            </div>
            <p style={{ marginTop: 16 }}>
              Reference behavior: the tongue pulses in size (grows/shrinks,
              not a hard show/hide), the tip curls slightly on retraction,
              and it can fully hide for a beat before reappearing — loosely
              tied to the breathing rhythm. Where a clip's mouth shape
              itself changes (Happy, Celebrate, Sad), the tongue movement is
              baked directly into that clip rather than layered
              independently, to avoid conflicting with the mouth keyframes.
            </p>
          </DocSection>

          <DocSection id="inputs" eyebrow="Inputs" title="All 10 inputs, grouped as in the editor">
            <div className="group-block">
              <div className="group-block-title" style={{ '--gc': 'var(--terracotta)' }}>
                Mood States <span className="gbt-kind">Boolean</span>
              </div>
              <div className="inputs-grid">
                <InputCard icon="heart" name="isGentleConcern" desc="Set true when the app detects the user is struggling (frequent cravings, logged pouches). Set false when the condition clears." />
                <InputCard icon="moon" name="isSleep" desc="Set true for low companion health / nighttime. Set false when the condition clears." />
                <InputCard icon="droplet" name="isSad" desc="Set true on a setback/relapse event. Set false when the condition clears." />
              </div>
              <p style={{ marginTop: 14, marginBottom: 0 }}>
                Each follows ENTER → LOOP → RETURN. Your app owns turning
                these back off — the animation itself never exits on its
                own.
              </p>
            </div>
            <div className="group-block">
              <div className="group-block-title" style={{ '--gc': 'var(--terracotta)' }}>
                Main Triggers <span className="gbt-kind">Trigger</span>
              </div>
              <div className="inputs-grid">
                <InputCard icon="sparkle" name="trg_happy" desc="Positive feedback moment. Plays once, returns to sitting idle." />
                <InputCard icon="star" name="trg_celebrate" desc="Milestone / goal / reward screen. Plays once, more energetic than Happy, returns to idle." />
                <InputCard icon="wave" name="trg_onboarding" desc="First time meeting the companion. Plays once, then flows automatically into looping happy idle — no exit call needed." />
              </div>
            </div>
            <div className="group-block">
              <div className="group-block-title" style={{ '--gc': 'var(--sage)' }}>
                Idle Variations <span className="gbt-kind">Trigger</span>
              </div>
              <div className="inputs-grid">
                <InputCard icon="shuffle" name="trg_idle_b" desc="Switches to Idle B." />
                <InputCard icon="shuffle" name="trg_idle_c" desc="Switches to Idle C." />
              </div>
            </div>
            <div className="group-block">
              <div className="group-block-title" style={{ '--gc': 'var(--rose)' }}>
                Blink <span className="gbt-kind">Trigger</span>
              </div>
              <div className="inputs-grid">
                <InputCard icon="eye" name="trg_blink" desc="Standard blink — runs on its own parallel layer, independent of the main state." />
                <InputCard icon="eyeHalf" name="trg_slow_blink" desc="Slower, heavier blink — used more often during Sleep/Concern/Sad." />
              </div>
            </div>
          </DocSection>

          <DocSection id="js" eyebrow="JavaScript" title="JavaScript example">
            <CodeBlock code={JS_EXAMPLE} />
          </DocSection>

          <DocSection id="rn" eyebrow="React Native" title="React Native example">
            <CodeBlock code={RN_EXAMPLE} />
          </DocSection>

          <DocSection id="auto-blink" eyebrow="Automatic Blink" title="The one explicit timing requirement">
            <p>
              The Animation Brief specifies exactly one random-timing rule:{' '}
              <i>"randomized blinks (3–6s)."</i> Everything else is a
              judgment call, not a client spec.
            </p>
            <LiveFeed
              label="Live on the canvas above"
              count={blinkFeed.count}
              lastAt={blinkFeed.lastAt}
              noun="blink"
            />
            <CodeBlock code={AUTO_BLINK} />
          </DocSection>

          <DocSection id="best-practices" eyebrow="Best Practices" title="Style direction, in the client's own words">
            <ul className="check-list">
              <li>"Calm, soft, warm, expressive — never overly energetic/cartoonish."</li>
              <li>"Slow, soft easing, no sudden/snappy motion."</li>
              <li>"Emotion mainly through eyes/head/body language, not exaggerated movement."</li>
              <li>"Concern should be very subtle and empathetic, never disappointed or judgmental."</li>
              <li>Mood States are Booleans, not pulses — your app must set them back to false when the condition ends, or the dog stays in that mood forever.</li>
              <li>Don't set two Mood States true at once — the rig assumes only one is active at a time.</li>
              <li>Emotions ride on top of Idle — they don't replace the base pose, so don't treat them as separate "screens."</li>
            </ul>
          </DocSection>

          <DocSection id="checklist" eyebrow="Integration Checklist" title="Ship it">
            <ul className="check-list boxes">
              <li>Import the rebuilt <code>.riv</code> file</li>
              <li>Load <code>Dog Controller</code> (name unchanged)</li>
              <li>Wire the 3 Mood State booleans to their app conditions — and set them back to false</li>
              <li>Wire the 3 Main Triggers (Happy, Celebrate, Onboarding) to their app events</li>
              <li>Schedule <code>trg_blink</code> on a random 3–6s interval</li>
              <li>Remove any old code that fired <code>trg_concern</code> / <code>trg_sleepy</code> / <code>trg_sad</code> — those triggers no longer exist</li>
              <li>Done</li>
            </ul>
          </DocSection>

          <footer className="docs-footer">
            Health Dog · Dog Controller · Rive integration docs
          </footer>
        </div>
      </div>
    </>
  )
}

function TriggerGroup({ title, colorVar, items, onFire }) {
  return (
    <div className="trigger-group" style={{ '--group-color': `var(${colorVar})` }}>
      <div className="group-label">{title}</div>
      <div className="trigger-grid">
        {items.map((item) => (
          <button key={item.name} className="chip-btn" onClick={() => onFire(item.name, item.label, item.icon)}>
            <span className="chip-icon"><Icon name={item.icon} /></span>
            {item.label}
          </button>
        ))}
      </div>
    </div>
  )
}

function InputCard({ icon, name, desc }) {
  return (
    <div className="input-card">
      <div className="input-card-top">
        <span className="input-card-icon"><Icon name={icon} /></span>
        <div className="input-kind">Trigger</div>
      </div>
      <code>{name}</code>
      <p>{desc}</p>
    </div>
  )
}

function DocsNav() {
  const items = [
    ['overview', 'Overview'],
    ['rebuild', 'Rebuild'],
    ['polish', 'Latest Delivery'],
    ['tongue', 'Tongue'],
    ['inputs', 'Inputs'],
    ['js', 'JavaScript'],
    ['rn', 'React Native'],
    ['auto-blink', 'Auto Blink'],
    ['best-practices', 'Best Practices'],
    ['checklist', 'Checklist'],
  ]
  return (
    <nav className="docs-nav">
      {items.map(([id, label]) => (
        <a key={id} href={`#${id}`}>{label}</a>
      ))}
    </nav>
  )
}

function DocSection({ id, eyebrow, title, children }) {
  return (
    <section id={id} className="doc-section">
      <div className="doc-eyebrow">{eyebrow}</div>
      <h2>{title}</h2>
      {children}
    </section>
  )
}

function LiveFeed({ label, count, lastAt, noun }) {
  const [, forceTick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => forceTick((n) => n + 1), 1000)
    return () => clearInterval(id)
  }, [])
  const secondsAgo = lastAt ? Math.max(0, Math.round((Date.now() - lastAt) / 1000)) : null
  return (
    <div className="live-feed">
      <span className="live-feed-dot" />
      <span className="live-feed-label">{label}</span>
      <span className="live-feed-value">
        {count === 0 ? `waiting for first ${noun}…` : `${count} fired · last ${secondsAgo}s ago`}
      </span>
    </div>
  )
}

function CodeBlock({ code }) {
  return <pre className="code-block"><code>{code}</code></pre>
}

// Minimal line-icon set, single style (rounded stroke), used both in the
// live panel and in the docs so the two stay visually connected.
function Icon({ name }) {
  const common = { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' }
  switch (name) {
    case 'sparkle':
      return <svg {...common}><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M18 6l-2.5 2.5M8.5 15.5L6 18" /></svg>
    case 'star':
      return <svg {...common}><path d="M12 3l2.6 5.6 6.1.6-4.6 4.1 1.3 6-5.4-3.1-5.4 3.1 1.3-6-4.6-4.1 6.1-.6L12 3z" /></svg>
    case 'droplet':
      return <svg {...common}><path d="M12 3s6 7 6 11a6 6 0 1 1-12 0c0-4 6-11 6-11z" /></svg>
    case 'moon':
      return <svg {...common}><path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5z" /></svg>
    case 'heart':
      return <svg {...common}><path d="M12 20s-7-4.4-9.5-8.8C.8 8 2.3 4.8 5.6 4.2c2-.4 3.8.5 4.9 2.1 1.1-1.6 2.9-2.5 4.9-2.1 3.3.6 4.8 3.8 3.1 7C19 15.6 12 20 12 20z" /></svg>
    case 'wave':
      return <svg {...common}><path d="M4 15c2-4 4 3 6 0s4-8 6-3 4 0 4 0" /><circle cx="12" cy="7" r="2.4" /></svg>
    case 'shuffle':
      return <svg {...common}><path d="M4 7h3.5c3 0 4.5 10 7.5 10H19M4 17h3.5c1.4 0 2.4-2 3.2-4.2M16 4l3 3-3 3M16 14l3 3-3 3" /></svg>
    case 'eye':
      return <svg {...common}><path d="M2 12s4-6.5 10-6.5S22 12 22 12s-4 6.5-10 6.5S2 12 2 12z" /><circle cx="12" cy="12" r="2.6" /></svg>
    case 'eyeHalf':
      return <svg {...common}><path d="M2.5 13c3-2 6-3 9.5-3s6.5 1 9.5 3" /><path d="M6 15.5c2-1 4-1.6 6-1.6s4 .6 6 1.6" opacity=".55" /></svg>
    case 'paw':
    default:
      return <svg {...common}><circle cx="8" cy="8" r="1.6" /><circle cx="12" cy="6.2" r="1.6" /><circle cx="16" cy="8" r="1.6" /><path d="M12 12.5c-3.3 0-5.5 2-5.5 4.2 0 1.7 1.4 2.6 3 2.1 1-.3 1.7-1 2.5-1s1.5.7 2.5 1c1.6.5 3-.4 3-2.1 0-2.2-2.2-4.2-5.5-4.2z" /></svg>
  }
}

const JS_EXAMPLE = `import { Rive, Fit, Alignment, Layout } from '@rive-app/canvas'

const r = new Rive({
  src: 'health-dog.riv',
  canvas: document.getElementById('dog-canvas'),
  autoplay: true,
  stateMachines: 'Dog Controller',
  layout: new Layout({ fit: Fit.Contain, alignment: Alignment.Center }),
  onLoad: () => {
    const inputs = r.stateMachineInputs('Dog Controller')
    const happy = inputs.find(i => i.name === 'trg_happy')
    const isGentleConcern = inputs.find(i => i.name === 'isGentleConcern')

    happy.fire()                    // one-shot: correct answer
    isGentleConcern.value = true    // boolean: user is struggling
    // ...later, when the condition clears:
    // isGentleConcern.value = false
  },
})`

const RN_EXAMPLE = `import Rive from 'rive-react-native'

const SM = 'Dog Controller'

export function HealthDog() {
  const riveRef = useRef(null)
  const fire = (name) => riveRef.current?.fireState(SM, name)
  const setMood = (name, value) => riveRef.current?.setInputState(SM, name, value)

  const onGoalHit = () => fire('trg_celebrate')
  const onCravingLogged = () => setMood('isGentleConcern', true)
  const onCravingCleared = () => setMood('isGentleConcern', false)
  const onSetback = () => setMood('isSad', true)

  return (
    <Rive
      ref={riveRef}
      resourceName="health_dog"
      stateMachineName={SM}
      autoplay
      style={{ width: '100%', height: 320 }}
    />
  )
}`

const AUTO_BLINK = `function scheduleBlink(trg_blink, getCurrentState) {
  const next = 3000 + Math.random() * 3000 // 3–6s, per the Animation Brief
  setTimeout(() => {
    const asleep = getCurrentState().includes('Sleep')
    if (!asleep) trg_blink?.fire()
    scheduleBlink(trg_blink, getCurrentState)
  }, next)
}

scheduleBlink(trg_blink, getCurrentState)`
