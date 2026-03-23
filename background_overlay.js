// Main Portfolio Script
// Dynamically loads and displays content from portfolio-data.js

const win = document.getElementById('infoWindow');
const windowContent = document.getElementById('windowContent');
const universe = document.getElementById('universe');
const debug = document.getElementById('debug');
const closeBtn = document.getElementById('closeBtn');
const clickOverlay = document.getElementById('clickOverlay');
const backgroundIcons = document.getElementById('backgroundIcons');
const creedCross = document.getElementById('creedCross');
const arkDrawing = document.getElementById('arkDrawing');
const grid = document.querySelector('.grid');

// Lazy loader for portfolio data — only fetched on first button click
let portfolioDataPromise = null;
function ensurePortfolioData() {
  if (typeof portfolioData !== 'undefined') return Promise.resolve();
  if (portfolioDataPromise) return portfolioDataPromise;
  portfolioDataPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'js/portfolio-data.js';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load portfolio data'));
    document.head.appendChild(script);
  });
  return portfolioDataPromise;
}

function isMobile() {
  return window.innerWidth < 768;
}

// Travel Animation
let isTravelMode = false;
let travelDistance = 0;
const TRAVEL_SPEED = 120; // Pixels per second

let isWindowOpen = false;
let rotateX = 0, rotateY = 0;

// Perspective config (match .space perspective in CSS)
const PERSPECTIVE = 1200;
const VANISH_Z = -3000; // Z coordinate of the vanishing point (simulates infinity)

// Icon positions: top/left in %, z in px (negative = into the screen / toward infinity)
// Reorganizable: drag overlay buttons or use dropdown A (line) / Ω (disperse).
const iconPositions = [
  { top: 30, left: 30, z: -300 },
  { top: 50, left: 60, z: -600 },
  { top: 70, left: 40, z: -900 },
  { top: 20, left: 70, z: -1200 },
  { top: 95, left: 95, z: -150 },
  { top: 95, left: 5, z: -450 }
];

let draggingButtonIndex = null;
let dragMoved = false;
let dragStartX = 0, dragStartY = 0;

