(function () {
  'use strict'
  var $ = function (s, r) { return (r || document).querySelector(s) }
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)) }
  var esc = function (v) { return String(v).replace(/[&<>"']/g, function (c) {
    return { '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c] }) }
  var nb = function (n) { return Number(n).toLocaleString('fr-FR').replace(/ /g, ' ') }

  // Les palettes vivent dans le fichier de données : chaque marché a son
  // vocabulaire, le moteur se contente de peindre les pastilles.
  var COUL = {}; TOUTES_COULEURS.forEach(function (c) { COUL[c.nom] = c })

  var S = { sous:SOUS[0], titre:'', titreEdite:false, prix:'', nego:false, livr:false,
            etat:'occasion', photos:[], couleurs:[], variantes:{}, deplie:{}, pvCouleur:'', pvPhoto:0 }

  function schema() { return SCHEMAS[S.sous] }
  // 'etat' peut dépendre des réponses : un accessoire de beauté est neuf ou
  // d'occasion, un flacon de crème est scellé, ouvert ou entamé.
  function aEtat() { var e = schema().etat; return typeof e === 'function' ? e(S) : !!e }
  function aCouleurs() { var c = schema().couleurs; return typeof c === 'function' ? c(S) : !!c }
  function palette() { var p = schema().palette; return (typeof p === 'function' ? p(S) : p) || PALETTE_BASE }
  // Un libellé ou une aide peut dépendre des réponses : « teintes » pour un
  // rouge à lèvres, « coloris » pour un pagne, « couleurs » pour une robe.
  function texte(v, defaut) { return (typeof v === 'function' ? v(S) : v) || defaut || '' }
  function champs() {
    return schema().champs.filter(function (c) { return !c.when || c.when(S) })
  }
  function options(c) {
    if (!c.dependDe) return c.o || []
    var parent = S[c.dependDe]
    var liste = (c.table[parent] || []).slice()
    if (c.libre) liste.push(c.libre)
    return liste
  }
  function variante(nom) {
    if (!S.variantes[nom]) S.variantes[nom] = { photos:[], prix:'', note:'' }
    return S.variantes[nom]
  }
  function champsVar() { return champs().filter(function (c) { return c.varOK }) }

  var ICO = {
    x:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>',
    plus:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
    ok:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/></svg>',
    warn:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>',
    tick:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>',
    bad:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M5.6 5.6l12.8 12.8"/></svg>'
  }
  function past(c) {
    return '<span class="pastille' + (c.clair ? ' pastille--clair' : '') +
      '" aria-hidden="true" style="background:' + c.css + '"></span>'
  }

  /* -------------------- puces génériques -------------------- */
  function puces(box, opts, actif, onClic, avecPastille) {
    box.innerHTML = opts.map(function (o) {
      var c = avecPastille ? COUL[o] : null
      return '<button type="button" class="chip' + (c ? ' chip--pastille' : '') + '" data-v="' + esc(o) +
        '" aria-pressed="' + (actif(o) ? 'true' : 'false') + '">' + (c ? past(c) : '') + esc(o) + '</button>'
    }).join('')
    if (!box.dataset.lie) {
      box.dataset.lie = '1'
      box.addEventListener('click', function (e) {
        var b = e.target.closest('.chip'); if (b && b.dataset.v) onClic(b.dataset.v)
      })
    }
  }

  /* -------------------- le formulaire -------------------- */
  function rendreForm() {
    puces($('#cSous'), SOUS, function (o) { return S.sous === o }, function (v) {
      if (S.sous === v) return
      S.sous = v
      // Chaque sous-catégorie a ses champs : ceux de l'ancienne n'ont plus de
      // sens. On repart propre plutôt que de traîner un stockage sur un chargeur.
      schema().champs.forEach(function (c) { S[c.k] = c.multi ? [] : (c.t === 'toggle' ? false : '') })
      Object.keys(SCHEMAS).forEach(function (k) {
        SCHEMAS[k].champs.forEach(function (c) {
          if (!(c.k in S)) S[c.k] = c.multi ? [] : (c.t === 'toggle' ? false : '')
        })
      })
      S.couleurs = []; S.variantes = {}; S.pvCouleur = ''; S.deplie = {}
      S.titreEdite = false
      rendre()
    })

    var sc = schema()
    var liste = champs()
    var box = $('#champs')
    var sig = S.sous + '#' + liste.map(function (c) { return c.k }).join(',')
    if (box.dataset.sig !== sig) {
      box.dataset.sig = sig
      box.innerHTML = liste.map(function (c) {
        if (c.t === 'toggle') {
          return '<label class="toggle" data-k="' + c.k + '"><span>' + esc(c.l) +
            (c.h ? '<small>' + esc(c.h) + '</small>' : '') + '</span><input type="checkbox"></label>'
        }
        if (c.t === 'text' || c.t === 'num') {
          var champ = '<input class="input' + (c.t === 'num' ? ' tnum' : '') + '" id="f-' + c.k + '"' +
            (c.t === 'num' ? ' inputmode="numeric"' : '') + ' maxlength="70" placeholder="' + esc(c.ph || '') + '">'
          if (c.unite) champ = '<div class="unit">' + champ + '<span class="unit__u">' + esc(c.unite) + '</span></div>'
          return '<div class="field" data-k="' + c.k + '"><label class="lab" for="f-' + c.k + '">' + esc(c.l) +
            (c.req ? ' <span class="must">·&nbsp;obligatoire</span>' : '') + '</label>' + champ +
            (c.h ? '<p class="help" data-help></p>' : '') + '</div>'
        }
        return '<div class="field" data-k="' + c.k + '"><span class="lab" id="lc-' + c.k + '">' + esc(c.l) +
          (c.multi ? ' <span class="opt">· plusieurs choix possibles</span>' : '') +
          (c.req ? ' <span class="must">·&nbsp;obligatoire</span>' : '') + '</span>' +
          (c.h ? '<p class="help" data-help></p>' : '') +
          '<div class="chips" role="group" aria-labelledby="lc-' + c.k + '"></div>' +
          (c.libre ? '<input class="input hidden" data-libre="' + c.k + '" maxlength="60" placeholder="Écrivez-le exactement">' : '') +
          '</div>'
      }).join('')
      $$('.toggle input', box).forEach(function (i) {
        i.addEventListener('change', function () { S[i.closest('.toggle').dataset.k] = i.checked; rendre() })
      })
      $$('input[id^="f-"]', box).forEach(function (i) {
        i.addEventListener('input', function () {
          var num = i.inputMode === 'numeric'
          S[i.id.slice(2)] = num ? i.value.replace(/\D/g, '') : i.value
          if (num) i.value = S[i.id.slice(2)]
          composerTitre(); rendre()
        })
      })
      $$('[data-libre]', box).forEach(function (i) {
        i.addEventListener('input', function () { S[i.dataset.libre + 'Libre'] = i.value; composerTitre(); rendre() })
      })
    }

    liste.forEach(function (c) {
      var cel = box.querySelector('[data-k="' + c.k + '"]')
      if (!cel) return
      // L'aide peut être une fonction : elle se recalcule à chaque frappe. C'est
      // ainsi que le kilométrage se compare tout seul à l'âge du véhicule.
      var aide = cel.querySelector('[data-help]')
      if (aide) {
        var txt = typeof c.h === 'function' ? c.h(S) : c.h
        aide.innerHTML = txt || ''
        aide.classList.toggle('help--alerte', /^!/.test(txt || ''))
        if (/^!/.test(txt || '')) aide.innerHTML = txt.slice(1)
      }
      if (c.t === 'toggle') { cel.querySelector('input').checked = !!S[c.k]; return }
      if (c.t === 'text' || c.t === 'num') { var it = cel.querySelector('input'); if (document.activeElement !== it) it.value = S[c.k] || ''; return }

      var opts = options(c)
      var d = cel.querySelector('.chips')
      // Un champ dépendant reste muet tant que son parent n'a pas été choisi :
      // proposer des modèles sans marque n'aurait aucun sens.
      if (c.dependDe && !S[c.dependDe]) { cel.classList.add('hidden'); return }
      cel.classList.remove('hidden')

      // Longue liste : douze d'abord, le reste se déplie. Vingt-neuf puces
      // d'un coup font un mur sur un téléphone.
      var COURT = 12
      var replie = opts.length > COURT + 2 && !S.deplie[c.k] && opts.indexOf(S[c.k]) < COURT
      var montrees = replie ? opts.slice(0, COURT).concat(c.libre ? [c.libre] : []) : opts
      puces(d, montrees, function (o) { return c.multi ? (S[c.k] || []).indexOf(o) > -1 : S[c.k] === o }, function (v) {
        if (c.multi) { S[c.k] = S[c.k] || []; var i = S[c.k].indexOf(v); if (i > -1) S[c.k].splice(i, 1); else S[c.k].push(v) }
        else {
          var avant = S[c.k]
          S[c.k] = avant === v ? '' : v
          // Changer de marque vide le modèle : un iPad sous Samsung n'existe pas.
          liste.forEach(function (x) { if (x.dependDe === c.k && avant !== S[c.k]) { S[x.k] = ''; S[x.k + 'Libre'] = ''; S.deplie[x.k] = false } })
        }
        composerTitre(); rendre()
      })
      if (replie) {
        var b = document.createElement('button')
        b.type = 'button'; b.className = 'chip chip--plus'
        b.textContent = '+ ' + (opts.length - COURT - (c.libre ? 1 : 0)) + ' autres'
        b.addEventListener('click', function () { S.deplie[c.k] = true; rendre() })
        d.appendChild(b)
      }
      var lib = cel.querySelector('[data-libre]')
      if (lib) {
        lib.classList.toggle('hidden', S[c.k] !== c.libre)
        if (document.activeElement !== lib) lib.value = S[c.k + 'Libre'] || ''
      }
    })

    // sections dépendant du schéma
    $('#hCoul').textContent = sc.aideCouleurs ||
      'Cochez chaque couleur que vous avez. Ouvrez-la ensuite pour lui donner ses photos, son prix et ses détails.'
    $('#fEtat').classList.toggle('hidden', !aEtat())
    $('#fLivr').classList.toggle('hidden', !sc.livraison)
    $('#labPrix').textContent = sc.prixLabel || 'Prix'
    puces($('#cEtat'), ['occasion', 'neuf'], function (o) { return S.etat === o }, function (v) { S.etat = v; rendre() })
  }

  function composerTitre() {
    if (S.titreEdite) return
    S.titre = schema().titre(S)
    var i = $('#iTitre'); if (document.activeElement !== i) i.value = S.titre
  }

  /* -------------------- photos -------------------- */
  function lireFichiers(files, cible) {
    Array.prototype.slice.call(files).slice(0, 5).forEach(function (f) {
      var r = new FileReader()
      r.onload = function () { if (cible.length < 5) { cible.push(r.result); rendre() } }
      r.readAsDataURL(f)
    })
  }
  function rendrePhotos(box, tab, couv) {
    box.innerHTML = tab.map(function (src, i) {
      return '<div class="ph"><img src="' + src + '" alt=""><button type="button" class="ph__x" data-i="' + i +
        '" aria-label="Retirer la photo ' + (i + 1) + '">' + ICO.x + '</button><span class="ph__n">' +
        (i + 1) + (couv && i === 0 ? ' · couv.' : '') + '</span></div>'
    }).join('') + (tab.length < 5 ? '<button type="button" class="ph ph--add" aria-label="Ajouter des photos">' + ICO.plus + '</button>' : '')
    if (!box.dataset.lie) {
      box.dataset.lie = '1'
      box.addEventListener('click', function (e) {
        var x = e.target.closest('.ph__x')
        if (x) { tab.splice(Number(x.dataset.i), 1); rendre(); return }
        if (e.target.closest('.ph--add')) {
          var inp = document.createElement('input')
          inp.type = 'file'; inp.accept = 'image/*'; inp.multiple = true
          inp.onchange = function () { lireFichiers(inp.files, tab) }
          inp.click()
        }
      })
    }
  }

  /* -------------------- couleurs et variantes -------------------- */
  function rendreCouleurs() {
    // Les photos ne dépendent pas des couleurs : même un service en a besoin.
    rendrePhotos($('#phGen'), S.photos, true)
    var sc = schema()
    var ok = aCouleurs()
    var box = $('#variantes')
    $('#tCoul').textContent = ok ? '2. Photos et couleurs' : '2. Photos'
    $('#fCoul').classList.toggle('hidden', !ok)
    $('#hCoul').textContent = ok
      ? texte(sc.aideCouleurs, 'Cochez chaque couleur que vous avez. Ouvrez-la ensuite pour lui donner ses photos, son prix et ses détails.')
      : texte(sc.sansCouleur, 'La première photo sert de couverture.')
    $('#hPhotos').textContent = ok ? 'Vues générales, valables pour toutes les couleurs.' : ''
    if (!ok) {
      S.couleurs = []; S.variantes = {}; S.pvCouleur = ''
      box.innerHTML = ''; box.dataset.sig = ''
      return
    }

    var noms = palette().map(function (c) { return c.nom })
    // Changer de produit change la palette : une teinte « Caramel » cochée pour
    // un fond de teint n'a plus de sens sur un vernis à ongles.
    S.couleurs = S.couleurs.filter(function (n) {
      if (noms.indexOf(n) > -1) return true
      delete S.variantes[n]; return false
    })
    if (S.couleurs.indexOf(S.pvCouleur) < 0) S.pvCouleur = S.couleurs[0] || ''

    $('#l-coul').textContent = texte(sc.labCouleurs, 'Couleurs disponibles')
    var aideCh = texte(sc.aideCoulChamp, '')
    $('#hCoulAide').textContent = aideCh
    $('#hCoulAide').classList.toggle('hidden', !aideCh)
    puces($('#cCoul'), noms,
      function (o) { return S.couleurs.indexOf(o) > -1 },
      function (v) {
        var i = S.couleurs.indexOf(v)
        if (i > -1) { S.couleurs.splice(i, 1); delete S.variantes[v] } else { S.couleurs.push(v); variante(v) }
        if (S.couleurs.indexOf(S.pvCouleur) < 0) S.pvCouleur = S.couleurs[0] || ''
        rendre()
      }, true)

    if (!S.couleurs.length) { box.innerHTML = ''; box.dataset.sig = ''; return }
    var cv = champsVar()
    var sig = S.sous + '#' + S.couleurs.join('|') + '#' + cv.map(function (c) { return c.k }).join(',')
    if (box.dataset.sig !== sig) {
      box.dataset.sig = sig
      box.innerHTML = '<p class="help" style="margin-bottom:9px">Ouvrez une couleur pour lui donner <b>ses photos, son prix et ses détails</b>. Tout est facultatif : sans rien préciser, elle reprend ceux de l’annonce.</p>' +
        S.couleurs.map(function (nom) {
          var ch = cv.map(function (x) {
            return '<div class="field" data-vk="' + x.k + '"><span class="lab" id="lv-' + esc(nom) + '-' + x.k + '">' +
              esc(x.lVar || x.l) + '</span><div class="chips" role="group" aria-labelledby="lv-' + esc(nom) + '-' + x.k + '"></div></div>'
          }).join('')
          return '<div class="var" data-nom="' + esc(nom) + '" data-open="0">' +
            '<button type="button" class="var__h">' + past(COUL[nom]) + esc(nom) +
              '<span class="var__badge var__badge--vide"></span><span class="var__chev" aria-hidden="true"></span></button>' +
            '<div class="var__body">' +
              '<div class="field"><span class="var__ss">Photos de cette couleur</span><div class="photos" data-vphotos></div>' +
              '<p class="help">Sans photo propre, cette couleur montre celles de l’annonce.</p></div>' +
              '<div class="g2"><div class="field"><span class="lab">Prix de cette couleur</span>' +
              '<div class="unit"><input class="input tnum" data-vprix inputmode="numeric" placeholder="Comme l’annonce"><span class="unit__u">FCFA</span></div></div>' +
              '<div class="field"><span class="lab">Détail court</span><input class="input" data-vnote maxlength="60" placeholder="Ex : dernière pièce"></div></div>' +
              (ch ? '<div class="var__ss">Ses caractéristiques <span style="text-transform:none;letter-spacing:0;font-weight:500">— vide = comme l’annonce</span></div>' + ch : '') +
            '</div></div>'
        }).join('')
      $$('.var__h', box).forEach(function (h) {
        h.addEventListener('click', function () {
          var v = h.closest('.var'); v.dataset.open = v.dataset.open === '1' ? '0' : '1'
        })
      })
    }

    $$('.var', box).forEach(function (el) {
      var nom = el.dataset.nom, v = variante(nom)
      rendrePhotos(el.querySelector('[data-vphotos]'), v.photos, false)
      var ip = el.querySelector('[data-vprix]')
      if (!ip.dataset.lie) { ip.dataset.lie = '1'
        ip.addEventListener('input', function () { v.prix = ip.value.replace(/\D/g, ''); ip.value = v.prix; rendre() }) }
      if (document.activeElement !== ip) ip.value = v.prix
      var inote = el.querySelector('[data-vnote]')
      if (!inote.dataset.lie) { inote.dataset.lie = '1'
        inote.addEventListener('input', function () { v.note = inote.value; rendre() }) }
      if (document.activeElement !== inote) inote.value = v.note

      cv.forEach(function (x) {
        var d = el.querySelector('[data-vk="' + x.k + '"] .chips'); if (!d) return
        // Pour une couleur, on ne propose que ce que le vendeur a déjà coché
        // plus haut : s'il a du S, M et L, le rouge ne peut pas exister en 3XL.
        var restreint = x.multi && (S[x.k] || []).length
        if (restreint && (v[x.k] || []).length) {
          v[x.k] = v[x.k].filter(function (o) { return S[x.k].indexOf(o) > -1 })
        }
        var opts = x.t === 'toggle' ? ['Oui', 'Non'] : (restreint ? S[x.k].slice() : options(x))
        puces(d, opts, function (o) { return x.multi ? (v[x.k] || []).indexOf(o) > -1 : v[x.k] === o }, function (val) {
          if (x.multi) { v[x.k] = v[x.k] || []; var i = v[x.k].indexOf(val); if (i > -1) v[x.k].splice(i, 1); else v[x.k].push(val) }
          else v[x.k] = v[x.k] === val ? '' : val
          rendre()
        })
      })

      var bits = []
      if (v.photos.length) bits.push(v.photos.length + (v.photos.length > 1 ? ' photos' : ' photo'))
      if (v.prix) bits.push(nb(v.prix) + ' F')
      var n = cv.filter(function (x) { return x.multi ? (v[x.k] || []).length : v[x.k] }).length
      if (n) bits.push(n + (n > 1 ? ' détails' : ' détail'))
      if (v.note) bits.push('note')
      var b = el.querySelector('.var__badge')
      b.textContent = bits.length ? bits.join(' · ') : 'comme l’annonce'
      b.classList.toggle('var__badge--vide', !bits.length)
    })
  }

  /* -------------------- ce qui manque -------------------- */
  function manques() {
    var m = []
    if (!S.titre.trim() && !$('#iTitre').value.trim()) m.push('le titre')
    champs().forEach(function (c) {
      if (!c.req) return
      var v = S[c.k]
      var vide = c.multi ? !(v || []).length : !String(v || '').trim()
      if (!vide && c.libre && v === c.libre && !String(S[c.k + 'Libre'] || '').trim()) vide = true
      if (vide) m.push(c.l.toLowerCase())
    })
    if (!S.prix) m.push((schema().prixLabel || 'le prix').toLowerCase())
    return m
  }

  // Certaines réponses ne manquent pas : elles interdisent la publication.
  // Autant le dire tout de suite plutôt qu'après le retrait de l'annonce.
  function blocages() {
    return champs().filter(function (c) {
      return c.bloque && c.bloque.indexOf(S[c.k]) > -1
    }).map(function (c) { return c.motifBloc || c.l })
  }

  /* -------------------- aperçu acheteur -------------------- */
  function eff(k, multi) {
    var v = S.pvCouleur ? (S.variantes[S.pvCouleur] || {})[k] : null
    if (multi) return (v && v.length) ? v : (S[k] || [])
    return v || S[k]
  }
  function photosMontrees() {
    var v = S.pvCouleur ? (S.variantes[S.pvCouleur] || {}) : null
    return (v && v.photos && v.photos.length) ? v.photos : S.photos
  }
  function prixMontre() {
    var v = S.pvCouleur ? (S.variantes[S.pvCouleur] || {}) : null
    return (v && v.prix) ? Number(v.prix) : (S.prix ? Number(S.prix) : null)
  }
  function prixMini() {
    var t = S.couleurs.map(function (n) { return Number((S.variantes[n] || {}).prix || 0) }).filter(Boolean)
    if (S.prix) t.push(Number(S.prix))
    return t.length ? Math.min.apply(null, t) : null
  }

  function rendreApercu() {
    var sc = schema()
    if (S.couleurs.length && !S.pvCouleur) S.pvCouleur = S.couleurs[0]
    if (!S.couleurs.length) S.pvCouleur = ''
    var ph = photosMontrees()
    if (S.pvPhoto >= ph.length) S.pvPhoto = 0

    var g = $('#gal')
    g.innerHTML = ph.length
      ? '<img src="' + ph[S.pvPhoto] + '" alt="">' +
        (S.pvCouleur && (S.variantes[S.pvCouleur] || {}).photos.length ? '<span class="gal__n">' + esc(S.pvCouleur) + '</span>' : '') +
        (ph.length > 1 ? '<span class="gal__nav">' + ph.map(function (_, i) {
          return '<button type="button" class="gal__dot" data-i="' + i + '" aria-current="' + (i === S.pvPhoto) +
            '" aria-label="Photo ' + (i + 1) + '"></button>' }).join('') + '</span>' : '')
      : '<div class="gal__vide">Ajoutez des photos dans le formulaire : elles apparaîtront ici, et changeront selon la couleur choisie.</div>'
    if (!g.dataset.lie) { g.dataset.lie = '1'
      g.addEventListener('click', function (e) {
        var d = e.target.closest('.gal__dot'); if (d) { S.pvPhoto = Number(d.dataset.i); rendre() } }) }

    $('#pvT').textContent = $('#iTitre').value || S.titre || 'Votre titre apparaîtra ici'
    var p = prixMontre(), mini = prixMini()
    var multiPrix = S.couleurs.filter(function (n) { return (S.variantes[n] || {}).prix }).length > 0 && S.couleurs.length > 1
    $('#pvPrix').textContent = p ? (sc.prixLabel ? 'À partir de ' : '') + nb(p) + ' FCFA' : 'Prix à indiquer'
    $('#pvNego').textContent = [
      multiPrix && mini && mini !== p ? 'à partir de ' + nb(mini) + ' FCFA' : '',
      S.nego ? 'négociable' : ''
    ].filter(Boolean).join(' · ')

    var pc = $('#pvCoul')
    if (S.couleurs.length) {
      pc.innerHTML = '<span class="pv__l">Couleur' + (S.couleurs.length > 1 ? 's disponibles' : '') + ' — touchez pour voir</span>' +
        '<div class="swatches">' + S.couleurs.map(function (n) {
          var v = S.variantes[n] || {}
          return '<button type="button" class="sw" data-n="' + esc(n) + '" aria-pressed="' + (S.pvCouleur === n) + '">' +
            past(COUL[n]) + esc(n) + (v.prix ? ' <span style="color:var(--accent);font-weight:750">' + nb(v.prix) + ' F</span>' : '') +
            '<span class="sw__ind" aria-hidden="true"></span></button>'
        }).join('') + '</div>' +
        ((S.variantes[S.pvCouleur] || {}).note ? '<p class="help">' + esc(S.variantes[S.pvCouleur].note) + '</p>' : '')
      if (!pc.dataset.lie) { pc.dataset.lie = '1'
        pc.addEventListener('click', function (e) {
          var b = e.target.closest('.sw'); if (b) { S.pvCouleur = b.dataset.n; S.pvPhoto = 0; rendre() } }) }
    } else pc.innerHTML = ''

    // Bandeau : la réponse la plus utile de la fiche. Le champ marqué `alerte`
    // porte lui-même ses textes — l'aveu qui rassure, et celui qui alarme.
    var band = $('#pvBand')
    // Un champ à choix MULTIPLES ne peut pas porter le bandeau : on comparerait
    // un tableau à une chaîne, et le bandeau afficherait n'importe quoi.
    var alerte = champs().filter(function (c) { return c.alerte && !c.multi })[0]
    var val = alerte ? eff(alerte.k) : ''
    if (!val) band.classList.add('hidden')
    else {
      band.classList.remove('hidden')
      var a = alerte.alerte
      // « Sans marque » et « fait main » ne sont pas des aveux : ces réponses
      // méritent un bandeau vert et leur propre phrase, pas l'avertissement
      // écrit pour la contrefaçon.
      var bon = val === a.bon || (a.ok || []).indexOf(val) > -1
      var interdit = !!(alerte.bloque && alerte.bloque.indexOf(val) > -1)
      var texte = (a.textes && a.textes[val]) || (bon ? a.texteBon : a.texteMauvais)
      band.className = 'bandeau ' + (interdit ? 'bandeau--bad' : bon ? 'bandeau--ok' : 'bandeau--warn')
      band.innerHTML = (interdit ? ICO.bad : bon ? ICO.ok : ICO.warn) + '<div><b>' + esc(val) + '</b><br>' +
        esc(texte) + '</div>'
    }

    var lignes = []
    if (aEtat()) lignes.push(['État', S.etat === 'neuf' ? 'Neuf' : 'Occasion', false])
    champs().forEach(function (c) {
      if (c.alerte) return
      var v = c.t === 'toggle' ? (eff(c.k) ? 'Oui' : '') : (c.multi ? (eff(c.k, true) || []).join(', ') : eff(c.k))
      if (c.libre && v === c.libre) v = S[c.k + 'Libre'] || ''
      if (!v) return
      if (c.unite) v = (c.t === 'num' ? nb(v) : v) + ' ' + c.unite
      var deCoul = !!(S.pvCouleur && c.varOK && (S.variantes[S.pvCouleur] || {})[c.k] &&
        (c.multi ? (S.variantes[S.pvCouleur][c.k] || []).length : true))
      lignes.push([c.l, v, deCoul])
    })
    if (sc.livraison) lignes.push(['Livraison', S.livr ? 'Possible' : 'Sur place', false])
    $('#pvAttrs').innerHTML = lignes.length
      ? lignes.map(function (l, i) {
          var seule = (lignes.length % 2 === 1) && i === lignes.length - 1
          return '<div class="attr' + (l[2] ? ' attr--v' : '') + (seule ? ' attr--large' : '') + '"><dt>' +
            esc(l[0]) + '</dt><dd>' + esc(l[1]) + '</dd></div>'
        }).join('')
      : '<div class="attr attr--large"><dt>Caractéristiques</dt><dd style="font-weight:500;color:var(--muted)">Remplissez le formulaire</dd></div>'
  }

  /* -------------------- barre de complétude -------------------- */
  function rendreBarre() {
    var m = manques()
    var b = blocages()
    var total = champs().filter(function (c) { return c.req }).length + 2
    var pct = Math.max(0, Math.min(100, Math.round(((total - m.length) / total) * 100)))
    var barre = document.querySelector('.barre')
    var v = $('#bVerdict')
    // Un blocage l'emporte sur tout le reste : compter les champs restants n'a
    // plus de sens quand l'annonce ne peut de toute façon pas être publiée.
    if (b.length) {
      $('#bMeter').style.width = '100%'
      barre.dataset.bad = '1'
      v.dataset.ok = 'x'
      v.innerHTML = ICO.bad + '<span>Publication refusée</span>'
      $('#bMsg').textContent = b[0]
      return
    }
    barre.dataset.bad = '0'
    $('#bMeter').style.width = pct + '%'
    v.innerHTML = m.length ? ICO.warn + '<span>' + m.length + ' champ' + (m.length > 1 ? 's' : '') + ' obligatoire' + (m.length > 1 ? 's' : '') + '</span>'
                           : ICO.tick + '<span>Annonce complète</span>'
    v.dataset.ok = m.length ? '0' : '1'
    $('#bMsg').textContent = m.length ? 'Il manque ' + m.slice(0, 2).join(', ') + (m.length > 2 ? ' et ' + (m.length - 2) + ' autre' + (m.length > 3 ? 's' : '') : '')
                                      : 'Tous les champs obligatoires de « ' + S.sous + ' » sont remplis.'
  }

  function rendre() { rendreForm(); rendreCouleurs(); composerTitre(); rendreApercu(); rendreBarre() }

  /* -------------------- onglets -------------------- */
  var PAN = { 't-form':'p-form', 't-pv':'p-pv', 't-plan':'p-plan' }
  var large = window.matchMedia('(min-width:1040px)')
  var cur = 't-form'
  function onglets() {
    var L = large.matches
    $('#t-pv').style.display = L ? 'none' : ''
    Object.keys(PAN).forEach(function (t) {
      var sel = t === cur
      $('#' + t).setAttribute('aria-selected', sel ? 'true' : 'false')
      $('#' + PAN[t]).classList.toggle('hidden', !(sel || (L && t === 't-pv' && cur === 't-form')))
    })
    if (cur === 't-plan') planMode()
  }
  $$('.tab').forEach(function (t) {
    t.addEventListener('click', function () { cur = t.id; onglets(); window.scrollTo({ top:0, behavior:'smooth' }) })
  })
  large.addEventListener('change', function () { if (large.matches && cur === 't-pv') cur = 't-form'; onglets() })


  /* -------------------- ce qui change -------------------- */
  function planMode() {
    var el = $('#plan')
    if (el.dataset.fait) return
    el.dataset.fait = '1'
    var lignes = SOUS.map(function (s) {
      var sc = SCHEMAS[s]
      var req = sc.champs.filter(function (c) { return c.req }).map(function (c) { return c.l })
      return '<tr><td><b>' + esc(s) + '</b></td><td>' + sc.champs.length + '</td><td>' + esc(req.join(' · ')) +
        '</td><td>' + (sc.couleurs ? 'oui' : '—') + '</td></tr>'
    }).join('')
    var cats = [
      ['Téléphones', 'fait', 'Cinq sous-catégories, marque → modèles, variantes couleur.'],
      ['Immobilier', 'fait', 'Dossier foncier : neuf documents, IDUFCI, bornage, engagements.'],
      ['Véhicules', 'fait', 'Carte grise, CSA, visite technique, kilométrage comparé à l’âge.'],
      ['Mode & Beauté', 'fait', 'Tailles par couleur, authenticité, wax, produits éclaircissants refusés.'],
      ['Électronique', 'todo', 'Marque → modèles, garantie, accessoires, état de l’écran.'],
      ['Maison & Meubles', 'todo', 'Dimensions, matière, montage requis, livraison à l’étage.'],
      ['Emploi', 'todo', 'Contrat, expérience, entreprise — et jamais de frais au candidat.'],
      ['Services', 'todo', 'Zone d’intervention, devis, références, déplacement.'],
      ['Matériel Pro', 'todo', 'Puissance, heures d’usage, facture, pièces disponibles.'],
      ['Alimentation', 'todo', 'Quantité, conditionnement, date limite, chaîne du froid.'],
      ['Agriculture', 'todo', 'Quantité, variété, saison, certificat phytosanitaire.'],
      ['Animaux', 'todo', 'Espèce, âge, vaccination, carnet — espèces protégées interdites.'],
      ['Loisirs', 'todo', 'Marque, taille, état, complet ou non.'],
      ['Bébé', 'todo', 'Âge, norme de sécurité, état, nettoyé.']
    ]
    el.innerHTML =
      '<h2>Un produit qui éclaircit la peau ne peut pas être publié</h2>' +
      '<p>Un décret adopté en Conseil des ministres <b>fin avril 2015</b> — une première en Afrique de l’Ouest — interdit en Côte d’Ivoire la fabrication, la commercialisation <i>et</i> l’utilisation des produits dépigmentants contenant du mercure et ses dérivés, des corticoïdes, de la vitamine A à visée éclaircissante, ou de l’hydroquinone au-delà de 2 %.</p>' +
      '<p>Le formulaire pose donc la question <b>avant</b> la publication, en toutes lettres : « Ce produit éclaircit-il la peau ? ». Une réponse positive n’affiche pas un avertissement — elle <b>bloque le bouton Publier</b>. La barre du bas passe au rouge et dit pourquoi. C’est plus honnête que de laisser quelqu’un remplir dix champs, payer une mise en avant, puis se faire retirer son annonce.</p>' +
      '<div class="note note--bad">' + ICO.bad + '<div>Deux réponses bloquent la publication : le produit <b>éclaircissant</b>, et la <b>date de péremption dépassée</b>. Un cosmétique périmé appliqué sur la peau brûle.</div></div>' +
      '<h2>Le faux wax est l’arnaque la plus courante du marché du tissu</h2>' +
      '<p>La hiérarchie est connue de tous ici : le wax hollandais <b>Vlisco</b> en haut, puis la production du groupe — <b>Uniwax</b>, fabriqué à Yopougon depuis 1967, et <b>Woodin</b> — puis, très loin derrière, les imprimés importés d’Asie. Vendre un imprimé chinois au prix du Vlisco, c’est l’arnaque quotidienne d’Adjamé.</p>' +
      '<p>« Marque ou origine » est donc obligatoire et devient le bandeau de la fiche. L’acheteur y lit toujours le même rappel : <i>vérifiez la lisière du pagne, les vraies marques y impriment leur nom</i>. Le vendeur honnête y gagne — il n’a plus à se justifier.</p>' +
      '<h2>La couleur n’est pas partout, et ce n’est pas la même partout</h2>' +
      '<p>Une robe a une couleur. Un tube de lait corporel, non. Un fond de teint a une <i>carnation</i>, une mèche a un <i>numéro</i>, un vernis a une <i>nuance</i> — et ce ne sont pas les mêmes listes. Proposer « Noir, Blanc, Gris, Argenté, Doré… » à quelqu’un qui vend un fond de teint, c’est lui demander de mentir.</p>' +
      '<p>Le bloc couleur apparaît donc <b>seulement là où il veut dire quelque chose</b>, avec la palette du métier :</p>' +
      '<div class="tw"><table><thead><tr><th>Là où l’on vend</th><th>Le bloc couleur</th><th>La liste proposée</th></tr></thead><tbody>' +
      [['Vêtements, chaussures', 'oui', 'Les 15 couleurs habituelles'],
       ['Pagnes &amp; tissus', 'oui, « coloris »', 'Le coloris dominant de la pièce'],
       ['Sacs, montres, accessoires', 'oui', 'Les 15 couleurs habituelles'],
       ['Bijoux', 'non', 'Le champ <b>Métal</b> le dit déjà'],
       ['Perruques, mèches, coloration', 'oui', '1B · Noir naturel, 27 · Miel, 613 · Blond platine…'],
       ['Fond de teint, poudre', 'oui, « teintes »', 'Très clair → Ébène profond'],
       ['Rouge à lèvres, vernis, fards', 'oui, « teintes »', 'Nude, Fuchsia, Corail, Bordeaux, Pailleté…'],
       ['Crèmes, savons, parfums, shampoings', 'non', '—'],
       ['Sèche-cheveux et accessoires', 'non', '—']
      ].map(function (l) { return '<tr><td>' + l[0] + '</td><td>' + l[1] + '</td><td>' + l[2] + '</td></tr>' }).join('') +
      '</tbody></table></div>' +
      '<p>Un bijou est le cas le plus net : sa couleur, c’est son métal, et une chaîne en or ne se vend pas au prix de la même en argent. Ce sont deux annonces, pas deux pastilles. Le formulaire le dit au vendeur au lieu de le laisser chercher.</p>' +
      '<p>Et changer de produit nettoie ce qui n’a plus de sens : une teinte <i>Caramel</i> cochée pour un fond de teint disparaît dès que le vendeur passe au vernis à ongles. <b>Les photos, elles, restent toujours là</b> — même quand il n’y a aucune couleur à choisir.</p>' +
      '<h2>Les tailles appartiennent à la couleur</h2>' +
      '<p>C’est la particularité de cette catégorie. Une robe existe en rouge du 38 au 44, et en noir uniquement en 40. Annoncer « du 38 au 44 » fait venir un acheteur qui repart déçu, et laisse un avis d’une étoile.</p>' +
      '<p>« Tailles disponibles » et « Pointures disponibles » sont donc des champs <b>par couleur</b> : le vendeur coche d’abord tout ce qu’il a, puis ouvre chaque couleur pour dire ce qui lui reste. Dans la fiche, l’acheteur qui clique sur une couleur voit les tailles de cette couleur-là, sur fond orange, avec la mention « cette couleur ».</p>' +
      '<h2>L’authenticité, dite une fois, en quatre mots</h2>' +
      '<p>Vêtements, chaussures, sacs, bijoux et montres partagent le même bloc : <i>authentique avec preuve d’achat</i>, <i>authentique sans preuve</i>, <i>sans marque / création locale</i>, <i>fait main / sur mesure</i>.</p>' +
      '<p>Les deux dernières réponses ne sont pas des aveux de faiblesse : « sans marque » et « fait main » se vendent très bien en Côte d’Ivoire, et la couture sur mesure est un métier. Ce que le formulaire refuse, c’est le flou — c’est là que naît la contrefaçon vendue au prix du vrai.</p>' +
      '<h2>Six formulaires, six réalités</h2>' +
      '<div class="tw"><table><thead><tr><th>Sous-catégorie</th><th>Champs</th><th>Obligatoires</th><th>Couleurs</th></tr></thead><tbody>' + lignes + '</tbody></table></div>' +
      '<ul>' +
      '<li><b>Vêtements Femme</b> — robe, ensemble, boubou, kaba, tenue de mariage. Tailles en lettres <i>et</i> en chiffres (34 à 56), matière, style, et le bouton « fait sur mesure » que cherchent les couturières.</li>' +
      '<li><b>Vêtements Homme</b> — le <i>tour de col</i> n’apparaît que si l’article est une chemise. Poser la question pour un short n’a pas de sens.</li>' +
      '<li><b>Chaussures</b> — pointures 35 à 48, par couleur. La <i>hauteur de talon</i> ne s’affiche que pour des escarpins, sandales, bottes ou ballerines.</li>' +
      '<li><b>Sacs &amp; Bijoux</b> — la famille commande tout : la matière pour un sac, le <b>métal</b> pour un bijou. Si le métal est de l’or, le <b>titre en carats</b> devient obligatoire et le <b>poids en grammes</b> apparaît : sur un bijou en or, ces deux chiffres <i>sont</i> le prix.</li>' +
      '<li><b>Pagnes &amp; Tissus</b> — longueur vendue en <i>6 yards, le complet</i>, en 12 yards ou au mètre ; le métrage ne se demande que si le vendeur a répondu « au mètre ». Largeur, motif, usage prévu, et la vente en gros pour les revendeuses.</li>' +
      '<li><b>Beauté &amp; Cosmétiques</b> — pas d’état neuf/occasion : un cosmétique est <i>scellé, ouvert, entamé ou testeur</i>. La péremption et la question réglementaire sont obligatoires. Le bloc <b>cheveux</b> — naturels ou synthétiques, longueur en pouces, texture — ne s’ouvre que pour une perruque, un tissage, des mèches ou des extensions.</li>' +
      '</ul>' +
      '<h2>Les quatorze catégories</h2>' +
      '<div class="tw"><table><thead><tr><th>Catégorie</th><th>État</th><th>Ce qui est prévu</th></tr></thead><tbody>' +
      cats.map(function (c) {
        return '<tr><td><b>' + esc(c[0]) + '</b></td><td><span class="etat etat--' + c[1] + '">' +
          (c[1] === 'fait' ? 'revue' : 'à revoir') + '</span></td><td>' + esc(c[2]) + '</td></tr>'
      }).join('') + '</tbody></table></div>' +
      '<p style="font-size:12.5px;color:var(--muted);border-top:1px solid var(--line);padding-top:13px">Sources : décret ivoirien d’avril 2015 sur les produits dépigmentants (Conseil des ministres), Uniwax, Vlisco, Woodin. Rien n’est déployé : ni zip, ni AAB. Cet aperçu sert à valider les choix avant de toucher au site.</p>'
  }

  /* -------------------- liaisons simples -------------------- */
  ;[['#iTitre','titre'],['#iPrix','prix',true],['#kNego','nego'],['#kLivr','livr']].forEach(function (x) {
    var el = $(x[0])
    if (el.type === 'checkbox') el.addEventListener('change', function () { S[x[1]] = el.checked; rendre() })
    else el.addEventListener('input', function () {
      S[x[1]] = x[2] ? el.value.replace(/\D/g, '') : el.value
      if (x[2]) el.value = S[x[1]]
      if (x[0] === '#iTitre') S.titreEdite = el.value !== ''
      rendre()
    })
  })

  // tous les champs de tous les schémas existent dans S dès le départ
  Object.keys(SCHEMAS).forEach(function (k) {
    SCHEMAS[k].champs.forEach(function (c) { if (!(c.k in S)) S[c.k] = c.multi ? [] : (c.t === 'toggle' ? false : '') })
  })
  rendre(); onglets()
})()

