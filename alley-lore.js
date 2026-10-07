/* alley-lore.js: random parables and made-up life stories for the people in the alley. */
(function(g){
'use strict';
const pick=a=>a[Math.floor(Math.random()*a.length)];
const ri=(a,b)=>a+Math.floor(Math.random()*(b-a+1));

/* ---------- parables: the first option is the real proverb, the rest are nonsense ---------- */
const PROV=[
  ['The early bird gets the {0}.',['worm','coleslaw','firmware update','last bus pass','good noodles','pigeon']],
  ['A stitch in time saves {0}.',['nine','ninety-nine','the whole cat','your Wi-Fi','a very small horse']],
  ['Do not count your {0} before they {1}.',[['chickens','hatch'],['noodles','boil'],['pixels','render'],['drones','land'],['umbrellas','bloom']]],
  ['A rolling stone gathers no {0}.',['moss','rent','bees','firmware','opinions']],
  ['Every cloud has a {0}.',['silver lining','loading bar','hidden fee','spare key','tiny moustache']],
  ['The pen is mightier than the {0}.',['sword','vending machine','landlord','cron job','ferret']],
  ['Where there is smoke, there is {0}.',['fire','ramen','a drone delivery','someone selling socks','a very confident toaster']],
  ['Do not judge a {0} by its {1}.',[['book','cover'],['ramen','broth'],['cyborg','warranty'],['lantern','shadow'],['goat','LinkedIn']]],
  ['Look before you {0}.',['leap','blink','reboot','sneeze','sign a lease with a ghost']],
  ['The grass is always greener on the {0}.',['other side','neon side','VPN','third floor','moon']],
  ['Slow and steady wins the {0}.',['race','noodle bar','patch notes','argument with a goose','night market']],
  ['Many hands make light {0}.',['work','lanterns','soup','of the whole situation']],
  ['Patience is a {0}.',['virtue','subscription service','dumpster fire with good manners','rental']],
  ['A watched pot never {0}.',['boils','updates','sings','pays rent']],
  ['Too many cooks spoil the {0}.',['broth','firmware','parade','moon']],
  ['You cannot teach an old {0} new tricks.',['dog','drone','toaster','monk']],
  ['The squeaky wheel gets the {0}.',['grease','Wi-Fi password','last dumpling','blame']],
  ['Home is where the {0} is.',['heart','charger','noodle cart','spare umbrella']],
  ['Actions speak louder than {0}.',['words','vending machines','karaoke','pigeons']],
  ['Egbe bere, ugo bere, as the Igbo say: let the kite perch, let the eagle perch, and let the {0} {1}.',[['kite','perch'],['pigeon','queue'],['drone','file a complaint'],['goat','sit politely']]],
  ['As the Igbo say: when a toad runs in the daytime, either something is after it or it is after {0}.',['something','the last jollof','free Wi-Fi','a very small bus']],
  ['As the Igbo say: a person who has {0} does not reject the {1}.',[['kola','guest'],['noodles','rain'],['a lantern','dark alley'],['a charger','phone']]],
  ['When the cat is away, the {0} will play.',['mice','drones','accountants','vending machines']]
];
const INTRO=['An old saying:','My grandmother told me:','Listen well:','The ancients say,','So it is written,','Remember this:','A wise noodle once said,','Whisper of the alley:'];
const OUTRO=['','','',' So say the damp monks.',' So say the lost servers.',' Or so my pigeon claims.',' Pay no mind to the rain.',' Write that down.',' Do not ask which ancients.'];
function parable(){
  const t=pick(PROV),fill=t[1];let txt=t[0];
  const real=Math.random()<.4;
  const choice=real?fill[0]:pick(fill.slice(1));
  const vals=Array.isArray(choice)?choice:[choice];
  vals.forEach((v,i)=>{txt=txt.replace('{'+i+'}',v)});
  return pick(INTRO)+' '+txt+pick(OUTRO);
}

/* ---------- names and the spoofed myths behind them ---------- */
const SURN=['Okonkwo','Nwosu','Eze','Adeyemi','Balogun','Okeke','Obi','Nnamdi','Eriksen','Hernandez','Xochitl','Ramirez','Okafor','Tanaka','Petrov','Haddad','Kim','Singh','Rossi','Nguyen','Silva','Cohen','Jovanovic','Mensah','Larsson','Reyes','Abdi','Ivanova','Chen','Dlamini','Costa','Yilmaz','Park','Moreau'];
const MYTH={
 'Achilles':['tripped over a Lego and has not walked normally since','was dipped in a protein shake as a baby and they missed one spot','won every fight, then retired after a paper cut on the heel'],
 'Odysseus':['took ten years to find the way home from the corner store','tied himself to a lamppost to survive karaoke night','talked his way out of a parking ticket using a wooden horse'],
 'Icarus':['flew too close to a neon sign and got sunburnt','is banned from rooftop bars for "flying too close"','still wears wax wings, which are, regrettably, candles'],
 'Sisyphus':['pushes the same shopping cart uphill every night and still has not returned it','has the longest unfinished to-do list in the district','runs a very successful hill-based gym'],
 'Hercules':['completed twelve chores and then the landlord asked for a thirteenth','strangled a snake and was asked to leave a pet shop','cleaned the stables in a day and now runs a laundromat'],
 'Perseus':['beat a monster using only a shiny phone screen','owns the only mirror-shield in town and rents it out for weddings'],
 'Medusa':['avoids eye contact on the train, for everyone\'s sake','runs the best garden-statue shop in the district','has hair that doubles as a Wi-Fi router'],
 'Orpheus':['went to the underworld for a lost phone and looked back at the notifications','once made a traffic cone cry with a ukulele solo'],
 'Pandora':['opened the email titled DO NOT OPEN and regrets almost nothing','keeps one unopened jar in the fridge, just in case'],
 'Midas':['every sandwich he touches turns to gold, which is awful for lunch','is allergic to gold plating and now sells lead jewellery'],
 'Narcissus':['fell in love with his reflection in a puddle and has been late to everything since','has 4,000 selfies and zero photos of anyone else'],
 'Prometheus':['lent a neighbour some fire and is still waiting for the lighter back','gave humanity fire and now gets invoices from the gods'],
 'Atlas':['holds up the sky and still asks for a tip','has a bad back and a worse chiropractor'],
 'Theseus':['found his way through a maze by dropping breadcrumbs and was fined for littering','beat a bull-headed man and got bored of mazes'],
 'Ariadne':['owns the longest ball of yarn on record and one very patient cat','lent a man a ball of string and never got the deposit back'],
 'Daedalus':['builds wings for others and refuses to fly himself','patented the labyrinth and charges admission'],
 'Persephone':['spends six months at a dim nightclub and six at a garden centre','ate six pomegranate seeds and now has a seasonal contract'],
 'Hades':['runs a sweet underground café; the Wi-Fi is, naturally, terrible','has a three-headed dog named Brian'],
 'Poseidon':['lost a lawsuit to a very wet lighthouse','flooded his own kitchen to win an argument'],
 'Zeus':['cannot keep a secret or a thunderbolt','was banned from the group chat for excessive lightning'],
 'Loki':['tricked a vending machine into giving two sodas and a lecture','was last seen as a mannequin, then a teapot'],
 'Thor':['lost his hammer at the laundromat for a day','owns the loudest doorbell in town'],
 'Odin':['traded an eye for reading glasses; terrible deal','knows everything except where his keys are'],
 'Anansi':['tells stories instead of paying rent, and it works every time','talked a snake into a ten-year lease'],
 'Maui':['pulled an island out of the sea but lost the receipt','slowed the sun to finish a nap'],
 'Sun Wukong':['stole the peaches of immortality and now only shops in bulk','jumped a hundred thousand miles and still missed the bus'],
 'Gilgamesh':['searched the whole world for immortality and found a loyalty card','wrote a sequel to his own journey'],
 'Hanuman':['leapt an ocean to fetch an herb and forgot which one','carried a mountain home because the label was unclear'],
 'Susanoo':['slew a dragon with eight cups of sake, but not on purpose','got kicked out of heaven for being rude at the buffet'],
 'Amaterasu':['hid in a cave when the city got too loud; they lured her out with a mirror','runs the sun, mostly on a timer'],
 'Anubis':['weighs hearts for a living: very precise, rarely impressed','has a jackal-shaped parking permit'],
 'Isis':['spent years reassembling her husband and kept the spare parts','knows the secret name but only uses it for passwords'],
 'Thoth':['invented writing and instantly regretted the paperwork','is a notorious pedant at pub quizzes'],
 'Cu Chulainn':['held back a whole army alone, then complained about the paperwork','has the most dramatic hair-care routine in the alley'],
 'Beowulf':['tore off a monster\'s arm and now uses it as a coat rack','only fights things under the bed these days'],
 'Ra':['sails the sun across the sky every day and gets very sunburnt','is always on time, which is unnerving'],
 'Gabriel':['blew a horn at the wrong party and has not been invited back','delivers messages by pigeon and by regret'],
 'Ganesh':['asked for a pen and got a very large tusk-related invoice','never forgets, which is a problem at family dinners'],
 'Shango':['called down lightning for a phone charge and tripped the whole building','dances so hard the drums file noise complaints','keeps a double-headed axe for opening very stubborn jars'],
 'Oya':['sends a storm whenever someone says "it\'s only a breeze"','guards the gate of the market and charges a tiny toll in buttons'],
 'Yemoja':['mothered all the rivers and still forgets her own birthday','runs a swimming school for people who are already fish'],
 'Eshu':['left a stone at the crossroads and it hit two birds that were not there yet','delivers messages that arrive slightly before they are sent'],
 'Ogun':['forged a road with a machete and now bills for tolls','invented the shortcut and promptly got lost on it'],
 'Obatala':['moulded people from clay and recalls every one that came out a bit wonky','dresses entirely in white and has never once spilled soup'],
 'Oshun':['bathes in honey and now cannot get into the bakery','makes the river sweeter and is somewhat insufferable about it'],
 'Orunmila':['can read the future and still loses at tic-tac-toe','is present at every birth, and never remembers to RSVP'],
 'Freya':['drives a chariot pulled by cats and gets constant parking tickets','cried tears of gold and now sells them online'],
 'Fenrir':['bit off a hand and was asked to sign a form','was chained with a ribbon and is still sulking about it'],
 'Baldur':['is so lovable nothing can hurt him, except one mistletoe','cannot be harmed by anything, including most compliments'],
 'Heimdall':['hears grass grow and has filed a noise complaint','guards the rainbow bridge and checks IDs very slowly'],
 'Tyr':['put a hand in a wolf\'s mouth for a friend and now claims it on insurance','is the god of fair play and loses every board game'],
 'Quetzalcoatl':['is a feathered snake who now works the night shift as a scarf','invented the calendar, and double-booked himself immediately'],
 'Huitzilopochtli':['was born fully armed and has been returning gifts ever since','keeps the sun up, mostly on a timer'],
 'Tlaloc':['makes it rain at weddings and has never apologised','keeps four jars of rain and one of mild drizzle'],
 'Coatlicue':['wears a skirt of snakes, which is stylish and hard to launder','found a ball of feathers and got an entire war out of it'],
 'Xolotl':['guides dogs and the dead and refuses to use a leash','walks the sun through the underworld and is always late for dinner'],
 'Tezcatlipoca':['owns a smoking mirror and absolutely nobody asked him to','lost a foot to a monster and now buys only one shoe'],
 'Mictlantecuhtli':['runs a nine-level underworld and nobody knows the Wi-Fi password','has a skull-themed office and a very polite waiting room'],
 'Chukwu':['made the world and still gets pinged about the bugs','keeps one eye on the sky and one on his inbox'],
 'Amadioha':['sends thunder to settle disputes and demands a receipt','is the sky\'s judge, and he has never lost an appeal'],
 'Ala':['owns all the land and politely asks you to wipe your feet','is the earth mother and the best neighbour on the block'],
 'Ekwensu':['is the bringer of chaos and constantly underestimates a good parking space','started a minor riot over the last jollof and enjoyed it'],
 'Anyanwu':['is the sun, and always sunburnt, purely out of principle','has a shift at dawn and sleeps in every other day'],
 'Ikenga':['carries a horned shrine of luck and hates being asked to hold coats','holds a machete in one hand and a plantain in the other'],
 'Idemili':['is the water spirit and the python of the river, and she rents out the shallows','makes honest people honest and lawyers anxious'],
 'Agwu':['gave a healer a gift and a headache in the same box','is the spirit of divination and nobody can reach him by phone']
};
const MYTHKEYS=Object.keys(MYTH);
function mythName(){const k=pick(MYTHKEYS);return{key:k,first:k,last:pick(SURN)}}

/* ---------- made-up details ---------- */
const GA=['classical','neo','post','doom','baroque','acoustic','lo-fi','cyber','free','death','sea-shanty','math','trans','swamp','smooth','chiptune','tropical','underwater','extreme','disco','lullaby','karaoke','medieval','vapor'];
const GB=['dubstep','folk','polka','opera','metal','jazz','bossa nova','gospel','techno','country','ska','trap','blues','funk','shoegaze','synthwave','bluegrass','reggae','K-pop','enka','fado','cumbia','qawwali','gamelan','drill','yodelling','grindcore','highlife','afrobeat','amapiano','juju','mariachi'];
const HYPH=new Set(['neo','post','trans','lo-fi','cyber','sea-shanty','math']);
function genre(){const a=pick(GA),b=pick(GB);return HYPH.has(a)?a+'-'+b:a+' '+b}
const PA=['competitive','obsessive','secret','professional','amateur','reluctant','award-winning'];
const PB=['pigeon chess','bonsai','urban beekeeping','speed knitting','napping','cloud naming','noodle sculpting','lantern design','roller disco','lockpicking (legal)','synth repair','kite fighting','stargazing in the rain','pressing flowers','umbrella restoration','karaoke diplomacy','soldering','puddle jumping','map folding','tea ceremonies for robots','uli body-art','kola-nut etiquette','jollof diplomacy','masquerade dancing'];
const PC=['collecting {x}','arguing with {x}','befriending {x}','knitting sweaters for {x}'],PX=['vending machines','lost umbrellas','bus tickets','rare pebbles','antique firmware','stray cables','tiny hats','moths'];
function passion(){return Math.random()<.7?pick(PA)+' '+pick(PB):pick(PC).replace('{x}',pick(PX))}
const GV=['arm-wrestled','out-sang','befriended','sold insurance to','taught yoga to','raced','married by accident','out-stared','adopted','escaped from','negotiated with','won a duel against'];
const GJ=['grumpy','enormous','invisible','bilingual','sentient','damp','retired','suspiciously polite','three-legged'];
const GN=['whale','toaster','lighthouse','goat','cloud','vending machine','bishop','octopus','pigeon','robot','submarine','accordion'];
const GP=['a car wash','Atlantis','the 7-Eleven on the moon','a library at midnight','a haunted escalator','Lisbon','an elevator','a tiny desert','the lost-and-found'];
const GT=[' and lived',' and won',' and lost, but only just',', then apologised',' for charity',', twice',', allegedly',' before breakfast'];
const GEN=['fought a whale and lived','won an argument with a vending machine','has been to the moon (it was closed)','can fold a fitted sheet','taught a pigeon to play chess; the pigeon retired undefeated','invented a new colour and nobody believed them','holds the district record for staring at a wall','got lost in their own apartment for three days','speaks fluent pigeon','keeps a pet cloud','was struck by lightning twice and a bus once, all on a Tuesday'];
function generic(){return Math.random()<.35?pick(GEN):pick(GV)+' a '+pick(GJ)+' '+pick(GN)+' in '+pick(GP)+pick(GT)}
function fact(m){return(m&&MYTH[m.key]&&Math.random()<.68)?pick(MYTH[m.key]):generic()}
function age(def){
  if(def&&def.age)return ri(def.age[0],def.age[1]);return ri(19,71);
}
function profile(ch){
  const m=ch.myth,def=ch.def;
  return{name:(m?m.first+' '+m.last:'Unknown').toUpperCase(),age:age(def)+(def&&def.ageUnit||''),passion:passion(),genre:genre(),fact:fact(m)};
}
g.Lore={parable,mythName,profile,genre,passion,fact};
})(window);
