// あまあまマッチ：ワールド・ステージ・ショップのデータ
"use strict";
const ROWS = 8, COLS = 8;

/* ワールド:名前・説明・背景の色・BGM */
const WORLDS = [
  { w: 1, name: 'いちごの森', bg: ['#ff9cc6', '#d86fb8', '#7b3a9c'], board: 'rgba(90,20,80,.5)', bgm: 'w1',
    intro: null },
  { w: 2, name: 'ゼリーの湖', bg: ['#9ee8ff', '#6aa8f0', '#4a3aa8'], board: 'rgba(20,40,110,.5)', bgm: 'w2',
    intro: { title: 'ゼリー', art: 'jelly', text: 'おかしの下に<b>ゼリー</b>があります。上のおかしを消すとゼリーも消えます。<b>こいゼリー</b>は2回消さないとなくなりません。ぜんぶ消したらクリア!' } },
  { w: 3, name: 'クリームの丘', bg: ['#ffe2b8', '#f5a98a', '#b0507a'], board: 'rgba(110,40,50,.48)', bgm: 'w3',
    intro: { title: 'クリームのかべ', art: 'cream', text: '<b>クリーム</b>は動かせないかべです。<b>となりでおかしをそろえる</b>か、スペシャルを当てるとこわれます。重なったクリームは何回か当てないとこわれません。' } },
  { w: 4, name: 'くだもの工場', bg: ['#c8f5a0', '#7cc8a0', '#2f6f7a'], board: 'rgba(20,70,60,.5)', bgm: 'w4',
    intro: { title: 'さくらんぼ', art: 'ing', text: '<b>さくらんぼ</b>とくるみは、そろえて消すことができません。下のおかしを消して、<b>いちばん下まで落とす</b>と回収できます。' } },
  { w: 5, name: 'チョコのお城', bg: ['#d8b8a0', '#9a6a5a', '#3a1a2a'], board: 'rgba(50,20,15,.55)', bgm: 'w5',
    intro: { title: 'ふえるチョコとカギ', art: 'choco', text: '<b>チョコ</b>は、その手でひとつも消さないと、となりのおかしを食べて<b>ふえます</b>。となりでそろえてこわそう。<br><b>カギつき</b>のおかしは動かせません。そろえるとカギが外れます。' } },
];

/*
 盤面の記号
  .  ふつうのおかし         #  穴(マスなし)
  j  ゼリー1                J  こいゼリー(2回)
  c  クリーム1              C  クリーム2   K クリーム3
  1  ゼリーの上にクリーム1  2  ゼリーの上にクリーム2
  x  チョコ                 l  カギつきおかし   L  ゼリーの上のカギつき
 ゴール
  score:点数 / collect:色を集める / jelly:ゼリー全部 / cream:クリーム全部 / choco:チョコ全部 / lock:カギ全部 / ing:さくらんぼを落とす
*/
const F = '........';
const FULL = [F, F, F, F, F, F, F, F];
const L = (...rows) => rows;

