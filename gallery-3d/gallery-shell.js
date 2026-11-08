let galleryModule;
const button = document.getElementById('enter-btn');
button.addEventListener('click', async () => {
  button.disabled=true;
  const status = document.getElementById('gallery-status');
  status.hidden=false;
  status.textContent='Preparing the gallery…';
  try {
    galleryModule ||= await import('./gallery.js');
    galleryModule.enterGallery();
    status.textContent='';
    status.hidden=true;
  } catch(error) {
    console.error('Gallery unavailable',error);
    document.getElementById('gallery-status').textContent='The 3D gallery could not load on this device. You can still explore Bines Academy and Acne Camz through the project cards.';
  } finally { button.disabled=false; }
});
