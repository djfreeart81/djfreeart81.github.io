import { Player } from "./Player.js";
import { Round } from "./Round.js";
import { Game } from "./GameClass.js";

const player1 = new Player("GG", 1000);
const player2 = new Player("Lenny", 1000);
const player3 = new Player("Fantome", 1000);
const CARD_DECK_SIZE = 4;
const game = new Game([player1, player2, player3]);
let round;
let bank;

console.log(
  `Player ${player1.name} created with id ${player1.id} and ${player1.money} $`
);
console.log(
  `Player ${player2.name} created with id ${player2.id} and ${player2.money} $`
);
console.log(
  `Player ${player3.name} created with id ${player3.id} and ${player3.money} $`
);

game.initializeGame();

function main() {
  let roundPlayers = [...game.players];
  round = new Round(game, roundPlayers, CARD_DECK_SIZE);
  round.initializeRound();
  bank = round.bank;
  console.log(`players of round: ${JSON.stringify(round.players)}`);
  let playersArray = [...round.players];
  makeYourBet(playersArray);
}

function makeYourBet(playersToBet) {
  console.log(`make your bet launched`);
  game.ui.newInfoMessage("Make your bet within 10s or click Done!");
  let undecidedPlayers = playersToBet;
  let playersToContinue = [];

  let timeCount = 0;
  game.ui.hideClass("progress", false);
  let id = setInterval(() => {
    if (playersToContinue.length === 0 && ++timeCount > 10) {
      clearInterval(id);
      game.ui.newInfoMessage("No player wants to play! Game Ended!");
      game.endGame();
      return;
    }
    game.ui.updateProgressBar(10);

    ({ undecidedPlayers, playersToContinue } = checkBets(
      undecidedPlayers,
      playersToContinue
    ));

    //Go to next stage once all players have decided or time is over
    if (undecidedPlayers.length === 0 || timeCount > 10) {
      clearInterval(id);
      playersToBet.forEach((player) => {
        if (!player.status.hasBet || !player.status.isPlaying) {
          round.endRoundPlayer(player);
        }
      });
      game.ui.hideClass("progress", true);
      game.ui.progressBarObj.value = 0;
      waitDone(playersToContinue);
    }
  }, 1000);
}

function waitDone(players) {
  console.log(`waitDone is launched with players: ${JSON.stringify(players)}`);

  //Distribute Player cards & activate buttons
  players.forEach((player) => {
    player.cards.push(round.cardDeck.getCard(), round.cardDeck.getCard());
    game.ui.disableButtonById(player, ["hit", "double"], false);
    round.drawPlayerCards(player);

    // display Split button is both cards values are the same
    if (player.cards[0].value === player.cards[1].value) {
      console.log(`split available for player${player.getId()}`);
      game.ui.hideButtonById(`player${player.getId()}-split`, false);
      game.ui.disableButtonById(player, ["split"], false);
    }
  });

  //Distribute bank cards
  bank.cards.push(round.cardDeck.getCard());
  round.drawBankCards(bank);

  game.ui.newInfoMessage("Add card or click done within 20s!");

  //Wait for players to play & launch BankPlay when all players are done or 20s past
  let timeCount = 0;
  game.ui.hideClass("progress", false);
  let playersNotDone = [...players];
  let id = setInterval(() => {
    if (++timeCount > 20) {
      clearInterval(id);
      for (let player of players) {
        player.status.isDone = true;
      }
    }
    game.ui.updateProgressBar(5);
    playersNotDone = checkPlayerDone(playersNotDone);
    if (playersNotDone.length === 0) {
      clearInterval(id);
      for (let player of players) {
        player.finalScore = player.calculateScore();
      }
      game.ui.hideClass("progress", true);
      game.ui.progressBarObj.value = 0;
      bankPlay();
    }
  }, 1000);
}

function bankPlay() {
  if (bank.calculateScore() > 16) {
    endRound(game.players);
  } else {
    let newCard = round.cardDeck.getCard();
    bank.cards.push(newCard);
    round.drawBankCards();
    console.log(`card added and total value is ${bank.getCardValue()}`);
    bankPlay();
  }
}

function endRound(players) {
  console.log(
    `Round ended, bank score is ${bank.calculateScore()}, player1 is ${
      player1.finalScore
    }, player2 is ${player2.finalScore}`
  );

  bank.score = bank.calculateScore();

  let winners = [];
  let tie = [];
  players.forEach((player) => {
    if (player.finalScore > 21) {
      return;
    }
    if (player.finalScore > bank.score || bank.score > 21) {
      console.log(`player ${player.name} has won`);
      winners.push(player);
    }
    if (player.finalScore === bank.score) {
      if (
        player.finalScore === 21 &&
        player.cards.length === 2 &&
        bank.cards.length > 2
      ) {
        console.log(`player ${player.name} has won`);
        winners.push(player);
      } else if (
        player.finalScore === 21 &&
        player.cards.length > 2 &&
        bank.cards.length === 2
      ) {
        console.log(`player ${player.name} has lost`);
      } else {
        console.log(`player ${player.name} tied`);
        tie.push(player);
      }
    }
  });
  game.ui.newInfoMessage("");
  if (winners.length === 0 && tie.length === 0) {
    game.ui.newInfoMessage(`Sorry, the bank won!`);
  } else {
    winners.forEach((player) => {
      if (player.cards.length === 2 && player.calculateScore() === 21) {
        game.ui.addInfoMessage(
          `Congratulation ${player.name}! You won ${player.bet * 1.5}$` + "\n"
        );
        player.updateMoney(+player.bet + player.bet * 1.5);
      } else {
        game.ui.addInfoMessage(
          `Congratulation ${player.name}! You won ${player.bet}$` + "\n"
        );
        player.updateMoney(+player.bet + player.bet);
      }
    });
    tie.forEach((player) => {
      game.ui.addInfoMessage(
        `${player.name}, you tied with bank, get back your bet ${player.bet}$` +
          "\n"
      );
      player.updateMoney(player.bet);
    });
  }
}

/**
 * Remove players that already have bet or are not playing
 * @param {array of players} players
 */
function checkBets(undecidedPlayers, playersToContinue) {
  undecidedPlayers.forEach((player) => {
    if (player.status.hasBet) {
      playersToContinue.push(
        undecidedPlayers.splice(undecidedPlayers.indexOf(player), 1)[0]
      );
    } else if (!player.status.isPlaying || player.status.isDone) {
      undecidedPlayers.splice(undecidedPlayers.indexOf(player), 1);
    }
  });
  return { undecidedPlayers, playersToContinue };
}

/**
 * remove players done from the array players not done
 * @param {array of players} playersNotDone
 * @returns array of players not yet done
 */
function checkPlayerDone(playersNotDone) {
  playersNotDone.forEach((player) => {
    if (player.status.isDone) {
      playersNotDone.splice(playersNotDone.indexOf(player), 1);
    }
  });
  return playersNotDone;
}

export { main, endRound, checkBets };
