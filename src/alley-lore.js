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

/* ---------- cultures: first names, surnames, folk heroes, celebrities and the (joke) facts about them ---------- */
const CULT={
 filipino:{first:['Maria','Jose','Juan','Andres','Gabriela','Angelica','Rafael','Luzviminda','Jun-jun','Bituin','Dalisay','Ramon','Corazon','Joy','Bong'],
  last:['Santos','Reyes','Cruz','Bautista','Garcia','Mendoza','Villanueva','Aquino','Manalo','Salonga','Magsaysay','Dela Cruz','Ramos','Navarro','Pangilinan'],
  facts:['owns four karaoke machines and is not sorry','will start the Christmas season on the first of September, as is tradition','has a cousin in every country and a tito in every airport','knows exactly how long to simmer adobo and refuses to say','always brings pasalubong, even to the dentist','can fit eight people on one scooter, ethically'],
  fig:{
   'Lapu-Lapu':['is remembered for stopping an explorer on a beach, and also shares a name with a fish','is a national hero with a statue, a city, and a very confident grouper'],
   'Rizal':['was a doctor, poet and novelist, and reportedly spoke over twenty languages','wrote a novel so spicy it was banned, and then everyone read it twice'],
   'Bonifacio':['founded a revolution and still gets asked to split the bill','has more streets named after him than anyone has ever found parking on'],
   'Maria Makiling':['is the fairy of a mountain who lends gold to the poor and hides from litterers','guards a mountain, and her hiking-trail ratings are brutal'],
   'Bathala':['is the supreme god, and still waits for the elevator like everyone else','created the world and was mildly surprised by the traffic'],
   'Mayari':['is the moon goddess, who lost an eye in a duel with her brother, so the night is gently dimmer','shares the sky shift with the sun and never gets a thank-you card'],
   'Juan Tamad':['is a folk hero who waited under a guava tree for the fruit to fall into his mouth','is the laziest hero in the islands and also the most relatable'],
   'Lam-ang':['was born talking and walked into an epic before he had a first haircut','fought a sea monster and came back with the wedding gifts'],
   'Bernardo Carpio':['is a giant who holds two mountains apart, so please do not ask him to sneeze','is famously stuck between two rocks, which is a metaphor'],
   'Malakas':['emerged from a bamboo stalk and has been unusually flexible ever since','came out of a bamboo and has opinions about pandas'],
   'Pacquiao':['is a champion boxer who has also released pop albums','is the only person with a left hook and a record deal'],
   'Lea':['is a Broadway star who sang for a Disney princess, and then for another one','has hit a note so high it filed a change of address']}},
 zulu:{first:['Sipho','Thandiwe','Themba','Nomvula','Sibusiso','Mandla','Zodwa','Lindiwe','Bongani','Nokuthula','Thabo','Ayanda','Zanele','Musa','Lwazi'],
  last:['Dlamini','Zulu','Ndlovu','Khumalo','Mkhize','Ngcobo','Zwane','Mthembu','Shabalala','Cele','Buthelezi','Nxumalo','Mabaso','Sithole','Radebe'],
  facts:['knows that ubuntu means "I am because we are", and cannot be argued out of it','can click three different ways in one sentence','can dance with a stick and still make it to the bus','makes a very serious pot of pap','has a praise name longer than the street','says "eish" with seven different meanings'],
  fig:{
   'Shaka':['introduced a short stabbing spear and a habit of always being on time','founded a nation and invented the "I told you to be early" speech'],
   'Nandi':['was a queen mother who did not tolerate any nonsense, from any army','raised a king and could silence a battlefield with an eyebrow'],
   'Unkulunkulu':['is the first being, who broke humans off a bed of reeds','made the world and was heard sighing about the reeds'],
   'Nomkhubulwane':['is the sky princess who brings rain and good harvests, and holds a grudge about umbrellas','sends the rain and a very clear message about timing'],
   'Mamlambo':['is a river spirit with a horse\'s head, so everyone leaves her a good review','lives in a river and has an impeccable reputation for swimming'],
   'Tokoloshe':['is a mischievous water sprite, which is why everyone raises their bed on bricks','pranks sleepers, then apologises with a very small cup of tea'],
   'Magogo':['was a princess who composed songs and played the ugubhu bow like a quiet storm','sang and played her bow at once, and the bow never complained'],
   'Cetshwayo':['was a king who once won a famous battle, and has a street, a museum and a very good hat','is honoured by a statue that is very stern about litter']}},
 colombian:{first:['Santiago','Camila','Sofia','Mateo','Valentina','Sebastian','Daniela','Alejandro','Isabella','Andres','Luisa','Nicolas','Mariana','Felipe','Catalina'],
  last:['Garcia','Rodriguez','Martinez','Lopez','Gomez','Hernandez','Restrepo','Ospina','Valencia','Cardona','Betancur','Zapata','Arango','Mejia','Quintero'],
  facts:['has been to a country with more bird species than anywhere else, and keeps a checklist','knows the best mountain for the coffee and refuses to say which','can dance cumbia in a lift without hitting anyone','keeps arepas in the freezer for emergencies, both kinds','has a cousin who plays the accordion at every birthday','says "parce" at least twice per sentence'],
  fig:{
   'Shakira':['sells records in two languages and has a statue in her home town','has hips that apparently do not lie, and accountants who also do not'],
   'Gabo':['wrote about a town where it rained for four years, and he is not allowed to review the weather','is a novelist who made butterflies and magic part of the everyday'],
   'Botero':['painted round, cheerful figures, and never once a slim sandwich','sculpted a very large cat that is now photographed more than most cats'],
   'Juan Valdez':['is a coffee farmer with a mule named Conchita, and both have a better commute than you','is an advertising character, so he has no sick leave'],
   'Bolivar':['is the namesake of a country, a currency and many squares, which is a lot for one horse rider','led armies across the Andes and still got lost indoors'],
   'Bochica':['struck a rock with a golden staff to drain a flood, and made a waterfall in the process','is a hero who taught people to farm and to weave, and to look both ways before a flood'],
   'Bachue':['rose from a lake with a baby boy, and returned as a snake when it was time for a rest','is the mother of the people and also, regrettably, the lake wifi'],
   'La Llorona':['is the weeping woman of the river, and has the loudest voice in the building','wails along the water at night, and the neighbours have complained'],
   'El Mohan':['is a river spirit who likes to hide your fishing gear, and then laugh','is a river sprite with a tendency to borrow things'],
   'Nairo':['is a cyclist who climbs mountains for fun and pays no attention to the downhill','pedals up the Andes and thinks the lifts are a bit much']}},
 ugandan:{first:['Mugisha','Nakato','Okello','Kato','Namukasa','Opio','Atim','Kiwanuka','Tumusiime','Akello','Nabirye','Ssebunya','Lutaaya','Byaruhanga','Nakamya'],
  last:['Mugisha','Okello','Nakamya','Kato','Ssemakula','Namukasa','Opio','Atim','Kiwanuka','Byaruhanga','Tumusiime','Akello','Mukasa','Ssebunya','Nabirye'],
  facts:['claims the Rolex was invented here, and the Rolex is eggs in a chapati, officially','lives in the Pearl of Africa, and mentions it','knows exactly where the Nile begins, and will walk you there','makes matooke better than anyone you have met','says "oli otya?" and means it','keeps a Sunday football team and a full-time opinion about the referee'],
  fig:{
   'Kintu':['is the first man in a legend, who found his lost cow after passing a sky king\'s very rude tests','was set impossible tasks by a god and did them all, apart from the laundry'],
   'Nambi':['is the sky king\'s daughter who married the first man and brought chickens, a mistake that has never been forgiven','came down from the sky with a basket and an unexpected rooster'],
   'Walumbe':['is Death himself, who is quite the unpleasant uncle at family gatherings','lives underground and has the worst timing for an unannounced visit'],
   'Mukasa':['is the god of Lake Victoria, who looks after fish, fertility and the boat schedules','is a lake god who is always asked for a smooth ferry crossing'],
   'Kibuka':['is a god of war who rode a cloud, and was never affected by roadworks','fought from the clouds and has never had to look for a parking spot'],
   'Nyabingi':['is a spirit queen who led resistance, and who is still a very hard woman to argue with','was a spirit of resistance, and the neighbours still keep their voices down'],
   'Kabalega':['was a king who held off invaders for years, and he has a very large statue to prove it','resisted an empire with guerrilla tactics and excellent moustache maintenance'],
   'Cheptegei':['is a distance runner who has broken world records on the track, and the bus is rumoured to ask for a lift','runs so quickly that he often arrives before the news that he is coming'],
   'Kenzo':['sang a very danceable song that went worldwide and won an award for it','is a musician whose chart hit came with its own dance, and nobody has to learn it']}},
 japanese:{first:['Haruto','Sakura','Yuki','Hiroshi','Aoi','Ren','Hana','Takumi','Mei','Sora','Kenji','Akari','Daiki','Yui','Riku'],
  last:['Sato','Suzuki','Takahashi','Tanaka','Watanabe','Ito','Yamamoto','Nakamura','Kobayashi','Kato','Yoshida','Matsumoto','Inoue','Kimura','Hayashi'],
  facts:['bows to vending machines on principle, and they have never bowed back','knows seven words for rain, and uses all of them tonight','has folded a thousand paper cranes and has one wish left','keeps a lucky cat that waves at the wrong customers','takes the last train and the first train, and sleeps on neither','considers a perfectly cooked rice ball a life goal'],
  fig:{
   'Momotaro':['is the peach boy who recruited a dog, a monkey and a pheasant, and still had to split the dumplings','came out of a peach and went on to run the best team-building event on record'],
   'Urashima':['rescued a turtle, visited an undersea palace, and returned to find three hundred years had passed','has the worst jet lag in folklore'],
   'Kintaro':['is the golden boy who wrestled bears and won, and keeps a very large axe as a hobby','was raised on a mountain, and the bears still send him holiday cards'],
   'Benkei':['is the warrior monk who stood guard on a bridge and collected swords, and also lost a duel to a boy','collected 999 swords, and it is rude to ask about the thousandth'],
   'Kaguya':['is the princess found in a bamboo stalk, who sent suitors away to fetch impossible objects','returned to the moon, and the moon sends invoices'],
   'Issun-boshi':['is only an inch tall and defeated an ogre using a needle for a sword and a bowl for a boat','is a very small hero with very large plans'],
   'Raijin':['is the thunder god, who hits his drums at all hours of the night','carries drums on his back, and the neighbours have formally complained'],
   'Inari':['is the god of rice, foxes and success, in descending order of how often you will meet them','watches over rice and has a lot of foxes on staff'],
   'Miyazaki':['draws his films by hand, and his clouds are unionised','is an animator whose forests all have at least one friendly spirit'],
   'Kusama':['covers things in polka dots, including pumpkins and, once, a whole room','is an artist who makes the room look like it has the measles, on purpose and beautifully'],
   'Kurosawa':['directed films with a lot of rain and a lot of wind, which is the same weather as here','filmed samurai in storms and has never needed an umbrella budget']}},
 korean:{first:['Minjun','Seoyeon','Jiwoo','Haneul','Eunji','Joon','Yuna','Hyun','Soo','Dahyun','Taeyang','Jisoo','Minseo','Doyun','Chaeyoung'],
  last:['Kim','Lee','Park','Choi','Jung','Kang','Cho','Yoon','Jang','Lim','Han','Oh','Seo','Shin','Kwon'],
  facts:['keeps a second fridge just for kimchi, and it has a name','sings at a noraebang until the walls give a standing ovation','will insist you take the last piece of fried chicken, then watch you do it','was born at age one, as is traditional','carries a sheet mask for emergencies','keeps a small plant that has outlived three apartments'],
  fig:{
   'Dangun':['was born to a bear who turned into a woman after a hundred days of garlic and mugwort','founded the first kingdom, and is the reason garlic is taken seriously'],
   'Hwanung':['is the heavenly prince who came down with three thousand followers and a very long to-do list','descended to a mountain with a cloud, a rain master and a wind master'],
   'Jumong':['is the founder of a kingdom whose name means "skilled archer", and who never missed the bus either','was an archer so good his friends refused to play darts'],
   'Hong Gildong':['is a folk hero who steals from the corrupt rich, and cannot be found at the same address twice','is a Robin Hood who can be in eight places at once, typically in a rush'],
   'Gumiho':['is a nine-tailed fox who can take human form, and has nine opinions about tails','charms people, then asks for a snack'],
   'Dokkaebi':['is a goblin who loves wrestling and a bit of mischief, and carries a magic club for a laugh','is a mischievous goblin who can never resist a game of ssireum'],
   'Bari':['is the abandoned princess who journeyed to the underworld for medicine and became the patron of shamans','went to the other side for a cure and returned with a better deal'],
   'Yi Sun-sin':['is an admiral whose turtle-shaped ships made him famously undefeated at sea','is the admiral with turtle ships, which is the best fleet name ever'],
   'Sejong':['is the king who invented an alphabet so everyone could text faster','created Hangul, which is why the keyboard has no pain'],
   'Faker':['is a gamer who wins world championships and still cannot find a matching sock','plays so well that the other team saves time and disconnects'],
   'Psy':['made a horse-riding dance go worldwide, which was entirely accidental','is the reason a whole planet learned the invisible-horse dance']}},
 french:{first:['Camille','Lucas','Chloe','Louis','Manon','Hugo','Jade','Gabriel','Margaux','Theo','Elodie','Antoine','Sacha','Oceane','Mathis'],
  last:['Martin','Bernard','Dubois','Thomas','Robert','Richard','Petit','Durand','Leroy','Moreau','Simon','Laurent','Lefebvre','Michel','Dupont'],
  facts:['has a strong opinion on cheese, and there are over a thousand of those','has a strike scheduled for next Tuesday, in solidarity with the strike','owns a beret and is offended you asked','knows a cafe that has not changed its menu since 1921','argues cheerfully about whether a croissant is a cultural icon','refuses to eat lunch in under ninety minutes'],
  fig:{
   'Jeanne':['led an army at seventeen, and could definitely have run a larger group project','heard voices and then, remarkably, listened to them'],
   'Napoleon':['was actually average height for his time, which is the most annoying fact for everyone','conquered most of Europe, but never a decent croissant queue'],
   'Roland':['is the knight who blew an enormous horn, and whose sword broke the rock instead of itself','tried to break his sword on a stone and the stone filed a complaint'],
   'Melusine':['is a water fairy with a serpent\'s tail on Saturdays, and a strict privacy policy','built castles overnight, which is why her contractors are so cheap'],
   'Gargantua':['is a giant who was born from his mother\'s ear, which is unusual even in the Loire','ate six pilgrims in a salad, and was then given an apology and a bath'],
   'Cyrano':['was a duellist and poet with a famously large nose, and he writes letters, not selfies','duels with a rhyme in the air and fights with a pen'],
   'Marie':['won Nobel Prizes in two different sciences, and kept the glowing samples in her desk drawer','discovered two elements and left the glowing ones in a pocket'],
   'Edith':['sang with such feeling that pigeons stopped to listen','is a sparrow of Paris whose voice filled the whole chorus'],
   'Coco':['popularised the little black dress, so everything else you own is a comparison','made trousers respectable and a little black dress inevitable'],
   'Pasteur':['is the reason your milk is safe, and your dairy product jokes are not','heated up a lot of liquids, and said "this is good for everyone"'],
   'Zidane':['scored twice in a World Cup final with his head, which is the reason he is a legend','is a footballer who could pass the ball through a small apartment']}},
 english:{first:['Oliver','Charlotte','George','Amelia','Harry','Poppy','Jack','Florence','Alfie','Imogen','Archie','Matilda','Freddie','Beatrice','Edmund'],
  last:['Smith','Jones','Taylor','Brown','Williams','Wilson','Evans','Thomas','Johnson','Roberts','Walker','Wright','Robinson','Thompson','Hughes'],
  facts:['apologises to furniture, and the furniture apologises back','has a very strong opinion on how to make a cup of tea, and will share it','queues for the queue','says "not bad" when they mean "magnificent"','owns three umbrellas and has never needed one when carrying them','talks about the weather on a daily basis, and the weather has begun to talk back'],
  fig:{
   'Arthur':['pulled a sword from a stone, which was either destiny or very bad glue','is the once and future king, and he is very patient about the second part'],
   'Merlin':['lives backwards in time, so he already forgot what you are about to ask','is a wizard with a long beard and a longer sleeve of excuses'],
   'Guinevere':['is a queen of legend with strong opinions on who sits where at the round table','had the best seat at a round table, which is also a very good way of avoiding the head of the table'],
   'Robin Hood':['robs from the rich to give to the poor, and wears green tights on principle','is an outlaw who wins every archery contest, and the sheriff finally learned to bring a bigger target'],
   'Godiva':['rode through a town on a horse to lower the taxes, and the only person in trouble was the one peeping','is a lady of legend who made a very bold point about the taxes'],
   'Whittington':['is a folk hero who became Lord Mayor of London, with a cat who did excellent work behind the scenes','heard bells that said turn again, and then turned again'],
   'Alfred':['is the king who burned the cakes, and is still called "the Great"','defended England and has a statue for each kind of cake'],
   'Boudicca':['led a revolt against an empire, and has a very impressive statue by the river','drove a chariot into history and it came with an excellent soundtrack'],
   'George':['is the patron saint of England, who was not English, which no one has ever been able to resolve','killed a dragon, and has been mistaken for a pub ever since'],
   'Puck':['can put a girdle round the earth in forty minutes, and is still late for lunch','is a mischievous sprite who loves a prank, and pays the price in tea'],
   'Black Shuck':['is a spectral dog from Norfolk, which makes every dog walk a bit more interesting','is a ghostly hound with red eyes, and has never once gone to the vet'],
   'Isaac':['was famously hit on the head by an apple, or so the story goes, and he will not confirm the details','discovered gravity and inconvenience at the same time'],
   'Ada':['wrote the first computer program, and the world has been debugging it ever since','is the first programmer, who never had to worry about browser compatibility'],
   'Freddie':['had a four-octave vocal range and a lot of cats, who were fed first','sang in a stadium and the stadium sang back']}}
};
const OLDKEYS=Object.keys(CULT);
let CULTKEYS=OLDKEYS;
const CULTF={filipino:'PH',zulu:'ZA',colombian:'CO',ugandan:'UG',japanese:'JP',korean:'KR',french:'FR',english:'GB'};
const FIGF={Achilles:'GR',Odysseus:'GR',Icarus:'GR',Sisyphus:'GR',Hercules:'GR',Perseus:'GR',Medusa:'GR',Orpheus:'GR',Pandora:'GR',Midas:'GR',Narcissus:'GR',Prometheus:'GR',Atlas:'GR',Theseus:'GR',Ariadne:'GR',Daedalus:'GR',Persephone:'GR',Hades:'GR',Poseidon:'GR',Zeus:'GR',
 Loki:'IS',Thor:'IS',Odin:'IS',Freya:'IS',Fenrir:'IS',Baldur:'IS',Heimdall:'IS',Tyr:'IS',Anansi:'GH',Maui:'NZ','Sun Wukong':'CN',Gilgamesh:'IQ',Hanuman:'IN',Ganesh:'IN',Susanoo:'JP',Amaterasu:'JP',Anubis:'EG',Isis:'EG',Thoth:'EG',Ra:'EG','Cu Chulainn':'IE',Beowulf:'DK',Gabriel:'VA',
 Shango:'NG',Oya:'NG',Yemoja:'NG',Eshu:'NG',Ogun:'NG',Obatala:'NG',Oshun:'NG',Orunmila:'NG',Chukwu:'NG',Amadioha:'NG',Ala:'NG',Ekwensu:'NG',Anyanwu:'NG',Ikenga:'NG',Idemili:'NG',Agwu:'NG',
 Quetzalcoatl:'MX',Huitzilopochtli:'MX',Tlaloc:'MX',Coatlicue:'MX',Xolotl:'MX',Tezcatlipoca:'MX',Mictlantecuhtli:'MX',Bolivar:'VE'};
