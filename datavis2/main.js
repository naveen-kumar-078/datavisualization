/* =========================================================================
 * main.js
 * RECURSIVE SQUARIFIED TREEMAP ENGINE
 * Implements the Bruls / Huizing / van Wijk squarified layout algorithm.
 * ========================================================================= */

const HEADER_HEIGHT   = 26;   // height of each parent-node title bar
const MIN_HEADER_AREA = 40;   // don't draw a header if the box is too small
const PADDING         = 2;    // gap left between sibling rectangles

let ctx, canvasWidth, canvasHeight;

/* -------------------------------------------------------------------------
 * createRecursiveTreemapEngine()
 * Creates the treemap engine: grabs the canvas + 2D context and prepares
 * the canvas surface for drawing (dimensions, text baseline, etc).
 * ---------------------------------------------------------------------- */
function createRecursiveTreemapEngine(canvasEl) {
  ctx = canvasEl.getContext('2d');
  canvasWidth  = canvasEl.width;
  canvasHeight = canvasEl.height;
  ctx.textBaseline = 'middle';
  return { ctx, width: canvasWidth, height: canvasHeight };
}

/* -------------------------------------------------------------------------
 * calculateTreeValues()
 * Recursively walks the tree and computes the aggregate value of every
 * parent node by summing the values of its children (post-order).
 * ---------------------------------------------------------------------- */
function calculateTreeValues(node) {
  if (!node.children || node.children.length === 0) {
    return node.value || 0;
  }
  let total = 0;
  for (const child of node.children) {
    total += calculateTreeValues(child);
  }
  node.value = total;
  return total;
}

/* -------------------------------------------------------------------------
 * getWorstRatio()
 * Given a candidate row of nodes (each carrying a pre-computed pixel area)
 * and the rectangle they are being packed into, returns the worst
 * (i.e. least square-like) aspect ratio that row would produce.
 * ---------------------------------------------------------------------- */
function getWorstRatio(row, rect) {
  if (row.length === 0) return Infinity;
  const sideLength = rect.w >= rect.h ? rect.h : rect.w;
  const sum = row.reduce((s, n) => s + n._area, 0);
  if (sum <= 0 || sideLength <= 0) return Infinity;

  let max = -Infinity, min = Infinity;
  for (const n of row) {
    if (n._area > max) max = n._area;
    if (n._area < min) min = n._area;
  }

  const sideSq = sideLength * sideLength;
  const sumSq  = sum * sum;
  return Math.max((sideSq * max) / sumSq, sumSq / (sideSq * min));
}

/* -------------------------------------------------------------------------
 * positionElements()
 * Calculates the concrete x / y / w / h of every rectangle in the row that
 * is currently being placed, stacking them either as a column (when the
 * remaining space is wider than it is tall) or a row (otherwise).
 * ---------------------------------------------------------------------- */
function positionElements(row, rect) {
  const sum = row.reduce((s, n) => s + n._area, 0);
  if (sum <= 0) return;

  if (rect.w >= rect.h) {
    // lay the row out as a vertical column along the left edge
    const colWidth = sum / rect.h;
    let curY = rect.y;
    for (const item of row) {
      const itemH = item._area / colWidth;
      item._layout = { x: rect.x, y: curY, w: colWidth, h: itemH };
      curY += itemH;
    }
  } else {
    // lay the row out as a horizontal strip along the top edge
    const rowHeight = sum / rect.w;
    let curX = rect.x;
    for (const item of row) {
      const itemW = item._area / rowHeight;
      item._layout = { x: curX, y: rect.y, w: itemW, h: rowHeight };
      curX += itemW;
    }
  }
}

/* -------------------------------------------------------------------------
 * cutRectSpace()
 * After a row has been placed with positionElements(), this removes that
 * strip from the available rectangle and returns whatever space is left
 * for the rows/columns still to be laid out.
 * ---------------------------------------------------------------------- */
function cutRectSpace(row, rect) {
  const sum = row.reduce((s, n) => s + n._area, 0);
  if (rect.w >= rect.h) {
    const colWidth = sum / rect.h;
    return { x: rect.x + colWidth, y: rect.y, w: rect.w - colWidth, h: rect.h };
  } else {
    const rowHeight = sum / rect.w;
    return { x: rect.x, y: rect.y + rowHeight, w: rect.w, h: rect.h - rowHeight };
  }
}

