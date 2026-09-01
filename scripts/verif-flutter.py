#!/usr/bin/env python3
"""
CONTRÔLE STATIQUE DE L'APPLICATION FLUTTER.

    python3 scripts/verif-flutter.py

⚠️ POURQUOI CE FICHIER EXISTE. Il n'y a ni `dart` ni `flutter` dans
l'environnement où ce dépôt est modifié : le code Dart part donc SANS avoir été
compilé une seule fois. Une clé de traduction mal tapée, une couleur qui
n'existe pas, une méthode d'API absente — autant de choses que le compilateur
attraperait en une seconde et que personne n'attrape ici.

Ce contrôle relit ce que le code UTILISE et vérifie que ça EXISTE. Il ne
remplace pas `flutter analyze` ; il attrape la classe d'erreurs qui, sans lui,
n'est découverte qu'au moment de fabriquer l'APK — c'est-à-dire trop tard, sur
la machine du Patron.

Il vérifie quatre choses :
  1. les clés `tr(context, 'x')` existent dans i18n/textes.dart, dans les SIX
     langues (une clé sans traduction s'affiche en clair : « oubli.titre ») ;
  2. les couleurs `ChapColors.x` existent dans theme.dart ;
  3. les méthodes `ApiClient.instance.x(` existent dans api/api_client.dart ;
  4. les fichiers importés existent, et accolades/parenthèses sont équilibrées.
"""
import re
import sys
from pathlib import Path

RACINE = Path(__file__).resolve().parent.parent / 'flutter_app'
LANGUES = ['fr', 'en', 'es', 'pt', 'ar', 'zh']
rouges = 0


def dire(ok, texte, detail=''):
    global rouges
    if not ok:
        rouges += 1
    print(f"  {'✅' if ok else '❌'} {texte}" + (f"  · {detail}" if detail else ''))


darts = sorted(RACINE.glob('lib/**/*.dart'))
if not darts:
    print('❌ Aucun fichier Dart trouvé — le contrôle ne juge pas à vide.')
    sys.exit(1)
sources = {f: f.read_text(encoding='utf8') for f in darts}
print(f"  {len(darts)} fichiers Dart lus\n")

# ── 1. Les clés de traduction ───────────────────────────────────────────────
textes = (RACINE / 'lib/i18n/textes.dart').read_text(encoding='utf8')
lignes_cles = {}
for ligne in textes.split('\n'):
    m = re.match(r"\s*'([a-zA-Z0-9_.]+)':\s*\{", ligne)
    if m:
        lignes_cles[m.group(1)] = ligne

utilisees = set()
for f, s in sources.items():
    for m in re.finditer(r"tr\(\s*context\s*,\s*'([^']+)'\s*\)", s):
        cle = m.group(1)
        # ⚠️ LES CLÉS CONSTRUITES À LA VOLÉE NE SE VÉRIFIENT PAS ICI.
        # `tr(context, 'pro.type.$type')` compose la clé au moment de
        # l'affichage : sa valeur dépend des données, pas du code. Premier
        # passage, ce contrôle les déclarait « absentes de textes.dart » — il
        # accusait du code parfaitement juste.
        if '$' in cle:
            continue
        utilisees.add((cle, f.name))

print('── Les clés de traduction ' + '─' * 47)
inconnues = sorted({(c, f) for c, f in utilisees if c not in lignes_cles})
for c, f in inconnues:
    dire(False, f"clé absente de textes.dart : « {c} »", f)
if not inconnues:
    dire(True, f"les {len({c for c, _ in utilisees})} clés utilisées existent toutes")

incompletes = []
for c, _ in utilisees:
    ligne = lignes_cles.get(c)
    if not ligne:
        continue
    for lg in LANGUES:
        if f"'{lg}':" not in ligne:
            incompletes.append((c, lg))
for c, lg in incompletes:
    dire(False, f"« {c} » n'a pas de traduction", lg)
if not incompletes:
    dire(True, f"chaque clé utilisée a ses {len(LANGUES)} langues")

# ── 2. Les couleurs ─────────────────────────────────────────────────────────
theme = (RACINE / 'lib/theme.dart').read_text(encoding='utf8')
couleurs = set(re.findall(r'static const (\w+)\s*=', theme))
print('\n── Les couleurs du thème ' + '─' * 48)
manquantes = set()
for f, s in sources.items():
    for m in re.finditer(r'ChapColors\.(\w+)', s):
        if m.group(1) not in couleurs:
            manquantes.add((m.group(1), f.name))