// Function to format content based on section type
function formatContent(section) {
  let html = `<h2>${section.title}</h2>`;
  
  switch(section.type) {
    case 'about':
      html += `<p>${section.content}</p>`;
      if (section.skills && section.skills.length > 0) {
        html += `<div class="skills-section"><h3>Skills:</h3><div class="tags">`;
        section.skills.forEach(skill => {
          html += `<span class="tag">${skill}</span>`;
        });
        html += `</div></div>`;
      }
      break;
      
    case 'journey':
      if (section.entries && section.entries.length > 0) {
        html += `<div class="timeline">`;
        section.entries.forEach(entry => {
          html += `
            <div class="timeline-entry">
              <div class="timeline-year">${entry.year}</div>
              <div class="timeline-content">
                <h3>${entry.title}</h3>
                <p>${entry.description}</p>
                ${entry.tags ? `<div class="tags">${entry.tags.map(t => `<span class="tag">${t}</span>`).join('')}</div>` : ''}
              </div>
            </div>
          `;
        });
        html += `</div>`;
      } else {
        html += `<p class="empty-state">No journey entries yet. Add entries to portfolio-data.js</p>`;
      }
      break;
      
    case 'projects':
      if (section.entries && section.entries.length > 0) {
        html += `<div class="projects-grid">`;
        section.entries.forEach(project => {
          html += `
            <div class="project-card">
              <div class="project-header">
                <h3>${project.name}</h3>
                <span class="status status-${project.status.toLowerCase().replace(' ', '-')}">${project.status}</span>
              </div>
              <p>${project.description}</p>
              ${project.technologies ? `<div class="tags">${project.technologies.map(t => `<span class="tag">${t}</span>`).join('')}</div>` : ''}
              ${project.link ? `<a href="${project.link}" target="_blank" class="project-link">View →</a>` : ''}
            </div>
          `;
        });
        html += `</div>`;
      } else {
        html += `<p class="empty-state">No projects yet. Add projects to portfolio-data.js</p>`;
      }
      break;
      
    case 'achievements':
      if (section.entries && section.entries.length > 0) {
        html += `<div class="achievements-list">`;
        section.entries.forEach(achievement => {
          html += `
            <div class="achievement-item">
              <div class="achievement-date">${achievement.date}</div>
              <div class="achievement-content">
                <h3>${achievement.title}</h3>
                <p>${achievement.description}</p>
                ${achievement.category ? `<span class="category">${achievement.category}</span>` : ''}
              </div>
            </div>
          `;
        });
        html += `</div>`;
      } else {
        html += `<p class="empty-state">No achievements yet. Add achievements to portfolio-data.js</p>`;
      }
      break;
      
    case 'contact':
      html += `<div class="contact-info">`;
      if (section.email) {
        html += `<div class="contact-item"><span class="contact-label">📧 Email:</span> <a href="mailto:${section.email}">${section.email}</a></div>`;
      }
      if (section.github) {
        html += `<div class="contact-item"><span class="contact-label">🌐 GitHub:</span> <a href="https://${section.github}" target="_blank">${section.github}</a></div>`;
      }
      if (section.other && section.other.length > 0) {
        section.other.forEach(item => {
          html += `<div class="contact-item"><span class="contact-label">${item.label}:</span> ${item.value}</div>`;
        });
      }
      html += `</div>`;
      break;

    case 'ark':
      if (section.entries && section.entries.length > 0) {
        html += `<div class="projects-grid">`;
        section.entries.forEach(item => {
          html += `<div class="project-card ark-card">`;
          if (item.date) {
            html += `<div class="achievement-date">${item.date}</div>`;
          }
          html += `<div class="project-header"><h3>${item.title}</h3></div>`;
          html += `<p>${item.description}</p>`;
          if (item.tags && item.tags.length > 0) {
            html += `<div class="tags">${item.tags.map(t => `<span class="tag">${t}</span>`).join('')}</div>`;
          }
          if (item.link) {
            html += `<a href="${item.link}" target="_blank" class="project-link">View →</a>`;
          }
          html += `</div>`;
        });
        html += `</div>`;
      } else {
        html += `<p class="empty-state">No items in the Ark yet. Add entries to portfolio-data.js ark array.</p>`;
      }
      break;
      
    default:
      html += `<p>${section.content || 'Content coming soon...'}</p>`;
  }
  
  return html;
}

// Function to prepare section data
function getSectionData(contentKey) {
  switch(contentKey) {
    case 'about':
      return {
        type: 'about',
        title: portfolioData.about.title,
        content: portfolioData.about.content,
        skills: portfolioData.about.skills
      };
    case 'journey':
      return {
        type: 'journey',
        title: 'Journey into Tech',
        entries: portfolioData.journey
      };
    case 'projects':
      return {
        type: 'projects',
        title: 'Projects',
        entries: portfolioData.projects
      };
    case 'achievements':
      return {
        type: 'achievements',
        title: 'Achievements',
        entries: portfolioData.achievements
      };
    case 'contact':
      return {
        type: 'contact',
        title: portfolioData.contact.title,
        ...portfolioData.contact
      };
    case 'dot':
      return {
        type: 'default',
        title: '.',
        content: 'This site was co-developed with AI, \
        as I was recommended to bolster my AI-driven development skills by peers :)\
        The future is now it seems'
      };
    case 'ark':
      return {
        type: 'ark',
        title: 'Ark',
        entries: Array.isArray(portfolioData.ark) ? portfolioData.ark : [portfolioData.ark]
      };
    default:
      return {
        type: 'default',
        title: 'Unknown',
        content: 'Section not found'
      };
  }
}

// Function to open window (lazy-loads portfolio data on first call)
async function openWindow(contentKey) {
  await ensurePortfolioData();
  const sectionData = getSectionData(contentKey);
  if (sectionData) {
    windowContent.innerHTML = formatContent(sectionData);
    win.classList.add('active');
    isWindowOpen = true;
    debug.textContent = `Window opened: ${sectionData.title}`;
  }
}

