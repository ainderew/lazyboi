async function attachNav() {
  const body = document.querySelector('body');

  const fetchedNav = await fetch('/partials/nav/nav.html');
  const navHtml = await fetchedNav.text();

  const navContainer = document.createElement('div');
  navContainer.className = 'nav-container';
  navContainer.innerHTML = navHtml;

  body.prepend(navContainer);

  const head = document.querySelector('head');
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = '/partials/nav/nav.css';

  head.appendChild(link);
}

function determinAttachNav() {
  const completePath = window.location.pathname;
  const currPath = completePath.split('/')[1] || 'home';

  const navItem = document.querySelector(`.${currPath}`);
  navItem.classList.add('active');

  console.log('current path', currPath);
}

(async function initNav() {
  await attachNav();
  determinAttachNav();
})();
