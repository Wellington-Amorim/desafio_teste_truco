import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";

const NAIPES = ["♦", "♠", "♥", "♣"];
const VALORES = ["4", "5", "6", "7", "Q", "J", "K", "A", "2", "3"];
const ESCALA_APOSTAS = [1, 3, 6, 9, 12];

export function criarBaralho() {
  const baralho = [];
  for (const naipe of NAIPES) {
    for (const valor of VALORES) {
      baralho.push({
        id: `${valor}${naipe}`,
        valor,
        naipe,
        valorIdx: VALORES.indexOf(valor),
        naipeIdx: NAIPES.indexOf(naipe),
      });
    }
  }
  return baralho;
}

export function embaralhar(cartas, rng = Math.random) {
  const copia = [...cartas];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

export function obterValorManilha(vira) {
  const proximoIdx = (VALORES.indexOf(vira.valor) + 1) % VALORES.length;
  return VALORES[proximoIdx];
}

export function forcaCarta(carta, vira, coberta = false) {
  if (coberta) return -1;
  const manilhaValor = obterValorManilha(vira);
  if (carta.valor === manilhaValor) {
    return 100 + carta.naipeIdx;
  }
  return carta.valorIdx;
}

export function compararCartas(jogadaA, jogadaB, vira) {
  const fa = forcaCarta(jogadaA.carta, vira, jogadaA.coberta);
  const fb = forcaCarta(jogadaB.carta, vira, jogadaB.coberta);
  if (fa > fb) return 1;
  if (fa < fb) return -1;
  return 0;
}

export class JogoTrucoPaulista {
  constructor(rng = Math.random) {
    this.rng = rng;
    this.pontosDupla = { 0: 0, 1: 0 };
    this.vencedorPartida = null;
    this.dealer = 3;
    this.iniciarNovaMao();
  }

  duplaDe(jogador) {
    return jogador % 2;
  }

  iniciarNovaMao(baralhoCustomizado = null, viraCustomizado = null) {
    if (this.vencedorPartida !== null) {
      throw new Error("Partida já finalizada");
    }

    const baralho = baralhoCustomizado
      ? [...baralhoCustomizado]
      : embaralhar(criarBaralho(), this.rng);

    this.maosJogadores = { 0: [], 1: [], 2: [], 3: [] };
    for (let r = 0; r < 3; r++) {
      for (let j = 0; j < 4; j++) {
        this.maosJogadores[j].push(baralho.pop());
      }
    }

    this.vira = viraCustomizado || baralho.pop();
    this.dealer = (this.dealer + 1) % 4;
    this.turnoAtual = (this.dealer + 1) % 4;
    this.liderVazada = this.turnoAtual;

    this.valorMao = 1;
    this.ultimoAumentadorDupla = null;
    this.apostaPendente = null;
    this.vazadas = [];
    this.mesaAtual = [];
    this.vencedorMao = null;

    const p0 = this.pontosDupla[0];
    const p1 = this.pontosDupla[1];
    this.maoDeFerro = p0 === 11 && p1 === 11;
    this.maoDeOnzeDupla = !this.maoDeFerro && (p0 === 11 ? 0 : p1 === 11 ? 1 : null);
    this.aguardandoDecisaoMaoDeOnze = this.maoDeOnzeDupla !== null;
  }

  decidirMaoDeOnze(jogador, jogar) {
    if (!this.aguardandoDecisaoMaoDeOnze) {
      throw new Error("Não está aguardando decisão de Mão de 11");
    }
    if (this.duplaDe(jogador) !== this.maoDeOnzeDupla) {
      throw new Error("Apenas a dupla com 11 pontos pode decidir");
    }

    this.aguardandoDecisaoMaoDeOnze = false;
    if (jogar) {
      this.valorMao = 3;
    } else {
      const adversaria = this.maoDeOnzeDupla === 0 ? 1 : 0;
      this.encerrarMao(adversaria, 1);
    }
  }

  pedirAumento(jogador) {
    if (this.vencedorPartida !== null || this.vencedorMao !== null) {
      throw new Error("Mão ou partida encerrada");
    }
    if (this.aguardandoDecisaoMaoDeOnze) {
      throw new Error("Aguardando decisão da Mão de 11");
    }

    const dupla = this.duplaDe(jogador);
    const adversaria = dupla === 0 ? 1 : 0;

    if (this.maoDeFerro) {
      throw new Error("Não é permitido pedir truco na Mão de Ferro");
    }

    if (this.maoDeOnzeDupla !== null) {
      if (dupla === this.maoDeOnzeDupla) {
        this.encerrarMao(adversaria, 1);
        return;
      }
      throw new Error("Não é permitido pedir truco na Mão de 11");
    }

    if (this.apostaPendente) {
      if (this.apostaPendente.paraDupla !== dupla) {
        throw new Error("Aguardando resposta da dupla adversária");
      }
      const idxAtual = ESCALA_APOSTAS.indexOf(this.apostaPendente.proximoValor);
      if (idxAtual === -1 || idxAtual >= ESCALA_APOSTAS.length - 1) {
        throw new Error("Aposta já está no valor máximo (12)");
      }
      const valorAceitoAnterior = this.apostaPendente.proximoValor;
      const proximoValor = ESCALA_APOSTAS[idxAtual + 1];
      this.valorMao = valorAceitoAnterior;
      this.ultimoAumentadorDupla = dupla;
      this.apostaPendente = {
        paraDupla: adversaria,
        pediuDupla: dupla,
        proximoValor,
        valorSeCorrer: valorAceitoAnterior,
      };
      return;
    }

    if (jogador !== this.turnoAtual) {
      throw new Error("Não é o turno do jogador");
    }
    if (this.ultimoAumentadorDupla === dupla) {
      throw new Error("Mesma dupla não pode aumentar em sequência");
    }

    const idxAtual = ESCALA_APOSTAS.indexOf(this.valorMao);
    if (idxAtual === -1 || idxAtual >= ESCALA_APOSTAS.length - 1) {
      throw new Error("Aposta já está no valor máximo (12)");
    }

    const proximoValor = ESCALA_APOSTAS[idxAtual + 1];
    this.apostaPendente = {
      paraDupla: adversaria,
      pediuDupla: dupla,
      proximoValor,
      valorSeCorrer: this.valorMao,
    };
  }

  responderAumento(jogador, aceitar) {
    if (!this.apostaPendente) {
      throw new Error("Não há pedido de aumento pendente");
    }
    if (this.duplaDe(jogador) !== this.apostaPendente.paraDupla) {
      throw new Error("Apenas a dupla adversária pode responder ao pedido");
    }

    const { pediuDupla, proximoValor, valorSeCorrer } = this.apostaPendente;
    this.apostaPendente = null;

    if (aceitar) {
      this.valorMao = proximoValor;
      this.ultimoAumentadorDupla = pediuDupla;
    } else {
      this.encerrarMao(pediuDupla, valorSeCorrer);
    }
  }

  jogarCarta(jogador, cartaId, coberta = false) {
    if (this.vencedorPartida !== null || this.vencedorMao !== null) {
      throw new Error("Mão ou partida já encerrada");
    }
    if (this.aguardandoDecisaoMaoDeOnze) {
      throw new Error("Aguardando decisão da Mão de 11");
    }
    if (this.apostaPendente) {
      throw new Error("Responda ao pedido de aumento antes de jogar carta");
    }
    if (jogador !== this.turnoAtual) {
      throw new Error("Fora do turno do jogador");
    }
    if (coberta && this.vazadas.length === 0) {
      throw new Error("Não é permitido jogar carta coberta na 1ª vazada");
    }

    const mao = this.maosJogadores[jogador];
    const idxCarta = mao.findIndex((c) => c.id === cartaId);
    if (idxCarta === -1) {
      throw new Error("Carta não está na mão do jogador");
    }

    const [carta] = mao.splice(idxCarta, 1);
    this.mesaAtual.push({ jogador, carta, coberta });

    if (this.mesaAtual.length < 4) {
      this.turnoAtual = (this.turnoAtual + 1) % 4;
      return;
    }

    this.resolverVazada();
  }

  resolverVazada() {
    let melhor = this.mesaAtual[0];
    let empate = false;

    for (let i = 1; i < this.mesaAtual.length; i++) {
      const atual = this.mesaAtual[i];
      const cmp = compararCartas(atual, melhor, this.vira);
      if (cmp > 0) {
        melhor = atual;
        empate = false;
      } else if (cmp === 0 && !atual.coberta && !melhor.coberta) {
        empate = true;
      }
    }

    this.mesaAtual = [];

    if (empate) {
      this.vazadas.push("EMPATE");
    } else {
      this.vazadas.push(String(this.duplaDe(melhor.jogador)));
      this.liderVazada = melhor.jogador;
    }

    const vitorias0 = this.vazadas.filter((v) => v === "0").length;
    const vitorias1 = this.vazadas.filter((v) => v === "1").length;

    if (vitorias0 === 2) {
      this.encerrarMao(0, this.valorMao);
      return;
    }
    if (vitorias1 === 2) {
      this.encerrarMao(1, this.valorMao);
      return;
    }

    if (this.vazadas.length === 3) {
      const [v0, v1, v2] = this.vazadas;

      if (v2 !== "EMPATE") {
        this.encerrarMao(Number(v2), this.valorMao);
      } else if (v0 !== "EMPATE") {
        this.encerrarMao(Number(v0), this.valorMao);
      } else if (v1 !== "EMPATE") {
        this.encerrarMao(Number(v1), this.valorMao);
      } else {
        this.encerrarMao(null, 0);
      }
      return;
    }

    this.turnoAtual = this.liderVazada;
  }

  encerrarMao(vencedoraDupla, pontos) {
    this.vencedorMao = vencedoraDupla;
    if (vencedoraDupla !== null && pontos > 0) {
      this.pontosDupla[vencedoraDupla] += pontos;
      if (this.pontosDupla[vencedoraDupla] >= 12) {
        this.vencedorPartida = vencedoraDupla;
      }
    }
  }
}

const carta = (valor, naipe) => ({
  id: `${valor}${naipe}`,
  valor,
  naipe,
  valorIdx: VALORES.indexOf(valor),
  naipeIdx: NAIPES.indexOf(naipe),
});

describe("Truco Paulista - 02 Duplas", () => {
  let jogo;

  beforeEach(() => {
    jogo = new JogoTrucoPaulista();
  });

  it("CT-01: baralho contém exatamente 40 cartas sem 8, 9 ou 10", () => {
    const baralho = criarBaralho();
    assert.equal(baralho.length, 40);
    assert.ok(baralho.every((c) => !["8", "9", "10"].includes(c.valor)));
  });

  it("CT-02: distribui 12 cartas distintas aos 4 jogadores e 1 vira distinto", () => {
    const ids = new Set();
    for (let j = 0; j < 4; j++) {
      assert.equal(jogo.maosJogadores[j].length, 3);
      for (const c of jogo.maosJogadores[j]) {
        ids.add(c.id);
      }
    }
    ids.add(jogo.vira.id);
    assert.equal(ids.size, 13);
  });

  it("CT-03: manilha é o valor seguinte ao da vira com wrap-around de 3 para 4", () => {
    assert.equal(obterValorManilha(carta("7", "♦")), "Q");
    assert.equal(obterValorManilha(carta("3", "♣")), "4");
  });

  it("CT-04: hierarquia entre manilhas respeita Paus > Copas > Espadas > Ouros", () => {
    const vira = carta("6", "♦");
    const jOuros = { carta: carta("7", "♦"), coberta: false };
    const jEspadas = { carta: carta("7", "♠"), coberta: false };
    const jCopas = { carta: carta("7", "♥"), coberta: false };
    const jPaus = { carta: carta("7", "♣"), coberta: false };

    assert.equal(compararCartas(jPaus, jCopas, vira), 1);
    assert.equal(compararCartas(jCopas, jEspadas, vira), 1);
    assert.equal(compararCartas(jEspadas, jOuros, vira), 1);
  });

  it("CT-05: cartas comuns seguem 3 > 2 > A > K > J > Q > 7 > 6 > 5 > 4", () => {
    const vira = carta("6", "♦");
    const sequencia = ["3", "2", "A", "K", "J", "Q", "7", "5", "4"];
    for (let i = 0; i < sequencia.length - 1; i++) {
      const maior = { carta: carta(sequencia[i], "♦"), coberta: false };
      const menor = { carta: carta(sequencia[i + 1], "♣"), coberta: false };
      assert.equal(compararCartas(maior, menor, vira), 1);
    }
  });

  it("CT-06: manilha de ouros vence o 3 de paus", () => {
    const vira = carta("4", "♦");
    const manilhaOuros = { carta: carta("5", "♦"), coberta: false };
    const tresPaus = { carta: carta("3", "♣"), coberta: false };
    assert.equal(compararCartas(manilhaOuros, tresPaus, vira), 1);
  });

  it("CT-07: bloqueia jogada fora do turno", () => {
    const fora = (jogo.turnoAtual + 1) % 4;
    const id = jogo.maosJogadores[fora][0].id;
    assert.throws(() => jogo.jogarCarta(fora, id), /Fora do turno/);
  });

  it("CT-08: bloqueia jogada de carta que não está na mão", () => {
    assert.throws(() => jogo.jogarCarta(jogo.turnoAtual, "9♣"), /não está na mão/);
  });

  it("CT-09 e CT-14: vence mão em 2 vazadas e soma 1 ponto base", () => {
    jogo.iniciarNovaMao([], carta("4", "♦"));
    jogo.maosJogadores[0] = [carta("3", "♣"), carta("3", "♥"), carta("4", "♦")];
    jogo.maosJogadores[1] = [carta("A", "♠"), carta("A", "♥"), carta("5", "♦")];
    jogo.maosJogadores[2] = [carta("2", "♣"), carta("2", "♥"), carta("6", "♦")];
    jogo.maosJogadores[3] = [carta("K", "♠"), carta("K", "♥"), carta("7", "♦")];

    jogo.jogarCarta(0, "3♣");
    jogo.jogarCarta(1, "A♠");
    jogo.jogarCarta(2, "2♣");
    jogo.jogarCarta(3, "K♠");

    jogo.jogarCarta(0, "3♥");
    jogo.jogarCarta(1, "A♥");
    jogo.jogarCarta(2, "2♥");
    jogo.jogarCarta(3, "K♥");

    assert.equal(jogo.vencedorMao, 0);
    assert.equal(jogo.pontosDupla[0], 1);
  });

  it("CT-10: empate na 1ª vazada define vencedor da mão na 2ª vazada", () => {
    jogo.iniciarNovaMao([], carta("4", "♦"));
    jogo.maosJogadores[0] = [carta("Q", "♣"), carta("4", "♣"), carta("4", "♦")];
    jogo.maosJogadores[1] = [carta("Q", "♥"), carta("3", "♣"), carta("4", "♠")];
    jogo.maosJogadores[2] = [carta("Q", "♠"), carta("5", "♣"), carta("4", "♥")];
    jogo.maosJogadores[3] = [carta("Q", "♦"), carta("6", "♣"), carta("5", "♠")];

    jogo.jogarCarta(0, "Q♣");
    jogo.jogarCarta(1, "Q♥");
    jogo.jogarCarta(2, "Q♠");
    jogo.jogarCarta(3, "Q♦");

    jogo.jogarCarta(0, "4♣");
    jogo.jogarCarta(1, "3♣");
    jogo.jogarCarta(2, "5♣");
    jogo.jogarCarta(3, "6♣");

    assert.equal(jogo.vencedorMao, 1);
    assert.equal(jogo.pontosDupla[1], 1);
  });

  it("CT-11: empate na 2ª vazada dá a mão a quem venceu a 1ª vazada", () => {
    jogo.iniciarNovaMao([], carta("4", "♦"));
    jogo.maosJogadores[0] = [carta("3", "♣"), carta("J", "♣"), carta("4", "♦")];
    jogo.maosJogadores[1] = [carta("A", "♣"), carta("J", "♥"), carta("4", "♠")];
    jogo.maosJogadores[2] = [carta("K", "♣"), carta("J", "♠"), carta("4", "♥")];
    jogo.maosJogadores[3] = [carta("Q", "♣"), carta("J", "♦"), carta("5", "♠")];

    jogo.jogarCarta(0, "3♣");
    jogo.jogarCarta(1, "A♣");
    jogo.jogarCarta(2, "K♣");
    jogo.jogarCarta(3, "Q♣");

    jogo.jogarCarta(0, "J♣");
    jogo.jogarCarta(1, "J♥");
    jogo.jogarCarta(2, "J♠");
    jogo.jogarCarta(3, "J♦");

    assert.equal(jogo.vencedorMao, 0);
  });

  it("CT-12A: empate na 3ª vazada após vitórias alternadas favorece vencedor da 1ª", () => {
    jogo.iniciarNovaMao([], carta("4", "♦"));
    jogo.maosJogadores[0] = [carta("3", "♣"), carta("4", "♣"), carta("J", "♣")];
    jogo.maosJogadores[1] = [carta("A", "♣"), carta("3", "♥"), carta("J", "♥")];
    jogo.maosJogadores[2] = [carta("K", "♣"), carta("4", "♠"), carta("J", "♠")];
    jogo.maosJogadores[3] = [carta("Q", "♣"), carta("4", "♥"), carta("J", "♦")];

    jogo.jogarCarta(0, "3♣");
    jogo.jogarCarta(1, "A♣");
    jogo.jogarCarta(2, "K♣");
    jogo.jogarCarta(3, "Q♣");

    jogo.jogarCarta(0, "4♣");
    jogo.jogarCarta(1, "3♥");
    jogo.jogarCarta(2, "4♠");
    jogo.jogarCarta(3, "4♥");

    jogo.jogarCarta(1, "J♥");
    jogo.jogarCarta(2, "J♠");
    jogo.jogarCarta(3, "J♦");
    jogo.jogarCarta(0, "J♣");

    assert.equal(jogo.vencedorMao, 0);
  });

  it("CT-12B: empate na 1ª e 2ª vazadas define vencedor na 3ª vazada", () => {
    jogo.iniciarNovaMao([], carta("4", "♦"));
    jogo.maosJogadores[0] = [carta("A", "♣"), carta("K", "♣"), carta("4", "♣")];
    jogo.maosJogadores[1] = [carta("A", "♥"), carta("K", "♥"), carta("3", "♥")];
    jogo.maosJogadores[2] = [carta("A", "♠"), carta("K", "♠"), carta("4", "♠")];
    jogo.maosJogadores[3] = [carta("A", "♦"), carta("K", "♦"), carta("4", "♥")];

    jogo.jogarCarta(0, "A♣");
    jogo.jogarCarta(1, "A♥");
    jogo.jogarCarta(2, "A♠");
    jogo.jogarCarta(3, "A♦");

    jogo.jogarCarta(0, "K♣");
    jogo.jogarCarta(1, "K♥");
    jogo.jogarCarta(2, "K♠");
    jogo.jogarCarta(3, "K♦");

    jogo.jogarCarta(0, "4♣");
    jogo.jogarCarta(1, "3♥");
    jogo.jogarCarta(2, "4♠");
    jogo.jogarCarta(3, "4♥");

    assert.equal(jogo.vencedorMao, 1);
  });

  it("CT-12C: três empates seguidos encerram a mão sem pontuar", () => {
    jogo.iniciarNovaMao([], carta("4", "♦"));
    jogo.maosJogadores[0] = [carta("A", "♣"), carta("K", "♣"), carta("Q", "♣")];
    jogo.maosJogadores[1] = [carta("A", "♥"), carta("K", "♥"), carta("Q", "♥")];
    jogo.maosJogadores[2] = [carta("A", "♠"), carta("K", "♠"), carta("Q", "♠")];
    jogo.maosJogadores[3] = [carta("A", "♦"), carta("K", "♦"), carta("Q", "♦")];

    for (const [c0, c1, c2, c3] of [
      ["A♣", "A♥", "A♠", "A♦"],
      ["K♣", "K♥", "K♠", "K♦"],
      ["Q♣", "Q♥", "Q♠", "Q♦"],
    ]) {
      jogo.jogarCarta(0, c0);
      jogo.jogarCarta(1, c1);
      jogo.jogarCarta(2, c2);
      jogo.jogarCarta(3, c3);
    }

    assert.equal(jogo.vencedorMao, null);
    assert.equal(jogo.pontosDupla[0], 0);
    assert.equal(jogo.pontosDupla[1], 0);
  });

  it("CT-13: bloqueia carta coberta na 1ª vazada e permite na 2ª vazada com força nula", () => {
    jogo.iniciarNovaMao([], carta("4", "♦"));
    jogo.maosJogadores[0] = [carta("3", "♣"), carta("5", "♣"), carta("4", "♦")];
    jogo.maosJogadores[1] = [carta("A", "♣"), carta("4", "♣"), carta("5", "♦")];
    jogo.maosJogadores[2] = [carta("K", "♣"), carta("6", "♣"), carta("6", "♦")];
    jogo.maosJogadores[3] = [carta("Q", "♣"), carta("7", "♣"), carta("7", "♦")];

    assert.throws(() => jogo.jogarCarta(0, "3♣", true), /1ª vazada/);

    jogo.jogarCarta(0, "3♣");
    jogo.jogarCarta(1, "A♣");
    jogo.jogarCarta(2, "K♣");
    jogo.jogarCarta(3, "Q♣");

    jogo.jogarCarta(0, "5♣", true);
    jogo.jogarCarta(1, "4♣");
    jogo.jogarCarta(2, "6♣");
    jogo.jogarCarta(3, "7♣");

    assert.equal(jogo.vazadas[1], "1");
  });

  it("CT-15, CT-16, CT-17 e CT-20: escalada 1 -> 3 -> 6 -> 9 -> 12 com bloqueios", () => {
    jogo.pedirAumento(0);
    assert.throws(() => jogo.pedirAumento(2), /Aguardando resposta/);
    jogo.responderAumento(1, true);
    assert.equal(jogo.valorMao, 3);

    assert.throws(() => jogo.pedirAumento(0), /Mesma dupla/);

    jogo.pedirAumento(1);
    jogo.responderAumento(0, true);
    assert.equal(jogo.valorMao, 6);

    jogo.pedirAumento(0);
    jogo.responderAumento(1, true);
    assert.equal(jogo.valorMao, 9);

    jogo.pedirAumento(1);
    jogo.responderAumento(0, true);
    assert.equal(jogo.valorMao, 12);

    assert.throws(() => jogo.pedirAumento(0), /valor máximo/);
  });

  it("CT-18: permite contra-pedido (pedir Seis diretamente sobre o Truco)", () => {
    jogo.pedirAumento(0);
    jogo.pedirAumento(1);
    assert.equal(jogo.valorMao, 3);
    assert.equal(jogo.apostaPendente.proximoValor, 6);

    jogo.responderAumento(0, true);
    assert.equal(jogo.valorMao, 6);
  });

  it("CT-19: correr do aumento entrega pontos anteriores ao solicitante", () => {
    jogo.pedirAumento(0);
    jogo.responderAumento(1, true);
    jogo.pedirAumento(1);
    jogo.responderAumento(0, false);

    assert.equal(jogo.vencedorMao, 1);
    assert.equal(jogo.pontosDupla[1], 3);
  });

  it("CT-21 e CT-22: Mão de 11 permite jogar valendo 3 ou correr, e pune pedido de truco", () => {
    jogo.pontosDupla[0] = 11;
    jogo.iniciarNovaMao();
    assert.equal(jogo.aguardandoDecisaoMaoDeOnze, true);
    assert.throws(() => jogo.jogarCarta(jogo.turnoAtual, jogo.maosJogadores[jogo.turnoAtual][0].id), /Mão de 11/);

    jogo.decidirMaoDeOnze(0, false);
    assert.equal(jogo.vencedorMao, 1);
    assert.equal(jogo.pontosDupla[1], 1);

    jogo.iniciarNovaMao();
    jogo.decidirMaoDeOnze(2, true);
    assert.equal(jogo.valorMao, 3);

    jogo.pedirAumento(0);
    assert.equal(jogo.vencedorMao, 1);
    assert.equal(jogo.pontosDupla[1], 2);
  });

  it("CT-23: Mão de Ferro (11 x 11) inicia sem decisão prévia e bloqueia truco", () => {
    jogo.pontosDupla[0] = 11;
    jogo.pontosDupla[1] = 11;
    jogo.iniciarNovaMao();

    assert.equal(jogo.maoDeFerro, true);
    assert.equal(jogo.aguardandoDecisaoMaoDeOnze, false);
    assert.throws(() => jogo.pedirAumento(jogo.turnoAtual), /Mão de Ferro/);
  });

  it("CT-24 e CT-25: rotaciona carteador entre mãos e encerra partida ao atingir >= 12 pontos", () => {
    const dealerInicial = jogo.dealer;
    jogo.encerrarMao(0, 10);
    jogo.iniciarNovaMao();
    assert.equal(jogo.dealer, (dealerInicial + 1) % 4);
    assert.equal(jogo.turnoAtual, (jogo.dealer + 1) % 4);

    jogo.encerrarMao(0, 3);
    assert.equal(jogo.pontosDupla[0], 13);
    assert.equal(jogo.vencedorPartida, 0);
    assert.throws(() => jogo.iniciarNovaMao(), /Partida já finalizada/);
  });
});