/* -------------------------------------------------------------------------
 * computeSquarifiedLayout()
 * The core squarify loop: greedily grows a row one node at a time as long
 * as doing so improves (or does not worsen) the row's worst aspect ratio;
 * once it worsens, the row is committed via positionElements()/cutRectSpace()
 * and a new row begins, until every child has a rectangle.
 * ---------------------------------------------------------------------- */
function computeSquarifiedLayout(nodes, x, y, w, h) {
  const items = nodes.filter(n => (n.value || 0) > 0)
                      .sort((a, b) => b.value - a.value);
  if (items.length === 0) return;

  const totalValue = items.reduce((s, n) => s + n.value, 0);
  const totalArea  = Math.max(w, 0) * Math.max(h, 0);
  const scale = totalValue > 0 ? totalArea / totalValue : 0;
  items.forEach(n => { n._area = n.value * scale; });

  let rect = { x, y, w, h };
  let row = [];
  let i = 0;

  while (i < items.length) {
    const candidate = items[i];
    const newRow = row.concat(candidate);

    if (row.length === 0 || getWorstRatio(newRow, rect) <= getWorstRatio(row, rect)) {
      row = newRow;
      i++;
    } else {
      positionElements(row, rect);
      rect = cutRectSpace(row, rect);
      row = [];
    }
  }
  if (row.length > 0) {
    positionElements(row, rect);
  }
}

/* -------------------------------------------------------------------------
 * drawWrappedText()
 * Displays long text inside a rectangle by splitting it into multiple
 * lines so it never overflows the available width. Returns the number of
 * lines actually drawn.
 * ---------------------------------------------------------------------- */
function drawWrappedText(text, cx, cy, maxWidth, lineHeight, maxLines = 3) {
  const words = String(text).split(' ');
  const lines = [];
  let current = '';

  for (const word of words) {
    const test = current ? current + ' ' + word : word;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);

  const clipped = lines.slice(0, maxLines);
  if (lines.length > maxLines) {
    clipped[maxLines - 1] = clipped[maxLines - 1].replace(/\s*\S*$/, '') + '…';
  }

  const startY = cy - ((clipped.length - 1) * lineHeight) / 2;
  clipped.forEach((line, idx) => {
    ctx.fillText(line, cx, startY + idx * lineHeight);
  });
  return clipped.length;
}

/* -------------------------------------------------------------------------
 * renderNode()
 * Draws a single rectangle of the treemap: a title bar for container
 * nodes (then recurses into its children's own computed layout), or a
 * filled, labelled leaf cell showing name + value for nodes with no
 * children.
 * ---------------------------------------------------------------------- */
function renderNode(node, x, y, w, h, depth) {
  if (w <= 0 || h <= 0) return;

  const hasChildren = node.children && node.children.length > 0;

  if (hasChildren) {
    const canShowHeader = (w * h) > MIN_HEADER_AREA * 6 && h > HEADER_HEIGHT + 10;
    let bodyY = y, bodyH = h;

    // ---- header bar ----
    if (canShowHeader) {
      ctx.fillStyle = node.color || '#334155';
      ctx.fillRect(x, y, w, HEADER_HEIGHT);
      ctx.strokeStyle = 'rgba(255,255,255,0.12)';
      ctx.strokeRect(x + 0.5, y + 0.5, w - 1, HEADER_HEIGHT - 1);

      ctx.save();
      ctx.beginPath();
      ctx.rect(x + 4, y, w - 8, HEADER_HEIGHT);
      ctx.clip();
      ctx.fillStyle = '#f5f8ff';
      ctx.font = `700 ${depth === 0 ? 13 : 12}px -apple-system, Segoe UI, Arial, sans-serif`;
      ctx.textAlign = 'left';
      ctx.fillText(node.name.toUpperCase(), x + 8, y + HEADER_HEIGHT / 2 + 1);
      ctx.restore();

      bodyY = y + HEADER_HEIGHT;
      bodyH = h - HEADER_HEIGHT;
    } else {
      // not enough room for a header: paint background so children read as grouped
      ctx.fillStyle = node.color || '#334155';
      ctx.fillRect(x, y, w, h);
    }

    // ---- lay out & recurse into children ----
    computeSquarifiedLayout(node.children, x + PADDING, bodyY + PADDING,
                             Math.max(w - PADDING * 2, 0), Math.max(bodyH - PADDING * 2, 0));

    for (const child of node.children) {
      if (!child._layout) continue;
      const { x: cx, y: cy, w: cw, h: ch } = child._layout;
      renderNode(child, cx, cy, cw, ch, depth + 1);
    }
  } else {
    // ---- leaf cell ----
    ctx.fillStyle = node.color || '#94a3b8';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = 'rgba(9,13,22,0.55)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, Math.max(w - 1, 0), Math.max(h - 1, 0));

    if (w > 30 && h > 20) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(x + 4, y + 4, Math.max(w - 8, 0), Math.max(h - 8, 0));
      ctx.clip();

      const cx = x + w / 2;
      const isDark = isColorDark(node.color);
      ctx.fillStyle = isDark ? '#f4f7ff' : '#1c2436';
      ctx.textAlign = 'center';

      const nameSize  = Math.max(10, Math.min(13, w / 14));
      const valueSize = Math.max(11, Math.min(15, w / 12));
      const nameFits  = h > 46;

      let cy = y + h / 2;
      if (nameFits) {
        ctx.font = `600 ${nameSize}px -apple-system, Segoe UI, Arial, sans-serif`;
        const lines = drawWrappedText(node.name, cx, y + h / 2 - valueSize, w - 12, nameSize + 4, 2);
        cy = y + h / 2 - valueSize + lines * (nameSize + 4) / 2 + valueSize + 6;
      }
      ctx.font = `700 ${valueSize}px -apple-system, Segoe UI, Arial, sans-serif`;
      ctx.fillText('$' + Math.round(node.value).toLocaleString('en-US'), cx, cy);
      ctx.restore();
    }
  }
}

