function elementPos(element: HTMLElement) : {x: number, y: number} {
  let x = 0, y = 0;
  while (element.offsetParent) {
    x += element.offsetLeft;
    y += element.offsetTop;
    element = <HTMLElement> element.offsetParent;
  }
  return { x, y };
}

function eventPos(event: MouseEvent) {
  return {
    x: event.clientX + document.body.scrollLeft + document.documentElement.scrollLeft,
    y: event.clientY + document.body.scrollTop + document.documentElement.scrollTop
  };
}

export function canvasMousePos(event: MouseEvent, canvas: HTMLCanvasElement) {
  var mousePos = eventPos(event);
  var canvasPos = elementPos(canvas);
  return {
    x: mousePos.x - canvasPos.x,
    y: mousePos.y - canvasPos.y
  };
}
