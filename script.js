var OUTCOME_COLORS = {
  "Termination": "#D64D4D",
  "Resignation": "#f4c913",
  "Demotion": "#6A4FC7",
  "Long Suspension": "#23685b",
  "Short Suspension": "#5aa898",
  "Charge Dropped": "#d0d64c",
  "Written Reprimand": "#a9d2cf",
  "Reinstruction": "#e56430"
};

var OUTCOME_ORDER = [
  "Long Suspension", "Short Suspension", "Reinstruction", "Charge Dropped",
  "Written Reprimand", "Termination", "Demotion", "Resignation"
];

var OUTCOME_PHRASES = {
  "Long Suspension": "received a suspension over 7 days",
  "Short Suspension": "received a suspension of 7 days or fewer",
  "Reinstruction": "were given a letter of reinstruction",
  "Charge Dropped": "had their charges dropped",
  "Written Reprimand": "were given a written reprimand",
  "Termination": "were terminated",
  "Demotion": "were demoted",
  "Resignation": "resigned"
};

var OUTCOME_LEGEND_LABELS = {
  "Long Suspension": "Long Suspension (>7 days)"
};

var tooltip = document.getElementById('tooltip');

function buildLegend() {
  var legend = document.getElementById('legend');
  OUTCOME_ORDER.forEach(function(name) {
    var item = document.createElement('span');
    item.className = 'legend-item';
    item.innerHTML = '<span class="legend-swatch" style="background:' + OUTCOME_COLORS[name] + '"></span>' + (OUTCOME_LEGEND_LABELS[name] || name);
    legend.appendChild(item);
  });
}
 
function buildChart(DATA) {
  var chart = document.getElementById('chart');
  DATA.forEach(function(row, ri) {
    var barRow = document.createElement('div');
    barRow.className = 'bar-row';
 
    // Label
    var label = document.createElement('div');
    label.className = 'bar-row-label';
    label.innerHTML = '<span>' + row.label + '</span>'
      + '<span class="hearing-count">' + row.hearings + ' hearings, ' + row.totalOutcomes + ' outcomes</span>';
 
    // Stacked bar
    var track = document.createElement('div');
    track.className = 'stacked-track';
 
    var sorted = row.outcomes.slice().sort(function(a, b) { return b.count - a.count; });
 
    sorted.forEach(function(outcome, oi) {
      var pct = outcome.count / row.totalOutcomes * 100;
      var pctOfOfficers = Math.round(outcome.count / row.hearings * 100);
      var seg = document.createElement('div');
      seg.className = 'stacked-segment';
      seg.style.width = pct + '%';
      seg.style.background = OUTCOME_COLORS[outcome.name];

      // Show percentage label inside segment if wide enough
      if (pct >= 10) {
        var segLabel = document.createElement('span');
        segLabel.className = 'seg-label';
        segLabel.textContent = pctOfOfficers + '%';
        seg.appendChild(segLabel);
      }
 
      // Divider between segments
      if (oi > 0) {
        seg.style.borderLeft = '1px solid rgba(244,240,230,0.6)';
      }
 
      // Tooltip
      seg.addEventListener('mouseenter', function(e) {
        var pctRound = pctOfOfficers;
        var phrase = OUTCOME_PHRASES[outcome.name] || outcome.name.toLowerCase();
        var officerWord = outcome.count === 1 ? 'officer' : 'officers';
        var conjugated = outcome.count === 1 ? phrase.replace(/\bwere\b/, 'was') : phrase;
        tooltip.innerHTML = '<span class="tt-detail">' + outcome.count + ' of ' + row.hearings + ' total officers (' + pctRound + '%) ' + conjugated + ' during their ' + row.label + '</span>';
        tooltip.classList.add('visible');
      });
      seg.addEventListener('mousemove', function(e) {
        var tw = tooltip.offsetWidth || 200;
        var th = tooltip.offsetHeight || 80;
        var tx = e.clientX + 14;
        var ty = e.clientY - th - 8;
        if (tx + tw > window.innerWidth - 10) tx = e.clientX - tw - 10;
        if (ty < 4) ty = e.clientY + 16;
        tooltip.style.left = tx + 'px';
        tooltip.style.top = ty + 'px';
      });
      seg.addEventListener('mouseleave', function() {
        tooltip.classList.remove('visible');
      });
 
      track.appendChild(seg);
    });
 
    barRow.appendChild(label);
    barRow.appendChild(track);
 
    // Stagger animation
    barRow.style.opacity = '0';
    barRow.style.transform = 'translateY(6px)';
    barRow.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
    barRow.style.transitionDelay = (ri * 0.08) + 's';
 
    chart.appendChild(barRow);
 
    requestAnimationFrame(function() {
      requestAnimationFrame(function() {
        barRow.style.opacity = '1';
        barRow.style.transform = 'translateY(0)';
      });
    });
  });
}
 
buildLegend();
 
fetch('data.json')
  .then(function(res) { return res.json(); })
  .then(function(data) { buildChart(data); });