/* Small helper: decide black or white label text based on tile luminance */
function isColorDark(hex) {
  if (!hex) return true;
  const c = hex.replace('#', '');
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance < 0.6;
}

/* -------------------------------------------------------------------------
 * layout()
 * Entry point: clears the canvas, draws the root title bar, seeds the
 * top-level computation with the full canvas rectangle, and kicks off the
 * recursive render for every top-level branch of the tree.
 * ---------------------------------------------------------------------- */
function layout(rootData) {
  calculateTreeValues(rootData);

  ctx.fillStyle = '#090d16';
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  // Root header bar
  ctx.fillStyle = '#161d2e';
  ctx.fillRect(0, 0, canvasWidth, HEADER_HEIGHT + 6);
  ctx.fillStyle = '#f5f8ff';
  ctx.font = '700 14px -apple-system, Segoe UI, Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(rootData.name.toUpperCase(), canvasWidth / 2, (HEADER_HEIGHT + 6) / 2 + 1);

  const top = HEADER_HEIGHT + 6 + PADDING;
  computeSquarifiedLayout(rootData.children, PADDING, top,
                           canvasWidth - PADDING * 2, canvasHeight - top - PADDING);

  for (const child of rootData.children) {
    if (!child._layout) continue;
    const { x, y, w, h } = child._layout;
    renderNode(child, x, y, w, h, 0);
  }
}

/* -------------------------------------------------------------------------
 * FALLBACK_DATA
 * Browsers block fetch() from reading local files when a page is opened
 * directly as file:///path/to/index.html (no server involved), so
 * data.json can silently fail to load in that setup. This is a copy of
 * that same file kept in memory as a fallback so the treemap always
 * renders, even without a local server.
 * ---------------------------------------------------------------------- */
