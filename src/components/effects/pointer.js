const position = { x: null, y: null }
let subscribers = 0

function onPointerMove(event) {
  position.x = event.clientX
  position.y = event.clientY
}

export function getPointerPosition() {
  return position
}

export function retainGlobalPointer() {
  subscribers += 1
  if (subscribers === 1) {
    window.addEventListener('pointermove', onPointerMove, { passive: true })
  }

  let retained = true
  return () => {
    if (!retained) return
    retained = false
    subscribers -= 1
    if (subscribers === 0) {
      window.removeEventListener('pointermove', onPointerMove)
      position.x = null
      position.y = null
    }
  }
}
