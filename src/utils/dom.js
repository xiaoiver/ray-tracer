function elementPos(element) {
  var x = 0, y = 0;
  while(element.offsetParent) {
    x += element.offsetLeft;
    y += element.offsetTop;
    element = element.offsetParent;
  }
  return { x: x, y: y };
}

function eventPos(event) {
  return {
    x: event.clientX + document.body.scrollLeft + document.documentElement.scrollLeft,
    y: event.clientY + document.body.scrollTop + document.documentElement.scrollTop
  };
}

export function canvasMousePos(event, canvas) {
  var mousePos = eventPos(event);
  var canvasPos = elementPos(canvas);
  return {
    x: mousePos.x - canvasPos.x,
    y: mousePos.y - canvasPos.y
  };
}

export function resizeCanvas(canvas) {
  // https://webglfundamentals.org/webgl/lessons/webgl-resizing-the-canvas.html
  const realToCSSPixels = window.devicePixelRatio;
  const displayWidth  = Math.floor(canvas.clientWidth  * realToCSSPixels);
  const displayHeight = Math.floor(canvas.clientHeight * realToCSSPixels);

  // Check if the canvas is not the same size.
  if (canvas.width !== displayWidth ||
    canvas.height !== displayHeight) {

    // Make the canvas the same size
    canvas.width  = displayWidth;
    canvas.height = displayHeight;
  }

  return {displayWidth, displayHeight};
}