for c, f in sorted(manquantes):
    dire(False, f"ChapColors.{c} n'existe pas dans theme.dart", f)
if not manquantes:
    dire(True, f"les couleurs utilisées existent ({len(couleurs)} déclarées)")

# ── 3. Les méthodes du client d'API ─────────────────────────────────────────
api = (RACINE / 'lib/api/api_client.dart').read_text(encoding='utf8')
# ⚠️ LA DÉTECTION DES MÉTHODES SE FAIT PAR L'INDENTATION, PAS PAR LE TYPE.
# Premier passage, elle listait les types à la main — `Future<[^>]*>` et
# compagnie — et ne voyait donc pas `Future<Map<String, dynamic>?> moi()` :
# les chevrons imbriqués cassaient le motif. Le contrôle déclarait absentes
# six méthodes qui existaient. On repère maintenant toute déclaration à deux
# espaces d'indentation, quel que soit son type.
# Et le type peut lui-même contenir des parenthèses : `preparer2FA` rend un
# record, `Future<({String secret, String uri})>`. Troisième faux positif de ce
# contrôle. On prend donc le PREMIER identifiant suivi d'une parenthèse sur une
# ligne de déclaration (deux espaces d'indentation, puis une lettre) : dans un
# type record, aucun identifiant n'est collé à sa parenthèse ouvrante.
methodes = set()
for ligne in api.split('\n'):
    if not re.match(r'  [A-Za-z_]', ligne):
        continue
    m = re.search(r'(\w+)\s*\(', ligne)
    if m:
        methodes.add(m.group(1))
print('\n── Les méthodes du client d’API ' + '─' * 41)
absentes = set()
for f, s in sources.items():
    if f.name == 'api_client.dart':
        continue
    for m in re.finditer(r'ApiClient\.instance\.(\w+)\s*\(', s):
        if m.group(1) not in methodes:
            absentes.add((m.group(1), f.name))
for n, f in sorted(absentes):
    dire(False, f"ApiClient.instance.{n}() n'existe pas", f)
if not absentes:
    dire(True, f"les appels au client d’API existent ({len(methodes)} méthodes)")

# ── 4. Imports et équilibre ─────────────────────────────────────────────────
print('\n── Imports et équilibre des blocs ' + '─' * 39)
introuvables = []
for f, s in sources.items():
    for m in re.finditer(r"import\s+'([^:']+\.dart)'", s):
        if not (f.parent / m.group(1)).resolve().exists():
            introuvables.append((m.group(1), f.name))
for i, f in introuvables:
    dire(False, f"import introuvable : {i}", f)
if not introuvables:
    dire(True, 'tous les fichiers importés existent')

def equilibre(src):
    """Compte les délimiteurs hors chaînes et commentaires."""
    n = {'{': 0, '(': 0, '[': 0}
    i, taille = 0, len(src)
    while i < taille:
        c = src[i]
        if c == '/' and i + 1 < taille and src[i + 1] == '/':
            i = src.find('\n', i)
            if i == -1:
                break
            continue
        if c == '/' and i + 1 < taille and src[i + 1] == '*':
            j = src.find('*/', i + 2)
            i = taille if j == -1 else j + 2
            continue
        if c in ('"', "'"):
            triple = src[i:i + 3] in ('"""', "'''")
            fin_marq = src[i:i + 3] if triple else c
            j = i + len(fin_marq)
            while j < taille:
                if src[j] == '\\':
                    j += 2
                    continue
                if src.startswith(fin_marq, j):
                    break
                j += 1
            i = j + len(fin_marq)
            continue
        if c in n:
            n[c] += 1
        elif c == '}':
            n['{'] -= 1
        elif c == ')':
            n['('] -= 1
        elif c == ']':
            n['['] -= 1
        i += 1
    return n

desequilibres = []
for f, s in sources.items():
    n = equilibre(s)
    if any(v != 0 for v in n.values()):
        desequilibres.append((f.name, n))
for f, n in desequilibres:
    dire(False, f'délimiteurs déséquilibrés dans {f}',
         ' '.join(f'{k}{v:+d}' for k, v in n.items() if v))
if not desequilibres:
    dire(True, f'accolades, parenthèses et crochets équilibrés ({len(darts)} fichiers)')

print()
if rouges:
    print(f'❌ {rouges} problème(s). Ce code ne compilerait pas.')
    sys.exit(1)
print('✅ Rien de ce que le code utilise ne manque.')
print('   (ce n’est pas `flutter analyze` : ça n’attrape pas tout,')
print('    mais ça attrape ce qui casse la fabrication de l’APK)')