// Open all sections in one window (Alpha: show all icons with descriptions and attributes).
async function openAllSections() {
  await ensurePortfolioData();
  iconsInLine();

  const contentKeys = ['about', 'journey', 'projects', 'achievements', 'contact', 'dot'];
  let html = '';
  contentKeys.forEach(key => {
    const sectionData = getSectionData(key);
    if (sectionData) {
      html += '<div class="all-sections-block">' + formatContent(sectionData) + '</div>';
    }
  });
  windowContent.innerHTML = html;
  win.classList.add('active');
  isWindowOpen = true;
  debug.textContent = 'Window opened: All';
}

// Function to close window
function closeWindow() {
  win.classList.remove('active');
  isWindowOpen = false;
  if (!isMobile()) debug.textContent = "Move mouse to rotate • Click icons to open windows";
}

// Button Event Listeners
// Setup overlay buttons: click to open, drag to reorganize (3D icons follow).
document.querySelectorAll('.click-button').forEach((button, index) => {
  button.addEventListener('click', (e) => {
    e.stopPropagation();
    if (dragMoved) {
      dragMoved = false;
      return;
    }
    debug.textContent = `Clicked: ${button.dataset.title}`;
    openWindow(button.dataset.content);
  });

  button.addEventListener('mousedown', (e) => {
    e.preventDefault();
    draggingButtonIndex = index;
    dragMoved = false;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    button.classList.add('dragging');
  });

  button.addEventListener('mouseenter', () => {
    if (draggingButtonIndex === null) debug.textContent = `Hovering: ${button.dataset.title}`;
  });

  button.addEventListener('mouseleave', () => {
    if (!isWindowOpen && draggingButtonIndex === null && !isMobile()) {
      debug.textContent = "Move mouse to rotate • Click icons to open windows";
    }
  });
});

// Travel Mode
const travelBtn = document.getElementById('travelBtn');
if (travelBtn) {
  travelBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    isTravelMode = !isTravelMode;
    travelBtn.classList.toggle('active', isTravelMode);
    debug.textContent = `Travel Mode: ${isTravelMode ? 'OFF' : 'ON'}`;
  });
}

window.addEventListener('mousemove', (e) => {
  // 1. ALWAYS calculate rotation, whether dragging or not
  const centerX = window.innerWidth / 2;
  const centerY = window.innerHeight / 2;
  const offsetX = (e.clientX - centerX) / centerX;
  const offsetY = (e.clientY - centerY) / centerY;
  
  rotateY = offsetX * 15;
  rotateX = -offsetY * 10;
  
  universe.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;

  // custom-cursor
  const customCursor = document.getElementById('customcursor');
  
  if (customCursor) {
     customCursor.style.left = e.clientX + "px";
     customCursor.style.top = e.clientY + "px";
  }
  // Update Ark tilt and parallax background
  if (arkDrawing) {
    const arkTiltX = rotateX * 0.4;
    const arkTiltY = rotateY * 0.4;
    arkDrawing.style.transform = `perspective(800px) rotateX(${arkTiltX}deg) rotateY(${arkTiltY}deg)`;
  }
  updateFloatingIconsParallax(offsetX, offsetY);

  // 2. ONLY handle dragging logic if an icon is actually selected
  if (draggingButtonIndex !== null) {
    const i = draggingButtonIndex;
    const button = document.getElementById(`btn${i + 1}`);
    
    if (button) {
      const dx = e.clientX - dragStartX;
      const dy = e.clientY - dragStartY;
      if (Math.abs(dx) > 5 || Math.abs(dy) > 5) dragMoved = true;
      
      // Move the 2D button
      button.style.left = `${e.clientX - 40}px`;
      button.style.top = `${e.clientY - 40}px`;
      
      // Update data model for the 3D background icon
      iconPositions[i].left = (e.clientX / window.innerWidth) * 100;
      iconPositions[i].top = (e.clientY / window.innerHeight) * 100;
      
      // Sync the 3D element in the universe
      sync3DIconsFromPositions();
    }
  }

  // 3. ALWAYS update all button positions so they stay locked to their 3D counterparts
  updateButtonPositions();
}, {passive: true});

