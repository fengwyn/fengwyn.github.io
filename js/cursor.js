const cursor = document.getElementById('space-cursor');
document.addEventListener('mousemove', (e) => {
  cursor.style.left = e.clientX + 'px';
  cursor.style.top = e.clientY + 'px';
});
document.addEventListener('mousedown', () => {
  cursor.classList.add('clicking');
});
document.addEventListener('mouseup', () => {
  cursor.classList.remove('clicking');
});