const SURNF={Okonkwo:'NG',Nwosu:'NG',Eze:'NG',Adeyemi:'NG',Balogun:'NG',Okeke:'NG',Obi:'NG',Nnamdi:'NG',Eriksen:'NO',Hernandez:'ES',Xochitl:'MX',Ramirez:'ES',Okafor:'NG',Tanaka:'JP',Petrov:'RU',Haddad:'LB',Kim:'KR',Singh:'IN',Rossi:'IT',Nguyen:'VN',Silva:'PT',Cohen:'US',Jovanovic:'RS',Mensah:'GH',Larsson:'SE',Reyes:'ES',Abdi:'SO',Ivanova:'RU',Chen:'CN',Dlamini:'ZA',Costa:'PT',Yilmaz:'TR',Park:'KR',Moreau:'FR'};
if(g.XC){Object.keys(g.XC).forEach(k=>{CULT[k]=g.XC[k];CULTF[k]=g.XC[k].cc});}
if(g.XE){Object.keys(g.XE).forEach(k=>{const C=CULT[k],E=g.XE[k];if(!C)return;['first','last'].forEach(w=>{const have=new Set(C[w].map(x=>x.toLowerCase()));(E[w]||[]).forEach(x=>{if(!have.has(x.toLowerCase())){have.add(x.toLowerCase());C[w].push(x)}})})})}
const ALLKEYS=Object.keys(CULT);
const NEWKEYS=Object.keys(CULT).filter(k=>OLDKEYS.indexOf(k)<0);
const flag=c=>c?String.fromCodePoint(...[...c].map(ch=>127397+ch.charCodeAt(0))):'';
const MYTHKEYS=Object.keys(MYTH);
function mythName(){
  const r=Math.random();
  const lastFrom=(skip,p)=>{ // surname: same culture, or mixed in from any other
    if(Math.random()<p){let b=pick(ALLKEYS),n=0;while(b===skip&&n++<5)b=pick(ALLKEYS);return{l:pick(CULT[b].last),c:CULTF[b],mix:b}}
    return null};
  if(r<.3){const k=pick(MYTHKEYS);let l=pick(SURN),c2=SURNF[l];const m=lastFrom(null,.5);if(m){l=m.l;c2=m.c}
    return{key:k,first:k,last:l,f1:flag(FIGF[k]),f2:flag(c2),c1:FIGF[k],c2}}
  const cu=pick(NEWKEYS.length&&Math.random()>.35?NEWKEYS:OLDKEYS),C=CULT[cu],cc=CULTF[cu];
  if(r<.6){const k=pick(Object.keys(C.fig));const m=lastFrom(cu,.4);const l=m?m.l:pick(C.last),c2=m?m.c:cc;
    return{key:k,first:k,last:l,cult:cu,f1:flag(cc),f2:flag(c2),c1:cc,c2}}
  const m=lastFrom(cu,.5);const l=m?m.l:pick(C.last),c2=m?m.c:cc;
  return{key:null,first:pick(C.first),last:l,cult:cu,f1:flag(cc),f2:flag(c2),c1:cc,c2}
}

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
function fact(m){
  if(m&&m.key&&MYTH[m.key]&&Math.random()<.68)return pick(MYTH[m.key]);
  if(m&&m.cult){const C=CULT[m.cult];if(m.key&&C.fig[m.key]&&Math.random()<.8)return pick(C.fig[m.key]);if(Math.random()<.6)return pick(C.facts)}
  return generic()}