window.addEventListener('mouseup', (e) => {
  if (draggingButtonIndex === null) return;

  const i = draggingButtonIndex;
  const button = document.getElementById(`btn${i + 1}`);
  
  if (button) {
    button.classList.remove('dragging');
    
    // Use the mouse position to set the final center
    const centerX = e.clientX;
    const centerY = e.clientY;

    iconPositions[i].left = Math.max(2, Math.min(98, (centerX / window.innerWidth) * 100));
    iconPositions[i].top = Math.max(2, Math.min(98, (centerY / window.innerHeight) * 100));
    
    iconPositions[i].fixed = true;
    iconPositions[i].fixedScreenX = centerX;
    iconPositions[i].fixedScreenY = centerY;
  }

  // Reset the index BEFORE syncing to ensure the rotation logic takes over
  draggingButtonIndex = null;
  
  sync3DIconsFromPositions();
  updateButtonPositions();
});


// Dropdown menu: hamburger (≡), alpha (A), omega (Ω), panel items = overlay sections.
const dropdownMenu = document.getElementById('dropdownMenu');
const dropdownTrigger = document.getElementById('dropdownTrigger');
const dropdownPanel = document.getElementById('dropdownPanel');
const alphaBtn = document.getElementById('alphaBtn');
const omegaBtn = document.getElementById('omegaBtn');

if (dropdownTrigger) {
  dropdownTrigger.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdownMenu.classList.toggle('open');
  });
}
if (dropdownPanel) {
  dropdownPanel.querySelectorAll('.dropdown-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.stopPropagation();
      if (item.dataset.action === 'line') {
        iconsInLine();
      } else if (item.dataset.action === 'disperse') {
        iconsDisperse();
      } else if (item.dataset.content) {
        openWindow(item.dataset.content);
      }
      dropdownMenu.classList.remove('open');
    });
  });
}
if (alphaBtn) {
  alphaBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    openAllSections();
  });
}
if (omegaBtn) {
  omegaBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    iconsDisperse();
    closeWindow();
  });
}
document.addEventListener('click', () => {
  if (dropdownMenu) dropdownMenu.classList.remove('open');
});
if (dropdownMenu) {
  dropdownMenu.addEventListener('click', (e) => e.stopPropagation());
}

// Close button
closeBtn.addEventListener('click', closeWindow);

// Close on background click
document.getElementById('space').addEventListener('click', () => {
  if (isWindowOpen) {
    closeWindow();
  }
});

// Prevent closing when clicking window
win.addEventListener('click', (e) => e.stopPropagation());

// ESC key to close
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && isWindowOpen) {
    closeWindow();
  }
});


// Update floating icons parallax based on mouse position
function updateFloatingIconsParallax(offsetX, offsetY) {
  mouseOffsetX = offsetX;
  mouseOffsetY = offsetY;
}

// Project 3D point to 2D with perspective (creates infinite tunnel illusion)
function project3D(leftPct, topPct, z) {
  // Position in universe space (center of 80px icon at this top/left)
  const x = (leftPct / 100) * window.innerWidth - window.innerWidth / 2 + 40;
  const y = (topPct / 100) * window.innerHeight - window.innerHeight / 2 + 40;

  const radX = (rotateX * Math.PI) / 180;
  const radY = (rotateY * Math.PI) / 180;

  // Rotate Y (horizontal mouse)
  const cosY = Math.cos(radY);
  const sinY = Math.sin(radY);
  let x1 = x * cosY + z * sinY;
  let z1 = -x * sinY + z * cosY;
  const y1 = y;

  // Rotate X (vertical mouse)
  const cosX = Math.cos(radX);
  const sinX = Math.sin(radX);
  const y2 = y1 * cosX - z1 * sinX;
  const z2 = y1 * sinX + z1 * cosX;
  const x2 = x1;

  // Behind viewer - hide
  if (z2 >= -10) {
    return {
      x: -9999,
      y: -9999,
      scale: 0,
      opacity: 0,
      visible: false
    };
  }

  // Perspective projection: scale toward vanishing point
  const scale = PERSPECTIVE / (PERSPECTIVE - z2);

  const projX = x2 * scale;
  const projY = y2 * scale;

  // Back to screen coords (center origin)
  const screenX = window.innerWidth / 2 + projX;
  const screenY = window.innerHeight / 2 + projY;

  // Depth-based opacity (fade into infinity)
  const depthNorm = Math.max(0, Math.min(1, (-z2 - 150) / (Math.abs(VANISH_Z) - 150)));
  const opacity = 0.35 + 0.65 * (1 - depthNorm);

  return {
    x: screenX - 40, // center 80px button
    y: screenY - 40,
    scale: Math.max(0.15, Math.min(1.2, scale)),
    opacity,
    visible: true
  };
}

