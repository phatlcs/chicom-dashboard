/*
  Loader for expert insights. Source of truth is expert_insights.json —
  edit that file when you need to tweak numbers, findings, or
  recommendations. This loader does a synchronous XHR so
  window.ExpertInsights is populated before React mounts.

  Sync XHR triggers a deprecation warning in the console; it's benign
  here because this dashboard is always served locally (or from Vercel)
  and the JSON file is small (~50 KB). If the warning starts mattering,
  switch to fetch() + delay ReactDOM.createRoot().render() in app.jsx.
*/
(function loadExpertInsights() {
  try {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', 'expert_insights.json', false); // sync
    xhr.send();
    if (xhr.status >= 200 && xhr.status < 300) {
      window.ExpertInsights = JSON.parse(xhr.responseText);
    } else {
      console.warn('[expert_insights] HTTP ' + xhr.status + ' — panel will be empty');
      window.ExpertInsights = {};
    }
  } catch (e) {
    console.error('[expert_insights] failed to load:', e);
    window.ExpertInsights = {};
  }
})();
