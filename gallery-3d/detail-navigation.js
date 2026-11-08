if (window.parent !== window) {
  document.addEventListener('click', event => {
    const link=event.target.closest('a');
    if(link && new URL(link.href).origin===location.origin && new URL(link.href).pathname.endsWith('/index.html')) {
      event.preventDefault(); window.parent.postMessage('close-gallery-panel',location.origin);
    }
  });
  document.addEventListener('keydown',event => {
    if(event.key==='Escape' && !document.querySelector('dialog[open]')) window.parent.postMessage('close-gallery-panel',location.origin);
  });
}