// Sync 3D icons in the universe to match iconPositions (so they follow reorganization).
function sync3DIconsFromPositions() {
  iconPositions.forEach((pos, index) => {
    const icon = document.getElementById(`icon${index + 1}`);
    if (icon) {
      icon.style.left = `${pos.left}%`;
      icon.style.top = `${pos.top}%`;
      const z = pos.z || -300;
      icon.style.transform = `translateZ(${z}px)`;
    }
  });
}

// Arrange overlay icons in a vertical line on the left (for menu "Line up").
function iconsInLine() {
  const n = iconPositions.length;
  const left = 8;
  for (let i = 0; i < n; i++) {
    const top = 10 + (80 * (i + 1)) / (n + 1);
    iconPositions[i].top = top;
    iconPositions[i].left = left;
    delete iconPositions[i].fixed;
    delete iconPositions[i].fixedScreenX;
    delete iconPositions[i].fixedScreenY;
  }
  sync3DIconsFromPositions();
  updateButtonPositions();
}

// Disperse overlay icons to random positions (for menu "Disperse").
function iconsDisperse() {
  iconPositions.forEach((pos, i) => {
    pos.top = 10 + Math.random() * 80;
    pos.left = 10 + Math.random() * 80;
    delete pos.fixed;
    delete pos.fixedScreenX;
    delete pos.fixedScreenY;
  });
  sync3DIconsFromPositions();
  updateButtonPositions();
}

// Function to update clickable button positions
function updateButtonPositions() {
  iconPositions.forEach((pos, index) => {
    const button = document.getElementById(`btn${index + 1}`);
    const icon = document.getElementById(`icon${index + 1}`);

    if (button && icon) {
      if (index === draggingButtonIndex) return;

      // Call project3D for BOTH cases to get correct perspective values
      const { x, y, scale, opacity, visible } = project3D(pos.left, pos.top, pos.z);

      if (pos.fixed) {
        // Use the stored fixed coordinates, but the dynamic scale/opacity from project3D
        button.style.left = `${(pos.fixedScreenX || 0) - 40}px`;
        button.style.top = `${(pos.fixedScreenY || 0) - 40}px`;
        button.style.transform = `scale(${scale})`;
        button.style.opacity = opacity;
        button.style.visibility = visible ? 'visible' : 'hidden';
        button.style.pointerEvents = 'auto';
      } else {
        button.style.left = `${x}px`;
        button.style.top = `${y}px`;
        button.style.transform = `scale(${scale})`;
        button.style.opacity = opacity;
        button.style.visibility = visible ? 'visible' : 'hidden';
        button.style.pointerEvents = visible ? 'auto' : 'none';
      }
    }
  });
}

// Initialize button positions
updateButtonPositions();

// Handle window resize
window.addEventListener('resize', () => {
  updateButtonPositions();
  // Recalculate floating icon base positions on resize
  floatingIconsData.forEach(data => {
    // Recalculate base positions relative to new viewport size
    const screenX = data.baseX + window.innerWidth / 2;
    const screenY = data.baseY + window.innerHeight / 2;
    // Snap to grid in new viewport
    data.baseX = snapToGrid(screenX) - window.innerWidth / 2;
    data.baseY = snapToGrid(screenY) - window.innerHeight / 2;
  });
});

// Creed cross - horizontal bar is lines 23-40 (indices 20-37)
const CREED_HORIZONTAL_START = 18;
const CREED_HORIZONTAL_END = 39;