/* ages that fit the kind of person, then a body that fits the age: height and weight vary independently */
const AGEB={umbrella:[22,68],courier:[18,34],kimono:[20,70],dog:[1,14,' (dog yrs)'],ramen:[32,68],hotdog:[24,62],lover:[19,36],ripperdoc:[38,65],netrunner:[16,31],monk:[38,92],dealer:[24,52],preacher:[36,78],robocop:[29,46],mascot:[18,27],detective:[36,62]};
function age(def,name){
  if(def&&def.age)return ri(def.age[0],def.age[1]);
  const a=AGEB[name];if(a)return ri(a[0],a[1]);
  return ri(19,71);
}
const gauss=()=>{let u=0;for(let i=0;i<4;i++)u+=Math.random();return(u-2)*1.73};
function meanCm(a,fem){
  if(a<=12)return 75+6.4*a;
  if(a<18)return 152+(a-12)*(fem?1.9:4.5);
  return(fem?163:176)-(a>65?(a-65)*.15:0);
}
/* returns {cm,kg,sh,sw} for people; {kg,sh,sw} for dogs; null for machines */
function body(name,fem,a,def){
  if(name==='drone')return null;
  if(name==='dog'){const k=.72+Math.random()*.62;return{cm:0,kg:Math.round(5+k*k*30),sh:k,sw:k*(.9+Math.random()*.25)}}
  if(name==='robocop'){const cm=Math.round(188+Math.random()*16),kg=Math.round(105+Math.random()*50);return{cm,kg,sh:1.04+Math.random()*.1,sw:1.12+Math.random()*.2}}
  const real=a>110?ri(28,60):a;                       /* ghosts and sages are drawn as adults */
  const nomAge=def&&def.age?(def.age[0]+def.age[1])/2:real,nom=meanCm(nomAge>110?40:nomAge,fem);
  const mu=meanCm(real,fem),sd=real<18?5.5:6.8,cm=Math.round(mu+clamp2(gauss(),2.3)*sd);
  const kid=real<18,bmi=kid?clampN(16+clamp2(gauss(),2.3)*2.4,12.5,27):clampN(24.5+clamp2(gauss(),2.3)*4.6,16,41);
  const kg=Math.round(bmi*Math.pow(cm/100,2));
  let sh=clampN(1+(cm/nom-1)*1.7,.74,1.3),sw=clampN(Math.pow(bmi/(kid?16:21.5),.8),.68,1.7);   /* exaggerated a little so the differences read at alley distance */
  if(name==='ramen'||name==='hotdog'){sh=1+(sh-1)*.3;sw=1+(sw-1)*.3}   /* the cart is part of the model */
  return{cm,kg,sh,sw};
}
const clamp2=(v,m)=>Math.max(-m,Math.min(m,v)),clampN=(v,a,b)=>Math.max(a,Math.min(b,v));
const ftin=cm=>{const t=Math.round(cm/2.54);return Math.floor(t/12)+"'"+(t%12)+'"'};
function profile(ch){
  const m=ch.myth,def=ch.def,a=ch.agev!=null?ch.agev:age(def,ch.name),b=ch.body,unit=(def&&def.ageUnit)||(AGEB[ch.name]&&AGEB[ch.name][2])||'';
  return{name:(m?m.first+' '+m.last:'Unknown').toUpperCase(),flags:m?(m.f1===m.f2?m.f1:m.f1+' '+m.f2):'',codes:m?(m.c1===m.c2?[m.c1]:[m.c1,m.c2]):[],age:a+unit,body:b?(b.cm?ftin(b.cm)+' \u00b7 ':'')+Math.round(b.kg*2.2046)+' lbs':'',passion:passion(),genre:genre(),fact:fact(m)};
}
g.Lore={parable,mythName,profile,genre,passion,fact,age,body};
})(typeof window!=='undefined'?window:globalThis);
