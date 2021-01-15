function contentLoaded() {
  document.body.removeAttribute('class');
}

if (document.readyState === 'complete') {
  contentLoaded();
} else {
  document.addEventListener('DOMContentLoaded', contentLoaded);
}