const creedHorizontalData = [];

function renderCreedCross(lines) {
  if (!creedCross || !lines || lines.length === 0) return;
  creedCross.innerHTML = '';
  creedHorizontalData.length = 0;

  const rawLines = lines.map(l => (typeof l === 'string' ? l : String(l)));
  
  rawLines.forEach((line, index) => {
    const span = document.createElement('span');
    span.className = 'creed-line';
    const isHorizontal = index >= CREED_HORIZONTAL_START && index < CREED_HORIZONTAL_END;
    if (isHorizontal) {
      span.classList.add('creed-line-movable');
      creedHorizontalData.push({
        element: span,
        phaseX: Math.random() * Math.PI * 2,
        phaseY: Math.random() * Math.PI * 2,
        speedX: 0.8 + Math.random() * 0.6,
        speedY: 0.6 + Math.random() * 0.5,
        amplitudeX: 8 + Math.random() * 8,
        amplitudeY: 4 + Math.random() * 6,
        parallaxDepth: 0.2 + (creedHorizontalData.length % 3) * 0.15
      });
    }
    span.textContent = line;
    creedCross.appendChild(span);
    creedCross.appendChild(document.createTextNode('\n'));
  });
}

(function initCreedCross() {
  if (typeof creedLines !== 'undefined' && creedLines.length > 0) {
    renderCreedCross(creedLines);
  }
})();

// Ark of the Covenant - render from ark-data.js in lower-left corner
function renderArk(lines) {
  if (!arkDrawing || !lines || lines.length === 0) return;
  arkDrawing.innerHTML = '';
  const rawLines = lines.map(l => (typeof l === 'string' ? l : String(l)));
  rawLines.forEach(line => {
    const span = document.createElement('span');
    span.textContent = line;
    arkDrawing.appendChild(span);
    arkDrawing.appendChild(document.createTextNode('\n'));
  });
}

(function initArk() {
  if (typeof arkLines !== 'undefined' && arkLines.length > 0) {
    renderArk(arkLines);
  }

  // Ark is clickable: open info window with ark data
  if (arkDrawing) {
    arkDrawing.style.pointerEvents = 'auto';
    arkDrawing.style.cursor = 'pointer';
    arkDrawing.setAttribute('role', 'button');
    arkDrawing.setAttribute('aria-label', 'Open Ark');
    arkDrawing.addEventListener('click', (e) => {
      e.stopPropagation();
      debug.textContent = 'Clicked: Ark';
      openWindow('ark');
    });
    arkDrawing.addEventListener('mouseenter', () => {
      debug.textContent = 'Hovering: Ark';
    });
    arkDrawing.addEventListener('mouseleave', () => {
      if (!isWindowOpen && !isMobile()) {
        debug.textContent = 'Move mouse to rotate • Click icons to open windows';
      }
    });
  }
})();

// Floating background icons
const hexCodes = ['0x00', '0x01', '0x02', '0x03', '0x04', '0x05', '0x06', '0x07', 
                  '0x08', '0x09', '0x0A', '0x0B', '0x0C', '0x0D', '0x0E', '0x0F',
                  '0xFF', '0xAA', '0x55', '0x33', '0xCC', '0x99', '0x66', '0xEE'];

const floatingIconsData = [];
const GRID_SIZE = 100; // Match grid spacing from CSS (100px)

// Snap value to nearest grid point
function snapToGrid(value) {
  return Math.round(value / GRID_SIZE) * GRID_SIZE;
}