const STAGES = [
  /* ---------- ワールド1:いちごの森 ---------- */
  { id: '1-1', colors: 5, moves: 16, layout: FULL, goals: [{ t: 'score', n: 2500 }], tut: 'swipe' },
  { id: '1-2', colors: 5, moves: 15, layout: FULL, goals: [{ t: 'collect', c: 0, n: 22 }], tut: 'special' },
  { id: '1-3', colors: 5, moves: 14, layout: L('##....##', '#......#', F, F, F, F, '#......#', '##....##'), goals: [{ t: 'score', n: 6000 }] },
  { id: '1-4', colors: 5, moves: 15, layout: FULL, goals: [{ t: 'collect', c: 1, n: 22 }, { t: 'collect', c: 4, n: 22 }] },
  { id: '1-5', colors: 5, moves: 15, layout: L(F, F, '..#..#..', F, F, '..#..#..', F, F), goals: [{ t: 'score', n: 7000 }] },
  { id: '1-6', colors: 6, moves: 22, layout: L('#......#', F, F, F, F, F, F, '#......#'), goals: [{ t: 'collect', c: 2, n: 24 }] },
  { id: '1-7', colors: 6, moves: 24, layout: L('...##...', F, F, '#......#', '#......#', F, F, '...##...'), goals: [{ t: 'collect', c: 3, n: 22 }, { t: 'collect', c: 5, n: 22 }] },
  { id: '1-8', colors: 6, moves: 25, layout: L(F, '#......#', '##....##', '###..###', '###..###', '##....##', '#......#', F), goals: [{ t: 'score', n: 9000 }] },

  /* ---------- ワールド2:ゼリーの湖 ---------- */
  { id: '2-1', colors: 5, moves: 18, layout: L(F, F, '..jjjj..', '..jjjj..', '..jjjj..', '..jjjj..', F, F), goals: [{ t: 'jelly' }] },
  { id: '2-2', colors: 5, moves: 28, layout: L('jjjjjjjj', 'j......j', 'j......j', 'j......j', 'j......j', 'j......j', 'j......j', 'jjjjjjjj'), goals: [{ t: 'jelly' }] },
  { id: '2-3', colors: 5, moves: 24, layout: L('...JJ...', '...JJ...', '...JJ...', 'JJJJJJJJ', 'JJJJJJJJ', '...JJ...', '...JJ...', '...JJ...'), goals: [{ t: 'jelly' }] },
  { id: '2-4', colors: 5, moves: 24, layout: L('##jjjj##', '#jj..jj#', 'jj....jj', 'j......j', 'j......j', 'jj....jj', '#jj..jj#', '##jjjj##'), goals: [{ t: 'jelly' }] },
  { id: '2-5', colors: 5, moves: 20, layout: L(F, '.jjjjjj.', '.j....j.', '.j.JJ.j.', '.j.JJ.j.', '.j....j.', '.jjjjjj.', F), goals: [{ t: 'jelly' }, { t: 'collect', c: 0, n: 20 }] },
  { id: '2-6', colors: 5, moves: 30, layout: L('jjjjjjjj', 'jjjjjjjj', 'jjjjjjjj', 'jjjjjjjj', 'jjjjjjjj', 'jjjjjjjj', 'jjjjjjjj', 'jjjjjjjj'), goals: [{ t: 'jelly' }] },
  { id: '2-7', colors: 6, moves: 32, layout: L('j......j', '.j....j.', '..j..j..', '...JJ...', '...JJ...', '..j..j..', '.j....j.', 'j......j'), goals: [{ t: 'jelly' }] },
  { id: '2-8', colors: 6, moves: 32, layout: L(F, F, 'jjjjjjjj', 'jjjjjjjj', 'jjJJJJjj', 'jjJJJJjj', 'jjjjjjjj', '#jjjjjj#'), goals: [{ t: 'jelly' }] },

  /* ---------- ワールド3:クリームの丘 ---------- */
  { id: '3-1', colors: 5, moves: 20, layout: L(F, F, F, F, F, 'cc....cc', 'cc....cc', 'cc....cc'), goals: [{ t: 'cream' }] },
  { id: '3-2', colors: 5, moves: 22, layout: L(F, F, F, 'CC.CC.CC', 'CC.CC.CC', F, F, F), goals: [{ t: 'cream' }] },
  { id: '3-3', colors: 5, moves: 21, layout: L(F, F, F, F, 'j.j.j.j.', '.j.j.j.j', '1.1.1.1.', '.1.1.1.1'), goals: [{ t: 'jelly' }] },
  { id: '3-4', colors: 5, moves: 30, layout: L('CC....CC', 'C......C', F, F, F, F, 'C......C', 'CC....CC'), goals: [{ t: 'cream' }, { t: 'collect', c: 3, n: 20 }] },
  { id: '3-5', colors: 6, moves: 18, layout: L(F, F, '...cc...', '..cccc..', '.cc..cc.', F, F, F), goals: [{ t: 'cream' }] },
  { id: '3-6', colors: 6, moves: 30, layout: L(F, F, F, 'C......C', 'C......C', 'C......C', 'C......C', F), goals: [{ t: 'cream' }] },
  { id: '3-7', colors: 6, moves: 32, layout: L('jjj..jjj', 'jjj..jjj', F, '..1111..', '..1111..', F, 'jjj..jjj', 'jjj..jjj'), goals: [{ t: 'jelly' }] },
  { id: '3-8', colors: 6, moves: 36, layout: L(F, '.c.c.c.c', 'c.c.c.c.', F, F, '.C.C.C.C', 'jjjjjjjj', 'jjjjjjjj'), goals: [{ t: 'cream' }, { t: 'jelly' }] },

  /* ---------- ワールド4:くだもの工場 ---------- */
  { id: '4-1', colors: 5, moves: 26, layout: FULL, goals: [{ t: 'ing', n: 2 }] },
  { id: '4-2', colors: 5, moves: 28, layout: L('#......#', F, F, F, F, F, F, '#......#'), goals: [{ t: 'ing', n: 2 }] },
  { id: '4-3', colors: 5, moves: 26, layout: L(F, F, F, F, 'jjjjjjjj', 'jjjjjjjj', 'jjjjjjjj', 'jjjjjjjj'), goals: [{ t: 'ing', n: 2 }, { t: 'jelly' }] },
  { id: '4-4', colors: 5, moves: 26, layout: L(F, F, F, F, 'c..cc..c', 'c..cc..c', F, F), goals: [{ t: 'ing', n: 3 }] },
  { id: '4-5', colors: 6, moves: 30, layout: L('##....##', '#......#', F, F, F, F, F, F), goals: [{ t: 'ing', n: 3 }] },
  { id: '4-6', colors: 6, moves: 30, layout: FULL, goals: [{ t: 'ing', n: 2 }, { t: 'collect', c: 4, n: 22 }] },
  { id: '4-7', colors: 6, moves: 32, layout: L(F, F, 'CC....CC', F, F, '..CCCC..', F, F), goals: [{ t: 'ing', n: 2 }] },
  { id: '4-8', colors: 6, moves: 36, layout: L(F, F, F, F, '.jjjjjj.', '.jjjjjj.', 'jjJJJJjj', 'jjJJJJjj'), goals: [{ t: 'ing', n: 2 }, { t: 'jelly' }] },

  /* ---------- ワールド5:チョコのお城 ---------- */
  { id: '5-1', colors: 5, moves: 22, layout: L(F, F, F, F, F, 'x......x', 'xx....xx', 'xx....xx'), goals: [{ t: 'choco' }] },
  { id: '5-2', colors: 5, moves: 20, layout: L(F, F, '.l.ll.l.', F, F, '.l.ll.l.', F, F), goals: [{ t: 'lock' }] },
  { id: '5-3', colors: 5, moves: 24, layout: L('jjjjjjjj', 'jjjjjjjj', F, F, F, F, '..xxxx..', '..xxxx..'), goals: [{ t: 'choco' }, { t: 'jelly' }] },
  { id: '5-4', colors: 5, moves: 26, layout: L(F, '.LLLLLL.', '.L....L.', '.L....L.', '.L....L.', '.L....L.', '.LLLLLL.', F), goals: [{ t: 'jelly' }] },
  { id: '5-5', colors: 6, moves: 22, layout: L(F, F, F, '...xx...', '..xxxx..', '..xxxx..', F, F), goals: [{ t: 'choco' }] },
  { id: '5-6', colors: 6, moves: 34, layout: L(F, F, 'CC....CC', F, F, F, 'x......x', 'xx....xx'), goals: [{ t: 'choco' }, { t: 'cream' }] },
  { id: '5-7', colors: 6, moves: 34, layout: L(F, '..l..l..', F, '.l.ll.l.', F, '..l..l..', F, F), goals: [{ t: 'lock' }, { t: 'ing', n: 2 }] },
  { id: '5-8', colors: 6, moves: 34, layout: L('jjjjjjjj', 'jLjLjLjL', F, F, F, F, 'x..xx..x', 'xx.xx.xx'), goals: [{ t: 'choco' }, { t: 'jelly' }] },
];
STAGES.forEach((s, i) => {
  s.idx = i; s.w = +s.id.split('-')[0];
  // 星2・星3の点数:手数にあわせて
  const base = s.goals.find(g => g.t === 'score');
  s.stars = base ? [base.n, Math.round(base.n * 1.5 / 100) * 100, Math.round(base.n * 2.1 / 100) * 100]
                 : [0, Math.round(s.moves * 420 / 100) * 100, Math.round(s.moves * 680 / 100) * 100];
});

/* ショップ */
const ITEMS = {
  hammer:  { name: 'ハンマー',     price: 200, desc: 'おかしやかべを1つこわす(手数は減らない)', icon: 'hammer' },
  shuffle: { name: 'シャッフル',   price: 120, desc: '盤面のおかしをまぜなおす(手数は減らない)', icon: 'shuffle' },
  plus5:   { name: '+5手',         price: 300, desc: '手数が切れたときに5手ふやして続ける', icon: 'plus5' },
  startLW: { name: 'スタートしましま', price: 180, desc: 'しましまとつつみを持ってスタート', icon: 'startLW' },
  startBomb: { name: 'スタートチョコボム', price: 300, desc: 'チョコボムを持ってスタート', icon: 'startBomb' },
};
const CREDITS = 'BGM:魔王魂 / 効果音:効果音ラボ';
