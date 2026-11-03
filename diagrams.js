// Project diagrams for the stage cards. Each entry returns an SVG string drawn
// from what the repository actually does -- state names, module names and buffer
// sizes come from the source, not from the blurb on the card.
//
// window.FW_DIAGRAMS[key]() -> svg string
(function () {
  var C = {
    line: '#3b4799', hot: '#1F3BFF', txt: '#A8B4F5', hi: '#E8E2CF',
    mut: '#6a74b0', red: '#E8343F', fill: '#05081a', bar: '#0c1240',
  };
  var W = 760;

  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

  function tx(x, y, t, o) {
    o = o || {};
    return '<text x="' + x + '" y="' + y + '" fill="' + (o.fill || C.txt) + '" font-size="' + (o.size || 11)
      + '" text-anchor="' + (o.anchor || 'start') + '"' + (o.weight ? ' font-weight="' + o.weight + '"' : '') + '>' + esc(t) + '</text>';
  }

  // A labelled box. accent = this is where the interesting thing happens.
  function box(o) {
    var h = o.h || 42, stroke = o.bad ? C.red : o.accent ? C.hot : C.line;
    var s = '<rect x="' + o.x + '" y="' + o.y + '" width="' + o.w + '" height="' + h + '" rx="1" fill="'
      + (o.fill || C.fill) + '" stroke="' + stroke + '" stroke-width="1"'
      + (o.dash ? ' stroke-dasharray="4 3"' : '') + '/>';
    var cx = o.x + o.w / 2;
    s += tx(cx, o.sub ? o.y + h / 2 - 2 : o.y + h / 2 + 4, o.t, { anchor: 'middle', size: 12, fill: o.bad ? C.red : o.accent ? C.hi : C.txt });
    if (o.sub) s += tx(cx, o.y + h / 2 + 12, o.sub, { anchor: 'middle', size: 10, fill: C.mut });
    return s;
  }

  // Dashed group frame with a caption sitting on its top edge.
  function group(x, y, w, h, label) {
    return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" fill="none" stroke="' + C.line
      + '" stroke-width="1" stroke-dasharray="2 4" opacity="0.7"/>'
      + '<rect x="' + (x + 10) + '" y="' + (y - 7) + '" width="' + (label.length * 6.2 + 10) + '" height="14" fill="#000"/>'
      + tx(x + 15, y + 4, label, { size: 10, fill: C.mut });
  }

  function line(d, id, o) {
    o = o || {};
    return '<path d="' + d + '" fill="none" stroke="' + (o.bad ? C.red : o.hot ? C.hot : C.line) + '" stroke-width="1"'
      + (o.dash ? ' stroke-dasharray="3 3"' : '')
      // both: arrowheads at each end, for a link that is travelled in either direction
      + (o.both ? ' marker-start="url(#' + id + (o.hot ? 'hr' : 'r') + ')"' : '')
      + (o.noArrow ? '' : ' marker-end="url(#' + id + (o.bad ? 'b' : o.hot ? 'h' : '') + ')"') + '/>';
  }
  function to(x1, y1, x2, y2, id, o) { return line('M' + x1 + ' ' + y1 + ' L' + x2 + ' ' + y2, id, o); }
  function lbl(x, y, t, o) { o = o || {}; o.size = o.size || 10; o.fill = o.fill || C.mut; return tx(x, y, t, o); }

  function svg(id, h, title, body) {
    var m = function (sfx, col) {
      return '<marker id="' + id + sfx + '" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto">'
        + '<path d="M0,0 L8,4 L0,8 z" fill="' + col + '"/></marker>';
    };
    var mr = function (sfx, col) {
      return '<marker id="' + id + sfx + '" viewBox="0 0 8 8" refX="1" refY="4" markerWidth="7" markerHeight="7" orient="auto">'
        + '<path d="M8,0 L0,4 L8,8 z" fill="' + col + '"/></marker>';
    };
    return '<svg viewBox="0 0 ' + W + ' ' + h + '" width="100%" style="display:block;height:auto;min-width:660px;font-family:inherit" role="img" aria-label="' + esc(title) + '">'
      + '<title>' + esc(title) + '</title>'
      + '<defs>' + m('', C.line) + m('h', C.hot) + m('b', C.red) + mr('r', C.line) + mr('hr', C.hot) + '</defs>'
      + body + '</svg>';
  }

  var D = {};

  // PacketProcessor.v -- the six-state packet FSM plus the datapath it drives.
  D.packetprocessor = function () {
    var id = 'fwpp', b = '';
    var y = 40, h = 42;
    b += box({ x: 16, y: y, w: 110, h: h, t: 'IDLE', accent: 1 });
    b += box({ x: 186, y: y, w: 126, h: h, t: 'READ_BYTE', sub: 'shift 1 bit' });
    b += box({ x: 372, y: y, w: 126, h: h, t: 'WRITE_FIFO' });
    b += box({ x: 558, y: y, w: 150, h: h, t: 'CHECK_CHECKSUM' });
    // transitions sit above the row so they never land on a box
    b += to(126, y + 21, 184, y + 21, id);
    b += lbl(155, y - 8, 'i_udp_data', { anchor: 'middle' });
    b += to(312, y + 21, 370, y + 21, id);
    b += lbl(341, y - 8, 'bit_count==7', { anchor: 'middle' });
    b += to(498, y + 21, 556, y + 21, id);
    b += lbl(527, y - 8, 'byte_count==4', { anchor: 'middle' });
    b += line('M435 ' + y + ' L435 16 L249 16 L249 ' + (y - 2), id);
    b += lbl(342, 12, 'else → push byte to fifo', { anchor: 'middle' });

    var y2 = 130;
    b += box({ x: 558, y: y2, w: 150, h: h, t: 'SEND_TO_W5500', sub: 'while fifo has data' });
    b += box({ x: 372, y: y2, w: 126, h: h, t: 'DROP_PACKET', sub: 'fifo discarded', bad: 1 });
    b += to(633, y + h, 633, y2 - 2, id);
    b += lbl(641, y + h + 16, 'checksum_valid');
    // route the reject path through the gap between the two rows
    b += line('M580 ' + (y + h) + ' L580 104 L435 104 L435 ' + (y2 - 2), id, { bad: 1 });
    b += lbl(445, 100, '!valid', { fill: C.red });
    b += line('M435 ' + (y2 + h) + ' L435 196', id, { noArrow: 1, bad: 1 });
    b += line('M633 ' + (y2 + h) + ' L633 196', id, { noArrow: 1 });
    b += line('M633 196 L71 196 L71 ' + (y + h + 2), id, { hot: 1 });
    b += lbl(86, 190, 'fifo_empty → flush, back to IDLE', { fill: C.txt });

    var y3 = 222;
    b += group(16, y3, 728, 56, 'datapath');
    var xs = [26, 146, 266, 386, 506, 626], d = [
      ['i_udp_data', 'serial in'], ['byte_buffer', '8-bit shift'], ['FIFO_RAM', '16b × 4096'],
      ['checksum', 'udp word'], ['W5500Driver', 'spi, 7 states'], ['ethernet', 'egress'],
    ];
    d.forEach(function (p, i) {
      b += box({ x: xs[i], y: y3 + 10, w: 108, h: 36, t: p[0], sub: p[1], fill: C.bar });
      if (i) b += to(xs[i] - 12, y3 + 28, xs[i] - 2, y3 + 28, id);
    });
    b += tx(16, 300, 'Bad packets never reach the wire: the FIFO is dropped instead of forwarded.', { size: 10, fill: C.mut });
    return svg(id, 310, 'PacketProcessor packet state machine and datapath', b);
  };

  // RadSurv -- IR trigger out to the alert node and the bridge, as the firmware runs it.
  D.radsurv = function () {
    var id = 'fwrs', b = '';
    b += box({ x: 16, y: 40, w: 104, h: 40, t: 'IR module', sub: 'IRM_PIN 12' });
    b += box({ x: 156, y: 40, w: 150, h: 40, t: 'transmitter.ino', sub: 'ATmega + nRF24', accent: 1 });
    b += to(120, 60, 154, 60, id);
    b += lbl(122, 34, 'LOW→HIGH edge');

    b += group(366, 14, 378, 92, 'alert node · receiver.ino');
    b += box({ x: 378, y: 30, w: 166, h: 40, t: 'TaskRFRecv', sub: 'HIGH · producer' });
    b += box({ x: 566, y: 30, w: 166, h: 40, t: 'TaskAlertMod', sub: 'LOW · consumer' });
    b += to(544, 50, 564, 50, id, { hot: 1 });
    b += lbl(500, 86, 'xSemaphoreTake → GLOBAL_ALERT → buzzer', { fill: C.txt });
    b += to(306, 56, 364, 38, id);
    b += lbl(312, 30, 'RF');

    b += group(16, 142, 728, 96, 'bridge + server');
    var y = 166, xs = [28, 212, 400, 588], d = [
      ['rf_to_server.py', 'pigpio + nrf24'], ['SharedQueue', 'depth 32'],
      ['build_packet', 'on almost_full'], ['server.py', 'TCP · db/ + log/'],
    ];
    d.forEach(function (p, i) {
      b += box({ x: xs[i], y: y, w: 160, h: 44, t: p[0], sub: p[1], accent: i === 2 });
      if (i) b += to(xs[i] - 22, y + 22, xs[i] - 2, y + 22, id);
    });
    b += line('M231 80 L231 120 L108 120 L108 164', id);
    b += lbl(238, 112, 'nRF24 · 250 kbps · channel 100 · dynamic payload', { fill: C.txt });
    b += tx(16, 262, 'The radio tasks are a producer/consumer pair: the receive task owns the alert flag,', { size: 10, fill: C.mut });
    b += tx(16, 276, 'the alert task only ever reads it behind the mutex.', { size: 10, fill: C.mut });
    return svg(id, 288, 'RadSurv node topology and RTOS task handoff', b);
  };

  // eIRC -- tracker hands out nodes; the node is the room.
  D.eirc = function () {
    var id = 'fwei', b = '';
    // A client attaches to either the Tracker or a Node directly, and moves between
    // them freely -- the Tracker is a registry, not a gateway.
    b += box({ x: 16, y: 86, w: 120, h: 48, t: 'client', sub: 'client.py' });
    b += box({ x: 270, y: 28, w: 220, h: 48, t: 'Tracker', sub: 'ledger + port alloc' });
    b += box({ x: 270, y: 150, w: 220, h: 48, t: 'Node', sub: 'the room itself', accent: 1 });
    b += line('M138 100 L268 58', id, { both: 1 });
    b += line('M138 120 L268 166', id, { both: 1, hot: 1 });
    b += tx(16, 156, 'attach to either,', { size: 10, fill: C.txt });
    b += tx(16, 170, 'hop back and forth', { size: 10, fill: C.txt });
    b += to(380, 76, 380, 148, id);
    b += lbl(392, 116, '/create spawns · /register adds a remote node');
    b += box({ x: 540, y: 150, w: 204, h: 48, t: 'oselot-goes', sub: 'publishes [OSELOT] lines', dash: 1 });
    b += to(538, 174, 492, 174, id);

    b += group(16, 218, 728, 152, 'per connection · node.cpp');
    var y = 236, d = [
      ['USER handshake', 'raw ascii nick'], ['std::thread', 'one per client'],
      ['unpack_packet', 'header | body | date'], ['CommandHandler', 'dispatch'],
    ], xs = [28, 209, 390, 571];
    d.forEach(function (p, i) {
      b += box({ x: xs[i], y: y, w: 160, h: 44, t: p[0], sub: p[1], fill: C.bar, accent: i === 3 });
      if (i) b += to(xs[i] - 19, y + 22, xs[i] - 2, y + 22, id);
    });
    // the command module is rebuilt and swapped under a running node
    b += box({ x: 571, y: 312, w: 160, h: 44, t: 'node_commands', sub: 'hot-swap, no restart', accent: 1, dash: 1 });
    b += line('M651 310 L651 282', id, { both: 1, hot: 1 });
    b += box({ x: 28, y: 312, w: 350, h: 44, t: '/users  /whisper  /current  /leave  /oselot', sub: 'the set the module defines', fill: '#000' });
    b += to(569, 334, 382, 334, id);

    b += tx(16, 388, 'The Tracker is a registry, not a gateway: a client can sit on it, jump straight to a Node, and come back.', { size: 10, fill: C.mut });
    b += tx(16, 402, 'Nodes have no channels -- the Node is the room -- and its command set is swapped while it keeps running.', { size: 10, fill: C.mut });
    return svg(id, 412, 'eIRC tracker, nodes, client hopping and hot-swapped command modules', b);
  };

  // OSELOT -- the watcher pipeline, then the chunked transfer protocol beneath it.
  D.oselot = function () {
    var id = 'fwos', b = '';
    var y = 30, d = [
      ['SDR + LRIT', '1694.1 MHz'], ['goesproc', 'decode'], ['watch dir', '.jpg + .json'],
      ['watcher.py', 'inotify | poll'], ['pair + settle', 'quiescent check'],
    ], xs = [16, 166, 310, 454, 606];
    d.forEach(function (p, i) {
      b += box({ x: xs[i], y: y, w: i === 4 ? 138 : 128, h: 42, t: p[0], sub: p[1], accent: i === 3 });
      if (i) b += to(xs[i] - 22, y + 21, xs[i] - 2, y + 21, id);
    });

    b += box({ x: 166, y: 112, w: 190, h: 42, t: 'transport_scp', sub: 'scp → archive host' });
    b += box({ x: 414, y: 112, w: 230, h: 42, t: 'transport_irc_chunked', sub: '[OSELOT-XFER] over the node', accent: 1 });
    b += line('M675 72 L675 92 L261 92 L261 110', id);
    b += line('M675 92 L529 92 L529 110', id, { hot: 1 });
    b += lbl(16, 96, 'image_method', { fill: C.mut });
    b += box({ x: 166, y: 180, w: 478, h: 36, t: 'eIRC Node · 6667 · nick oselot-goes', sub: 'metadata line capped at 450 chars', fill: C.bar });
    b += to(261, 154, 261, 178, id);
    b += to(529, 154, 529, 178, id, { hot: 1 });

    var y3 = 252;
    b += group(16, y3, 728, 74, 'irc_chunked_receiver · reassembly');
    var st = [
      ['BEGIN', 'size · chunks · sha256'], ['CHUNK n/N', '× N ascending, base64'],
      ['END', 'status=ok|fail'], ['verify sha256', 'compare digest'], ['write file', 'or abort'],
    ], xs3 = [26, 176, 326, 458, 610];
    st.forEach(function (p, i) {
      b += box({ x: xs3[i], y: y3 + 16, w: i === 3 ? 134 : 134, h: 42, t: p[0], sub: p[1], accent: i === 3 });
      if (i) b += to(xs3[i] - 14, y3 + 37, xs3[i] - 2, y3 + 37, id);
    });
    b += to(405, 216, 405, 250, id);
    b += tx(16, 344, 'A BEGIN already in flight is replaced, gaps are tolerated, and only a matching digest writes a file.', { size: 10, fill: C.mut });
    return svg(id, 354, 'OSELOT image pipeline and chunked transfer protocol', b);
  };

  // Malware research -- anatomy of a self-rewriting sample, and what survives it.
  D['malware-research'] = function () {
    var id = 'fwmw', b = '';
    function gen(x, label, bytes) {
      var s = box({ x: x, y: 36, w: 212, h: 112, t: '', fill: C.fill });
      s += tx(x + 106, 54, label, { anchor: 'middle', size: 11, fill: C.mut });
      s += box({ x: x + 14, y: 64, w: 184, h: 34, t: 'decryptor stub', sub: bytes, accent: 1, fill: C.bar });
      s += box({ x: x + 14, y: 104, w: 184, h: 34, t: 'encrypted body', sub: 'same behaviour', fill: '#000' });
      return s;
    }
    b += gen(16, 'generation N', 'key A · layout A');
    b += gen(532, 'generation N+1', 'key B · layout B');
    b += box({ x: 268, y: 42, w: 216, h: 38, t: 'stub decrypts body', sub: 'in memory only' });
    b += box({ x: 268, y: 100, w: 216, h: 48, t: 'mutation engine', sub: 're-key, reorder, re-emit stub', accent: 1 });
    b += to(228, 62, 266, 62, id);
    b += to(376, 80, 376, 98, id);
    b += line('M484 124 L510 124 L510 92 L530 92', id, { hot: 1 });
    b += lbl(492, 162, 'new bytes on disk every generation', { fill: C.txt });

    var y = 206;
    b += group(16, y, 728, 76, 'what the rewrite cannot hide');
    var inv = [['entropy profile', 'packed sections'], ['api call sequence', 'order survives'], ['unpacked image', 'identical at OEP'], ['behaviour under trace', 'same syscalls']];
    var xs = [26, 206, 386, 566];
    inv.forEach(function (p, i) { b += box({ x: xs[i], y: y + 18, w: 168, h: 42, t: p[0], sub: p[1], fill: '#000' }); });
    b += tx(16, 300, 'Studied in an isolated homelab. The point is detection, not production: every generation looks new,', { size: 10, fill: C.mut });
    b += tx(16, 314, 'and every generation still has to do the same thing to be worth writing.', { size: 10, fill: C.mut });
    return svg(id, 324, 'Anatomy of a polymorphic sample and its invariants', b);
  };

  // Reverse engineering -- the lab workflow, including the wasm track.
  D['reverse-engineering'] = function () {
    var id = 'fwre', b = '';
    var y = 36, d = [
      ['binary', 'unknown'], ['triage', 'entropy · strings · imports'], ['unpack by hand', 'break at OEP · dump · fix IAT'],
      ['disassemble', 'ghidra · x64dbg'],
    ], xs = [16, 152, 326, 536];
    var ws = [120, 154, 190, 160];
    d.forEach(function (p, i) {
      b += box({ x: xs[i], y: y, w: ws[i], h: 44, t: p[0], sub: p[1], accent: i === 2 });
      if (i) b += to(xs[i] - 14, y + 22, xs[i] - 2, y + 22, id);
    });
    b += lbl(282, y - 6, 'packed');
    b += line('M229 ' + y + ' L229 14 L616 14 L616 ' + (y - 2), id, { dash: 1 });
    b += lbl(380, 10, 'not packed');

    var y2 = 124;
    b += box({ x: 326, y: y2, w: 190, h: 44, t: 'locate validator', sub: 'xrefs from the fail path' });
    b += box({ x: 566, y: y2, w: 178, h: 44, t: 'recover algorithm', sub: 'rebuild from the stack', accent: 1 });
    // disassemble → locate validator → recover algorithm, in that order
    b += line('M616 ' + (y + 44) + ' L616 104 L421 104 L421 ' + (y2 - 2), id);
    b += to(516, y2 + 22, 564, y2 + 22, id, { hot: 1 });
    b += box({ x: 566, y: y2 + 70, w: 178, h: 36, t: 'keygen or patch', fill: C.bar });
    b += to(655, y2 + 44, 655, y2 + 68, id);

    var y3 = 236;
    b += group(16, y3, 490, 62, 'wasm track');
    var wd = [['.wasm', 'shipped module'], ['wat', 'wasm2wat'], ['trace auth routine', 'locals + branch'], ['bypass', 'patch + rebuild']];
    var wx = [26, 142, 252, 400];
    wd.forEach(function (p, i) {
      b += box({ x: wx[i], y: y3 + 12, w: i === 2 ? 134 : 100, h: 38, t: p[0], sub: p[1], fill: '#000' });
      if (i) b += to(wx[i] - 12, y3 + 31, wx[i] - 2, y3 + 31, id);
    });
    b += tx(16, 318, 'Course labs and hackathon targets. Drawn from the workflow, not from any one lab write-up.', { size: 10, fill: C.mut });
    return svg(id, 328, 'Reverse engineering workflow including the WebAssembly track', b);
  };

  window.FW_DIAGRAMS = D;
})();
