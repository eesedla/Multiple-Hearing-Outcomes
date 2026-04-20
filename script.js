var OUTCOME_COLORS = {
  "Suspension": "#004D66",
  "Reinstruction": "#B8960A",
  "Charge Dropped": "#619484",
  "Written Reprimand": "#4DB3B3",
  "Reimbursement": "#8B7355",
  "Termination": "#D64D4D",
  "Demotion": "#6A4FC7",
  "Resignation": "#F4C913",
  "Warning": "#C45B8A"
};
 
var OUTCOME_ORDER = [
  "Suspension", "Reinstruction", "Charge Dropped", "Written Reprimand",
  "Reimbursement", "Termination", "Demotion", "Resignation", "Warning"
];
 
var tooltip = document.getElementById('tooltip');
 
function buildLegend() {
  var legend = document.getElementById('legend');
  OUTCOME_ORDER.forEach(function(name) {
    var item = document.createElement('span');
    item.className = 'legend-item';
    item.innerHTML = '<span class="legend-swatch" style="background:' + OUTCOME_COLORS[name] + '"></span>' + name;
    legend.appendChild(item);
  });
}
 
function buildChart(DATA) {
  var chart = document.getElementById('chart');
  DATA.forEach(function(row) {
    var sep = row.outcomes.find(function(o) { return o.name === 'Separation'; });
    var res = row.outcomes.find(function(o) { return o.name === 'Resignation'; });
    if (sep) {
      if (res) { res.count += sep.count; }
      else { row.outcomes.push({ name: 'Resignation', count: sep.count }); }
      row.outcomes = row.outcomes.filter(function(o) { return o.name !== 'Separation'; });
    }
  });

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
      var seg = document.createElement('div');
      seg.className = 'stacked-segment';
      seg.style.width = pct + '%';
      seg.style.background = OUTCOME_COLORS[outcome.name];
 
      // Show percentage label inside segment if wide enough
      if (pct >= 10) {
        var segLabel = document.createElement('span');
        segLabel.className = 'seg-label';
        segLabel.textContent = Math.round(pct) + '%';
        seg.appendChild(segLabel);
      }
 
      // Divider between segments
      if (oi > 0) {
        seg.style.borderLeft = '1px solid rgba(244,240,230,0.6)';
      }
 
      // Tooltip
      seg.addEventListener('mouseenter', function(e) {
        var pctRound = Math.round(pct);
        tooltip.innerHTML = '<span class="tt-outcome">' + outcome.name + '</span>'
          + '<span class="tt-detail">' + outcome.count + ' of ' + row.totalOutcomes + ' outcomes (' + pctRound + '%)</span><br>'
          + '<span class="tt-detail">' + row.label + ' \u2014 ' + row.hearings + ' officers</span>';
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