const FALLBACK_DATA = {
  "name": "Total Corporate Budget",
  "color": "#090d16",
  "children": [
    {
      "name": "Engineering",
      "color": "#1e3a8a",
      "children": [
        {
          "name": "Infrastructure",
          "color": "#0369a1",
          "children": [
            {
              "name": "Cloud Platform",
              "color": "#0284c7",
              "children": [
                { "name": "Cloud Compute Clusters", "value": 280000, "color": "#7DD3FC" },
                { "name": "Database Failover & Hosting", "value": 120000, "color": "#BAE6FD" },
                { "name": "CDN & Networking", "value": 65000, "color": "#E0F2FE" }
              ]
            },
            {
              "name": "DevOps",
              "color": "#0ea5e9",
              "children": [
                { "name": "CI/CD Automation", "value": 50000, "color": "#BAE6FD" },
                { "name": "Container Registry", "value": 25000, "color": "#E0F2FE" }
              ]
            }
          ]
        },
        {
          "name": "Software Development",
          "color": "#0f766e",
          "children": [
            {
              "name": "Backend Engineering",
              "color": "#0d9488",
              "children": [
                { "name": "API Gateway", "value": 210000, "color": "#BAE6FD" },
                { "name": "Message Broker & Bus", "value": 110000, "color": "#E0F2FE" },
                { "name": "Authentication Service", "value": 85000, "color": "#F0F9FF" }
              ]
            },
            {
              "name": "Frontend & Mobile",
              "color": "#14b8a6",
              "children": [
                { "name": "Web App Development", "value": 140000, "color": "#E0F2FE" },
                { "name": "Mobile Apps (iOS/Android)", "value": 125000, "color": "#F0F9FF" }
              ]
            }
          ]
        }
      ]
    },
    {
      "name": "Research & Development",
      "color": "#4c1d95",
      "children": [
        {
          "name": "AI & Machine Learning",
          "color": "#6d28d9",
          "children": [
            {
              "name": "AI Infrastructure",
              "color": "#7c3aed",
              "children": [
                { "name": "GPU Cloud Leases", "value": 230000, "color": "#C4B5FD" },
                { "name": "LLM Fine-Tuning", "value": 120000, "color": "#DDD6FE" },
                { "name": "Vector Databases", "value": 75000, "color": "#EDE9FE" }
              ]
            }
          ]
        },
        {
          "name": "Hardware R&D",
          "color": "#5b21b6",
          "children": [
            {
              "name": "Quantum Computing",
              "color": "#8b5cf6",
              "children": [
                { "name": "Cryogenic Cooling Chambers", "value": 110000, "color": "#DDD6FE" },
                { "name": "Silicon Photonics Testing", "value": 90000, "color": "#EDE9FE" }
              ]
            }
          ]
        }
      ]
    },
    {
      "name": "Operations & Legal",
      "color": "#334155",
      "children": [
        {
          "name": "Facilities & Real Estate",
          "color": "#475569",
          "children": [
            {
              "name": "HQ Office Operations",
              "color": "#64748b",
              "children": [
                { "name": "Office Rent & Leases", "value": 190000, "color": "#CBD5E1" },
                { "name": "Data Center Utilities", "value": 45000, "color": "#E2E8F0" }
              ]
            },
            {
              "name": "Remote Work Logistics",
              "color": "#94a3b8",
              "children": [
                { "name": "Coworking Stipends", "value": 90000, "color": "#E2E8F0" }
              ]
            }
          ]
        },
        {
          "name": "Legal & Compliance",
          "color": "#3f3f46",
          "children": [
            {
              "name": "Intellectual Property",
              "color": "#52525b",
              "children": [
                { "name": "Patent Filings", "value": 85000, "color": "#E2E8F0" }
              ]
            },
            {
              "name": "Finance & Risk Management",
              "color": "#71717a",
              "children": [
                { "name": "Financial Audits", "value": 55000, "color": "#F1F5F9" },
                { "name": "Cyber Insurance", "value": 30000, "color": "#F8FAFC" }
              ]
            }
          ]
        }
      ]
    },
    {
      "name": "Marketing",
      "color": "#7c2d12",
      "children": [
        {
          "name": "Growth Marketing",
          "color": "#c2410c",
          "children": [
            {
              "name": "Paid Advertising",
              "color": "#ea580c",
              "children": [
                { "name": "Search & Social Ads", "value": 250000, "color": "#FDBA74" },
                { "name": "Retargeting Ads", "value": 115000, "color": "#FED7AA" }
              ]
            },
            {
              "name": "Affiliate Marketing",
              "color": "#f97316",
              "children": [
                { "name": "Affiliate Commissions", "value": 140000, "color": "#FED7AA" }
              ]
            }
          ]
        },
        {
          "name": "Public Relations",
          "color": "#b45309",
          "children": [
            {
              "name": "Communications",
              "color": "#d97706",
              "children": [
                { "name": "PR Agencies", "value": 70000, "color": "#FFEDD5" },
                { "name": "Video & Media Production", "value": 40000, "color": "#FFF7ED" }
              ]
            }
          ]
        }
      ]
    }
  ]
};

/* -------------------------------------------------------------------------
 * DOMContentLoaded Event
 * Loads the data from the JSON file (data.json) and displays the treemap
 * when the webpage opens. Falls back to the in-memory copy above if
 * fetch() is blocked (e.g. the page was opened directly from disk rather
 * than through a local web server).
 * ---------------------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('treemapCanvas');
  createRecursiveTreemapEngine(canvas);

  fetch('data.json')
    .then(response => {
      if (!response.ok) throw new Error('Failed to load data.json');
      return response.json();
    })
    .then(data => layout(data))
    .catch(err => {
      console.warn('fetch(data.json) failed, using embedded fallback data:', err.message);
      layout(JSON.parse(JSON.stringify(FALLBACK_DATA)));
    });
});