function createFloatingIcon() {
  const icon = document.createElement('div');
  icon.className = 'floating-icon';
  
  // Random hex code
  const hexCode = hexCodes[Math.floor(Math.random() * hexCodes.length)];
  icon.textContent = hexCode;
  
  // Random position, snapped to grid (in screen space)
  const baseX = snapToGrid(Math.random() * window.innerWidth);
  const baseY = snapToGrid(Math.random() * window.innerHeight);
  
  // Convert to 3D space coordinates (center origin)
  const baseX3D = baseX - window.innerWidth / 2;
  const baseY3D = baseY - window.innerHeight / 2;
  
  // Random Z depth (negative = into screen, toward infinity)
  const baseZ = -200 - Math.random() * 2000; // -200 to -2200
  
  // Initial screen position (will be updated by animation)
  icon.style.left = `${baseX}px`;
  icon.style.top = `${baseY}px`;
  
  // Vary opacity slightly
  const opacity = 0.2 + Math.random() * 0.2; // 0.2 to 0.4
  icon.style.opacity = opacity;
  
  // Determine movement direction: 0 = horizontal, 1 = vertical
  const direction = Math.floor(Math.random() * 2);
  const speed = 20 + Math.random() * 30; // 20-50 pixels per second
  const range = GRID_SIZE * (2 + Math.floor(Math.random() * 4)); // 2-5 grid cells
  
  // Store animation data
  const data = {
    element: icon,
    baseX: baseX3D, // 3D space coordinates (center origin)
    baseY: baseY3D,
    baseZ: baseZ,
    direction: direction, // 0 = horizontal (X), 1 = vertical (Y)
    speed: speed,
    range: range,
    position: Math.random() * range - range / 2, // Start at random position in range
    parallaxDepth: 0.3 + (floatingIconsData.length % 3) * 0.2 // 0.3, 0.5, or 0.7
  };
  
  floatingIconsData.push(data);
  backgroundIcons.appendChild(icon);
  
  return data;
}

// Create floating background icons
const NUM_FLOATING_ICONS = 15;
for (let i = 0; i < NUM_FLOATING_ICONS; i++) {
  createFloatingIcon();
}

// Animate floating icons
let lastTime = performance.now();
let mouseOffsetX = 0;
let mouseOffsetY = 0;

// Project floating icon 3D position to 2D screen space
function projectFloatingIcon3D(x, y, z) {
  const radX = (rotateX * Math.PI) / 180;
  const radY = (rotateY * Math.PI) / 180;

  // Rotate Y (horizontal mouse)
  const cosY = Math.cos(radY);
  const sinY = Math.sin(radY);
  let x1 = x * cosY + z * sinY;
  let z1 = -x * sinY + z * cosY;
  const y1 = y;

  // Rotate X (vertical mouse)
  const cosX = Math.cos(radX);
  const sinX = Math.sin(radX);
  const y2 = y1 * cosX - z1 * sinX;
  const z2 = y1 * sinX + z1 * cosX;
  const x2 = x1;

  // Behind viewer - hide
  if (z2 >= -10) {
    return {
      x: -9999,
      y: -9999,
      scale: 0,
      opacity: 0,
      visible: false
    };
  }

  // Perspective projection: scale toward vanishing point
  const scale = PERSPECTIVE / (PERSPECTIVE - z2);

  const projX = x2 * scale;
  const projY = y2 * scale;

  // Back to screen coords (center origin)
  const screenX = window.innerWidth / 2 + projX;
  const screenY = window.innerHeight / 2 + projY;

  // Depth-based opacity (fade into infinity)
  const depthNorm = Math.max(0, Math.min(1, (-z2 - 150) / (Math.abs(VANISH_Z) - 150)));
  const opacity = 0.2 + 0.3 * (1 - depthNorm); // Base opacity 0.2-0.5

  return {
    x: screenX - 30, // center 60px icon
    y: screenY - 30,
    scale: Math.max(0.1, Math.min(1.0, scale)),
    opacity: Math.min(opacity, 0.5), // Cap at 0.5 for background icons
    visible: true
  };
}

