/*
  Loader for expert insights. Loads page-specific insight files:
  - expert_insights.json for Q1
  - april_insights.json for April
  - may_insights.json for May

  This loader does a synchronous XHR so window.ExpertInsights is
  populated before React mounts.
*/
(function loadExpertInsights() {
  try {
    // Detect which page we're on from window.ChiComData.DATE_RANGE.start
    var pageSlug = 'q1';
    if (window.ChiComData && window.ChiComData.DATE_RANGE && window.ChiComData.DATE_RANGE.start) {
      var start = window.ChiComData.DATE_RANGE.start;
      if (start.includes('2026-04')) pageSlug = 'april';
      else if (start.includes('2026-05')) pageSlug = 'may';
    }

    var filename = pageSlug + '_insights.json';
    if (pageSlug === 'q1') filename = 'expert_insights.json'; // Q1 uses the original name

    var xhr = new XMLHttpRequest();
    xhr.open('GET', filename, false); // sync
    xhr.send();
    if (xhr.status >= 200 && xhr.status < 300) {
      window.ExpertInsights = JSON.parse(xhr.responseText);
    } else {
      console.warn('[expert_insights] HTTP ' + xhr.status + ' for ' + filename + ' — panel will be empty');
      window.ExpertInsights = {};
    }
  } catch (e) {
    console.error('[expert_insights] failed to load:', e);
    window.ExpertInsights = {};
  }
})();
