/* Language filter: pick English, French or Spanish and hover any word to translate it in place.
   Common words come from the offline dictionary below; anything else falls back to the free
   MyMemory web service (no key) and is cached in localStorage. Canvas text (speech bubbles in the
   alley, the 3D club) is drawn pixels, not words in the page, so it cannot be hovered. */
(function(){
'use strict';
var KEY='jowo.lang',CKEY='jowo.langcache2',LANGS=['en','fr','es'],NAMES={en:'English',fr:'Français',es:'Español'};
var lang='en';try{lang=localStorage.getItem(KEY)||'en'}catch(e){}
if(LANGS.indexOf(lang)<0)lang='en';

/* en=fr/es   (base forms; plurals and a few endings are handled in code) */
var RAW=[
'a=un/un','about=à propos/acerca de','above=au-dessus/encima','across=à travers/a través','actually=en fait/en realidad','add=ajouter/añadir','added=ajouté/añadido','afro=afro/afro','again=encore/otra vez','age=âge/edad','agent=agent/agente','algorithm=algorithme/algoritmo','all=tout/todo','alley=ruelle/callejón','alone=seul/solo','along=le long/a lo largo','already=déjà/ya','also=aussi/también','always=toujours/siempre','am=suis/soy','an=un/un','and=et/y','animation=animation/animación','another=un autre/otro','any=n\'importe quel/cualquier','app=appli/aplicación','apply=appliquer/aplicar','approach=approche/enfoque','are=sont/son','around=autour/alrededor','art=art/arte','as=comme/como','ask=demander/preguntar','at=à/en','audio=audio/audio','away=loin/lejos',
'back=retour/volver','bad=mauvais/malo','bass=basse/bajo','battle=bataille/batalla','be=être/ser','beach=plage/playa','because=parce que/porque','been=été/sido','before=avant/antes','below=ci-dessous/abajo','best=meilleur/mejor','better=mieux/mejor','between=entre/entre','big=grand/grande','black=noir/negro','blue=bleu/azul','body=corps/cuerpo','book=livre/libro','both=les deux/ambos','box=boîte/caja','brain=cerveau/cerebro','brave=courageux/valiente','breathe=respirer/respirar','bridge=pont/puente','bright=lumineux/brillante','brother=frère/hermano','browser=navigateur/navegador','build=construire/construir','building=bâtiment/edificio','built=construit/construido','burger=burger/hamburguesa','but=mais/pero','button=bouton/botón','buy=acheter/comprar','by=par/por',
'call=appeler/llamar','came=venu/vino','can=peut/puede','canvas=toile/lienzo','car=voiture/coche','card=carte/tarjeta','cat=chat/gato','center=centre/centro','chance=chance/oportunidad','change=changer/cambiar','chat=discuter/charlar','cheap=bon marché/barato','chip=puce/ficha','chord=accord/acorde','city=ville/ciudad','classic=classique/clásico','clean=propre/limpio','click=cliquer/clic','close=fermer/cerrar','club=club/club','code=code/código','coded=codé/programado','coding=programmation/programación','coffee=café/café','cold=froid/frío','color=couleur/color','colour=couleur/color','come=venir/venir','computer=ordinateur/computadora','confirmed=confirmé/confirmado','contact=contact/contacto','cool=cool/genial','copy=copier/copiar','course=cours/curso','crowd=foule/multitud','creative=créatif/creativo','cultures=cultures/culturas','culture=culture/cultura','custom=personnalisé/personalizado','cyberpunk=cyberpunk/ciberpunk',
'dance=danser/bailar','dancer=danseur/bailarín','dark=sombre/oscuro','data=données/datos','day=jour/día','demonstrated=démontré/demostrado','design=conception/diseño','did=a fait/hizo','different=différent/diferente','disconnect=déconnecter/desconectar','district=quartier/distrito','do=faire/hacer','does=fait/hace','dog=chien/perro','done=fait/hecho','door=porte/puerta','down=bas/abajo','drum=tambour/tambor','drums=batterie/batería','dj=DJ/DJ',
'each=chaque/cada','east=est/este','eat=manger/comer','education=éducation/educación','email=courriel/correo','empty=vide/vacío','end=fin/fin','enjoy=apprécier/disfrutar','enough=assez/suficiente','even=même/incluso','every=chaque/cada','everyone=tout le monde/todos','everything=tout/todo','expected=prévu/previsto','experience=expérience/experiencia','external=externe/externo',
'fast=rapide/rápido','file=fichier/archivo','find=trouver/encontrar','fine=bien/bien','fire=feu/fuego','first=premier/primero','flat=plat/plano','floor=sol/suelo','focus=focus/enfoque','folklore=folklore/folclore','food=nourriture/comida','for=pour/para','form=forme/forma','four=quatre/cuatro','free=gratuit/gratis','friend=ami/amigo','friendly=amical/amistoso','from=de/de','fun=amusant/diversión','future=futur/futuro',
'game=jeu/juego','gate=porte/puerta','generative=génératif/generativo','get=obtenir/obtener','ghost=fantôme/fantasma','give=donner/dar','glass=verre/vidrio','go=aller/ir','goes=va/va','going=allant/yendo','good=bon/bueno','graduation=diplôme/graduación','graph=graphe/gráfico','graphics=graphiques/gráficos','great=génial/genial','green=vert/verde','groove=groove/ritmo',
'had=avait/tenía','hand=main/mano','happy=heureux/feliz','hard=dur/duro','has=a/tiene','have=avoir/tener','he=il/él','head=tête/cabeza','heart=cœur/corazón','help=aide/ayuda','her=sa/su','here=ici/aquí','hi=salut/hola','hide=cacher/ocultar','high=haut/alto','him=lui/él','his=son/su','hologram=hologramme/holograma','home=accueil/inicio','homepage=page d\'accueil/página de inicio','hot=chaud/caliente','house=house/house','hover=survoler/pasar el cursor','how=comment/cómo','hurry=se dépêcher/apurarse','hype=hype/ánimo',
'i=je/yo','i\'m=je suis/soy','idea=idée/idea','if=si/si','import=importer/importar','in=dans/en','inside=à l\'intérieur/dentro','interactive=interactif/interactivo','internship=stage/pasantía','into=dans/en','is=est/es','it=il/ello','it\'s=c\'est/es','its=son/su',
'job=emploi/trabajo','just=juste/solo','kind=gentil/amable','know=savoir/saber','knows=sait/sabe',
'language=langue/idioma','languages=langues/idiomas','large=grand/grande','larger=plus grand/más grande','last=dernier/último','latin=latin/latino','learn=apprendre/aprender','learns=apprend/aprende','leave=partir/salir','left=gauche/izquierda','less=moins/menos','let=laisser/dejar','library=bibliothèque/biblioteca','life=vie/vida','light=lumière/luz','like=comme/como','linux=Linux/Linux','list=liste/lista','little=petit/pequeño','live=en direct/en vivo','lit=allumé/encendido','local=local/local','locally=localement/localmente','long=long/largo','look=regarder/mirar','looking=cherchant/buscando','lot=lot/lote','lots=beaucoup/muchos','loud=fort/fuerte','love=amour/amor','low=bas/bajo',
'machine=machine/máquina','made=fait/hecho','make=faire/hacer','making=faire/haciendo','man=homme/hombre','many=beaucoup/muchos','map=carte/mapa','market=marché/mercado','matrix=matrice/matriz','may=peut/puede','me=moi/yo','memory=mémoire/memoria','memories=souvenirs/recuerdos','middle=milieu/medio','mind=esprit/mente','mode=mode/modo','monitor=moniteur/monitor','monster=monstre/monstruo','more=plus/más','most=la plupart/la mayoría','move=bouger/mover','moving=en mouvement/en movimiento','music=musique/música','must=doit/debe','my=mon/mi','myself=moi-même/yo mismo',
'name=nom/nombre','names=noms/nombres','need=besoin/necesitar','needs=besoin/necesita','neon=néon/neón','never=jamais/nunca','new=nouveau/nuevo','next=suivant/siguiente','night=nuit/noche','nightclub=boîte de nuit/discoteca','no=non/no','none=aucun/ninguno','north=nord/norte','not=ne pas/no','now=maintenant/ahora','number=numéro/número',
'of=de/de','off=éteint/apagado','old=vieux/viejo','on=sur/en','once=une fois/una vez','one=un/uno','ones=ceux/los','online=en ligne/en línea','only=seulement/solo','open=ouvrir/abrir','opportunities=occasions/oportunidades','opportunity=occasion/oportunidad','or=ou/o','original=original/original','other=autre/otro','our=notre/nuestro','out=dehors/fuera','outside=dehors/afuera','over=sur/sobre','own=propre/propio',
'page=page/página','parts=pièces/partes','part=pièce/parte','pause=pause/pausa','people=gens/gente','person=personne/persona','photo=photo/foto','pink=rose/rosa','pit=fosse/foso','place=lieu/lugar','places=lieux/lugares','play=jouer/jugar','playful=ludique/juguetón','plays=joue/juega','playlist=liste de lecture/lista de reproducción','please=s\'il vous plaît/por favor','plus=plus/más','portfolio=portfolio/portafolio','press=appuyer/presionar','program=programme/programa','programming=programmation/programación','project=projet/proyecto','projects=projets/proyectos','public=public/público','python=Python/Python',
'quiet=calme/tranquilo','rain=pluie/lluvia','rather=plutôt/más bien','red=rouge/rojo','rendering=rendu/renderizado','renderer=moteur de rendu/renderizador','repeat=répéter/repetir','replace=remplacer/reemplazar','reserved=réservé/reservado','residents=habitants/residentes','right=droite/derecha','road=route/camino','room=salle/sala','run=courir/correr',
'safe=sûr/seguro','same=même/mismo','save=enregistrer/guardar','say=dire/decir','school=école/escuela','science=science/ciencia','scratch=zéro/cero','see=voir/ver','seen=vu/visto','sell=vendre/vender','shuffle=mélanger/mezclar','signal=signal/señal','simulation=simulation/simulación','simulations=simulations/simulaciones','site=site/sitio','skill=compétence/habilidad','skills=compétences/habilidades','sleep=dormir/dormir','small=petit/pequeño','so=donc/así','software=logiciel/software','some=quelques/algunos','something=quelque chose/algo','song=chanson/canción','soul=âme/alma','sound=son/sonido','source=source/fuente','south=sud/sur','speakers=haut-parleurs/altavoces','start=commencer/empezar','state=état/estado','step=étape/paso','still=encore/todavía','stop=arrêter/parar','stored=stocké/almacenado','stranger=étranger/extraño','stream=flux/flujo','street=rue/calle','student=étudiant/estudiante','style=style/estilo','styles=styles/estilos','such=tel/tal','synthesised=synthétisé/sintetizado','synthesizer=synthétiseur/sintetizador','synthesiser=synthétiseur/sintetizador','system=système/sistema',
'take=prendre/tomar','tap=toucher/tocar','tempo=tempo/tempo','than=que/que','that=que/que','the=le/el','their=leur/su','them=eux/ellos','then=puis/entonces','there=là/allí','these=ces/estos','they=ils/ellos','thing=chose/cosa','things=choses/cosas','this=ce/este','those=ceux/esos','three=trois/tres','through=à travers/a través','time=temps/tiempo','to=à/a','today=aujourd\'hui/hoy','too=aussi/también','tools=outils/herramientas','tool=outil/herramienta','towers=tours/torres','track=piste/pista','tracks=pistes/pistas','tree=arbre/árbol','two=deux/dos',
'under=sous/bajo','understand=comprendre/entender','up=haut/arriba','us=nous/nosotros','use=utiliser/usar','using=utilisant/usando',
'version=version/versión','very=très/muy','voices=voix/voces','wait=attendre/esperar','walk=marcher/caminar','walking=marchant/caminando','wander=flâner/vagar','want=vouloir/querer','was=était/era','water=eau/agua','way=façon/manera','we=nous/nosotros','web=web/web','welcome=bienvenue/bienvenido','well=bien/bien','were=étaient/eran','west=ouest/oeste','what=quoi/qué','when=quand/cuando','where=où/dónde','which=lequel/cuál','while=pendant/mientras','white=blanc/blanco','who=qui/quién','whole=entier/entero','why=pourquoi/por qué','will=va/va a','window=fenêtre/ventana','windows=fenêtres/ventanas','with=avec/con','without=sans/sin','work=travail/trabajo','works=fonctionne/funciona','world=monde/mundo','worlds=mondes/mundos','would=voudrait/querría','wrote=a écrit/escribí','wrong=faux/incorrecto',
'year=année/año','years=années/años','yellow=jaune/amarillo','yes=oui/sí','you=vous/tú','your=votre/tu','yours=le vôtre/tuyo',
/* site-specific words and common UI */
'anti-fun=anti-fun/anti-diversión','whoami=qui suis-je/quién soy','signal=signal/señal','todo=à faire/por hacer','todo:=à faire/por hacer','toronto=Toronto/Toronto','canada=Canada/Canadá','ontario=Ontario/Ontario','casa=maison/casa','playa=plage/playa','neo=néo/neo','os=OS/OS','alley=ruelle/callejón','uptime=durée de fonctionnement/tiempo activo','cursor=curseur/cursor','pace=rythme/ritmo','tick=tic/tic','sys=système/sistema','hex=hexa/hexa','github=GitHub/GitHub','linkedin=LinkedIn/LinkedIn','javascript=JavaScript/JavaScript','html=HTML/HTML','css=CSS/CSS','git=Git/Git','api=API/API','dj=DJ/DJ','bpm=BPM/BPM',
'moshpit=fosse/mosh pit','pogo=pogo/pogo','mosh=mosh/mosh','kick=grosse caisse/bombo','spotify=Spotify/Spotify','genre=genre/género','genres=genres/géneros','dancefloor=piste de danse/pista de baile','stage=scène/escenario','crowd=foule/multitud','minister=ministre/ministro','enjoyment=plaisir/disfrute','breakdance=breakdance/breakdance','costume=costume/disfraz','hologram=hologramme/holograma','night=nuit/noche','day=jour/día',
'frameworks=frameworks/frameworks','assets=ressources/recursos','hand-coded=codé à la main/programado a mano','hand-coded:=codé à la main/programado a mano','synthesised=synthétisé/sintetizado','wander=flâner/vagar','district=quartier/distrito','buildings=bâtiments/edificios','lot=terrain/lote','lots=terrains/lotes','future=futur/futuro','projects=projets/proyectos','looking=à la recherche/buscando','internships=stages/pasantías','co-ops=stages coop/prácticas cooperativas','collaborative=collaboratif/colaborativo','open-source=source ouverte/código abierto','source=source/fuente','science=science/ciencia','student=étudiant/estudiante','hosted=hébergé/alojado','pages=pages/páginas','profile=profil/perfil','interested=intéressé/interesado','creating=créer/creando','create=créer/crear','created=créé/creado','together=ensemble/juntos','simple=simple/simple','simply=simplement/simplemente','smooth=fluide/suave','real=réel/real','really=vraiment/realmente','nothing=rien/nada','anything=n\'importe quoi/cualquier cosa','someone=quelqu\'un/alguien','nobody=personne/nadie','maybe=peut-être/quizás','soon=bientôt/pronto','later=plus tard/luego','early=tôt/temprano','late=tard/tarde','often=souvent/a menudo','sometimes=parfois/a veces','usually=habituellement/normalmente',
'morning=matin/mañana','evening=soir/tarde','week=semaine/semana','month=mois/mes','hour=heure/hora','minute=minute/minuto','second=seconde/segundo','today=aujourd\'hui/hoy','tomorrow=demain/mañana','yesterday=hier/ayer','sun=soleil/sol','moon=lune/luna','star=étoile/estrella','sky=ciel/cielo','sea=mer/mar','river=rivière/río','mountain=montagne/montaña','tree=arbre/árbol','flower=fleur/flor','garden=jardin/jardín','park=parc/parque','market=marché/mercado','shop=boutique/tienda','store=magasin/tienda','cafe=café/café','restaurant=restaurant/restaurante','bar=bar/bar','hotel=hôtel/hotel','house=maison/casa','home=maison/hogar','street=rue/calle','road=route/camino','town=ville/pueblo','country=pays/país','earth=terre/tierra','air=air/aire','wind=vent/viento','storm=orage/tormenta','snow=neige/nieve','ice=glace/hielo','stone=pierre/piedra','gold=or/oro','silver=argent/plata','iron=fer/hierro','glass=verre/vidrio','paper=papier/papel','phone=téléphone/teléfono','screen=écran/pantalla','keyboard=clavier/teclado','mouse=souris/ratón','network=réseau/red','internet=internet/internet','server=serveur/servidor','servers=serveurs/servidores','video=vidéo/video','image=image/imagen','picture=image/imagen','text=texte/texto','word=mot/palabra','words=mots/palabras','letter=lettre/letra','story=histoire/historia','news=nouvelles/noticias','question=question/pregunta','answer=réponse/respuesta','problem=problème/problema','solution=solution/solución','example=exemple/ejemplo','result=résultat/resultado','results=résultats/resultados','change=changement/cambio','power=pouvoir/poder','energy=énergie/energía','speed=vitesse/velocidad','size=taille/tamaño','level=niveau/nivel','point=point/punto','line=ligne/línea','shape=forme/forma','space=espace/espacio','top=haut/arriba','bottom=bas/abajo','side=côté/lado','front=devant/frente','behind=derrière/detrás','near=près/cerca','far=loin/lejos','next=prochain/próximo','previous=précédent/anterior','menu=menu/menú','search=chercher/buscar','settings=paramètres/ajustes','setting=paramètre/ajuste','options=options/opciones','option=option/opción','help=aide/ayuda','support=soutien/apoyo','share=partager/compartir','send=envoyer/enviar','read=lire/leer','write=écrire/escribir','writing=écriture/escritura','listen=écouter/escuchar','watch=regarder/ver','show=montrer/mostrar','hear=entendre/oír','talk=parler/hablar','think=penser/pensar','feel=sentir/sentir','try=essayer/intentar','keep=garder/guardar','hold=tenir/sostener','turn=tourner/girar','pick=choisir/elegir','choose=choisir/elegir','put=mettre/poner','set=régler/ajustar','sit=s\'asseoir/sentarse','stand=se tenir/estar de pie','fall=tomber/caer','fly=voler/volar','swim=nager/nadar','sing=chanter/cantar','jump=sauter/saltar','sleep=sommeil/sueño','dream=rêve/sueño','wake=réveiller/despertar','live=vivre/vivir','die=mourir/morir','born=né/nacido','young=jeune/joven','older=plus âgé/mayor','boy=garçon/chico','girl=fille/chica','woman=femme/mujer','child=enfant/niño','kid=enfant/niño','kids=enfants/niños','family=famille/familia','mother=mère/madre','father=père/padre','sister=sœur/hermana','teacher=professeur/profesor','doctor=médecin/médico','king=roi/rey','queen=reine/reina','duke=duc/duque','admiral=amiral/almirante','chef=chef/chef','clown=clown/payaso','taco=taco/taco','pizza=pizza/pizza','donut=beignet/dona','shake=milk-shake/batido','chicken=poulet/pollo','fries=frites/papas fritas','free=libre/libre','special=spécial/especial','magic=magie/magia','secret=secret/secreto','rare=rare/raro','happy=content/contento','sad=triste/triste','angry=en colère/enojado','tired=fatigué/cansado','hungry=affamé/hambriento','funny=drôle/gracioso','crazy=fou/loco','strange=étrange/extraño','weird=bizarre/raro','beautiful=beau/hermoso','pretty=joli/bonito','ugly=laid/feo','strong=fort/fuerte','weak=faible/débil','heavy=lourd/pesado','soft=doux/suave','sharp=pointu/afilado','sweet=sucré/dulce','spicy=épicé/picante','sour=aigre/agrio','fresh=frais/fresco','warm=chaud/cálido','wet=mouillé/mojado','dry=sec/seco','full=plein/lleno','half=moitié/mitad','whole=complet/completo','single=seul/único','double=double/doble','next=suivant/siguiente','main=principal/principal','major=majeur/mayor','minor=mineur/menor','common=commun/común','popular=populaire/popular','famous=célèbre/famoso','important=important/importante','possible=possible/posible','ready=prêt/listo','sure=sûr/seguro','true=vrai/verdadero','false=faux/falso','correct=correct/correcto','easy=facile/fácil','difficult=difficile/difícil','hard=difficile/difícil','short=court/corto','tall=grand/alto','wide=large/ancho','deep=profond/profundo','thin=mince/delgado','thick=épais/grueso','empty=vide/vacío','busy=occupé/ocupado','free=disponible/disponible','closed=fermé/cerrado','opened=ouvert/abierto','online=en ligne/en línea','offline=hors ligne/sin conexión','sound=son/sonido','off=désactivé/desactivado','on=activé/activado','loading=chargement/cargando','error=erreur/error','warning=avertissement/advertencia','success=succès/éxito','done=terminé/terminado','cancel=annuler/cancelar','ok=d\'accord/vale','okay=d\'accord/vale','thanks=merci/gracias','thank=remercier/agradecer','sorry=désolé/lo siento','hello=bonjour/hola','goodbye=au revoir/adiós','bye=salut/chao','welcome=bienvenue/bienvenido','hey=hé/oye','wow=wow/guau','yeah=ouais/sí','nope=non/nop'
];
var DICT={};
RAW.forEach(function(l){var i=l.indexOf('='),k=l.slice(0,i),v=l.slice(i+1).split('/');if(!DICT[k])DICT[k]={fr:v[0],es:v[1]}});

var WORD=/[A-Za-zÀ-ɏ][A-Za-zÀ-ɏ'’-]*/g;
var cache={};try{cache=JSON.parse(localStorage.getItem(CKEY)||'{}')}catch(e){}
function saveCache(){try{var ks=Object.keys(cache);if(ks.length>1500)ks.slice(0,300).forEach(function(k){delete cache[k]});localStorage.setItem(CKEY,JSON.stringify(cache))}catch(e){}}

function plural(t,l){if(/\s/.test(t))return t;if(l==='fr')return /[sxz]$/.test(t)?t:t+'s';return /[aeiouáéíóú]$/.test(t)?t+'s':(/z$/.test(t)?t.slice(0,-1)+'ces':t+'es')}
function look(w,l){
  w=w.toLowerCase().replace(/’/g,"'");
  var d=DICT[w];if(d)return d[l];
  var b,m;
  if(/'s$/.test(w)){d=DICT[w.slice(0,-2)];if(d)return d[l]}
  if(/ies$/.test(w)&&(d=DICT[w.slice(0,-3)+'y']))return plural(d[l],l);
  if(/es$/.test(w)&&(d=DICT[w.slice(0,-2)]))return plural(d[l],l);
  if(/s$/.test(w)&&(d=DICT[w.slice(0,-1)]))return plural(d[l],l);
  if(/ing$/.test(w)&&(d=DICT[w.slice(0,-3)]||DICT[w.slice(0,-3)+'e']))return d[l];
  if(/ed$/.test(w)&&(d=DICT[w.slice(0,-2)]||DICT[w.slice(0,-1)]))return d[l];
  return null;
}
function fit(orig,t){
  if(orig.length>1&&orig===orig.toUpperCase()&&/[A-Z]/.test(orig))return t.toUpperCase();
  if(/^[A-Z]/.test(orig))return t.charAt(0).toUpperCase()+t.slice(1);
  return t;
}
/* free web fallback for words the dictionary does not know */
var inflight={};
function remote(w,l,cb){
  var k=l+':'+w.toLowerCase();
  if(cache[k]!==undefined){cb(cache[k]||null);return}
  if(inflight[k]){inflight[k].push(cb);return}
  inflight[k]=[cb];
  var done=function(v){cache[k]=v||'';saveCache();var q=inflight[k];delete inflight[k];q.forEach(function(f){f(v||null)})};
  try{
    fetch('https://api.mymemory.translated.net/get?q='+encodeURIComponent(w)+'&langpair=en|'+l)
      .then(function(r){return r.json()})
      .then(function(j){var t=j&&j.responseData&&j.responseData.translatedText;
        if(!t||/MYMEMORY|QUERY LENGTH|INVALID|NO QUERY/i.test(t)||t.toLowerCase()===w.toLowerCase()||t.length>40)done(null);else done(t.toLowerCase()===t||!/[A-Z]/.test(w)?t.toLowerCase():t)})
      .catch(function(){var q=inflight[k];delete inflight[k];(q||[]).forEach(function(f){f(null)})});
  }catch(e){delete inflight[k];cb(null)}
}
function translate(w,l,cb){
  var t=look(w,l);if(t){cb(fit(w,t));return}
  if(w.length<3||/^[A-Z]{2,}$/.test(w)){cb(null);return}
  remote(w,l,function(r){cb(r?fit(w,r):null)});
}

/* ---- per-text-node state so the original text can always be restored ---- */
var S=new WeakMap(),touched=new Set();
var SKIP='script,style,textarea,input,select,option,canvas,svg,noscript,[contenteditable],[data-nolang],#langsel,#langtip';
function tokens(s){var out=[],last=0,m;WORD.lastIndex=0;while((m=WORD.exec(s))){if(m.index>last)out.push({s:s.slice(last,m.index),w:0});out.push({s:m[0],w:1,t:null});last=m.index+m[0].length}if(last<s.length)out.push({s:s.slice(last),w:0});return out}
function cur(st){return st.tk.map(function(x){return x.t||x.s}).join('')}
function stateFor(node){
  var st=S.get(node);
  if(st&&node.nodeValue===st.cv)return st;
  st={tk:tokens(node.nodeValue),cv:node.nodeValue};st.ov=node.nodeValue;S.set(node,st);return st;
}
function write(node,st){var v=cur(st);st.cv=v;node.nodeValue=v;touched.add(node)}
function restoreAll(){
  touched.forEach(function(n){var st=S.get(n);if(!n.isConnected||!st){touched.delete(n);return}
    if(n.nodeValue===st.cv){st.tk.forEach(function(x){x.t=null});write(n,st)}});
  touched.clear();
}
function retranslateAll(){
  touched.forEach(function(n){var st=S.get(n);if(!n.isConnected||!st||n.nodeValue!==st.cv){touched.delete(n);return}
    st.tk.forEach(function(x){if(!x.t)return;x.t=null;translate(x.s,lang,function(r){if(r&&lang!=='en'&&n.nodeValue===st.cv){x.t=r;write(n,st)}})});
    write(n,st)});
}

/* ---- finding the word under the pointer ---- */
function caret(x,y){
  var n,o;
  if(document.caretPositionFromPoint){var p=document.caretPositionFromPoint(x,y);if(p){n=p.offsetNode;o=p.offset}}
  else if(document.caretRangeFromPoint){var r=document.caretRangeFromPoint(x,y);if(r){n=r.startContainer;o=r.startOffset}}
  return n&&n.nodeType===3?{n:n,o:o}:null;
}
function inRect(node,a,b,x,y){
  try{var r=document.createRange();r.setStart(node,a);r.setEnd(node,b);var rs=r.getClientRects();
    for(var i=0;i<rs.length;i++){var q=rs[i];if(x>=q.left-2&&x<=q.right+2&&y>=q.top-2&&y<=q.bottom+2)return true}}catch(e){}
  return false;
}
var tip=null,tipT=0;
function showTip(x,y,from,to){
  if(!tip){tip=document.createElement('div');tip.id='langtip';
    tip.style.cssText='position:fixed;z-index:2147483000;pointer-events:none;font:12px/1.3 system-ui,sans-serif;background:#111;color:#fff;border:1px solid #888;padding:2px 7px;border-radius:5px;opacity:0;transition:opacity .15s;white-space:nowrap';
    document.body.appendChild(tip)}
  tip.textContent=from+' → '+to;tip.style.left=Math.min(x+12,innerWidth-140)+'px';tip.style.top=(y+16)+'px';tip.style.opacity='1';
  clearTimeout(tipT);tipT=setTimeout(function(){tip.style.opacity='0'},1300);
}
function hit(x,y){
  if(lang==='en')return;
  var c=caret(x,y);if(!c)return;
  var node=c.n,par=node.parentElement;if(!par||par.closest(SKIP))return;
  var st=stateFor(node),off=0,tk=null,idx=-1;
  for(var i=0;i<st.tk.length;i++){var t=st.tk[i],len=(t.t||t.s).length;
    if(t.w&&c.o>=off&&c.o<=off+len){tk=t;idx=i;if(c.o<off+len)break}
    off+=len}
  if(!tk)return;
  var s=off,e=off+(tk.t||tk.s).length;
  if(!inRect(node,s,e,x,y))return;
  if(tk.t||tk.busy)return;
  tk.busy=1;var l=lang,src=tk.s;
  translate(src,l,function(r){
    tk.busy=0;
    if(!r||l!==lang||node.nodeValue!==st.cv)return;
    tk.t=r;write(node,st);showTip(x,y,src,r);
  });
}
var qx=0,qy=0,qp=0;
function onMove(ev){qx=ev.clientX;qy=ev.clientY;if(qp||lang==='en')return;qp=1;requestAnimationFrame(function(){qp=0;hit(qx,qy)})}
document.addEventListener('mousemove',onMove,{passive:true});
document.addEventListener('pointerdown',function(ev){if(ev.pointerType==='touch'&&lang!=='en')hit(ev.clientX,ev.clientY)},{passive:true});

/* ---- selector + switching ---- */
var ui=null;
function paint(){
  document.documentElement.setAttribute('data-uilang',lang);
  if(!ui)return;
  [].forEach.call(ui.querySelectorAll('button'),function(b){var on=b.dataset.l===lang;b.setAttribute('aria-pressed',on?'true':'false');b.classList.toggle('on',on)});
}
function apply(l,fromStorage){
  if(LANGS.indexOf(l)<0||l===lang&&!fromStorage)return;
  var prev=lang;lang=l;paint();
  if(lang==='en')restoreAll();else if(prev!=='en'||touched.size)retranslateAll();
  [].forEach.call(document.querySelectorAll('iframe'),function(f){try{f.contentWindow.Lang&&f.contentWindow.Lang.sync()}catch(e){}});
}
function set(l){
  if(LANGS.indexOf(l)<0)return;
  try{localStorage.setItem(KEY,l)}catch(e){}
  apply(l);
}
function sync(){var l='en';try{l=localStorage.getItem(KEY)||'en'}catch(e){}if(l!==lang)apply(l)}
window.addEventListener('storage',function(ev){if(ev.key===KEY)sync()});
window.Lang={set:set,get:function(){return lang},sync:sync,apply:apply};

function build(){
  var embedded=false;try{embedded=window.top!==window&&window.parent.document&&true}catch(e){}
  if(embedded){paint();return}
  var host=document.getElementById('langsel');
  if(!host){host=document.createElement('div');host.id='langsel';host.style.cssText='position:fixed;right:10px;bottom:10px;z-index:9500;color:#fff;background:rgba(0,0,0,.6);padding:3px;border-radius:6px'; (document.body||document.documentElement).appendChild(host)}
  host.setAttribute('role','group');host.setAttribute('aria-label','Language: hover any word to translate it');
  host.title='Language filter: pick French or Spanish, then hover any word to translate it';
  var css=document.createElement('style');
  css.textContent='#langsel{display:inline-flex;gap:3px;align-items:center}#langsel button{all:unset;cursor:pointer;font:600 12px/22px system-ui,sans-serif;letter-spacing:.06em;padding:0 7px;border:1px solid currentColor;border-radius:4px;opacity:.55;color:inherit}#langsel button:hover,#langsel button:focus-visible{opacity:1}#langsel button.on{opacity:1;box-shadow:inset 0 -3px 0 currentColor}';
  document.head.appendChild(css);
  host.innerHTML='';
  LANGS.forEach(function(l){var b=document.createElement('button');b.type='button';b.dataset.l=l;b.textContent=l.toUpperCase();b.title=NAMES[l];b.addEventListener('click',function(){set(l)});host.appendChild(b)});
  ui=host;paint();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',build);else build();
})();
