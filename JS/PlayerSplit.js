export class PlayerSplit extends Player {
  constructor(player) {
    super(player.name, player.money);
    this.cards = [];
    this.cards.push(player.cards.pop());
    this.bet = player.bet;
    this.finalScore = 0;
    this.status = { isPlaying: true, hasBet: true, isDone: false };
    this.setSubObj(player);
  }
  setSubObj(player) {
    player.playerSplit = this;
  }
}
