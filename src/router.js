/**
 * Mini router for LWC – declarative routes, dynamic params, History API.
 * No page refresh; back/forward supported.
 */

const routes = [
  { path: '/', component: 'page-home' },
  { path: '/icons', component: 'page-icon-test' },
  { path: '/settings', component: 'page-settings' },
  { path: '/users/:id', component: 'page-user' },
];

const listeners = new Set();

function matchRoute(path) {
  for (const route of routes) {
    const keys = [];
    const pattern = route.path.replace(/:([^/]+)/g, (_, key) => {
      keys.push(key);
      return '([^/]+)';
    });

    const regex = new RegExp(`^${pattern}$`);
    const match = path.match(regex);

    if (match) {
      const params = {};
      keys.forEach((k, i) => (params[k] = match[i + 1]));

      return { ...route, params };
    }
  }

  return null;
}

function notify() {
  const route = matchRoute(window.location.pathname);
  listeners.forEach((cb) => cb(route));
}

export function navigate(path) {
  history.pushState({}, '', path);
  notify();
}

export function getCurrentRoute() {
  return matchRoute(window.location.pathname);
}

export function subscribe(callback) {
  listeners.add(callback);
  callback(matchRoute(window.location.pathname));

  return () => listeners.delete(callback);
}

window.addEventListener('popstate', notify);
