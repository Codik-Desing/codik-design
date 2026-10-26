// Embedded previews keep the site usable and return model selections to Codik.
if (new URLSearchParams(location.search).has('preview')) {
  document.querySelector('.demo-dock')?.remove();
  document.querySelectorAll('a[href^="../../"]').forEach((a) => { a.target = '_top'; });
}
