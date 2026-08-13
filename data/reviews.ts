// data/reviews.ts
import type { Review } from '@/lib/types';

export const reviews: Review[] = [
  // The Brutalist (Hero Movie - Heaviest "Live" Activity)
  { id: 'rv1', titleId: 't1', reviewerId: 'r1', score: 9.2, recommend: true, headline: 'A monument of a film — and the rare American epic that earns its three-and-a-half hours.', date: '14 minutes ago', runtime: '31:42', views: '892K', verdict: "Corbet's ambition is staggering. Every shot has weight. Brody is going to win." },
  { id: 'rv2', titleId: 't1', reviewerId: 'r3', score: 8.8, recommend: true, headline: "Old-fashioned in the best way. They don't make these anymore.", date: '2 hours ago', runtime: '22:18', views: '1.4M', verdict: 'A film that believes in cinema as architecture. Magisterial — though the second half wobbles.' },
  { id: 'rv3', titleId: 't1', reviewerId: 'r4', score: 9.5, recommend: true, headline: 'Frame-by-frame, the most rigorous American movie of the year.', date: '5 hours ago', runtime: '44:09', views: '301K', verdict: 'Spent 20 minutes just on the opening. Worth every second.' },
  { id: 'rv4', titleId: 't1', reviewerId: 'r6', score: 8.5, recommend: true, headline: "Brady Corbet finally got the canvas he's been swinging for.", date: '12 hours ago', runtime: '36:51', views: '194K', verdict: 'You can feel Corbet wrestling with influence — Kubrick, Anderson, even Visconti.' },
  { id: 'rv5', titleId: 't1', reviewerId: 'r2', score: 6.0, recommend: false, headline: 'Beautiful. Bloated. Ultimately hollow.', date: '1 day ago', runtime: '13:24', views: '447K', verdict: 'It looks incredible. It says less than it thinks. The third act loses its nerve completely.' },
  { id: 'rv6', titleId: 't1', reviewerId: 'r5', score: 7.8, recommend: true, headline: 'A swing for the fences in an era of bunts.', date: '2 days ago', runtime: '17:55', views: '288K', verdict: "Whatever its flaws, this is the kind of film the industry says it can't make anymore." },
  { id: 'rv7', titleId: 't1', reviewerId: 'r8', score: 8.0, recommend: true, headline: 'A film about being unmade and remade.', date: '3 days ago', runtime: '15:33', views: '128K', verdict: 'The architecture is the metaphor. Sometimes too neatly. But I felt this one in my chest.' },

  // The Substance
  { id: 'rv8', titleId: 't2', reviewerId: 'r1', score: 8.5, recommend: true, headline: 'The most committed performance Demi Moore has ever given.', date: '4 days ago', runtime: '28:11', views: '2.1M', verdict: "Fargeat goes for the throat and doesn't blink." },
  { id: 'rv9', titleId: 't2', reviewerId: 'r2', score: 7.5, recommend: true, headline: 'Goes too far, on purpose, and is better for it.', date: '1 week ago', runtime: '10:48', views: '634K', verdict: 'A maximalist body horror that earns its excess.' },
  { id: 'rv10', titleId: 't2', reviewerId: 'r3', score: 5.5, recommend: false, headline: 'Provocation mistaken for argument.', date: '2 weeks ago', runtime: '19:02', views: '512K', verdict: "Loud, gory, obvious. The film thinks it's saying more than it is." },
  { id: 'rv11', titleId: 't2', reviewerId: 'r4', score: 8.2, recommend: true, headline: 'A Cronenberg by way of Verhoeven by way of TikTok.', date: '2 weeks ago', runtime: '38:24', views: '218K', verdict: 'Reads as deeply considered formalism dressed up as schlock.' },
  { id: 'rv12', titleId: 't2', reviewerId: 'r8', score: 9.0, recommend: true, headline: "I haven't stopped thinking about it for two weeks.", date: '3 weeks ago', runtime: '12:15', views: '301K', verdict: 'A horror movie about being a woman over 40 in an industry built to discard you.' },

  // Severance (Currently airing, high recent activity)
  { id: 'rv13', titleId: 't3', reviewerId: 'r1', score: 9.0, recommend: true, headline: "Season two doesn't miss. It expands.", date: '34 minutes ago', runtime: '41:23', views: '1.8M', verdict: 'Where season one set the table, season two starts breaking the dishes.' },
  { id: 'rv14', titleId: 't3', reviewerId: 'r5', score: 8.7, recommend: true, headline: "TV's most patient mystery is paying off.", date: '3 hours ago', runtime: '14:08', views: '422K', verdict: 'Slow burn pays dividends. Episode 7 is one of the great hours of TV in years.' },
  { id: 'rv15', titleId: 't3', reviewerId: 'r2', score: 7.0, recommend: true, headline: 'Mostly worth the three-year wait.', date: '6 hours ago', runtime: '11:51', views: '512K', verdict: 'A few episodes feel like wheel-spinning. The premiere and finale are excellent.' },
  { id: 'rv16', titleId: 't3', reviewerId: 'r7', score: 8.8, recommend: true, headline: "Severance is back and it's strange as hell.", date: '8 hours ago', runtime: '8:44', views: '178K', verdict: "Every week I think the show can't get weirder. Every week it does." },

  // Anora (Catalog title)
  { id: 'rv17', titleId: 't4', reviewerId: 'r1', score: 8.8, recommend: true, headline: "Sean Baker's loosest, funniest film.", date: '2 months ago', runtime: '26:32', views: '1.1M', verdict: 'Mikey Madison is a revelation.' },
  { id: 'rv18', titleId: 't4', reviewerId: 'r3', score: 8.5, recommend: true, headline: 'A screwball comedy with claws.', date: '2 months ago', runtime: '20:14', views: '688K', verdict: "It's a comedy until it isn't. The final 15 minutes recontextualize everything." },
  { id: 'rv19', titleId: 't4', reviewerId: 'r8', score: 9.2, recommend: true, headline: 'I will defend the ending forever.', date: '3 months ago', runtime: '13:42', views: '244K', verdict: "People are going to argue about that last scene for years. I think it's perfect." },
  { id: 'rv20', titleId: 't4', reviewerId: 'r2', score: 7.2, recommend: true, headline: 'Funny, frantic, slightly overlong.', date: '3 months ago', runtime: '9:55', views: '388K', verdict: 'A great movie with a terrific performance.' },

  // Nosferatu
  { id: 'rv21', titleId: 't5', reviewerId: 'r1', score: 8.4, recommend: true, headline: "Eggers' most accessible film, somehow also his strangest.", date: '4 months ago', runtime: '33:18', views: '1.5M', verdict: 'Lily-Rose Depp is extraordinary.' },
  { id: 'rv22', titleId: 't5', reviewerId: 'r3', score: 9.0, recommend: true, headline: 'Gothic horror at the level of the originals.', date: '4 months ago', runtime: '24:51', views: '922K', verdict: 'A reverent, ravishing remake.' },
  { id: 'rv23', titleId: 't5', reviewerId: 'r2', score: 6.5, recommend: true, headline: 'Gorgeous and a little inert.', date: '4 months ago', runtime: '12:08', views: '301K', verdict: 'Stunning craft, but dramatically static.' },
  { id: 'rv24', titleId: 't5', reviewerId: 'r6', score: 8.8, recommend: true, headline: 'A Murnau homage that earns the comparison.', date: '4 months ago', runtime: '29:44', views: '188K', verdict: 'Eggers continues to be the most exciting horror filmmaker working.' },

  // The Penguin
  { id: 'rv25', titleId: 't6', reviewerId: 'r5', score: 8.6, recommend: true, headline: 'Better than any Batman movie of the last decade.', date: '5 months ago', runtime: '16:22', views: '744K', verdict: 'A great crime show that happens to have a fat-suited Colin Farrell in it.' },
  { id: 'rv26', titleId: 't6', reviewerId: 'r1', score: 8.0, recommend: true, headline: 'Cristin Milioti carries this show on her back.', date: '5 months ago', runtime: '24:11', views: '612K', verdict: 'The supporting work is so good it makes you reconsider the whole DC project.' },
  { id: 'rv27', titleId: 't6', reviewerId: 'r7', score: 8.2, recommend: true, headline: 'The surprise show of the year.', date: '5 months ago', runtime: '7:18', views: '198K', verdict: 'Episode 4 alone justifies the season.' },

  // Conclave
  { id: 'rv28', titleId: 't7', reviewerId: 'r3', score: 8.5, recommend: true, headline: 'A pulp delight with Vatican wallpaper.', date: '5 months ago', runtime: '17:34', views: '588K', verdict: "It's a thriller. It's a procedural. It's deeply silly. It's wonderful." },
  { id: 'rv29', titleId: 't7', reviewerId: 'r2', score: 7.8, recommend: true, headline: 'Fiennes is great. The plot is bananas.', date: '5 months ago', runtime: '11:02', views: '422K', verdict: 'You will see the twist coming. You will enjoy it anyway.' },
  { id: 'rv30', titleId: 't7', reviewerId: 'r5', score: 7.5, recommend: true, headline: 'Awards bait done right.', date: '5 months ago', runtime: '13:48', views: '288K', verdict: 'A reminder that "prestige" doesn\'t have to mean homework.' },

  // Companion
  { id: 'rv31', titleId: 't8', reviewerId: 'r2', score: 7.5, recommend: true, headline: 'A clever genre exercise that earns its premise.', date: '2 months ago', runtime: '10:22', views: '244K', verdict: 'The trailer gives the game away. The movie is still very fun.' },
  { id: 'rv32', titleId: 't8', reviewerId: 'r4', score: 8.0, recommend: true, headline: 'The script is doing more than you think.', date: '2 months ago', runtime: '27:51', views: '102K', verdict: 'A second viewing reveals layers.' },
  { id: 'rv33', titleId: 't8', reviewerId: 'r1', score: 6.8, recommend: true, headline: 'A solid B+ that wants to be more.', date: '2 months ago', runtime: '19:14', views: '388K', verdict: 'Smart, swift, slightly underbaked.' },
];