function animateFloatingIcons(currentTime) {
  const deltaTime = (currentTime - lastTime) / 1000; // Convert to seconds
  lastTime = currentTime;
  

  // 1. Calculate travel if active (by default it's active)
  if (!isTravelMode) {
    travelDistance += TRAVEL_SPEED * deltaTime;
  }

  // 2. Update grid offset (GPU-composited via transform on ::before)
  if (grid) {
    const moveX = (mouseOffsetX * 100) % 100;
    const moveY = (mouseOffsetY * 100 + travelDistance) % 100;
    grid.style.setProperty('--grid-x', `${moveX}px`);
    grid.style.setProperty('--grid-y', `${moveY}px`);
  }




  // Animate creed cross horizontal bar
  const creedTime = currentTime / 1000;
  creedHorizontalData.forEach(data => {
    const moveX = Math.sin(creedTime * data.speedX + data.phaseX) * data.amplitudeX
      + mouseOffsetX * 8 * data.parallaxDepth;
    const moveY = Math.sin(creedTime * data.speedY + data.phaseY) * data.amplitudeY
      + mouseOffsetY * 8 * data.parallaxDepth;
    data.element.style.transform = `translate(${moveX}px, ${moveY}px)`;
  });

  floatingIconsData.forEach(data => {
    // Update position along grid line in 3D space
    data.position += data.speed * deltaTime;
    
    // Bounce back when reaching range limits
    if (data.position > data.range / 2) {
      data.position = data.range / 2;
      data.speed = -Math.abs(data.speed); // Reverse direction
    } else if (data.position < -data.range / 2) {
      data.position = -data.range / 2;
      data.speed = Math.abs(data.speed); // Reverse direction
    }
    
    // Calculate movement along grid line (only X or Y, not both)
    let offsetX = 0;
    let offsetY = 0;
    
    if (data.direction === 0) {
      // Horizontal movement (along X axis, Y stays on grid line)
      offsetX = data.position;
      offsetY = 0;
    } else {
      // Vertical movement (along Y axis, X stays on grid line)
      offsetX = 0;
      offsetY = data.position;
    }
    
    // Add parallax effect in 3D space
    const parallaxX = mouseOffsetX * 15 * data.parallaxDepth;
    const parallaxY = mouseOffsetY * 15 * data.parallaxDepth;
    
    // Calculate 3D position: base + grid movement + parallax
    const x3D = data.baseX + offsetX + parallaxX;
    const y3D = data.baseY + offsetY + parallaxY;
    const z3D = data.baseZ;
    
    // Project 3D position to 2D screen space with rotation
    const projected = projectFloatingIcon3D(x3D, y3D, z3D);
    
    if (projected.visible) {
      // Update screen position
      data.element.style.left = `${projected.x}px`;
      data.element.style.top = `${projected.y}px`;
      data.element.style.transform = `scale(${projected.scale})`;
      data.element.style.opacity = projected.opacity;
      data.element.style.visibility = 'visible';
      data.element.style.pointerEvents = 'none';
    } else {
      // Hide if behind viewer
      data.element.style.visibility = 'hidden';
      data.element.style.pointerEvents = 'none';
    }
  });
  
  requestAnimationFrame(animateFloatingIcons);
}

// Start animation loop
requestAnimationFrame(animateFloatingIcons);


function adjustForMobile() {
  const isMobile = isMobile();
  
  iconPositions.forEach((pos, index) => {

    // Mobile: Stack them more vertically and center-aligned
    // This prevents them from flying off the left/right edges
    if (isMobile) {
      // 50 is the exact center of the screen
      // We only sway by 15% to either side to keep icons from hitting the edges
      pos.left = 50 + (index % 2 === 0 ? -15 : 15); 
      // Spread them out more vertically (Top % values)
      pos.top = 15 + (index * 14); 
      // Push them slightly further back to compensate for the narrow view
      pos.z = -400 - (index * 250);
    } else {
      // Desktop: Restore your original spread-out layout
      // You can copy-paste your original iconPositions values here
      const originals = [
        { top: 30, left: 30, z: -300 },
        { top: 50, left: 60, z: -600 },
        { top: 70, left: 40, z: -900 },
        { top: 20, left: 70, z: -1200 },
        { top: 95, left: 95, z: -150 },
        { top: 95, left: 5, z: -450 }
      ];
      pos.top = originals[index].top;
      pos.left = originals[index].left;
      pos.z = originals[index].z;
    }
  });
}

// Set up runtime
adjustForMobile();

// Event listener each resize
window.addEventListener('resize', () => {
  adjustForMobile();
})

// X>
console.log("Welcome to my 'Scape!");
